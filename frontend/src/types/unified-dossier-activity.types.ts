/**
 * Unified Dossier Activity Types
 * Feature: 035-dossier-context
 *
 * Type definitions for the unified dossier activity endpoint that aggregates
 * all activity related to a dossier from tasks, commitments, intakes, positions,
 * events, relationships, documents, and comments.
 */

// =============================================
// ACTIVITY TYPES
// =============================================

/**
 * Valid activity types for the unified feed
 */
export const UNIFIED_ACTIVITY_TYPES = [
  'task',
  'commitment',
  'intake',
  'position',
  'event',
  'relationship',
  'document',
  'comment',
] as const

export type UnifiedActivityType = (typeof UNIFIED_ACTIVITY_TYPES)[number]

/**
 * Action types that describe what happened to the activity
 */
export type UnifiedActivityAction =
  | 'created'
  | 'updated'
  | 'completed'
  | 'linked'
  | 'commented'
  | 'status_change'
  | 'assigned'

/**
 * Inheritance source indicating how the activity is related to the dossier
 */
export type InheritanceSource = 'direct' | 'engagement' | 'after_action' | 'position' | 'mou'

/**
 * Priority levels for activities
 */
export type ActivityPriority = 'low' | 'medium' | 'high' | 'urgent'

// =============================================
// UNIFIED ACTIVITY
// =============================================

/**
 * Actor information for an activity
 */
export interface ActivityActor {
  id: string | null
  name: string | null
  email: string | null
  avatar_url: string | null
}

/**
 * A single unified activity item
 */
export interface UnifiedActivity {
  /** Unique identifier for this activity */
  id: string

  /** Type of activity (task, commitment, intake, etc.) */
  activity_type: UnifiedActivityType

  /** Action that occurred (created, updated, completed, etc.) */
  action: UnifiedActivityAction

  /** English title */
  title_en: string

  /** Arabic title */
  title_ar: string

  /** English description (may be null for some activity types) */
  description_en: string | null

  /** Arabic description (may be null for some activity types) */
  description_ar: string | null

  /** When the activity occurred (ISO timestamp) */
  timestamp: string

  /** Actor who performed the action */
  actor: ActivityActor

  /** ID of the source record */
  source_id: string

  /** Database table where the source record is stored */
  source_table: string

  /** How this activity relates to the dossier */
  inheritance_source: InheritanceSource

  /** Type-specific metadata */
  metadata: UnifiedActivityMetadata

  /** Priority level */
  priority: ActivityPriority

  /** Current status of the source record */
  status: string
}

/**
 * Metadata for different activity types
 */
export interface UnifiedActivityMetadata {
  // Task metadata
  assignee_id?: string
  deadline?: string
  workflow_stage?: string
  engagement_id?: string

  // Commitment metadata
  responsible?: {
    userId?: string
    name?: string
  }
  tracking_type?: string
  after_action_id?: string

  // Intake metadata
  assigned_to?: string
  sla_deadline?: string
  service_type?: string
  ticket_number?: string

  // Position metadata
  position_type_id?: string
  consistency_score?: number
  current_stage?: number
  link_type?: string

  // Event metadata
  event_type?: string
  start_datetime?: string
  end_datetime?: string
  location_en?: string
  location_ar?: string
  is_virtual?: boolean

  // Relationship metadata
  relationship_type?: string
  target_dossier_id?: string
  target_dossier_type?: string
  source_dossier_id?: string
  source_dossier_type?: string
  effective_from?: string
  effective_to?: string
  is_incoming?: boolean

  // Comment metadata
  entity_type?: string
  entity_id?: string
  parent_id?: string
  thread_root_id?: string
  visibility?: string

  // Additional fields
  [key: string]: unknown
}

// =============================================
// FILTERS
// =============================================

/**
 * Filter options for the unified activity feed
 */
export interface UnifiedActivityFilters {
  /** Filter by activity types */
  activity_types?: UnifiedActivityType[]

  /** Filter by start date (inclusive) */
  date_from?: string

  /** Filter by end date (inclusive) */
  date_to?: string
}

// =============================================
// API REQUEST/RESPONSE
// =============================================

/**
 * Request parameters for the unified activity endpoint
 */
export interface UnifiedActivityRequest {
  /** Dossier ID (required) */
  dossier_id: string

  /** Cursor for pagination (ISO timestamp) */
  cursor?: string

  /** Number of items per page (1-100, default 20) */
  limit?: number

  /** Filter by activity types (comma-separated) */
  activity_types?: UnifiedActivityType[]

  /** Filter by start date */
  date_from?: string

  /** Filter by end date */
  date_to?: string
}

/**
 * Response from the unified activity endpoint
 */
export interface UnifiedActivityResponse {
  /** List of activities */
  activities: RawUnifiedActivity[]

  /** Cursor for the next page (null if no more pages) */
  next_cursor: string | null

  /** Whether there are more pages */
  has_more: boolean

  /** Estimated total count (may be null for performance) */
  total_estimate: number | null

  /** Filters that were applied */
  filters_applied: {
    activity_types: UnifiedActivityType[] | null
    date_from: string | null
    date_to: string | null
  }
}

/**
 * Raw activity from API (before transformation)
 */
export interface RawUnifiedActivity {
  id: string
  activity_type: UnifiedActivityType
  action: string
  title_en: string
  title_ar: string
  description_en: string | null
  description_ar: string | null
  timestamp: string
  actor_id: string | null
  actor_name: string | null
  actor_email: string | null
  actor_avatar_url: string | null
  source_id: string
  source_table: string
  inheritance_source: string
  metadata: UnifiedActivityMetadata
  priority: string
  status: string
}

// =============================================
// HOOK TYPES
// =============================================

// =============================================
// COMPONENT PROPS
// =============================================

// =============================================
// CONFIGURATION
// =============================================

/**
 * Configuration for activity type display
 */
export interface ActivityTypeConfig {
  type: UnifiedActivityType
  icon: string
  color: string
  bgColor: string
  label_en: string
  label_ar: string
}

/**
 * Configuration for action type display
 */
export interface ActivityActionConfig {
  action: UnifiedActivityAction
  icon: string
  color: string
  label_en: string
  label_ar: string
}
