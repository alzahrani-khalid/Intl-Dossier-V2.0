/**
 * Preview Layout Types
 * Feature: Custom Preview Card Layouts
 *
 * Types for configuring how entity preview cards are displayed
 * in hover previews, search results, and embedded references.
 */

// =============================================================================
// ENUMS (matching database enums)
// =============================================================================

export type PreviewEntityType =
  | 'dossier'
  | 'organization'
  | 'country'
  | 'forum'
  | 'position'
  | 'mou'
  | 'engagement'
  | 'commitment'
  | 'assignment'
  | 'intelligence_signal'
  | 'working_group'
  | 'topic'

export type PreviewContext = 'hover' | 'search_result' | 'embedded' | 'compact' | 'expanded'

export type PreviewFieldType =
  | 'text'
  | 'date'
  | 'status'
  | 'badge'
  | 'tags'
  | 'avatar'
  | 'relationship'
  | 'activity'
  | 'metric'
  | 'priority'
  | 'custom'

// =============================================================================
// LAYOUT CONFIGURATION
// =============================================================================

/**
 * Layout configuration options for preview cards
 */
export interface PreviewLayoutConfig {
  /** Show avatar/photo if available */
  showAvatar: boolean
  /** Show status badge */
  showStatus: boolean
  /** Show entity type badge */
  showEntityType: boolean
  /** Show last updated timestamp */
  showLastUpdated: boolean
  /** Maximum number of key details to show */
  maxKeyDetails: number
  /** Maximum number of tags to show */
  maxTags: number
  /** Show recent activity section */
  showRecentActivity: boolean
  /** Show match score indicator */
  showMatchScore: boolean
}

/**
 * Field source configuration - where to get the field value
 */
export interface FieldSourceConfig {
  /** Direct database column name */
  column?: string
  /** Nested path for relationships (e.g., "country.name_en") */
  path?: string
  /** Computed field identifier */
  computed?: string
}

/**
 * Field display configuration - how to render the field
 */
export interface FieldDisplayConfig {
  /** Date format type */
  format?: 'date' | 'datetime' | 'relative'
  /** Highlight overdue dates */
  highlightOverdue?: boolean
  /** Maximum character length before truncation */
  maxLength?: number
  /** Whether to truncate long values */
  truncate?: boolean
  /** Convert to uppercase */
  uppercase?: boolean
  /** Suffix to append (e.g., " members") */
  suffix?: string
  /** Prefix to prepend */
  prefix?: string
  /** Color mapping for badge values */
  colorMap?: Record<string, string>
  /** Maximum items for arrays (tags, etc.) */
  maxItems?: number
}

/**
 * Field visibility rules - conditional visibility
 */
export interface FieldVisibilityRule {
  field: string
  operator: 'equals' | 'notEquals' | 'contains' | 'exists' | 'notExists'
  value?: string | number | boolean
}

export interface FieldVisibilityRules {
  conditions: FieldVisibilityRule[]
  logic?: 'and' | 'or'
}

// =============================================================================
// PREVIEW LAYOUT FIELD
// =============================================================================

/**
 * A field configuration within a preview layout
 */
export interface PreviewLayoutField {
  /** Field ID */
  id: string
  /** Field key (unique within layout) */
  field_key: string
  /** Field type */
  field_type: PreviewFieldType
  /** Display label (English) */
  label_en: string
  /** Display label (Arabic) */
  label_ar: string
  /** Source configuration */
  source_config: FieldSourceConfig
  /** Display configuration */
  display_config: FieldDisplayConfig
  /** Visibility rules */
  visibility_rules: FieldVisibilityRules | null
  /** Sort order in layout */
  sort_order: number
  /** Is field visible by default */
  is_visible: boolean
  /** Is field required (cannot be hidden) */
  is_required: boolean
}

// =============================================================================
// PREVIEW LAYOUT
// =============================================================================

/**
 * A complete preview layout configuration
 */
export interface PreviewLayout {
  /** Layout ID */
  id: string
  /** Entity type this layout applies to */
  entity_type: PreviewEntityType
  /** Context where this layout is used */
  context: PreviewContext
  /** Layout name (English) */
  name_en: string
  /** Layout name (Arabic) */
  name_ar: string
  /** Layout description (English) */
  description_en?: string
  /** Layout description (Arabic) */
  description_ar?: string
  /** Is this the default layout for this entity type + context */
  is_default: boolean
  /** Layout configuration options */
  layout_config: PreviewLayoutConfig
  /** Organization ID (null for system-wide defaults) */
  organization_id?: string
  /** Fields in this layout */
  fields: PreviewLayoutField[]
  /** Created timestamp */
  created_at: string
  /** Updated timestamp */
  updated_at: string
}

/**
 * Simplified layout for listing
 */
export interface PreviewLayoutSummary {
  layout_id: string
  context: PreviewContext
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  is_default: boolean
  layout_config: PreviewLayoutConfig
  field_count: number
  created_at: string
  updated_at: string
}

// =============================================================================
// USER PREFERENCES
// =============================================================================

/**
 * User-specific preview preferences
 */
export interface UserPreviewPreference {
  id: string
  user_id: string
  entity_type: PreviewEntityType
  context: PreviewContext
  custom_layout_id?: string
  /** Field visibility overrides: { field_key: boolean } */
  field_visibility: Record<string, boolean>
  /** Field order overrides: { field_key: sort_order } */
  field_order: Record<string, number>
  created_at: string
  updated_at: string
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Response from get_preview_layout RPC
 */
export interface GetPreviewLayoutResponse {
  layout_id: string
  name_en: string
  name_ar: string
  layout_config: PreviewLayoutConfig
  fields: PreviewLayoutField[]
}

/**
 * Response from get_entity_layouts RPC
 */
export interface GetEntityLayoutsResponse {
  layout_id: string
  context: PreviewContext
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  is_default: boolean
  layout_config: PreviewLayoutConfig
  field_count: number
  created_at: string
  updated_at: string
}

// =============================================================================
// FORM TYPES (for admin UI)
// =============================================================================

/**
 * Form values for creating/editing a layout
 */
export interface PreviewLayoutFormValues {
  entity_type: PreviewEntityType
  context: PreviewContext
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  is_default: boolean
  layout_config: PreviewLayoutConfig
}

/**
 * Form values for creating/editing a field
 */
export interface PreviewLayoutFieldFormValues {
  field_key: string
  field_type: PreviewFieldType
  label_en: string
  label_ar: string
  source_config: FieldSourceConfig
  display_config: FieldDisplayConfig
  visibility_rules?: FieldVisibilityRules
  sort_order: number
  is_visible: boolean
  is_required: boolean
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const PREVIEW_ENTITY_TYPES: PreviewEntityType[] = [
  'dossier',
  'organization',
  'country',
  'forum',
  'position',
  'mou',
  'engagement',
  'commitment',
  'assignment',
  'intelligence_signal',
  'working_group',
  'topic',
]

export const PREVIEW_CONTEXTS: PreviewContext[] = [
  'hover',
  'search_result',
  'embedded',
  'compact',
  'expanded',
]

export const PREVIEW_FIELD_TYPES: PreviewFieldType[] = [
  'text',
  'date',
  'status',
  'badge',
  'tags',
  'avatar',
  'relationship',
  'activity',
  'metric',
  'priority',
  'custom',
]

/**
 * Default layout configuration
 */
export const DEFAULT_LAYOUT_CONFIG: PreviewLayoutConfig = {
  showAvatar: true,
  showStatus: true,
  showEntityType: true,
  showLastUpdated: true,
  maxKeyDetails: 3,
  maxTags: 3,
  showRecentActivity: true,
  showMatchScore: false,
}

/**
 * Entity type labels (bilingual)
 */
export const ENTITY_TYPE_LABELS: Record<PreviewEntityType, { en: string; ar: string }> = {
  dossier: { en: 'Dossier', ar: 'ملف' },
  organization: { en: 'Organization', ar: 'منظمة' },
  country: { en: 'Country', ar: 'دولة' },
  forum: { en: 'Forum', ar: 'منتدى' },
  position: { en: 'Position', ar: 'منصب' },
  mou: { en: 'MOU', ar: 'مذكرة تفاهم' },
  engagement: { en: 'Engagement', ar: 'مشاركة' },
  commitment: { en: 'Commitment', ar: 'التزام' },
  assignment: { en: 'Assignment', ar: 'مهمة' },
  intelligence_signal: { en: 'Signal', ar: 'إشارة' },
  working_group: { en: 'Working Group', ar: 'مجموعة عمل' },
  topic: { en: 'Topic', ar: 'موضوع' },
}

/**
 * Context labels (bilingual)
 */
export const CONTEXT_LABELS: Record<PreviewContext, { en: string; ar: string }> = {
  hover: { en: 'Hover Preview', ar: 'معاينة التحويم' },
  search_result: { en: 'Search Result', ar: 'نتيجة البحث' },
  embedded: { en: 'Embedded', ar: 'مضمن' },
  compact: { en: 'Compact', ar: 'مضغوط' },
  expanded: { en: 'Expanded', ar: 'موسع' },
}

/**
 * Field type labels (bilingual)
 */
export const FIELD_TYPE_LABELS: Record<PreviewFieldType, { en: string; ar: string }> = {
  text: { en: 'Text', ar: 'نص' },
  date: { en: 'Date', ar: 'تاريخ' },
  status: { en: 'Status', ar: 'الحالة' },
  badge: { en: 'Badge', ar: 'شارة' },
  tags: { en: 'Tags', ar: 'وسوم' },
  avatar: { en: 'Avatar', ar: 'صورة' },
  relationship: { en: 'Relationship', ar: 'علاقة' },
  activity: { en: 'Activity', ar: 'نشاط' },
  metric: { en: 'Metric', ar: 'مقياس' },
  priority: { en: 'Priority', ar: 'أولوية' },
  custom: { en: 'Custom', ar: 'مخصص' },
}
