/**
 * Dossier Relationship Types
 * Feature: universal-relationship-crud
 *
 * Comprehensive type definitions for dossier-to-dossier relationships:
 * - Relationship types (member_of, participates_in, cooperates_with, etc.)
 * - Relationship metadata and validity periods
 * - API request/response types
 */

// ============================================================================
// Relationship Types
// ============================================================================

/**
 * Valid relationship types between dossiers
 */
export type DossierRelationshipType =
  | 'member_of'
  | 'participates_in'
  | 'cooperates_with'
  | 'bilateral_relation'
  | 'partnership'
  | 'parent_of'
  | 'subsidiary_of'
  | 'related_to'
  | 'represents'
  | 'hosted_by'
  | 'sponsored_by'
  | 'involves'
  | 'discusses'
  | 'participant_in'
  | 'observer_of'
  | 'affiliate_of'
  | 'successor_of'
  | 'predecessor_of'

/**
 * Relationship status
 */
export type RelationshipStatus = 'active' | 'historical' | 'terminated'

/**
 * Dossier type used in relationship context
 */
export type DossierType =
  | 'country'
  | 'organization'
  | 'forum'
  | 'person'
  | 'engagement'
  | 'working_group'
  | 'topic'

// ============================================================================
// Dossier Reference Types
// ============================================================================

/**
 * Compact dossier reference included in relationship responses
 */
export interface DossierReference {
  id: string
  type: DossierType
  name_en: string
  name_ar: string
  status: 'active' | 'inactive' | 'archived'
}

// ============================================================================
// Relationship Types
// ============================================================================

/**
 * Full dossier relationship record
 */
export interface DossierRelationship {
  id: string
  source_dossier_id: string
  target_dossier_id: string
  relationship_type: DossierRelationshipType
  relationship_metadata: Record<string, unknown>
  notes_en?: string
  notes_ar?: string
  effective_from?: string
  effective_to?: string
  status: RelationshipStatus
  created_at: string
  created_by?: string
  source_dossier?: DossierReference
  target_dossier?: DossierReference
}

/**
 * Relationship with resolved dossier references
 */
export interface DossierRelationshipWithDossiers extends DossierRelationship {
  source_dossier: DossierReference
  target_dossier: DossierReference
}

// ============================================================================
// API Request Types
// ============================================================================

/**
 * Input for creating a new relationship
 */
export interface RelationshipCreate {
  source_dossier_id: string
  target_dossier_id: string
  relationship_type: DossierRelationshipType
  relationship_metadata?: Record<string, unknown>
  notes_en?: string
  notes_ar?: string
  effective_from?: string
  effective_to?: string
  status?: RelationshipStatus
}

/**
 * Input for updating a relationship
 */
export interface RelationshipUpdate {
  relationship_type?: DossierRelationshipType
  relationship_metadata?: Record<string, unknown>
  notes_en?: string
  notes_ar?: string
  effective_from?: string
  effective_to?: string
  status?: RelationshipStatus
}

/**
 * Parameters for listing relationships
 */
export interface RelationshipListParams {
  source_dossier_id?: string
  target_dossier_id?: string
  dossier_id?: string
  relationship_type?: DossierRelationshipType
  status?: RelationshipStatus
  limit?: number
  offset?: number
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Paginated relationship list response
 */
export interface RelationshipListResponse {
  data: DossierRelationshipWithDossiers[]
  pagination: {
    total?: number
    limit: number
    offset: number
    has_more: boolean
  }
}

// ============================================================================
// Helper Constants
// ============================================================================

/**
 * All valid relationship types
 */
export const RELATIONSHIP_TYPES: DossierRelationshipType[] = [
  'member_of',
  'participates_in',
  'cooperates_with',
  'bilateral_relation',
  'partnership',
  'parent_of',
  'subsidiary_of',
  'related_to',
  'represents',
  'hosted_by',
  'sponsored_by',
  'involves',
  'discusses',
  'participant_in',
  'observer_of',
  'affiliate_of',
  'successor_of',
  'predecessor_of',
]

/**
 * Labels for relationship types
 */
export const RELATIONSHIP_TYPE_LABELS: Record<DossierRelationshipType, { en: string; ar: string }> =
  {
    member_of: { en: 'Member of', ar: 'عضو في' },
    participates_in: { en: 'Participates in', ar: 'يشارك في' },
    cooperates_with: { en: 'Cooperates with', ar: 'يتعاون مع' },
    bilateral_relation: { en: 'Bilateral relation', ar: 'علاقة ثنائية' },
    partnership: { en: 'Partnership', ar: 'شراكة' },
    parent_of: { en: 'Parent of', ar: 'الشركة الأم لـ' },
    subsidiary_of: { en: 'Subsidiary of', ar: 'تابع لـ' },
    related_to: { en: 'Related to', ar: 'مرتبط بـ' },
    represents: { en: 'Represents', ar: 'يمثل' },
    hosted_by: { en: 'Hosted by', ar: 'يستضيفه' },
    sponsored_by: { en: 'Sponsored by', ar: 'برعاية' },
    involves: { en: 'Involves', ar: 'يتضمن' },
    discusses: { en: 'Discusses', ar: 'يناقش' },
    participant_in: { en: 'Participant in', ar: 'مشارك في' },
    observer_of: { en: 'Observer of', ar: 'مراقب لـ' },
    affiliate_of: { en: 'Affiliate of', ar: 'منتسب لـ' },
    successor_of: { en: 'Successor of', ar: 'خلف لـ' },
    predecessor_of: { en: 'Predecessor of', ar: 'سابق لـ' },
  }

/**
 * Labels for relationship status
 */
export const RELATIONSHIP_STATUS_LABELS: Record<RelationshipStatus, { en: string; ar: string }> = {
  active: { en: 'Active', ar: 'نشط' },
  historical: { en: 'Historical', ar: 'تاريخي' },
  terminated: { en: 'Terminated', ar: 'منتهي' },
}

/**
 * Labels for dossier types
 */
export const DOSSIER_TYPE_LABELS: Record<DossierType, { en: string; ar: string }> = {
  country: { en: 'Country', ar: 'دولة' },
  organization: { en: 'Organization', ar: 'منظمة' },
  forum: { en: 'Forum', ar: 'منتدى' },
  person: { en: 'Person', ar: 'شخص' },
  engagement: { en: 'Engagement', ar: 'ارتباط' },
  working_group: { en: 'Working Group', ar: 'مجموعة عمل' },
  topic: { en: 'Topic', ar: 'موضوع' },
}

/**
 * Get inverse relationship type (for bidirectional display)
 */
export function getInverseRelationshipType(
  type: DossierRelationshipType,
): DossierRelationshipType | null {
  const inverseMap: Partial<Record<DossierRelationshipType, DossierRelationshipType>> = {
    member_of: 'involves',
    parent_of: 'subsidiary_of',
    subsidiary_of: 'parent_of',
    hosted_by: 'involves',
    sponsored_by: 'involves',
    successor_of: 'predecessor_of',
    predecessor_of: 'successor_of',
  }
  return inverseMap[type] || null
}

/**
 * Check if relationship type is symmetric (same meaning in both directions)
 */
export function isSymmetricRelationship(type: DossierRelationshipType): boolean {
  const symmetricTypes: DossierRelationshipType[] = [
    'cooperates_with',
    'bilateral_relation',
    'partnership',
    'related_to',
  ]
  return symmetricTypes.includes(type)
}
