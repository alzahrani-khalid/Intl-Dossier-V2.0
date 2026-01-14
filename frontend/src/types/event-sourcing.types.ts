/**
 * Event Sourcing Types
 *
 * TypeScript interfaces for the event sourcing infrastructure.
 * All changes to entities are stored as immutable events, enabling:
 * - Full audit trails with temporal queries
 * - Time-travel debugging and state reconstruction
 * - CQRS pattern support for read/write optimization
 */

// ============================================================================
// ENUMS: Event Types and Categories
// ============================================================================

/**
 * Aggregate types correspond to entity categories in the system
 */
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

/**
 * Event categories for filtering and routing
 */
export type EventCategory =
  | 'lifecycle' // Create, archive, restore, delete
  | 'update' // Field/property updates
  | 'relationship' // Relationship changes
  | 'assignment' // Assignment/unassignment
  | 'status' // Status transitions
  | 'attachment' // Document/file attachments
  | 'workflow' // Workflow state changes
  | 'audit' // Administrative actions

// ============================================================================
// PERSON EVENTS
// ============================================================================

export type PersonEventType =
  | 'PersonCreated'
  | 'PersonUpdated'
  | 'PersonArchived'
  | 'PersonRestored'
  | 'PersonDeleted'
  | 'PersonRoleAdded'
  | 'PersonRoleUpdated'
  | 'PersonRoleEnded'
  | 'PersonRelationshipCreated'
  | 'PersonRelationshipUpdated'
  | 'PersonRelationshipTerminated'
  | 'PersonAffiliationAdded'
  | 'PersonAffiliationEnded'
  | 'PersonEngagementLinked'
  | 'PersonEngagementUnlinked'
  | 'PersonPhotoUpdated'
  | 'PersonExpertiseUpdated'
  | 'PersonImportanceLevelChanged'

// ============================================================================
// ENGAGEMENT EVENTS
// ============================================================================

export type EngagementEventType =
  | 'EngagementCreated'
  | 'EngagementUpdated'
  | 'EngagementArchived'
  | 'EngagementRestored'
  | 'EngagementDeleted'
  | 'EngagementParticipantAdded'
  | 'EngagementParticipantRemoved'
  | 'EngagementParticipantRoleChanged'
  | 'EngagementAgendaItemAdded'
  | 'EngagementAgendaItemUpdated'
  | 'EngagementAgendaItemRemoved'
  | 'EngagementStatusChanged'
  | 'EngagementRescheduled'
  | 'EngagementCancelled'
  | 'EngagementCompleted'
  | 'EngagementDocumentAttached'
  | 'EngagementDocumentRemoved'
  | 'EngagementPositionLinked'
  | 'EngagementPositionUnlinked'

// ============================================================================
// RELATIONSHIP EVENTS
// ============================================================================

export type RelationshipEventType =
  | 'RelationshipCreated'
  | 'RelationshipUpdated'
  | 'RelationshipTerminated'
  | 'RelationshipStrengthChanged'
  | 'RelationshipMetadataUpdated'
  | 'RelationshipStatusChanged'

// ============================================================================
// TASK EVENTS
// ============================================================================

export type TaskEventType =
  | 'TaskCreated'
  | 'TaskUpdated'
  | 'TaskArchived'
  | 'TaskRestored'
  | 'TaskDeleted'
  | 'TaskStatusChanged'
  | 'TaskAssigned'
  | 'TaskUnassigned'
  | 'TaskReassigned'
  | 'TaskPriorityChanged'
  | 'TaskDeadlineChanged'
  | 'TaskWorkflowStageChanged'
  | 'TaskCommentAdded'
  | 'TaskAttachmentAdded'
  | 'TaskAttachmentRemoved'

// ============================================================================
// COMMITMENT EVENTS
// ============================================================================

export type CommitmentEventType =
  | 'CommitmentCreated'
  | 'CommitmentUpdated'
  | 'CommitmentArchived'
  | 'CommitmentRestored'
  | 'CommitmentDeleted'
  | 'CommitmentStatusChanged'
  | 'CommitmentAssigned'
  | 'CommitmentDeadlineChanged'
  | 'CommitmentPriorityChanged'
  | 'CommitmentEvidenceAdded'
  | 'CommitmentEvidenceRemoved'
  | 'CommitmentFollowUpScheduled'

// ============================================================================
// DOCUMENT EVENTS
// ============================================================================

export type DocumentEventType =
  | 'DocumentCreated'
  | 'DocumentUpdated'
  | 'DocumentArchived'
  | 'DocumentRestored'
  | 'DocumentDeleted'
  | 'DocumentVersionCreated'
  | 'DocumentClassificationChanged'
  | 'DocumentLinkedToEntity'
  | 'DocumentUnlinkedFromEntity'
  | 'DocumentShared'
  | 'DocumentAccessRevoked'

// ============================================================================
// MOU EVENTS
// ============================================================================

export type MOUEventType =
  | 'MOUCreated'
  | 'MOUUpdated'
  | 'MOUArchived'
  | 'MOURestored'
  | 'MOUDeleted'
  | 'MOUStatusChanged'
  | 'MOURenewalInitiated'
  | 'MOURenewalCompleted'
  | 'MOUExpired'
  | 'MOUTerminated'
  | 'MOUSignatoryAdded'
  | 'MOUSignatoryRemoved'
  | 'MOUVersionCreated'

// ============================================================================
// ALL EVENT TYPES
// ============================================================================

export type EventType =
  | PersonEventType
  | EngagementEventType
  | RelationshipEventType
  | TaskEventType
  | CommitmentEventType
  | DocumentEventType
  | MOUEventType

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Metadata associated with each event
 */
export interface EventMetadata {
  /** Unique request/operation identifier */
  request_id?: string
  /** Client application name/version */
  client?: string
  /** Feature flag context */
  feature_flags?: Record<string, boolean>
  /** Additional context-specific data */
  [key: string]: unknown
}

/**
 * Change tracking for update events
 */
export interface EventChanges {
  [field: string]: {
    old: unknown
    new: unknown
  }
}

/**
 * Domain event - immutable record of state change
 */
export interface DomainEvent {
  /** Unique event identifier */
  id: string
  /** Event type (e.g., 'PersonCreated', 'EngagementUpdated') */
  event_type: EventType
  /** Category for filtering and routing */
  event_category: EventCategory
  /** Schema version for this event type */
  event_version: number
  /** The entity category this event belongs to */
  aggregate_type: AggregateType
  /** The specific entity this event belongs to */
  aggregate_id: string
  /** Optimistic concurrency control version */
  aggregate_version: number
  /** Event-specific data payload */
  payload: Record<string, unknown>
  /** Additional context and metadata */
  metadata: EventMetadata
  /** Field changes for update events */
  changes: EventChanges | null
  /** User who caused the event */
  actor_id: string | null
  /** Actor's role at time of action */
  actor_role: string | null
  /** Actor's IP address */
  actor_ip: string | null
  /** Actor's user agent */
  actor_user_agent: string | null
  /** Groups related events across aggregates */
  correlation_id: string | null
  /** The event that caused this event */
  causation_id: string | null
  /** When the event occurred */
  created_at: string
}

/**
 * Aggregate snapshot - point-in-time state cache
 */
export interface AggregateSnapshot {
  id: string
  aggregate_type: AggregateType
  aggregate_id: string
  aggregate_version: number
  state: Record<string, unknown>
  created_at: string
}

/**
 * Event stream - organized collection of events
 */
export interface EventStream {
  stream_name: string
  aggregate_type: AggregateType
  description: string | null
  created_at: string
  last_event_at: string | null
  event_count: number
}

/**
 * Stream subscription for projections
 */
export interface StreamSubscription {
  id: string
  subscription_name: string
  stream_name: string | null
  event_types: EventType[] | null
  last_processed_event_id: string | null
  last_processed_at: string | null
  checkpoint: number
  status: 'active' | 'paused' | 'stopped'
  created_at: string
  updated_at: string
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Request to append a new event
 */
export interface AppendEventRequest {
  event_type: EventType
  event_category: EventCategory
  aggregate_type: AggregateType
  aggregate_id: string
  payload: Record<string, unknown>
  changes?: EventChanges | null
  metadata?: EventMetadata
  correlation_id?: string
  causation_id?: string
  idempotency_key?: string
  event_version?: number
}

/**
 * Query parameters for fetching events
 */
export interface GetEventsParams {
  aggregate_type: AggregateType
  aggregate_id: string
  from_version?: number
  to_version?: number
  limit?: number
}

/**
 * Query for events by correlation ID
 */
export interface GetCorrelatedEventsParams {
  correlation_id: string
}

/**
 * Parameters for rebuilding aggregate state
 */
export interface RebuildStateParams {
  aggregate_type: AggregateType
  aggregate_id: string
  target_version?: number
}

/**
 * Time-travel query parameters
 */
export interface GetStateAtTimeParams {
  aggregate_type: AggregateType
  aggregate_id: string
  timestamp: string
}

/**
 * Aggregate history query parameters
 */
export interface GetHistoryParams {
  aggregate_type: AggregateType
  aggregate_id: string
  limit?: number
  offset?: number
}

/**
 * Simplified history entry for display
 */
export interface HistoryEntry {
  event_id: string
  event_type: EventType
  event_category: EventCategory
  aggregate_version: number
  changes: EventChanges | null
  actor_id: string | null
  actor_role: string | null
  created_at: string
}

/**
 * Response from appending an event
 */
export interface AppendEventResponse {
  event: DomainEvent
}

/**
 * Response from fetching events
 */
export interface GetEventsResponse {
  events: DomainEvent[]
  total_count: number
}

/**
 * Response from rebuilding state
 */
export interface RebuildStateResponse {
  state: Record<string, unknown>
  version: number
  last_event_id: string | null
}

/**
 * Response from getting history
 */
export interface GetHistoryResponse {
  history: HistoryEntry[]
  total_count: number
  has_more: boolean
}

// ============================================================================
// AGGREGATE STATS
// ============================================================================

/**
 * Statistics for an aggregate
 */
export interface AggregateStats {
  aggregate_type: AggregateType
  aggregate_id: string
  event_count: number
  first_event_at: string
  last_event_at: string
  current_version: number
}

/**
 * Event type distribution statistics
 */
export interface EventTypeStats {
  event_type: EventType
  event_category: EventCategory
  event_count: number
  aggregate_count: number
  last_occurrence: string
}

// ============================================================================
// EVENT HELPERS
// ============================================================================

/**
 * Helper to create a person event payload
 */
export interface PersonEventPayload {
  name_en?: string
  name_ar?: string
  title_en?: string
  title_ar?: string
  email?: string
  phone?: string
  biography_en?: string
  biography_ar?: string
  photo_url?: string
  expertise_areas?: string[]
  languages?: string[]
  importance_level?: number
  linkedin_url?: string
  twitter_url?: string
  notes?: string
  [key: string]: unknown
}

/**
 * Helper to create an engagement event payload
 */
export interface EngagementEventPayload {
  name_en?: string
  name_ar?: string
  description_en?: string
  description_ar?: string
  engagement_type?:
    | 'meeting'
    | 'consultation'
    | 'coordination'
    | 'workshop'
    | 'conference'
    | 'site_visit'
    | 'ceremony'
  engagement_category?: 'bilateral' | 'multilateral' | 'regional' | 'internal'
  location_en?: string
  location_ar?: string
  start_date?: string
  end_date?: string
  status?: string
  [key: string]: unknown
}

/**
 * Helper to create a relationship event payload
 */
export interface RelationshipEventPayload {
  source_id?: string
  target_id?: string
  relationship_type?: string
  strength?: number
  notes_en?: string
  notes_ar?: string
  effective_from?: string
  effective_to?: string
  status?: 'active' | 'historical' | 'terminated'
  metadata?: Record<string, unknown>
  [key: string]: unknown
}

/**
 * Helper to create a task event payload
 */
export interface TaskEventPayload {
  title_en?: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  status?: 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  assignee_id?: string
  deadline?: string
  workflow_stage?: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
  [key: string]: unknown
}

// ============================================================================
// EVENT COMMAND TYPES (for CQRS)
// ============================================================================

/**
 * Base command interface
 */
export interface BaseCommand {
  aggregate_type: AggregateType
  aggregate_id?: string // Optional for create commands
  correlation_id?: string
  idempotency_key?: string
}

/**
 * Create person command
 */
export interface CreatePersonCommand extends BaseCommand {
  aggregate_type: 'person'
  data: PersonEventPayload
}

/**
 * Update person command
 */
export interface UpdatePersonCommand extends BaseCommand {
  aggregate_type: 'person'
  aggregate_id: string
  data: Partial<PersonEventPayload>
  expected_version?: number
}

/**
 * Create engagement command
 */
export interface CreateEngagementCommand extends BaseCommand {
  aggregate_type: 'engagement'
  data: EngagementEventPayload
}

/**
 * Update engagement command
 */
export interface UpdateEngagementCommand extends BaseCommand {
  aggregate_type: 'engagement'
  aggregate_id: string
  data: Partial<EngagementEventPayload>
  expected_version?: number
}

/**
 * Create relationship command
 */
export interface CreateRelationshipCommand extends BaseCommand {
  aggregate_type: 'relationship'
  data: RelationshipEventPayload
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Reconstructed aggregate state with metadata
 */
export interface AggregateState<T = Record<string, unknown>> {
  data: T
  version: number
  last_event_id: string | null
  last_event_type: EventType | null
  last_modified_at: string | null
  last_modified_by: string | null
  is_archived?: boolean
  archived_at?: string
}

/**
 * Time-travel result
 */
export interface TimeTravelResult<T = Record<string, unknown>> {
  state: AggregateState<T>
  as_of: string
  events_applied: number
}

/**
 * Event subscription callback
 */
export type EventSubscriptionCallback = (event: DomainEvent) => void | Promise<void>

/**
 * Event filter for subscriptions
 */
export interface EventFilter {
  aggregate_types?: AggregateType[]
  event_types?: EventType[]
  event_categories?: EventCategory[]
  aggregate_ids?: string[]
  actor_ids?: string[]
  correlation_id?: string
  from_timestamp?: string
  to_timestamp?: string
}
