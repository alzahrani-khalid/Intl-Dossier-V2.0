/**
 * Field Permission Types
 * Granular field-level permissions for controlling visibility and editability
 */

// Entity types that support field-level permissions
export type FieldPermissionEntityType =
  | 'country'
  | 'organization'
  | 'mou'
  | 'event'
  | 'forum'
  | 'brief'
  | 'intelligence_report'
  | 'data_library_item'
  | 'dossier'
  | 'person'
  | 'engagement'
  | 'commitment'
  | 'position'
  | 'task'
  | 'intake_ticket'
  | 'working_group'
  | 'theme'

// Permission scope types
export type FieldPermissionScope = 'role' | 'user' | 'team'

// Field categories
export type FieldCategory = 'base' | 'extension' | 'metadata' | 'relationship' | 'sensitive'

// Field data types
export type FieldDataType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'json'
  | 'array'
  | 'uuid'
  | 'enum'

// Sensitivity levels
export type FieldSensitivityLevel = 'low' | 'medium' | 'high' | 'critical'

/**
 * Field Definition - metadata about a field
 */
export interface FieldDefinition {
  id: string
  entity_type: FieldPermissionEntityType
  field_name: string
  field_label_en: string
  field_label_ar: string
  field_description_en?: string | null
  field_description_ar?: string | null
  field_category: FieldCategory
  data_type: FieldDataType
  is_sensitive: boolean
  sensitivity_level: FieldSensitivityLevel
  display_order: number
  is_system_field: boolean
  is_readonly: boolean
  default_visible: boolean
  default_editable: boolean
  created_at: string
  updated_at: string
}

/**
 * Field Permission - granular permission rule
 */
export interface FieldPermission {
  id: string
  scope_type: FieldPermissionScope
  scope_value: string
  entity_type: FieldPermissionEntityType
  entity_id?: string | null
  field_name: string
  can_view: boolean
  can_edit: boolean
  conditions: Record<string, unknown>
  priority: number
  inherits_from_parent: boolean
  parent_entity_type?: FieldPermissionEntityType | null
  parent_entity_id?: string | null
  inheritance_depth: number
  description_en?: string | null
  description_ar?: string | null
  is_active: boolean
  expires_at?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
}

/**
 * Resolved field permission for a user
 */
export interface ResolvedFieldPermission {
  field_name: string
  field_label_en: string
  field_label_ar: string
  field_category: FieldCategory
  can_view: boolean
  can_edit: boolean
  is_sensitive: boolean
  sensitivity_level: FieldSensitivityLevel
}

/**
 * Bulk permission check result
 */
export interface BulkPermissionCheck {
  field_name: string
  can_view: boolean
  can_edit: boolean
}

/**
 * Permission audit log entry
 */
export interface FieldPermissionAudit {
  id: string
  permission_id?: string | null
  action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate' | 'expire'
  old_values?: Record<string, unknown> | null
  new_values?: Record<string, unknown> | null
  reason?: string | null
  performed_by: string
  performed_by_email?: string | null
  performed_by_role?: string | null
  ip_address?: string | null
  user_agent?: string | null
  session_id?: string | null
  created_at: string
}

// Request/Response types

export interface CreateFieldPermissionRequest {
  scope_type: FieldPermissionScope
  scope_value: string
  entity_type: FieldPermissionEntityType
  entity_id?: string
  field_name: string
  can_view?: boolean
  can_edit?: boolean
  conditions?: Record<string, unknown>
  priority?: number
  inherits_from_parent?: boolean
  parent_entity_type?: FieldPermissionEntityType
  parent_entity_id?: string
  inheritance_depth?: number
  description_en?: string
  description_ar?: string
  expires_at?: string
}

export interface UpdateFieldPermissionRequest {
  can_view?: boolean
  can_edit?: boolean
  conditions?: Record<string, unknown>
  priority?: number
  description_en?: string
  description_ar?: string
  is_active?: boolean
  expires_at?: string | null
}

export interface CheckPermissionsRequest {
  entity_type: FieldPermissionEntityType
  entity_id?: string
  field_names?: string[]
}

export interface ListFieldPermissionsParams {
  entity_type?: FieldPermissionEntityType
  scope_type?: FieldPermissionScope
  scope_value?: string
  active_only?: boolean
}

export interface ListFieldDefinitionsParams {
  entity_type?: FieldPermissionEntityType
}

export interface GetAuditLogsParams {
  permission_id?: string
  limit?: number
  offset?: number
}

// Response types

export interface FieldPermissionsResponse {
  data: FieldPermission[]
}

export interface FieldDefinitionsResponse {
  data: FieldDefinition[]
}

export interface ResolvedPermissionsResponse {
  data: ResolvedFieldPermission[]
}

export interface BulkPermissionCheckResponse {
  data: BulkPermissionCheck[]
}

export interface AuditLogsResponse {
  data: FieldPermissionAudit[]
  pagination: {
    limit: number
    offset: number
    total?: number
  }
}

// UI-specific types

/**
 * Field with its resolved permissions for display
 */
export interface FieldWithPermission extends FieldDefinition {
  can_view: boolean
  can_edit: boolean
  permission_source?: 'default' | 'role' | 'user' | 'team' | 'inherited'
}

/**
 * Permission rule for admin management UI
 */
export interface PermissionRuleDisplay extends FieldPermission {
  scope_display: string
  entity_display?: string
  field_display: string
}

/**
 * Entity type configuration for UI
 */
export interface EntityTypeConfig {
  value: FieldPermissionEntityType
  label_en: string
  label_ar: string
  icon: string
}

/**
 * Scope type configuration for UI
 */
export interface ScopeTypeConfig {
  value: FieldPermissionScope
  label_en: string
  label_ar: string
  description_en: string
  description_ar: string
}

// Constants

export const ENTITY_TYPE_CONFIG: EntityTypeConfig[] = [
  { value: 'dossier', label_en: 'Dossier', label_ar: 'الملف', icon: 'FileText' },
  { value: 'country', label_en: 'Country', label_ar: 'الدولة', icon: 'Globe' },
  { value: 'organization', label_en: 'Organization', label_ar: 'المنظمة', icon: 'Building' },
  { value: 'person', label_en: 'Person', label_ar: 'الشخص', icon: 'User' },
  { value: 'engagement', label_en: 'Engagement', label_ar: 'المشاركة', icon: 'Calendar' },
  { value: 'commitment', label_en: 'Commitment', label_ar: 'الالتزام', icon: 'Target' },
  { value: 'mou', label_en: 'MoU', label_ar: 'مذكرة التفاهم', icon: 'FileSignature' },
  { value: 'position', label_en: 'Position', label_ar: 'الموقف', icon: 'MapPin' },
  { value: 'forum', label_en: 'Forum', label_ar: 'المنتدى', icon: 'Users' },
  { value: 'event', label_en: 'Event', label_ar: 'الفعالية', icon: 'CalendarDays' },
  { value: 'task', label_en: 'Task', label_ar: 'المهمة', icon: 'CheckSquare' },
  { value: 'intake_ticket', label_en: 'Intake Ticket', label_ar: 'تذكرة الاستلام', icon: 'Ticket' },
  {
    value: 'working_group',
    label_en: 'Working Group',
    label_ar: 'مجموعة العمل',
    icon: 'UsersRound',
  },
  { value: 'theme', label_en: 'Theme', label_ar: 'الموضوع', icon: 'Tag' },
  { value: 'brief', label_en: 'Brief', label_ar: 'الموجز', icon: 'FileText' },
  {
    value: 'intelligence_report',
    label_en: 'Intelligence Report',
    label_ar: 'تقرير استخباراتي',
    icon: 'Eye',
  },
  {
    value: 'data_library_item',
    label_en: 'Data Library Item',
    label_ar: 'عنصر مكتبة البيانات',
    icon: 'Database',
  },
]

export const SCOPE_TYPE_CONFIG: ScopeTypeConfig[] = [
  {
    value: 'role',
    label_en: 'Role',
    label_ar: 'الدور',
    description_en: 'Apply to all users with this role',
    description_ar: 'تطبيق على جميع المستخدمين بهذا الدور',
  },
  {
    value: 'user',
    label_en: 'User',
    label_ar: 'المستخدم',
    description_en: 'Apply to a specific user',
    description_ar: 'تطبيق على مستخدم محدد',
  },
  {
    value: 'team',
    label_en: 'Team',
    label_ar: 'الفريق',
    description_en: 'Apply to all team members',
    description_ar: 'تطبيق على جميع أعضاء الفريق',
  },
]

export const FIELD_CATEGORY_CONFIG: { value: FieldCategory; label_en: string; label_ar: string }[] =
  [
    { value: 'base', label_en: 'Base Fields', label_ar: 'الحقول الأساسية' },
    { value: 'extension', label_en: 'Extension Fields', label_ar: 'حقول الامتداد' },
    { value: 'metadata', label_en: 'Metadata', label_ar: 'البيانات الوصفية' },
    { value: 'relationship', label_en: 'Relationships', label_ar: 'العلاقات' },
    { value: 'sensitive', label_en: 'Sensitive', label_ar: 'حساس' },
  ]

export const SENSITIVITY_LEVEL_CONFIG: {
  value: FieldSensitivityLevel
  label_en: string
  label_ar: string
  color: string
}[] = [
  { value: 'low', label_en: 'Low', label_ar: 'منخفض', color: 'text-green-600' },
  { value: 'medium', label_en: 'Medium', label_ar: 'متوسط', color: 'text-yellow-600' },
  { value: 'high', label_en: 'High', label_ar: 'عالي', color: 'text-orange-600' },
  { value: 'critical', label_en: 'Critical', label_ar: 'حرج', color: 'text-red-600' },
]
