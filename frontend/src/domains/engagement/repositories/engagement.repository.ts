/**
 * Engagement Context - Repository
 *
 * Data access layer for engagement entities.
 * Abstracts the underlying data source (Supabase Edge Functions)
 * from the service layer.
 */

import { apiGet, apiPost, apiPatch, apiDelete } from '@/domains/shared'
import type {
  EngagementListItem,
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

/**
 * Engagement list response from API
 */
export interface EngagementListResponse {
  data: EngagementListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    has_more: boolean
  }
}

/**
 * Engagement Repository
 *
 * Provides data access methods for engagements. All methods are
 * stateless and make direct API calls.
 */
export const engagementRepository = {
  // ============================================================================
  // Engagement CRUD
  // ============================================================================

  /**
   * List engagements with search and filters
   */
  async list(params?: EngagementSearchParams): Promise<EngagementListResponse> {
    return apiGet<EngagementListResponse>('engagement-dossiers', {
      search: params?.search,
      engagement_type: params?.engagement_type,
      engagement_category: params?.engagement_category,
      engagement_status: params?.engagement_status,
      host_country_id: params?.host_country_id,
      start_date: params?.start_date,
      end_date: params?.end_date,
      page: params?.page,
      limit: params?.limit,
    })
  },

  /**
   * Get a single engagement by ID with full profile
   */
  async getById(id: string): Promise<EngagementFullProfile> {
    return apiGet<EngagementFullProfile>(`engagement-dossiers/${id}`)
  },

  /**
   * Create a new engagement
   */
  async create(data: EngagementCreate): Promise<EngagementFullProfile> {
    return apiPost<EngagementFullProfile, EngagementCreate>('engagement-dossiers', data)
  },

  /**
   * Update an existing engagement
   */
  async update(id: string, data: EngagementUpdate): Promise<EngagementFullProfile> {
    return apiPatch<EngagementFullProfile, EngagementUpdate>(`engagement-dossiers/${id}`, data)
  },

  /**
   * Archive (soft delete) an engagement
   */
  async archive(id: string): Promise<{ success: boolean }> {
    return apiDelete<{ success: boolean }>(`engagement-dossiers/${id}`)
  },

  // ============================================================================
  // Participants
  // ============================================================================

  /**
   * Get participants for an engagement
   */
  async getParticipants(engagementId: string): Promise<{ data: EngagementParticipant[] }> {
    return apiGet<{ data: EngagementParticipant[] }>(
      `engagement-dossiers/${engagementId}/participants`,
    )
  },

  /**
   * Add a participant to an engagement
   */
  async addParticipant(
    engagementId: string,
    participant: EngagementParticipantCreate,
  ): Promise<EngagementParticipant> {
    return apiPost<EngagementParticipant, EngagementParticipantCreate>(
      `engagement-dossiers/${engagementId}/participants`,
      participant,
    )
  },

  /**
   * Remove a participant from an engagement
   */
  async removeParticipant(
    engagementId: string,
    participantId: string,
  ): Promise<{ success: boolean }> {
    return apiDelete<{ success: boolean }>(
      `engagement-dossiers/${engagementId}/participants?participant_id=${participantId}`,
    )
  },

  // ============================================================================
  // Agenda
  // ============================================================================

  /**
   * Get agenda items for an engagement
   */
  async getAgenda(engagementId: string): Promise<{ data: EngagementAgendaItem[] }> {
    return apiGet<{ data: EngagementAgendaItem[] }>(`engagement-dossiers/${engagementId}/agenda`)
  },

  /**
   * Add an agenda item to an engagement
   */
  async addAgendaItem(
    engagementId: string,
    item: EngagementAgendaItemCreate,
  ): Promise<EngagementAgendaItem> {
    return apiPost<EngagementAgendaItem, EngagementAgendaItemCreate>(
      `engagement-dossiers/${engagementId}/agenda`,
      item,
    )
  },

  /**
   * Update an agenda item
   */
  async updateAgendaItem(
    engagementId: string,
    agendaId: string,
    updates: EngagementAgendaItemUpdate,
  ): Promise<EngagementAgendaItem> {
    return apiPatch<EngagementAgendaItem, EngagementAgendaItemUpdate>(
      `engagement-dossiers/${engagementId}/agenda?agenda_id=${agendaId}`,
      updates,
    )
  },

  /**
   * Remove an agenda item from an engagement
   */
  async removeAgendaItem(engagementId: string, agendaId: string): Promise<{ success: boolean }> {
    return apiDelete<{ success: boolean }>(
      `engagement-dossiers/${engagementId}/agenda?agenda_id=${agendaId}`,
    )
  },
}

/**
 * Type for the engagement repository
 */
export type EngagementRepository = typeof engagementRepository
