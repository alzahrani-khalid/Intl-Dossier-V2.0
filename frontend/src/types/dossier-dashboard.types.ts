/**
 * Dossier Dashboard Types
 * Feature: Dossier-Centric Dashboard Redesign
 *
 * Types for the new dossier-organized dashboard including:
 * - My Dossiers section with activity badges
 * - Recent Dossier Activity timeline
 * - Pending Work by Dossier grouping
 */

import type { DossierType } from './dossier-context.types'
import type { WorkSource, TrackingType } from './unified-work.types'

// =============================================================================
// My Dossiers Section Types
// =============================================================================

/**
 * User's relationship to a dossier
 */
export type DossierRelationType = 'owner' | 'contributor' | 'reviewer' | 'member'

/**
 * Quick stats for a single dossier card
 */
export interface DossierQuickStats {
  /** Count of new items in the last 7 days */
  new_items_count: number
  /** Count of pending tasks */
  pending_tasks_count: number
  /** Count of active commitments */
  active_commitments_count: number
  /** Count of open intake tickets */
  open_intakes_count: number
  /** Whether there are any overdue items */
  has_overdue: boolean
  /** Count of overdue items */
  overdue_count: number
  /** Last activity timestamp */
  last_activity_at: string | null
}

/**
 * A dossier with user relationship and quick stats
 */
export interface MyDossier {
  id: string
  name_en: string
  name_ar: string
  type: DossierType
  status: 'active' | 'inactive' | 'archived'
  /** User's relationship to this dossier */
  relation_type: DossierRelationType
  /** Quick stats for activity badges */
  stats: DossierQuickStats
  /** Country-specific: ISO code for flag display */
  iso_code_2?: string
  /** Organization-specific: Org code */
  org_code?: string
  /** Description for tooltips */
  description_en?: string
  description_ar?: string
}

/**
 * Response from the my-dossiers endpoint
 */
export interface MyDossiersResponse {
  dossiers: MyDossier[]
  total_count: number
  /** Count by relationship type */
  counts_by_relation: {
    owner: number
    contributor: number
    reviewer: number
    member: number
  }
  /** Count by dossier type */
  counts_by_type: Record<DossierType, number>
}

// =============================================================================
// Recent Dossier Activity Types
// =============================================================================

/**
 * A single activity item in the cross-dossier timeline
 */
export interface DossierActivityItem {
  id: string
  /** The work item ID */
  work_item_id: string
  /** Type of work item */
  work_item_type: WorkSource
  /** Activity title */
  title: string
  /** Activity description (optional) */
  description?: string | null
  /** Current status */
  status: string
  /** Priority level */
  priority: string
  /** Whether the item is overdue */
  is_overdue: boolean
  /** Due date or SLA deadline */
  deadline: string | null
  /** When this activity occurred */
  activity_timestamp: string
  /** The dossier this activity belongs to */
  dossier: {
    id: string
    name_en: string
    name_ar: string
    type: DossierType
  }
  /** How the activity is linked to the dossier */
  inheritance_source: 'direct' | 'engagement' | 'after_action' | 'position' | 'mou'
  /** Assignee info (if any) */
  assignee?: {
    id: string
    email: string
    display_name?: string
  } | null
}

/**
 * Paginated response for recent dossier activity
 */
export interface RecentDossierActivityResponse {
  activities: DossierActivityItem[]
  next_cursor: string | null
  has_more: boolean
  total_count: number
}

// =============================================================================
// Pending Work by Dossier Types
// =============================================================================

/**
 * Work item summary for a dossier
 */
export interface DossierWorkSummary {
  /** Total pending items for this dossier */
  total_pending: number
  /** Count by source type */
  by_source: {
    tasks: number
    commitments: number
    intakes: number
  }
  /** Count by tracking type */
  by_tracking: {
    delivery: number
    follow_up: number
    sla: number
  }
  /** Overdue count */
  overdue_count: number
  /** Due today count */
  due_today_count: number
  /** Due this week count */
  due_week_count: number
  /** High priority count */
  high_priority_count: number
}

/**
 * Pending work grouped by dossier
 */
export interface PendingWorkByDossierItem {
  dossier: {
    id: string
    name_en: string
    name_ar: string
    type: DossierType
    status: 'active' | 'inactive' | 'archived'
  }
  /** Summary of pending work */
  summary: DossierWorkSummary
  /** Sample of most urgent items (up to 3) */
  urgent_items: Array<{
    id: string
    title: string
    work_item_type: WorkSource
    priority: string
    deadline: string | null
    is_overdue: boolean
  }>
}

/**
 * Response for pending work by dossier
 */
export interface PendingWorkByDossierResponse {
  items: PendingWorkByDossierItem[]
  /** Total pending work across all dossiers */
  total_pending: number
  /** Dossiers with overdue work */
  dossiers_with_overdue: number
  /** Total overdue count */
  total_overdue: number
}

// =============================================================================
// Dashboard Summary Types
// =============================================================================

/**
 * Overall dashboard summary stats
 */
export interface DossierDashboardSummary {
  /** Total dossiers the user has access to */
  total_dossiers: number
  /** Dossiers the user owns */
  owned_dossiers: number
  /** Dossiers with recent activity (last 7 days) */
  active_dossiers: number
  /** Dossiers needing attention (has overdue items) */
  attention_needed: number
  /** Total pending work items */
  total_pending_work: number
  /** Total overdue items */
  total_overdue: number
  /** Work due today */
  due_today: number
  /** Work due this week */
  due_this_week: number
}

// =============================================================================
// API Request Types
// =============================================================================

/**
 * Filters for my dossiers endpoint
 */
export interface MyDossiersFilters {
  /** Filter by relationship type */
  relation_type?: DossierRelationType | DossierRelationType[]
  /** Filter by dossier type */
  dossier_type?: DossierType | DossierType[]
  /** Filter by status */
  status?: 'active' | 'inactive' | 'archived'
  /** Filter to only show dossiers with pending work */
  has_pending_work?: boolean
  /** Filter to only show dossiers with overdue items */
  has_overdue?: boolean
  /** Search query */
  search?: string
  /** Sort by */
  sort_by?: 'name' | 'last_activity' | 'pending_count' | 'type'
  /** Sort order */
  sort_order?: 'asc' | 'desc'
  /** Pagination */
  limit?: number
  offset?: number
}

/**
 * Filters for recent dossier activity endpoint
 */
export interface RecentActivityFilters {
  /** Filter by work item type */
  work_item_types?: WorkSource[]
  /** Filter to specific dossier IDs */
  dossier_ids?: string[]
  /** Filter by dossier type */
  dossier_types?: DossierType[]
  /** Filter to only overdue items */
  overdue_only?: boolean
  /** Date range start */
  since?: string
  /** Cursor for pagination */
  cursor?: string
  /** Page size */
  limit?: number
}

/**
 * Filters for pending work by dossier endpoint
 */
export interface PendingWorkFilters {
  /** Filter by dossier type */
  dossier_types?: DossierType[]
  /** Filter by work source */
  work_sources?: WorkSource[]
  /** Filter by tracking type */
  tracking_types?: TrackingType[]
  /** Filter to dossiers with overdue items only */
  overdue_only?: boolean
  /** Sort by */
  sort_by?: 'pending_count' | 'overdue_count' | 'dossier_name'
  /** Sort order */
  sort_order?: 'asc' | 'desc'
  /** Max dossiers to return */
  limit?: number
}

// =============================================================================
// Component Props Types
// =============================================================================

/**
 * Props for MyDossiersSection component
 */
export interface MyDossiersSectionProps {
  /** Maximum number of dossiers to show */
  maxItems?: number
  /** Whether to show the "View All" button */
  showViewAll?: boolean
  /** Callback when "View All" is clicked */
  onViewAll?: () => void
  /** Filter to apply */
  filter?: MyDossiersFilters
  /** Additional CSS classes */
  className?: string
}

/**
 * Props for RecentDossierActivity component
 */
export interface RecentDossierActivityProps {
  /** Maximum items to show before "View All" */
  maxItems?: number
  /** Maximum height for scrollable area */
  maxHeight?: string
  /** Whether to show dossier badges */
  showDossierBadges?: boolean
  /** Filters to apply */
  filters?: RecentActivityFilters
  /** Additional CSS classes */
  className?: string
}

/**
 * Props for PendingWorkByDossier component
 */
export interface PendingWorkByDossierProps {
  /** Maximum dossiers to show */
  maxDossiers?: number
  /** Whether to expand all dossiers by default */
  defaultExpanded?: boolean
  /** Filters to apply */
  filters?: PendingWorkFilters
  /** Additional CSS classes */
  className?: string
}

/**
 * Props for DossierQuickStatsCard component
 */
export interface DossierQuickStatsCardProps {
  /** The dossier to display */
  dossier: MyDossier
  /** Whether to show the full card or compact version */
  variant?: 'full' | 'compact'
  /** Callback when card is clicked */
  onClick?: () => void
  /** Additional CSS classes */
  className?: string
}
