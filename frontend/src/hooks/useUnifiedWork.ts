/**
 * Unified Work Management Hooks
 * @module hooks/useUnifiedWork
 * @feature 032-unified-work-management
 *
 * TanStack Query hooks for unified work management with:
 * - Infinite scroll pagination for work items
 * - User work summary and productivity metrics
 * - Team workload tracking for managers
 * - Optimistic updates and cache invalidation
 *
 * @description
 * This module provides React hooks for managing work items across multiple sources
 * (tasks, commitments, intake tickets) with a unified interface:
 * - Query hooks for fetching work items with cursor-based pagination
 * - Summary hooks for dashboard stats and metrics
 * - Team workload hooks for manager views
 * - Cache invalidation utilities for real-time updates
 * - Optimistic update helpers for status changes
 *
 * @example
 * // Fetch paginated work items
 * const { data, fetchNextPage, hasNextPage } = useUnifiedWorkItems({
 *   status: ['pending', 'in_progress'],
 *   assignee_id: userId,
 * });
 *
 * @example
 * // Dashboard summary
 * const { data: summary } = useUserWorkSummary();
 * // summary.total_pending, summary.total_overdue, etc.
 *
 * @example
 * // Team workload (managers)
 * const { data: teamWorkload } = useTeamWorkload();
 */

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

/**
 * Query Keys Factory for unified work queries
 *
 * @description
 * Provides a hierarchical key structure for TanStack Query cache management.
 * Keys are structured to enable granular cache invalidation.
 *
 * @example
 * // Invalidate all unified work queries
 * queryClient.invalidateQueries({ queryKey: unifiedWorkKeys.all });
 *
 * @example
 * // Invalidate only items with specific filters
 * queryClient.invalidateQueries({ queryKey: unifiedWorkKeys.itemsFiltered(filters) });
 *
 * @example
 * // Invalidate user summary
 * queryClient.invalidateQueries({ queryKey: unifiedWorkKeys.summary() });
 */
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
 * Hook to fetch work items with infinite scroll pagination
 *
 * @description
 * Fetches work items from all sources (tasks, commitments, intake tickets) with
 * cursor-based pagination for efficient infinite scrolling. Supports filtering,
 * sorting, and automatic cache management.
 *
 * @param filters - Optional filters (status, assignee, source, tracking type, etc.)
 * @param sortBy - Field to sort by ('deadline', 'created_at', 'priority', etc.)
 * @param sortOrder - Sort direction ('asc' or 'desc')
 * @param pageSize - Number of items per page (default: 50)
 * @param enabled - Whether to enable the query (default: true)
 * @returns TanStack Infinite Query result with paginated data
 *
 * @example
 * // Basic usage
 * const { data, fetchNextPage, hasNextPage } = useUnifiedWorkItems();
 *
 * @example
 * // With filters and sorting
 * const { data } = useUnifiedWorkItems(
 *   { status: ['pending'], source: ['task'] },
 *   'deadline',
 *   'asc'
 * );
 *
 * @example
 * // Load more on scroll
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useUnifiedWorkItems();
 * // Call fetchNextPage() when reaching bottom
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
 * Hook to fetch user work summary statistics
 *
 * @description
 * Fetches aggregated statistics for the current user's work items, including
 * counts by status, overdue items, and completion rates. Used for dashboard headers.
 *
 * @param enabled - Whether to enable the query (default: true)
 * @returns TanStack Query result with UserWorkSummary data
 *
 * @example
 * // Dashboard header
 * const { data: summary } = useUserWorkSummary();
 * // summary.total_pending, summary.total_overdue, summary.total_completed
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
 * Hook to fetch user productivity metrics
 *
 * @description
 * Fetches productivity analytics for the current user, including completion rates,
 * average time to complete, on-time delivery percentage, and trend data.
 *
 * @param enabled - Whether to enable the query (default: true)
 * @returns TanStack Query result with UserProductivityMetrics data
 *
 * @example
 * // Productivity dashboard
 * const { data: metrics } = useUserProductivityMetrics();
 * // metrics.completion_rate, metrics.avg_completion_time, metrics.on_time_percentage
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
 * Hook to fetch team workload data (managers only)
 *
 * @description
 * Fetches workload statistics for all team members reporting to the current user.
 * Only available to users with manager permissions. Includes automatic retry logic
 * that skips authorization errors.
 *
 * @param enabled - Whether to enable the query (default: true)
 * @returns TanStack Query result with TeamMemberWorkload array
 *
 * @example
 * // Manager dashboard
 * const { data: teamWorkload } = useTeamWorkload();
 * // teamWorkload[].member_name, teamWorkload[].total_assigned, workload[].overdue_count
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
 * Hook to invalidate unified work queries
 *
 * @description
 * Provides utility functions to invalidate specific or all unified work queries.
 * Used after mutations or when forcing a data refresh. Returns an object with
 * granular invalidation methods.
 *
 * @returns Object with invalidation methods
 *
 * @example
 * // After creating a work item
 * const { invalidateAll } = useInvalidateUnifiedWork();
 * createWorkItem(data).then(() => invalidateAll());
 *
 * @example
 * // Selective invalidation
 * const { invalidateSummary, invalidateItems } = useInvalidateUnifiedWork();
 * updateWorkItem(id, data).then(() => {
 *   invalidateSummary();
 *   invalidateItems();
 * });
 */
export function useInvalidateUnifiedWork() {
  const queryClient = useQueryClient();

  return {
    /** Invalidate all unified work queries */
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: unifiedWorkKeys.all });
    },
    /** Invalidate only work item list queries */
    invalidateItems: () => {
      queryClient.invalidateQueries({ queryKey: unifiedWorkKeys.items() });
    },
    /** Invalidate only user work summary */
    invalidateSummary: () => {
      queryClient.invalidateQueries({ queryKey: unifiedWorkKeys.summary() });
    },
    /** Invalidate only productivity metrics */
    invalidateMetrics: () => {
      queryClient.invalidateQueries({ queryKey: unifiedWorkKeys.metrics() });
    },
    /** Invalidate only team workload data */
    invalidateTeam: () => {
      queryClient.invalidateQueries({ queryKey: unifiedWorkKeys.team() });
    },
  };
}

/**
 * Hook for optimistic updates to work items
 *
 * @description
 * Provides utilities for optimistically updating work items in the cache before
 * server confirmation. Updates all cached pages that might contain the item.
 * Use this for immediate UI feedback on status changes, assignments, etc.
 *
 * @returns Object with optimistic update methods
 *
 * @example
 * // Optimistic status update
 * const { updateItem } = useOptimisticWorkItemUpdate();
 * const { mutate } = useUpdateWorkItemStatus();
 * mutate(
 *   { itemId, status: 'completed' },
 *   {
 *     onMutate: () => updateItem(itemId, { status: 'completed' }),
 *     onError: () => queryClient.invalidateQueries(unifiedWorkKeys.items())
 *   }
 * );
 *
 * @example
 * // Optimistic deletion
 * const { removeItem } = useOptimisticWorkItemUpdate();
 * deleteWorkItem(itemId, {
 *   onMutate: () => removeItem(itemId)
 * });
 */
export function useOptimisticWorkItemUpdate() {
  const queryClient = useQueryClient();

  return {
    /**
     * Optimistically update a work item in all cached pages
     * @param itemId - ID of the work item to update
     * @param updates - Partial updates to apply
     */
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
    /**
     * Optimistically remove a work item from all cached pages
     * @param itemId - ID of the work item to remove
     */
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
 * Hook to fetch all data for My Work dashboard
 *
 * @description
 * Convenience hook that combines summary, metrics, and work items queries
 * for the "My Work" dashboard view. Automatically manages loading and error
 * states across all queries.
 *
 * @param filters - Optional filters for work items
 * @param sortBy - Field to sort by ('deadline', 'created_at', etc.)
 * @param sortOrder - Sort direction ('asc' or 'desc')
 * @returns Combined query results with loading and error states
 *
 * @example
 * // Dashboard page
 * const {
 *   summary,
 *   metrics,
 *   items,
 *   isLoading,
 *   isError
 * } = useMyWorkDashboard({ status: ['pending'] });
 *
 * if (isLoading) return <Spinner />;
 * if (isError) return <Error />;
 *
 * return (
 *   <>
 *     <DashboardHeader summary={summary.data} metrics={metrics.data} />
 *     <WorkItemsList items={items.data} />
 *   </>
 * );
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
