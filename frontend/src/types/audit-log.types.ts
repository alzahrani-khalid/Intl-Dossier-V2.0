/**
 * Audit Log Types
 *
 * Type definitions for the comprehensive audit log viewer with filtering,
 * export, and analytics capabilities.
 */

// =============================================
// OPERATION TYPES
// =============================================

export type AuditOperation = 'INSERT' | 'UPDATE' | 'DELETE'

// =============================================
// AUDIT LOG ENTRY
// =============================================

export interface AuditLogEntry {
  id: string
  table_name: string
  operation: AuditOperation
  row_id: string
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  changed_fields: string[] | null
  user_id: string | null
  user_email: string | null
  user_role: string | null
  ip_address: string | null
  user_agent: string | null
  timestamp: string
  session_id: string | null
  request_id: string | null
  // Computed fields
  changes_count?: number
  diff_summary?: string
}

export interface AuditLogDetail extends AuditLogEntry {
  related_logs?: AuditLogRelated[]
}

export interface AuditLogRelated {
  id: string
  timestamp: string
  operation: AuditOperation
  user_email: string | null
  changed_fields: string[] | null
}

// =============================================
// FILTERS
// =============================================

export interface AuditLogFilters {
  table_name?: string
  user_id?: string
  user_email?: string
  operation?: AuditOperation
  date_from?: string
  date_to?: string
  ip_address?: string
  search?: string
  row_id?: string
  sort_by?: 'timestamp' | 'table_name' | 'operation' | 'user_email'
  sort_order?: 'asc' | 'desc'
}

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'this_month'
  | 'last_month'
  | 'custom'

// =============================================
// PAGINATION
// =============================================

export interface AuditLogPagination {
  limit: number
  offset: number
}

export interface AuditLogMetadata {
  total: number
  limit: number
  offset: number
  has_more: boolean
}

// =============================================
// API RESPONSES
// =============================================

export interface AuditLogListResponse {
  data: AuditLogEntry[]
  metadata: AuditLogMetadata
}

export interface AuditLogDetailResponse {
  data: {
    log: AuditLogEntry
    related_logs: AuditLogRelated[]
  }
}

export interface AuditLogStatistics {
  period: {
    from: string
    to: string
  }
  by_operation: Array<{
    operation: string
    count: number
  }>
  by_table?: Array<{
    table: string
    count: number
  }>
  total_events: number
}

export interface AuditLogStatisticsResponse {
  data: AuditLogStatistics
}

// =============================================
// EXPORT OPTIONS
// =============================================

export type ExportFormat = 'csv' | 'json'

export interface ExportOptions {
  format: ExportFormat
  filters?: AuditLogFilters
}

// =============================================
// HOOK RETURN TYPES
// =============================================

export interface UseAuditLogsReturn {
  logs: AuditLogEntry[]
  isLoading: boolean
  isFetchingNextPage: boolean
  error: Error | null
  total: number
  hasMore: boolean
  filters: AuditLogFilters
  pagination: AuditLogPagination
  setFilters: (filters: AuditLogFilters) => void
  clearFilters: () => void
  setPagination: (pagination: AuditLogPagination) => void
  nextPage: () => void
  prevPage: () => void
  refetch: () => void
}

export interface UseAuditLogDetailReturn {
  log: AuditLogDetail | null
  relatedLogs: AuditLogRelated[]
  isLoading: boolean
  error: Error | null
}

export interface UseAuditLogStatisticsReturn {
  statistics: AuditLogStatistics | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export interface UseAuditLogExportReturn {
  exportLogs: (options: ExportOptions) => Promise<void>
  isExporting: boolean
  error: Error | null
}

// =============================================
// COMPONENT PROPS
// =============================================

export interface AuditLogViewerProps {
  initialFilters?: AuditLogFilters
  showFilters?: boolean
  showExport?: boolean
  showStatistics?: boolean
  maxHeight?: string
  className?: string
}

export interface AuditLogFiltersProps {
  filters: AuditLogFilters
  onFiltersChange: (filters: AuditLogFilters) => void
  onClearFilters: () => void
  availableTables?: string[]
  className?: string
}

export interface AuditLogTableProps {
  logs: AuditLogEntry[]
  isLoading: boolean
  onLogClick?: (log: AuditLogEntry) => void
  selectedLogId?: string
  className?: string
}

export interface AuditLogDetailProps {
  logId: string
  onClose?: () => void
  className?: string
}

export interface AuditLogDiffViewProps {
  oldData: Record<string, unknown> | null
  newData: Record<string, unknown> | null
  changedFields: string[] | null
  className?: string
}

export interface AuditLogExportButtonProps {
  filters: AuditLogFilters
  disabled?: boolean
  className?: string
}

// =============================================
// CONFIGURATION
// =============================================

export interface OperationConfig {
  operation: AuditOperation
  label_en: string
  label_ar: string
  color: string
  bgColor: string
  icon: string
}

export const OPERATION_CONFIG: Record<AuditOperation, OperationConfig> = {
  INSERT: {
    operation: 'INSERT',
    label_en: 'Created',
    label_ar: 'إنشاء',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: 'Plus',
  },
  UPDATE: {
    operation: 'UPDATE',
    label_en: 'Updated',
    label_ar: 'تحديث',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: 'Edit3',
  },
  DELETE: {
    operation: 'DELETE',
    label_en: 'Deleted',
    label_ar: 'حذف',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: 'Trash2',
  },
}

// Common table names for display
export const TABLE_DISPLAY_NAMES: Record<string, { en: string; ar: string }> = {
  users: { en: 'Users', ar: 'المستخدمون' },
  countries: { en: 'Countries', ar: 'الدول' },
  organizations: { en: 'Organizations', ar: 'المنظمات' },
  mous: { en: 'MoUs', ar: 'مذكرات التفاهم' },
  events: { en: 'Events', ar: 'الفعاليات' },
  forums: { en: 'Forums', ar: 'المنتديات' },
  briefs: { en: 'Briefs', ar: 'الموجزات' },
  intelligence_reports: { en: 'Intelligence Reports', ar: 'تقارير المعلومات' },
  data_library_items: { en: 'Data Library', ar: 'مكتبة البيانات' },
  intake_tickets: { en: 'Intake Tickets', ar: 'تذاكر الاستقبال' },
  commitments: { en: 'Commitments', ar: 'الالتزامات' },
  tasks: { en: 'Tasks', ar: 'المهام' },
  engagements: { en: 'Engagements', ar: 'الارتباطات' },
  persons: { en: 'Persons', ar: 'الأشخاص' },
  positions: { en: 'Positions', ar: 'المناصب' },
  working_groups: { en: 'Working Groups', ar: 'مجموعات العمل' },
  themes: { en: 'Themes', ar: 'المواضيع' },
  documents: { en: 'Documents', ar: 'الوثائق' },
  relationships: { en: 'Relationships', ar: 'العلاقات' },
}
