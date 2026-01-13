/**
 * Person Entity Types
 * Feature: persons-entity-management
 *
 * Comprehensive type definitions for person dossiers including:
 * - Person extension data
 * - Roles (career history)
 * - Affiliations (organization memberships)
 * - Relationships (person-to-person connections)
 * - Engagements (event participation)
 */

// ============================================================================
// Base Person Types
// ============================================================================

/**
 * Person extension data stored in the persons table
 */
export interface PersonExtension {
  id: string
  title_en?: string
  title_ar?: string
  organization_id?: string
  nationality_country_id?: string
  email?: string
  phone?: string
  biography_en?: string
  biography_ar?: string
  photo_url?: string
  linkedin_url?: string
  twitter_url?: string
  expertise_areas: string[]
  languages: string[]
  notes?: string
  importance_level: ImportanceLevel
}

/**
 * Importance levels for persons
 * 1 = Regular contact
 * 2 = Important
 * 3 = Key contact
 * 4 = VIP
 * 5 = Critical
 */
export type ImportanceLevel = 1 | 2 | 3 | 4 | 5

/**
 * Full person dossier combining base dossier and extension
 */
export interface PersonDossier {
  id: string
  type: 'person'
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
  extension: PersonExtension
}

/**
 * Full person profile returned by get_person_full RPC
 */
export interface PersonFullProfile {
  person: PersonDossier & PersonExtension
  current_role?: PersonRole
  roles: PersonRole[]
  affiliations: PersonAffiliation[]
  relationships: PersonRelationshipWithPerson[]
  recent_engagements: PersonEngagementWithDetails[]
}

// ============================================================================
// Person Roles (Career History)
// ============================================================================

/**
 * Person role representing a position held
 */
export interface PersonRole {
  id: string
  person_id: string
  organization_id?: string
  organization_name_en?: string
  organization_name_ar?: string
  role_title_en: string
  role_title_ar?: string
  department_en?: string
  department_ar?: string
  start_date?: string
  end_date?: string
  is_current: boolean
  description_en?: string
  description_ar?: string
  created_at: string
  updated_at: string
  created_by?: string
}

/**
 * Input for creating a new role
 */
export interface PersonRoleCreate {
  organization_id?: string
  organization_name_en?: string
  organization_name_ar?: string
  role_title_en: string
  role_title_ar?: string
  department_en?: string
  department_ar?: string
  start_date?: string
  end_date?: string
  is_current?: boolean
  description_en?: string
  description_ar?: string
}

// ============================================================================
// Person Affiliations
// ============================================================================

/**
 * Affiliation types for secondary organization memberships
 */
export type AffiliationType =
  | 'member'
  | 'board_member'
  | 'advisor'
  | 'consultant'
  | 'representative'
  | 'delegate'
  | 'liaison'
  | 'partner'
  | 'volunteer'
  | 'alumni'

/**
 * Person affiliation with an organization
 */
export interface PersonAffiliation {
  id: string
  person_id: string
  organization_id?: string
  organization_name_en?: string
  organization_name_ar?: string
  affiliation_type: AffiliationType
  position_title_en?: string
  position_title_ar?: string
  start_date?: string
  end_date?: string
  is_active: boolean
  notes?: string
  created_at: string
  updated_at: string
  created_by?: string
}

/**
 * Input for creating a new affiliation
 */
export interface PersonAffiliationCreate {
  organization_id?: string
  organization_name_en?: string
  organization_name_ar?: string
  affiliation_type: AffiliationType
  position_title_en?: string
  position_title_ar?: string
  start_date?: string
  end_date?: string
  is_active?: boolean
  notes?: string
}

// ============================================================================
// Person Relationships
// ============================================================================

/**
 * Relationship types between persons
 */
export type RelationshipType =
  | 'reports_to'
  | 'supervises'
  | 'colleague'
  | 'collaborates_with'
  | 'mentors'
  | 'knows'
  | 'former_colleague'
  | 'referral'

/**
 * Relationship strength
 * 1 = Weak, 2 = Casual, 3 = Normal, 4 = Strong, 5 = Very Strong
 */
export type RelationshipStrength = 1 | 2 | 3 | 4 | 5

/**
 * Person relationship record
 */
export interface PersonRelationship {
  id: string
  from_person_id: string
  to_person_id: string
  relationship_type: RelationshipType
  strength: RelationshipStrength
  notes?: string
  start_date?: string
  end_date?: string
  created_at: string
  created_by?: string
}

/**
 * Person relationship with related person data
 */
export interface PersonRelationshipWithPerson {
  relationship: PersonRelationship
  related_person: {
    id: string
    name_en: string
    name_ar: string
    photo_url?: string
    title_en?: string
    organization_id?: string
  }
}

/**
 * Input for creating a new relationship
 */
export interface PersonRelationshipCreate {
  to_person_id: string
  relationship_type: RelationshipType
  strength?: RelationshipStrength
  notes?: string
  start_date?: string
  end_date?: string
}

// ============================================================================
// Person Engagements
// ============================================================================

/**
 * Role types for engagement participation
 */
export type EngagementRole =
  | 'organizer'
  | 'presenter'
  | 'attendee'
  | 'speaker'
  | 'moderator'
  | 'observer'
  | 'delegate'
  | 'advisor'
  | 'guest'

/**
 * Person engagement link record
 */
export interface PersonEngagement {
  id: string
  person_id: string
  engagement_id: string
  role: EngagementRole
  notes?: string
  attended: boolean
  created_at: string
  created_by?: string
}

/**
 * Person engagement with full engagement details
 */
export interface PersonEngagementWithDetails {
  link: PersonEngagement
  engagement: {
    id: string
    name_en: string
    name_ar: string
    engagement_type: string
    engagement_category: string
    location_en?: string
    location_ar?: string
  }
}

// ============================================================================
// Network Graph Types
// ============================================================================

/**
 * Node in the person network graph
 */
export interface PersonNetworkNode {
  id: string
  name_en: string
  name_ar: string
  photo_url?: string
  depth: number
}

/**
 * Edge in the person network graph
 */
export interface PersonNetworkEdge {
  from: string
  to: string
  type: RelationshipType
  strength: RelationshipStrength
}

/**
 * Person network graph data
 */
export interface PersonNetwork {
  nodes: PersonNetworkNode[]
  edges: PersonNetworkEdge[]
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Input for creating a new person
 */
export interface PersonCreate {
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  title_en?: string
  title_ar?: string
  organization_id?: string
  nationality_country_id?: string
  email?: string
  phone?: string
  biography_en?: string
  biography_ar?: string
  photo_url?: string
  linkedin_url?: string
  twitter_url?: string
  expertise_areas?: string[]
  languages?: string[]
  importance_level?: ImportanceLevel
  sensitivity_level?: number
  tags?: string[]
}

/**
 * Input for updating a person
 */
export interface PersonUpdate {
  name_en?: string
  name_ar?: string
  description_en?: string
  description_ar?: string
  title_en?: string
  title_ar?: string
  organization_id?: string
  nationality_country_id?: string
  email?: string
  phone?: string
  biography_en?: string
  biography_ar?: string
  photo_url?: string
  linkedin_url?: string
  twitter_url?: string
  expertise_areas?: string[]
  languages?: string[]
  importance_level?: ImportanceLevel
  notes?: string
  tags?: string[]
  status?: 'active' | 'inactive' | 'archived'
}

/**
 * Search parameters for persons
 */
export interface PersonSearchParams {
  search?: string
  organization_id?: string
  nationality_id?: string
  importance_level?: ImportanceLevel
  limit?: number
  offset?: number
}

/**
 * Person list item (compact version for lists)
 */
export interface PersonListItem {
  id: string
  name_en: string
  name_ar: string
  title_en?: string
  title_ar?: string
  photo_url?: string
  organization_id?: string
  organization_name?: string
  importance_level: ImportanceLevel
  email?: string
  phone?: string
}

/**
 * Person list response
 */
export interface PersonListResponse {
  data: PersonListItem[]
  pagination: {
    total: number
    limit: number
    offset: number
    has_more: boolean
  }
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Labels for importance levels
 */
export const IMPORTANCE_LEVEL_LABELS: Record<ImportanceLevel, { en: string; ar: string }> = {
  1: { en: 'Regular', ar: 'عادي' },
  2: { en: 'Important', ar: 'مهم' },
  3: { en: 'Key Contact', ar: 'جهة اتصال رئيسية' },
  4: { en: 'VIP', ar: 'شخصية هامة' },
  5: { en: 'Critical', ar: 'حرج' },
}

/**
 * Labels for relationship types
 */
export const RELATIONSHIP_TYPE_LABELS: Record<RelationshipType, { en: string; ar: string }> = {
  reports_to: { en: 'Reports to', ar: 'يرفع تقاريره إلى' },
  supervises: { en: 'Supervises', ar: 'يشرف على' },
  colleague: { en: 'Colleague', ar: 'زميل' },
  collaborates_with: { en: 'Collaborates with', ar: 'يتعاون مع' },
  mentors: { en: 'Mentors', ar: 'يوجه' },
  knows: { en: 'Knows', ar: 'يعرف' },
  former_colleague: { en: 'Former colleague', ar: 'زميل سابق' },
  referral: { en: 'Referral', ar: 'إحالة' },
}

/**
 * Labels for affiliation types
 */
export const AFFILIATION_TYPE_LABELS: Record<AffiliationType, { en: string; ar: string }> = {
  member: { en: 'Member', ar: 'عضو' },
  board_member: { en: 'Board Member', ar: 'عضو مجلس إدارة' },
  advisor: { en: 'Advisor', ar: 'مستشار' },
  consultant: { en: 'Consultant', ar: 'استشاري' },
  representative: { en: 'Representative', ar: 'ممثل' },
  delegate: { en: 'Delegate', ar: 'مندوب' },
  liaison: { en: 'Liaison', ar: 'منسق' },
  partner: { en: 'Partner', ar: 'شريك' },
  volunteer: { en: 'Volunteer', ar: 'متطوع' },
  alumni: { en: 'Alumni', ar: 'خريج' },
}

/**
 * Labels for engagement roles
 */
export const ENGAGEMENT_ROLE_LABELS: Record<EngagementRole, { en: string; ar: string }> = {
  organizer: { en: 'Organizer', ar: 'منظم' },
  presenter: { en: 'Presenter', ar: 'مقدم' },
  attendee: { en: 'Attendee', ar: 'حاضر' },
  speaker: { en: 'Speaker', ar: 'متحدث' },
  moderator: { en: 'Moderator', ar: 'مدير جلسة' },
  observer: { en: 'Observer', ar: 'مراقب' },
  delegate: { en: 'Delegate', ar: 'مندوب' },
  advisor: { en: 'Advisor', ar: 'مستشار' },
  guest: { en: 'Guest', ar: 'ضيف' },
}
