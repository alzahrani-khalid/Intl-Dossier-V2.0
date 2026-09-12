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
  DossierSearchResult,
  RelatedWorkItem,
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
 * One row of the deployed `search` function's 200 envelope
 * (`supabase/functions/search/index.ts:242-257`; probed against staging 2026-08-16).
 */
interface SearchEnvelopeRow {
  id: string
  type: DossierType
  name_en: string
  name_ar: string
  description_en: string | null
  description_ar: string | null
  status: string
  sensitivity_level: number
  tags: string[]
  created_at: string
  updated_at: string
  rank: number
  snippet: string
}

/**
 * The REAL envelope the deployed `search` function returns — `{data, count, limit, offset, query,
 * took_ms, warnings, metadata}`. It has no `dossiers` key and never had one; the client contract
 * `DossierFirstSearchResponse` describes a `dossier_first` server branch that was never built.
 */
interface SearchEnvelope {
  data: SearchEnvelopeRow[]
  count: number
  limit: number
  offset: number
  query: { original: string; normalized: string }
  took_ms: number
  metadata?: { has_more?: boolean; next_offset?: number | null }
}

/**
 * `quickswitcher-search` slices its work results to 40% of the requested limit
 * (`supabase/functions/quickswitcher-search/index.ts` response builder). Knowing that cap is what
 * makes `has_more_work` an honest "there may be more" rather than a permanent "that is all".
 */
const QUICKSWITCHER_WORK_SHARE = 0.4

/** A body we cannot read is an error, never an empty result set (D-03/D-10). */
function assertSearchEnvelope(body: unknown): asserts body is SearchEnvelope {
  const envelope = body as Partial<SearchEnvelope> | null | undefined
  if (
    envelope == null ||
    !Array.isArray(envelope.data) ||
    typeof envelope.count !== 'number' ||
    typeof envelope.limit !== 'number' ||
    envelope.limit <= 0 ||
    typeof envelope.offset !== 'number' ||
    envelope.query == null
  ) {
    throw new Error('malformed search envelope')
  }
}

function assertQuickSwitcherEnvelope(body: unknown): asserts body is QuickSwitcherSearchResponse {
  const envelope = body as Partial<QuickSwitcherSearchResponse> | null | undefined
  if (envelope == null || !Array.isArray(envelope.related_work) || envelope.query == null) {
    throw new Error('malformed quickswitcher envelope')
  }
}

/**
 * Adapts the two real server responses to the client's `DossierFirstSearchResponse`.
 *
 * Every field below is carried from a server answer. Fields the client type declares but no
 * deployed function returns — a dossier's `stats` and `matched_fields`, a work item's `created_at`
 * — are left ABSENT rather than filled with a plausible zero: a fabricated count reads as a fact.
 *
 * Malformed input throws. That is the whole point: the query then rejects and the page renders its
 * error state, instead of an empty result set standing in for a body the client could not read.
 */
export function adaptSearchEnvelope(
  searchBody: unknown,
  quickswitcherBody: unknown,
  requestedLimit: number,
): DossierFirstSearchResponse {
  assertSearchEnvelope(searchBody)
  assertQuickSwitcherEnvelope(quickswitcherBody)

  const dossiers: DossierSearchResult[] = searchBody.data.map((row) => ({
    id: row.id,
    type: row.type,
    name_en: row.name_en,
    name_ar: row.name_ar,
    description_en: row.description_en ?? undefined,
    description_ar: row.description_ar ?? undefined,
    status: row.status as DossierSearchResult['status'],
    sensitivity_level: row.sensitivity_level,
    tags: row.tags,
    // `rank` IS the search function's relevance ordering value — a rename, not a new claim.
    relevance_score: row.rank,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))

  const relatedWork: RelatedWorkItem[] = quickswitcherBody.related_work.map((item) => ({
    id: item.id,
    type: item.type,
    title_en: item.title_en,
    title_ar: item.title_ar,
    description_en: item.description_en,
    description_ar: item.description_ar,
    status: item.status,
    priority: item.priority,
    relevance_score: item.relevance_score,
    // The server names ONE matched field; the client type holds a list. Widening a real value.
    matched_fields: [item.matched_field],
    updated_at: item.updated_at,
    deadline: item.deadline,
    dossier_context: item.dossier_context,
  }))

  return {
    dossiers,
    dossiers_total: searchBody.count,
    related_work: relatedWork,
    // quickswitcher-search returns no totals, so the only honest total is what it sent.
    related_work_total: relatedWork.length,
    query: {
      text: searchBody.query.original,
      normalized: searchBody.query.normalized,
      language_detected: quickswitcherBody.query.language_detected,
    },
    took_ms: searchBody.took_ms,
    page: Math.floor(searchBody.offset / searchBody.limit) + 1,
    page_size: searchBody.limit,
    has_more_dossiers: searchBody.metadata?.has_more === true,
    // A full slice means there may be more; quickswitcher cannot say how many more.
    has_more_work: relatedWork.length >= Math.ceil(requestedLimit * QUICKSWITCHER_WORK_SHARE),
  }
}

/**
 * Fetch dossier-first search results.
 *
 * Two real questions: matching dossiers from `search`, related work from `quickswitcher-search`.
 * A rejection from either fails the query — the page then renders its error state, which is
 * truthful. Answering the related-work half with `[]` because nobody asked would not be.
 */
export async function getDossierFirstSearch(
  query: string,
  filters: DossierSearchFilters,
  page: number,
  pageSize: number,
): Promise<DossierFirstSearchResponse> {
  const params = new URLSearchParams()
  params.set('q', query)
  // The deployed function reads `limit`/`offset` and ignores `page`/`page_size`/`dossier_first`.
  params.set('limit', pageSize.toString())
  params.set('offset', ((page - 1) * pageSize).toString())

  if (filters.types !== 'all' && Array.isArray(filters.types)) {
    params.set('types', filters.types.join(','))
  }
  if (filters.status !== 'all') {
    params.set('status', filters.status)
  }
  if (filters.myDossiersOnly) {
    params.set('my_dossiers', 'true')
  }

  const [searchBody, quickswitcherBody] = await Promise.all([
    apiGet<unknown>(`/search?${params.toString()}`),
    getQuickSwitcherSearch(query, pageSize),
  ])

  return adaptSearchEnvelope(searchBody, quickswitcherBody, pageSize)
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
