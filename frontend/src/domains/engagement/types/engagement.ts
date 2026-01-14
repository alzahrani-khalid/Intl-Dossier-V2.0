/**
 * Engagement Context - Domain Types
 *
 * Core domain types for the Engagement bounded context.
 * These types represent engagements (meetings, missions, delegations, etc.)
 * and their related entities.
 */

import type { DossierReference, AuditInfo } from '@/domains/shared'
import type { EngagementParticipant } from './participant'
import type { EngagementAgendaItem } from './agenda'

// ============================================================================
// Engagement Classification Types
// ============================================================================

/**
 * Types of engagement events
 */
export type EngagementType =
  | 'bilateral_meeting'
  | 'mission'
  | 'delegation'
  | 'summit'
  | 'working_group'
  | 'roundtable'
  | 'official_visit'
  | 'consultation'
  | 'other'

/**
 * Categories of engagement purpose
 */
export type EngagementCategory =
  | 'diplomatic'
  | 'statistical'
  | 'technical'
  | 'economic'
  | 'cultural'
  | 'educational'
  | 'research'
  | 'other'

/**
 * Status of the engagement
 */
export type EngagementStatus =
  | 'planned'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'postponed'
  | 'cancelled'

/**
 * Level of the delegation
 */
export type DelegationLevel =
  | 'head_of_state'
  | 'ministerial'
  | 'senior_official'
  | 'director'
  | 'expert'
  | 'technical'

// ============================================================================
// Engagement Domain Model
// ============================================================================

/**
 * Full engagement dossier domain model
 */
export interface EngagementDossier extends AuditInfo {
  id: string
  type: 'engagement_dossier'
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  status: 'active' | 'inactive' | 'archived'
  sensitivity_level: number
  tags: string[]
  metadata?: Record<string, unknown>

  // Engagement-specific fields
  engagement_type: EngagementType
  engagement_category: EngagementCategory
  engagement_status: EngagementStatus
  start_date: string
  end_date: string
  timezone: string
  location_en?: string
  location_ar?: string
  venue_en?: string
  venue_ar?: string
  is_virtual: boolean
  virtual_link?: string
  host_country_id?: string
  host_organization_id?: string
  delegation_size?: number
  delegation_level?: DelegationLevel
  objectives_en?: string
  objectives_ar?: string
  outcomes_en?: string
  outcomes_ar?: string
  notes_en?: string
  notes_ar?: string
}

/**
 * Engagement extension data stored in engagement_dossiers table
 */
export interface EngagementExtension {
  id?: string
  engagement_type: EngagementType
  engagement_category: EngagementCategory
  start_date: string
  end_date: string
  timezone?: string
  location_en?: string
  location_ar?: string
  venue_en?: string
  venue_ar?: string
  is_virtual?: boolean
  virtual_link?: string
  host_country_id?: string
  host_organization_id?: string
  delegation_size?: number
  delegation_level?: DelegationLevel
  objectives_en?: string
  objectives_ar?: string
  outcomes_en?: string
  outcomes_ar?: string
  notes_en?: string
  notes_ar?: string
  engagement_status: EngagementStatus
  created_at?: string
  updated_at?: string
}

/**
 * Engagement list item (compact version for lists)
 */
export interface EngagementListItem {
  id: string
  name_en: string
  name_ar: string
  engagement_type: EngagementType
  engagement_category: EngagementCategory
  engagement_status: EngagementStatus
  start_date: string
  end_date: string
  location_en?: string
  location_ar?: string
  is_virtual: boolean
  host_country_id?: string
  host_country_name_en?: string
  host_country_name_ar?: string
  participant_count: number
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * Input for creating a new engagement
 */
export interface EngagementCreate {
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  status?: 'active' | 'inactive' | 'archived'
  sensitivity_level?: number
  tags?: string[]
  metadata?: Record<string, unknown>
  extension: {
    engagement_type: EngagementType
    engagement_category: EngagementCategory
    start_date: string
    end_date: string
    timezone?: string
    location_en?: string
    location_ar?: string
    venue_en?: string
    venue_ar?: string
    is_virtual?: boolean
    virtual_link?: string
    host_country_id?: string
    host_organization_id?: string
    delegation_size?: number
    delegation_level?: DelegationLevel
    objectives_en?: string
    objectives_ar?: string
    outcomes_en?: string
    outcomes_ar?: string
    notes_en?: string
    notes_ar?: string
    engagement_status?: EngagementStatus
  }
}

/**
 * Input for updating an engagement
 */
export interface EngagementUpdate {
  name_en?: string
  name_ar?: string
  description_en?: string
  description_ar?: string
  status?: 'active' | 'inactive' | 'archived'
  sensitivity_level?: number
  tags?: string[]
  extension?: Partial<EngagementExtension>
}

/**
 * Search parameters for engagements
 */
export interface EngagementSearchParams {
  search?: string
  engagement_type?: EngagementType
  engagement_category?: EngagementCategory
  engagement_status?: EngagementStatus
  host_country_id?: string
  start_date?: string
  end_date?: string
  page?: number
  limit?: number
}

// ============================================================================
// Full Profile Types
// ============================================================================

/**
 * Full engagement profile returned by get_engagement_full RPC
 */
export interface EngagementFullProfile {
  engagement: EngagementDossier
  participants: Array<{
    participant: EngagementParticipant
    dossier_info?: DossierReference
  }>
  agenda: EngagementAgendaItem[]
  host_country?: DossierReference
  host_organization?: DossierReference
}

// ============================================================================
// Participant Types (re-exported for convenience)
// ============================================================================

export type {
  ParticipantType,
  ParticipantRole,
  AttendanceStatus,
  EngagementParticipant,
  EngagementParticipantCreate,
} from './participant'

// ============================================================================
// Agenda Types (re-exported for convenience)
// ============================================================================

export type {
  AgendaItemStatus,
  EngagementAgendaItem,
  EngagementAgendaItemCreate,
  EngagementAgendaItemUpdate,
} from './agenda'
