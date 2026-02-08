/**
 * @deprecated This file is a compatibility layer.
 * Import directly from the canonical sources instead:
 *
 * For types: import { DossierType, DossierStatus } from '@/lib/dossier-type-guards'
 * For API: import { CreateDossierRequest, ... } from '@/services/dossier-api'
 * For Timeline: import { UnifiedTimelineEvent, ... } from '@/types/timeline.types'
 *
 * This file will be removed in a future version.
 */

// ============================================================================
// Re-exports from canonical sources
// ============================================================================

// Core types from dossier-type-guards (the canonical source)
export type {
  DossierType,
  PersonSubtype,
  CountryExtension,
  OrganizationExtension,
  PersonExtension,
  EngagementExtension,
  ForumExtension,
  WorkingGroupExtension,
  TopicExtension,
} from '@/lib/dossier-type-guards'

// API types from dossier-api (the canonical source)
export type { DossierStatus, CreateDossierRequest } from '@/services/dossier-api'

// ============================================================================
// Deprecated types - kept for backward compatibility
// ============================================================================

/**
 * @deprecated Use numeric sensitivity levels (1-4) instead:
 * 1 = Public, 2 = Internal, 3 = Confidential, 4 = Secret
 * Import from '@/services/dossier-api' for the numeric type.
 */
export type SensitivityLevel = 1 | 2 | 3 | 4

/**
 * @deprecated Use 'ai' | 'manual' directly
 */
export type GeneratedBy = 'ai' | 'manual'

/**
 * @deprecated Import from '@/types/timeline.types' instead
 */
export type EventType =
  | 'engagement'
  | 'position'
  | 'mou'
  | 'commitment'
  | 'document'
  | 'intelligence'

/**
 * @deprecated Define RoleType locally where needed
 */
export type RoleType = 'owner' | 'co-owner' | 'reviewer'

// ============================================================================
// Interfaces - to be migrated to dedicated type files
// ============================================================================

import type { DossierType as DossierTypeCanonical } from '@/lib/dossier-type-guards'
import type { DossierStatus as DossierStatusCanonical } from '@/services/dossier-api'

/**
 * @deprecated Use the Dossier type from API responses or dossier-type-guards
 */
export interface Dossier {
  id: string
  name_en: string
  name_ar: string
  type: DossierTypeCanonical
  status: DossierStatusCanonical
  sensitivity_level: SensitivityLevel
  description_en?: string | null
  description_ar?: string | null
  summary_en?: string | null
  summary_ar?: string | null
  tags: string[]
  review_cadence?: string | null
  last_review_date?: string | null
  version?: number
  created_at: string
  updated_at: string
  archived?: boolean
  deleted_at?: string | null
}

/**
 * @deprecated Use CreateDossierRequest from '@/services/dossier-api' instead
 */
export interface DossierCreate {
  name_en: string
  name_ar: string
  type: DossierTypeCanonical
  sensitivity_level?: SensitivityLevel
  description_en?: string
  description_ar?: string
  summary_en?: string
  summary_ar?: string
  tags?: string[]
  review_cadence?: string
}

/**
 * @deprecated Define update type locally or use UpdateDossierRequest from dossier-api
 */
export interface DossierUpdate {
  version?: number
  name_en?: string
  name_ar?: string
  status?: DossierStatusCanonical
  sensitivity_level?: SensitivityLevel
  description_en?: string
  description_ar?: string
  summary_en?: string
  summary_ar?: string
  tags?: string[]
  review_cadence?: string
  last_review_date?: string
}

/**
 * Dossier statistics summary
 */
export interface DossierStats {
  total_engagements: number
  total_positions: number
  total_mous: number
  active_commitments: number
  overdue_commitments: number
  total_documents: number
  recent_activity_count: number
  relationship_health_score: number | null
}

/**
 * Dossier ownership assignment
 */
export interface DossierOwner {
  dossier_id: string
  user_id: string
  user_name?: string
  assigned_at: string
  role_type: RoleType
}

/**
 * Key contact associated with a dossier
 */
export interface KeyContact {
  id: string
  dossier_id: string
  name: string
  role: string | null
  organization: string | null
  email: string | null
  phone: string | null
  last_interaction_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ============================================================================
// Brief types - should be moved to briefing-book.types.ts
// ============================================================================

export interface BriefContent {
  summary: string
  sections: Array<{
    title: string
    content: string
  }>
}

export interface Brief {
  id: string
  dossier_id: string
  content_en: BriefContent
  content_ar: BriefContent
  date_range_start: string | null
  date_range_end: string | null
  generated_by: GeneratedBy
  generated_at: string
  generated_by_user_id: string | null
  is_template: boolean
}

export interface BriefSummary {
  id: string
  generated_at: string
  generated_by: GeneratedBy
  summary_en: string
  summary_ar: string
}

export interface BriefTemplate {
  sections: Array<{
    id: string
    title_en: string
    title_ar: string
    placeholder_en: string
    placeholder_ar: string
    required: boolean
  }>
}

// ============================================================================
// Timeline types - deprecated, use '@/types/timeline.types' instead
// ============================================================================

/**
 * @deprecated Use UnifiedTimelineEvent from '@/types/timeline.types' instead
 */
export interface TimelineEvent {
  dossier_id: string
  event_type: EventType
  source_id: string
  source_table: 'engagements' | 'calendar_entries' | 'mous' | 'positions'
  event_date: string
  event_title_en: string
  event_title_ar: string
  event_description_en: string | null
  event_description_ar: string | null
  metadata: Record<string, unknown>
}

// ============================================================================
// Pagination and filter types
// ============================================================================

export interface CursorPagination {
  next_cursor: string | null
  has_more: boolean
  total_count?: number
}

export interface DossierListResponse {
  data: Dossier[]
  pagination: CursorPagination
}

/**
 * @deprecated Use TimelineResponse from '@/types/timeline.types' instead
 */
export interface TimelineEventResponse {
  data: TimelineEvent[]
  pagination: CursorPagination
}

export interface DossierDetailResponse extends Dossier {
  stats?: DossierStats
  owners?: DossierOwner[]
  contacts?: KeyContact[]
  recent_briefs?: BriefSummary[]
}

export interface DossierFilters {
  type?: DossierTypeCanonical
  status?: DossierStatusCanonical
  sensitivity?: SensitivityLevel
  owner_id?: string
  tags?: string[]
  search?: string
  cursor?: string
  limit?: number
}

/**
 * @deprecated Use TimelineFilters from '@/types/timeline.types' instead
 */
export interface TimelineFilters {
  event_type?: EventType[]
  start_date?: string
  end_date?: string
  cursor?: string
  limit?: number
}

// ============================================================================
// Error types
// ============================================================================

export interface ErrorDetail {
  code: string
  message_en: string
  message_ar: string
  details?: Record<string, unknown>
}

export interface ApiError {
  error: ErrorDetail
}

export interface ConflictError extends ApiError {
  error: ErrorDetail & {
    current_version: number
  }
}

export interface BriefGenerationFallback {
  error: ErrorDetail
  fallback: {
    template: BriefTemplate
    pre_populated_data: Record<string, unknown>
  }
}
