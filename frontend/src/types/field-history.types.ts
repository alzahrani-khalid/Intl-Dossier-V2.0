/**
 * Field History Types
 *
 * Type definitions for field-level change tracking with rollback capabilities.
 * Supports granular history viewing and selective rollback of individual fields.
 */

// =============================================
// ENTITY TYPES
// =============================================

export type TrackableEntityType =
  | 'person'
  | 'engagement'
  | 'commitment'
  | 'organization'
  | 'country'
  | 'forum'
  | 'mou'
  | 'position'
  | 'dossier'
  | 'task'
  | 'intake_ticket'
  | 'working_group'
  | 'theme'

export type ChangeType = 'create' | 'update' | 'delete' | 'rollback'

export type FieldCategory = 'base' | 'extension' | 'metadata' | 'relationship'

// =============================================
// FIELD HISTORY ENTRY
// =============================================

export interface FieldHistoryEntry {
  id: string
  entity_type: TrackableEntityType
  entity_id: string
  field_name: string
  field_label: {
    en: string | null
    ar: string | null
  }
  field_category: FieldCategory
  old_value: unknown
  new_value: unknown
  change_type: ChangeType
  changed_by: {
    id: string
    email: string | null
    role: string | null
  }
  created_at: string
  is_rollback: boolean
  rollback_of_id: string | null
  rolled_back_at: string | null
  rolled_back_by: string | null
  can_rollback: boolean
}

// =============================================
// GROUPED FIELD HISTORY
// =============================================

export interface FieldHistoryGrouped {
  field_name: string
  field_label: {
    en: string | null
    ar: string | null
  }
  field_category: FieldCategory
  current_value: unknown
  statistics: {
    change_count: number
    first_change_at: string
    last_change_at: string
    last_changed_by_email: string | null
  }
}

// =============================================
// API RESPONSES
// =============================================

export interface FieldHistoryListResponse {
  data: FieldHistoryEntry[]
  metadata: {
    entity_type: TrackableEntityType
    entity_id: string
    total: number
    limit: number
    offset: number
    has_more: boolean
  }
}

export interface FieldHistoryGroupedResponse {
  data: FieldHistoryGrouped[]
  metadata: {
    entity_type: TrackableEntityType
    entity_id: string
    total_fields: number
  }
}

export interface RollbackResponse {
  success: boolean
  message: string
  data?: {
    rollback_history_id: string
    rolled_back_field: string
    restored_value: unknown
  }
}

// =============================================
// QUERY PARAMETERS
// =============================================

export interface FieldHistoryFilters {
  entity_type: TrackableEntityType
  entity_id: string
  field_name?: string
  field_category?: FieldCategory
  change_type?: ChangeType
  date_from?: string
  date_to?: string
  changed_by?: string
}

export interface FieldHistoryPagination {
  limit: number
  offset: number
}

// =============================================
// COMPONENT PROPS
// =============================================

export interface FieldHistoryTimelineProps {
  entityType: TrackableEntityType
  entityId: string
  initialFieldName?: string
  showFilters?: boolean
  showGroupedView?: boolean
  onRollback?: (entry: FieldHistoryEntry) => void
  className?: string
}

export interface FieldHistoryEntryCardProps {
  entry: FieldHistoryEntry
  isRTL: boolean
  onRollback?: (entry: FieldHistoryEntry) => void
  className?: string
}

export interface FieldHistoryGroupCardProps {
  field: FieldHistoryGrouped
  isRTL: boolean
  onClick?: (fieldName: string) => void
  className?: string
}

export interface FieldHistoryDiffViewProps {
  oldValue: unknown
  newValue: unknown
  fieldName: string
  isRTL: boolean
  className?: string
}

export interface RollbackConfirmDialogProps {
  entry: FieldHistoryEntry
  isOpen: boolean
  isLoading: boolean
  onConfirm: () => void
  onCancel: () => void
}

// =============================================
// HOOK RETURN TYPES
// =============================================

export interface UseFieldHistoryReturn {
  entries: FieldHistoryEntry[]
  isLoading: boolean
  isFetchingNextPage: boolean
  error: Error | null
  metadata: FieldHistoryListResponse['metadata'] | null
  filters: FieldHistoryFilters
  pagination: FieldHistoryPagination
  setFilters: (filters: Partial<FieldHistoryFilters>) => void
  clearFilters: () => void
  nextPage: () => void
  prevPage: () => void
  refetch: () => void
}

export interface UseFieldHistoryGroupedReturn {
  fields: FieldHistoryGrouped[]
  isLoading: boolean
  error: Error | null
  metadata: FieldHistoryGroupedResponse['metadata'] | null
  refetch: () => void
}

export interface UseFieldRollbackReturn {
  rollback: (fieldHistoryId: string) => Promise<RollbackResponse>
  isRollingBack: boolean
  error: Error | null
}

// =============================================
// CONFIGURATION
// =============================================

export interface ChangeTypeConfig {
  type: ChangeType
  label_en: string
  label_ar: string
  color: string
  bgColor: string
  icon: string
}

export const CHANGE_TYPE_CONFIG: Record<ChangeType, ChangeTypeConfig> = {
  create: {
    type: 'create',
    label_en: 'Created',
    label_ar: 'تم الإنشاء',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: 'Plus',
  },
  update: {
    type: 'update',
    label_en: 'Updated',
    label_ar: 'تم التحديث',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: 'Edit3',
  },
  delete: {
    type: 'delete',
    label_en: 'Deleted',
    label_ar: 'تم الحذف',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: 'Trash2',
  },
  rollback: {
    type: 'rollback',
    label_en: 'Rolled Back',
    label_ar: 'تم الاستعادة',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    icon: 'RotateCcw',
  },
}

export interface FieldCategoryConfig {
  category: FieldCategory
  label_en: string
  label_ar: string
  color: string
}

export const FIELD_CATEGORY_CONFIG: Record<FieldCategory, FieldCategoryConfig> = {
  base: {
    category: 'base',
    label_en: 'Core Fields',
    label_ar: 'الحقول الأساسية',
    color: 'text-gray-600',
  },
  extension: {
    category: 'extension',
    label_en: 'Extended Fields',
    label_ar: 'الحقول الموسعة',
    color: 'text-purple-600',
  },
  metadata: {
    category: 'metadata',
    label_en: 'Metadata',
    label_ar: 'البيانات الوصفية',
    color: 'text-gray-400',
  },
  relationship: {
    category: 'relationship',
    label_en: 'Relationships',
    label_ar: 'العلاقات',
    color: 'text-indigo-600',
  },
}

// Entity type display names
export const ENTITY_TYPE_DISPLAY: Record<TrackableEntityType, { en: string; ar: string }> = {
  person: { en: 'Person', ar: 'شخص' },
  engagement: { en: 'Engagement', ar: 'ارتباط' },
  commitment: { en: 'Commitment', ar: 'التزام' },
  organization: { en: 'Organization', ar: 'منظمة' },
  country: { en: 'Country', ar: 'دولة' },
  forum: { en: 'Forum', ar: 'منتدى' },
  mou: { en: 'MoU', ar: 'مذكرة تفاهم' },
  position: { en: 'Position', ar: 'موقف' },
  dossier: { en: 'Dossier', ar: 'ملف' },
  task: { en: 'Task', ar: 'مهمة' },
  intake_ticket: { en: 'Intake Ticket', ar: 'تذكرة استقبال' },
  working_group: { en: 'Working Group', ar: 'مجموعة عمل' },
  theme: { en: 'Theme', ar: 'موضوع' },
}
