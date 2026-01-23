// T072: useUpdateCalendarEvent mutation hook
import { createMutation } from '@/lib/mutation-factory';

export interface UpdateCalendarEventInput {
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
  reminder_minutes?: number;
}

export const useUpdateCalendarEvent = createMutation<UpdateCalendarEventInput, unknown>({
  method: 'PATCH',
  url: {
    endpoint: 'calendar-update',
    queryParams: (input) => ({ entryId: input.entryId }),
  },
  invalidation: {
    queryKeys: [['calendar-events']],
  },
  transformBody: ({ entryId: _entryId, ...updates }) => updates,
});
