/**
 * Relationship Context - Domain Service
 *
 * Business logic layer for relationship operations.
 * Orchestrates repository calls and applies domain rules.
 */

import { type Result, ok, err, DomainError, wrapError } from '@/domains/shared'
import { relationshipRepository } from '../repositories/relationship.repository'
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
import type { RelationshipListResponse } from '../repositories/relationship.repository'

/**
 * Relationship Domain Service
 *
 * Provides domain-level operations for relationships with
 * validation, business rules, and error handling.
 */
export const relationshipService = {
  // ============================================================================
  // Relationship Operations
  // ============================================================================

  /**
   * List relationships with filters
   */
  async listRelationships(
    filters?: RelationshipFilters,
  ): Promise<Result<RelationshipListResponse, DomainError>> {
    try {
      const result = await relationshipRepository.list(filters)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'RelationshipService.listRelationships'))
    }
  },

  /**
   * Get a single relationship by ID
   */
  async getRelationship(id: string): Promise<Result<RelationshipWithDossiers, DomainError>> {
    if (!id) {
      return err(new DomainError('Relationship ID is required', 'VALIDATION_ERROR'))
    }

    try {
      const result = await relationshipRepository.getById(id)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'RelationshipService.getRelationship'))
    }
  },

  /**
   * Create a new relationship
   */
  async createRelationship(
    data: RelationshipCreate,
  ): Promise<Result<RelationshipWithDossiers, DomainError>> {
    // Validate required fields
    const validationError = validateRelationshipCreate(data)
    if (validationError) {
      return err(validationError)
    }

    try {
      const result = await relationshipRepository.create(data)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'RelationshipService.createRelationship'))
    }
  },

  /**
   * Update a relationship
   */
  async updateRelationship(
    id: string,
    data: RelationshipUpdate,
  ): Promise<Result<RelationshipWithDossiers, DomainError>> {
    if (!id) {
      return err(new DomainError('Relationship ID is required', 'VALIDATION_ERROR'))
    }

    // Validate date range if both dates provided
    if (data.effective_from && data.effective_to) {
      const from = new Date(data.effective_from)
      const to = new Date(data.effective_to)
      if (to < from) {
        return err(
          new DomainError(
            'Effective to date must be after effective from date',
            'VALIDATION_ERROR',
            { effective_from: data.effective_from, effective_to: data.effective_to },
          ),
        )
      }
    }

    try {
      const result = await relationshipRepository.update(id, data)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'RelationshipService.updateRelationship'))
    }
  },

  /**
   * Delete a relationship
   */
  async deleteRelationship(
    id: string,
  ): Promise<Result<{ success: boolean; id: string }, DomainError>> {
    if (!id) {
      return err(new DomainError('Relationship ID is required', 'VALIDATION_ERROR'))
    }

    try {
      const result = await relationshipRepository.delete(id)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'RelationshipService.deleteRelationship'))
    }
  },

  /**
   * Get all relationships for a dossier
   */
  async getRelationshipsForDossier(
    dossierId: string,
    page?: number,
    pageSize?: number,
  ): Promise<Result<RelationshipListResponse, DomainError>> {
    if (!dossierId) {
      return err(new DomainError('Dossier ID is required', 'VALIDATION_ERROR'))
    }

    try {
      const result = await relationshipRepository.getForDossier(dossierId, page, pageSize)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'RelationshipService.getRelationshipsForDossier'))
    }
  },

  /**
   * Get relationships by type for a dossier
   */
  async getRelationshipsByType(
    dossierId: string,
    relationshipType: string,
    page?: number,
    pageSize?: number,
  ): Promise<Result<RelationshipListResponse, DomainError>> {
    if (!dossierId) {
      return err(new DomainError('Dossier ID is required', 'VALIDATION_ERROR'))
    }
    if (!relationshipType) {
      return err(new DomainError('Relationship type is required', 'VALIDATION_ERROR'))
    }

    try {
      const result = await relationshipRepository.getByType(
        dossierId,
        relationshipType,
        page,
        pageSize,
      )
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'RelationshipService.getRelationshipsByType'))
    }
  },

  // ============================================================================
  // Health Scoring Operations
  // ============================================================================

  /**
   * Get health score for a relationship
   */
  async getHealthScore(
    relationshipId: string,
  ): Promise<Result<RelationshipHealthScore, DomainError>> {
    if (!relationshipId) {
      return err(new DomainError('Relationship ID is required', 'VALIDATION_ERROR'))
    }

    try {
      const result = await relationshipRepository.getHealthScore(relationshipId)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'RelationshipService.getHealthScore'))
    }
  },

  /**
   * List health scores with filters
   */
  async listHealthScores(
    params?: HealthScoreListParams,
  ): Promise<Result<HealthScoreListResponse, DomainError>> {
    try {
      const result = await relationshipRepository.listHealthScores(params)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'RelationshipService.listHealthScores'))
    }
  },

  /**
   * Get health history for a relationship
   */
  async getHealthHistory(
    relationshipId: string,
    limit?: number,
    offset?: number,
  ): Promise<Result<HealthHistoryListResponse, DomainError>> {
    if (!relationshipId) {
      return err(new DomainError('Relationship ID is required', 'VALIDATION_ERROR'))
    }

    try {
      const result = await relationshipRepository.getHealthHistory(relationshipId, limit, offset)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'RelationshipService.getHealthHistory'))
    }
  },

  /**
   * Trigger health score calculation
   */
  async calculateHealthScores(): Promise<Result<CalculationResultResponse, DomainError>> {
    try {
      const result = await relationshipRepository.calculateHealthScores()
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'RelationshipService.calculateHealthScores'))
    }
  },

  // ============================================================================
  // Alert Operations
  // ============================================================================

  /**
   * Get alerts for a relationship
   */
  async getAlerts(
    relationshipId: string,
    params?: AlertListParams,
  ): Promise<Result<AlertListResponse, DomainError>> {
    if (!relationshipId) {
      return err(new DomainError('Relationship ID is required', 'VALIDATION_ERROR'))
    }

    try {
      const result = await relationshipRepository.getAlerts(relationshipId, params)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'RelationshipService.getAlerts'))
    }
  },

  /**
   * Mark alert as read
   */
  async markAlertRead(alertId: string): Promise<Result<{ success: boolean }, DomainError>> {
    if (!alertId) {
      return err(new DomainError('Alert ID is required', 'VALIDATION_ERROR'))
    }

    try {
      const result = await relationshipRepository.markAlertRead(alertId)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'RelationshipService.markAlertRead'))
    }
  },

  /**
   * Dismiss alert
   */
  async dismissAlert(alertId: string): Promise<Result<{ success: boolean }, DomainError>> {
    if (!alertId) {
      return err(new DomainError('Alert ID is required', 'VALIDATION_ERROR'))
    }

    try {
      const result = await relationshipRepository.dismissAlert(alertId)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'RelationshipService.dismissAlert'))
    }
  },
}

// ============================================================================
// Validation Helpers
// ============================================================================

function validateRelationshipCreate(data: RelationshipCreate): DomainError | null {
  if (!data.source_dossier_id) {
    return new DomainError('Source dossier ID is required', 'VALIDATION_ERROR')
  }

  if (!data.target_dossier_id) {
    return new DomainError('Target dossier ID is required', 'VALIDATION_ERROR')
  }

  if (data.source_dossier_id === data.target_dossier_id) {
    return new DomainError('Source and target dossiers must be different', 'VALIDATION_ERROR')
  }

  if (!data.relationship_type) {
    return new DomainError('Relationship type is required', 'VALIDATION_ERROR')
  }

  // Validate date range if both dates provided
  if (data.effective_from && data.effective_to) {
    const from = new Date(data.effective_from)
    const to = new Date(data.effective_to)
    if (to < from) {
      return new DomainError(
        'Effective to date must be after effective from date',
        'VALIDATION_ERROR',
        { effective_from: data.effective_from, effective_to: data.effective_to },
      )
    }
  }

  return null
}

/**
 * Type for the relationship service
 */
export type RelationshipService = typeof relationshipService
