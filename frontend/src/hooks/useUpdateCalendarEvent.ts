/**
 * Update Calendar Event Hook
 * @module hooks/useUpdateCalendarEvent
 * @feature calendar-events
 *
 * TanStack Query mutation hook for updating existing calendar events.
 *
 * @description
 * This module provides a mutation hook for updating calendar events via the
 * calendar-update Edge Function. On success, it automatically invalidates
 * the calendar-events query cache to trigger a refetch.
 *
 * @example
 * // Update event time
 * const { mutate } = useUpdateCalendarEvent();
 * mutate({
 *   entryId: 'event-uuid',
 *   start_datetime: '2024-01-15T14:00:00Z',
 *   end_datetime: '2024-01-15T15:00:00Z',
 * });
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Input for updating an existing calendar event
 *
 * @description
 * All fields except entryId are optional. Only provided fields will be updated.
 * Supports partial updates with automatic cache invalidation.
 */
export interface UpdateCalendarEventInput {
  /** UUID of the calendar event to update (required) */
  entryId: string;
  entry_type?: 'internal_meeting' | 'deadline' | 'reminder' | 'holiday' | 'training' | 'review' | 'other';
  title_en?: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;
  start_datetime?: string;
  end_datetime?: string;
  all_day?: boolean;
  location?: string;
  recurrence_pattern?: string;
  linked_item_type?: string;
  linked_item_id?: string;
  attendee_ids?: string[];
  /** Number of minutes before event to send reminder notification */
  reminder_minutes?: number;
}

/**
 * Hook to update an existing calendar event
 *
 * @description
 * Updates an existing calendar event with automatic cache invalidation.
 * Supports partial updates - only provided fields will be changed.
 * On success, invalidates the calendar-events query to trigger a refetch.
 * Handles authentication automatically.
 *
 * @returns TanStack Mutation result with mutate function accepting UpdateCalendarEventInput
 *
 * @example
 * // Basic usage
 * const { mutate, isPending, error } = useUpdateCalendarEvent();
 *
 * @example
 * // Reschedule an event
 * const { mutate } = useUpdateCalendarEvent();
 * mutate({
 *   entryId: 'event-uuid',
 *   start_datetime: '2024-01-20T10:00:00Z',
 *   end_datetime: '2024-01-20T11:00:00Z',
 * });
 *
 * @example
 * // Update event title and location
 * const { mutate } = useUpdateCalendarEvent();
 * mutate({
 *   entryId: 'event-uuid',
 *   title_en: 'Updated Meeting Title',
 *   title_ar: 'عنوان الاجتماع المحدث',
 *   location: 'Conference Room B',
 * });
 *
 * @example
 * // Change event status and add reminder
 * const { mutate } = useUpdateCalendarEvent();
 * mutate({
 *   entryId: 'event-uuid',
 *   entry_type: 'review',
 *   reminder_minutes: 60,
 * });
 */
export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entryId, ...updates }: UpdateCalendarEventInput) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/calendar-update?entryId=${entryId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update calendar event');
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate calendar events query to refetch
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
}
