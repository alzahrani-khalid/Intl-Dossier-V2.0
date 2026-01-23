/**
 * Dossier Dashboard Service
 * Feature: Dossier-Centric Dashboard Redesign
 *
 * API services for fetching dossier dashboard data including:
 * - My Dossiers with stats
 * - Recent Dossier Activity
 * - Pending Work by Dossier
 */

import { supabase } from '@/lib/supabase'
import type {
  MyDossiersResponse,
  MyDossiersFilters,
  RecentDossierActivityResponse,
  RecentActivityFilters,
  PendingWorkByDossierResponse,
  PendingWorkFilters,
  DossierDashboardSummary,
  MyDossier,
  DossierActivityItem,
  PendingWorkByDossierItem,
} from '@/types/dossier-dashboard.types'

// =============================================================================
// Helper: Get Auth Headers
// =============================================================================

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

// =============================================================================
// Fetch My Dossiers
// =============================================================================

/**
 * Fetches dossiers the current user owns or contributes to with quick stats
 */
export async function fetchMyDossiers(filters?: MyDossiersFilters): Promise<MyDossiersResponse> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Build query params
  const params = new URLSearchParams()
  params.set('endpoint', 'my-dossiers')

  if (filters?.relation_type) {
    params.set(
      'relation_type',
      Array.isArray(filters.relation_type)
        ? filters.relation_type.join(',')
        : filters.relation_type,
    )
  }
  if (filters?.dossier_type) {
    params.set(
      'dossier_type',
      Array.isArray(filters.dossier_type) ? filters.dossier_type.join(',') : filters.dossier_type,
    )
  }
  if (filters?.status) params.set('status', filters.status)
  if (filters?.has_pending_work !== undefined)
    params.set('has_pending_work', String(filters.has_pending_work))
  if (filters?.has_overdue !== undefined) params.set('has_overdue', String(filters.has_overdue))
  if (filters?.search) params.set('search', filters.search)
  if (filters?.sort_by) params.set('sort_by', filters.sort_by)
  if (filters?.sort_order) params.set('sort_order', filters.sort_order)
  if (filters?.limit) params.set('limit', String(filters.limit))
  if (filters?.offset) params.set('offset', String(filters.offset))

  const headers = await getAuthHeaders()
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dossier-dashboard?${params.toString()}`,
    { method: 'GET', headers },
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch my dossiers' }))
    throw new Error(error.message || error.error || 'Failed to fetch my dossiers')
  }

  const rawResponse = await response.json()

  // Transform the nested structure to flat MyDossier format
  return {
    ...rawResponse,
    dossiers: (rawResponse.dossiers || []).map(
      (item: {
        dossier?: { id: string; name_en: string; name_ar: string; type: string; status: string }
        relation_type?: string
        stats?: {
          total_pending?: number
          new_items_7d?: number
          overdue_count?: number
          tasks_count?: number
          commitments_count?: number
          intakes_count?: number
        }
        last_activity?: string | null
        // Direct flat structure (if already transformed)
        id?: string
        name_en?: string
      }) => {
        // Handle nested structure from RPC
        if (item.dossier) {
          return {
            id: item.dossier.id,
            name_en: item.dossier.name_en,
            name_ar: item.dossier.name_ar,
            type: item.dossier.type,
            status: item.dossier.status,
            relation_type: item.relation_type || 'member',
            stats: {
              new_items_count: item.stats?.new_items_7d || 0,
              pending_tasks_count: item.stats?.tasks_count || 0,
              active_commitments_count: item.stats?.commitments_count || 0,
              open_intakes_count: item.stats?.intakes_count || 0,
              has_overdue: (item.stats?.overdue_count || 0) > 0,
              overdue_count: item.stats?.overdue_count || 0,
              last_activity_at: item.last_activity || null,
            },
          }
        }
        // Already flat structure - return as-is
        return item
      },
    ),
  }
}

// =============================================================================
// Fetch Recent Dossier Activity
// =============================================================================

/**
 * Fetches recent activity across all user's dossiers
 */
export async function fetchRecentDossierActivity(
  filters?: RecentActivityFilters,
): Promise<RecentDossierActivityResponse> {
  const params = new URLSearchParams()
  params.set('endpoint', 'recent-activity')

  if (filters?.work_item_types?.length) {
    params.set('work_item_types', filters.work_item_types.join(','))
  }
  if (filters?.dossier_ids?.length) {
    params.set('dossier_ids', filters.dossier_ids.join(','))
  }
  if (filters?.dossier_types?.length) {
    params.set('dossier_types', filters.dossier_types.join(','))
  }
  if (filters?.overdue_only) params.set('overdue_only', 'true')
  if (filters?.since) params.set('since', filters.since)
  if (filters?.cursor) params.set('cursor', filters.cursor)
  if (filters?.limit) params.set('limit', String(filters.limit))

  const headers = await getAuthHeaders()
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dossier-dashboard?${params.toString()}`,
    { method: 'GET', headers },
  )

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: 'Failed to fetch recent activity' }))
    throw new Error(error.message || error.error || 'Failed to fetch recent activity')
  }

  const rawResponse = await response.json()

  // Transform activities to match DossierActivityItem interface
  return {
    ...rawResponse,
    activities: (rawResponse.activities || []).map(
      (item: {
        id: string
        title?: string
        work_item_type: string
        status?: string
        priority?: string
        deadline?: string | null
        is_overdue?: boolean
        created_at?: string
        updated_at?: string
        inheritance_source?: string
        dossier?: {
          id: string
          name_en: string
          name_ar: string
          type: string
          status?: string
        }
      }) => ({
        id: item.id,
        work_item_id: item.id, // SQL returns 'id' but interface expects 'work_item_id'
        work_item_type: item.work_item_type,
        title: item.title || '',
        status: item.status || 'pending',
        priority: item.priority || 'medium',
        is_overdue: item.is_overdue || false,
        deadline: item.deadline || null,
        activity_timestamp: item.updated_at || item.created_at || new Date().toISOString(),
        inheritance_source: item.inheritance_source || 'direct',
        dossier: item.dossier || { id: '', name_en: '', name_ar: '', type: 'topic' },
      }),
    ),
  }
}

// =============================================================================
// Fetch Pending Work by Dossier
// =============================================================================

/**
 * Fetches pending work items grouped by dossier
 */
export async function fetchPendingWorkByDossier(
  filters?: PendingWorkFilters,
): Promise<PendingWorkByDossierResponse> {
  const params = new URLSearchParams()
  params.set('endpoint', 'pending-work')

  if (filters?.dossier_types?.length) {
    params.set('dossier_types', filters.dossier_types.join(','))
  }
  if (filters?.work_sources?.length) {
    params.set('work_sources', filters.work_sources.join(','))
  }
  if (filters?.tracking_types?.length) {
    params.set('tracking_types', filters.tracking_types.join(','))
  }
  if (filters?.overdue_only) params.set('overdue_only', 'true')
  if (filters?.sort_by) params.set('sort_by', filters.sort_by)
  if (filters?.sort_order) params.set('sort_order', filters.sort_order)
  if (filters?.limit) params.set('limit', String(filters.limit))

  const headers = await getAuthHeaders()
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dossier-dashboard?${params.toString()}`,
    { method: 'GET', headers },
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch pending work' }))
    throw new Error(error.message || error.error || 'Failed to fetch pending work')
  }

  return response.json()
}

// =============================================================================
// Fetch Dashboard Summary
// =============================================================================

/**
 * Fetches overall dashboard summary statistics
 */
export async function fetchDossierDashboardSummary(): Promise<DossierDashboardSummary> {
  const params = new URLSearchParams()
  params.set('endpoint', 'summary')

  const headers = await getAuthHeaders()
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dossier-dashboard?${params.toString()}`,
    { method: 'GET', headers },
  )

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: 'Failed to fetch dashboard summary' }))
    throw new Error(error.message || error.error || 'Failed to fetch dashboard summary')
  }

  return response.json()
}

// =============================================================================
// Direct RPC Fallbacks (for when Edge Function is unavailable)
// =============================================================================

/**
 * Fetches my dossiers via direct RPC call
 */
export async function fetchMyDossiersRPC(filters?: MyDossiersFilters): Promise<MyDossiersResponse> {
  const { data, error } = await supabase.rpc('get_my_dossiers_with_stats', {
    p_relation_type: filters?.relation_type
      ? Array.isArray(filters.relation_type)
        ? filters.relation_type
        : [filters.relation_type]
      : null,
    p_dossier_type: filters?.dossier_type
      ? Array.isArray(filters.dossier_type)
        ? filters.dossier_type
        : [filters.dossier_type]
      : null,
    p_status: filters?.status || null,
    p_has_pending_work: filters?.has_pending_work ?? null,
    p_has_overdue: filters?.has_overdue ?? null,
    p_search: filters?.search || null,
    p_sort_by: filters?.sort_by || 'last_activity',
    p_sort_order: filters?.sort_order || 'desc',
    p_limit: filters?.limit || 20,
    p_offset: filters?.offset || 0,
  })

  if (error) {
    throw new Error(error.message)
  }

  // Transform RPC response to match expected interface
  return {
    dossiers: data?.dossiers || [],
    total_count: data?.total_count || 0,
    counts_by_relation: data?.counts_by_relation || {
      owner: 0,
      contributor: 0,
      reviewer: 0,
      member: 0,
    },
    counts_by_type: data?.counts_by_type || {},
  }
}

/**
 * Fetches recent activity via direct RPC call
 */
export async function fetchRecentDossierActivityRPC(
  filters?: RecentActivityFilters,
): Promise<RecentDossierActivityResponse> {
  const { data, error } = await supabase.rpc('get_recent_dossier_activity', {
    p_work_item_types: filters?.work_item_types || null,
    p_dossier_ids: filters?.dossier_ids || null,
    p_dossier_types: filters?.dossier_types || null,
    p_overdue_only: filters?.overdue_only || false,
    p_since: filters?.since || null,
    p_cursor: filters?.cursor || null,
    p_limit: filters?.limit || 20,
  })

  if (error) {
    throw new Error(error.message)
  }

  return {
    activities: data?.activities || [],
    next_cursor: data?.next_cursor || null,
    has_more: data?.has_more || false,
    total_count: data?.total_count || 0,
  }
}

/**
 * Fetches pending work by dossier via direct RPC call
 */
export async function fetchPendingWorkByDossierRPC(
  filters?: PendingWorkFilters,
): Promise<PendingWorkByDossierResponse> {
  const { data, error } = await supabase.rpc('get_pending_work_by_dossier', {
    p_dossier_types: filters?.dossier_types || null,
    p_work_sources: filters?.work_sources || null,
    p_tracking_types: filters?.tracking_types || null,
    p_overdue_only: filters?.overdue_only || false,
    p_sort_by: filters?.sort_by || 'pending_count',
    p_sort_order: filters?.sort_order || 'desc',
    p_limit: filters?.limit || 10,
  })

  if (error) {
    throw new Error(error.message)
  }

  return {
    items: data?.items || [],
    total_pending: data?.total_pending || 0,
    dossiers_with_overdue: data?.dossiers_with_overdue || 0,
    total_overdue: data?.total_overdue || 0,
  }
}
