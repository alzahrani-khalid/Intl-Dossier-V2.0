/**
 * Engagement Dossier Entity Types
 * Feature: engagements-entity-management
 *
 * Comprehensive type definitions for engagement dossiers including:
 * - Bilateral meetings, missions, delegations
 * - Participants and attendance tracking
 * - Agenda items and outcomes
 */

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
// Participant Types
// ============================================================================

/**
 * Type of participant in the engagement
 */
export type ParticipantType = 'person' | 'organization' | 'country' | 'external'

/**
 * Role of participant in the engagement
 */
export type ParticipantRole =
  | 'host'
  | 'guest'
  | 'delegate'
  | 'head_of_delegation'
  | 'speaker'
  | 'observer'
  | 'organizer'
  | 'support_staff'
  | 'interpreter'
  | 'other'

/**
 * Attendance status of participant
 */
export type AttendanceStatus =
  | 'expected'
  | 'confirmed'
  | 'attended'
  | 'no_show'
  | 'cancelled'
  | 'tentative'

/**
 * Engagement participant record
 */
export interface EngagementParticipant {
  id: string
  engagement_id: string
  participant_type: ParticipantType
  participant_dossier_id?: string
  external_name_en?: string
  external_name_ar?: string
  external_title_en?: string
  external_title_ar?: string
  external_organization_en?: string
  external_organization_ar?: string
  role: ParticipantRole
  attendance_status: AttendanceStatus
  notes?: string
  created_at: string
  created_by?: string
  // Joined dossier info
  dossier?: {
    id: string
    name_en: string
    name_ar: string
    type: string
  }
}

/**
 * Input for adding a participant
 */
export interface EngagementParticipantCreate {
  participant_type: ParticipantType
  participant_dossier_id?: string
  external_name_en?: string
  external_name_ar?: string
  external_title_en?: string
  external_title_ar?: string
  external_organization_en?: string
  external_organization_ar?: string
  role: ParticipantRole
  attendance_status?: AttendanceStatus
  notes?: string
}

// ============================================================================
// Agenda Types
// ============================================================================

/**
 * Status of an agenda item
 */
export type AgendaItemStatus = 'planned' | 'in_progress' | 'completed' | 'skipped' | 'postponed'

/**
 * Agenda item record
 */
export interface EngagementAgendaItem {
  id: string
  engagement_id: string
  order_number: number
  title_en: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  start_time?: string
  end_time?: string
  duration_minutes?: number
  item_status: AgendaItemStatus
  notes_en?: string
  notes_ar?: string
  outcome_en?: string
  outcome_ar?: string
  created_at: string
  updated_at: string
  created_by?: string
}

/**
 * Input for adding an agenda item
 */
export interface EngagementAgendaItemCreate {
  order_number?: number
  title_en: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  start_time?: string
  end_time?: string
  duration_minutes?: number
  item_status?: AgendaItemStatus
  notes_en?: string
  notes_ar?: string
  outcome_en?: string
  outcome_ar?: string
}

/**
 * Input for updating an agenda item
 */
export interface EngagementAgendaItemUpdate {
  order_number?: number
  title_en?: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  start_time?: string
  end_time?: string
  duration_minutes?: number
  item_status?: AgendaItemStatus
  notes_en?: string
  notes_ar?: string
  outcome_en?: string
  outcome_ar?: string
}

// ============================================================================
// Engagement Extension Types
// ============================================================================

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

// ============================================================================
// Full Engagement Types
// ============================================================================

/**
 * Full engagement dossier combining base dossier and extension
 */
export interface EngagementDossier {
  id: string
  type: 'engagement_dossier'
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  status: 'active' | 'inactive' | 'archived'
  sensitivity_level: number
  tags: string[]
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
  // Extension fields (flattened from engagement_dossiers)
  engagement_type: EngagementType
  engagement_category: EngagementCategory
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
  engagement_status: EngagementStatus
}

/**
 * Full engagement profile returned by get_engagement_full RPC
 */
export interface EngagementFullProfile {
  engagement: EngagementDossier
  participants: Array<{
    participant: EngagementParticipant
    dossier_info?: {
      id: string
      name_en: string
      name_ar: string
      type: string
    }
  }>
  agenda: EngagementAgendaItem[]
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
}

// ============================================================================
// API Request/Response Types
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

/**
 * Engagement list response
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

// ============================================================================
// Helper Labels
// ============================================================================

/**
 * Labels for engagement types
 */
export const ENGAGEMENT_TYPE_LABELS: Record<EngagementType, { en: string; ar: string }> = {
  bilateral_meeting: { en: 'Bilateral Meeting', ar: 'اجتماع ثنائي' },
  mission: { en: 'Mission', ar: 'بعثة' },
  delegation: { en: 'Delegation', ar: 'وفد' },
  summit: { en: 'Summit', ar: 'قمة' },
  working_group: { en: 'Working Group', ar: 'مجموعة عمل' },
  roundtable: { en: 'Roundtable', ar: 'طاولة مستديرة' },
  official_visit: { en: 'Official Visit', ar: 'زيارة رسمية' },
  consultation: { en: 'Consultation', ar: 'استشارة' },
  other: { en: 'Other', ar: 'أخرى' },
}

/**
 * Labels for engagement categories
 */
export const ENGAGEMENT_CATEGORY_LABELS: Record<EngagementCategory, { en: string; ar: string }> = {
  diplomatic: { en: 'Diplomatic', ar: 'دبلوماسي' },
  statistical: { en: 'Statistical', ar: 'إحصائي' },
  technical: { en: 'Technical', ar: 'فني' },
  economic: { en: 'Economic', ar: 'اقتصادي' },
  cultural: { en: 'Cultural', ar: 'ثقافي' },
  educational: { en: 'Educational', ar: 'تعليمي' },
  research: { en: 'Research', ar: 'بحثي' },
  other: { en: 'Other', ar: 'أخرى' },
}

/**
 * Labels for engagement status
 */
export const ENGAGEMENT_STATUS_LABELS: Record<EngagementStatus, { en: string; ar: string }> = {
  planned: { en: 'Planned', ar: 'مخطط' },
  confirmed: { en: 'Confirmed', ar: 'مؤكد' },
  in_progress: { en: 'In Progress', ar: 'جاري' },
  completed: { en: 'Completed', ar: 'مكتمل' },
  postponed: { en: 'Postponed', ar: 'مؤجل' },
  cancelled: { en: 'Cancelled', ar: 'ملغي' },
}

/**
 * Labels for delegation levels
 */
export const DELEGATION_LEVEL_LABELS: Record<DelegationLevel, { en: string; ar: string }> = {
  head_of_state: { en: 'Head of State', ar: 'رئيس دولة' },
  ministerial: { en: 'Ministerial', ar: 'وزاري' },
  senior_official: { en: 'Senior Official', ar: 'مسؤول رفيع' },
  director: { en: 'Director', ar: 'مدير' },
  expert: { en: 'Expert', ar: 'خبير' },
  technical: { en: 'Technical', ar: 'فني' },
}

/**
 * Labels for participant roles
 */
export const PARTICIPANT_ROLE_LABELS: Record<ParticipantRole, { en: string; ar: string }> = {
  host: { en: 'Host', ar: 'مضيف' },
  guest: { en: 'Guest', ar: 'ضيف' },
  delegate: { en: 'Delegate', ar: 'مندوب' },
  head_of_delegation: { en: 'Head of Delegation', ar: 'رئيس الوفد' },
  speaker: { en: 'Speaker', ar: 'متحدث' },
  observer: { en: 'Observer', ar: 'مراقب' },
  organizer: { en: 'Organizer', ar: 'منظم' },
  support_staff: { en: 'Support Staff', ar: 'طاقم دعم' },
  interpreter: { en: 'Interpreter', ar: 'مترجم' },
  other: { en: 'Other', ar: 'أخرى' },
}

/**
 * Labels for attendance status
 */
export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, { en: string; ar: string }> = {
  expected: { en: 'Expected', ar: 'متوقع' },
  confirmed: { en: 'Confirmed', ar: 'مؤكد' },
  attended: { en: 'Attended', ar: 'حضر' },
  no_show: { en: 'No Show', ar: 'لم يحضر' },
  cancelled: { en: 'Cancelled', ar: 'ملغي' },
  tentative: { en: 'Tentative', ar: 'غير مؤكد' },
}

/**
 * Labels for agenda item status
 */
export const AGENDA_ITEM_STATUS_LABELS: Record<AgendaItemStatus, { en: string; ar: string }> = {
  planned: { en: 'Planned', ar: 'مخطط' },
  in_progress: { en: 'In Progress', ar: 'جاري' },
  completed: { en: 'Completed', ar: 'مكتمل' },
  skipped: { en: 'Skipped', ar: 'تم تخطيه' },
  postponed: { en: 'Postponed', ar: 'مؤجل' },
}
