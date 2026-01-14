/**
 * Shared Kernel - Entity Link Types
 *
 * Polymorphic entity linking types for creating relationships
 * between any entity types across contexts.
 */

import type { DossierType } from './dossier-reference'

/**
 * Link status values
 */
export type LinkStatus = 'active' | 'archived' | 'pending'

/**
 * Types of entities that can be linked
 */
export type LinkableEntityType =
  | DossierType
  | 'document'
  | 'commitment'
  | 'task'
  | 'calendar_entry'
  | 'intelligence_signal'

/**
 * Entity link representing a many-to-many relationship
 */
export interface EntityLink {
  /** Unique link identifier */
  id: string
  /** Source entity type */
  source_type: LinkableEntityType
  /** Source entity ID */
  source_id: string
  /** Target entity type */
  target_type: LinkableEntityType
  /** Target entity ID */
  target_id: string
  /** Link type/category */
  link_type: string
  /** Optional notes in English */
  notes_en?: string
  /** Optional notes in Arabic */
  notes_ar?: string
  /** Link status */
  status: LinkStatus
  /** Additional metadata */
  metadata?: Record<string, unknown>
  /** Creation timestamp */
  created_at: string
  /** Creator user ID */
  created_by?: string
}

/**
 * Input for creating an entity link
 */
export interface EntityLinkCreate {
  source_type: LinkableEntityType
  source_id: string
  target_type: LinkableEntityType
  target_id: string
  link_type: string
  notes_en?: string
  notes_ar?: string
  metadata?: Record<string, unknown>
}

/**
 * Input for updating an entity link
 */
export interface EntityLinkUpdate {
  link_type?: string
  notes_en?: string
  notes_ar?: string
  status?: LinkStatus
  metadata?: Record<string, unknown>
}

/**
 * Filter options for listing entity links
 */
export interface EntityLinkFilters {
  source_type?: LinkableEntityType
  source_id?: string
  target_type?: LinkableEntityType
  target_id?: string
  link_type?: string
  status?: LinkStatus
}

/**
 * Type guard for EntityLink
 */
export function isEntityLink(value: unknown): value is EntityLink {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.id === 'string' &&
    typeof obj.source_type === 'string' &&
    typeof obj.source_id === 'string' &&
    typeof obj.target_type === 'string' &&
    typeof obj.target_id === 'string' &&
    typeof obj.link_type === 'string'
  )
}
