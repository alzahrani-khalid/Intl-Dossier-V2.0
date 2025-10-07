/**
 * TanStack Query hooks for positions (infinite scroll)
 *
 * Provides infinite query for position list with filtering capabilities
 * Query key: ['positions', filters]
 * Cache: staleTime 30s, gcTime 5min
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { PositionFilters, PositionListResponse } from '../types/position';

// API base URL
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

// Query keys
export const positionKeys = {
  all: ['positions'] as const,
  lists: () => [...positionKeys.all, 'list'] as const,
  list: (filters?: PositionFilters) => [...positionKeys.lists(), filters] as const,
  details: () => [...positionKeys.all, 'detail'] as const,
  detail: (id: string) => [...positionKeys.details(), id] as const,
  versions: (id: string) => [...positionKeys.all, 'versions', id] as const,
  attachments: (id: string) => [...positionKeys.all, 'attachments', id] as const,
};

// Helper to get auth headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  };
};

/**
 * Hook to list positions with infinite scroll
 */
export const usePositions = (filters?: Omit<PositionFilters, 'offset'>) => {
  const pageSize = filters?.limit || 20;

  return useInfiniteQuery({
    queryKey: positionKeys.list(filters),
    queryFn: async ({ pageParam = 0 }): Promise<PositionListResponse> => {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();

      // Add filters to params
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && key !== 'limit') {
            params.append(key, String(value));
          }
        });
      }

      // Add pagination
      params.append('limit', String(pageSize));
      params.append('offset', String(pageParam));

      const response = await fetch(
        `${API_BASE_URL}/positions-list?${params.toString()}`,
        { headers }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch positions');
      }

      return response.json();
    },
    getNextPageParam: (lastPage) => {
      // Return next offset if there are more items
      if (lastPage.has_more) {
        return lastPage.offset + lastPage.limit;
      }
      return undefined;
    },
    initialPageParam: 0,
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes
  });
};
