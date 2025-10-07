/**
 * useSuggestions TanStack Query Hook
 * Feature: 015-search-retrieval-spec
 * Task: T048
 *
 * Custom hook for typeahead search suggestions using TanStack Query
 * Includes debouncing, caching, and automatic request cancellation
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useDebouncedValue } from './useDebouncedValue';
import { EntityType } from './useSearch';

export interface Suggestion {
  /** Entity ID */
  id: string;
  /** Entity type */
  type: EntityType;
  /** Suggestion title (bilingual) */
  title_en: string;
  title_ar: string;
  /** Preview text */
  preview_en?: string;
  preview_ar?: string;
  /** Relevance score (0.0-1.0) */
  score: number;
  /** Last updated */
  updated_at?: string;
}

export interface SuggestionsResponse {
  /** Array of suggestions */
  suggestions: Suggestion[];
  /** Query metadata */
  query: {
    prefix: string;
    normalized: string;
    language: 'en' | 'ar' | 'mixed';
  };
  /** Performance metrics */
  took_ms: number;
  /** Was this a cache hit? */
  cache_hit: boolean;
}

export interface SuggestionsOptions {
  /** Search prefix */
  prefix: string;
  /** Entity types to suggest */
  entityType?: EntityType;
  /** Maximum number of suggestions */
  limit?: number;
  /** Language preference */
  language?: 'en' | 'ar';
  /** Debounce delay in milliseconds */
  debounceMs?: number;
}

/**
 * Get typeahead search suggestions
 *
 * @param options - Suggestions options
 * @returns TanStack Query result with suggestions
 *
 * @example
 * ```typescript
 * const { suggestions, isLoading, cacheHit } = useSuggestions({
 *   prefix: 'clim',
 *   entityType: 'dossiers',
 *   limit: 10
 * });
 * ```
 */
export function useSuggestions(options: SuggestionsOptions) {
  const {
    prefix,
    entityType = 'all',
    limit = 10,
    language,
    debounceMs = 200
  } = options;

  // Debounce the prefix to avoid too many requests
  const debouncedPrefix = useDebouncedValue(prefix, debounceMs);

  const queryResult = useQuery({
    queryKey: ['suggestions', debouncedPrefix, entityType, limit, language],

    queryFn: async ({ signal }) => {
      // Build query parameters
      const params = new URLSearchParams();
      params.set('q', debouncedPrefix);

      if (entityType !== 'all') {
        params.set('type', entityType);
      }

      params.set('limit', limit.toString());

      if (language) {
        params.set('lang', language);
      }

      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      // Make API request with AbortController for cancellation
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/search/suggest?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        signal
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch suggestions');
      }

      const data: SuggestionsResponse = await response.json();

      // Check performance requirement: must be < 200ms
      if (data.took_ms > 200) {
        console.warn(`Suggestions took ${data.took_ms}ms (requirement: <200ms)`);
      }

      return data;
    },

    // Only run query if we have a prefix (at least 2 characters)
    enabled: Boolean(debouncedPrefix && debouncedPrefix.trim().length >= 2),

    // Cache configuration
    staleTime: 5 * 60 * 1000, // 5 minutes - suggestions are fairly stable
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache

    // Retry configuration
    retry: 1, // Only retry once for suggestions (performance-critical)
    retryDelay: 500, // Quick retry

    // Refetch configuration
    refetchOnWindowFocus: false,
    refetchOnReconnect: false, // Don't refetch suggestions on reconnect
  });

  // Enhanced return value with convenience properties
  const result = useMemo(() => ({
    ...queryResult,
    suggestions: queryResult.data?.suggestions || [],
    cacheHit: queryResult.data?.cache_hit || false,
    tookMs: queryResult.data?.took_ms || 0,
    isEmpty: (queryResult.data?.suggestions?.length || 0) === 0
  }), [queryResult]);

  return result;
}

/**
 * Prefetch suggestions for a prefix (useful for hover states)
 *
 * @param queryClient - TanStack Query client
 * @param options - Suggestion options
 */
export async function prefetchSuggestions(
  queryClient: any,
  options: SuggestionsOptions
) {
  const { prefix, entityType = 'all', limit = 10, language } = options;

  await queryClient.prefetchQuery({
    queryKey: ['suggestions', prefix, entityType, limit, language],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('q', prefix);

      if (entityType !== 'all') {
        params.set('type', entityType);
      }

      params.set('limit', limit.toString());

      if (language) {
        params.set('lang', language);
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/search/suggest?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      return response.json();
    },
    staleTime: 5 * 60 * 1000
  });
}

/**
 * Invalidate suggestions cache (useful after entity updates)
 *
 * @param queryClient - TanStack Query client
 * @param prefix - Optional prefix to invalidate (invalidates all if not provided)
 */
export function invalidateSuggestions(
  queryClient: any,
  prefix?: string
) {
  if (prefix) {
    queryClient.invalidateQueries({
      queryKey: ['suggestions', prefix]
    });
  } else {
    queryClient.invalidateQueries({
      queryKey: ['suggestions']
    });
  }
}
