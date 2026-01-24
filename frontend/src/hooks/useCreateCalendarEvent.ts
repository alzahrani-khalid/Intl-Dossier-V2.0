/**
 * Create Calendar Event Hook
 * @module hooks/useCreateCalendarEvent
 * @feature calendar-events
 *
 * TanStack Query mutation hook for creating new calendar events.
 *
 * @description
 * This module provides a mutation hook for creating calendar events via the
 * calendar-create Edge Function. On success, it automatically invalidates
 * the calendar-events query cache to trigger a refetch.
 *
 * @example
 * // Create an internal meeting
 * const { mutate, isPending } = useCreateCalendarEvent();
 * mutate({
 *   entry_type: 'internal_meeting',
 *   title_en: 'Weekly Team Sync',
 *   start_datetime: '2024-01-15T10:00:00Z',
 *   end_datetime: '2024-01-15T11:00:00Z',
 *   attendee_ids: ['uuid-1', 'uuid-2'],
 * });
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Input for creating a new calendar event
 *
 * @description
 * Required and optional fields for creating a calendar entry.
 * Supports bilingual titles and descriptions, recurrence patterns,
 * and linking to work items or dossiers.
 */
export interface CreateCalendarEventInput {
  entry_type: 'internal_meeting' | 'deadline' | 'reminder' | 'holiday' | 'training' | 'review' | 'other';
  title_en?: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;
  start_datetime: string;
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
 * Hook to create a new calendar event
 *
 * @description
 * Creates a new calendar event with automatic cache invalidation.
 * On success, invalidates the calendar-events query to trigger a refetch.
 * Handles authentication automatically.
 *
 * @returns TanStack Mutation result with mutate function accepting CreateCalendarEventInput
 *
 * @example
 * // Basic usage
 * const { mutate, isPending, error } = useCreateCalendarEvent();
 *
 * @example
 * // Create a deadline event
 * const { mutate } = useCreateCalendarEvent();
 * mutate({
 *   entry_type: 'deadline',
 *   title_en: 'Report Submission',
 *   title_ar: 'تقديم التقرير',
 *   start_datetime: '2024-01-31T23:59:59Z',
 *   all_day: false,
 *   linked_item_type: 'work_item',
 *   linked_item_id: 'work-item-uuid',
 *   reminder_minutes: 1440, // 1 day before
 * });
 *
 * @example
 * // Create recurring event
 * const { mutate } = useCreateCalendarEvent();
 * mutate({
 *   entry_type: 'internal_meeting',
 *   title_en: 'Weekly Standup',
 *   start_datetime: '2024-01-08T09:00:00Z',
 *   end_datetime: '2024-01-08T09:30:00Z',
 *   recurrence_pattern: 'FREQ=WEEKLY;BYDAY=MO',
 *   attendee_ids: ['uuid-1', 'uuid-2', 'uuid-3'],
 * });
 */
export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCalendarEventInput) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/calendar-create`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create calendar event');
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate calendar events query to refetch
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
}
