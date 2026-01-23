/**
 * Unified Dossier Activity Service
 * Feature: 035-dossier-context
 *
 * API client for the unified dossier activity endpoint that aggregates
 * all activity related to a dossier from tasks, commitments, intakes,
 * positions, events, relationships, documents, and comments.
 */

import { supabase } from '@/lib/supabase'
import type {
  UnifiedActivity,
  UnifiedActivityFilters,
  UnifiedActivityRequest,
  UnifiedActivityResponse,
  RawUnifiedActivity,
  UnifiedActivityType,
  UnifiedActivityAction,
  InheritanceSource,
  ActivityPriority,
} from '@/types/unified-dossier-activity.types'

// Get Supabase URL for Edge Functions
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

/**
 * API Error class for unified activity endpoint
 */
export class UnifiedActivityAPIError extends Error {
  code: string
  status: number
  details?: string

  constructor(message: string, status: number, code: string, details?: string) {
    super(message)
    this.name = 'UnifiedActivityAPIError'
    this.code = code
    this.status = status
    this.details = details
  }
}

/**
 * Helper function to get auth headers
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new UnifiedActivityAPIError('Not authenticated', 401, 'AUTH_REQUIRED')
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  }
}

/**
 * Build query string from request parameters
 */
function buildQueryString(request: UnifiedActivityRequest): string {
  const params = new URLSearchParams()

  // Required
  params.append('dossier_id', request.dossier_id)

  // Optional pagination
  if (request.cursor) {
    params.append('cursor', request.cursor)
  }
  if (request.limit !== undefined) {
    params.append('limit', String(request.limit))
  }

  // Optional filters
  if (request.activity_types && request.activity_types.length > 0) {
    params.append('activity_types', request.activity_types.join(','))
  }
  if (request.date_from) {
    params.append('date_from', request.date_from)
  }
  if (request.date_to) {
    params.append('date_to', request.date_to)
  }

  return params.toString()
}

/**
 * Transform raw API response to typed UnifiedActivity
 */
function transformActivity(raw: RawUnifiedActivity): UnifiedActivity {
  return {
    id: raw.id,
    activity_type: raw.activity_type,
    action: raw.action as UnifiedActivityAction,
    title_en: raw.title_en || '',
    title_ar: raw.title_ar || '',
    description_en: raw.description_en,
    description_ar: raw.description_ar,
    timestamp: raw.timestamp,
    actor: {
      id: raw.actor_id,
      name: raw.actor_name,
      email: raw.actor_email,
      avatar_url: raw.actor_avatar_url,
    },
    source_id: raw.source_id,
    source_table: raw.source_table,
    inheritance_source: (raw.inheritance_source || 'direct') as InheritanceSource,
    metadata: raw.metadata || {},
    priority: (raw.priority || 'medium') as ActivityPriority,
    status: raw.status || 'unknown',
  }
}

/**
 * Fetch unified activities for a dossier
 *
 * @param request - Request parameters
 * @returns Promise with activities, pagination info, and applied filters
 *
 * @example
 * ```typescript
 * // Basic usage
 * const result = await fetchUnifiedDossierActivities({
 *   dossier_id: 'uuid-here',
 * });
 *
 * // With filters and pagination
 * const result = await fetchUnifiedDossierActivities({
 *   dossier_id: 'uuid-here',
 *   activity_types: ['task', 'commitment'],
 *   date_from: '2026-01-01T00:00:00Z',
 *   limit: 50,
 *   cursor: 'previous-timestamp',
 * });
 * ```
 */
export async function fetchUnifiedDossierActivities(request: UnifiedActivityRequest): Promise<{
  activities: UnifiedActivity[]
  next_cursor: string | null
  has_more: boolean
  total_estimate: number | null
  filters_applied: {
    activity_types: UnifiedActivityType[] | null
    date_from: string | null
    date_to: string | null
  }
}> {
  const headers = await getAuthHeaders()
  const queryString = buildQueryString(request)
  const url = `${supabaseUrl}/functions/v1/dossier-unified-activity?${queryString}`

  const response = await fetch(url, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    let error: { error?: string; code?: string; details?: string }
    try {
      error = await response.json()
    } catch {
      error = { error: response.statusText }
    }

    throw new UnifiedActivityAPIError(
      error.error || 'Failed to fetch activities',
      response.status,
      error.code || 'API_ERROR',
      error.details,
    )
  }

  const data: UnifiedActivityResponse = await response.json()

  return {
    activities: data.activities.map(transformActivity),
    next_cursor: data.next_cursor,
    has_more: data.has_more,
    total_estimate: data.total_estimate,
    filters_applied: data.filters_applied,
  }
}

/**
 * Convenience function to get all activity types for a dossier
 */
export async function fetchAllDossierActivities(
  dossierId: string,
  options?: {
    limit?: number
    date_from?: string
    date_to?: string
  },
): Promise<UnifiedActivity[]> {
  const result = await fetchUnifiedDossierActivities({
    dossier_id: dossierId,
    limit: options?.limit || 50,
    date_from: options?.date_from,
    date_to: options?.date_to,
  })

  return result.activities
}

/**
 * Convenience function to get activities of specific types
 */
export async function fetchDossierActivitiesByType(
  dossierId: string,
  activityTypes: UnifiedActivityType[],
  options?: {
    cursor?: string
    limit?: number
    date_from?: string
    date_to?: string
  },
): Promise<{
  activities: UnifiedActivity[]
  next_cursor: string | null
  has_more: boolean
}> {
  return fetchUnifiedDossierActivities({
    dossier_id: dossierId,
    activity_types: activityTypes,
    cursor: options?.cursor,
    limit: options?.limit,
    date_from: options?.date_from,
    date_to: options?.date_to,
  })
}

/**
 * Get recent activities for a dossier (last N days)
 */
export async function fetchRecentDossierActivities(
  dossierId: string,
  days: number = 7,
  limit: number = 20,
): Promise<UnifiedActivity[]> {
  const date_from = new Date()
  date_from.setDate(date_from.getDate() - days)

  const result = await fetchUnifiedDossierActivities({
    dossier_id: dossierId,
    date_from: date_from.toISOString(),
    limit,
  })

  return result.activities
}

/**
 * Export query keys for TanStack Query integration
 */
export const unifiedDossierActivityKeys = {
  all: ['unified-dossier-activity'] as const,
  lists: () => [...unifiedDossierActivityKeys.all, 'list'] as const,
  list: (dossierId: string, filters?: UnifiedActivityFilters) =>
    [...unifiedDossierActivityKeys.lists(), dossierId, filters] as const,
  details: () => [...unifiedDossierActivityKeys.all, 'detail'] as const,
  detail: (activityId: string) => [...unifiedDossierActivityKeys.details(), activityId] as const,
}
