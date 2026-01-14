/**
 * Relationship Context - Domain Types
 *
 * Core domain types for the Relationship bounded context.
 * These types represent relationships between dossiers and
 * relationship health scoring.
 */

import type { DossierReference } from '@/domains/shared'

// ============================================================================
// Relationship Types
// ============================================================================

/**
 * Comprehensive list of relationship types for all dossier types
 */
export type RelationshipType =
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
  // Legacy types for backward compatibility
  | 'membership'
  | 'parent_child'
  | 'participation'
  | 'affiliation'
  | 'dependency'
  | 'collaboration'

/**
 * Relationship status values
 */
export type RelationshipStatus = 'active' | 'historical' | 'terminated'

// ============================================================================
// Relationship Domain Model
// ============================================================================

/**
 * Relationship entity connecting two dossiers
 */
export interface Relationship {
  id: string
  source_dossier_id: string
  target_dossier_id: string
  relationship_type: RelationshipType
  relationship_metadata: Record<string, unknown>
  notes_en?: string
  notes_ar?: string
  effective_from?: string
  effective_to?: string
  status: RelationshipStatus
  created_at: string
  created_by?: string
}

/**
 * Relationship with joined dossier information
 */
export interface RelationshipWithDossiers extends Relationship {
  source_dossier?: DossierReference
  target_dossier?: DossierReference
}

/**
 * Relationship list item for display
 */
export interface RelationshipListItem {
  id: string
  source_dossier_id: string
  target_dossier_id: string
  relationship_type: RelationshipType
  status: RelationshipStatus
  effective_from?: string
  effective_to?: string
  source_dossier_name_en?: string
  source_dossier_name_ar?: string
  target_dossier_name_en?: string
  target_dossier_name_ar?: string
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * Input for creating a new relationship
 */
export interface RelationshipCreate {
  source_dossier_id: string
  target_dossier_id: string
  relationship_type: RelationshipType
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
  relationship_type?: RelationshipType
  relationship_metadata?: Record<string, unknown>
  notes_en?: string
  notes_ar?: string
  effective_from?: string
  effective_to?: string
  status?: RelationshipStatus
}

/**
 * Filters for listing relationships
 */
export interface RelationshipFilters {
  source_dossier_id?: string
  target_dossier_id?: string
  dossier_id?: string
  relationship_type?: RelationshipType
  status?: RelationshipStatus
  page?: number
  page_size?: number
  limit?: number
  offset?: number
}

// ============================================================================
// Type Guards and Helpers
// ============================================================================

/**
 * Check if relationship is active
 */
export function isActiveRelationship(
  relationship: Relationship | RelationshipWithDossiers,
): boolean {
  return relationship.status === 'active'
}

/**
 * Check if relationship is bidirectional
 */
export function isBidirectionalType(type: RelationshipType): boolean {
  const bidirectionalTypes: RelationshipType[] = [
    'cooperates_with',
    'bilateral_relation',
    'partnership',
    'related_to',
    'collaboration',
  ]
  return bidirectionalTypes.includes(type)
}

/**
 * Get the inverse relationship type (if applicable)
 */
export function getInverseRelationshipType(type: RelationshipType): RelationshipType | null {
  const inverseMap: Partial<Record<RelationshipType, RelationshipType>> = {
    member_of: 'participates_in',
    participates_in: 'member_of',
    parent_of: 'subsidiary_of',
    subsidiary_of: 'parent_of',
    hosted_by: 'sponsored_by',
    sponsored_by: 'hosted_by',
    successor_of: 'predecessor_of',
    predecessor_of: 'successor_of',
    parent_child: 'parent_child',
  }
  return inverseMap[type] || null
}

/**
 * Get relationship direction
 */
export type RelationshipDirection = 'outgoing' | 'incoming' | 'bidirectional'

export function getRelationshipDirection(
  relationship: RelationshipWithDossiers,
  currentDossierId: string,
): RelationshipDirection {
  if (isBidirectionalType(relationship.relationship_type)) {
    return 'bidirectional'
  }
  if (relationship.source_dossier_id === currentDossierId) {
    return 'outgoing'
  }
  return 'incoming'
}
