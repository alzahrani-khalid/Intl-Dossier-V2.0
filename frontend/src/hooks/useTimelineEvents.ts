/**
 * Timeline Events Hooks
 * @module hooks/useTimelineEvents
 * @feature dossier-timeline
 *
 * TanStack Query infinite scroll hook for dossier timeline events.
 *
 * @description
 * This module provides an infinite scroll hook for fetching dossier timeline events
 * with cursor-based pagination. Timeline events aggregate all activities related to
 * a dossier including calendar events, work items, commitments, and relationship changes.
 *
 * Features:
 * - Cursor-based pagination (50 items per batch by default)
 * - Filtering by event type, date range
 * - Automatic cache management with dossierKeys
 * - Infinite scroll support with getNextPageParam
 *
 * @example
 * // Basic usage with infinite scroll
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage,
 *   isLoading,
 * } = useTimelineEvents(dossierId);
 *
 * @example
 * // With filters
 * const { data, fetchNextPage } = useTimelineEvents(dossierId, {
 *   event_type: ['calendar_event', 'work_item'],
 *   start_date: '2024-01-01',
 *   end_date: '2024-12-31',
 *   limit: 25,
 * });
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { TimelineEventResponse, TimelineFilters } from '../types/dossier';
import { dossierKeys } from './useDossiers';

// API base URL
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

/**
 * Get auth headers for timeline API requests
 *
 * @description
 * Retrieves current session token and formats authorization headers.
 *
 * @returns Promise resolving to headers object
 * @private
 */
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  };
};

/**
 * Hook to fetch dossier timeline events with infinite scroll pagination
 *
 * @description
 * Fetches timeline events for a dossier using cursor-based pagination.
 * Returns an infinite query result with automatic page loading support.
 * Timeline events are aggregated from multiple sources (calendar, work items,
 * commitments, relationships) and sorted chronologically.
 *
 * The query is automatically disabled if dossierId is falsy.
 * Results are cached with dossierKeys.timeline(dossierId, filters) for
 * granular cache invalidation.
 *
 * @param dossierId - UUID of the dossier to fetch timeline for
 * @param filters - Optional filters to narrow down results
 * @param filters.event_type - Array of event types to include (e.g., ['calendar_event', 'work_item'])
 * @param filters.start_date - Filter events on or after this date (ISO 8601)
 * @param filters.end_date - Filter events on or before this date (ISO 8601)
 * @param filters.limit - Number of items per page (default: 50)
 * @returns TanStack Infinite Query result with pages of timeline events
 *
 * @example
 * // Basic infinite scroll usage
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage,
 *   isLoading,
 * } = useTimelineEvents(dossierId);
 *
 * // Render with infinite scroll
 * {data?.pages.map((page, i) => (
 *   <React.Fragment key={i}>
 *     {page.events.map(event => (
 *       <TimelineEvent key={event.id} event={event} />
 *     ))}
 *   </React.Fragment>
 * ))}
 *
 * {hasNextPage && (
 *   <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
 *     Load More
 *   </button>
 * )}
 *
 * @example
 * // With filters and smaller page size
 * const { data } = useTimelineEvents(dossierId, {
 *   event_type: ['calendar_event', 'commitment'],
 *   start_date: '2024-01-01',
 *   limit: 25,
 * });
 *
 * @example
 * // With intersection observer for auto-load
 * const { fetchNextPage, hasNextPage } = useTimelineEvents(dossierId);
 * const observerRef = useRef();
 *
 * useEffect(() => {
 *   if (hasNextPage && observerRef.current) {
 *     const observer = new IntersectionObserver(
 *       entries => entries[0].isIntersecting && fetchNextPage()
 *     );
 *     observer.observe(observerRef.current);
 *     return () => observer.disconnect();
 *   }
 * }, [hasNextPage, fetchNextPage]);
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