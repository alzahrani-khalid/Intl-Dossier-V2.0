/**
 * Engagements Repository
 * @module domains/engagements/repositories/engagements.repository
 *
 * Plain function exports for all engagement-related API operations.
 * Uses the shared apiClient for auth, base URL, and error handling.
 */

import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api-client'
import type {
  EngagementFullProfile,
  EngagementCreate,
  EngagementUpdate,
  EngagementSearchParams,
  EngagementListResponse,
  EngagementParticipant,
  EngagementParticipantCreate,
  EngagementAgendaItem,
  EngagementAgendaItemCreate,
  EngagementAgendaItemUpdate,
} from '@/types/engagement.types'
import type {
  RecommendationListParams,
  RecommendationListResponse,
  EngagementRecommendationSummary,
  RecommendationStats,
  RecommendationUpdateParams,
  RecommendationFeedbackCreate,
  RecommendationFeedback,
  GenerateRecommendationsParams,
  GenerateRecommendationsResponse,
} from '@/types/engagement-recommendation.types'
import type {
  KanbanColumns,
  EngagementBriefsListResponse,
  BriefGenerationContext,
  BriefsSearchParams,
  GenerateBriefParams,
  LinkBriefParams,
} from '../types'

// ============================================================================
// Engagement CRUD
// ============================================================================

/**
 * Fetch paginated engagement list with filters.
 */
export async function getEngagements(
  params?: EngagementSearchParams,
): Promise<EngagementListResponse> {
  const searchParams = new URLSearchParams()

  if (params?.search) searchParams.set('search', params.search)
  if (params?.engagement_type) searchParams.set('engagement_type', params.engagement_type)
  if (params?.engagement_category) searchParams.set('engagement_category', params.engagement_category)
  if (params?.engagement_status) searchParams.set('engagement_status', params.engagement_status)
  if (params?.host_country_id) searchParams.set('host_country_id', params.host_country_id)
  if (params?.start_date) searchParams.set('start_date', params.start_date)
  if (params?.end_date) searchParams.set('end_date', params.end_date)
  if (params?.page) searchParams.set('page', String(params.page))
  if (params?.limit) searchParams.set('limit', String(params.limit))

  return apiGet<EngagementListResponse>(`/engagement-dossiers?${searchParams}`)
}

/**
 * Fetch a single engagement with full profile.
 */
export async function getEngagement(id: string): Promise<EngagementFullProfile> {
  return apiGet<EngagementFullProfile>(`/engagement-dossiers/${id}`)
}

/**
 * Create a new engagement.
 */
export async function createEngagement(data: EngagementCreate): Promise<EngagementFullProfile> {
  return apiPost<EngagementFullProfile>('/engagement-dossiers', data)
}

/**
 * Update an engagement.
 */
export async function updateEngagement(
  id: string,
  updates: EngagementUpdate,
): Promise<EngagementFullProfile> {
  return apiPatch<EngagementFullProfile>(`/engagement-dossiers/${id}`, updates)
}

/**
 * Archive (soft delete) an engagement.
 */
export async function archiveEngagement(id: string): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(`/engagement-dossiers/${id}`)
}

// ============================================================================
// Participants
// ============================================================================

/**
 * Fetch participants for an engagement.
 */
export async function getParticipants(
  engagementId: string,
): Promise<{ data: EngagementParticipant[] }> {
  return apiGet<{ data: EngagementParticipant[] }>(
    `/engagement-dossiers/${engagementId}/participants`,
  )
}

/**
 * Add a participant to an engagement.
 */
export async function addParticipant(
  engagementId: string,
  participant: EngagementParticipantCreate,
): Promise<EngagementParticipant> {
  return apiPost<EngagementParticipant>(
    `/engagement-dossiers/${engagementId}/participants`,
    participant,
  )
}

/**
 * Remove a participant from an engagement.
 */
export async function removeParticipant(
  engagementId: string,
  participantId: string,
): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(
    `/engagement-dossiers/${engagementId}/participants?participant_id=${participantId}`,
  )
}

// ============================================================================
// Agenda
// ============================================================================

/**
 * Fetch agenda items for an engagement.
 */
export async function getAgenda(
  engagementId: string,
): Promise<{ data: EngagementAgendaItem[] }> {
  return apiGet<{ data: EngagementAgendaItem[] }>(
    `/engagement-dossiers/${engagementId}/agenda`,
  )
}

/**
 * Add an agenda item.
 */
export async function addAgendaItem(
  engagementId: string,
  item: EngagementAgendaItemCreate,
): Promise<EngagementAgendaItem> {
  return apiPost<EngagementAgendaItem>(
    `/engagement-dossiers/${engagementId}/agenda`,
    item,
  )
}

/**
 * Update an agenda item.
 */
export async function updateAgendaItem(
  engagementId: string,
  agendaId: string,
  updates: EngagementAgendaItemUpdate,
): Promise<EngagementAgendaItem> {
  return apiPatch<EngagementAgendaItem>(
    `/engagement-dossiers/${engagementId}/agenda?agenda_id=${agendaId}`,
    updates,
  )
}

/**
 * Remove an agenda item.
 */
export async function removeAgendaItem(
  engagementId: string,
  agendaId: string,
): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(
    `/engagement-dossiers/${engagementId}/agenda?agenda_id=${agendaId}`,
  )
}

// ============================================================================
// Kanban
// ============================================================================

/**
 * Fetch engagement kanban board data.
 */
export async function getEngagementKanban(
  engagementId: string,
  sortBy: string = 'created_at',
): Promise<KanbanColumns> {
  const data = await apiGet<{ columns: KanbanColumns }>(
    `/engagements-kanban-get?engagement_id=${engagementId}&sort=${sortBy}`,
  )
  return data.columns
}

/**
 * Update workflow stage for a kanban assignment.
 */
export async function updateWorkflowStage(
  assignmentId: string,
  newStage: string,
  triggeredByUserId: string,
): Promise<unknown> {
  return apiPost('/assignments-workflow-stage-update', {
    assignment_id: assignmentId,
    workflow_stage: newStage,
    triggered_by_user_id: triggeredByUserId,
  })
}

// ============================================================================
// Briefs
// ============================================================================

/**
 * Fetch briefs for an engagement.
 */
export async function getEngagementBriefs(
  engagementId: string,
  params?: BriefsSearchParams,
): Promise<EngagementBriefsListResponse> {
  const searchParams = new URLSearchParams()

  if (params?.type) searchParams.set('type', params.type)
  if (params?.status) searchParams.set('status', params.status)
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.offset) searchParams.set('offset', String(params.offset))

  return apiGet<EngagementBriefsListResponse>(
    `/engagement-briefs/${engagementId}?${searchParams}`,
  )
}

/**
 * Fetch brief generation context for an engagement.
 */
export async function getEngagementBriefContext(
  engagementId: string,
): Promise<BriefGenerationContext> {
  return apiGet<BriefGenerationContext>(`/engagement-briefs/${engagementId}/context`)
}

/**
 * Generate a new AI brief for an engagement.
 */
export async function generateEngagementBrief(
  params: GenerateBriefParams,
): Promise<unknown> {
  return apiPost(`/engagement-briefs/${params.engagementId}/generate`, {
    custom_prompt: params.custom_prompt,
    language: params.language,
    date_range_start: params.date_range_start,
    date_range_end: params.date_range_end,
  })
}

/**
 * Link an existing brief to an engagement.
 */
export async function linkBriefToEngagement(params: LinkBriefParams): Promise<unknown> {
  return apiPost(
    `/engagement-briefs/${params.engagementId}/link/${params.briefId}`,
    { brief_type: params.brief_type },
  )
}

/**
 * Unlink a brief from an engagement.
 */
export async function unlinkBriefFromEngagement(params: LinkBriefParams): Promise<unknown> {
  return apiDelete(
    `/engagement-briefs/${params.engagementId}/link/${params.briefId}?brief_type=${params.brief_type}`,
  )
}

// ============================================================================
// Recommendations
// ============================================================================

/**
 * Fetch engagement recommendations with filters.
 */
export async function getRecommendations(
  params: RecommendationListParams,
): Promise<RecommendationListResponse> {
  const searchParams = new URLSearchParams()

  if (params.limit) searchParams.set('limit', params.limit.toString())
  if (params.offset) searchParams.set('offset', params.offset.toString())
  if (params.status) {
    const statuses = Array.isArray(params.status) ? params.status : [params.status]
    searchParams.set('status', statuses.join(','))
  }
  if (params.recommendation_type) {
    const types = Array.isArray(params.recommendation_type)
      ? params.recommendation_type
      : [params.recommendation_type]
    searchParams.set('recommendation_type', types.join(','))
  }
  if (params.urgency) {
    const urgencies = Array.isArray(params.urgency) ? params.urgency : [params.urgency]
    searchParams.set('urgency', urgencies.join(','))
  }
  if (params.min_priority) searchParams.set('min_priority', params.min_priority.toString())
  if (params.min_confidence) searchParams.set('min_confidence', params.min_confidence.toString())
  if (params.target_dossier_id) searchParams.set('target_dossier_id', params.target_dossier_id)
  if (params.relationship_id) searchParams.set('relationship_id', params.relationship_id)
  if (params.include_expired) searchParams.set('include_expired', 'true')
  if (params.sort_by) searchParams.set('sort_by', params.sort_by)
  if (params.sort_order) searchParams.set('sort_order', params.sort_order)

  return apiGet<RecommendationListResponse>(
    `/engagement-recommendations?${searchParams.toString()}`,
  )
}

/**
 * Fetch a single recommendation with full details.
 */
export async function getRecommendation(
  id: string,
): Promise<EngagementRecommendationSummary> {
  return apiGet<EngagementRecommendationSummary>(`/engagement-recommendations/${id}`)
}

/**
 * Fetch recommendation statistics.
 */
export async function getRecommendationStats(): Promise<RecommendationStats> {
  return apiGet<RecommendationStats>('/engagement-recommendations/stats')
}

/**
 * Update a recommendation (accept/dismiss).
 */
export async function updateRecommendation(
  id: string,
  updates: RecommendationUpdateParams,
): Promise<EngagementRecommendationSummary> {
  return apiPatch<EngagementRecommendationSummary>(
    `/engagement-recommendations/${id}`,
    updates,
  )
}

/**
 * Add feedback to a recommendation.
 */
export async function addRecommendationFeedback(
  recommendationId: string,
  feedback: RecommendationFeedbackCreate,
): Promise<RecommendationFeedback> {
  return apiPost<RecommendationFeedback>(
    `/engagement-recommendations/${recommendationId}/feedback`,
    feedback,
  )
}

/**
 * Generate new recommendations.
 */
export async function generateRecommendations(
  params: GenerateRecommendationsParams = {},
): Promise<GenerateRecommendationsResponse> {
  return apiPost<GenerateRecommendationsResponse>(
    '/engagement-recommendations/generate',
    params,
  )
}
