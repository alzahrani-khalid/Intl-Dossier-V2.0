/**
 * useUnifiedTimeline Hook
 *
 * Fetches and manages timeline data with:
 * - Infinite scroll pagination (TanStack Query)
 * - Multi-source aggregation (calendar, interactions, documents, etc.)
 * - Type-based filtering
 * - Date range filtering
 * - Full-text search
 * - Real-time updates (optional)
 */

import { useState, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  UnifiedTimelineEvent,
  TimelineFilters,
  TimelineResponse,
  TimelineEventType,
  UseUnifiedTimelineReturn,
} from '@/types/timeline.types';

interface UseUnifiedTimelineOptions {
  dossierId: string;
  dossierType: 'Country' | 'Organization' | 'Person' | 'Engagement' | 'Forum' | 'WorkingGroup' | 'Topic';
  initialFilters?: TimelineFilters;
  itemsPerPage?: number;
  enableRealtime?: boolean;
}

/**
 * Fetch timeline events from Edge Function
 */
async function fetchTimelineEvents(
  dossierId: string,
  dossierType: string,
  filters: TimelineFilters,
  cursor?: string,
  itemsPerPage: number = 20
): Promise<TimelineResponse> {
  const { data, error } = await supabase.functions.invoke<TimelineResponse>('unified-timeline', {
    body: {
      dossier_id: dossierId,
      dossier_type: dossierType,
      filters,
      cursor,
      limit: itemsPerPage,
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to fetch timeline events');
  }

  if (!data) {
    throw new Error('No data returned from timeline API');
  }

  return data;
}

/**
 * Hook for fetching unified timeline data
 */
export function useUnifiedTimeline({
  dossierId,
  dossierType,
  initialFilters = {},
  itemsPerPage = 20,
  enableRealtime = false,
}: UseUnifiedTimelineOptions): UseUnifiedTimelineReturn {
  const [filters, setFilters] = useState<TimelineFilters>(initialFilters);

  // Infinite query for timeline events
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['timeline', dossierId, dossierType, filters],
    queryFn: ({ pageParam }) =>
      fetchTimelineEvents(dossierId, dossierType, filters, pageParam, itemsPerPage),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.has_more ? lastPage.next_cursor : undefined;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Flatten paginated results into a single array
  const events = useMemo<UnifiedTimelineEvent[]>(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.events);
  }, [data]);

  // TODO: Implement real-time subscriptions if enableRealtime is true
  // This would subscribe to relevant Supabase tables and update the timeline in real-time

  return {
    events,
    isLoading,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    error: error as Error | null,
    fetchNextPage: () => fetchNextPage(),
    refetch,
    filters,
    setFilters,
  };
}

/**
 * Get default event types for a dossier type
 */
export function getDefaultEventTypes(
  dossierType: 'Country' | 'Organization' | 'Person' | 'Engagement' | 'Forum' | 'WorkingGroup' | 'Topic'
): TimelineEventType[] {
  const eventTypeMap: Record<string, TimelineEventType[]> = {
    Country: ['intelligence', 'mou', 'calendar', 'document', 'relationship'],
    Organization: ['interaction', 'mou', 'calendar', 'document', 'relationship'],
    Person: ['interaction', 'position', 'calendar', 'relationship'],
    Engagement: ['calendar', 'commitment', 'decision', 'document'],
    Forum: ['calendar', 'decision', 'document', 'relationship'],
    WorkingGroup: ['calendar', 'commitment', 'decision', 'document'],
    Topic: ['document', 'calendar', 'intelligence', 'relationship'],
  };

  return eventTypeMap[dossierType] || ['calendar', 'document'];
}

/**
 * Get available event types for a dossier type
 */
export function getAvailableEventTypes(
  dossierType: 'Country' | 'Organization' | 'Person' | 'Engagement' | 'Forum' | 'WorkingGroup' | 'Topic'
): TimelineEventType[] {
  const eventTypeMap: Record<string, TimelineEventType[]> = {
    Country: ['intelligence', 'mou', 'calendar', 'document', 'interaction', 'position', 'relationship'],
    Organization: ['interaction', 'mou', 'calendar', 'document', 'relationship', 'position'],
    Person: ['interaction', 'position', 'calendar', 'document', 'relationship'],
    Engagement: ['calendar', 'commitment', 'decision', 'document', 'interaction'],
    Forum: ['calendar', 'decision', 'document', 'relationship', 'interaction'],
    WorkingGroup: ['calendar', 'commitment', 'decision', 'document', 'interaction'],
    Topic: ['document', 'calendar', 'intelligence', 'relationship', 'interaction'],
  };

  return eventTypeMap[dossierType] || [
    'calendar',
    'interaction',
    'intelligence',
    'document',
    'mou',
    'position',
    'relationship',
    'commitment',
    'decision',
  ];
}
