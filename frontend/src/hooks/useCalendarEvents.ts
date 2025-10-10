// T070: useCalendarEvents hook
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface CalendarEvent {
  id: string;
  entry_type: 'internal_meeting' | 'deadline' | 'reminder' | 'holiday' | 'training' | 'review' | 'other';
  title_en?: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;
  start_datetime: string;
  end_datetime?: string;
  all_day: boolean;
  location?: string;
  recurrence_pattern?: string;
  linked_item_type?: string;
  linked_item_id?: string;
  attendee_ids: string[];
  reminder_minutes: number;
  organizer_id: string;
  created_at: string;
  updated_at: string;
}

export interface UseCalendarEventsFilters {
  start_date?: string;
  end_date?: string;
  entry_type?: string;
  linked_item_type?: string;
}

export interface UseCalendarEventsResult {
  events: CalendarEvent[];
  totalCount: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useCalendarEvents(filters?: UseCalendarEventsFilters): UseCalendarEventsResult {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['calendar-events', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.start_date) {
        params.append('start_date', filters.start_date);
      }
      if (filters?.end_date) {
        params.append('end_date', filters.end_date);
      }
      if (filters?.entry_type) {
        params.append('entry_type', filters.entry_type);
      }
      if (filters?.linked_item_type) {
        params.append('linked_item_type', filters.linked_item_type);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/calendar-get?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch calendar events');
      }

      const result = await response.json();
      return result;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (shorter for calendar events)
  });

  return {
    events: data?.entries || [],
    totalCount: data?.total_count || 0,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
