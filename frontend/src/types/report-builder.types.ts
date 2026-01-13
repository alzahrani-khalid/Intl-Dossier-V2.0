/**
 * Custom Report Builder Types
 *
 * Supports drag-and-drop report building with:
 * - Entity selection (dossiers, engagements, commitments, etc.)
 * - Filter configuration
 * - Grouping and aggregation
 * - Visualization options
 * - Saving, sharing, and scheduling
 */

// ============================================================================
// Entity Types - Data sources available for reports
// ============================================================================

export const REPORT_ENTITY_TYPES = [
  'dossiers',
  'engagements',
  'commitments',
  'work_items',
  'calendar_entries',
  'persons',
  'organizations',
  'forums',
  'documents',
  'relationships',
] as const

export type ReportEntityType = (typeof REPORT_ENTITY_TYPES)[number]

// ============================================================================
// Field Types - Available fields for each entity
// ============================================================================

export interface ReportField {
  id: string
  name: string
  nameAr: string
  type: FieldDataType
  entity: ReportEntityType
  aggregatable: boolean
  filterable: boolean
  groupable: boolean
  sortable: boolean
}

export const FIELD_DATA_TYPES = [
  'string',
  'number',
  'date',
  'datetime',
  'boolean',
  'enum',
  'uuid',
  'json',
] as const

export type FieldDataType = (typeof FIELD_DATA_TYPES)[number]

// ============================================================================
// Filter Types - Conditions for filtering data
// ============================================================================

export const FILTER_OPERATORS = [
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'starts_with',
  'ends_with',
  'greater_than',
  'less_than',
  'greater_than_or_equal',
  'less_than_or_equal',
  'between',
  'in',
  'not_in',
  'is_null',
  'is_not_null',
] as const

export type FilterOperator = (typeof FILTER_OPERATORS)[number]

export interface ReportFilter {
  id: string
  fieldId: string
  operator: FilterOperator
  value: unknown
  valueEnd?: unknown // For 'between' operator
}

export interface FilterGroup {
  id: string
  logic: 'and' | 'or'
  filters: ReportFilter[]
  groups: FilterGroup[]
}

// ============================================================================
// Grouping and Aggregation Types
// ============================================================================

export const AGGREGATION_FUNCTIONS = [
  'count',
  'count_distinct',
  'sum',
  'avg',
  'min',
  'max',
  'first',
  'last',
] as const

export type AggregationFunction = (typeof AGGREGATION_FUNCTIONS)[number]

export interface ReportGrouping {
  id: string
  fieldId: string
  label?: string
  labelAr?: string
}

export interface ReportAggregation {
  id: string
  fieldId: string
  function: AggregationFunction
  label?: string
  labelAr?: string
}

// ============================================================================
// Sorting Types
// ============================================================================

export interface ReportSort {
  id: string
  fieldId: string
  direction: 'asc' | 'desc'
}

// ============================================================================
// Visualization Types
// ============================================================================

export const VISUALIZATION_TYPES = [
  'table',
  'bar_chart',
  'line_chart',
  'pie_chart',
  'area_chart',
  'donut_chart',
  'scatter_plot',
  'heatmap',
  'card',
  'kpi',
] as const

export type VisualizationType = (typeof VISUALIZATION_TYPES)[number]

export interface VisualizationConfig {
  type: VisualizationType
  title?: string
  titleAr?: string
  xAxisFieldId?: string
  yAxisFieldId?: string
  colorFieldId?: string
  sizeFieldId?: string
  showLegend?: boolean
  showLabels?: boolean
  showGrid?: boolean
  colors?: string[]
  height?: number
}

// ============================================================================
// Report Configuration Types
// ============================================================================

export interface ReportColumn {
  id: string
  fieldId: string
  label?: string
  labelAr?: string
  width?: number
  visible: boolean
  order: number
}

export interface ReportConfiguration {
  entities: ReportEntityType[]
  columns: ReportColumn[]
  filters: FilterGroup
  groupings: ReportGrouping[]
  aggregations: ReportAggregation[]
  sorting: ReportSort[]
  visualization: VisualizationConfig
  limit?: number
  offset?: number
}

// ============================================================================
// Saved Report Types
// ============================================================================

export const REPORT_ACCESS_LEVELS = ['private', 'team', 'organization', 'public'] as const

export type ReportAccessLevel = (typeof REPORT_ACCESS_LEVELS)[number]

export interface SavedReport {
  id: string
  name: string
  nameAr?: string
  description?: string
  descriptionAr?: string
  configuration: ReportConfiguration
  accessLevel: ReportAccessLevel
  createdBy: string
  createdAt: string
  updatedAt: string
  sharedWith?: string[] // User IDs
  isFavorite?: boolean
  tags?: string[]
}

// ============================================================================
// Scheduled Report Types
// ============================================================================

export const SCHEDULE_FREQUENCIES = ['once', 'daily', 'weekly', 'monthly', 'quarterly'] as const

export type ScheduleFrequency = (typeof SCHEDULE_FREQUENCIES)[number]

export const EXPORT_FORMATS = ['pdf', 'excel', 'csv', 'json'] as const

export type ExportFormat = (typeof EXPORT_FORMATS)[number]

export interface ReportSchedule {
  id: string
  reportId: string
  name: string
  nameAr?: string
  frequency: ScheduleFrequency
  dayOfWeek?: number // 0-6 for weekly
  dayOfMonth?: number // 1-31 for monthly
  time: string // HH:mm format
  timezone: string
  exportFormat: ExportFormat
  recipients: string[] // Email addresses
  isActive: boolean
  nextRunAt?: string
  lastRunAt?: string
  lastRunStatus?: 'success' | 'failed' | 'pending'
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Report Execution Types
// ============================================================================

export interface ReportExecutionResult {
  id: string
  reportId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  data?: Record<string, unknown>[]
  rowCount?: number
  executionTimeMs?: number
  error?: string
  createdAt: string
  completedAt?: string
}

export interface ReportPreviewRequest {
  configuration: ReportConfiguration
  limit?: number
}

export interface ReportPreviewResponse {
  data: Record<string, unknown>[]
  columns: ReportField[]
  totalCount: number
  executionTimeMs: number
}

// ============================================================================
// Drag and Drop Types
// ============================================================================

export type DragItemType = 'field' | 'filter' | 'column' | 'grouping' | 'aggregation'

export interface DragItem {
  type: DragItemType
  id: string
  data: ReportField | ReportFilter | ReportColumn | ReportGrouping | ReportAggregation
}

export type DropZoneType = 'columns' | 'filters' | 'groupings' | 'aggregations' | 'trash'

export interface DropZone {
  type: DropZoneType
  accepts: DragItemType[]
}

// ============================================================================
// Builder State Types
// ============================================================================

export interface ReportBuilderState {
  // Configuration
  configuration: ReportConfiguration

  // UI State
  selectedEntity: ReportEntityType | null
  availableFields: ReportField[]
  isDirty: boolean
  isPreviewLoading: boolean
  previewData: ReportPreviewResponse | null
  previewError: string | null

  // Drag state
  activeDragItem: DragItem | null

  // Saved report
  savedReport: SavedReport | null
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateReportRequest {
  name: string
  nameAr?: string
  description?: string
  descriptionAr?: string
  configuration: ReportConfiguration
  accessLevel: ReportAccessLevel
  tags?: string[]
}

export interface UpdateReportRequest extends Partial<CreateReportRequest> {
  id: string
}

export interface ListReportsParams {
  page?: number
  limit?: number
  search?: string
  accessLevel?: ReportAccessLevel
  tags?: string[]
  sortBy?: 'name' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

export interface ListReportsResponse {
  data: SavedReport[]
  total: number
  page: number
  limit: number
}

export interface CreateScheduleRequest {
  reportId: string
  name: string
  nameAr?: string
  frequency: ScheduleFrequency
  dayOfWeek?: number
  dayOfMonth?: number
  time: string
  timezone: string
  exportFormat: ExportFormat
  recipients: string[]
}

export interface UpdateScheduleRequest extends Partial<CreateScheduleRequest> {
  id: string
  isActive?: boolean
}

// ============================================================================
// Entity Field Definitions
// ============================================================================

export const ENTITY_FIELDS: Record<ReportEntityType, ReportField[]> = {
  dossiers: [
    {
      id: 'dossiers.id',
      name: 'ID',
      nameAr: 'المعرف',
      type: 'uuid',
      entity: 'dossiers',
      aggregatable: false,
      filterable: true,
      groupable: false,
      sortable: true,
    },
    {
      id: 'dossiers.name_en',
      name: 'Name (EN)',
      nameAr: 'الاسم (إنجليزي)',
      type: 'string',
      entity: 'dossiers',
      aggregatable: false,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'dossiers.name_ar',
      name: 'Name (AR)',
      nameAr: 'الاسم (عربي)',
      type: 'string',
      entity: 'dossiers',
      aggregatable: false,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'dossiers.dossier_type',
      name: 'Type',
      nameAr: 'النوع',
      type: 'enum',
      entity: 'dossiers',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'dossiers.status',
      name: 'Status',
      nameAr: 'الحالة',
      type: 'enum',
      entity: 'dossiers',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'dossiers.priority',
      name: 'Priority',
      nameAr: 'الأولوية',
      type: 'enum',
      entity: 'dossiers',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'dossiers.created_at',
      name: 'Created At',
      nameAr: 'تاريخ الإنشاء',
      type: 'datetime',
      entity: 'dossiers',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'dossiers.updated_at',
      name: 'Updated At',
      nameAr: 'تاريخ التحديث',
      type: 'datetime',
      entity: 'dossiers',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
  ],
  engagements: [
    {
      id: 'engagements.id',
      name: 'ID',
      nameAr: 'المعرف',
      type: 'uuid',
      entity: 'engagements',
      aggregatable: false,
      filterable: true,
      groupable: false,
      sortable: true,
    },
    {
      id: 'engagements.title_en',
      name: 'Title (EN)',
      nameAr: 'العنوان (إنجليزي)',
      type: 'string',
      entity: 'engagements',
      aggregatable: false,
      filterable: true,
      groupable: false,
      sortable: true,
    },
    {
      id: 'engagements.title_ar',
      name: 'Title (AR)',
      nameAr: 'العنوان (عربي)',
      type: 'string',
      entity: 'engagements',
      aggregatable: false,
      filterable: true,
      groupable: false,
      sortable: true,
    },
    {
      id: 'engagements.engagement_type',
      name: 'Type',
      nameAr: 'النوع',
      type: 'enum',
      entity: 'engagements',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'engagements.status',
      name: 'Status',
      nameAr: 'الحالة',
      type: 'enum',
      entity: 'engagements',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'engagements.date',
      name: 'Date',
      nameAr: 'التاريخ',
      type: 'datetime',
      entity: 'engagements',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'engagements.location',
      name: 'Location',
      nameAr: 'الموقع',
      type: 'string',
      entity: 'engagements',
      aggregatable: false,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'engagements.created_at',
      name: 'Created At',
      nameAr: 'تاريخ الإنشاء',
      type: 'datetime',
      entity: 'engagements',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
  ],
  commitments: [
    {
      id: 'commitments.id',
      name: 'ID',
      nameAr: 'المعرف',
      type: 'uuid',
      entity: 'commitments',
      aggregatable: false,
      filterable: true,
      groupable: false,
      sortable: true,
    },
    {
      id: 'commitments.title_en',
      name: 'Title (EN)',
      nameAr: 'العنوان (إنجليزي)',
      type: 'string',
      entity: 'commitments',
      aggregatable: false,
      filterable: true,
      groupable: false,
      sortable: true,
    },
    {
      id: 'commitments.title_ar',
      name: 'Title (AR)',
      nameAr: 'العنوان (عربي)',
      type: 'string',
      entity: 'commitments',
      aggregatable: false,
      filterable: true,
      groupable: false,
      sortable: true,
    },
    {
      id: 'commitments.status',
      name: 'Status',
      nameAr: 'الحالة',
      type: 'enum',
      entity: 'commitments',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'commitments.priority',
      name: 'Priority',
      nameAr: 'الأولوية',
      type: 'enum',
      entity: 'commitments',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'commitments.deadline',
      name: 'Deadline',
      nameAr: 'الموعد النهائي',
      type: 'datetime',
      entity: 'commitments',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'commitments.completion_rate',
      name: 'Completion Rate',
      nameAr: 'نسبة الإنجاز',
      type: 'number',
      entity: 'commitments',
      aggregatable: true,
      filterable: true,
      groupable: false,
      sortable: true,
    },
    {
      id: 'commitments.created_at',
      name: 'Created At',
      nameAr: 'تاريخ الإنشاء',
      type: 'datetime',
      entity: 'commitments',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
  ],
  work_items: [
    {
      id: 'work_items.id',
      name: 'ID',
      nameAr: 'المعرف',
      type: 'uuid',
      entity: 'work_items',
      aggregatable: false,
      filterable: true,
      groupable: false,
      sortable: true,
    },
    {
      id: 'work_items.title',
      name: 'Title',
      nameAr: 'العنوان',
      type: 'string',
      entity: 'work_items',
      aggregatable: false,
      filterable: true,
      groupable: false,
      sortable: true,
    },
    {
      id: 'work_items.source',
      name: 'Source',
      nameAr: 'المصدر',
      type: 'enum',
      entity: 'work_items',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'work_items.status',
      name: 'Status',
      nameAr: 'الحالة',
      type: 'enum',
      entity: 'work_items',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'work_items.priority',
      name: 'Priority',
      nameAr: 'الأولوية',
      type: 'enum',
      entity: 'work_items',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'work_items.tracking_type',
      name: 'Tracking Type',
      nameAr: 'نوع التتبع',
      type: 'enum',
      entity: 'work_items',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'work_items.deadline',
      name: 'Deadline',
      nameAr: 'الموعد النهائي',
      type: 'datetime',
      entity: 'work_items',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'work_items.created_at',
      name: 'Created At',
      nameAr: 'تاريخ الإنشاء',
      type: 'datetime',
      entity: 'work_items',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
  ],
  calendar_entries: [
    {
      id: 'calendar_entries.id',
      name: 'ID',
      nameAr: 'المعرف',
      type: 'uuid',
      entity: 'calendar_entries',
      aggregatable: false,
      filterable: true,
      groupable: false,
      sortable: true,
    },
    {
      id: 'calendar_entries.title_en',
      name: 'Title (EN)',
      nameAr: 'العنوان (إنجليزي)',
      type: 'string',
      entity: 'calendar_entries',
      aggregatable: false,
      filterable: true,
      groupable: false,
      sortable: true,
    },
    {
      id: 'calendar_entries.title_ar',
      name: 'Title (AR)',
      nameAr: 'العنوان (عربي)',
      type: 'string',
      entity: 'calendar_entries',
      aggregatable: false,
      filterable: true,
      groupable: false,
      sortable: true,
    },
    {
      id: 'calendar_entries.event_type',
      name: 'Event Type',
      nameAr: 'نوع الحدث',
      type: 'enum',
      entity: 'calendar_entries',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'calendar_entries.start_time',
      name: 'Start Time',
      nameAr: 'وقت البدء',
      type: 'datetime',
      entity: 'calendar_entries',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'calendar_entries.end_time',
      name: 'End Time',
      nameAr: 'وقت الانتهاء',
      type: 'datetime',
      entity: 'calendar_entries',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'calendar_entries.location',
      name: 'Location',
      nameAr: 'الموقع',
      type: 'string',
      entity: 'calendar_entries',
      aggregatable: false,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'calendar_entries.is_recurring',
      name: 'Is Recurring',
      nameAr: 'متكرر',
      type: 'boolean',
      entity: 'calendar_entries',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
  ],
  persons: [
    {
      id: 'persons.id',
      name: 'ID',
      nameAr: 'المعرف',
      type: 'uuid',
      entity: 'persons',
      aggregatable: false,
      filterable: true,
      groupable: false,
      sortable: true,
    },
    {
      id: 'persons.name_en',
      name: 'Name (EN)',
      nameAr: 'الاسم (إنجليزي)',
      type: 'string',
      entity: 'persons',
      aggregatable: false,
      filterable: true,
      groupable: false,
      sortable: true,
    },
    {
      id: 'persons.name_ar',
      name: 'Name (AR)',
      nameAr: 'الاسم (عربي)',
      type: 'string',
      entity: 'persons',
      aggregatable: false,
      filterable: true,
      groupable: false,
      sortable: true,
    },
    {
      id: 'persons.title_en',
      name: 'Title (EN)',
      nameAr: 'المنصب (إنجليزي)',
      type: 'string',
      entity: 'persons',
      aggregatable: false,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'persons.email',
      name: 'Email',
      nameAr: 'البريد الإلكتروني',
      type: 'string',
      entity: 'persons',
      aggregatable: false,
      filterable: true,
      groupable: false,
      sortable: true,
    },
    {
      id: 'persons.organization',
      name: 'Organization',
      nameAr: 'المنظمة',
      type: 'string',
      entity: 'persons',
      aggregatable: false,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'persons.created_at',
      name: 'Created At',
      nameAr: 'تاريخ الإنشاء',
      type: 'datetime',
      entity: 'persons',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
  ],
  organizations: [
    {
      id: 'organizations.id',
      name: 'ID',
      nameAr: 'المعرف',
      type: 'uuid',
      entity: 'organizations',
      aggregatable: false,
      filterable: true,
      groupable: false,
      sortable: true,
    },
    {
      id: 'organizations.name_en',
      name: 'Name (EN)',
      nameAr: 'الاسم (إنجليزي)',
      type: 'string',
      entity: 'organizations',
      aggregatable: false,
      filterable: true,
      groupable: false,
      sortable: true,
    },
    {
      id: 'organizations.name_ar',
      name: 'Name (AR)',
      nameAr: 'الاسم (عربي)',
      type: 'string',
      entity: 'organizations',
      aggregatable: false,
      filterable: true,
      groupable: false,
      sortable: true,
    },
    {
      id: 'organizations.organization_type',
      name: 'Type',
      nameAr: 'النوع',
      type: 'enum',
      entity: 'organizations',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'organizations.country',
      name: 'Country',
      nameAr: 'الدولة',
      type: 'string',
      entity: 'organizations',
      aggregatable: false,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'organizations.status',
      name: 'Status',
      nameAr: 'الحالة',
      type: 'enum',
      entity: 'organizations',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'organizations.created_at',
      name: 'Created At',
      nameAr: 'تاريخ الإنشاء',
      type: 'datetime',
      entity: 'organizations',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
  ],
  forums: [
    {
      id: 'forums.id',
      name: 'ID',
      nameAr: 'المعرف',
      type: 'uuid',
      entity: 'forums',
      aggregatable: false,
      filterable: true,
      groupable: false,
      sortable: true,
    },
    {
      id: 'forums.name_en',
      name: 'Name (EN)',
      nameAr: 'الاسم (إنجليزي)',
      type: 'string',
      entity: 'forums',
      aggregatable: false,
      filterable: true,
      groupable: false,
      sortable: true,
    },
    {
      id: 'forums.name_ar',
      name: 'Name (AR)',
      nameAr: 'الاسم (عربي)',
      type: 'string',
      entity: 'forums',
      aggregatable: false,
      filterable: true,
      groupable: false,
      sortable: true,
    },
    {
      id: 'forums.forum_type',
      name: 'Type',
      nameAr: 'النوع',
      type: 'enum',
      entity: 'forums',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'forums.status',
      name: 'Status',
      nameAr: 'الحالة',
      type: 'enum',
      entity: 'forums',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'forums.member_count',
      name: 'Member Count',
      nameAr: 'عدد الأعضاء',
      type: 'number',
      entity: 'forums',
      aggregatable: true,
      filterable: true,
      groupable: false,
      sortable: true,
    },
    {
      id: 'forums.created_at',
      name: 'Created At',
      nameAr: 'تاريخ الإنشاء',
      type: 'datetime',
      entity: 'forums',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
  ],
  documents: [
    {
      id: 'documents.id',
      name: 'ID',
      nameAr: 'المعرف',
      type: 'uuid',
      entity: 'documents',
      aggregatable: false,
      filterable: true,
      groupable: false,
      sortable: true,
    },
    {
      id: 'documents.title_en',
      name: 'Title (EN)',
      nameAr: 'العنوان (إنجليزي)',
      type: 'string',
      entity: 'documents',
      aggregatable: false,
      filterable: true,
      groupable: false,
      sortable: true,
    },
    {
      id: 'documents.title_ar',
      name: 'Title (AR)',
      nameAr: 'العنوان (عربي)',
      type: 'string',
      entity: 'documents',
      aggregatable: false,
      filterable: true,
      groupable: false,
      sortable: true,
    },
    {
      id: 'documents.document_type',
      name: 'Type',
      nameAr: 'النوع',
      type: 'enum',
      entity: 'documents',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'documents.file_type',
      name: 'File Type',
      nameAr: 'نوع الملف',
      type: 'string',
      entity: 'documents',
      aggregatable: false,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'documents.file_size',
      name: 'File Size',
      nameAr: 'حجم الملف',
      type: 'number',
      entity: 'documents',
      aggregatable: true,
      filterable: true,
      groupable: false,
      sortable: true,
    },
    {
      id: 'documents.created_at',
      name: 'Created At',
      nameAr: 'تاريخ الإنشاء',
      type: 'datetime',
      entity: 'documents',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
  ],
  relationships: [
    {
      id: 'relationships.id',
      name: 'ID',
      nameAr: 'المعرف',
      type: 'uuid',
      entity: 'relationships',
      aggregatable: false,
      filterable: true,
      groupable: false,
      sortable: true,
    },
    {
      id: 'relationships.relationship_type',
      name: 'Type',
      nameAr: 'النوع',
      type: 'enum',
      entity: 'relationships',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'relationships.strength',
      name: 'Strength',
      nameAr: 'القوة',
      type: 'number',
      entity: 'relationships',
      aggregatable: true,
      filterable: true,
      groupable: false,
      sortable: true,
    },
    {
      id: 'relationships.status',
      name: 'Status',
      nameAr: 'الحالة',
      type: 'enum',
      entity: 'relationships',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
    {
      id: 'relationships.created_at',
      name: 'Created At',
      nameAr: 'تاريخ الإنشاء',
      type: 'datetime',
      entity: 'relationships',
      aggregatable: true,
      filterable: true,
      groupable: true,
      sortable: true,
    },
  ],
}

// ============================================================================
// Helper Functions
// ============================================================================

export function getFieldsForEntity(entity: ReportEntityType): ReportField[] {
  return ENTITY_FIELDS[entity] || []
}

export function getFieldById(fieldId: string): ReportField | undefined {
  const [entity] = fieldId.split('.') as [ReportEntityType]
  const fields = ENTITY_FIELDS[entity]
  return fields?.find((f) => f.id === fieldId)
}

export function createEmptyFilterGroup(): FilterGroup {
  return {
    id: crypto.randomUUID(),
    logic: 'and',
    filters: [],
    groups: [],
  }
}

export function createEmptyReportConfiguration(): ReportConfiguration {
  return {
    entities: [],
    columns: [],
    filters: createEmptyFilterGroup(),
    groupings: [],
    aggregations: [],
    sorting: [],
    visualization: {
      type: 'table',
      showLegend: true,
      showLabels: true,
      showGrid: true,
    },
  }
}

export function createDefaultSavedReport(): Omit<
  SavedReport,
  'id' | 'createdBy' | 'createdAt' | 'updatedAt'
> {
  return {
    name: '',
    configuration: createEmptyReportConfiguration(),
    accessLevel: 'private',
  }
}
