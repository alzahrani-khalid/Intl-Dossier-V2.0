/**
 * Calendar Event Creation Hook
 *
 * Mutation hook for creating calendar events using the mutation factory pattern.
 * Handles authentication, request execution, and automatic query invalidation.
 *
 * @module hooks/useCreateCalendarEvent
 */

import { mutationHelpers } from '@/lib/mutation-factory';

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
  reminder_minutes?: number;
}

/**
 * Create calendar event mutation hook
 *
 * Invalidates 'calendar-events' query on success to trigger refetch
 */
export const useCreateCalendarEvent = mutationHelpers.create<CreateCalendarEventInput>(
  'calendar-create',
  [['calendar-events']]
);
