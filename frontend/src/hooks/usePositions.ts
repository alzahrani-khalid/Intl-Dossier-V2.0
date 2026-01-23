/**
 * Positions List Query Hooks
 * @module hooks/usePositions
 *
 * TanStack Query hooks for fetching paginated positions list with infinite scroll
 * and filtering capabilities.
 *
 * @description
 * This module provides React hooks for managing positions list queries:
 * - Infinite query hook for paginated position lists
 * - Automatic cursor-based pagination
 * - Advanced filtering support (status, type, search, etc.)
 * - Automatic caching with 30-second stale time
 * - Query key factory for granular cache management
 *
 * @example
 * // Fetch all positions with infinite scroll
 * const { data, fetchNextPage, hasNextPage } = usePositions();
 *
 * @example
 * // Fetch with filters
 * const { data } = usePositions({
 *   status: 'approved',
 *   type: 'policy',
 *   search: 'climate',
 *   limit: 20,
 * });
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { PositionFilters, PositionListResponse } from '../types/position';

// API base URL
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

/**
 * Query Keys Factory for position list-related queries
 *
 * @description
 * Provides a hierarchical key structure for TanStack Query cache management.
 * Includes keys for lists, details, versions, and attachments.
 *
 * @example
 * // Invalidate all position queries
 * queryClient.invalidateQueries({ queryKey: positionKeys.all });
 *
 * @example
 * // Invalidate filtered list
 * queryClient.invalidateQueries({ queryKey: positionKeys.list({ status: 'draft' }) });
 *
 * @example
 * // Invalidate position versions
 * queryClient.invalidateQueries({ queryKey: positionKeys.versions('uuid') });
 */
export const positionKeys = {
  all: ['positions'] as const,
  lists: () => [...positionKeys.all, 'list'] as const,
  list: (filters?: PositionFilters) => [...positionKeys.lists(), filters] as const,
  details: () => [...positionKeys.all, 'detail'] as const,
  detail: (id: string) => [...positionKeys.details(), id] as const,
  versions: (id: string) => [...positionKeys.all, 'versions', id] as const,
  attachments: (id: string) => [...positionKeys.all, 'attachments', id] as const,
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
 * Hook to list positions with infinite scroll pagination
 *
 * @description
 * Fetches a paginated list of positions with optional filtering by status, type,
 * search query, and other criteria. Uses cursor-based pagination with automatic
 * next page detection. Results are cached based on filter parameters.
 *
 * @param filters - Optional filters to apply (excludes offset, uses cursor pagination)
 * @param filters.status - Filter by position status
 * @param filters.type - Filter by position type
 * @param filters.search - Search query for position content
 * @param filters.limit - Number of items per page (defaults to 20)
 * @returns TanStack Infinite Query result with paginated position list
 *
 * @example
 * // Fetch all positions
 * const { data, fetchNextPage, hasNextPage } = usePositions();
 *
 * @example
 * // Fetch with filters
 * const { data, isLoading } = usePositions({
 *   status: 'approved',
 *   type: 'policy',
 *   search: 'climate change',
 *   limit: 20,
 * });
 *
 * @example
 * // Infinite scroll implementation
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = usePositions();
 * // Call fetchNextPage() when user scrolls to bottom
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
