/**
 * Positions Repository
 * @module domains/positions/repositories/positions.repository
 *
 * Plain function exports for all position-related API operations.
 * Uses the shared apiClient for auth, base URL, and error handling.
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client'
import type { PositionFilters, PositionListResponse, Position, CreatePositionRequest } from '@/types/position'
import type {
  UpdatePositionVariables,
  SubmitPositionResponse,
  PositionSuggestionsParams,
  PositionSuggestionsResponse,
  PositionAnalytics,
  TopPositionsParams,
  TopPosition,
  PositionDossierLinksFilters,
  PositionDossierLinksResponse,
  CreatePositionDossierLinkInput,
  DeletePositionDossierLinkInput,
} from '../types'

// ============================================================================
// Positions List
// ============================================================================

/**
 * Fetch paginated position list with infinite scroll support.
 */
export async function getPositions(
  filters?: Omit<PositionFilters, 'offset'>,
  pageParam: number = 0,
): Promise<PositionListResponse> {
  const params = new URLSearchParams()
  const pageSize = filters?.limit || 20

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'limit') {
        params.append(key, String(value))
      }
    })
  }

  params.append('limit', String(pageSize))
  params.append('offset', String(pageParam))

  return apiGet<PositionListResponse>(`/positions-list?${params.toString()}`)
}

// ============================================================================
// Single Position
// ============================================================================

/**
 * Fetch a single position by ID.
 */
export async function getPosition(id: string): Promise<Position> {
  return apiGet<Position>(`/positions-get?position_id=${id}`)
}

// ============================================================================
// Create Position
// ============================================================================

/**
 * Create a new position.
 */
export async function createPosition(data: CreatePositionRequest): Promise<Position> {
  return apiPost<Position>('/positions-create', data)
}

// ============================================================================
// Update Position
// ============================================================================

/**
 * Update an existing position.
 */
export async function updatePosition({ id, data }: UpdatePositionVariables): Promise<Position> {
  return apiPut<Position>(`/positions-update?id=${id}`, data)
}

// ============================================================================
// Submit Position
// ============================================================================

/**
 * Submit a position for review.
 */
export async function submitPosition(id: string): Promise<SubmitPositionResponse> {
  return apiPut<SubmitPositionResponse>(`/positions-submit?id=${id}`, {})
}

// ============================================================================
// Position Suggestions (AI)
// ============================================================================

/**
 * Fetch AI-suggested positions for an engagement.
 */
export async function getPositionSuggestions(
  params: PositionSuggestionsParams,
): Promise<PositionSuggestionsResponse> {
  const { engagementId, minRelevance = 0.7, limit = 10 } = params
  return apiGet<PositionSuggestionsResponse>(
    `/engagements/${engagementId}/positions/suggestions?min_relevance=${minRelevance}&limit=${limit}`,
  )
}

// ============================================================================
// Position Analytics
// ============================================================================

/**
 * Fetch usage analytics for a position.
 */
export async function getPositionAnalytics(positionId: string): Promise<PositionAnalytics> {
  return apiGet<PositionAnalytics>(`/positions/${positionId}/analytics`)
}

/**
 * Fetch top positions by various metrics.
 */
export async function getTopPositions(options: TopPositionsParams = {}): Promise<TopPosition[]> {
  const { metric = 'popularity', timeRange = '30d', limit = 10 } = options
  const result = await apiGet<{ data: TopPosition[] }>(
    `/positions/analytics/top?metric=${metric}&time_range=${timeRange}&limit=${limit}`,
  )
  return result.data || []
}

// ============================================================================
// Position Dossier Links
// ============================================================================

/**
 * Fetch dossier links for a position.
 */
export async function getPositionDossierLinks(
  positionId: string,
  filters?: PositionDossierLinksFilters,
): Promise<PositionDossierLinksResponse> {
  const params = new URLSearchParams({ positionId })
  if (filters?.link_type) {
    params.append('link_type', filters.link_type)
  }
  return apiGet<PositionDossierLinksResponse>(`/positions-dossiers-get?${params.toString()}`)
}

/**
 * Create a link between a position and a dossier.
 */
export async function createPositionDossierLink(
  positionId: string,
  input: CreatePositionDossierLinkInput,
): Promise<PositionDossierLink> {
  return apiPost<PositionDossierLink>(
    `/positions-dossiers-create?positionId=${positionId}`,
    input,
  )
}

/**
 * Delete a link between a position and a dossier.
 */
export async function deletePositionDossierLink(
  input: DeletePositionDossierLinkInput,
): Promise<{ success: boolean }> {
  const params = new URLSearchParams({
    positionId: input.positionId,
    dossierId: input.dossierId,
  })
  return apiDelete<{ success: boolean }>(`/positions-dossiers-delete?${params.toString()}`)
}

// Need to import for return type
import type { PositionDossierLink } from '../types'
