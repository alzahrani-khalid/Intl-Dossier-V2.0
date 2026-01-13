/**
 * useRecurringEvents Hook
 * Feature: recurring-event-patterns
 *
 * React Query hooks for managing recurring calendar events:
 * - Create recurring event series
 * - Get series with occurrences
 * - Update series (with scope selection)
 * - Delete occurrences (with scope selection)
 * - Add exceptions to series
 * - Get event notifications
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
 * Get the base URL for API calls
 */
function getApiUrl(path: string): string {
  return `${supabase.supabaseUrl}${RECURRING_EVENTS_BASE_URL}${path}`
}

/**
 * Get auth headers for API calls
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
 * Create a new recurring event series
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
 * Get an event series by ID
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
 * Get series occurrences with exceptions
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
 * Update a recurring event series
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
 * Delete occurrence(s) from a series
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
 * Add an exception to a series (cancel, reschedule, or modify a single occurrence)
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
