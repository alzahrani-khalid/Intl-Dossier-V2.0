/**
 * Dossier-First Search Types
 * Feature: Dossier-first search experience
 *
 * Types and interfaces for the redesigned search experience that emphasizes
 * dossier discovery. Search results are organized in two sections:
 * - DOSSIERS: Matching dossiers with type badges and key stats
 * - RELATED WORK: Items linked to matching dossiers
 */

import type { DossierType } from '@/lib/dossier-type-guards'

/**
 * Dossier search result with key stats
 */
export interface DossierSearchResult {
  id: string
  type: DossierType
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  status: 'active' | 'archived'
  sensitivity_level: number
  tags?: string[]
  relevance_score: number
  matched_fields: string[]
  created_at: string
  updated_at: string

  // Key stats for dossier cards
  stats: DossierStats
}

/**
 * Key statistics shown on dossier cards
 */
export interface DossierStats {
  total_engagements: number
  total_documents: number
  total_positions: number
  total_work_items: number
  recent_activity_date?: string
  related_dossiers_count: number
}

/**
 * Work item types that can be related to dossiers
 */
export type RelatedWorkType =
  | 'position'
  | 'document'
  | 'mou'
  | 'engagement'
  | 'task'
  | 'commitment'
  | 'intake'

/**
 * Related work item linked to a dossier
 */
export interface RelatedWorkItem {
  id: string
  type: RelatedWorkType
  title_en: string
  title_ar: string
  description_en?: string
  description_ar?: string
  status?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  relevance_score: number
  matched_fields: string[]
  created_at: string
  updated_at: string
  deadline?: string

  // Dossier context - which dossier this item is linked to
  dossier_context: DossierContext

  // Inheritance info
  inheritance_source?: 'direct' | 'engagement' | 'after_action' | 'position' | 'mou'
}

/**
 * Minimal dossier context for badges on related items
 */
export interface DossierContext {
  id: string
  type: DossierType
  name_en: string
  name_ar: string
}

/**
 * Search filter state
 */
export interface DossierSearchFilters {
  // Dossier type filter (All Types dropdown)
  types: DossierType[] | 'all'

  // Status filter
  status: 'all' | 'active' | 'archived'

  // My Dossiers toggle - only show dossiers user has access to
  myDossiersOnly: boolean

  // Optional text query
  query: string
}

/**
 * Grouped search response for dossier-first experience
 */
export interface DossierFirstSearchResponse {
  // Matching dossiers (Section 1: DOSSIERS)
  dossiers: DossierSearchResult[]
  dossiers_total: number

  // Related work items (Section 2: RELATED WORK)
  related_work: RelatedWorkItem[]
  related_work_total: number

  // Query metadata
  query: {
    text: string
    normalized: string
    language_detected: 'ar' | 'en' | 'mixed'
  }

  // Performance
  took_ms: number

  // Pagination
  page: number
  page_size: number
  has_more_dossiers: boolean
  has_more_work: boolean
}

/**
 * Props for the dossier-first search results component
 */
export interface DossierFirstSearchResultsProps {
  dossiers: DossierSearchResult[]
  relatedWork: RelatedWorkItem[]
  dossiersTotal: number
  relatedWorkTotal: number
  isLoading?: boolean
  searchQuery?: string
  hasMoreDossiers?: boolean
  hasMoreWork?: boolean
  onLoadMoreDossiers?: () => void
  onLoadMoreWork?: () => void
  onDossierClick?: (dossier: DossierSearchResult) => void
  onWorkItemClick?: (item: RelatedWorkItem) => void
}

/**
 * Dossier type filter option
 */
export interface DossierTypeFilterOption {
  value: DossierType | 'all'
  label_en: string
  label_ar: string
  count?: number
}
