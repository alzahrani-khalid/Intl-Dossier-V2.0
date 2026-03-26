/**
 * Create Calendar Event Hook (Domain)
 * @module domains/calendar/hooks/useCreateCalendarEvent
 *
 * TanStack Query mutation for creating calendar events.
 * Delegates API calls to calendar.repository.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as calendarRepo from '../repositories/calendar.repository'
import type { CreateCalendarEventInput } from '../types'

export type { CreateCalendarEventInput }

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateCalendarEventInput) => {
      return calendarRepo.createCalendarEvent(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
    },
  })
}
