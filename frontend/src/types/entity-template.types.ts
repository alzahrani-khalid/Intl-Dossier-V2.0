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
 * D-58-06-A-14: 13 raw color names collapsed onto 6 semantic families.
 * Within-family disambiguation uses bg opacity-step pairs (text stays
 * single-class because text-{sem}/X opacity isn't a Tailwind utility).
 * D-07 collision (blue + purple + indigo + violet + pink):
 *   blue                  → accent (base)
 *   purple                → secondary/10
 *   violet                → secondary/20 [D-07 sibling step]
 *   indigo                → secondary/30 [D-07 sibling step]
 *   pink                  → secondary/40 [D-07 sibling step]
 * Other family collapses:
 *   green, emerald, teal  → success at /10, /20, /30
 *   amber, orange         → warning at /10, /20
 *   red                   → destructive
 *   cyan                  → info
 *   dark variants preserved on bg-* with alpha bump (D-08); dark text-*
 *   dropped (D-09).
 */
export function getColorClass(template: EntityTemplate): string {
  const colorMap: Record<string, string> = {
    blue: 'bg-accent/10 text-accent dark:bg-accent/30',
    green: 'bg-success/10 text-success dark:bg-success/30',
    purple: 'bg-secondary/10 text-secondary-foreground dark:bg-secondary/30',
    amber: 'bg-warning/10 text-warning dark:bg-warning/30',
    red: 'bg-destructive/10 text-destructive dark:bg-destructive/30',
    cyan: 'bg-info/10 text-info dark:bg-info/30',
    indigo: 'bg-secondary/30 text-secondary-foreground dark:bg-secondary/50',
    orange: 'bg-warning/20 text-warning dark:bg-warning/40',
    pink: 'bg-secondary/40 text-secondary-foreground dark:bg-secondary/60',
    violet: 'bg-secondary/20 text-secondary-foreground dark:bg-secondary/40',
    emerald: 'bg-success/20 text-success dark:bg-success/40',
    teal: 'bg-success/30 text-success dark:bg-success/50',
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
