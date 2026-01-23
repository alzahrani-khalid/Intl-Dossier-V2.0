/**
 * Position types for Positions & Talking Points Lifecycle feature
 */

import type { JsonValue } from './common.types'

// Position status enum
export type PositionStatus = 'draft' | 'under_review' | 'approved' | 'published' | 'unpublished'

// Approval chain configuration
export interface ApprovalChainConfig {
  stages: Array<{
    stage_number: number
    stage_name: string
    approver_id?: string
    approver_role?: string
    is_required: boolean
  }>
  current_stage: number
  metadata?: Record<string, JsonValue>
}

// Position interface
export interface Position {
  id: string
  position_type_id: string
  title_en: string
  title_ar: string
  content_en?: string
  content_ar?: string
  rationale_en?: string
  rationale_ar?: string
  alignment_notes_en?: string
  alignment_notes_ar?: string
  thematic_category?: string
  status: PositionStatus
  current_stage: number
  approval_chain_config?: ApprovalChainConfig
  consistency_score?: number
  author_id: string
  created_at: string
  updated_at: string
  version: number
  audience_groups?: AudienceGroup[]
}

// Audience group interface
export interface AudienceGroup {
  id: string
  name_en: string
  name_ar: string
}

// Position filters for list API
export interface PositionFilters {
  status?: PositionStatus
  thematic_category?: string
  author_id?: string
  limit?: number
  offset?: number
  search?: string
}

// Position list response from API
export interface PositionListResponse {
  data: Position[]
  total: number
  limit: number
  offset: number
  has_more: boolean
}

// Position creation payload
export interface CreatePositionPayload {
  position_type_id: string
  title_en: string
  title_ar: string
  content_en?: string
  content_ar?: string
  rationale_en?: string
  rationale_ar?: string
  alignment_notes_en?: string
  alignment_notes_ar?: string
  thematic_category?: string
  audience_groups: string[] // Array of audience group IDs
}

// Position update payload
export interface UpdatePositionPayload {
  title_en?: string
  title_ar?: string
  content_en?: string
  content_ar?: string
  rationale_en?: string
  rationale_ar?: string
  alignment_notes_en?: string
  alignment_notes_ar?: string
  thematic_category?: string
  version: number // Required for optimistic locking
}
