/**
 * Shared Kernel - Domain Events
 *
 * Cross-context event contracts for loose coupling between
 * bounded contexts. Events are the primary mechanism for
 * inter-context communication.
 */

// ============================================================================
// Base Event Type
// ============================================================================

/**
 * Base interface for all domain events
 */
export interface DomainEvent<T = unknown> {
  /** Unique event ID */
  id: string
  /** Event type identifier */
  type: string
  /** Event timestamp */
  timestamp: string
  /** Event payload */
  payload: T
  /** Optional correlation ID for tracing */
  correlationId?: string
  /** Source context that emitted the event */
  source: string
  /** Event version for schema evolution */
  version: number
}

/**
 * Create a new domain event
 */
export function createEvent<T>(
  type: string,
  payload: T,
  source: string,
  correlationId?: string,
): DomainEvent<T> {
  return {
    id: crypto.randomUUID(),
    type,
    timestamp: new Date().toISOString(),
    payload,
    source,
    correlationId,
    version: 1,
  }
}

// ============================================================================
// Engagement Context Events
// ============================================================================

export const ENGAGEMENT_EVENTS = {
  CREATED: 'engagement.created',
  UPDATED: 'engagement.updated',
  ARCHIVED: 'engagement.archived',
  STATUS_CHANGED: 'engagement.status_changed',
  PARTICIPANT_ADDED: 'engagement.participant_added',
  PARTICIPANT_REMOVED: 'engagement.participant_removed',
  AGENDA_UPDATED: 'engagement.agenda_updated',
} as const

export interface EngagementCreatedPayload {
  engagementId: string
  name_en: string
  name_ar: string
  engagement_type: string
  start_date: string
  end_date: string
  host_country_id?: string
}

export interface EngagementUpdatedPayload {
  engagementId: string
  changes: Record<string, { old: unknown; new: unknown }>
}

export interface EngagementStatusChangedPayload {
  engagementId: string
  previousStatus: string
  newStatus: string
}

export interface ParticipantAddedPayload {
  engagementId: string
  participantId: string
  participantType: string
  participantDossierId?: string
  role: string
}

export interface ParticipantRemovedPayload {
  engagementId: string
  participantId: string
}

// ============================================================================
// Document Context Events
// ============================================================================

export const DOCUMENT_EVENTS = {
  UPLOADED: 'document.uploaded',
  UPDATED: 'document.updated',
  ARCHIVED: 'document.archived',
  VERSION_CREATED: 'document.version_created',
  LINKED: 'document.linked',
  UNLINKED: 'document.unlinked',
  REVERTED: 'document.reverted',
} as const

export interface DocumentUploadedPayload {
  documentId: string
  title_en: string
  title_ar?: string
  category: string
  mimeType: string
  sizeBytes: number
  linkedDossierId?: string
}

export interface DocumentVersionCreatedPayload {
  documentId: string
  versionNumber: number
  changeType: string
  changeSummary?: string
}

export interface DocumentLinkedPayload {
  documentId: string
  dossierId: string
  linkType: string
}

export interface DocumentUnlinkedPayload {
  documentId: string
  dossierId: string
}

// ============================================================================
// Relationship Context Events
// ============================================================================

export const RELATIONSHIP_EVENTS = {
  CREATED: 'relationship.created',
  UPDATED: 'relationship.updated',
  DELETED: 'relationship.deleted',
  HEALTH_UPDATED: 'relationship.health_updated',
  ALERT_TRIGGERED: 'relationship.alert_triggered',
  ALERT_DISMISSED: 'relationship.alert_dismissed',
} as const

export interface RelationshipCreatedPayload {
  relationshipId: string
  sourceDossierId: string
  targetDossierId: string
  relationshipType: string
}

export interface RelationshipUpdatedPayload {
  relationshipId: string
  changes: Record<string, { old: unknown; new: unknown }>
}

export interface RelationshipDeletedPayload {
  relationshipId: string
  sourceDossierId: string
  targetDossierId: string
}

export interface HealthUpdatedPayload {
  relationshipId: string
  previousScore: number | null
  newScore: number | null
  trend: string
  healthLevel: string
}

export interface AlertTriggeredPayload {
  alertId: string
  relationshipId: string
  alertType: string
  severity: string
}

// ============================================================================
// Event Type Union
// ============================================================================

export type EngagementEvent =
  | DomainEvent<EngagementCreatedPayload>
  | DomainEvent<EngagementUpdatedPayload>
  | DomainEvent<EngagementStatusChangedPayload>
  | DomainEvent<ParticipantAddedPayload>
  | DomainEvent<ParticipantRemovedPayload>

export type DocumentEvent =
  | DomainEvent<DocumentUploadedPayload>
  | DomainEvent<DocumentVersionCreatedPayload>
  | DomainEvent<DocumentLinkedPayload>
  | DomainEvent<DocumentUnlinkedPayload>

export type RelationshipEvent =
  | DomainEvent<RelationshipCreatedPayload>
  | DomainEvent<RelationshipUpdatedPayload>
  | DomainEvent<RelationshipDeletedPayload>
  | DomainEvent<HealthUpdatedPayload>
  | DomainEvent<AlertTriggeredPayload>

export type AnyDomainEvent = EngagementEvent | DocumentEvent | RelationshipEvent
