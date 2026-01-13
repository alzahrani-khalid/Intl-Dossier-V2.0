/**
 * Advanced Search Types
 * Feature: advanced-search-filters
 * Description: Type definitions for complex multi-criteria search
 */

// Filter operators for conditions
export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_equal'
  | 'less_equal'
  | 'between'
  | 'not_between'
  | 'in'
  | 'not_in'
  | 'is_null'
  | 'is_not_null'
  | 'matches_regex'

// Boolean logic operators
export type LogicOperator = 'AND' | 'OR'

// Entity types that can be searched
export type SearchableEntityType =
  | 'dossier'
  | 'engagement'
  | 'position'
  | 'document'
  | 'person'
  | 'organization'
  | 'forum'
  | 'country'
  | 'theme'

// Relationship types for cross-entity queries
export type RelationshipType =
  | 'parent_of'
  | 'child_of'
  | 'linked_to'
  | 'related_to'
  | 'member_of'
  | 'has_member'
  | 'assigned_to'
  | 'owned_by'
  | 'created_by'
  | 'updated_by'
  | 'mentions'
  | 'mentioned_by'

// Date presets for quick filtering
export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'this_month'
  | 'this_year'
  | 'next_7_days'
  | 'next_30_days'

// Sort options
export type SortBy = 'relevance' | 'date' | 'title'
export type SortOrder = 'asc' | 'desc'

// Template categories
export type TemplateCategory = 'quick' | 'recent' | 'popular' | 'custom' | 'system'

// Template colors
export type TemplateColor =
  | 'blue'
  | 'green'
  | 'red'
  | 'purple'
  | 'orange'
  | 'yellow'
  | 'gray'
  | 'pink'
  | 'indigo'
  | 'teal'

// Individual filter condition
export interface FilterCondition {
  id?: string
  field_name: string
  operator: FilterOperator
  value: unknown
  is_negated?: boolean
}

// Group of conditions with boolean logic
export interface FilterGroup {
  id?: string
  operator: LogicOperator
  conditions: FilterCondition[]
}

// Relationship-based query
export interface RelationshipQuery {
  id?: string
  source_entity_type: SearchableEntityType
  target_entity_type: SearchableEntityType
  relationship_type: RelationshipType
  target_conditions?: FilterCondition[]
  include_depth?: number
}

// Date range filter
export interface DateRange {
  from?: string | null
  to?: string | null
  preset?: DatePreset | null
}

// Advanced search request payload
export interface AdvancedSearchRequest {
  query?: string
  entity_types: SearchableEntityType[]
  conditions?: FilterCondition[]
  condition_groups?: FilterGroup[]
  relationships?: RelationshipQuery[]
  date_range?: DateRange
  status?: string[]
  tags?: string[]
  sensitivity_levels?: string[]
  filter_logic?: LogicOperator
  include_archived?: boolean
  sort_by?: SortBy
  sort_order?: SortOrder
  limit?: number
  offset?: number
  saved_filter_id?: string
}

// Search result item
export interface SearchResult {
  entity_id: string
  entity_type: SearchableEntityType
  title_en: string
  title_ar: string
  snippet_en: string
  snippet_ar: string
  rank_score: number
  status: string
  created_at: string
  updated_at: string
  metadata: Record<string, unknown>
  matched_conditions?: string[]
}

// Search response
export interface AdvancedSearchResponse {
  data: SearchResult[]
  count: number
  limit: number
  offset: number
  query: {
    original: string
    entity_types: SearchableEntityType[]
    filter_logic: LogicOperator
    conditions_count: number
    date_range: DateRange | null
  }
  took_ms: number
  warnings: string[]
  metadata: {
    has_more: boolean
    next_offset: number | null
    saved_filter_id: string | null
  }
}

// Search template definition
export interface TemplateDefinition {
  entity_types?: SearchableEntityType[]
  query?: string
  conditions?: FilterCondition[]
  condition_groups?: FilterGroup[]
  relationships?: RelationshipQuery[]
  date_range?: DateRange
  status?: string[]
  tags?: string[]
  filter_logic?: LogicOperator
  include_archived?: boolean
  sort_by?: SortBy
  sort_order?: SortOrder
  show_recent?: boolean
  limit?: number
}

// Search template
export interface SearchTemplate {
  id: string
  name_en: string
  name_ar: string
  description_en: string | null
  description_ar: string | null
  icon: string
  color: TemplateColor
  category: TemplateCategory
  template_definition: TemplateDefinition
  is_system: boolean
  is_public: boolean
  created_by: string | null
  use_count: number
  created_at: string
  updated_at: string
}

// Template list response
export interface TemplateListResponse {
  data: SearchTemplate[]
  count: number
  limit: number
  offset: number
  metadata: {
    has_more: boolean
    next_offset: number | null
  }
}

// Create template request
export interface CreateTemplateRequest {
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  icon?: string
  color?: TemplateColor
  category?: TemplateCategory
  template_definition: TemplateDefinition
  is_public?: boolean
}

// Update template request
export interface UpdateTemplateRequest {
  name_en?: string
  name_ar?: string
  description_en?: string
  description_ar?: string
  icon?: string
  color?: TemplateColor
  category?: TemplateCategory
  template_definition?: TemplateDefinition
  is_public?: boolean
}

// Saved filter (from database)
export interface SavedFilter {
  id: string
  user_id: string
  name: string
  description?: string
  search_entities: SearchableEntityType[]
  full_text_query?: string
  date_range?: DateRange
  status_filter: string[]
  priority_filter: string[]
  custom_tags: string[]
  filter_logic: LogicOperator
  page_size: number
  timeout_behavior: 'partial' | 'fail' | 'cached'
  max_timeout_ms: number
  is_default: boolean
  is_shared: boolean
  shared_with: string[]
  use_count: number
  last_used_at: string | null
  created_at: string
  updated_at: string
}

// Filter condition with database fields
export interface SearchFilterCondition {
  id: string
  filter_id: string
  group_operator: LogicOperator
  group_order: number
  field_name: string
  operator: FilterOperator
  field_value: unknown
  is_negated: boolean
  condition_order: number
  created_at: string
}

// Relationship filter with database fields
export interface SearchFilterRelationship {
  id: string
  filter_id: string
  source_entity_type: SearchableEntityType
  target_entity_type: SearchableEntityType
  relationship_type: RelationshipType
  target_entity_conditions: Record<string, unknown>
  include_depth: number
  created_at: string
}

// Field metadata for UI rendering
export interface SearchableField {
  name: string
  label_en: string
  label_ar: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multi-select'
  entity_types: SearchableEntityType[]
  operators: FilterOperator[]
  options?: { value: string; label_en: string; label_ar: string }[]
}

// Searchable fields configuration
export const SEARCHABLE_FIELDS: SearchableField[] = [
  {
    name: 'title_en',
    label_en: 'Title (English)',
    label_ar: 'العنوان (إنجليزي)',
    type: 'text',
    entity_types: ['dossier', 'engagement', 'position', 'document'],
    operators: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with'],
  },
  {
    name: 'title_ar',
    label_en: 'Title (Arabic)',
    label_ar: 'العنوان (عربي)',
    type: 'text',
    entity_types: ['dossier', 'engagement', 'position', 'document'],
    operators: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with'],
  },
  {
    name: 'status',
    label_en: 'Status',
    label_ar: 'الحالة',
    type: 'select',
    entity_types: ['dossier', 'engagement', 'position'],
    operators: ['equals', 'not_equals', 'in', 'not_in'],
    options: [
      { value: 'active', label_en: 'Active', label_ar: 'نشط' },
      { value: 'inactive', label_en: 'Inactive', label_ar: 'غير نشط' },
      { value: 'archived', label_en: 'Archived', label_ar: 'مؤرشف' },
      { value: 'draft', label_en: 'Draft', label_ar: 'مسودة' },
      { value: 'published', label_en: 'Published', label_ar: 'منشور' },
    ],
  },
  {
    name: 'type',
    label_en: 'Dossier Type',
    label_ar: 'نوع الملف',
    type: 'select',
    entity_types: ['dossier'],
    operators: ['equals', 'not_equals', 'in', 'not_in'],
    options: [
      { value: 'country', label_en: 'Country', label_ar: 'دولة' },
      { value: 'organization', label_en: 'Organization', label_ar: 'منظمة' },
      { value: 'forum', label_en: 'Forum', label_ar: 'منتدى' },
      { value: 'engagement', label_en: 'Engagement', label_ar: 'مشاركة' },
      { value: 'theme', label_en: 'Theme', label_ar: 'موضوع' },
    ],
  },
  {
    name: 'sensitivity_level',
    label_en: 'Sensitivity Level',
    label_ar: 'مستوى الحساسية',
    type: 'select',
    entity_types: ['dossier', 'document'],
    operators: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal'],
    options: [
      { value: 'low', label_en: 'Low', label_ar: 'منخفض' },
      { value: 'medium', label_en: 'Medium', label_ar: 'متوسط' },
      { value: 'high', label_en: 'High', label_ar: 'عالي' },
    ],
  },
  {
    name: 'tags',
    label_en: 'Tags',
    label_ar: 'الوسوم',
    type: 'multi-select',
    entity_types: ['dossier'],
    operators: ['contains', 'not_contains'],
  },
  {
    name: 'created_at',
    label_en: 'Created Date',
    label_ar: 'تاريخ الإنشاء',
    type: 'date',
    entity_types: ['dossier', 'engagement', 'position', 'document', 'person'],
    operators: [
      'equals',
      'not_equals',
      'greater_than',
      'less_than',
      'greater_equal',
      'less_equal',
      'between',
    ],
  },
  {
    name: 'updated_at',
    label_en: 'Updated Date',
    label_ar: 'تاريخ التحديث',
    type: 'date',
    entity_types: ['dossier', 'engagement', 'position', 'document', 'person'],
    operators: [
      'equals',
      'not_equals',
      'greater_than',
      'less_than',
      'greater_equal',
      'less_equal',
      'between',
    ],
  },
  {
    name: 'start_date',
    label_en: 'Start Date',
    label_ar: 'تاريخ البدء',
    type: 'date',
    entity_types: ['engagement'],
    operators: [
      'equals',
      'not_equals',
      'greater_than',
      'less_than',
      'greater_equal',
      'less_equal',
      'between',
    ],
  },
  {
    name: 'end_date',
    label_en: 'End Date',
    label_ar: 'تاريخ الانتهاء',
    type: 'date',
    entity_types: ['engagement'],
    operators: [
      'equals',
      'not_equals',
      'greater_than',
      'less_than',
      'greater_equal',
      'less_equal',
      'between',
    ],
  },
  {
    name: 'location',
    label_en: 'Location',
    label_ar: 'الموقع',
    type: 'text',
    entity_types: ['engagement'],
    operators: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with'],
  },
  {
    name: 'file_type',
    label_en: 'File Type',
    label_ar: 'نوع الملف',
    type: 'select',
    entity_types: ['document'],
    operators: ['equals', 'not_equals', 'in', 'not_in'],
    options: [
      { value: 'pdf', label_en: 'PDF', label_ar: 'PDF' },
      { value: 'doc', label_en: 'Word Document', label_ar: 'مستند وورد' },
      { value: 'docx', label_en: 'Word Document', label_ar: 'مستند وورد' },
      { value: 'xls', label_en: 'Excel Spreadsheet', label_ar: 'جدول إكسل' },
      { value: 'xlsx', label_en: 'Excel Spreadsheet', label_ar: 'جدول إكسل' },
      { value: 'ppt', label_en: 'PowerPoint', label_ar: 'باوربوينت' },
      { value: 'pptx', label_en: 'PowerPoint', label_ar: 'باوربوينت' },
      { value: 'txt', label_en: 'Text File', label_ar: 'ملف نصي' },
      { value: 'csv', label_en: 'CSV', label_ar: 'CSV' },
    ],
  },
  {
    name: 'file_size',
    label_en: 'File Size (bytes)',
    label_ar: 'حجم الملف (بايت)',
    type: 'number',
    entity_types: ['document'],
    operators: [
      'equals',
      'not_equals',
      'greater_than',
      'less_than',
      'greater_equal',
      'less_equal',
      'between',
    ],
  },
  {
    name: 'email',
    label_en: 'Email',
    label_ar: 'البريد الإلكتروني',
    type: 'text',
    entity_types: ['person'],
    operators: ['equals', 'not_equals', 'contains', 'not_contains', 'ends_with'],
  },
  {
    name: 'department',
    label_en: 'Department',
    label_ar: 'القسم',
    type: 'text',
    entity_types: ['person'],
    operators: ['equals', 'not_equals', 'contains', 'not_contains'],
  },
]

// Helper function to get fields for specific entity types
export function getFieldsForEntityTypes(entityTypes: SearchableEntityType[]): SearchableField[] {
  return SEARCHABLE_FIELDS.filter((field) =>
    field.entity_types.some((type) => entityTypes.includes(type)),
  )
}

// Helper function to get operators for a field type
export function getOperatorsForFieldType(
  fieldType: SearchableField['type'],
): { value: FilterOperator; label_en: string; label_ar: string }[] {
  const operatorLabels: Record<FilterOperator, { label_en: string; label_ar: string }> = {
    equals: { label_en: 'Equals', label_ar: 'يساوي' },
    not_equals: { label_en: 'Not Equals', label_ar: 'لا يساوي' },
    contains: { label_en: 'Contains', label_ar: 'يحتوي على' },
    not_contains: { label_en: 'Does Not Contain', label_ar: 'لا يحتوي على' },
    starts_with: { label_en: 'Starts With', label_ar: 'يبدأ بـ' },
    ends_with: { label_en: 'Ends With', label_ar: 'ينتهي بـ' },
    greater_than: { label_en: 'Greater Than', label_ar: 'أكبر من' },
    less_than: { label_en: 'Less Than', label_ar: 'أصغر من' },
    greater_equal: { label_en: 'Greater or Equal', label_ar: 'أكبر أو يساوي' },
    less_equal: { label_en: 'Less or Equal', label_ar: 'أصغر أو يساوي' },
    between: { label_en: 'Between', label_ar: 'بين' },
    not_between: { label_en: 'Not Between', label_ar: 'ليس بين' },
    in: { label_en: 'In List', label_ar: 'في القائمة' },
    not_in: { label_en: 'Not In List', label_ar: 'ليس في القائمة' },
    is_null: { label_en: 'Is Empty', label_ar: 'فارغ' },
    is_not_null: { label_en: 'Is Not Empty', label_ar: 'غير فارغ' },
    matches_regex: { label_en: 'Matches Pattern', label_ar: 'يطابق النمط' },
  }

  const typeOperators: Record<SearchableField['type'], FilterOperator[]> = {
    text: [
      'equals',
      'not_equals',
      'contains',
      'not_contains',
      'starts_with',
      'ends_with',
      'is_null',
      'is_not_null',
    ],
    number: [
      'equals',
      'not_equals',
      'greater_than',
      'less_than',
      'greater_equal',
      'less_equal',
      'between',
      'is_null',
      'is_not_null',
    ],
    date: [
      'equals',
      'not_equals',
      'greater_than',
      'less_than',
      'greater_equal',
      'less_equal',
      'between',
      'is_null',
      'is_not_null',
    ],
    boolean: ['equals', 'not_equals'],
    select: ['equals', 'not_equals', 'in', 'not_in', 'is_null', 'is_not_null'],
    'multi-select': ['contains', 'not_contains', 'is_null', 'is_not_null'],
  }

  return typeOperators[fieldType].map((op) => ({
    value: op,
    ...operatorLabels[op],
  }))
}

// Date preset labels
export const DATE_PRESET_LABELS: Record<DatePreset, { label_en: string; label_ar: string }> = {
  today: { label_en: 'Today', label_ar: 'اليوم' },
  yesterday: { label_en: 'Yesterday', label_ar: 'أمس' },
  last_7_days: { label_en: 'Last 7 Days', label_ar: 'آخر 7 أيام' },
  last_30_days: { label_en: 'Last 30 Days', label_ar: 'آخر 30 يوماً' },
  last_90_days: { label_en: 'Last 90 Days', label_ar: 'آخر 90 يوماً' },
  this_month: { label_en: 'This Month', label_ar: 'هذا الشهر' },
  this_year: { label_en: 'This Year', label_ar: 'هذه السنة' },
  next_7_days: { label_en: 'Next 7 Days', label_ar: 'الأيام السبعة القادمة' },
  next_30_days: { label_en: 'Next 30 Days', label_ar: 'الثلاثون يوماً القادمة' },
}

// Entity type labels
export const ENTITY_TYPE_LABELS: Record<
  SearchableEntityType,
  { label_en: string; label_ar: string; icon: string }
> = {
  dossier: { label_en: 'Dossier', label_ar: 'ملف', icon: 'folder' },
  engagement: { label_en: 'Engagement', label_ar: 'مشاركة', icon: 'calendar' },
  position: { label_en: 'Position', label_ar: 'موقف', icon: 'file-text' },
  document: { label_en: 'Document', label_ar: 'مستند', icon: 'file' },
  person: { label_en: 'Person', label_ar: 'شخص', icon: 'user' },
  organization: { label_en: 'Organization', label_ar: 'منظمة', icon: 'building' },
  forum: { label_en: 'Forum', label_ar: 'منتدى', icon: 'users' },
  country: { label_en: 'Country', label_ar: 'دولة', icon: 'globe' },
  theme: { label_en: 'Theme', label_ar: 'موضوع', icon: 'tag' },
}
