// T072: useUpdateCalendarEvent mutation hook
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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
