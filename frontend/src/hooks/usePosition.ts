/**
 * Position Query Hooks
 * @module hooks/usePosition
 *
 * TanStack Query hook for fetching a single position entity with automatic caching
 * and cache invalidation support.
 *
 * @description
 * This module provides React hooks for managing position entity queries:
 * - Query hook for fetching single position by ID
 * - Automatic caching with 5-minute stale time
 * - Query key factory for cache management
 * - Authentication header management
 *
 * @example
 * // Fetch a single position
 * const { data, isLoading } = usePosition('position-uuid');
 *
 * @example
 * // Conditionally fetch a position
 * const { data } = usePosition(positionId, { enabled: !!positionId });
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Position } from '../types/position';

// API base URL
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

/**
 * Query Keys Factory for position-related queries
 *
 * @description
 * Provides a hierarchical key structure for TanStack Query cache management.
 * Keys are structured to enable granular cache invalidation.
 *
 * @example
 * // Invalidate all position queries
 * queryClient.invalidateQueries({ queryKey: positionKeys.all });
 *
 * @example
 * // Invalidate only detail queries
 * queryClient.invalidateQueries({ queryKey: positionKeys.details() });
 *
 * @example
 * // Invalidate specific position detail
 * queryClient.invalidateQueries({ queryKey: positionKeys.detail('uuid') });
 */
export const positionKeys = {
  all: ['positions'] as const,
  lists: () => [...positionKeys.all, 'list'] as const,
  details: () => [...positionKeys.all, 'detail'] as const,
  detail: (id: string) => [...positionKeys.details(), id] as const,
};

/**
 * Helper function to get authenticated headers for API requests
 *
 * @description
 * Retrieves the current user session and constructs authorization headers
 * required for authenticated API calls.
 *
 * @returns Promise resolving to headers object with Content-Type and Authorization
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
 * Hook to fetch a single position by ID
 *
 * @description
 * Fetches a position entity with automatic caching and optional conditional fetching.
 * The query is cached with a 5-minute stale time and does not refetch on window focus.
 *
 * @param id - The unique identifier (UUID) of the position to fetch (optional for conditional queries)
 * @param options - Optional query configuration
 * @param options.enabled - Whether to enable the query (defaults to true when id is provided)
 * @returns TanStack Query result with data typed as Position
 *
 * @example
 * // Basic usage
 * const { data, isLoading, error } = usePosition('uuid-123');
 *
 * @example
 * // Conditional fetching
 * const { data } = usePosition(positionId, { enabled: !!positionId });
 *
 * @example
 * // With error handling
 * const { data, error } = usePosition('uuid-123');
 * if (error) {
 *   console.error('Failed to fetch position:', error.message);
 * }
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
