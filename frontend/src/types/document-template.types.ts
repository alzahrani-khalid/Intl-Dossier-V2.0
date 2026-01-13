/**
 * Document Templates Types
 * Pre-built templates for common document types with guided wizards
 */

// Template category enum
export type DocumentTemplateCategory =
  | 'country_profile'
  | 'policy_brief'
  | 'engagement_report'
  | 'meeting_notes'
  | 'position_paper'
  | 'mou_summary'
  | 'strategic_analysis'
  | 'custom'

// Template field types
export type TemplateFieldType =
  | 'text'
  | 'textarea'
  | 'rich_text'
  | 'date'
  | 'date_range'
  | 'select'
  | 'multiselect'
  | 'entity_reference'
  | 'file_attachment'
  | 'number'
  | 'currency'
  | 'percentage'
  | 'boolean'
  | 'tags'
  | 'url'

// Template status
export type DocumentTemplateStatus = 'draft' | 'published' | 'archived'

// Document classification (reusing from existing types)
export type DocumentClassification = 'public' | 'internal' | 'confidential' | 'secret'

// Output format
export type DocumentOutputFormat = 'docx' | 'pdf' | 'html' | 'markdown'

// Select option type
export interface SelectOption {
  value: string
  label_en: string
  label_ar: string
}

// Field options configuration
export interface FieldOptions {
  options: SelectOption[]
}

// Entity reference configuration
export interface EntityReferenceConfig {
  entity_type: string
  multiple: boolean
  max_selections?: number
  filter?: Record<string, unknown>
}

// Validation rules
export interface ValidationRules {
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  custom?: string
}

// Display condition for conditional fields
export interface DisplayCondition {
  field_key: string
  operator: 'equals' | 'not_equals' | 'contains' | 'not_empty' | 'empty'
  value?: string | number | boolean
}

// Template field
export interface DocumentTemplateField {
  id: string
  section_id: string
  field_key: string
  label_en: string
  label_ar: string
  placeholder_en?: string
  placeholder_ar?: string
  help_text_en?: string
  help_text_ar?: string
  field_type: TemplateFieldType
  is_required: boolean
  field_order: number
  validation_rules?: ValidationRules
  default_value?: unknown
  options?: FieldOptions
  entity_reference_config?: EntityReferenceConfig
  display_condition?: DisplayCondition
  grid_width: number // 1-12 columns
  created_at: string
}

// Template section (wizard step)
export interface DocumentTemplateSection {
  id: string
  template_id: string
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  section_order: number
  is_optional: boolean
  icon?: string
  display_condition?: DisplayCondition
  created_at: string
  fields?: DocumentTemplateField[]
}

// Document template
export interface DocumentTemplate {
  id: string
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  category: DocumentTemplateCategory
  icon: string
  color: string
  target_entity_types: string[]
  status: DocumentTemplateStatus
  is_system_template: boolean
  version: number
  default_classification: DocumentClassification
  output_format: DocumentOutputFormat
  created_by?: string
  created_at: string
  updated_at: string
}

// Full template with sections and fields
export interface DocumentTemplateWithSections extends DocumentTemplate {
  sections: (DocumentTemplateSection & { fields: DocumentTemplateField[] })[]
}

// Entity suggestion for templates
export interface DocumentTemplateEntitySuggestion {
  id: string
  template_id: string
  entity_type: string
  relationship_type?: string
  suggestion_label_en: string
  suggestion_label_ar: string
  suggestion_query: Record<string, unknown>
  max_suggestions: number
  created_at: string
}

// Templated document (user-created document from template)
export interface TemplatedDocument {
  id: string
  template_id: string
  entity_type: string
  entity_id: string
  title_en: string
  title_ar: string
  field_values: Record<string, unknown>
  current_section_order: number
  is_complete: boolean
  completed_at?: string
  generated_document_id?: string
  generated_file_path?: string
  classification: DocumentClassification
  created_by: string
  created_at: string
  updated_at: string
}

// Validation error
export interface TemplateValidationError {
  field_key: string
  error: 'required' | 'invalid' | 'min' | 'max' | 'pattern'
  label_en: string
  label_ar: string
}

// Validation result
export interface TemplateValidationResult {
  valid: boolean
  errors: TemplateValidationError[]
}

// API Request types

export interface ListTemplatesRequest {
  category?: DocumentTemplateCategory
  entity_type?: string
  status?: DocumentTemplateStatus
  include_system?: boolean
  limit?: number
  offset?: number
}

export interface CreateTemplatedDocumentRequest {
  template_id: string
  entity_type: string
  entity_id: string
  title_en: string
  title_ar: string
  classification?: DocumentClassification
}

export interface UpdateTemplatedDocumentRequest {
  id: string
  field_values?: Record<string, unknown>
  current_section_order?: number
  title_en?: string
  title_ar?: string
  classification?: DocumentClassification
}

export interface CompleteTemplatedDocumentRequest {
  id: string
  generate_document?: boolean
  output_format?: DocumentOutputFormat
}

// API Response types

export interface ListTemplatesResponse {
  templates: DocumentTemplate[]
  total: number
  limit: number
  offset: number
}

export interface GetTemplateResponse {
  template: DocumentTemplate
  sections: (DocumentTemplateSection & { fields: DocumentTemplateField[] })[]
}

export interface CreateTemplatedDocumentResponse {
  document: TemplatedDocument
  template: DocumentTemplateWithSections
}

export interface UpdateTemplatedDocumentResponse {
  document: TemplatedDocument
  validation: TemplateValidationResult
}

export interface CompleteTemplatedDocumentResponse {
  document: TemplatedDocument
  generated_document_id?: string
  generated_file_path?: string
}

// Wizard state types

export interface WizardState {
  template: DocumentTemplateWithSections
  document: TemplatedDocument
  currentSectionIndex: number
  fieldValues: Record<string, unknown>
  validationErrors: TemplateValidationError[]
  isSubmitting: boolean
  isDirty: boolean
}

export interface WizardStepProps {
  section: DocumentTemplateSection & { fields: DocumentTemplateField[] }
  fieldValues: Record<string, unknown>
  validationErrors: TemplateValidationError[]
  onFieldChange: (fieldKey: string, value: unknown) => void
  isRTL: boolean
}

// Template card display props
export interface TemplateCardProps {
  template: DocumentTemplate
  onSelect: (template: DocumentTemplate) => void
  isSelected?: boolean
  disabled?: boolean
}

// Category display configuration
export interface CategoryConfig {
  key: DocumentTemplateCategory
  icon: string
  color: string
  label_en: string
  label_ar: string
}

export const TEMPLATE_CATEGORIES: CategoryConfig[] = [
  {
    key: 'country_profile',
    icon: 'globe',
    color: 'blue',
    label_en: 'Country Profile',
    label_ar: 'ملف تعريف الدولة',
  },
  {
    key: 'policy_brief',
    icon: 'file-text',
    color: 'purple',
    label_en: 'Policy Brief',
    label_ar: 'موجز السياسات',
  },
  {
    key: 'engagement_report',
    icon: 'users',
    color: 'green',
    label_en: 'Engagement Report',
    label_ar: 'تقرير التفاعل',
  },
  {
    key: 'meeting_notes',
    icon: 'clipboard',
    color: 'orange',
    label_en: 'Meeting Notes',
    label_ar: 'ملاحظات الاجتماع',
  },
  {
    key: 'position_paper',
    icon: 'book-open',
    color: 'indigo',
    label_en: 'Position Paper',
    label_ar: 'ورقة موقف',
  },
  {
    key: 'mou_summary',
    icon: 'file-signature',
    color: 'teal',
    label_en: 'MOU Summary',
    label_ar: 'ملخص مذكرة التفاهم',
  },
  {
    key: 'strategic_analysis',
    icon: 'target',
    color: 'red',
    label_en: 'Strategic Analysis',
    label_ar: 'تحليل استراتيجي',
  },
  {
    key: 'custom',
    icon: 'plus',
    color: 'gray',
    label_en: 'Custom Template',
    label_ar: 'قالب مخصص',
  },
]

// Field type display configuration
export interface FieldTypeConfig {
  key: TemplateFieldType
  icon: string
  label_en: string
  label_ar: string
}

export const TEMPLATE_FIELD_TYPES: FieldTypeConfig[] = [
  { key: 'text', icon: 'type', label_en: 'Text', label_ar: 'نص' },
  { key: 'textarea', icon: 'align-left', label_en: 'Text Area', label_ar: 'منطقة نص' },
  { key: 'rich_text', icon: 'edit-3', label_en: 'Rich Text', label_ar: 'نص منسق' },
  { key: 'date', icon: 'calendar', label_en: 'Date', label_ar: 'تاريخ' },
  { key: 'date_range', icon: 'calendar-range', label_en: 'Date Range', label_ar: 'نطاق تاريخ' },
  { key: 'select', icon: 'list', label_en: 'Dropdown', label_ar: 'قائمة منسدلة' },
  { key: 'multiselect', icon: 'check-square', label_en: 'Multi-Select', label_ar: 'اختيار متعدد' },
  { key: 'entity_reference', icon: 'link', label_en: 'Entity Reference', label_ar: 'مرجع كيان' },
  { key: 'file_attachment', icon: 'paperclip', label_en: 'File Attachment', label_ar: 'مرفق ملف' },
  { key: 'number', icon: 'hash', label_en: 'Number', label_ar: 'رقم' },
  { key: 'currency', icon: 'dollar-sign', label_en: 'Currency', label_ar: 'عملة' },
  { key: 'percentage', icon: 'percent', label_en: 'Percentage', label_ar: 'نسبة مئوية' },
  { key: 'boolean', icon: 'toggle-left', label_en: 'Yes/No', label_ar: 'نعم/لا' },
  { key: 'tags', icon: 'tag', label_en: 'Tags', label_ar: 'وسوم' },
  { key: 'url', icon: 'external-link', label_en: 'URL', label_ar: 'رابط' },
]
