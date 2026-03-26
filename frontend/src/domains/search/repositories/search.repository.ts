/**
 * Search Repository
 * @module domains/search/repositories/search.repository
 *
 * All search-related API operations targeting Edge Functions.
 * Uses the shared apiClient for auth, base URL, and error handling.
 */

import { apiGet, apiPost, apiDelete } from '@/lib/api-client'
import type {
  AdvancedSearchRequest,
  AdvancedSearchResponse,
  CategorizedSuggestions,
  SearchHistoryItem,
  FilterCount,
} from '../types'

// ============================================================================
// Advanced Search
// ============================================================================

/**
 * Execute an advanced multi-criteria search.
 */
export async function advancedSearch(
  request: AdvancedSearchRequest,
): Promise<AdvancedSearchResponse> {
  return apiPost<AdvancedSearchResponse>('/advanced-search', request)
}

// ============================================================================
// Enhanced Search - Suggestions
// ============================================================================

/**
 * Fetch search suggestions for a query.
 */
export async function fetchSuggestions(
  query: string,
  entityTypes: string[],
  limit: number = 10,
): Promise<CategorizedSuggestions> {
  const params = new URLSearchParams({
    q: query,
    types: entityTypes.join(','),
    limit: limit.toString(),
    include_history: 'true',
  })
  const data = await apiGet<{ suggestions: CategorizedSuggestions }>(
    `/search-suggestions?${params}`,
  )
  return data.suggestions
}

/**
 * Fetch user search history.
 */
export async function fetchSearchHistory(
  limit: number = 10,
): Promise<SearchHistoryItem[]> {
  const data = await apiGet<{ history: SearchHistoryItem[] }>(
    `/search-suggestions/history?limit=${limit}`,
  )
  return data.history
}

/**
 * Add a search to the user's history.
 */
export async function addSearchToHistory(
  query: string,
  entityTypes: string[],
  resultCount: number,
  filters?: Record<string, unknown>,
): Promise<string> {
  const data = await apiPost<{ history_id: string }>(
    '/search-suggestions/history',
    {
      query,
      entity_types: entityTypes,
      result_count: resultCount,
      filters,
    },
  )
  return data.history_id
}

/**
 * Clear user search history.
 */
export async function clearSearchHistory(): Promise<number> {
  const data = await apiDelete<{ deleted_count: number }>('/search-suggestions/history')
  return data.deleted_count
}

/**
 * Fetch adaptive filter counts.
 */
export async function fetchFilterCounts(
  cacheKey: string,
  entityTypes: string[],
  baseQuery?: string,
): Promise<FilterCount[]> {
  const data = await apiPost<{ filter_counts: FilterCount[] }>(
    '/search-suggestions/filter-counts',
    {
      cache_key: cacheKey,
      entity_types: entityTypes,
      base_query: baseQuery,
      compute_if_missing: true,
    },
  )
  return data.filter_counts
}

// ============================================================================
// Saved Search Templates
// ============================================================================

/** Saved search template */
export interface SavedSearchTemplate {
  id: string
  name: string
  description?: string
  search_config: Record<string, unknown>
  is_shared: boolean
  created_at: string
  updated_at: string
}

/**
 * Fetch all saved search templates.
 */
export async function getSavedSearchTemplates(
  params?: { shared_only?: boolean },
): Promise<SavedSearchTemplate[]> {
  const searchParams = new URLSearchParams()
  if (params?.shared_only) searchParams.set('shared_only', 'true')
  const query = searchParams.toString()
  return apiGet<SavedSearchTemplate[]>(
    `/search-templates${query ? `?${query}` : ''}`,
  )
}

/**
 * Get a single saved search template by ID.
 */
export async function getSavedSearchTemplate(id: string): Promise<SavedSearchTemplate> {
  return apiGet<SavedSearchTemplate>(`/search-templates/${id}`)
}

/**
 * Create a new saved search template.
 */
export async function createSavedSearchTemplate(
  template: Omit<SavedSearchTemplate, 'id' | 'created_at' | 'updated_at'>,
): Promise<SavedSearchTemplate> {
  return apiPost<SavedSearchTemplate>('/search-templates', template)
}

/**
 * Update a saved search template.
 */
export async function updateSavedSearchTemplate(
  params: { id: string } & Partial<Omit<SavedSearchTemplate, 'id' | 'created_at' | 'updated_at'>>,
): Promise<SavedSearchTemplate> {
  const { id, ...data } = params
  return apiPost<SavedSearchTemplate>(`/search-templates/${id}`, data)
}

/**
 * Delete a saved search template.
 */
export async function deleteSavedSearchTemplate(id: string): Promise<void> {
  await apiDelete<void>(`/search-templates/${id}`)
}
