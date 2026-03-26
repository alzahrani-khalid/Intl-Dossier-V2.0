/**
 * Update Calendar Event Hook (Domain)
 * @module domains/calendar/hooks/useUpdateCalendarEvent
 *
 * TanStack Query mutation for updating calendar events.
 * Delegates API calls to calendar.repository.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as calendarRepo from '../repositories/calendar.repository'
import type { UpdateCalendarEventInput } from '../types'

export type { UpdateCalendarEventInput }

export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateCalendarEventInput) => {
      return calendarRepo.updateCalendarEvent(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
    },
  })
}
