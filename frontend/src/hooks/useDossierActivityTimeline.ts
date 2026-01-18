/**
 * useDossierActivityTimeline Hook
 * Feature: 035-dossier-context (Smart Dossier Context Inheritance)
 * Task: T026
 *
 * TanStack Query useInfiniteQuery hook for fetching dossier activity timeline
 * from the dossier-activity-timeline Edge Function with cursor pagination.
 */

import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { WorkItemType } from '@/types/dossier-context.types'
import { workItemDossierKeys } from './useCreateWorkItemDossierLinks'

// ============================================================================
// API Types
// ============================================================================

export interface TimelineActivity {
  id: string
  work_item_id: string
  work_item_type: WorkItemType
  dossier_id: string
  activity_title: string
  status: string
  priority: string
  assignee_id: string | null
  due_date: string | null
  sla_deadline: string | null
  is_overdue: boolean
  created_at: string
  updated_at: string
  inheritance_source: string
  inherited_from_type: string | null
  inherited_from_id: string | null
}

export interface TimelineFilters {
  work_item_types?: WorkItemType[]
  status?: string[]
  priority?: string[]
  overdue_only?: boolean
}

export interface DossierActivityTimelineResponse {
  activities: TimelineActivity[]
  next_cursor: string | null
  has_more: boolean
  total_count: number
}

interface TimelineRequest {
  dossier_id: string
  cursor?: string
  limit?: number
  filters?: TimelineFilters
}

// ============================================================================
// API Call
// ============================================================================

async function fetchDossierActivityTimeline(
  request: TimelineRequest,
): Promise<DossierActivityTimelineResponse> {
  // Build query parameters for GET request
  const params = new URLSearchParams()
  params.set('dossier_id', request.dossier_id)

  if (request.cursor) {
    params.set('cursor', request.cursor)
  }

  params.set('limit', String(request.limit ?? 20))

  // Add filters as query params
  if (request.filters?.work_item_types?.length) {
    params.set('work_item_type', request.filters.work_item_types[0])
  }
  if (request.filters?.overdue_only) {
    params.set('overdue_only', 'true')
  }

  const { data, error } = await supabase.functions.invoke<DossierActivityTimelineResponse>(
    `dossier-activity-timeline?${params.toString()}`,
    {
      method: 'GET',
    },
  )

  if (error) {
    console.error('Error fetching dossier activity timeline:', error)
    throw new Error(error.message || 'Failed to fetch activity timeline')
  }

  if (!data) {
    throw new Error('No data returned from dossier-activity-timeline')
  }

  return data
}

// ============================================================================
// Hook Options
// ============================================================================

export interface UseDossierActivityTimelineOptions {
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
   * Filters to apply to the timeline.
   */
  filters?: TimelineFilters
  /**
   * Whether to enable the query.
   * @default true
   */
  enabled?: boolean
}

// ============================================================================
// Hook Return Type
// ============================================================================

export interface UseDossierActivityTimelineReturn {
  activities: TimelineActivity[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
  refetch: () => void
  totalCount: number
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Fetch activity timeline for a dossier with infinite scroll pagination.
 *
 * @example
 * ```tsx
 * const {
 *   activities,
 *   isLoading,
 *   hasNextPage,
 *   fetchNextPage,
 *   isFetchingNextPage,
 * } = useDossierActivityTimeline({
 *   dossierId: 'uuid',
 *   filters: { work_item_types: ['task', 'commitment'] },
 * });
 *
 * // Render timeline
 * {activities.map(activity => (
 *   <ActivityTimelineItem key={activity.id} activity={activity} />
 * ))}
 *
 * // Load more button
 * {hasNextPage && (
 *   <Button onClick={fetchNextPage} disabled={isFetchingNextPage}>
 *     {isFetchingNextPage ? 'Loading...' : 'Load More'}
 *   </Button>
 * )}
 * ```
 */
export function useDossierActivityTimeline(
  options: UseDossierActivityTimelineOptions,
): UseDossierActivityTimelineReturn {
  const { dossierId, pageSize = 20, filters, enabled = true } = options

  const query = useInfiniteQuery<
    DossierActivityTimelineResponse,
    Error,
    InfiniteData<DossierActivityTimelineResponse>,
    readonly string[],
    string | undefined
  >({
    queryKey: [...workItemDossierKeys.timeline(dossierId), JSON.stringify(filters)] as const,
    queryFn: ({ pageParam }) =>
      fetchDossierActivityTimeline({
        dossier_id: dossierId,
        cursor: pageParam,
        limit: pageSize,
        filters,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: enabled && !!dossierId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Flatten all pages into a single array
  const activities = query.data?.pages.flatMap((page) => page.activities) ?? []

  // Get total count from first page
  const totalCount = query.data?.pages[0]?.total_count ?? 0

  return {
    activities,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: () => query.fetchNextPage(),
    refetch: () => query.refetch(),
    totalCount,
  }
}

export default useDossierActivityTimeline
