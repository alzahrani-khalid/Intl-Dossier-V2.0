/**
 * Positions Domain Types
 * @module domains/positions/types
 *
 * Re-exports existing position types and adds domain-specific interfaces.
 */

// Re-export core position types from shared types
export type {
  Position,
  PositionFilters,
  PositionListResponse,
  CreatePositionRequest,
  UpdatePositionRequest,
  ConsistencyCheck,
} from '@/types/position'

// ============================================================================
// Position Suggestions Types (from usePositionSuggestions)
// ============================================================================

export interface PositionSuggestion {
  id: string
  engagement_id: string
  position_id: string
  relevance_score: number
  suggestion_reasoning?: {
    keywords?: string[]
    context_factors?: string[]
  }
  created_at: string
  user_action?: 'accepted' | 'rejected' | 'ignored'
  actioned_at?: string
  position: {
    id: string
    title: string
    content: string
    type: string
    status: string
    primary_language: 'en' | 'ar'
  }
}

export interface SuggestionsMeta {
  ai_service_status: 'available' | 'degraded' | 'unavailable'
  fallback_mode: boolean
  generated_at: string
}

export interface PositionSuggestionsParams {
  engagementId: string
  minRelevance?: number
  limit?: number
}

export interface PositionSuggestionsResponse {
  suggestions: PositionSuggestion[]
  meta: SuggestionsMeta
}

// ============================================================================
// Position Analytics Types (from usePositionAnalytics)
// ============================================================================

export interface PositionAnalytics {
  position_id: string
  view_count: number
  attachment_count: number
  briefing_pack_count: number
  last_viewed_at?: string
  last_attached_at?: string
  trend_data?: {
    daily?: { date: string; views: number; attachments: number }[]
    weekly?: { week: string; views: number; attachments: number }[]
    monthly?: { month: string; views: number; attachments: number }[]
  }
  popularity_score?: number
  usage_rank?: number
  updated_at: string
}

export interface TopPositionsParams {
  metric?: 'views' | 'attachments' | 'briefings' | 'popularity'
  timeRange?: '7d' | '30d' | '90d' | 'all'
  limit?: number
}

export interface TopPosition {
  position_id: string
  position_title: string
  position_type: string
  metric_value: number
  rank: number
  trend: 'up' | 'down' | 'stable'
}

// ============================================================================
// Position Dossier Links Types (from usePositionDossierLinks)
// ============================================================================

export interface PositionDossierLink {
  id: string
  position_id: string
  dossier_id: string
  link_type: 'primary' | 'related' | 'reference'
  notes?: string | null
  created_by: string
  created_at: string
  dossier?: {
    id: string
    name_en: string
    name_ar: string
    type: string
    status: string
    description_en?: string
    description_ar?: string
  }
}

export interface PositionDossierLinksFilters {
  link_type?: string
}

export interface PositionDossierLinksResponse {
  links: PositionDossierLink[]
  total_count: number
}

export interface CreatePositionDossierLinkInput {
  dossier_id: string
  link_type?: 'primary' | 'related' | 'reference'
  notes?: string
}

export interface DeletePositionDossierLinkInput {
  positionId: string
  dossierId: string
}

// ============================================================================
// Update Position Variables (from useUpdatePosition)
// ============================================================================

export interface UpdatePositionVariables {
  id: string
  data: UpdatePositionRequest
}

// ============================================================================
// Submit Position Response (from useSubmitPosition)
// ============================================================================

export interface SubmitPositionResponse {
  position: Position
  consistency_check: ConsistencyCheck
}
