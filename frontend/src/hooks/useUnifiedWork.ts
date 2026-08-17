// Feature 032: Unified Work Management TanStack Query Hooks
import { useMemo } from 'react'
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import type {
  WorkItemFilters,
  WorkItemCursor,
  PaginatedWorkItems,
  UserWorkSummary,
  UserProductivityMetrics,
  TeamMemberWorkload,
  WorkItemSortBy,
  SortOrder,
} from '@/types/unified-work.types'
import {
  fetchWorkItems,
  fetchUserWorkSummary,
  fetchUserProductivityMetrics,
  fetchTeamWorkload,
} from '@/services/unified-work.service'

// Query keys factory
export const unifiedWorkKeys = {
  all: ['unified-work'] as const,
  items: () => [...unifiedWorkKeys.all, 'items'] as const,
  itemsFiltered: (filters: WorkItemFilters, sortBy?: WorkItemSortBy, sortOrder?: SortOrder) =>
    [...unifiedWorkKeys.items(), { filters, sortBy, sortOrder }] as const,
  summary: () => [...unifiedWorkKeys.all, 'summary'] as const,
  metrics: () => [...unifiedWorkKeys.all, 'metrics'] as const,
  team: () => [...unifiedWorkKeys.all, 'team'] as const,
}

/**
 * Hook for infinite scrolling work items with filtering
 */
export function useUnifiedWorkItems(
  filters: WorkItemFilters = {},
  sortBy: WorkItemSortBy = 'deadline',
  sortOrder: SortOrder = 'asc',
  pageSize = 50,
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: unifiedWorkKeys.itemsFiltered(filters, sortBy, sortOrder),
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam as WorkItemCursor | undefined
      return fetchWorkItems(filters, cursor, pageSize, sortBy, sortOrder)
    },
    initialPageParam: undefined as WorkItemCursor | undefined,
    getNextPageParam: (lastPage: PaginatedWorkItems) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined
    },
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
  })
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
  })
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
  })
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
        return false
      }
      return failureCount < 3
    },
  })
}

/**
 * Hook to invalidate all unified work queries
 */
export function useInvalidateUnifiedWork() {
  const queryClient = useQueryClient()

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: unifiedWorkKeys.all })
    },
    invalidateItems: () => {
      queryClient.invalidateQueries({ queryKey: unifiedWorkKeys.items() })
    },
    invalidateSummary: () => {
      queryClient.invalidateQueries({ queryKey: unifiedWorkKeys.summary() })
    },
    invalidateMetrics: () => {
      queryClient.invalidateQueries({ queryKey: unifiedWorkKeys.metrics() })
    },
    invalidateTeam: () => {
      queryClient.invalidateQueries({ queryKey: unifiedWorkKeys.team() })
    },
  }
}

/**
 * Phase 96 · COUNT-01 (D-06) — the ACTIVE-WORK population, one definition.
 *
 * Verbatim the four-value exclusion `get_dashboard_stats.open_tasks` applies over
 * `unified_work_items` (see supabase/migrations/20260817500004_p96_dashboard_stats_truth.sql).
 * The dashboard KPI, the /my-work badge/footer/rows and the kanban board's non-Done columns all
 * count THIS population, so the surfaces agree by shared derivation rather than by coincidence.
 *
 * Why a client-side scope rather than a request filter: `get_unified_work_items` takes an IN list
 * (`p_statuses`), so filtering server-side would mean enumerating the ACTIVE vocabulary of three
 * separate lifecycles here — and a status added later would then silently drop out of the list.
 * A NOT-IN over the fetched page mirrors the DB predicate exactly and cannot under-count that way.
 *
 * -- seam (stated): `user_work_summary.total_active`, the number the "Total Active" tile renders,
 * excludes FIVE values ('completed','cancelled','resolved','closed','done') — +resolved, +done,
 * −converted. The two agree today (measured 18 = 18) and the tile keeps its own label.
 * -- seam (stated): with cursor pagination a page contributes only its own active rows, so
 * `activeItems.length` is "active work loaded so far", exactly like the rows it renders.
 */
const INACTIVE_WORK_STATUSES: ReadonlySet<string> = new Set([
  'completed',
  'cancelled',
  'closed',
  'converted',
])

/**
 * Combined hook for My Work dashboard - fetches summary and items together
 *
 * `activeItems` is the ONE result set the page renders: badge, footer total and rows all read it,
 * so no two numbers on /my-work can structurally diverge (COUNT-01).
 */
export function useMyWorkDashboard(
  filters: WorkItemFilters = {},
  sortBy: WorkItemSortBy = 'deadline',
  sortOrder: SortOrder = 'asc',
) {
  const summaryQuery = useUserWorkSummary()
  const metricsQuery = useUserProductivityMetrics()
  const itemsQuery = useUnifiedWorkItems(filters, sortBy, sortOrder)

  const activeItems = useMemo(
    () =>
      (itemsQuery.data?.pages.flatMap((page) => page.items) ?? []).filter(
        (item) => !INACTIVE_WORK_STATUSES.has(item.status),
      ),
    [itemsQuery.data],
  )

  return {
    summary: summaryQuery,
    metrics: metricsQuery,
    items: itemsQuery,
    activeItems,
    isLoading: summaryQuery.isLoading || itemsQuery.isLoading,
    isError: summaryQuery.isError || itemsQuery.isError,
    error: summaryQuery.error || itemsQuery.error,
  }
}
