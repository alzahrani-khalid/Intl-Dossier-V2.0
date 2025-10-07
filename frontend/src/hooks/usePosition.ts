/**
 * TanStack Query hook for fetching a single position
 *
 * Query key: ['positions', 'detail', id]
 * Cache: staleTime 5min, refetchOnWindowFocus: false
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Position } from '../types/position';

// API base URL
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

// Query keys
export const positionKeys = {
  all: ['positions'] as const,
  lists: () => [...positionKeys.all, 'list'] as const,
  details: () => [...positionKeys.all, 'detail'] as const,
  detail: (id: string) => [...positionKeys.details(), id] as const,
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
 * Hook to fetch a single position by ID
 */
export const usePosition = (id: string | undefined, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: positionKeys.detail(id || ''),
    queryFn: async (): Promise<Position> => {
      if (!id) {
        throw new Error('Position ID is required');
      }

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/positions-get?position_id=${id}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Failed to fetch position: ${response.status}`);
      }

      return response.json();
    },
    enabled: options?.enabled !== false && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
};
