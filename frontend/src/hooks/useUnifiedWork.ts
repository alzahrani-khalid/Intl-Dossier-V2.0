// Feature 032: Unified Work Management TanStack Query Hooks
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  WorkItemFilters,
  WorkItemCursor,
  PaginatedWorkItems,
  UserWorkSummary,
  UserProductivityMetrics,
  TeamMemberWorkload,
  WorkItemSortBy,
  SortOrder,
  UnifiedWorkItem,
} from '@/types/unified-work.types';
import {
  fetchWorkItems,
  fetchUserWorkSummary,
  fetchUserProductivityMetrics,
  fetchTeamWorkload,
} from '@/services/unified-work.service';

// Query keys factory
export const unifiedWorkKeys = {
  all: ['unified-work'] as const,
  items: () => [...unifiedWorkKeys.all, 'items'] as const,
  itemsFiltered: (filters: WorkItemFilters, sortBy?: WorkItemSortBy, sortOrder?: SortOrder) =>
    [...unifiedWorkKeys.items(), { filters, sortBy, sortOrder }] as const,
  summary: () => [...unifiedWorkKeys.all, 'summary'] as const,
  metrics: () => [...unifiedWorkKeys.all, 'metrics'] as const,
  team: () => [...unifiedWorkKeys.all, 'team'] as const,
};

/**
 * Hook for infinite scrolling work items with filtering
 */
export function useUnifiedWorkItems(
  filters: WorkItemFilters = {},
  sortBy: WorkItemSortBy = 'deadline',
  sortOrder: SortOrder = 'asc',
  pageSize = 50,
  enabled = true
) {
  return useInfiniteQuery({
    queryKey: unifiedWorkKeys.itemsFiltered(filters, sortBy, sortOrder),
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam as WorkItemCursor | undefined;
      return fetchWorkItems(filters, cursor, pageSize, sortBy, sortOrder);
    },
    initialPageParam: undefined as WorkItemCursor | undefined,
    getNextPageParam: (lastPage: PaginatedWorkItems) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
  });
}

/**
 * Hook for user work summary (dashboard header stats)
 */
export function useUserWorkSummary(enabled = true) {
  return useQuery<UserWorkSummary>({
    queryKey: unifiedWorkKeys.summary(),
    queryFn: fetchUserWorkSummary,
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook for user productivity metrics
 */
export function useUserProductivityMetrics(enabled = true) {
  return useQuery<UserProductivityMetrics>({
    queryKey: unifiedWorkKeys.metrics(),
    queryFn: fetchUserProductivityMetrics,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes (metrics change less frequently)
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook for team workload (managers only)
 */
export function useTeamWorkload(enabled = true) {
  return useQuery<TeamMemberWorkload[]>({
    queryKey: unifiedWorkKeys.team(),
    queryFn: fetchTeamWorkload,
    enabled,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on authorization errors
      if (error instanceof Error && error.message.includes('Forbidden')) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Hook to invalidate all unified work queries
 */
export function useInvalidateUnifiedWork() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: unifiedWorkKeys.all });
    },
    invalidateItems: () => {
      queryClient.invalidateQueries({ queryKey: unifiedWorkKeys.items() });
    },
    invalidateSummary: () => {
      queryClient.invalidateQueries({ queryKey: unifiedWorkKeys.summary() });
    },
    invalidateMetrics: () => {
      queryClient.invalidateQueries({ queryKey: unifiedWorkKeys.metrics() });
    },
    invalidateTeam: () => {
      queryClient.invalidateQueries({ queryKey: unifiedWorkKeys.team() });
    },
  };
}

/**
 * Optimistic update helper for work item status changes
 */
export function useOptimisticWorkItemUpdate() {
  const queryClient = useQueryClient();

  return {
    updateItem: (itemId: string, updates: Partial<UnifiedWorkItem>) => {
      // Update all cached pages that might contain this item
      queryClient.setQueriesData(
        { queryKey: unifiedWorkKeys.items() },
        (oldData: { pages: PaginatedWorkItems[] } | undefined) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.id === itemId ? { ...item, ...updates } : item
              ),
            })),
          };
        }
      );
    },
    removeItem: (itemId: string) => {
      queryClient.setQueriesData(
        { queryKey: unifiedWorkKeys.items() },
        (oldData: { pages: PaginatedWorkItems[] } | undefined) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              items: page.items.filter((item) => item.id !== itemId),
            })),
          };
        }
      );
    },
  };
}

/**
 * Combined hook for My Work dashboard - fetches summary and items together
 */
export function useMyWorkDashboard(
  filters: WorkItemFilters = {},
  sortBy: WorkItemSortBy = 'deadline',
  sortOrder: SortOrder = 'asc'
) {
  const summaryQuery = useUserWorkSummary();
  const metricsQuery = useUserProductivityMetrics();
  const itemsQuery = useUnifiedWorkItems(filters, sortBy, sortOrder);

  return {
    summary: summaryQuery,
    metrics: metricsQuery,
    items: itemsQuery,
    isLoading: summaryQuery.isLoading || itemsQuery.isLoading,
    isError: summaryQuery.isError || itemsQuery.isError,
    error: summaryQuery.error || itemsQuery.error,
  };
}
