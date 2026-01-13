/**
 * Theme Entity Types
 *
 * Types for the themes entity that supports topical areas and issue domains
 * (e.g., SDGs, Climate Statistics, Digital Economy). Themes enable cross-cutting
 * analysis and relationship tracking across entities.
 */

import type { DossierStatus } from './dossier'

// Theme extension data (stored in themes extension table)
export interface ThemeExtension {
  id?: string
  parent_theme_id?: string | null
  category_code: string
  hierarchy_level?: number
  icon?: string | null
  color?: string | null
  attributes?: Record<string, unknown>
  sort_order?: number
  is_standard?: boolean
  external_url?: string | null
}

// Complete theme entity (base dossier + extension)
export interface Theme {
  // Base dossier fields
  id: string
  type: 'theme'
  name_en: string
  name_ar: string
  description_en?: string | null
  description_ar?: string | null
  status: DossierStatus
  sensitivity_level: number
  tags: string[]
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
  is_active?: boolean
  // Theme extension
  extension: ThemeExtension
}

// Theme with hierarchical context
export interface ThemeWithContext extends Theme {
  // Parent info
  parent_name_en?: string | null
  parent_name_ar?: string | null
  parent_category_code?: string | null
  // Children info
  children_count?: number
  // Path from root
  path?: string[]
  path_names_en?: string[]
  path_names_ar?: string[]
}

// Theme node for tree views
export interface ThemeNode {
  id: string
  name_en: string
  name_ar: string
  category_code: string
  hierarchy_level: number
  parent_theme_id?: string | null
  icon?: string | null
  color?: string | null
  is_standard?: boolean
  sort_order?: number
  children?: ThemeNode[]
  // For UI state
  expanded?: boolean
  selected?: boolean
}

// Flat tree item for rendering
export interface ThemeFlatTreeItem {
  id: string
  name_en: string
  name_ar: string
  category_code: string
  hierarchy_level: number
  parent_theme_id?: string | null
  icon?: string | null
  color?: string | null
  is_standard?: boolean
  sort_order?: number
  depth: number
  hasChildren: boolean
  isExpanded?: boolean
}

// Request type for creating a theme
export interface ThemeCreateRequest {
  // Base dossier fields
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  status?: DossierStatus
  sensitivity_level?: number
  tags?: string[]
  metadata?: Record<string, unknown>
  // Theme extension fields
  extension?: Omit<ThemeExtension, 'id' | 'hierarchy_level'>
}

// Request type for updating a theme
export interface ThemeUpdateRequest {
  // Base dossier fields
  name_en?: string
  name_ar?: string
  description_en?: string | null
  description_ar?: string | null
  status?: DossierStatus
  sensitivity_level?: number
  tags?: string[]
  metadata?: Record<string, unknown>
  // Theme extension fields
  extension?: Partial<Omit<ThemeExtension, 'id' | 'hierarchy_level'>>
}

// Pagination info
export interface Pagination {
  page: number
  limit: number
  total: number | null
  totalPages: number
}

// List response type
export interface ThemeListResponse {
  data: Theme[]
  pagination: Pagination
}

// Tree response type
export interface ThemeTreeResponse {
  data: ThemeNode[]
  total: number
}

// Theme filters for list queries
export interface ThemeFilters {
  search?: string
  status?: DossierStatus
  parent_theme_id?: string | null // null = root themes only, undefined = all
  is_standard?: boolean
  page?: number
  limit?: number
}

// API error response
export interface ThemeApiError {
  error: {
    code: string
    message_en: string
    message_ar: string
    details?: string
  }
}

// Theme with related data (for detail views)
export interface ThemeWithRelations extends ThemeWithContext {
  // Relationships to other dossiers
  related_dossiers_count?: number
  relationships?: Array<{
    id: string
    relationship_type: string
    target_dossier: {
      id: string
      name_en: string
      name_ar: string
      type: string
    }
  }>
}

// Theme ancestor/descendant info
export interface ThemeAncestor {
  id: string
  name_en: string
  name_ar: string
  category_code: string
  hierarchy_level: number
  depth: number
}

export interface ThemeDescendant {
  id: string
  name_en: string
  name_ar: string
  category_code: string
  hierarchy_level: number
  parent_theme_id: string
  depth: number
}

// Standard theme categories (for seeding/reference)
export type StandardThemeCategory =
  | 'SDG' // Sustainable Development Goals
  | 'CLIMATE' // Climate Statistics
  | 'DIGITAL' // Digital Economy
  | 'TRADE' // International Trade
  | 'POPULATION' // Population Statistics
  | 'HEALTH' // Health Statistics
  | 'EDUCATION' // Education Statistics
  | 'ECONOMIC' // Economic Statistics
  | 'ENVIRONMENTAL' // Environmental Statistics
  | 'GOVERNANCE' // Governance & Institutions

// TanStack Query keys factory
export const themeKeys = {
  all: ['themes'] as const,
  lists: () => [...themeKeys.all, 'list'] as const,
  list: (filters?: ThemeFilters) => [...themeKeys.lists(), filters] as const,
  details: () => [...themeKeys.all, 'detail'] as const,
  detail: (id: string) => [...themeKeys.details(), id] as const,
  hierarchy: () => [...themeKeys.all, 'hierarchy'] as const,
  tree: () => [...themeKeys.all, 'tree'] as const,
  ancestors: (id: string) => [...themeKeys.all, 'ancestors', id] as const,
  descendants: (id: string) => [...themeKeys.all, 'descendants', id] as const,
  children: (parentId: string | null) =>
    [...themeKeys.all, 'children', parentId ?? 'root'] as const,
}
