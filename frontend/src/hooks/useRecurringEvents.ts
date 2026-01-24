/**
 * Recurring Events Hooks
 * @module hooks/useRecurringEvents
 * @feature recurring-event-patterns
 *
 * TanStack Query hooks for managing recurring calendar events and series.
 *
 * @description
 * This module provides comprehensive React hooks for recurring event management:
 * - Create recurring event series with RFC 5545 recurrence rules
 * - Fetch series with generated occurrences
 * - Update series with scope selection (this, following, all)
 * - Delete occurrences with scope selection
 * - Add exceptions to series (cancellations, modifications)
 * - Get event notifications for upcoming occurrences
 *
 * All hooks handle authentication and cache invalidation automatically.
 *
 * @example
 * // Create weekly recurring meeting
 * const { mutate: createRecurring } = useCreateRecurringEvent();
 * createRecurring({
 *   event_data: {
 *     title_en: 'Weekly Team Sync',
 *     start_datetime: '2024-01-08T09:00:00Z',
 *     end_datetime: '2024-01-08T10:00:00Z',
 *   },
 *   recurrence_rule: 'FREQ=WEEKLY;BYDAY=MO',
 *   recurrence_end_date: '2024-12-31',
 * });
 *
 * @example
 * // Update all future occurrences
 * const { mutate: updateSeries } = useUpdateSeries();
 * updateSeries({
 *   series_id: 'series-uuid',
 *   scope: 'following',
 *   occurrence_date: '2024-02-01',
 *   updates: { start_datetime: '2024-02-01T10:00:00Z' },
 * });
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
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
  SeriesEditScope,
} from '@/types/recurrence.types'

const RECURRING_EVENTS_BASE_URL = '/functions/v1/recurring-events'

/**
 * Get the base URL for recurring events API calls
 *
 * @description
 * Constructs full Edge Function URL for recurring events endpoints.
 *
 * @param path - API endpoint path
 * @returns Full URL string
 * @private
 */
function getApiUrl(path: string): string {
  return `${supabase.supabaseUrl}${RECURRING_EVENTS_BASE_URL}${path}`
}

/**
 * Get auth headers for recurring events API calls
 *
 * @description
 * Retrieves current session token and formats authorization headers.
 *
 * @returns Promise resolving to headers object
 * @throws {Error} If user is not authenticated
 * @private
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Not authenticated')
  }
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
}

// ==============================================================================
// CREATE RECURRING EVENT
// ==============================================================================

/**
 * Hook to create a new recurring event series
 *
 * @description
 * Creates a new recurring event series with RFC 5545-compliant recurrence rules.
 * Generates initial occurrences and stores the series metadata. On success,
 * invalidates calendar events and series caches.
 *
 * @returns TanStack Mutation result with mutate function accepting CreateRecurringEventInput
 *
 * @example
 * // Create daily standup for weekdays
 * const { mutate: createRecurring, data } = useCreateRecurringEvent();
 *
 * createRecurring({
 *   event_data: {
 *     title_en: 'Daily Standup',
 *     start_datetime: '2024-01-08T09:00:00Z',
 *     end_datetime: '2024-01-08T09:15:00Z',
 *     dossier_id: 'team-uuid',
 *   },
 *   recurrence_rule: 'FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR',
 *   recurrence_end_date: '2024-12-31',
 *   timezone: 'UTC',
 * });
 *
 * @example
 * // Create monthly review on last Friday
 * const { mutate } = useCreateRecurringEvent();
 * mutate({
 *   event_data: {
 *     title_en: 'Monthly Review',
 *     start_datetime: '2024-01-26T14:00:00Z',
 *     end_datetime: '2024-01-26T16:00:00Z',
 *   },
 *   recurrence_rule: 'FREQ=MONTHLY;BYDAY=-1FR',
 *   max_occurrences: 12,
 * });
 */
export function useCreateRecurringEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateRecurringEventInput): Promise<CreateRecurringEventResponse> => {
      const headers = await getAuthHeaders()
      const response = await fetch(getApiUrl('/create'), {
        method: 'POST',
        headers,
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create recurring event')
      }

      return await response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      queryClient.invalidateQueries({ queryKey: ['event-series'] })
    },
  })
}

// ==============================================================================
// GET SERIES
// ==============================================================================

/**
 * Hook to fetch an event series by ID
 *
 * @description
 * Fetches complete series metadata including recurrence rules, status, and settings.
 * Query is automatically disabled if seriesId is undefined.
 *
 * @param seriesId - UUID of the series (undefined disables query)
 * @returns TanStack Query result with series details
 *
 * @example
 * // Fetch series details
 * const { data: series, isLoading } = useEventSeries(seriesId);
 */
export function useEventSeries(seriesId: string | undefined) {
  return useQuery({
    queryKey: ['event-series', seriesId],
    queryFn: async (): Promise<EventSeries> => {
      if (!seriesId) throw new Error('Series ID is required')

      const headers = await getAuthHeaders()
      const response = await fetch(getApiUrl(`/series/${seriesId}`), {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch event series')
      }

      return await response.json()
    },
    enabled: !!seriesId,
  })
}

/**
 * Hook to fetch series occurrences with exceptions
 *
 * @description
 * Fetches generated occurrences for a series within an optional date range.
 * Includes exception handling (cancelled or modified occurrences).
 * Query is automatically disabled if seriesId is undefined.
 *
 * @param seriesId - UUID of the series (undefined disables query)
 * @param options - Optional filtering options
 * @param options.startDate - Filter occurrences starting on or after this date (ISO 8601)
 * @param options.endDate - Filter occurrences ending on or before this date (ISO 8601)
 * @param options.limit - Maximum number of occurrences to return
 * @returns TanStack Query result with occurrences array
 *
 * @example
 * // Fetch next 10 occurrences
 * const { data } = useSeriesOccurrences(seriesId, { limit: 10 });
 *
 * @example
 * // Fetch occurrences for a specific month
 * const { data } = useSeriesOccurrences(seriesId, {
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31',
 * });
 */
export function useSeriesOccurrences(
  seriesId: string | undefined,
  options?: {
    startDate?: string
    endDate?: string
    limit?: number
  },
) {
  return useQuery({
    queryKey: ['series-occurrences', seriesId, options],
    queryFn: async (): Promise<SeriesOccurrencesResponse> => {
      if (!seriesId) throw new Error('Series ID is required')

      const params = new URLSearchParams()
      if (options?.startDate) params.append('start_date', options.startDate)
      if (options?.endDate) params.append('end_date', options.endDate)
      if (options?.limit) params.append('limit', options.limit.toString())

      const headers = await getAuthHeaders()
      const response = await fetch(getApiUrl(`/series/${seriesId}/occurrences?${params}`), {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch series occurrences')
      }

      return await response.json()
    },
    enabled: !!seriesId,
  })
}

// ==============================================================================
// UPDATE SERIES
// ==============================================================================

/**
 * Hook to update a recurring event series with scope selection
 *
 * @description
 * Updates a recurring event series with three scope options:
 * - 'this': Update only a specific occurrence
 * - 'following': Update this occurrence and all future occurrences
 * - 'all': Update all occurrences in the series
 *
 * On success, invalidates calendar events, series, and occurrences caches.
 *
 * @returns TanStack Mutation result with mutate function accepting UpdateSeriesRequest
 *
 * @example
 * // Update all future occurrences
 * const { mutate: updateSeries } = useUpdateSeries();
 *
 * updateSeries({
 *   series_id: 'series-uuid',
 *   scope: 'following',
 *   occurrence_date: '2024-02-01',
 *   updates: {
 *     start_datetime: '2024-02-01T10:00:00Z',
 *     end_datetime: '2024-02-01T11:00:00Z',
 *   },
 * });
 *
 * @example
 * // Update entire series
 * const { mutate } = useUpdateSeries();
 * mutate({
 *   series_id: 'series-uuid',
 *   scope: 'all',
 *   updates: { title_en: 'Updated Meeting Title' },
 * });
 */
export function useUpdateSeries() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: UpdateSeriesRequest): Promise<{ updated_count: number }> => {
      const headers = await getAuthHeaders()
      const response = await fetch(getApiUrl(`/series/${request.series_id}/update`), {
        method: 'PUT',
        headers,
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update series')
      }

      return await response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      queryClient.invalidateQueries({ queryKey: ['event-series', variables.series_id] })
      queryClient.invalidateQueries({ queryKey: ['series-occurrences', variables.series_id] })
    },
  })
}

// ==============================================================================
// DELETE OCCURRENCES
// ==============================================================================

/**
 * Hook to delete occurrence(s) from a series with scope selection
 *
 * @description
 * Deletes occurrences from a recurring series with three scope options:
 * - 'this': Delete only a specific occurrence
 * - 'following': Delete this occurrence and all future occurrences
 * - 'all': Delete all occurrences (effectively deletes the series)
 *
 * On success, invalidates calendar events, series, and occurrences caches.
 *
 * @returns TanStack Mutation result with mutate function accepting DeleteOccurrenceRequest
 *
 * @example
 * // Cancel a single occurrence
 * const { mutate: deleteOccurrence } = useDeleteOccurrences();
 *
 * deleteOccurrence({
 *   series_id: 'series-uuid',
 *   scope: 'this',
 *   occurrence_date: '2024-02-01',
 * });
 *
 * @example
 * // End a series early
 * const { mutate } = useDeleteOccurrences();
 * mutate({
 *   series_id: 'series-uuid',
 *   scope: 'following',
 *   occurrence_date: '2024-06-01',
 * });
 */
export function useDeleteOccurrences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: DeleteOccurrenceRequest): Promise<{ deleted_count: number }> => {
      const headers = await getAuthHeaders()
      const response = await fetch(getApiUrl(`/series/${request.series_id}/delete`), {
        method: 'DELETE',
        headers,
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete occurrences')
      }

      return await response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      queryClient.invalidateQueries({ queryKey: ['event-series', variables.series_id] })
      queryClient.invalidateQueries({ queryKey: ['series-occurrences', variables.series_id] })
    },
  })
}

// ==============================================================================
// EXCEPTIONS
// ==============================================================================

/**
 * Hook to add an exception to a recurring series
 *
 * @description
 * Creates an exception to modify, cancel, or reschedule a single occurrence
 * without affecting other occurrences in the series. Exceptions can specify
 * new times, cancellations, or field modifications. On success, invalidates
 * series and occurrences caches.
 *
 * @returns TanStack Mutation result with mutate function accepting CreateExceptionInput
 *
 * @example
 * // Cancel a single occurrence
 * const { mutate: createException } = useCreateException();
 *
 * createException({
 *   series_id: 'series-uuid',
 *   exception_date: '2024-02-15',
 *   exception_type: 'cancelled',
 *   reason: 'Public holiday',
 * });
 *
 * @example
 * // Reschedule a single occurrence
 * const { mutate } = useCreateException();
 * mutate({
 *   series_id: 'series-uuid',
 *   exception_date: '2024-02-20',
 *   exception_type: 'rescheduled',
 *   new_start_datetime: '2024-02-21T10:00:00Z',
 *   new_end_datetime: '2024-02-21T11:00:00Z',
 *   reason: 'Conflict with another meeting',
 * });
 */
export function useCreateException() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateExceptionInput): Promise<SeriesException> => {
      const headers = await getAuthHeaders()
      const response = await fetch(getApiUrl(`/series/${input.series_id}/exceptions`), {
        method: 'POST',
        headers,
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create exception')
      }

      return await response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      queryClient.invalidateQueries({ queryKey: ['series-occurrences', variables.series_id] })
    },
  })
}

/**
 * Remove an exception (restore a cancelled occurrence)
 */
export function useRemoveException() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      seriesId,
      exceptionDate,
    }: {
      seriesId: string
      exceptionDate: string
    }): Promise<void> => {
      const headers = await getAuthHeaders()
      const response = await fetch(getApiUrl(`/series/${seriesId}/exceptions/${exceptionDate}`), {
        method: 'DELETE',
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove exception')
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      queryClient.invalidateQueries({ queryKey: ['series-occurrences', variables.seriesId] })
    },
  })
}

// ==============================================================================
// NOTIFICATIONS
// ==============================================================================

/**
 * Get user's event notifications
 */
export function useEventNotifications(options?: { unreadOnly?: boolean; limit?: number }) {
  return useQuery({
    queryKey: ['event-notifications', options],
    queryFn: async (): Promise<{ notifications: EventNotification[]; unread_count: number }> => {
      const params = new URLSearchParams()
      if (options?.unreadOnly) params.append('unread_only', 'true')
      if (options?.limit) params.append('limit', options.limit.toString())

      const headers = await getAuthHeaders()
      const response = await fetch(getApiUrl(`/notifications?${params}`), {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch notifications')
      }

      return await response.json()
    },
  })
}

/**
 * Mark notification as read
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string): Promise<void> => {
      const headers = await getAuthHeaders()
      const response = await fetch(getApiUrl(`/notifications/${notificationId}/read`), {
        method: 'PUT',
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to mark notification as read')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-notifications'] })
    },
  })
}

/**
 * Mark all notifications as read
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<void> => {
      const headers = await getAuthHeaders()
      const response = await fetch(getApiUrl('/notifications/read-all'), {
        method: 'PUT',
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to mark all notifications as read')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-notifications'] })
    },
  })
}

// ==============================================================================
// HELPER HOOKS
// ==============================================================================

/**
 * Check if an event is part of a recurring series
 */
export function useIsRecurringEvent(eventId: string | undefined) {
  return useQuery({
    queryKey: ['event-is-recurring', eventId],
    queryFn: async (): Promise<{ is_recurring: boolean; series_id?: string }> => {
      if (!eventId) return { is_recurring: false }

      const { data, error } = await supabase
        .from('calendar_events')
        .select('series_id')
        .eq('id', eventId)
        .single()

      if (error) throw error

      return {
        is_recurring: !!data?.series_id,
        series_id: data?.series_id,
      }
    },
    enabled: !!eventId,
  })
}

/**
 * Calculate next occurrences for a recurrence rule
 */
export function useNextOccurrences(
  ruleId: string | undefined,
  options?: {
    startDate?: string
    count?: number
    maxDate?: string
  },
) {
  return useQuery({
    queryKey: ['next-occurrences', ruleId, options],
    queryFn: async (): Promise<Array<{ date: string; number: number }>> => {
      if (!ruleId) return []

      const params = new URLSearchParams()
      if (options?.startDate) params.append('start_date', options.startDate)
      if (options?.count) params.append('count', options.count.toString())
      if (options?.maxDate) params.append('max_date', options.maxDate)

      const headers = await getAuthHeaders()
      const response = await fetch(getApiUrl(`/rules/${ruleId}/occurrences?${params}`), {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to calculate occurrences')
      }

      return await response.json()
    },
    enabled: !!ruleId,
  })
}
