/**
 * Engagements Domain Types
 * @module domains/engagements/types
 *
 * Re-exports existing engagement types and defines domain-specific interfaces.
 */

export type {
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

export type {
  EngagementRecommendationSummary,
  EngagementRecommendationListItem,
  RecommendationListParams,
  RecommendationListResponse,
  RecommendationStats,
  RecommendationUpdateParams,
  RecommendationFeedbackCreate,
  RecommendationFeedback,
  GenerateRecommendationsParams,
  GenerateRecommendationsResponse,
  RecommendationType,
  RecommendationUrgency,
  RecommendationStatus,
} from '@/types/engagement-recommendation.types'

// ============================================================================
// Kanban Types (from useEngagementKanban)
// ============================================================================

// Matches the AssignmentCard the engagements-kanban-get Edge Function returns
// (id, work_item_id, work_item_type, assignee, priority, overall_sla_deadline,
// current_stage_sla_deadline, created_at). The board buckets by column
// server-side, so client cards never read workflow_stage/status/etc.
export interface KanbanAssignment {
  id: string
  work_item_id: string
  work_item_type: string
  priority: string
  overall_sla_deadline: string | null
  current_stage_sla_deadline: string | null
  created_at: string
  assignee?: {
    id: string
    full_name: string
    avatar_url?: string
  }
}

export interface KanbanColumns {
  todo: KanbanAssignment[]
  in_progress: KanbanAssignment[]
  review: KanbanAssignment[]
  done: KanbanAssignment[]
  cancelled: KanbanAssignment[]
}

export type SortOption = 'created_at' | 'sla_deadline' | 'priority'
export type WorkflowStage = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'

// ============================================================================
// Brief Types (from useEngagementBriefs)
// ============================================================================

export type BriefType = 'legacy' | 'ai'
// 'draft' occurs on legacy/manual rows: engagement-briefs leaves briefs.status at its DB default
export type BriefStatus = 'completed' | 'generating' | 'failed' | 'draft'

export interface EngagementBrief {
  id: string
  brief_type: BriefType
  title: string
  summary: string
  status: BriefStatus
  source: 'ai' | 'manual'
  created_at: string
  completed_at?: string
  created_by: string
  has_citations: boolean
}

export interface EngagementBriefsListResponse {
  data: EngagementBrief[]
  pagination: {
    total: number
    limit: number
    offset: number
    has_more: boolean
  }
}

export interface BriefGenerationContext {
  engagement: {
    id: string
    name_en: string
    name_ar: string
    engagement_type: string
    engagement_category: string
    start_date: string
    end_date: string
    objectives_en?: string
    objectives_ar?: string
  }
  participants: Array<{
    id: string
    role: string
    participant_type: string
    name_en?: string
    name_ar?: string
    dossier_id?: string
    dossier_type?: string
  }>
  agenda: Array<{
    id: string
    order_number: number
    title_en: string
    title_ar?: string
    description_en?: string
    item_status: string
  }>
  host_country?: {
    id: string
    name_en: string
    name_ar: string
  }
  host_organization?: {
    id: string
    name_en: string
    name_ar: string
  }
  positions: Array<{
    id: string
    title_en: string
    title_ar?: string
    stance: string
    dossier_id: string
    dossier_name_en: string
  }>
  commitments: Array<{
    id: string
    title_en: string
    title_ar?: string
    status: string
    deadline?: string
    source_dossier_id: string
    source_name_en: string
  }>
  recent_interactions: Array<{
    id: string
    event_type: string
    event_title_en: string
    event_date: string
    dossier_id: string
    dossier_name_en: string
  }>
  previous_briefs_count: number
}

export interface GenerateBriefParams {
  engagementId: string
  custom_prompt?: string
  language?: 'en' | 'ar'
  date_range_start?: string
  date_range_end?: string
}

export interface LinkBriefParams {
  engagementId: string
  briefId: string
  brief_type: BriefType
}

export interface BriefsSearchParams {
  type?: 'all' | 'legacy' | 'ai'
  status?: BriefStatus
  limit?: number
  offset?: number
}
