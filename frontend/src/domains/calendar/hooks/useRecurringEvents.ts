/**
 * Recurring Events Hook (Domain)
 * @module domains/calendar/hooks/useRecurringEvents
 *
 * TanStack Query hooks for managing recurring calendar events.
 * Delegates API calls to calendar.repository.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import * as calendarRepo from '../repositories/calendar.repository'
import type {
  CreateRecurringEventInput,
  CreateRecurringEventResponse,
  EventSeries,
  SeriesOccurrencesResponse,
  UpdateSeriesRequest,
  DeleteOccurrenceRequest,
  CreateExceptionInput,
  SeriesException,
} from '@/types/recurrence.types'

// ==============================================================================
// CREATE RECURRING EVENT
// ==============================================================================

export function useCreateRecurringEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateRecurringEventInput): Promise<CreateRecurringEventResponse> => {
      return calendarRepo.createRecurringEvent(input)
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

export function useEventSeries(
  seriesId: string | undefined,
): ReturnType<typeof useQuery<EventSeries>> {
  return useQuery({
    queryKey: ['event-series', seriesId],
    queryFn: async (): Promise<EventSeries> => {
      if (!seriesId) throw new Error('Series ID is required')
      return calendarRepo.getEventSeries(seriesId)
    },
    enabled: !!seriesId,
  })
}

export function useSeriesOccurrences(
  seriesId: string | undefined,
  options?: {
    startDate?: string
    endDate?: string
    limit?: number
  },
): ReturnType<typeof useQuery<SeriesOccurrencesResponse>> {
  return useQuery({
    queryKey: ['series-occurrences', seriesId, options],
    queryFn: async (): Promise<SeriesOccurrencesResponse> => {
      if (!seriesId) throw new Error('Series ID is required')
      return calendarRepo.getSeriesOccurrences(seriesId, options)
    },
    enabled: !!seriesId,
  })
}

// ==============================================================================
// UPDATE SERIES
// ==============================================================================

export function useUpdateSeries() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: UpdateSeriesRequest): Promise<{ updated_count: number }> => {
      return calendarRepo.updateSeries(request)
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

export function useDeleteOccurrences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: DeleteOccurrenceRequest): Promise<{ deleted_count: number }> => {
      return calendarRepo.deleteOccurrences(request)
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

export function useCreateException() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateExceptionInput): Promise<SeriesException> => {
      return calendarRepo.createException(input)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      queryClient.invalidateQueries({ queryKey: ['series-occurrences', variables.series_id] })
    },
  })
}

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
      return calendarRepo.removeException(seriesId, exceptionDate)
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

export function useEventNotifications(options?: { unreadOnly?: boolean; limit?: number }) {
  return useQuery({
    queryKey: ['event-notifications', options],
    queryFn: () => calendarRepo.getEventNotifications(options),
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string): Promise<void> => {
      return calendarRepo.markNotificationRead(notificationId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-notifications'] })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<void> => {
      return calendarRepo.markAllNotificationsRead()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-notifications'] })
    },
  })
}

// ==============================================================================
// HELPER HOOKS
// ==============================================================================

export function useIsRecurringEvent(
  eventId: string | undefined,
): ReturnType<typeof useQuery<{ is_recurring: boolean; series_id?: string }>> {
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

export function useNextOccurrences(
  ruleId: string | undefined,
  options?: {
    startDate?: string
    count?: number
    maxDate?: string
  },
): ReturnType<typeof useQuery<Array<{ date: string; number: number }>>> {
  return useQuery({
    queryKey: ['next-occurrences', ruleId, options],
    queryFn: async (): Promise<Array<{ date: string; number: number }>> => {
      if (!ruleId) return []
      return calendarRepo.getNextOccurrences(ruleId, options)
    },
    enabled: !!ruleId,
  })
}
