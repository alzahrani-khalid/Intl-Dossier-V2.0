/**
 * Dossier Listing Hook
 * @module hooks/useDossiers
 * @feature 026-unified-dossier-architecture
 * @feature 034-dossier-ui-polish
 *
 * TanStack Query hook for listing dossiers with advanced filtering capabilities.
 * Provides paginated results with configurable cache behavior.
 *
 * @description
 * This hook fetches a paginated list of dossiers from the Edge Function API
 * with support for multiple filter types including:
 * - Type filtering (country, organization, person, etc.)
 * - Status filtering (active, inactive, archived)
 * - Text search across name fields
 * - Tag-based filtering
 * - Pagination with configurable page size
 *
 * Query caching:
 * - staleTime: 30 seconds (data considered fresh)
 * - gcTime: 5 minutes (garbage collection)
 *
 * @example
 * // Basic usage - fetch all dossiers
 * const { data, isLoading } = useDossiers();
 *
 * @example
 * // With filters
 * const { data } = useDossiers({
 *   type: 'country',
 *   status: 'active',
 *   search: 'united',
 *   page: 1,
 *   page_size: 20,
 * });
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { DossierFilters, DossierListResponse } from '../types/dossier'

/** API base URL for Edge Functions */
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

/**
 * Serializes filter object for stable query key generation
 *
 * @description
 * Sorts filter keys alphabetically and removes undefined/null/empty values
 * to ensure consistent cache key generation regardless of property order.
 *
 * @param filters - Optional filter object to serialize
 * @returns Serialized filter object or undefined if no filters
 */
const serializeFilters = (filters?: DossierFilters) => {
  if (!filters) return undefined
  // Sort keys to ensure consistent serialization
  const sorted: Record<string, any> = {}
  Object.keys(filters)
    .sort()
    .forEach((key) => {
      const value = filters[key as keyof DossierFilters]
      if (value !== undefined && value !== null && value !== '') {
        sorted[key] = value
      }
    })
  return sorted
}

/**
 * Query Keys Factory for dossier queries
 *
 * @description
 * Provides hierarchical cache keys for TanStack Query.
 * Enables granular cache invalidation at different levels.
 *
 * @example
 * // Invalidate all dossier queries
 * queryClient.invalidateQueries({ queryKey: dossierKeys.all });
 *
 * // Invalidate only list queries
 * queryClient.invalidateQueries({ queryKey: dossierKeys.lists() });
 */
export const dossierKeys = {
  /** Root key for all dossier queries */
  all: ['dossiers'] as const,
  /** Key for list queries */
  lists: () => [...dossierKeys.all, 'list'] as const,
  /** Key for filtered list queries */
  list: (filters?: DossierFilters) => [...dossierKeys.lists(), serializeFilters(filters)] as const,
  /** Key for detail queries */
  details: () => [...dossierKeys.all, 'detail'] as const,
  /** Key for specific dossier detail */
  detail: (id: string, includes?: string[]) => [...dossierKeys.details(), id, includes] as const,
  /** Key for dossier timeline queries */
  timeline: (id: string, filters?: any) => [...dossierKeys.all, 'timeline', id, filters] as const,
  /** Key for dossier briefs queries */
  briefs: (id: string) => [...dossierKeys.all, 'briefs', id] as const,
}

/**
 * Gets authentication headers for API requests
 *
 * @description
 * Retrieves the current Supabase session and returns headers
 * with the access token for authenticated API calls.
 *
 * @returns Promise resolving to headers object with Content-Type and Authorization
 * @internal
 */
const getAuthHeaders = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    console.error('❌ No access token available!')
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token}`,
  }
}

/**
 * Hook to list dossiers with filtering and pagination
 *
 * @description
 * Fetches a paginated list of dossiers from the dossiers-list Edge Function.
 * Supports multiple filter types and handles array parameters correctly.
 *
 * @param filters - Optional filters for the query
 * @param filters.type - Dossier type filter ('country', 'organization', etc.)
 * @param filters.status - Status filter ('active', 'inactive', 'archived')
 * @param filters.search - Text search across name fields
 * @param filters.tags - Array of tags to filter by
 * @param filters.page - Page number (1-indexed)
 * @param filters.page_size - Items per page
 * @returns TanStack Query result with DossierListResponse
 *
 * @example
 * // Basic usage
 * const { data, isLoading, error } = useDossiers();
 *
 * @example
 * // With filters
 * const { data } = useDossiers({
 *   type: 'country',
 *   status: 'active',
 *   page: 1,
 *   page_size: 10,
 * });
 *
 * @example
 * // Access pagination info
 * const { data } = useDossiers({ page: 2 });
 * console.log(`Showing ${data?.data.length} of ${data?.total}`);
 */
export const useDossiers = (filters?: DossierFilters) => {
  return useQuery({
    queryKey: dossierKeys.list(filters),
    queryFn: async (): Promise<DossierListResponse> => {
      const headers = await getAuthHeaders()
      const params = new URLSearchParams()

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              // For arrays like tags, serialize as repeated params
              value.forEach((v) => params.append(key, String(v)))
            } else {
              params.append(key, String(value))
            }
          }
        })
      }

      const response = await fetch(`${API_BASE_URL}/dossiers-list?${params.toString()}`, {
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to fetch dossiers')
      }

      return response.json()
    },
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes (formerly cacheTime)
  })
}
