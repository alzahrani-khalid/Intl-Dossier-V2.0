/**
 * useSemanticSearch TanStack Query Hook
 * Feature: semantic-search-expansion
 *
 * Custom hook for semantic vector search using TanStack Query
 * Semantic search finds conceptually similar content using embeddings
 *
 * Supports all seven dossier types plus other entity types:
 * - Dossiers: country, organization, forum, theme
 * - Other entities: positions, documents, briefs, engagements, persons
 */

import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// All supported entity types for semantic search
export type SemanticEntityType =
  | 'dossiers' // All dossier types combined
  | 'country' // Country dossiers only
  | 'organization' // Organization dossiers only
  | 'forum' // Forum dossiers only
  | 'theme' // Theme dossiers only
  | 'positions' // Position documents
  | 'documents' // Attachments
  | 'briefs' // AI-generated briefs

// Dossier subtypes for filtering
export type DossierSubtype = 'country' | 'organization' | 'forum' | 'theme'

// Match type indicator
export type MatchType = 'semantic' | 'fulltext' | 'hybrid'

export interface SemanticSearchOptions {
  /** Natural language search query (supports English and Arabic) */
  query: string
  /** Entity types to search */
  entityTypes?: SemanticEntityType[]
  /** Minimum similarity threshold (0.0-1.0, default: 0.6) */
  similarityThreshold?: number
  /** Maximum number of results (default: 50) */
  limit?: number
  /** Include full-text search results for hybrid mode */
  includeFulltext?: boolean
  /** Query language hint: 'en', 'ar', or 'auto' (default) */
  language?: 'en' | 'ar' | 'auto'
  /** Filter dossiers by specific types */
  dossierTypes?: DossierSubtype[]
  /** Include detailed metadata in results */
  includeMetadata?: boolean
}

export interface SemanticSearchResult {
  /** Entity unique identifier */
  entity_id: string
  /** Title in English */
  entity_title: string
  /** Title in Arabic */
  entity_title_ar: string
  /** Description/snippet in English */
  description_en: string | null
  /** Description/snippet in Arabic */
  description_ar: string | null
  /** Similarity score (0.0-1.0, higher is more similar) */
  similarity_score: number
  /** Entity type */
  entity_type: string
  /** Entity subtype (e.g., dossier type) */
  entity_subtype: string | null
  /** Last updated timestamp */
  updated_at: string
  /** Additional metadata (if requested) */
  metadata?: Record<string, unknown>
  /** How this result was matched */
  match_type: MatchType
  /** Position in ranked results */
  rank_position: number
}

export interface SemanticSearchResponse {
  /** Search results */
  data: SemanticSearchResult[]
  /** Total count of results */
  count: number
  /** Query information */
  query: {
    original: string
    detected_language: string
    entity_types: string[]
    similarity_threshold: number
  }
  /** Performance metrics */
  performance: {
    embedding_ms: number
    vector_search_ms: number
    fulltext_search_ms?: number
    total_ms: number
  }
  /** Embedding model information */
  embedding_info: {
    model: string
    dimensions: number
    generated: boolean
  }
  /** Warning messages */
  warnings: string[]
}

// Legacy type for backwards compatibility
export interface LegacySemanticSearchResponse {
  results: SemanticSearchResult[]
  exact_matches?: SemanticSearchResult[]
  performance: {
    embedding_generation_ms: number
    vector_search_ms: number
    keyword_search_ms?: number
    total_ms: number
  }
  query: {
    text: string
    normalized: string
    embedding_model: string
  }
}

/**
 * Get the Supabase Edge Function URL for semantic search
 */
function getSemanticSearchUrl(): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  return `${supabaseUrl}/functions/v1/semantic-search-unified`
}

/**
 * Perform unified semantic search using vector embeddings
 *
 * Supports all seven dossier types (country, organization, forum, theme)
 * plus positions, documents, briefs, engagements, and persons.
 *
 * @returns TanStack Mutation result
 *
 * @example
 * ```typescript
 * const { mutate, data, isPending } = useUnifiedSemanticSearch();
 *
 * // Search all dossier types
 * mutate({
 *   query: 'climate change policy in the Middle East',
 *   entityTypes: ['dossiers', 'positions', 'engagements'],
 *   includeFulltext: true
 * });
 *
 * // Search specific dossier types
 * mutate({
 *   query: 'bilateral trade agreements',
 *   entityTypes: ['dossiers'],
 *   dossierTypes: ['country', 'organization']
 * });
 *
 * // Arabic language query
 * mutate({
 *   query: 'اتفاقيات التجارة الثنائية',
 *   language: 'ar'
 * });
 * ```
 */
export function useUnifiedSemanticSearch() {
  return useMutation({
    mutationFn: async (options: SemanticSearchOptions): Promise<SemanticSearchResponse> => {
      const {
        query,
        entityTypes = ['dossiers', 'positions', 'documents', 'briefs'],
        similarityThreshold = 0.6,
        limit = 50,
        includeFulltext = false,
        language = 'auto',
        dossierTypes,
        includeMetadata = false,
      } = options

      // Validate query
      if (!query || query.trim().length === 0) {
        throw new Error('Search query cannot be empty')
      }

      // Validate similarity threshold
      if (similarityThreshold < 0 || similarityThreshold > 1) {
        throw new Error('Similarity threshold must be between 0.0 and 1.0')
      }

      // Get current session token
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Not authenticated')
      }

      // Build request body
      const requestBody = {
        query: query.trim(),
        entity_types: entityTypes,
        similarity_threshold: similarityThreshold,
        limit,
        include_fulltext: includeFulltext,
        language,
        dossier_types: dossierTypes,
        include_metadata: includeMetadata,
      }

      // Make API request to unified Edge Function
      const response = await fetch(getSemanticSearchUrl(), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const error = await response.json()

        if (response.status === 401) {
          throw new Error('Authentication required')
        }

        if (response.status === 503) {
          throw new Error('Semantic search is temporarily unavailable. Please try again later.')
        }

        throw new Error(error.message || error.message_ar || 'Semantic search failed')
      }

      const data: SemanticSearchResponse = await response.json()

      // Performance warning
      if (data.performance.total_ms > 1500) {
        console.warn(
          `Semantic search took ${data.performance.total_ms}ms (target: <1500ms)`,
          data.performance,
        )
      }

      return data
    },

    // Retry configuration
    retry: 1,
    retryDelay: 1000,
  })
}

/**
 * Legacy hook for backwards compatibility
 * @deprecated Use useUnifiedSemanticSearch instead
 */
export function useSemanticSearch() {
  return useMutation({
    mutationFn: async (
      options: Omit<SemanticSearchOptions, 'dossierTypes' | 'includeMetadata'> & {
        includeKeywordResults?: boolean
      },
    ) => {
      const {
        query,
        entityTypes = ['positions', 'documents', 'briefs'],
        similarityThreshold = 0.6,
        limit = 20,
        includeKeywordResults = false,
      } = options

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Not authenticated')
      }

      // Try unified endpoint first, fallback to legacy
      try {
        const response = await fetch(getSemanticSearchUrl(), {
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
            include_fulltext: includeKeywordResults,
          }),
        })

        if (response.ok) {
          const data: SemanticSearchResponse = await response.json()

          // Transform to legacy format
          return {
            results: data.data,
            performance: {
              embedding_generation_ms: data.performance.embedding_ms,
              vector_search_ms: data.performance.vector_search_ms,
              keyword_search_ms: data.performance.fulltext_search_ms,
              total_ms: data.performance.total_ms,
            },
            query: {
              text: data.query.original,
              normalized: data.query.original.toLowerCase(),
              embedding_model: data.embedding_info.model,
            },
          } as LegacySemanticSearchResponse
        }
      } catch {
        // Fallback to legacy endpoint
      }

      // Legacy API fallback
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

      return response.json() as Promise<LegacySemanticSearchResponse>
    },

    retry: 1,
    retryDelay: 1000,
  })
}

/**
 * Query-based hook for unified semantic search with caching
 * Useful when you want automatic caching and background refetching
 */
export function useUnifiedSemanticSearchQuery(
  options: SemanticSearchOptions & { enabled?: boolean },
) {
  const {
    query,
    entityTypes = ['dossiers', 'positions', 'documents', 'briefs', 'engagements', 'persons'],
    similarityThreshold = 0.6,
    limit = 50,
    includeFulltext = false,
    language = 'auto',
    dossierTypes,
    includeMetadata = false,
    enabled = false,
  } = options

  return useQuery({
    queryKey: [
      'semantic-search-unified',
      query,
      entityTypes,
      similarityThreshold,
      limit,
      includeFulltext,
      language,
      dossierTypes,
      includeMetadata,
    ],

    queryFn: async (): Promise<SemanticSearchResponse> => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(getSemanticSearchUrl(), {
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
          include_fulltext: includeFulltext,
          language,
          dossier_types: dossierTypes,
          include_metadata: includeMetadata,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Semantic search failed')
      }

      return response.json()
    },

    enabled: enabled && query.trim().length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    retryDelay: 1000,
  })
}

/**
 * Hook to check if semantic search is available
 */
export function useSemanticSearchAvailability() {
  return useQuery({
    queryKey: ['semantic-search-availability'],
    queryFn: async (): Promise<boolean> => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          return false
        }

        const response = await fetch(getSemanticSearchUrl(), {
          method: 'OPTIONS',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })

        return response.ok
      } catch {
        return false
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  })
}

/**
 * Utility to check if semantic search is available (non-hook version)
 */
export async function checkSemanticSearchAvailability(): Promise<boolean> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return false
    }

    const response = await fetch(getSemanticSearchUrl(), {
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

/**
 * Get all available entity types for semantic search
 */
export function getSemanticEntityTypes(): SemanticEntityType[] {
  return [
    'dossiers',
    'country',
    'organization',
    'forum',
    'theme',
    'positions',
    'documents',
    'briefs',
  ]
}

/**
 * Get dossier-specific entity types
 */
export function getDossierEntityTypes(): DossierSubtype[] {
  return ['country', 'organization', 'forum', 'theme']
}

// Legacy export for backwards compatibility
export function useSemanticSearchQuery(
  options: Omit<SemanticSearchOptions, 'dossierTypes' | 'includeMetadata'> & {
    includeKeywordResults?: boolean
  },
) {
  const {
    query,
    entityTypes = ['positions', 'documents', 'briefs'],
    similarityThreshold = 0.6,
    limit = 20,
    includeKeywordResults = false,
  } = options

  return useUnifiedSemanticSearchQuery({
    query,
    entityTypes,
    similarityThreshold,
    limit,
    includeFulltext: includeKeywordResults,
    enabled: false,
  })
}
