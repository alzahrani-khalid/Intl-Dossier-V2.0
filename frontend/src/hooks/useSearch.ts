/**
 * useSearch TanStack Query Hook
 * Feature: 015-search-retrieval-spec
 * Task: T047
 *
 * Custom hook for global search functionality using TanStack Query
 * Provides caching, automatic retry, and request cancellation
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export type EntityType = 'dossiers' | 'people' | 'engagements' | 'positions' | 'documents' | 'all';

export interface SearchOptions {
  /** Search query string */
  query: string;
  /** Entity types to search (comma-separated or array) */
  entityTypes?: EntityType | EntityType[];
  /** Number of results per page */
  limit?: number;
  /** Pagination offset */
  offset?: number;
  /** Include archived items */
  includeArchived?: boolean;
  /** Language for search (auto-detected if not provided) */
  language?: 'en' | 'ar';
}

export interface SearchResult {
  /** Entity ID */
  id: string;
  /** Entity type */
  type: EntityType;
  /** Result title (bilingual) */
  title_en: string;
  title_ar: string;
  /** Result snippet with highlights */
  snippet_en?: string;
  snippet_ar?: string;
  /** Relevance score */
  rank_score: number;
  /** Last updated timestamp */
  updated_at: string;
  /** Is archived */
  is_archived?: boolean;
  /** Match type */
  match_type: 'exact' | 'semantic';
}

export interface SearchCounts {
  /** Total results */
  total: number;
  /** Results per entity type */
  dossiers: number;
  people: number;
  engagements: number;
  positions: number;
  documents: number;
  /** Restricted results count */
  restricted: number;
}

export interface SearchResponse {
  /** Search results */
  results: SearchResult[];
  /** Result counts */
  counts: SearchCounts;
  /** Query metadata */
  query: {
    text: string;
    normalized: string;
    language_detected: 'ar' | 'en' | 'mixed';
    has_boolean_operators: boolean;
  };
  /** Performance metrics */
  took_ms: number;
  /** Metadata */
  metadata?: {
    restricted_message?: string;
    warnings?: string[];
  };
}

/**
 * Perform global search across entities
 *
 * @param options - Search options
 * @returns TanStack Query result with search data
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useSearch({
 *   query: 'climate change',
 *   entityTypes: ['dossiers', 'positions'],
 *   limit: 20
 * });
 * ```
 */
export function useSearch(options: SearchOptions) {
  const {
    query,
    entityTypes = 'all',
    limit = 20,
    offset = 0,
    includeArchived = false,
    language
  } = options;

  return useQuery({
    queryKey: ['search', query, entityTypes, limit, offset, includeArchived, language],

    queryFn: async ({ signal }) => {
      // Build query parameters
      const params = new URLSearchParams();
      params.set('q', query);

      if (Array.isArray(entityTypes)) {
        params.set('type', entityTypes.join(','));
      } else if (entityTypes !== 'all') {
        params.set('type', entityTypes);
      }

      params.set('limit', limit.toString());
      params.set('offset', offset.toString());
      params.set('include_archived', includeArchived.toString());

      if (language) {
        params.set('lang', language);
      }

      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      // Make API request with AbortController for cancellation
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/search?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        signal
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Search failed');
      }

      const data: SearchResponse = await response.json();
      return data;
    },

    // Only run query if we have a search term
    enabled: Boolean(query && query.trim().length > 0),

    // Cache configuration
    staleTime: 60 * 1000, // 60 seconds - consider data stale after 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache for 5 minutes

    // Retry configuration
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff

    // Refetch configuration
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnReconnect: true, // Refetch when internet connection is restored
  });
}

/**
 * Prefetch search results (useful for hover states, etc.)
 *
 * @param queryClient - TanStack Query client
 * @param options - Search options
 */
export async function prefetchSearch(
  queryClient: any,
  options: SearchOptions
) {
  await queryClient.prefetchQuery({
    queryKey: ['search', options.query, options.entityTypes, options.limit, options.offset],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('q', options.query);

      if (options.entityTypes && options.entityTypes !== 'all') {
        params.set('type', Array.isArray(options.entityTypes) ? options.entityTypes.join(',') : options.entityTypes);
      }

      params.set('limit', (options.limit || 20).toString());
      params.set('offset', (options.offset || 0).toString());

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      return response.json();
    },
    staleTime: 60 * 1000
  });
}
