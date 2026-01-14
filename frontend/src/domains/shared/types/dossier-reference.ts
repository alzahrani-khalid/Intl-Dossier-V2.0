/**
 * Shared Kernel - Dossier Reference Types
 *
 * Compact entity reference types used across all bounded contexts.
 * These types provide a standardized way to reference dossiers without
 * creating tight coupling between contexts.
 */

/**
 * Supported dossier types in the system
 */
export type DossierType =
  | 'country_dossier'
  | 'organization_dossier'
  | 'person_dossier'
  | 'forum_dossier'
  | 'position_dossier'
  | 'engagement_dossier'
  | 'project_dossier'

/**
 * Dossier status values
 */
export type DossierStatus = 'active' | 'inactive' | 'archived'

/**
 * Compact dossier reference for cross-context communication
 *
 * This is the primary way contexts reference dossiers from other contexts.
 * It contains only the essential identifying information.
 */
export interface DossierReference {
  /** Unique dossier identifier */
  id: string
  /** Type of dossier */
  type: DossierType
  /** English name */
  name_en: string
  /** Arabic name */
  name_ar: string
  /** Current status */
  status: DossierStatus
}

/**
 * Extended dossier reference with optional metadata
 */
export interface DossierReferenceExtended extends DossierReference {
  /** Optional description in English */
  description_en?: string
  /** Optional description in Arabic */
  description_ar?: string
  /** Optional tags for categorization */
  tags?: string[]
  /** Sensitivity level (1-5) */
  sensitivity_level?: number
  /** Additional context-specific metadata */
  metadata?: Record<string, unknown>
}

/**
 * Minimal dossier reference for lists and summaries
 */
export interface DossierReferenceSummary {
  id: string
  name_en: string
  name_ar: string
  type: DossierType
}

/**
 * Type guard to check if value is a valid DossierReference
 */
export function isDossierReference(value: unknown): value is DossierReference {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.id === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.name_en === 'string' &&
    typeof obj.name_ar === 'string' &&
    typeof obj.status === 'string'
  )
}

/**
 * Create a compact reference from a full dossier object
 */
export function toDossierReference(dossier: {
  id: string
  type: string
  name_en: string
  name_ar: string
  status: string
}): DossierReference {
  return {
    id: dossier.id,
    type: dossier.type as DossierType,
    name_en: dossier.name_en,
    name_ar: dossier.name_ar,
    status: dossier.status as DossierStatus,
  }
}

/**
 * Create a summary reference from a full dossier object
 */
export function toDossierReferenceSummary(dossier: {
  id: string
  name_en: string
  name_ar: string
  type: string
}): DossierReferenceSummary {
  return {
    id: dossier.id,
    name_en: dossier.name_en,
    name_ar: dossier.name_ar,
    type: dossier.type as DossierType,
  }
}
