/**
 * Event Store Service
 *
 * API client for event sourcing operations.
 * Provides methods to append events, fetch event history, and rebuild aggregate state.
 */

import { supabase } from '@/lib/supabase'
import type {
  DomainEvent,
  AggregateType,
  EventCategory,
  EventType,
  AppendEventRequest,
  GetEventsResponse,
  GetHistoryResponse,
  HistoryEntry,
  EventChanges,
  EventMetadata,
  AggregateSnapshot,
  AggregateStats,
  EventTypeStats,
} from '@/types/event-sourcing.types'

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/event-store`

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
 * Build query string from parameters
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
 * Handle API response
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message_en: 'Unknown error' } }))
    throw new Error(error.error?.message_en || `HTTP ${response.status}`)
  }
  return response.json()
}

// ============================================================================
// Event Operations
// ============================================================================

/**
 * Append a new event to the event store
 */
export async function appendEvent(request: AppendEventRequest): Promise<{ event: DomainEvent }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${EDGE_FUNCTION_URL}/events`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  })

  return handleResponse(response)
}

/**
 * Get events for an aggregate
 */
export async function getAggregateEvents(
  aggregateType: AggregateType,
  aggregateId: string,
  fromVersion = 0,
  toVersion?: number,
  limit = 1000,
): Promise<GetEventsResponse> {
  const headers = await getAuthHeaders()
  const queryParams = buildQueryString({
    aggregate_type: aggregateType,
    aggregate_id: aggregateId,
    from_version: fromVersion,
    to_version: toVersion,
    limit,
  })

  const response = await fetch(`${EDGE_FUNCTION_URL}/events?${queryParams}`, {
    method: 'GET',
    headers,
  })

  return handleResponse(response)
}

/**
 * Get events by correlation ID (for tracking related events across aggregates)
 */
export async function getCorrelatedEvents(
  correlationId: string,
): Promise<{ events: DomainEvent[]; correlation_id: string }> {
  const headers = await getAuthHeaders()
  const queryParams = buildQueryString({ correlation_id: correlationId })

  const response = await fetch(`${EDGE_FUNCTION_URL}/events/correlated?${queryParams}`, {
    method: 'GET',
    headers,
  })

  return handleResponse(response)
}

// ============================================================================
// State Operations
// ============================================================================

/**
 * Rebuild aggregate state from events
 */
export async function rebuildAggregateState(
  aggregateType: AggregateType,
  aggregateId: string,
  targetVersion?: number,
): Promise<{ state: Record<string, unknown>; version: number; last_event_id: string | null }> {
  const headers = await getAuthHeaders()
  const queryParams = buildQueryString({
    aggregate_type: aggregateType,
    aggregate_id: aggregateId,
    target_version: targetVersion,
  })

  const response = await fetch(`${EDGE_FUNCTION_URL}/state?${queryParams}`, {
    method: 'GET',
    headers,
  })

  return handleResponse(response)
}

/**
 * Get state at a specific point in time (time travel)
 */
export async function getStateAtTime(
  aggregateType: AggregateType,
  aggregateId: string,
  timestamp: string,
): Promise<{ state: Record<string, unknown> | null; as_of: string }> {
  const headers = await getAuthHeaders()
  const queryParams = buildQueryString({
    aggregate_type: aggregateType,
    aggregate_id: aggregateId,
    timestamp,
  })

  const response = await fetch(`${EDGE_FUNCTION_URL}/state/at-time?${queryParams}`, {
    method: 'GET',
    headers,
  })

  return handleResponse(response)
}

// ============================================================================
// History Operations
// ============================================================================

/**
 * Get aggregate history (timeline view)
 */
export async function getAggregateHistory(
  aggregateType: AggregateType,
  aggregateId: string,
  limit = 50,
  offset = 0,
): Promise<GetHistoryResponse> {
  const headers = await getAuthHeaders()
  const queryParams = buildQueryString({
    aggregate_type: aggregateType,
    aggregate_id: aggregateId,
    limit,
    offset,
  })

  const response = await fetch(`${EDGE_FUNCTION_URL}/history?${queryParams}`, {
    method: 'GET',
    headers,
  })

  return handleResponse(response)
}

// ============================================================================
// Snapshot Operations
// ============================================================================

/**
 * Create a snapshot of current aggregate state
 */
export async function createSnapshot(
  aggregateType: AggregateType,
  aggregateId: string,
  state: Record<string, unknown>,
): Promise<{ snapshot: AggregateSnapshot }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${EDGE_FUNCTION_URL}/snapshots`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      aggregate_type: aggregateType,
      aggregate_id: aggregateId,
      state,
    }),
  })

  return handleResponse(response)
}

// ============================================================================
// Statistics Operations
// ============================================================================

/**
 * Get statistics for a specific aggregate
 */
export async function getAggregateStats(
  aggregateType: AggregateType,
  aggregateId: string,
): Promise<AggregateStats | null> {
  const headers = await getAuthHeaders()
  const queryParams = buildQueryString({
    aggregate_type: aggregateType,
    aggregate_id: aggregateId,
  })

  const response = await fetch(`${EDGE_FUNCTION_URL}/stats?${queryParams}`, {
    method: 'GET',
    headers,
  })

  return handleResponse(response)
}

/**
 * Get event type distribution statistics
 */
export async function getEventTypeStats(): Promise<{ event_types: EventTypeStats[] }> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${EDGE_FUNCTION_URL}/stats`, {
    method: 'GET',
    headers,
  })

  return handleResponse(response)
}

// ============================================================================
// Convenience Methods
// ============================================================================

/**
 * Generate a unique idempotency key
 */
export function generateIdempotencyKey(
  operation: string,
  aggregateId: string,
  timestamp = Date.now(),
): string {
  return `${operation}-${aggregateId}-${timestamp}`
}

/**
 * Create changes object for update events
 */
export function createChanges<T extends Record<string, unknown>>(
  oldValues: T,
  newValues: Partial<T>,
): EventChanges {
  const changes: EventChanges = {}

  for (const key of Object.keys(newValues) as Array<keyof T>) {
    if (oldValues[key] !== newValues[key]) {
      changes[key as string] = {
        old: oldValues[key],
        new: newValues[key],
      }
    }
  }

  return changes
}

/**
 * Check if there are actual changes between old and new values
 */
export function hasChanges<T extends Record<string, unknown>>(
  oldValues: T,
  newValues: Partial<T>,
): boolean {
  for (const key of Object.keys(newValues) as Array<keyof T>) {
    if (oldValues[key] !== newValues[key]) {
      return true
    }
  }
  return false
}

// ============================================================================
// Event Factory Functions
// ============================================================================

/**
 * Create a PersonCreated event request
 */
export function createPersonCreatedEvent(
  personId: string,
  data: Record<string, unknown>,
  correlationId?: string,
  idempotencyKey?: string,
): AppendEventRequest {
  return {
    event_type: 'PersonCreated',
    event_category: 'lifecycle',
    aggregate_type: 'person',
    aggregate_id: personId,
    payload: data,
    correlation_id: correlationId,
    idempotency_key: idempotencyKey,
  }
}

/**
 * Create a PersonUpdated event request
 */
export function createPersonUpdatedEvent(
  personId: string,
  changes: EventChanges,
  newValues: Record<string, unknown>,
  correlationId?: string,
  idempotencyKey?: string,
): AppendEventRequest {
  return {
    event_type: 'PersonUpdated',
    event_category: 'update',
    aggregate_type: 'person',
    aggregate_id: personId,
    payload: newValues,
    changes,
    correlation_id: correlationId,
    idempotency_key: idempotencyKey,
  }
}

/**
 * Create an EngagementCreated event request
 */
export function createEngagementCreatedEvent(
  engagementId: string,
  data: Record<string, unknown>,
  correlationId?: string,
  idempotencyKey?: string,
): AppendEventRequest {
  return {
    event_type: 'EngagementCreated',
    event_category: 'lifecycle',
    aggregate_type: 'engagement',
    aggregate_id: engagementId,
    payload: data,
    correlation_id: correlationId,
    idempotency_key: idempotencyKey,
  }
}

/**
 * Create an EngagementUpdated event request
 */
export function createEngagementUpdatedEvent(
  engagementId: string,
  changes: EventChanges,
  newValues: Record<string, unknown>,
  correlationId?: string,
  idempotencyKey?: string,
): AppendEventRequest {
  return {
    event_type: 'EngagementUpdated',
    event_category: 'update',
    aggregate_type: 'engagement',
    aggregate_id: engagementId,
    payload: newValues,
    changes,
    correlation_id: correlationId,
    idempotency_key: idempotencyKey,
  }
}

/**
 * Create a RelationshipCreated event request
 */
export function createRelationshipCreatedEvent(
  relationshipId: string,
  sourceId: string,
  targetId: string,
  relationshipType: string,
  additionalData?: Record<string, unknown>,
  correlationId?: string,
  idempotencyKey?: string,
): AppendEventRequest {
  return {
    event_type: 'RelationshipCreated',
    event_category: 'relationship',
    aggregate_type: 'relationship',
    aggregate_id: relationshipId,
    payload: {
      source_id: sourceId,
      target_id: targetId,
      relationship_type: relationshipType,
      ...additionalData,
    },
    correlation_id: correlationId,
    idempotency_key: idempotencyKey,
  }
}

/**
 * Create a TaskStatusChanged event request
 */
export function createTaskStatusChangedEvent(
  taskId: string,
  oldStatus: string,
  newStatus: string,
  correlationId?: string,
  idempotencyKey?: string,
): AppendEventRequest {
  return {
    event_type: 'TaskStatusChanged',
    event_category: 'status',
    aggregate_type: 'task',
    aggregate_id: taskId,
    payload: {
      old_status: oldStatus,
      new_status: newStatus,
    },
    changes: {
      status: { old: oldStatus, new: newStatus },
    },
    correlation_id: correlationId,
    idempotency_key: idempotencyKey,
  }
}

/**
 * Create an archived event request for any aggregate type
 */
export function createArchivedEvent(
  aggregateType: AggregateType,
  aggregateId: string,
  eventType: EventType,
  reason?: string,
  correlationId?: string,
  idempotencyKey?: string,
): AppendEventRequest {
  return {
    event_type: eventType,
    event_category: 'lifecycle',
    aggregate_type: aggregateType,
    aggregate_id: aggregateId,
    payload: {
      archived: true,
      reason,
    },
    correlation_id: correlationId,
    idempotency_key: idempotencyKey,
  }
}
