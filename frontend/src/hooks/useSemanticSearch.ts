/**
 * useSemanticSearch TanStack Query Hook
 * Feature: 015-search-retrieval-spec
 * Task: T049
 *
 * Custom hook for semantic vector search using TanStack Query
 * Semantic search finds conceptually similar content using embeddings
 */

import { useMutation } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { SearchResult } from './useSearch'

export type SemanticEntityType = 'positions' | 'documents' | 'briefs'

export interface SemanticSearchOptions {
  /** Search query */
  query: string
  /** Entity types to search (only supports positions, documents, briefs) */
  entityTypes?: SemanticEntityType[]
  /** Minimum similarity threshold (0.0-1.0, default: 0.6) */
  similarityThreshold?: number
  /** Maximum number of results */
  limit?: number
  /** Include keyword search results */
  includeKeywordResults?: boolean
}

export interface SemanticSearchResult extends SearchResult {
  /** Similarity score (0.0-1.0) */
  similarity_score: number
}

export interface SemanticSearchResponse {
  /** Semantic search results */
  results: SemanticSearchResult[]
  /** Exact keyword matches (if includeKeywordResults=true) */
  exact_matches?: SearchResult[]
  /** Performance breakdown */
  performance: {
    embedding_generation_ms: number
    vector_search_ms: number
    keyword_search_ms?: number
    total_ms: number
  }
  /** Query metadata */
  query: {
    text: string
    normalized: string
    embedding_model: string
  }
}

/**
 * Perform semantic search using vector embeddings
 *
 * @param options - Semantic search options
 * @returns TanStack Mutation result
 *
 * @example
 * ```typescript
 * const { mutate, data, isLoading } = useSemanticSearch();
 *
 * // Trigger search
 * mutate({
 *   query: 'climate change policy',
 *   entityTypes: ['positions', 'documents'],
 *   includeKeywordResults: true
 * });
 * ```
 */
export function useSemanticSearch() {
  return useMutation({
    mutationFn: async (options: SemanticSearchOptions) => {
      const {
        query,
        entityTypes = ['positions', 'documents', 'briefs'],
        similarityThreshold = 0.6,
        limit = 20,
        includeKeywordResults = false,
      } = options

      // Get current session token
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Not authenticated')
      }

      // Build request body
      const requestBody = {
        query,
        entity_types: entityTypes,
        similarity_threshold: similarityThreshold,
        limit,
        include_keyword_results: includeKeywordResults,
      }

      // Make API request
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/search/semantic`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const error = await response.json()

        // Handle specific error cases
        if (response.status === 503) {
          throw new Error('Semantic search is temporarily unavailable. Please try again later.')
        }

        throw new Error(error.message || 'Semantic search failed')
      }

      const data: SemanticSearchResponse = await response.json()

      // Validate performance (total should be < 1000ms for good UX)
      if (data.performance.total_ms > 1000) {
        console.warn(`Semantic search took ${data.performance.total_ms}ms (target: <1000ms)`)
      }

      return data
    },

    // Retry configuration
    retry: 1, // Only retry once (semantic search is expensive)
    retryDelay: 1000,

    // Callbacks
    onError: (_error) => {
      // Semantic search error handled by mutation state
    },

    onSuccess: (_data) => {
      // Search completed successfully
    },
  })
}

/**
 * Hook variant that uses TanStack Query instead of mutation
 * Useful when you want automatic caching and refetching
 *
 * Note: This is disabled by default (must call refetch() manually)
 */
export function useSemanticSearchQuery(options: SemanticSearchOptions) {
  const {
    query,
    entityTypes = ['positions', 'documents', 'briefs'],
    similarityThreshold = 0.6,
    limit = 20,
    includeKeywordResults = false,
  } = options

  return useQuery({
    queryKey: [
      'semantic-search',
      query,
      entityTypes,
      similarityThreshold,
      limit,
      includeKeywordResults,
    ],

    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/search/semantic`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          entity_types: entityTypes,
          similarity_threshold: similarityThreshold,
          limit,
          include_keyword_results: includeKeywordResults,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Semantic search failed')
      }

      return response.json() as Promise<SemanticSearchResponse>
    },

    // Disabled by default - must call refetch() manually
    enabled: false,

    // Cache configuration
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes

    // Retry configuration
    retry: 1,
    retryDelay: 1000,
  })
}

/**
 * Utility to check if semantic search is available
 * (i.e., if embeddings service is healthy)
 */
export async function checkSemanticSearchAvailability(): Promise<boolean> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return false
    }

    // Simple health check (could be a dedicated endpoint)
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/search/semantic`, {
      method: 'OPTIONS',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    return response.ok
  } catch {
    return false
  }
}

// Re-export useQuery for consistency
import { useQuery } from '@tanstack/react-query'
