/**
 * Calendar Repository
 * @module domains/calendar/repositories/calendar.repository
 *
 * Plain function exports for all calendar-related API operations.
 * Uses the shared apiClient for auth, base URL, and error handling.
 */

import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '@/lib/api-client'
import type {
  CalendarEventsFilters,
  CalendarEventsResponse,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
} from '../types'
import type {
  ConflictCheckRequest,
  ConflictCheckResponse,
  ConflictsListResponse,
  ConflictListFilters,
  ReschedulingSuggestionRequest,
  ReschedulingSuggestionResponse,
  ReschedulingSuggestion,
  CreateScenarioRequest,
  WhatIfScenario,
  BulkRescheduleRequest,
  BulkRescheduleResponse,
  ResolveConflictRequest,
} from '@/types/calendar-conflict.types'
import type {
  CreateRecurringEventInput,
  CreateRecurringEventResponse,
  EventSeries,
  SeriesOccurrencesResponse,
  UpdateSeriesRequest,
  DeleteOccurrenceRequest,
  CreateExceptionInput,
  SeriesException,
  EventNotification,
} from '@/types/recurrence.types'

// ============================================================================
// Calendar Events
// ============================================================================

/**
 * Fetch calendar events with filters.
 */
export async function getCalendarEvents(
  filters?: CalendarEventsFilters,
): Promise<CalendarEventsResponse> {
  const params = new URLSearchParams()
  if (filters?.start_date) params.append('start_date', filters.start_date)
  if (filters?.end_date) params.append('end_date', filters.end_date)
  if (filters?.event_type) params.append('event_type', filters.event_type)
  if (filters?.dossier_id) params.append('dossier_id', filters.dossier_id)
  if (filters?.status) params.append('status', filters.status)

  return apiGet<CalendarEventsResponse>(`/calendar-get?${params.toString()}`)
}

/**
 * Create a new calendar event.
 */
export async function createCalendarEvent(
  input: CreateCalendarEventInput,
): Promise<unknown> {
  return apiPost('/calendar-create', input)
}

/**
 * Update a calendar event.
 */
export async function updateCalendarEvent(
  { entryId, ...updates }: UpdateCalendarEventInput,
): Promise<unknown> {
  return apiPatch(`/calendar-update?entryId=${entryId}`, updates)
}

// ============================================================================
// Conflict Detection
// ============================================================================

const CONFLICTS_PATH = '/calendar-conflicts'

/**
 * Check for conflicts for a given event configuration.
 */
export async function checkConflicts(
  request: ConflictCheckRequest,
): Promise<ConflictCheckResponse> {
  return apiPost<ConflictCheckResponse>(`${CONFLICTS_PATH}/check`, request)
}

/**
 * Get existing conflicts with pagination.
 */
export async function getConflicts(
  filters?: ConflictListFilters,
): Promise<ConflictsListResponse> {
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    })
  }
  return apiGet<ConflictsListResponse>(`${CONFLICTS_PATH}?${params.toString()}`)
}

/**
 * Get conflicts for a specific event.
 */
export async function getEventConflicts(
  eventId: string,
): Promise<ConflictsListResponse> {
  return apiGet<ConflictsListResponse>(`${CONFLICTS_PATH}?event_id=${eventId}`)
}

// ============================================================================
// Rescheduling Suggestions
// ============================================================================

/**
 * Generate rescheduling suggestions for an event.
 */
export async function generateSuggestions(
  request: ReschedulingSuggestionRequest,
): Promise<ReschedulingSuggestionResponse> {
  return apiPost<ReschedulingSuggestionResponse>(`${CONFLICTS_PATH}/suggest`, request)
}

/**
 * Get stored suggestions for an event or conflict.
 */
export async function getSuggestions(
  params: { event_id?: string; conflict_id?: string },
): Promise<{ suggestions: ReschedulingSuggestion[] }> {
  const searchParams = new URLSearchParams()
  if (params.event_id) searchParams.append('event_id', params.event_id)
  if (params.conflict_id) searchParams.append('conflict_id', params.conflict_id)
  return apiGet<{ suggestions: ReschedulingSuggestion[] }>(
    `${CONFLICTS_PATH}/suggestions?${searchParams.toString()}`,
  )
}

/**
 * Accept a rescheduling suggestion and resolve conflict.
 */
export async function acceptSuggestion(
  conflictId: string,
  suggestionId: string,
): Promise<{ success: boolean }> {
  return apiPut<{ success: boolean }>(`${CONFLICTS_PATH}/resolve`, {
    conflict_id: conflictId,
    resolution_status: 'auto_resolved',
    accepted_suggestion_id: suggestionId,
  })
}

// ============================================================================
// Conflict Resolution
// ============================================================================

/**
 * Resolve a conflict manually.
 */
export async function resolveConflict(
  request: ResolveConflictRequest,
): Promise<{ success: boolean }> {
  return apiPut<{ success: boolean }>(`${CONFLICTS_PATH}/resolve`, request)
}

// ============================================================================
// What-If Scenarios
// ============================================================================

/**
 * Create a what-if scenario.
 */
export async function createScenario(
  request: CreateScenarioRequest,
): Promise<{ scenario: WhatIfScenario }> {
  return apiPost<{ scenario: WhatIfScenario }>(`${CONFLICTS_PATH}/scenarios`, request)
}

/**
 * Get user's what-if scenarios.
 */
export async function getScenarios(
  status?: string,
): Promise<{ scenarios: WhatIfScenario[] }> {
  const params = status ? `?status=${status}` : ''
  return apiGet<{ scenarios: WhatIfScenario[] }>(`${CONFLICTS_PATH}/scenarios${params}`)
}

/**
 * Apply a what-if scenario.
 */
export async function applyScenario(
  scenarioId: string,
): Promise<{ success: boolean; results: unknown[] }> {
  return apiPost<{ success: boolean; results: unknown[] }>(`${CONFLICTS_PATH}/apply-scenario`, {
    scenario_id: scenarioId,
  })
}

/**
 * Delete a what-if scenario.
 */
export async function deleteScenario(
  scenarioId: string,
): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(`${CONFLICTS_PATH}/scenarios/${scenarioId}`)
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Generate bulk rescheduling plan.
 */
export async function bulkReschedule(
  request: BulkRescheduleRequest,
): Promise<BulkRescheduleResponse> {
  return apiPost<BulkRescheduleResponse>(`${CONFLICTS_PATH}/bulk-reschedule`, request)
}

// ============================================================================
// Recurring Events
// ============================================================================

const RECURRING_PATH = '/recurring-events'

/**
 * Create a new recurring event series.
 */
export async function createRecurringEvent(
  input: CreateRecurringEventInput,
): Promise<CreateRecurringEventResponse> {
  return apiPost<CreateRecurringEventResponse>(`${RECURRING_PATH}/create`, input)
}

/**
 * Get an event series by ID.
 */
export async function getEventSeries(seriesId: string): Promise<EventSeries> {
  return apiGet<EventSeries>(`${RECURRING_PATH}/series/${seriesId}`)
}

/**
 * Get series occurrences with exceptions.
 */
export async function getSeriesOccurrences(
  seriesId: string,
  options?: { startDate?: string; endDate?: string; limit?: number },
): Promise<SeriesOccurrencesResponse> {
  const params = new URLSearchParams()
  if (options?.startDate) params.append('start_date', options.startDate)
  if (options?.endDate) params.append('end_date', options.endDate)
  if (options?.limit) params.append('limit', options.limit.toString())
  return apiGet<SeriesOccurrencesResponse>(
    `${RECURRING_PATH}/series/${seriesId}/occurrences?${params}`,
  )
}

/**
 * Update a recurring event series.
 */
export async function updateSeries(
  request: UpdateSeriesRequest,
): Promise<{ updated_count: number }> {
  return apiPut<{ updated_count: number }>(
    `${RECURRING_PATH}/series/${request.series_id}/update`,
    request,
  )
}

/**
 * Delete occurrence(s) from a series.
 */
export async function deleteOccurrences(
  request: DeleteOccurrenceRequest,
): Promise<{ deleted_count: number }> {
  return apiDelete<{ deleted_count: number }>(
    `${RECURRING_PATH}/series/${request.series_id}/delete`,
  )
}

/**
 * Add an exception to a series.
 */
export async function createException(
  input: CreateExceptionInput,
): Promise<SeriesException> {
  return apiPost<SeriesException>(
    `${RECURRING_PATH}/series/${input.series_id}/exceptions`,
    input,
  )
}

/**
 * Remove an exception.
 */
export async function removeException(
  seriesId: string,
  exceptionDate: string,
): Promise<void> {
  await apiDelete(`${RECURRING_PATH}/series/${seriesId}/exceptions/${exceptionDate}`)
}

/**
 * Get user's event notifications.
 */
export async function getEventNotifications(
  options?: { unreadOnly?: boolean; limit?: number },
): Promise<{ notifications: EventNotification[]; unread_count: number }> {
  const params = new URLSearchParams()
  if (options?.unreadOnly) params.append('unread_only', 'true')
  if (options?.limit) params.append('limit', options.limit.toString())
  return apiGet<{ notifications: EventNotification[]; unread_count: number }>(
    `${RECURRING_PATH}/notifications?${params}`,
  )
}

/**
 * Mark notification as read.
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  await apiPut(`${RECURRING_PATH}/notifications/${notificationId}/read`, {})
}

/**
 * Mark all notifications as read.
 */
export async function markAllNotificationsRead(): Promise<void> {
  await apiPut(`${RECURRING_PATH}/notifications/read-all`, {})
}

/**
 * Calculate next occurrences for a recurrence rule.
 */
export async function getNextOccurrences(
  ruleId: string,
  options?: { startDate?: string; count?: number; maxDate?: string },
): Promise<Array<{ date: string; number: number }>> {
  const params = new URLSearchParams()
  if (options?.startDate) params.append('start_date', options.startDate)
  if (options?.count) params.append('count', options.count.toString())
  if (options?.maxDate) params.append('max_date', options.maxDate)
  return apiGet<Array<{ date: string; number: number }>>(
    `${RECURRING_PATH}/rules/${ruleId}/occurrences?${params}`,
  )
}
