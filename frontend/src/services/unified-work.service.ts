// Feature 032: Unified Work Management Service
import { supabase } from '@/lib/supabase'
import type {
  UserWorkSummary,
  UserProductivityMetrics,
  TeamMemberWorkload,
  WorkItemFilters,
  WorkItemCursor,
  PaginatedWorkItems,
  WorkItemSortBy,
  SortOrder,
} from '@/types/unified-work.types'

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unified-work-list`

/**
 * Build query string from filters
 */
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        searchParams.set(key, value.join(','))
      } else {
        searchParams.set(key, String(value))
      }
    }
  })

  return searchParams.toString()
}

/**
 * Get auth headers for Edge Function calls
 */
async function getAuthHeaders(): Promise<Headers> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const headers = new Headers({
    'Content-Type': 'application/json',
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  })

  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }

  return headers
}

/**
 * Fetch paginated work items with filters
 */
export async function fetchWorkItems(
  filters: WorkItemFilters = {},
  cursor?: WorkItemCursor,
  limit = 50,
  sortBy: WorkItemSortBy = 'deadline',
  sortOrder: SortOrder = 'asc',
): Promise<PaginatedWorkItems> {
  const queryParams = buildQueryString({
    endpoint: 'list',
    sources: filters.sources,
    trackingTypes: filters.trackingTypes,
    statuses: filters.statuses,
    priorities: filters.priorities,
    isOverdue: filters.isOverdue,
    dossierId: filters.dossierId,
    search: filters.searchQuery,
    assigneeId: filters.assigneeId,
    cursorDeadline: cursor?.deadline,
    cursorId: cursor?.id,
    limit,
    sortBy,
    sortOrder,
  })

  const headers = await getAuthHeaders()
  const response = await fetch(`${EDGE_FUNCTION_URL}?${queryParams}`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch work items')
  }

  return response.json()
}

/**
 * Fetch user work summary for dashboard header
 */
export async function fetchUserWorkSummary(): Promise<UserWorkSummary> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${EDGE_FUNCTION_URL}?endpoint=summary`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch work summary')
  }

  return response.json()
}

/**
 * Fetch user productivity metrics
 */
export async function fetchUserProductivityMetrics(): Promise<UserProductivityMetrics> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${EDGE_FUNCTION_URL}?endpoint=metrics`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch productivity metrics')
  }

  return response.json()
}

/**
 * Fetch team workload (managers only)
 * Returns empty array for non-managers instead of throwing
 */
export async function fetchTeamWorkload(): Promise<TeamMemberWorkload[]> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${EDGE_FUNCTION_URL}?endpoint=team`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch team workload')
  }

  const data = await response.json()
  // Returns empty array for non-managers (is_manager: false)
  return data.team_members || []
}
