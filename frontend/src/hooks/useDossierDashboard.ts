/**
 * Dossier Dashboard Hooks
 * @module hooks/useDossierDashboard
 * @feature dossier-centric-dashboard-redesign
 *
 * TanStack Query hooks for fetching dossier-centric dashboard data with
 * infinite scroll pagination, automatic caching, and realtime subscriptions.
 *
 * @description
 * This module provides hooks for the dossier-centric dashboard including:
 * - My Dossiers: Dossiers the current user owns or contributes to
 * - Recent Activity: Activity feed across user's dossiers with infinite scroll
 * - Pending Work: Work items grouped by dossier
 * - Dashboard Summary: Aggregated statistics for the dashboard
 * - Combined Hook: Fetch all dashboard data in one call
 * - Cache Invalidation: Utilities for refreshing dashboard queries
 *
 * Cache behavior:
 * - staleTime: 30 seconds for most queries, 1 minute for summary
 * - gcTime: 5-10 minutes depending on query type
 * - Automatic refetch on window focus
 *
 * @example
 * // Fetch all dashboard data
 * const {
 *   summary,
 *   myDossiers,
 *   recentActivity,
 *   pendingWork,
 *   isLoading,
 * } = useDossierDashboard();
 *
 * @example
 * // Fetch specific data with filters
 * const { data } = useMyDossiers({
 *   role: 'owner',
 *   limit: 10,
 * });
 *
 * @example
 * // Infinite scroll for activity feed
 * const {
 *   data,
 *   hasNextPage,
 *   fetchNextPage,
 *   isFetchingNextPage,
 * } = useRecentDossierActivity({
 *   dossier_type: 'country',
 * });
 */

import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import type {
  MyDossiersResponse,
  MyDossiersFilters,
  RecentDossierActivityResponse,
  RecentActivityFilters,
  PendingWorkByDossierResponse,
  PendingWorkFilters,
  DossierDashboardSummary,
} from '@/types/dossier-dashboard.types'
import {
  fetchMyDossiers,
  fetchRecentDossierActivity,
  fetchPendingWorkByDossier,
  fetchDossierDashboardSummary,
} from '@/services/dossier-dashboard.service'

// =============================================================================
// Query Keys
// =============================================================================

/**
 * Query Keys Factory for dossier dashboard queries
 *
 * @description
 * Provides hierarchical cache keys for TanStack Query. Keys are structured
 * to enable granular cache invalidation at different levels.
 *
 * @example
 * // Invalidate all dashboard queries
 * queryClient.invalidateQueries({ queryKey: dossierDashboardKeys.all });
 *
 * @example
 * // Invalidate only my dossiers
 * queryClient.invalidateQueries({ queryKey: dossierDashboardKeys.myDossiers() });
 */
export const dossierDashboardKeys = {
  all: ['dossier-dashboard'] as const,
  myDossiers: () => [...dossierDashboardKeys.all, 'my-dossiers'] as const,
  myDossiersFiltered: (filters?: MyDossiersFilters) =>
    [...dossierDashboardKeys.myDossiers(), { filters }] as const,
  recentActivity: () => [...dossierDashboardKeys.all, 'recent-activity'] as const,
  recentActivityFiltered: (filters?: RecentActivityFilters) =>
    [...dossierDashboardKeys.recentActivity(), { filters }] as const,
  pendingWork: () => [...dossierDashboardKeys.all, 'pending-work'] as const,
  pendingWorkFiltered: (filters?: PendingWorkFilters) =>
    [...dossierDashboardKeys.pendingWork(), { filters }] as const,
  summary: () => [...dossierDashboardKeys.all, 'summary'] as const,
}

// =============================================================================
// useMyDossiers Hook
// =============================================================================

/**
 * Hook to fetch dossiers the current user owns or contributes to
 *
 * @description
 * Fetches a filtered list of dossiers where the current user is the owner
 * or a contributor. Useful for showing "My Dossiers" sections on dashboards.
 *
 * Cache behavior:
 * - staleTime: 30 seconds
 * - gcTime: 5 minutes
 * - Automatic refetch on window focus
 *
 * @param filters - Optional filters for role, type, status, and pagination
 * @param filters.role - Filter by user's role ('owner', 'contributor', or both)
 * @param filters.dossier_type - Filter by dossier type
 * @param filters.status - Filter by dossier status
 * @param filters.limit - Number of results to return
 * @param options - Query options including enabled flag
 * @returns TanStack Query result with MyDossiersResponse
 *
 * @example
 * // Fetch all my dossiers
 * const { data, isLoading } = useMyDossiers();
 *
 * @example
 * // Fetch only dossiers I own
 * const { data } = useMyDossiers({ role: 'owner', limit: 5 });
 *
 * @example
 * // Conditional fetching
 * const { data } = useMyDossiers(filters, { enabled: isAuthenticated });
 */
export function useMyDossiers(filters?: MyDossiersFilters, options?: { enabled?: boolean }) {
  return useQuery<MyDossiersResponse, Error>({
    queryKey: dossierDashboardKeys.myDossiersFiltered(filters),
    queryFn: () => fetchMyDossiers(filters),
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  })
}

// =============================================================================
// useRecentDossierActivity Hook
// =============================================================================

/**
 * Hook to fetch recent activity across user's dossiers with infinite scroll
 *
 * @description
 * Fetches a paginated activity feed across all dossiers the user has access to.
 * Implements infinite scroll using TanStack Query's useInfiniteQuery with
 * cursor-based pagination for optimal performance.
 *
 * Cache behavior:
 * - staleTime: 30 seconds
 * - gcTime: 5 minutes
 *
 * @param filters - Optional filters for activity type, dossier type, and date range
 * @param filters.activity_type - Filter by activity type ('engagement', 'document', etc.)
 * @param filters.dossier_type - Filter by dossier type
 * @param filters.date_from - Filter activities from this date
 * @param filters.date_to - Filter activities up to this date
 * @param options - Query options including enabled flag and page size
 * @param options.pageSize - Number of items per page (default: 20)
 * @returns TanStack Infinite Query result with RecentDossierActivityResponse pages
 *
 * @example
 * // Basic usage with infinite scroll
 * const {
 *   data,
 *   hasNextPage,
 *   fetchNextPage,
 *   isFetchingNextPage,
 * } = useRecentDossierActivity();
 *
 * // Render with infinite scroll
 * {data?.pages.flatMap(page => page.activities).map(activity => (
 *   <ActivityItem key={activity.id} activity={activity} />
 * ))}
 *
 * @example
 * // With filters
 * const { data } = useRecentDossierActivity({
 *   activity_type: 'engagement',
 *   dossier_type: 'country',
 * }, { pageSize: 10 });
 */
export function useRecentDossierActivity(
  filters?: RecentActivityFilters,
  options?: { enabled?: boolean; pageSize?: number },
) {
  const pageSize = options?.pageSize ?? 20

  return useInfiniteQuery<RecentDossierActivityResponse, Error>({
    queryKey: dossierDashboardKeys.recentActivityFiltered(filters),
    queryFn: async ({ pageParam }) => {
      return fetchRecentDossierActivity({
        ...filters,
        cursor: pageParam as string | undefined,
        limit: pageSize,
      })
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.has_more ? lastPage.next_cursor : undefined
    },
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to fetch recent activity without infinite scroll (for dashboard cards)
 *
 * @description
 * Fetches a single page of recent activity suitable for dashboard cards and
 * preview widgets. Unlike useRecentDossierActivity, this returns a simple query
 * result without pagination support.
 *
 * Cache behavior:
 * - staleTime: 30 seconds
 * - gcTime: 5 minutes
 * - Automatic refetch on window focus
 *
 * @param filters - Optional filters for activity type and limit
 * @param filters.limit - Maximum number of activities to return
 * @param options - Query options including enabled flag
 * @returns TanStack Query result with RecentDossierActivityResponse
 *
 * @example
 * // For dashboard preview
 * const { data, isLoading } = useRecentDossierActivitySimple({ limit: 5 });
 *
 * @example
 * // Access activities directly
 * const { data } = useRecentDossierActivitySimple({ limit: 10 });
 * const activities = data?.activities || [];
 */
export function useRecentDossierActivitySimple(
  filters?: RecentActivityFilters,
  options?: { enabled?: boolean },
) {
  return useQuery<RecentDossierActivityResponse, Error>({
    queryKey: [...dossierDashboardKeys.recentActivityFiltered(filters), 'simple'] as const,
    queryFn: () => fetchRecentDossierActivity(filters),
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  })
}

// =============================================================================
// usePendingWorkByDossier Hook
// =============================================================================

/**
 * Hook to fetch pending work items grouped by dossier
 *
 * @description
 * Fetches work items (tasks, commitments, intake requests) that are pending
 * completion, grouped by their associated dossiers. Useful for displaying
 * workload distribution across dossiers.
 *
 * Cache behavior:
 * - staleTime: 30 seconds
 * - gcTime: 5 minutes
 * - Automatic refetch on window focus
 *
 * @param filters - Optional filters for work item type, priority, and limit
 * @param filters.work_item_type - Filter by type ('task', 'commitment', 'intake')
 * @param filters.priority - Filter by priority ('low', 'medium', 'high', 'urgent')
 * @param filters.assignee_id - Filter by assignee UUID
 * @param filters.limit - Maximum number of dossiers to return
 * @param options - Query options including enabled flag
 * @returns TanStack Query result with PendingWorkByDossierResponse
 *
 * @example
 * // Fetch all pending work
 * const { data, isLoading } = usePendingWorkByDossier();
 *
 * @example
 * // With filters
 * const { data } = usePendingWorkByDossier({
 *   work_item_type: 'task',
 *   priority: 'urgent',
 *   limit: 5,
 * });
 *
 * @example
 * // Access grouped work items
 * const { data } = usePendingWorkByDossier();
 * data?.dossiers.forEach(dossier => {
 *   console.log(`${dossier.name}: ${dossier.pending_count} items`);
 * });
 */
export function usePendingWorkByDossier(
  filters?: PendingWorkFilters,
  options?: { enabled?: boolean },
) {
  return useQuery<PendingWorkByDossierResponse, Error>({
    queryKey: dossierDashboardKeys.pendingWorkFiltered(filters),
    queryFn: () => fetchPendingWorkByDossier(filters),
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  })
}

// =============================================================================
// useDossierDashboardSummary Hook
// =============================================================================

/**
 * Hook to fetch overall dashboard summary statistics
 *
 * @description
 * Fetches aggregated statistics for the entire dashboard including total counts
 * for dossiers, pending work, recent activity, and other metrics. Summary data
 * is cached longer than detail queries since it changes less frequently.
 *
 * Cache behavior:
 * - staleTime: 1 minute
 * - gcTime: 10 minutes
 * - Automatic refetch on window focus
 *
 * @param options - Query options including enabled flag
 * @returns TanStack Query result with DossierDashboardSummary
 *
 * @example
 * // Fetch dashboard summary
 * const { data, isLoading } = useDossierDashboardSummary();
 *
 * @example
 * // Access summary stats
 * const { data } = useDossierDashboardSummary();
 * console.log(`Total dossiers: ${data?.total_dossiers}`);
 * console.log(`Pending work: ${data?.total_pending_work}`);
 */
export function useDossierDashboardSummary(options?: { enabled?: boolean }) {
  return useQuery<DossierDashboardSummary, Error>({
    queryKey: dossierDashboardKeys.summary(),
    queryFn: fetchDossierDashboardSummary,
    enabled: options?.enabled ?? true,
    staleTime: 60 * 1000, // 1 minute (summary changes less frequently)
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
  })
}

// =============================================================================
// useDossierDashboard Combined Hook
// =============================================================================

/**
 * Combined hook to fetch all dashboard data in a single call
 *
 * @description
 * Convenience hook that combines all dashboard queries (summary, my dossiers,
 * recent activity, pending work) into a single hook. All queries run in parallel
 * for optimal performance. Returns aggregated loading and error states.
 *
 * This hook is ideal for the initial dashboard load. Each query can be filtered
 * independently via the options object.
 *
 * @param options - Combined options for all dashboard queries
 * @param options.myDossiersFilters - Filters for my dossiers query
 * @param options.recentActivityFilters - Filters for recent activity query
 * @param options.pendingWorkFilters - Filters for pending work query
 * @param options.enabled - Enable/disable all queries
 * @returns Object with all query results and aggregated states
 *
 * @example
 * // Fetch all dashboard data
 * const {
 *   summary,
 *   myDossiers,
 *   recentActivity,
 *   pendingWork,
 *   isLoading,
 *   isError,
 * } = useDossierDashboard();
 *
 * @example
 * // With filters
 * const dashboard = useDossierDashboard({
 *   myDossiersFilters: { role: 'owner' },
 *   recentActivityFilters: { limit: 10 },
 *   pendingWorkFilters: { priority: 'urgent' },
 * });
 *
 * @example
 * // Access individual queries
 * const { summary, myDossiers } = useDossierDashboard();
 * if (summary.data) {
 *   console.log(`Total: ${summary.data.total_dossiers}`);
 * }
 */
export function useDossierDashboard(options?: {
  myDossiersFilters?: MyDossiersFilters
  recentActivityFilters?: RecentActivityFilters
  pendingWorkFilters?: PendingWorkFilters
  enabled?: boolean
}) {
  const enabled = options?.enabled ?? true

  const summary = useDossierDashboardSummary({ enabled })
  const myDossiers = useMyDossiers({ ...options?.myDossiersFilters, limit: 6 }, { enabled })
  const recentActivity = useRecentDossierActivitySimple(
    { ...options?.recentActivityFilters, limit: 10 },
    { enabled },
  )
  const pendingWork = usePendingWorkByDossier(
    { ...options?.pendingWorkFilters, limit: 5 },
    { enabled },
  )

  return {
    summary,
    myDossiers,
    recentActivity,
    pendingWork,
    isLoading:
      summary.isLoading ||
      myDossiers.isLoading ||
      recentActivity.isLoading ||
      pendingWork.isLoading,
    isError: summary.isError || myDossiers.isError || recentActivity.isError || pendingWork.isError,
    error: summary.error || myDossiers.error || recentActivity.error || pendingWork.error,
  }
}

// =============================================================================
// useInvalidateDossierDashboard Hook
// =============================================================================

/**
 * Hook to invalidate dossier dashboard queries
 *
 * @description
 * Provides utility functions to invalidate specific dashboard queries or all
 * dashboard queries at once. Useful for triggering refetches after mutations
 * that affect dashboard data.
 *
 * @returns Object with invalidation functions for each query type
 *
 * @example
 * // In a mutation hook
 * const { invalidateAll } = useInvalidateDossierDashboard();
 * const mutation = useMutation({
 *   onSuccess: () => {
 *     invalidateAll();
 *   },
 * });
 *
 * @example
 * // Selectively invalidate
 * const { invalidateMyDossiers, invalidatePendingWork } = useInvalidateDossierDashboard();
 * await createWorkItem();
 * invalidatePendingWork();
 *
 * @example
 * // After creating a dossier
 * const { invalidateMyDossiers, invalidateSummary } = useInvalidateDossierDashboard();
 * await createDossier(data);
 * invalidateMyDossiers();
 * invalidateSummary();
 */
export function useInvalidateDossierDashboard() {
  const queryClient = useQueryClient()

  return {
    /** Invalidate all dashboard queries */
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: dossierDashboardKeys.all })
    },
    /** Invalidate only my dossiers queries */
    invalidateMyDossiers: () => {
      queryClient.invalidateQueries({ queryKey: dossierDashboardKeys.myDossiers() })
    },
    /** Invalidate only recent activity queries */
    invalidateRecentActivity: () => {
      queryClient.invalidateQueries({ queryKey: dossierDashboardKeys.recentActivity() })
    },
    /** Invalidate only pending work queries */
    invalidatePendingWork: () => {
      queryClient.invalidateQueries({ queryKey: dossierDashboardKeys.pendingWork() })
    },
    /** Invalidate only summary queries */
    invalidateSummary: () => {
      queryClient.invalidateQueries({ queryKey: dossierDashboardKeys.summary() })
    },
  }
}
