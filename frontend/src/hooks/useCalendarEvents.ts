// T070: useCalendarEvents hook
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface CalendarEvent {
  id: string;
  dossier_id: string;
  event_type: 'main_event' | 'session' | 'plenary' | 'working_session' | 'ceremony' | 'reception';
  title_en?: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;
  start_datetime: string;
  end_datetime: string;
  timezone: string;
  location_en?: string;
  location_ar?: string;
  is_virtual: boolean;
  virtual_link?: string;
  room_en?: string;
  room_ar?: string;
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled' | 'postponed';
  created_at: string;
  updated_at: string;
  // Optional dossier relation when fetched with join
  dossier?: {
    id: string;
    type: string;
    name_en: string;
    name_ar: string;
  };
}

export interface UseCalendarEventsFilters {
  start_date?: string;
  end_date?: string;
  event_type?: string;
  dossier_id?: string;
  status?: string;
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
      if (filters?.event_type) {
        params.append('event_type', filters.event_type);
      }
      if (filters?.dossier_id) {
        params.append('dossier_id', filters.dossier_id);
      }
      if (filters?.status) {
        params.append('status', filters.status);
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
