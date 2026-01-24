/**
 * Calendar Events Hooks
 * @module hooks/useCalendarEvents
 * @feature calendar-events
 *
 * TanStack Query hooks for fetching calendar events with filtering and caching.
 *
 * @description
 * This module provides React hooks for querying calendar events from the calendar-get
 * Edge Function. Events are cached for 2 minutes and support filtering by date range,
 * event type, dossier, and status.
 *
 * @example
 * // Fetch all events
 * const { events, isLoading } = useCalendarEvents();
 *
 * @example
 * // Fetch with filters
 * const { events, totalCount } = useCalendarEvents({
 *   dossier_id: 'uuid-here',
 *   start_date: '2024-01-01',
 *   end_date: '2024-12-31',
 *   event_type: 'main_event',
 *   status: 'planned',
 * });
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Calendar event entity with bilingual support
 *
 * @description
 * Represents a calendar event with optional dossier relation.
 * All text fields support English and Arabic variants.
 */
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

/**
 * Filters for calendar events query
 *
 * @description
 * Optional filters to narrow down calendar events results by date range,
 * type, associated dossier, or status.
 */
export interface UseCalendarEventsFilters {
  /** Filter events starting on or after this date (ISO 8601) */
  start_date?: string;
  /** Filter events ending on or before this date (ISO 8601) */
  end_date?: string;
  /** Filter by event type (e.g., 'main_event', 'session', 'plenary') */
  event_type?: string;
  /** Filter by associated dossier UUID */
  dossier_id?: string;
  /** Filter by status (e.g., 'planned', 'ongoing', 'completed') */
  status?: string;
}

/**
 * Result object returned by useCalendarEvents hook
 *
 * @description
 * Contains the fetched events, total count, loading state, error, and refetch function.
 */
export interface UseCalendarEventsResult {
  /** Array of calendar events matching the filters */
  events: CalendarEvent[];
  /** Total count of events (for pagination) */
  totalCount: number;
  /** True while the query is loading */
  isLoading: boolean;
  /** Error object if the query failed */
  error: Error | null;
  /** Function to manually refetch the events */
  refetch: () => void;
}

/**
 * Hook to fetch calendar events with optional filters
 *
 * @description
 * Fetches calendar events from the calendar-get Edge Function with automatic caching.
 * Results are cached for 2 minutes and can be filtered by date range, event type,
 * dossier association, and status. The hook handles authentication automatically.
 *
 * @param filters - Optional filters to apply to the query
 * @returns Object containing events array, total count, loading state, error, and refetch function
 *
 * @example
 * // Basic usage - fetch all events
 * const { events, isLoading } = useCalendarEvents();
 *
 * @example
 * // Fetch events for a specific dossier
 * const { events, totalCount } = useCalendarEvents({
 *   dossier_id: dossierId,
 * });
 *
 * @example
 * // Fetch events in a date range with status filter
 * const { events, error, refetch } = useCalendarEvents({
 *   start_date: '2024-01-01',
 *   end_date: '2024-01-31',
 *   status: 'planned',
 * });
 */
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
