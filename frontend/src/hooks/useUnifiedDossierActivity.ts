/**
 * useUnifiedDossierActivity Hook
 * Feature: 035-dossier-context
 *
 * TanStack Query useInfiniteQuery hook for fetching unified dossier activities
 * from the dossier-unified-activity Edge Function with cursor pagination.
 *
 * Aggregates activity from:
 * - Tasks, Commitments, Intakes (work items)
 * - Positions (linked via position_dossier_links)
 * - Calendar Events
 * - Relationships (incoming and outgoing)
 * - Documents (from activity_stream)
 * - Comments (on the dossier)
 */

import { useState, useCallback, useMemo } from 'react'
import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query'
import {
  fetchUnifiedDossierActivities,
  unifiedDossierActivityKeys,
} from '@/services/unified-dossier-activity.service'
import type {
  UnifiedActivity,
  UnifiedActivityFilters,
  UnifiedActivityType,
  UseUnifiedDossierActivityReturn,
} from '@/types/unified-dossier-activity.types'

// ============================================================================
// Hook Options
// ============================================================================

export interface UseUnifiedDossierActivityOptions {
  /**
   * The dossier ID to fetch activities for.
   */
  dossierId: string

  /**
   * Number of items per page.
   * @default 20
   */
  pageSize?: number

  /**
   * Initial filters to apply.
   */
  initialFilters?: UnifiedActivityFilters

  /**
   * Whether to enable the query.
   * @default true
   */
  enabled?: boolean

  /**
   * Stale time in milliseconds.
   * @default 120000 (2 minutes)
   */
  staleTime?: number

  /**
   * Garbage collection time in milliseconds.
   * @default 600000 (10 minutes)
   */
  gcTime?: number
}

// ============================================================================
// API Response Type
// ============================================================================

interface UnifiedActivityPage {
  activities: UnifiedActivity[]
  next_cursor: string | null
  has_more: boolean
  total_estimate: number | null
  filters_applied: {
    activity_types: UnifiedActivityType[] | null
    date_from: string | null
    date_to: string | null
  }
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Fetch unified activity feed for a dossier with infinite scroll pagination.
 *
 * This hook aggregates all activity related to a dossier from multiple sources:
 * tasks, commitments, intakes, positions, events, relationships, documents, and comments.
 *
 * @example
 * ```tsx
 * const {
 *   activities,
 *   isLoading,
 *   hasNextPage,
 *   fetchNextPage,
 *   isFetchingNextPage,
 *   filters,
 *   setFilters,
 *   clearFilters,
 * } = useUnifiedDossierActivity({
 *   dossierId: 'uuid-here',
 *   initialFilters: { activity_types: ['task', 'commitment'] },
 * });
 *
 * // Render activity feed
 * {activities.map(activity => (
 *   <UnifiedActivityItem key={activity.id} activity={activity} />
 * ))}
 *
 * // Load more button
 * {hasNextPage && (
 *   <Button onClick={fetchNextPage} disabled={isFetchingNextPage}>
 *     {isFetchingNextPage ? 'Loading...' : 'Load More'}
 *   </Button>
 * )}
 *
 * // Filter controls
 * <ActivityTypeFilter
 *   value={filters.activity_types}
 *   onChange={(types) => setFilters({ ...filters, activity_types: types })}
 * />
 * ```
 */
export function useUnifiedDossierActivity(
  options: UseUnifiedDossierActivityOptions,
): UseUnifiedDossierActivityReturn {
  const {
    dossierId,
    pageSize = 20,
    initialFilters = {},
    enabled = true,
    staleTime = 2 * 60 * 1000, // 2 minutes
    gcTime = 10 * 60 * 1000, // 10 minutes
  } = options

  // State for filters
  const [filters, setFiltersState] = useState<UnifiedActivityFilters>(initialFilters)

  // Memoize the query key
  const queryKey = useMemo(
    () => unifiedDossierActivityKeys.list(dossierId, filters),
    [dossierId, filters],
  )

  // TanStack Query infinite query
  const query = useInfiniteQuery<
    UnifiedActivityPage,
    Error,
    InfiniteData<UnifiedActivityPage>,
    readonly (string | UnifiedActivityFilters | undefined)[],
    string | undefined
  >({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const result = await fetchUnifiedDossierActivities({
        dossier_id: dossierId,
        cursor: pageParam,
        limit: pageSize,
        activity_types: filters.activity_types,
        date_from: filters.date_from,
        date_to: filters.date_to,
      })

      return result
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: enabled && !!dossierId,
    staleTime,
    gcTime,
  })

  // Flatten all pages into a single array
  const activities = useMemo(
    () => query.data?.pages.flatMap((page) => page.activities) ?? [],
    [query.data?.pages],
  )

  // Callback to update filters (resets pagination)
  const setFilters = useCallback((newFilters: UnifiedActivityFilters) => {
    setFiltersState(newFilters)
  }, [])

  // Callback to clear all filters
  const clearFilters = useCallback(() => {
    setFiltersState({})
  }, [])

  // Return the hook result
  return {
    activities,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    error: query.error,
    fetchNextPage: () => query.fetchNextPage(),
    refetch: () => query.refetch(),
    filters,
    setFilters,
    clearFilters,
  }
}

// ============================================================================
// Additional Utility Hooks
// ============================================================================

/**
 * Hook to filter activities by type client-side
 * Useful when you've already fetched activities but want to filter the display
 */
export function useFilteredActivities(
  activities: UnifiedActivity[],
  filterTypes?: UnifiedActivityType[],
): UnifiedActivity[] {
  return useMemo(() => {
    if (!filterTypes || filterTypes.length === 0) {
      return activities
    }
    return activities.filter((activity) => filterTypes.includes(activity.activity_type))
  }, [activities, filterTypes])
}

/**
 * Hook to group activities by date
 * Useful for rendering activities in a timeline with date headers
 */
export function useGroupedActivities(
  activities: UnifiedActivity[],
): Map<string, UnifiedActivity[]> {
  return useMemo(() => {
    const grouped = new Map<string, UnifiedActivity[]>()

    for (const activity of activities) {
      const date = new Date(activity.timestamp).toLocaleDateString('en-CA') // YYYY-MM-DD format
      const existing = grouped.get(date) || []
      existing.push(activity)
      grouped.set(date, existing)
    }

    return grouped
  }, [activities])
}

/**
 * Hook to group activities by type
 * Useful for rendering activity counts or grouped displays
 */
export function useActivitiesByType(
  activities: UnifiedActivity[],
): Record<UnifiedActivityType, UnifiedActivity[]> {
  return useMemo(() => {
    const byType: Record<UnifiedActivityType, UnifiedActivity[]> = {
      task: [],
      commitment: [],
      intake: [],
      position: [],
      event: [],
      relationship: [],
      document: [],
      comment: [],
    }

    for (const activity of activities) {
      byType[activity.activity_type].push(activity)
    }

    return byType
  }, [activities])
}

/**
 * Hook to get activity type counts
 */
export function useActivityTypeCounts(
  activities: UnifiedActivity[],
): Record<UnifiedActivityType, number> {
  return useMemo(() => {
    const counts: Record<UnifiedActivityType, number> = {
      task: 0,
      commitment: 0,
      intake: 0,
      position: 0,
      event: 0,
      relationship: 0,
      document: 0,
      comment: 0,
    }

    for (const activity of activities) {
      counts[activity.activity_type]++
    }

    return counts
  }, [activities])
}

export default useUnifiedDossierActivity
