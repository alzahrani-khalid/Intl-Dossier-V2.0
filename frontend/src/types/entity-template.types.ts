/**
 * Entity Template Types
 * Feature: Entity Creation Templates
 *
 * Type definitions for entity creation templates with
 * pre-filled values, context-aware suggestions, and keyboard shortcuts.
 */

// ============================================
// Enums & Constants
// ============================================

export const TEMPLATE_ENTITY_TYPES = [
  'dossier',
  'engagement',
  'commitment',
  'task',
  'intake',
  'position',
  'contact',
  'calendar_event',
] as const
export type TemplateEntityType = (typeof TEMPLATE_ENTITY_TYPES)[number]

export const TEMPLATE_SCOPES = ['system', 'team', 'personal'] as const
export type TemplateScope = (typeof TEMPLATE_SCOPES)[number]

export const TEMPLATE_STATUSES = ['draft', 'published', 'archived'] as const
export type TemplateStatus = (typeof TEMPLATE_STATUSES)[number]

// ============================================
// Core Types
// ============================================

/**
 * Entity template definition
 */
export interface EntityTemplate {
  id: string
  name_en: string
  name_ar: string
  description_en: string | null
  description_ar: string | null
  entity_type: TemplateEntityType
  scope: TemplateScope
  icon: string
  color: string
  default_values: Record<string, unknown>
  suggested_relationships: SuggestedRelationship[]
  keyboard_shortcut: string | null
  usage_count: number
  is_favorite: boolean
  is_recent: boolean
  last_used_at: string | null
  tags: string[]
}

/**
 * Suggested relationship from template
 */
export interface SuggestedRelationship {
  entity_type: string
  relationship_type: string
  auto_link?: boolean
}

/**
 * Context for template filtering
 */
export interface TemplateContext {
  dossier_type?: string
  route_contains?: string
  dossier_id?: string
  engagement_id?: string
  [key: string]: string | undefined
}

// ============================================
// API Request/Response Types
// ============================================

/**
 * Response from get templates
 */
export interface GetTemplatesResponse {
  templates: EntityTemplate[]
  count: number
}

/**
 * Request to create template
 */
export interface CreateTemplateRequest {
  action: 'create'
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  entity_type: TemplateEntityType
  scope?: TemplateScope
  icon?: string
  color?: string
  default_values: Record<string, unknown>
  suggested_relationships?: SuggestedRelationship[]
  context_conditions?: TemplateContext
  keyboard_shortcut?: string
  tags?: string[]
}

/**
 * Request to update template
 */
export interface UpdateTemplateRequest {
  id: string
  name_en?: string
  name_ar?: string
  description_en?: string | null
  description_ar?: string | null
  icon?: string
  color?: string
  default_values?: Record<string, unknown>
  suggested_relationships?: SuggestedRelationship[]
  context_conditions?: TemplateContext
  keyboard_shortcut?: string | null
  status?: TemplateStatus
  tags?: string[]
}

/**
 * Toggle favorite response
 */
export interface ToggleFavoriteResponse {
  success: boolean
  is_favorite: boolean
}

// ============================================
// Component Props Types
// ============================================

/**
 * Props for TemplateCard component
 */
export interface TemplateCardProps {
  template: EntityTemplate
  isSelected?: boolean
  onClick: (template: EntityTemplate) => void
  onFavoriteToggle?: (template: EntityTemplate) => void
  showKeyboardShortcut?: boolean
}

// ============================================
// Keyboard Shortcuts
// ============================================

// ============================================
// Template Presets
// ============================================

// ============================================
// Utility Types
// ============================================

/**
 * Get color class from template
 */
export function getColorClass(template: EntityTemplate): string {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    green: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  }

  return (colorMap[template.color] || colorMap.blue)!
}

/**
 * Format keyboard shortcut for display
 */
export function formatKeyboardShortcut(shortcut: string | null): string {
  if (!shortcut) return ''

  // Replace common modifiers with symbols
  return shortcut
    .replace('Cmd', '\u2318')
    .replace('Alt', '\u2325')
    .replace('Ctrl', '\u2303')
    .replace('Shift', '\u21E7')
    .replace(/\+/g, '')
}
