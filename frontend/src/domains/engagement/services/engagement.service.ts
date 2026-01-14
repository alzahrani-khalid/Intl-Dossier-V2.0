/**
 * Engagement Context - Domain Service
 *
 * Business logic layer for engagement operations.
 * Orchestrates repository calls and applies domain rules.
 */

import { type Result, ok, err, DomainError, wrapError } from '@/domains/shared'
import { engagementRepository } from '../repositories/engagement.repository'
import type {
  EngagementFullProfile,
  EngagementCreate,
  EngagementUpdate,
  EngagementSearchParams,
} from '../types/engagement'
import type { EngagementParticipant, EngagementParticipantCreate } from '../types/participant'
import type {
  EngagementAgendaItem,
  EngagementAgendaItemCreate,
  EngagementAgendaItemUpdate,
} from '../types/agenda'
import type { EngagementListResponse } from '../repositories/engagement.repository'

/**
 * Engagement Domain Service
 *
 * Provides domain-level operations for engagements with
 * validation, business rules, and error handling.
 */
export const engagementService = {
  // ============================================================================
  // Engagement Operations
  // ============================================================================

  /**
   * List engagements with filters
   */
  async listEngagements(
    params?: EngagementSearchParams,
  ): Promise<Result<EngagementListResponse, DomainError>> {
    try {
      const result = await engagementRepository.list(params)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'EngagementService.listEngagements'))
    }
  },

  /**
   * Get a single engagement by ID
   */
  async getEngagement(id: string): Promise<Result<EngagementFullProfile, DomainError>> {
    if (!id) {
      return err(new DomainError('Engagement ID is required', 'VALIDATION_ERROR'))
    }

    try {
      const result = await engagementRepository.getById(id)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'EngagementService.getEngagement'))
    }
  },

  /**
   * Create a new engagement
   */
  async createEngagement(
    data: EngagementCreate,
  ): Promise<Result<EngagementFullProfile, DomainError>> {
    // Validate required fields
    const validationError = validateEngagementCreate(data)
    if (validationError) {
      return err(validationError)
    }

    try {
      const result = await engagementRepository.create(data)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'EngagementService.createEngagement'))
    }
  },

  /**
   * Update an existing engagement
   */
  async updateEngagement(
    id: string,
    data: EngagementUpdate,
  ): Promise<Result<EngagementFullProfile, DomainError>> {
    if (!id) {
      return err(new DomainError('Engagement ID is required', 'VALIDATION_ERROR'))
    }

    // Validate date range if both dates provided
    if (data.extension?.start_date && data.extension?.end_date) {
      const start = new Date(data.extension.start_date)
      const end = new Date(data.extension.end_date)
      if (end < start) {
        return err(
          new DomainError('End date must be after start date', 'VALIDATION_ERROR', {
            start_date: data.extension.start_date,
            end_date: data.extension.end_date,
          }),
        )
      }
    }

    try {
      const result = await engagementRepository.update(id, data)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'EngagementService.updateEngagement'))
    }
  },

  /**
   * Archive an engagement
   */
  async archiveEngagement(id: string): Promise<Result<{ success: boolean }, DomainError>> {
    if (!id) {
      return err(new DomainError('Engagement ID is required', 'VALIDATION_ERROR'))
    }

    try {
      const result = await engagementRepository.archive(id)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'EngagementService.archiveEngagement'))
    }
  },

  // ============================================================================
  // Participant Operations
  // ============================================================================

  /**
   * Get participants for an engagement
   */
  async getParticipants(
    engagementId: string,
  ): Promise<Result<EngagementParticipant[], DomainError>> {
    if (!engagementId) {
      return err(new DomainError('Engagement ID is required', 'VALIDATION_ERROR'))
    }

    try {
      const result = await engagementRepository.getParticipants(engagementId)
      return ok(result.data)
    } catch (error) {
      return err(wrapError(error, 'EngagementService.getParticipants'))
    }
  },

  /**
   * Add a participant to an engagement
   */
  async addParticipant(
    engagementId: string,
    participant: EngagementParticipantCreate,
  ): Promise<Result<EngagementParticipant, DomainError>> {
    if (!engagementId) {
      return err(new DomainError('Engagement ID is required', 'VALIDATION_ERROR'))
    }

    // Validate participant data
    const validationError = validateParticipantCreate(participant)
    if (validationError) {
      return err(validationError)
    }

    try {
      const result = await engagementRepository.addParticipant(engagementId, participant)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'EngagementService.addParticipant'))
    }
  },

  /**
   * Remove a participant from an engagement
   */
  async removeParticipant(
    engagementId: string,
    participantId: string,
  ): Promise<Result<{ success: boolean }, DomainError>> {
    if (!engagementId || !participantId) {
      return err(
        new DomainError('Engagement ID and Participant ID are required', 'VALIDATION_ERROR'),
      )
    }

    try {
      const result = await engagementRepository.removeParticipant(engagementId, participantId)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'EngagementService.removeParticipant'))
    }
  },

  // ============================================================================
  // Agenda Operations
  // ============================================================================

  /**
   * Get agenda items for an engagement
   */
  async getAgenda(engagementId: string): Promise<Result<EngagementAgendaItem[], DomainError>> {
    if (!engagementId) {
      return err(new DomainError('Engagement ID is required', 'VALIDATION_ERROR'))
    }

    try {
      const result = await engagementRepository.getAgenda(engagementId)
      return ok(result.data)
    } catch (error) {
      return err(wrapError(error, 'EngagementService.getAgenda'))
    }
  },

  /**
   * Add an agenda item to an engagement
   */
  async addAgendaItem(
    engagementId: string,
    item: EngagementAgendaItemCreate,
  ): Promise<Result<EngagementAgendaItem, DomainError>> {
    if (!engagementId) {
      return err(new DomainError('Engagement ID is required', 'VALIDATION_ERROR'))
    }

    if (!item.title_en?.trim()) {
      return err(new DomainError('Agenda item title is required', 'VALIDATION_ERROR'))
    }

    try {
      const result = await engagementRepository.addAgendaItem(engagementId, item)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'EngagementService.addAgendaItem'))
    }
  },

  /**
   * Update an agenda item
   */
  async updateAgendaItem(
    engagementId: string,
    agendaId: string,
    updates: EngagementAgendaItemUpdate,
  ): Promise<Result<EngagementAgendaItem, DomainError>> {
    if (!engagementId || !agendaId) {
      return err(new DomainError('Engagement ID and Agenda ID are required', 'VALIDATION_ERROR'))
    }

    try {
      const result = await engagementRepository.updateAgendaItem(engagementId, agendaId, updates)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'EngagementService.updateAgendaItem'))
    }
  },

  /**
   * Remove an agenda item from an engagement
   */
  async removeAgendaItem(
    engagementId: string,
    agendaId: string,
  ): Promise<Result<{ success: boolean }, DomainError>> {
    if (!engagementId || !agendaId) {
      return err(new DomainError('Engagement ID and Agenda ID are required', 'VALIDATION_ERROR'))
    }

    try {
      const result = await engagementRepository.removeAgendaItem(engagementId, agendaId)
      return ok(result)
    } catch (error) {
      return err(wrapError(error, 'EngagementService.removeAgendaItem'))
    }
  },
}

// ============================================================================
// Validation Helpers
// ============================================================================

function validateEngagementCreate(data: EngagementCreate): DomainError | null {
  if (!data.name_en?.trim()) {
    return new DomainError('English name is required', 'VALIDATION_ERROR')
  }

  if (!data.name_ar?.trim()) {
    return new DomainError('Arabic name is required', 'VALIDATION_ERROR')
  }

  if (!data.extension?.engagement_type) {
    return new DomainError('Engagement type is required', 'VALIDATION_ERROR')
  }

  if (!data.extension?.engagement_category) {
    return new DomainError('Engagement category is required', 'VALIDATION_ERROR')
  }

  if (!data.extension?.start_date) {
    return new DomainError('Start date is required', 'VALIDATION_ERROR')
  }

  if (!data.extension?.end_date) {
    return new DomainError('End date is required', 'VALIDATION_ERROR')
  }

  // Validate date range
  const start = new Date(data.extension.start_date)
  const end = new Date(data.extension.end_date)
  if (end < start) {
    return new DomainError('End date must be after start date', 'VALIDATION_ERROR', {
      start_date: data.extension.start_date,
      end_date: data.extension.end_date,
    })
  }

  return null
}

function validateParticipantCreate(data: EngagementParticipantCreate): DomainError | null {
  if (!data.participant_type) {
    return new DomainError('Participant type is required', 'VALIDATION_ERROR')
  }

  if (!data.role) {
    return new DomainError('Participant role is required', 'VALIDATION_ERROR')
  }

  // For external participants, name is required
  if (
    data.participant_type === 'external' &&
    !data.external_name_en?.trim() &&
    !data.external_name_ar?.trim()
  ) {
    return new DomainError('External participant name is required', 'VALIDATION_ERROR')
  }

  // For internal participants, dossier ID is required
  if (data.participant_type !== 'external' && !data.participant_dossier_id) {
    return new DomainError(
      'Participant dossier ID is required for internal participants',
      'VALIDATION_ERROR',
    )
  }

  return null
}

/**
 * Type for the engagement service
 */
export type EngagementService = typeof engagementService
