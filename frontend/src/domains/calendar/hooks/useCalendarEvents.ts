/**
 * Calendar Events Hook (Domain)
 * @module domains/calendar/hooks/useCalendarEvents
 *
 * TanStack Query hook for fetching calendar events.
 * Delegates API calls to calendar.repository.
 */

import { useQuery } from '@tanstack/react-query'
import * as calendarRepo from '../repositories/calendar.repository'
import type { CalendarEvent, CalendarEventsFilters } from '../types'

export type { CalendarEvent, CalendarEventsFilters }

export interface UseCalendarEventsResult {
  events: CalendarEvent[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useCalendarEvents(filters?: CalendarEventsFilters): UseCalendarEventsResult {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['calendar-events', filters],
    queryFn: () => calendarRepo.getCalendarEvents(filters),
    staleTime: 2 * 60 * 1000,
  })

  return {
    events: data?.entries || [],
    totalCount: data?.total_count || 0,
    isLoading,
    error: error as Error | null,
    refetch,
  }
}
