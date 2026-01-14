/**
 * CQRS Types
 *
 * TypeScript type definitions for the CQRS pattern implementation.
 * Includes types for commands, queries, events, and read models.
 */

// ============================================================================
// Base Types
// ============================================================================

/**
 * Base interface for all commands
 */
export interface Command {
  /** Unique key to prevent duplicate operations */
  idempotency_key?: string
  /** ID to correlate related operations */
  correlation_id?: string
}

/**
 * Result of executing a command
 */
export interface CommandResult<T = unknown> {
  success: boolean
  data?: T
  event_id?: string
  error?: string
}

/**
 * Metadata for query results
 */
export interface QueryMetadata {
  /** Whether data came from optimized read model or fallback */
  source: 'read_model' | 'fallback'
  /** Query execution time in milliseconds */
  query_time_ms: number
}

// ============================================================================
// Read Model Types
// ============================================================================

/**
 * Timeline event from read model
 */
export interface TimelineEvent {
  id: string
  event_key: string
  source_table: string
  source_id: string
  dossier_id: string
  dossier_type: string
  event_type: TimelineEventType
  title_en: string | null
  title_ar: string | null
  description_en: string | null
  description_ar: string | null
  event_date: string
  end_date: string | null
  priority: Priority
  status: string | null
  metadata: TimelineEventMetadata
  created_at: string
  updated_at: string
  created_by: string | null
}

export type TimelineEventType =
  | 'calendar'
  | 'interaction'
  | 'intelligence'
  | 'mou'
  | 'document'
  | 'event'

export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export interface TimelineEventMetadata {
  icon: string
  color: string
  badge_text_en?: string
  badge_text_ar?: string
  navigation_url?: string
  [key: string]: unknown
}

/**
 * Relationship graph node from read model
 */
export interface GraphNode {
  id: string
  type: string
  name_en: string | null
  name_ar: string | null
  status: string
  depth: number
  path?: string[]
}

/**
 * Relationship graph edge from read model
 */
export interface GraphEdge {
  source_id: string
  target_id: string
  relationship_type: string
  relationship_subtype?: string
  strength?: number
  is_bidirectional?: boolean
}

/**
 * Pre-computed dossier summary from read model
 */
export interface DossierSummary {
  id: string
  type: string
  name_en: string | null
  name_ar: string | null
  summary_en: string | null
  summary_ar: string | null
  status: string
  relationship_count: number
  document_count: number
  event_count: number
  interaction_count: number
  last_activity_at: string | null
  health_score: number
  tags: string[]
  categories: string[]
  created_at: string
  updated_at: string
}

/**
 * Daily aggregated metrics from read model
 */
export interface DailyMetrics {
  id: string
  metric_date: string
  metric_type: MetricType
  total_count: number
  by_type: Record<string, number>
  by_status: Record<string, number>
  by_user: Record<string, number>
  created_at: string
}

export type MetricType = 'dossier_activity' | 'relationship_changes' | 'events' | 'user_actions'

// ============================================================================
// Query Types
// ============================================================================

/**
 * Timeline query parameters
 */
export interface TimelineQuery {
  dossier_id: string
  event_types?: TimelineEventType[]
  priority?: Priority[]
  date_from?: string
  date_to?: string
  search_query?: string
  cursor?: string
  limit?: number
}

/**
 * Timeline query response
 */
export interface TimelineResponse extends QueryMetadata {
  events: TimelineEvent[]
  next_cursor: string | undefined
  has_more: boolean
  total_count: number
}

/**
 * Graph query parameters
 */
export interface GraphQuery {
  dossier_id: string
  relationship_types?: string[]
  max_depth?: number
  include_inactive?: boolean
}

/**
 * Graph query response
 */
export interface GraphResponse extends QueryMetadata {
  start_dossier_id: string
  start_dossier: {
    id: string
    type: string
    name_en: string
    name_ar: string
    status: string
  }
  max_depth: number
  nodes: GraphNode[]
  edges: GraphEdge[]
  stats: {
    node_count: number
    edge_count: number
    max_degree: number
    query_time_ms: number
  }
}

/**
 * Search query parameters
 */
export interface SearchQuery {
  query: string
  types?: string[]
  status?: string[]
  limit?: number
  offset?: number
}

/**
 * Search result item
 */
export interface SearchResult extends DossierSummary {
  rank: number
}

/**
 * Search query response
 */
export interface SearchResponse extends QueryMetadata {
  results: SearchResult[]
  total_count: number
}

// ============================================================================
// Command Types
// ============================================================================

/**
 * Create dossier command
 */
export interface CreateDossierCommand extends Command {
  type: string
  name_en: string
  name_ar?: string
  summary_en?: string
  summary_ar?: string
  status?: string
  visibility?: string
  metadata?: Record<string, unknown>
}

/**
 * Update dossier command
 */
export interface UpdateDossierCommand extends Command {
  id: string
  changes: Partial<{
    name_en: string
    name_ar: string
    summary_en: string
    summary_ar: string
    status: string
    visibility: string
    metadata: Record<string, unknown>
  }>
}

/**
 * Archive dossier command
 */
export interface ArchiveDossierCommand extends Command {
  id: string
  reason?: string
}

/**
 * Create relationship command
 */
export interface CreateRelationshipCommand extends Command {
  source_dossier_id: string
  target_dossier_id: string
  relationship_type: string
  relationship_subtype?: string
  strength?: number
  is_bidirectional?: boolean
  metadata?: Record<string, unknown>
}

/**
 * Delete relationship command
 */
export interface DeleteRelationshipCommand extends Command {
  id: string
}

/**
 * Create calendar entry command
 */
export interface CreateCalendarCommand extends Command {
  dossier_id: string
  entry_type: string
  title_en: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  event_date: string
  event_time?: string
  duration_minutes?: number
  all_day?: boolean
  location?: string
  is_virtual?: boolean
  meeting_link?: string
  status?: string
}

/**
 * Update calendar entry command
 */
export interface UpdateCalendarCommand extends Command {
  id: string
  changes: Partial<{
    entry_type: string
    title_en: string
    title_ar: string
    description_en: string
    description_ar: string
    event_date: string
    event_time: string
    duration_minutes: number
    all_day: boolean
    location: string
    is_virtual: boolean
    meeting_link: string
    status: string
  }>
}

/**
 * Delete calendar entry command
 */
export interface DeleteCalendarCommand extends Command {
  id: string
}

// ============================================================================
// Projection Types
// ============================================================================

/**
 * Projection metadata tracking
 */
export interface ProjectionMetadata {
  id: string
  projection_name: string
  projection_type: 'materialized_view' | 'table' | 'aggregate'
  last_event_id: string | null
  last_event_version: number
  last_refreshed_at: string | null
  status: ProjectionStatus
  error_message: string | null
  refresh_interval_seconds: number
  created_at: string
  updated_at: string
}

export type ProjectionStatus = 'stale' | 'refreshing' | 'current' | 'error'

// ============================================================================
// Event Types (for event sourcing integration)
// ============================================================================

/**
 * Domain event that triggers read model updates
 */
export interface DomainEvent {
  id: string
  event_type: string
  event_category: EventCategory
  event_version: number
  aggregate_type: AggregateType
  aggregate_id: string
  aggregate_version: number
  payload: Record<string, unknown>
  changes: Record<string, { old: unknown; new: unknown }> | null
  metadata: Record<string, unknown>
  actor_id: string | null
  actor_role: string | null
  correlation_id: string | null
  causation_id: string | null
  created_at: string
}

export type EventCategory =
  | 'lifecycle'
  | 'update'
  | 'relationship'
  | 'assignment'
  | 'status'
  | 'attachment'
  | 'workflow'
  | 'audit'

export type AggregateType =
  | 'person'
  | 'engagement'
  | 'organization'
  | 'country'
  | 'forum'
  | 'theme'
  | 'working_group'
  | 'relationship'
  | 'task'
  | 'commitment'
  | 'intake_ticket'
  | 'document'
  | 'mou'
