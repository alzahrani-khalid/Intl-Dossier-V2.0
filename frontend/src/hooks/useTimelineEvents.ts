/**
 * TanStack Query infinite hook for timeline events
 *
 * Provides infinite scroll pagination for dossier timeline
 * Query key: ['timeline', dossierId, filters]
 * Pagination: cursor-based, 50 items per batch
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { TimelineEventResponse, TimelineFilters } from '../types/dossier';
import { dossierKeys } from './useDossiers';

// API base URL
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

// Helper to get auth headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  };
};

/**
 * Hook to fetch timeline events with infinite scroll
 */
export const useTimelineEvents = (
  dossierId: string,
  filters?: TimelineFilters
) => {
  return useInfiniteQuery({
    queryKey: dossierKeys.timeline(dossierId, filters),
    queryFn: async ({ pageParam }): Promise<TimelineEventResponse> => {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();

      // Add filters
      if (filters) {
        if (filters.event_type && filters.event_type.length > 0) {
          filters.event_type.forEach((type) => params.append('event_type', type));
        }
        if (filters.start_date) params.append('start_date', filters.start_date);
        if (filters.end_date) params.append('end_date', filters.end_date);
        if (filters.limit) params.append('limit', String(filters.limit));
      }

      // Add cursor if present
      if (pageParam) {
        params.append('cursor', pageParam);
      }

      // Default limit if not specified
      if (!filters?.limit) {
        params.append('limit', '50');
      }

      const response = await fetch(
        `${API_BASE_URL}/dossiers-timeline?id=${dossierId}&${params.toString()}`,
        { headers }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message_en || 'Failed to fetch timeline events');
      }

      return response.json();
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => {
      // Return next cursor if more pages available
      return lastPage.pagination.has_more ? lastPage.pagination.next_cursor : undefined;
    },
    enabled: !!dossierId,
  });
};