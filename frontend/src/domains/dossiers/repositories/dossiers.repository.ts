/**
 * Dossiers Repository
 * @module domains/dossiers/repositories/dossiers.repository
 *
 * Plain function exports for all dossier-related API operations.
 * Uses the shared apiClient for auth, base URL, and error handling.
 * This is the canonical pattern for all domain repositories.
 */

import { apiGet, apiPost, apiPatch } from '@/lib/api-client'
import type { DossierFilters, DossierListResponse } from '@/types/dossier'
import type { DossierType } from '@/lib/dossier-type-guards'
import type {
  DossierRecommendationListParams,
  DossierRecommendationListResponse,
  DossierRecommendation,
  DossierRecommendationUpdateParams,
  GenerateDossierRecommendationsParams,
  GenerateDossierRecommendationsResponse,
  TrackInteractionParams,
} from '@/types/dossier-recommendation.types'
import type {
  DossierSearchFilters,
  DossierFirstSearchResponse,
} from '@/types/dossier-search.types'
import type { NoResultsSuggestions } from '@/types/enhanced-search.types'

// ============================================================================
// Dossier List (from useDossiers)
// ============================================================================

/**
 * Fetch paginated dossier list with optional filters.
 */
export async function getDossiers(filters?: DossierFilters): Promise<DossierListResponse> {
  const params = new URLSearchParams()

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, String(v)))
        } else {
          params.append(key, String(value))
        }
      }
    })
  }

  return apiGet<DossierListResponse>(`/dossiers-list?${params.toString()}`)
}

// ============================================================================
// Dossier Recommendations (from useDossierRecommendations)
// ============================================================================

/**
 * Fetch dossier recommendations for a specific source dossier.
 */
export async function getDossierRecommendations(
  params: DossierRecommendationListParams,
): Promise<DossierRecommendationListResponse> {
  const searchParams = new URLSearchParams()
  searchParams.set('source_dossier_id', params.source_dossier_id)

  if (params.limit) searchParams.set('limit', params.limit.toString())
  if (params.offset) searchParams.set('offset', params.offset.toString())
  if (params.status) {
    const statuses = Array.isArray(params.status) ? params.status : [params.status]
    searchParams.set('status', statuses.join(','))
  }
  if (params.min_similarity) {
    searchParams.set('min_similarity', params.min_similarity.toString())
  }
  if (params.include_expired) {
    searchParams.set('include_expired', 'true')
  }

  return apiGet<DossierRecommendationListResponse>(
    `/dossier-recommendations?${searchParams.toString()}`,
  )
}

/**
 * Fetch a single recommendation with full details.
 */
export async function getDossierRecommendation(id: string): Promise<DossierRecommendation> {
  return apiGet<DossierRecommendation>(`/dossier-recommendations/${id}`)
}

/**
 * Update a dossier recommendation.
 */
export async function updateDossierRecommendation(
  id: string,
  updates: DossierRecommendationUpdateParams,
): Promise<DossierRecommendation> {
  return apiPatch<DossierRecommendation>(`/dossier-recommendations/${id}`, updates)
}

/**
 * Track user interaction with a recommendation.
 */
export async function trackRecommendationInteraction(
  params: TrackInteractionParams,
): Promise<{ message_en: string; message_ar: string }> {
  return apiPost<{ message_en: string; message_ar: string }>(
    `/dossier-recommendations/${params.recommendation_id}/interaction`,
    {
      interaction_type: params.interaction_type,
      feedback_text: params.feedback_text,
      context: params.context,
    },
  )
}

/**
 * Generate new recommendations for a dossier.
 */
export async function generateDossierRecommendations(
  params: GenerateDossierRecommendationsParams,
): Promise<GenerateDossierRecommendationsResponse> {
  return apiPost<GenerateDossierRecommendationsResponse>(
    '/dossier-recommendations/generate',
    params,
  )
}

// ============================================================================
// Dossier-First Search (from useDossierFirstSearch)
// ============================================================================

/**
 * Fetch dossier-first search results.
 */
export async function getDossierFirstSearch(
  query: string,
  filters: DossierSearchFilters,
  page: number,
  pageSize: number,
): Promise<DossierFirstSearchResponse> {
  const params = new URLSearchParams()
  params.set('q', query)
  params.set('page', page.toString())
  params.set('page_size', pageSize.toString())
  params.set('dossier_first', 'true')

  if (filters.types !== 'all' && Array.isArray(filters.types)) {
    params.set('types', JSON.stringify(filters.types))
  }
  if (filters.status !== 'all') {
    params.set('status', filters.status)
  }
  if (filters.myDossiersOnly) {
    params.set('my_dossiers', 'true')
  }

  return apiGet<DossierFirstSearchResponse>(`/search?${params.toString()}`)
}

// ============================================================================
// Quick Switcher Search (from useQuickSwitcherSearch)
// ============================================================================

/** Work item type for quick switcher results */
type QuickSwitcherWorkItemType = 'position' | 'task' | 'commitment' | 'intake' | 'mou' | 'document'

/** Quick switcher API response */
export interface QuickSwitcherSearchResponse {
  dossiers: Array<{
    id: string
    type: DossierType
    name_en: string
    name_ar: string
    description_en?: string
    description_ar?: string
    status: 'active' | 'archived'
    relevance_score: number
    matched_field: string
    updated_at: string
    stats?: { total_engagements: number; total_documents: number; total_positions: number }
  }>
  related_work: Array<{
    id: string
    type: QuickSwitcherWorkItemType
    title_en: string
    title_ar: string
    description_en?: string
    description_ar?: string
    status?: string
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    relevance_score: number
    matched_field: string
    updated_at: string
    deadline?: string
    dossier_context?: { id: string; type: DossierType; name_en: string; name_ar: string }
  }>
  query: { text: string; normalized: string; language_detected: 'en' | 'ar' | 'mixed' }
  took_ms: number
  cache_hit: boolean
}

/**
 * Fetch quick switcher search results.
 */
export async function getQuickSwitcherSearch(
  query: string,
  limit: number = 20,
): Promise<QuickSwitcherSearchResponse> {
  const params = new URLSearchParams({ q: query, limit: limit.toString() })
  return apiGet(`/quickswitcher-search?${params.toString()}`)
}

// ============================================================================
// No-Results Suggestions (from useNoResultsSuggestions)
// ============================================================================

/**
 * Fetch intelligent suggestions when search returns no results.
 */
export async function getNoResultsSuggestions(
  query: string,
  entityTypes: string[],
  language: string,
): Promise<NoResultsSuggestions> {
  const params = new URLSearchParams({
    q: query,
    types: entityTypes.join(','),
    lang: language,
  })

  return apiGet<NoResultsSuggestions>(`/search-suggestions/no-results?${params.toString()}`)
}
