/**
 * Relationship Context - Repository
 *
 * Data access layer for relationship entities.
 * Abstracts the underlying data source (Supabase Edge Functions)
 * from the service layer.
 */

import { apiGet, apiPost, apiPatch, apiDelete } from '@/domains/shared'
import type {
  RelationshipWithDossiers,
  RelationshipCreate,
  RelationshipUpdate,
  RelationshipFilters,
} from '../types/relationship'
import type {
  RelationshipHealthScore,
  HealthScoreListParams,
  AlertListParams,
  HealthScoreListResponse,
  HealthHistoryListResponse,
  AlertListResponse,
  CalculationResultResponse,
} from '../types/health'

/**
 * Relationship list response from API
 */
export interface RelationshipListResponse {
  data: RelationshipWithDossiers[]
  pagination: {
    total?: number
    limit: number
    offset: number
    has_more: boolean
  }
  // Legacy format for backward compatibility
  relationships?: RelationshipWithDossiers[]
  total_count?: number
  page?: number
  page_size?: number
}

/**
 * Relationship Repository
 *
 * Provides data access methods for relationships. All methods are
 * stateless and make direct API calls.
 */
export const relationshipRepository = {
  // ============================================================================
  // Relationship CRUD
  // ============================================================================

  /**
   * List relationships with filters
   */
  async list(filters?: RelationshipFilters): Promise<RelationshipListResponse> {
    const params: Record<string, string | number | undefined> = {}

    if (filters) {
      if (filters.page !== undefined && filters.page_size !== undefined) {
        params.offset = filters.page * filters.page_size
        params.limit = filters.page_size
      }
      if (filters.limit !== undefined) params.limit = filters.limit
      if (filters.offset !== undefined) params.offset = filters.offset
      if (filters.source_dossier_id) params.source_dossier_id = filters.source_dossier_id
      if (filters.target_dossier_id) params.target_dossier_id = filters.target_dossier_id
      if (filters.dossier_id) params.dossier_id = filters.dossier_id
      if (filters.relationship_type) params.relationship_type = filters.relationship_type
      if (filters.status) params.status = filters.status
    }

    return apiGet<RelationshipListResponse>('dossier-relationships', params)
  },

  /**
   * Get a single relationship by ID
   */
  async getById(id: string): Promise<RelationshipWithDossiers> {
    return apiGet<RelationshipWithDossiers>(`dossier-relationships/${id}`)
  },

  /**
   * Create a new relationship
   */
  async create(data: RelationshipCreate): Promise<RelationshipWithDossiers> {
    return apiPost<RelationshipWithDossiers, RelationshipCreate>('dossier-relationships', data)
  },

  /**
   * Update a relationship
   */
  async update(id: string, data: RelationshipUpdate): Promise<RelationshipWithDossiers> {
    return apiPatch<RelationshipWithDossiers, RelationshipUpdate>(
      `dossier-relationships/${id}`,
      data,
    )
  },

  /**
   * Delete a relationship
   */
  async delete(id: string): Promise<{ success: boolean; id: string }> {
    return apiDelete<{ success: boolean; id: string }>(`dossier-relationships/${id}`)
  },

  /**
   * Get all relationships for a dossier (bidirectional)
   */
  async getForDossier(
    dossierId: string,
    page?: number,
    pageSize?: number,
  ): Promise<RelationshipListResponse> {
    const params: Record<string, string | number | undefined> = {}
    if (page !== undefined && pageSize !== undefined) {
      params.offset = page * pageSize
      params.limit = pageSize
    }
    return apiGet<RelationshipListResponse>(`dossier-relationships/dossier/${dossierId}`, params)
  },

  /**
   * Get relationships by type for a dossier
   */
  async getByType(
    dossierId: string,
    relationshipType: string,
    page?: number,
    pageSize?: number,
  ): Promise<RelationshipListResponse> {
    const params: Record<string, string | number | undefined> = {
      relationship_type: relationshipType,
    }
    if (page !== undefined && pageSize !== undefined) {
      params.offset = page * pageSize
      params.limit = pageSize
    }
    return apiGet<RelationshipListResponse>(`dossier-relationships/dossier/${dossierId}`, params)
  },

  // ============================================================================
  // Health Scoring
  // ============================================================================

  /**
   * Get health score for a specific relationship
   */
  async getHealthScore(relationshipId: string): Promise<RelationshipHealthScore> {
    return apiGet<RelationshipHealthScore>(`relationship-health/${relationshipId}`)
  },

  /**
   * List health scores with filters
   */
  async listHealthScores(params?: HealthScoreListParams): Promise<HealthScoreListResponse> {
    return apiGet<HealthScoreListResponse>('relationship-health', {
      limit: params?.limit,
      offset: params?.offset,
      trend: params?.trend,
      min_score: params?.min_score,
      max_score: params?.max_score,
      sort_by: params?.sort_by,
      sort_order: params?.sort_order,
    })
  },

  /**
   * Get health history for a relationship
   */
  async getHealthHistory(
    relationshipId: string,
    limit?: number,
    offset?: number,
  ): Promise<HealthHistoryListResponse> {
    return apiGet<HealthHistoryListResponse>(`relationship-health/${relationshipId}/history`, {
      limit,
      offset,
    })
  },

  /**
   * Trigger health score calculation
   */
  async calculateHealthScores(): Promise<CalculationResultResponse> {
    return apiPost<CalculationResultResponse, Record<string, never>>(
      'relationship-health/calculate',
      {},
    )
  },

  // ============================================================================
  // Alerts
  // ============================================================================

  /**
   * Get alerts for a relationship
   */
  async getAlerts(relationshipId: string, params?: AlertListParams): Promise<AlertListResponse> {
    return apiGet<AlertListResponse>(`relationship-health/${relationshipId}/alerts`, {
      include_read: params?.include_read,
      include_dismissed: params?.include_dismissed,
    })
  },

  /**
   * Mark alert as read
   */
  async markAlertRead(alertId: string): Promise<{ success: boolean }> {
    return apiPatch<{ success: boolean }, { is_read: boolean }>(
      `relationship-health/alerts/${alertId}`,
      { is_read: true },
    )
  },

  /**
   * Dismiss alert
   */
  async dismissAlert(alertId: string): Promise<{ success: boolean }> {
    return apiPatch<{ success: boolean }, { is_dismissed: boolean }>(
      `relationship-health/alerts/${alertId}`,
      { is_dismissed: true },
    )
  },
}

/**
 * Type for the relationship repository
 */
export type RelationshipRepository = typeof relationshipRepository
