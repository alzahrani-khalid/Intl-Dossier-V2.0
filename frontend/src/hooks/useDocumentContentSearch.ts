/**
 * Document Content Search Hooks
 * @module hooks/useDocumentContentSearch
 * @feature document-ocr-indexing
 *
 * React hooks for full-text search within OCR-extracted document content
 * with bilingual support (Arabic and English).
 *
 * @description
 * This module provides hooks for searching document content:
 * - Full-text search with PostgreSQL tsvector indexing
 * - Bilingual search support (Arabic, English, or both)
 * - Debounced query input to reduce API calls
 * - Infinite scrolling with cursor pagination
 * - Entity-scoped search (search within specific dossier/brief)
 * - Confidence-based filtering (OCR accuracy threshold)
 * - Result snippets with query highlighting
 * - Rank scoring for relevance sorting
 *
 * @example
 * // Basic content search with debouncing
 * const { data, isLoading } = useDocumentContentSearch({
 *   query: searchTerm,
 *   language: 'all',
 * });
 *
 * @example
 * // Search within entity's documents
 * const { data } = useEntityDocumentSearch(
 *   'dossier',
 *   dossierId,
 *   'climate change',
 *   { language: 'en', minConfidence: 0.8 }
 * );
 *
 * @example
 * // Infinite scroll search
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage,
 * } = useInfiniteDocumentSearch({
 *   query: 'bilateral agreement',
 *   min_confidence: 0.7,
 * });
 */
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useDebouncedValue } from './useDebouncedValue'

// Types
export type SearchLanguage = 'en' | 'ar' | 'all'

export interface DocumentSearchResult {
  document_id: string
  document_table: string
  title: string
  title_ar?: string
  snippet: string
  rank_score: number
  ocr_confidence: number
  language_detected: string[]
  mime_type?: string
  file_size?: number
  storage_path?: string
  created_at: string
  owner_type?: string
  owner_id?: string
}

export interface DocumentSearchResponse {
  results: DocumentSearchResult[]
  total_count: number
  query: string
  language: string
  processing_time_ms: number
}

export interface DocumentSearchFilters {
  query: string
  language?: SearchLanguage
  limit?: number
  offset?: number
  min_confidence?: number
  owner_type?: string
  owner_id?: string
}

// Get Supabase URL
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

/**
 * Get authorization headers with current user's JWT token
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
}

/**
 * Search documents by content
 */
async function searchDocuments(filters: DocumentSearchFilters): Promise<DocumentSearchResponse> {
  if (!filters.query || filters.query.trim().length < 2) {
    return {
      results: [],
      total_count: 0,
      query: filters.query || '',
      language: filters.language || 'all',
      processing_time_ms: 0,
    }
  }

  const headers = await getAuthHeaders()

  const params = new URLSearchParams()
  params.append('query', filters.query.trim())
  if (filters.language) params.append('language', filters.language)
  if (filters.limit) params.append('limit', filters.limit.toString())
  if (filters.offset) params.append('offset', filters.offset.toString())
  if (filters.min_confidence) params.append('min_confidence', filters.min_confidence.toString())
  if (filters.owner_type) params.append('owner_type', filters.owner_type)
  if (filters.owner_id) params.append('owner_id', filters.owner_id)

  const response = await fetch(
    `${supabaseUrl}/functions/v1/document-content-search?${params.toString()}`,
    {
      method: 'GET',
      headers,
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Search failed')
  }

  return response.json()
}

/**
 * Hook for searching document content with debouncing
 *
 * @description
 * Full-text search within OCR-extracted document content with automatic
 * debouncing to reduce API calls. Supports bilingual search (Arabic/English),
 * confidence filtering, and entity scoping. Minimum query length is 2 characters.
 *
 * @param filters - Search filters (query, language, owner, confidence threshold)
 * @param options - Optional configuration (enabled flag, debounce delay)
 * @returns TanStack Query result with search results and metadata
 *
 * @example
 * // Basic search with auto-debounce
 * const { data, isLoading } = useDocumentContentSearch({
 *   query: searchTerm,
 *   language: 'all',
 * }, { debounceMs: 300 });
 *
 * @example
 * // Search with confidence filtering
 * const { data } = useDocumentContentSearch({
 *   query: 'climate policy',
 *   language: 'en',
 *   min_confidence: 0.8, // Only high-quality OCR
 * });
 *
 * @example
 * // Search within entity's documents
 * const { data } = useDocumentContentSearch({
 *   query: 'bilateral',
 *   owner_type: 'dossier',
 *   owner_id: dossierId,
 * });
 */
export function useDocumentContentSearch(
  filters: DocumentSearchFilters,
  options?: {
    enabled?: boolean
    debounceMs?: number
  },
) {
  // Debounce search query
  const debouncedQuery = useDebouncedValue(filters.query, options?.debounceMs ?? 300)

  return useQuery({
    queryKey: ['document-content-search', { ...filters, query: debouncedQuery }],
    queryFn: () => searchDocuments({ ...filters, query: debouncedQuery }),
    enabled: debouncedQuery.trim().length >= 2 && options?.enabled !== false,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for infinite scrolling document search
 *
 * @description
 * Provides paginated search results with infinite scroll capability.
 * Automatically manages page parameters and concatenates results.
 * Useful for search result lists with "load more" functionality.
 *
 * @param filters - Search filters (excluding offset, managed by hook)
 * @param options - Optional configuration (enabled, debounce, page size)
 * @returns TanStack Infinite Query result with paginated results
 *
 * @example
 * // Infinite scroll search
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage,
 * } = useInfiniteDocumentSearch({
 *   query: 'trade agreement',
 *   language: 'all',
 * }, { pageSize: 20 });
 *
 * // Render results
 * data?.pages.flatMap(page => page.results).map(result => (
 *   <SearchResult key={result.document_id} {...result} />
 * ));
 *
 * // Load more button
 * <button onClick={() => fetchNextPage()} disabled={!hasNextPage}>
 *   {isFetchingNextPage ? 'Loading...' : 'Load More'}
 * </button>
 */
export function useInfiniteDocumentSearch(
  filters: Omit<DocumentSearchFilters, 'offset'>,
  options?: {
    enabled?: boolean
    debounceMs?: number
    pageSize?: number
  },
) {
  const debouncedQuery = useDebouncedValue(filters.query, options?.debounceMs ?? 300)
  const pageSize = options?.pageSize ?? 20

  return useInfiniteQuery({
    queryKey: ['document-content-search-infinite', { ...filters, query: debouncedQuery }],
    queryFn: async ({ pageParam = 0 }) => {
      return searchDocuments({
        ...filters,
        query: debouncedQuery,
        limit: pageSize,
        offset: pageParam * pageSize,
      })
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.reduce((acc, page) => acc + page.results.length, 0)
      if (totalLoaded < lastPage.total_count) {
        return allPages.length
      }
      return undefined
    },
    initialPageParam: 0,
    enabled: debouncedQuery.trim().length >= 2 && options?.enabled !== false,
    staleTime: 60 * 1000,
  })
}

/**
 * Hook for searching within a specific entity's documents
 */
export function useEntityDocumentSearch(
  ownerType: string,
  ownerId: string,
  query: string,
  options?: {
    enabled?: boolean
    language?: SearchLanguage
    minConfidence?: number
  },
) {
  const debouncedQuery = useDebouncedValue(query, 300)

  return useQuery({
    queryKey: ['entity-document-search', ownerType, ownerId, debouncedQuery, options?.language],
    queryFn: () =>
      searchDocuments({
        query: debouncedQuery,
        owner_type: ownerType,
        owner_id: ownerId,
        language: options?.language || 'all',
        min_confidence: options?.minConfidence,
        limit: 50,
      }),
    enabled:
      !!ownerType && !!ownerId && debouncedQuery.trim().length >= 2 && options?.enabled !== false,
    staleTime: 60 * 1000,
  })
}

/**
 * Helper hook to get search suggestions based on partial query
 */
export function useDocumentSearchSuggestions(
  query: string,
  options?: {
    enabled?: boolean
    maxSuggestions?: number
  },
) {
  const debouncedQuery = useDebouncedValue(query, 200)
  const maxSuggestions = options?.maxSuggestions ?? 5

  return useQuery({
    queryKey: ['document-search-suggestions', debouncedQuery],
    queryFn: async () => {
      const response = await searchDocuments({
        query: debouncedQuery,
        limit: maxSuggestions,
      })

      // Extract unique titles as suggestions
      const titles = new Set<string>()
      response.results.forEach((result) => {
        if (result.title) titles.add(result.title)
        if (result.title_ar) titles.add(result.title_ar)
      })

      return Array.from(titles).slice(0, maxSuggestions)
    },
    enabled: debouncedQuery.trim().length >= 2 && options?.enabled !== false,
    staleTime: 30 * 1000,
  })
}

export default {
  useDocumentContentSearch,
  useInfiniteDocumentSearch,
  useEntityDocumentSearch,
  useDocumentSearchSuggestions,
}
