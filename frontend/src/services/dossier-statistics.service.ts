/**
 * Dossier Statistics Service
 * Feature: R13 - Pre-computed aggregate statistics for dossier dashboards
 *
 * API services for fetching pre-computed dossier statistics from the
 * dossier_statistics materialized view.
 */

import { supabase } from '@/lib/supabase'
import type {
  DossierStatistics,
  DossierStatisticsSummary,
  DossierStatisticsFilters,
  DossierStatisticsBatchResponse,
} from '@/types/dossier-statistics.types'

// =============================================================================
// Fetch Single Dossier Statistics
// =============================================================================

/**
 * Fetches pre-computed statistics for a single dossier
 * Uses the get_dossier_statistics RPC function
 *
 * @param dossierId - The dossier ID to fetch statistics for
 * @returns DossierStatistics or null if not found
 */
export async function fetchDossierStatistics(dossierId: string): Promise<DossierStatistics | null> {
  const { data, error } = await supabase.rpc('get_dossier_statistics', {
    p_dossier_id: dossierId,
  })

  if (error) {
    console.error('Error fetching dossier statistics:', error)
    throw new Error(error.message)
  }

  // RPC returns array, get first item
  if (!data || data.length === 0) {
    return null
  }

  return transformStatisticsRow(data[0])
}

// =============================================================================
// Fetch Batch Dossier Statistics
// =============================================================================

/**
 * Fetches pre-computed statistics for multiple dossiers
 * Uses the get_dossier_statistics_batch RPC function
 *
 * @param dossierIds - Array of dossier IDs to fetch statistics for
 * @returns Array of DossierStatistics
 */
export async function fetchDossierStatisticsBatch(
  dossierIds: string[],
): Promise<DossierStatistics[]> {
  if (dossierIds.length === 0) {
    return []
  }

  const { data, error } = await supabase.rpc('get_dossier_statistics_batch', {
    p_dossier_ids: dossierIds,
  })

  if (error) {
    console.error('Error fetching dossier statistics batch:', error)
    throw new Error(error.message)
  }

  return (data || []).map(transformStatisticsRow)
}

// =============================================================================
// Fetch Summary Statistics
// =============================================================================

/**
 * Fetches aggregated summary statistics across all dossiers
 * Uses the get_dossier_statistics_summary RPC function
 *
 * @param dossierType - Optional filter by dossier type
 * @returns DossierStatisticsSummary
 */
export async function fetchDossierStatisticsSummary(
  dossierType?: string,
): Promise<DossierStatisticsSummary> {
  const { data, error } = await supabase.rpc('get_dossier_statistics_summary', {
    p_dossier_type: dossierType || null,
  })

  if (error) {
    console.error('Error fetching dossier statistics summary:', error)
    throw new Error(error.message)
  }

  return transformSummaryResponse(data)
}

// =============================================================================
// Direct View Access (for advanced queries)
// =============================================================================

/**
 * Fetches dossier statistics directly from the materialized view
 * with filtering and pagination support
 *
 * @param filters - Optional filters for the query
 * @returns DossierStatisticsBatchResponse
 */
export async function fetchDossierStatisticsFromView(
  filters?: DossierStatisticsFilters,
): Promise<DossierStatisticsBatchResponse> {
  let query = supabase.from('dossier_statistics').select('*', { count: 'exact' })

  // Apply filters
  if (filters?.dossier_type) {
    query = query.eq('dossier_type', filters.dossier_type)
  }

  if (filters?.has_pending_work) {
    query = query.gt('total_pending_work', 0)
  }

  if (filters?.has_overdue) {
    query = query.gt('total_overdue', 0)
  }

  // Apply sorting
  const sortBy = filters?.sort_by || 'last_activity_at'
  const sortOrder = filters?.sort_order || 'desc'
  const ascending = sortOrder === 'asc'

  switch (sortBy) {
    case 'last_activity':
      query = query.order('last_activity_at', { ascending, nullsFirst: false })
      break
    case 'total_pending_work':
      query = query.order('total_pending_work', { ascending })
      break
    case 'total_overdue':
      query = query.order('total_overdue', { ascending })
      break
    case 'name':
      query = query.order('name_en', { ascending })
      break
    default:
      query = query.order('last_activity_at', { ascending: false, nullsFirst: false })
  }

  // Apply pagination
  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching dossier statistics from view:', error)
    throw new Error(error.message)
  }

  return {
    statistics: (data || []).map(transformStatisticsRow),
    total_count: count || 0,
  }
}

// =============================================================================
// Refresh Statistics (admin function)
// =============================================================================

/**
 * Manually triggers a refresh of the dossier_statistics materialized view
 * Requires elevated permissions (typically admin/service role)
 */
export async function refreshDossierStatistics(): Promise<void> {
  const { error } = await supabase.rpc('refresh_dossier_statistics')

  if (error) {
    console.error('Error refreshing dossier statistics:', error)
    throw new Error(error.message)
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Transforms a raw statistics row from the database to the TypeScript type
 */
function transformStatisticsRow(row: Record<string, unknown>): DossierStatistics {
  return {
    dossier_id: row.dossier_id as string,
    dossier_type: row.dossier_type as DossierStatistics['dossier_type'],
    dossier_status: row.dossier_status as DossierStatistics['dossier_status'],
    name_en: row.name_en as string,
    name_ar: row.name_ar as string,

    // Task stats
    task_count: Number(row.task_count) || 0,
    pending_task_count: Number(row.pending_task_count) || 0,
    overdue_task_count: Number(row.overdue_task_count) || 0,

    // Commitment stats
    commitment_count: Number(row.commitment_count) || 0,
    pending_commitment_count: Number(row.pending_commitment_count) || 0,
    overdue_commitment_count: Number(row.overdue_commitment_count) || 0,

    // Intake stats
    intake_count: Number(row.intake_count) || 0,
    pending_intake_count: Number(row.pending_intake_count) || 0,

    // Position stats
    position_count: Number(row.position_count) || 0,
    published_position_count: Number(row.published_position_count) || 0,

    // Relationship stats
    relationship_count: Number(row.relationship_count) || 0,
    active_relationship_count: Number(row.active_relationship_count) || 0,

    // Event stats
    event_count: Number(row.event_count) || 0,
    upcoming_event_count: Number(row.upcoming_event_count) || 0,

    // Document stats
    document_count: Number(row.document_count) || 0,

    // Engagement stats
    engagement_count: Number(row.engagement_count) || 0,

    // MOU stats
    mou_count: Number(row.mou_count) || 0,
    active_mou_count: Number(row.active_mou_count) || 0,

    // Aggregated counts
    total_work_items: Number(row.total_work_items) || 0,
    total_pending_work: Number(row.total_pending_work) || 0,
    total_overdue: Number(row.total_overdue) || 0,

    // Timestamps
    last_activity_at: row.last_activity_at as string | null,
    refreshed_at: row.refreshed_at as string,
  }
}

/**
 * Transforms the summary response from the RPC to the TypeScript type
 */
function transformSummaryResponse(data: Record<string, unknown>): DossierStatisticsSummary {
  return {
    total_dossiers: Number(data.total_dossiers) || 0,

    total_tasks: Number(data.total_tasks) || 0,
    total_pending_tasks: Number(data.total_pending_tasks) || 0,
    total_overdue_tasks: Number(data.total_overdue_tasks) || 0,

    total_commitments: Number(data.total_commitments) || 0,
    total_pending_commitments: Number(data.total_pending_commitments) || 0,
    total_overdue_commitments: Number(data.total_overdue_commitments) || 0,

    total_intakes: Number(data.total_intakes) || 0,
    total_pending_intakes: Number(data.total_pending_intakes) || 0,

    total_positions: Number(data.total_positions) || 0,
    total_relationships: Number(data.total_relationships) || 0,
    total_events: Number(data.total_events) || 0,
    total_documents: Number(data.total_documents) || 0,

    total_work_items: Number(data.total_work_items) || 0,
    total_pending_work: Number(data.total_pending_work) || 0,
    total_overdue: Number(data.total_overdue) || 0,

    dossiers_with_pending_work: Number(data.dossiers_with_pending_work) || 0,
    dossiers_with_overdue: Number(data.dossiers_with_overdue) || 0,

    last_refresh: data.last_refresh as string,

    by_type: (data.by_type as DossierStatisticsSummary['by_type']) || {},
  }
}
