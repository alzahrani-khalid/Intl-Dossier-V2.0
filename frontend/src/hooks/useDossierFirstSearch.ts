/**
 * useDossierFirstSearch Hook
 * Feature: Dossier-first search experience
 *
 * Custom TanStack Query hook for the dossier-first search pattern.
 * Returns search results organized into two sections:
 * - Dossiers: Matching dossiers with stats
 * - Related Work: Items linked to matching dossiers
 *
 * Includes debouncing, caching, and mock data for development.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { DossierType } from '@/lib/dossier-type-guards'
import type {
  DossierSearchFilters,
  DossierFirstSearchResponse,
  DossierSearchResult,
  RelatedWorkItem,
} from '@/types/dossier-search.types'

// Get Supabase URL for Edge Functions
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

/**
 * Debounce helper
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * API request for dossier-first search
 */
async function fetchDossierFirstSearch(
  query: string,
  filters: DossierSearchFilters,
  page: number,
  pageSize: number,
): Promise<DossierFirstSearchResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  // Build query parameters
  const params = new URLSearchParams()
  params.set('q', query)
  params.set('page', page.toString())
  params.set('page_size', pageSize.toString())

  // Type filter
  if (filters.types !== 'all' && Array.isArray(filters.types)) {
    params.set('types', JSON.stringify(filters.types))
  }

  // Status filter
  if (filters.status !== 'all') {
    params.set('status', filters.status)
  }

  // My dossiers filter
  if (filters.myDossiersOnly) {
    params.set('my_dossiers', 'true')
  }

  const url = `${supabaseUrl}/functions/v1/search?${params.toString()}&dossier_first=true`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Search failed')
  }

  // The existing search endpoint returns standard results
  // We transform them into dossier-first format
  const data = await response.json()

  // Transform to dossier-first format
  return transformToDelowFirstFormat(data, query)
}

/**
 * Transform standard search response to dossier-first format
 * This creates mock dossier stats and groups related work by dossier context
 */
function transformToDelowFirstFormat(
  standardResponse: any,
  query: string,
): DossierFirstSearchResponse {
  const results = standardResponse.results || []

  // Separate dossiers from other entities
  const dossierTypes: DossierType[] = [
    'country',
    'organization',
    'forum',
    'engagement',
    'topic',
    'working_group',
    'person',
    'elected_official',
  ]

  const dossiers: DossierSearchResult[] = []
  const relatedWork: RelatedWorkItem[] = []

  results.forEach((result: any) => {
    const type = result.type || result.entity_type

    if (dossierTypes.includes(type)) {
      // Transform to DossierSearchResult
      dossiers.push({
        id: result.id,
        type: type as DossierType,
        name_en: result.title_en || result.name_en || result.title,
        name_ar: result.title_ar || result.name_ar || result.title,
        description_en: result.description_en || result.snippet_en,
        description_ar: result.description_ar || result.snippet_ar,
        status: result.is_archived ? 'archived' : 'active',
        sensitivity_level: result.sensitivity_level || 1,
        tags: result.tags || [],
        relevance_score: result.rank_score || result.relevance_score || 0,
        matched_fields: result.matched_fields || [],
        created_at: result.created_at || new Date().toISOString(),
        updated_at: result.updated_at || new Date().toISOString(),
        stats: {
          total_engagements: Math.floor(Math.random() * 10),
          total_documents: Math.floor(Math.random() * 15),
          total_positions: Math.floor(Math.random() * 5),
          total_work_items: Math.floor(Math.random() * 20),
          recent_activity_date: result.updated_at,
          related_dossiers_count: Math.floor(Math.random() * 8),
        },
      })
    } else {
      // Transform to RelatedWorkItem
      // Create a mock dossier context (in real implementation, this would come from the API)
      const mockDossierContext = dossiers[0] || {
        id: 'mock-dossier',
        type: 'country' as DossierType,
        name_en: 'Related Dossier',
        name_ar: 'الملف المرتبط',
      }

      relatedWork.push({
        id: result.id,
        type: mapToRelatedWorkType(type),
        title_en: result.title_en || result.name_en || result.title,
        title_ar: result.title_ar || result.name_ar || result.title,
        description_en: result.description_en || result.snippet_en,
        description_ar: result.description_ar || result.snippet_ar,
        status: result.status,
        priority: result.priority,
        relevance_score: result.rank_score || result.relevance_score || 0,
        matched_fields: result.matched_fields || [],
        created_at: result.created_at || new Date().toISOString(),
        updated_at: result.updated_at || new Date().toISOString(),
        deadline: result.deadline || result.due_date,
        dossier_context: {
          id: mockDossierContext.id,
          type: mockDossierContext.type,
          name_en: mockDossierContext.name_en,
          name_ar: mockDossierContext.name_ar,
        },
        inheritance_source: result.inheritance_source || 'direct',
      })
    }
  })

  return {
    dossiers,
    dossiers_total: standardResponse.counts?.dossiers || dossiers.length,
    related_work: relatedWork,
    related_work_total:
      (standardResponse.counts?.total || 0) -
      (standardResponse.counts?.dossiers || dossiers.length),
    query: {
      text: query,
      normalized: query.toLowerCase().trim(),
      language_detected: detectLanguage(query),
    },
    took_ms: standardResponse.took_ms || 0,
    page: standardResponse.page || 1,
    page_size: standardResponse.page_size || 20,
    has_more_dossiers: dossiers.length >= 10,
    has_more_work: relatedWork.length >= 10,
  }
}

/**
 * Map entity type to RelatedWorkType
 */
function mapToRelatedWorkType(
  type: string,
): 'position' | 'document' | 'mou' | 'engagement' | 'task' | 'commitment' | 'intake' {
  const mapping: Record<string, any> = {
    position: 'position',
    positions: 'position',
    document: 'document',
    documents: 'document',
    mou: 'mou',
    mous: 'mou',
    task: 'task',
    tasks: 'task',
    commitment: 'commitment',
    commitments: 'commitment',
    intake: 'intake',
    intakes: 'intake',
  }

  return mapping[type.toLowerCase()] || 'document'
}

/**
 * Simple language detection
 */
function detectLanguage(text: string): 'ar' | 'en' | 'mixed' {
  const arabicPattern = /[\u0600-\u06FF]/
  const englishPattern = /[a-zA-Z]/

  const hasArabic = arabicPattern.test(text)
  const hasEnglish = englishPattern.test(text)

  if (hasArabic && hasEnglish) return 'mixed'
  if (hasArabic) return 'ar'
  return 'en'
}

/**
 * Default filters
 */
export const DEFAULT_FILTERS: DossierSearchFilters = {
  types: 'all',
  status: 'all',
  myDossiersOnly: false,
  query: '',
}

/**
 * useDossierFirstSearch hook
 *
 * @param initialQuery - Initial search query
 * @param initialFilters - Initial filter state
 * @param options - Hook options
 * @returns Search state and methods
 */
export function useDossierFirstSearch(
  initialQuery: string = '',
  initialFilters: Partial<DossierSearchFilters> = {},
  options: {
    debounceMs?: number
    pageSize?: number
    enabled?: boolean
  } = {},
) {
  const { debounceMs = 300, pageSize = 20, enabled = true } = options
  const queryClient = useQueryClient()

  // State
  const [query, setQuery] = useState(initialQuery)
  const [filters, setFilters] = useState<DossierSearchFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
    query: initialQuery,
  })
  const [dossierPage, setDossierPage] = useState(1)
  const [workPage, setWorkPage] = useState(1)

  // Debounced query
  const debouncedQuery = useDebounce(query, debounceMs)

  // Update filters.query when query changes
  useEffect(() => {
    setFilters((prev) => ({ ...prev, query }))
  }, [query])

  // Main search query
  const searchQuery = useQuery({
    queryKey: ['dossier-first-search', debouncedQuery, filters, dossierPage, workPage, pageSize],
    queryFn: () => fetchDossierFirstSearch(debouncedQuery, filters, dossierPage, pageSize),
    enabled: enabled && debouncedQuery.trim().length > 0,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    placeholderData: (previousData) => previousData,
  })

  // Type counts (for filter UI)
  const typeCounts = useMemo(() => {
    if (!searchQuery.data) return undefined

    // Mock type counts - in real implementation these would come from the API
    const counts: Record<DossierType | 'all', number> = {
      all: searchQuery.data.dossiers_total,
      country: 0,
      organization: 0,
      forum: 0,
      engagement: 0,
      topic: 0,
      working_group: 0,
      person: 0,
      elected_official: 0,
    }

    searchQuery.data.dossiers.forEach((d) => {
      counts[d.type] = (counts[d.type] || 0) + 1
    })

    return counts
  }, [searchQuery.data])

  // Load more handlers
  const loadMoreDossiers = () => {
    if (searchQuery.data?.has_more_dossiers) {
      setDossierPage((prev) => prev + 1)
    }
  }

  const loadMoreWork = () => {
    if (searchQuery.data?.has_more_work) {
      setWorkPage((prev) => prev + 1)
    }
  }

  // Update filters
  const updateFilters = (newFilters: Partial<DossierSearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
    setDossierPage(1)
    setWorkPage(1)
  }

  // Clear search
  const clearSearch = () => {
    setQuery('')
    setFilters({ ...DEFAULT_FILTERS })
    setDossierPage(1)
    setWorkPage(1)
  }

  // Prefetch next page
  const prefetchNextPage = () => {
    if (!searchQuery.data) return

    if (searchQuery.data.has_more_dossiers) {
      queryClient.prefetchQuery({
        queryKey: [
          'dossier-first-search',
          debouncedQuery,
          filters,
          dossierPage + 1,
          workPage,
          pageSize,
        ],
        queryFn: () => fetchDossierFirstSearch(debouncedQuery, filters, dossierPage + 1, pageSize),
      })
    }
  }

  return {
    // State
    query,
    filters,
    dossierPage,
    workPage,

    // Data
    dossiers: searchQuery.data?.dossiers || [],
    relatedWork: searchQuery.data?.related_work || [],
    dossiersTotal: searchQuery.data?.dossiers_total || 0,
    relatedWorkTotal: searchQuery.data?.related_work_total || 0,
    hasMoreDossiers: searchQuery.data?.has_more_dossiers || false,
    hasMoreWork: searchQuery.data?.has_more_work || false,
    typeCounts,

    // Query metadata
    queryMetadata: searchQuery.data?.query,
    tookMs: searchQuery.data?.took_ms,

    // Loading/error states
    isLoading: searchQuery.isLoading,
    isFetching: searchQuery.isFetching,
    isError: searchQuery.isError,
    error: searchQuery.error,

    // Actions
    setQuery,
    updateFilters,
    loadMoreDossiers,
    loadMoreWork,
    clearSearch,
    prefetchNextPage,
    refetch: searchQuery.refetch,
  }
}
