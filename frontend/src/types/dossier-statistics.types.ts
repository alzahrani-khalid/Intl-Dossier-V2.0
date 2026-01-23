/**
 * Dossier Statistics Types
 * Feature: R13 - Pre-computed aggregate statistics for dossier dashboards
 *
 * Types for the dossier_statistics materialized view that provides
 * fast pre-computed statistics for dashboard displays.
 */

import type { DossierType } from './dossier-context.types'

// =============================================================================
// Dossier Statistics (from materialized view)
// =============================================================================

/**
 * Pre-computed statistics for a single dossier
 * Maps to the dossier_statistics materialized view
 */
export interface DossierStatistics {
  /** Dossier ID */
  dossier_id: string
  /** Dossier type (country, organization, etc.) */
  dossier_type: DossierType
  /** Dossier status */
  dossier_status: 'active' | 'inactive' | 'archived'
  /** Name in English */
  name_en: string
  /** Name in Arabic */
  name_ar: string

  // Task statistics
  /** Total tasks linked to this dossier */
  task_count: number
  /** Tasks in pending/in_progress/review status */
  pending_task_count: number
  /** Tasks that are overdue (past SLA deadline) */
  overdue_task_count: number

  // Commitment statistics
  /** Total commitments linked to this dossier */
  commitment_count: number
  /** Commitments in pending/in_progress status */
  pending_commitment_count: number
  /** Commitments that are overdue (past due date) */
  overdue_commitment_count: number

  // Intake ticket statistics
  /** Total intake tickets linked to this dossier */
  intake_count: number
  /** Intake tickets in open/new/in_progress status */
  pending_intake_count: number

  // Position statistics
  /** Total positions linked to this dossier */
  position_count: number
  /** Published positions */
  published_position_count: number

  // Relationship statistics
  /** Total dossier-to-dossier relationships */
  relationship_count: number
  /** Active relationships */
  active_relationship_count: number

  // Event statistics
  /** Total events related to this dossier */
  event_count: number
  /** Upcoming scheduled events */
  upcoming_event_count: number

  // Document statistics
  /** Total documents/attachments */
  document_count: number

  // Engagement statistics
  /** Total engagements for this dossier */
  engagement_count: number

  // MOU statistics
  /** Total MOUs related to this dossier */
  mou_count: number
  /** Active MOUs */
  active_mou_count: number

  // Aggregated counts
  /** Sum of all work items (tasks + commitments + intakes) */
  total_work_items: number
  /** Sum of all pending work */
  total_pending_work: number
  /** Sum of all overdue items */
  total_overdue: number

  // Timestamps
  /** Most recent activity across all linked items */
  last_activity_at: string | null
  /** When the statistics were last refreshed */
  refreshed_at: string
}

// =============================================================================
// Summary Statistics (aggregated across dossiers)
// =============================================================================

/**
 * Type-level statistics breakdown
 */
export interface DossierTypeStatistics {
  count: number
  pending_work: number
  overdue: number
}

/**
 * Aggregated statistics summary across all dossiers
 * From get_dossier_statistics_summary() RPC
 */
export interface DossierStatisticsSummary {
  /** Total dossiers in the system */
  total_dossiers: number

  /** Total tasks across all dossiers */
  total_tasks: number
  total_pending_tasks: number
  total_overdue_tasks: number

  /** Total commitments across all dossiers */
  total_commitments: number
  total_pending_commitments: number
  total_overdue_commitments: number

  /** Total intake tickets across all dossiers */
  total_intakes: number
  total_pending_intakes: number

  /** Total positions across all dossiers */
  total_positions: number

  /** Total relationships across all dossiers */
  total_relationships: number

  /** Total events across all dossiers */
  total_events: number

  /** Total documents across all dossiers */
  total_documents: number

  /** Aggregated work item counts */
  total_work_items: number
  total_pending_work: number
  total_overdue: number

  /** Dossiers with pending work */
  dossiers_with_pending_work: number
  /** Dossiers with overdue items */
  dossiers_with_overdue: number

  /** When the stats were last refreshed */
  last_refresh: string

  /** Breakdown by dossier type */
  by_type: Record<DossierType, DossierTypeStatistics>
}

// =============================================================================
// API Request/Response Types
// =============================================================================

/**
 * Filters for fetching dossier statistics
 */
export interface DossierStatisticsFilters {
  /** Filter by dossier type */
  dossier_type?: DossierType
  /** Filter to dossiers with pending work */
  has_pending_work?: boolean
  /** Filter to dossiers with overdue items */
  has_overdue?: boolean
  /** Sort by field */
  sort_by?: 'last_activity' | 'total_pending_work' | 'total_overdue' | 'name'
  /** Sort order */
  sort_order?: 'asc' | 'desc'
  /** Pagination limit */
  limit?: number
  /** Pagination offset */
  offset?: number
}

/**
 * Response for batch statistics fetch
 */
export interface DossierStatisticsBatchResponse {
  statistics: DossierStatistics[]
  total_count: number
}

// =============================================================================
// Component Props Types
// =============================================================================

/**
 * Props for DossierStatsCard component
 */
export interface DossierStatsCardProps {
  /** Dossier statistics */
  stats: DossierStatistics
  /** Card variant */
  variant?: 'full' | 'compact' | 'mini'
  /** Whether to show the overdue badge */
  showOverdueBadge?: boolean
  /** Whether to show the pending work badge */
  showPendingBadge?: boolean
  /** Callback when card is clicked */
  onClick?: () => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Props for DossierStatsSummary component
 */
export interface DossierStatsSummaryProps {
  /** Optional dossier type filter */
  dossierType?: DossierType
  /** Whether to show breakdown by type */
  showBreakdown?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Props for DossierStatsGrid component
 */
export interface DossierStatsGridProps {
  /** Dossier IDs to fetch stats for */
  dossierIds: string[]
  /** Grid columns */
  columns?: 1 | 2 | 3 | 4
  /** Card variant */
  cardVariant?: 'full' | 'compact' | 'mini'
  /** Callback when a card is clicked */
  onCardClick?: (dossierId: string) => void
  /** Additional CSS classes */
  className?: string
}
