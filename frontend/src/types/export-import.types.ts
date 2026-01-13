/**
 * Export/Import Types
 * Feature: export-import-templates
 *
 * TypeScript interfaces for Excel/CSV export-import operations with validation.
 * Supports bulk data operations, change detection, and conflict resolution.
 */

import type { BulkActionEntityType, ExportFormat } from './bulk-actions.types'

/**
 * Supported export entity types
 */
export type ExportableEntityType = Extract<
  BulkActionEntityType,
  'dossier' | 'person' | 'engagement' | 'working-group' | 'commitment' | 'deliverable'
>

/**
 * Import operation mode
 */
export type ImportMode = 'create' | 'update' | 'upsert'

/**
 * Import conflict resolution strategy
 */
export type ConflictResolution = 'skip' | 'overwrite' | 'merge' | 'manual'

/**
 * Validation error severity
 */
export type ValidationSeverity = 'error' | 'warning' | 'info'

/**
 * Import row status
 */
export type ImportRowStatus =
  | 'pending'
  | 'valid'
  | 'invalid'
  | 'warning'
  | 'conflict'
  | 'imported'
  | 'skipped'
  | 'failed'

/**
 * Column mapping for import/export
 */
export interface ColumnMapping {
  /** Database/API field name */
  field: string
  /** Excel/CSV column header */
  header: string
  /** Header in Arabic */
  headerAr: string
  /** Data type for validation */
  type:
    | 'string'
    | 'number'
    | 'boolean'
    | 'date'
    | 'datetime'
    | 'email'
    | 'url'
    | 'enum'
    | 'array'
    | 'json'
  /** Whether field is required */
  required: boolean
  /** Enum values (if type is 'enum') */
  enumValues?: string[]
  /** Maximum length for strings */
  maxLength?: number
  /** Minimum value for numbers */
  minValue?: number
  /** Maximum value for numbers */
  maxValue?: number
  /** Regex pattern for validation */
  pattern?: string
  /** Default value for empty cells */
  defaultValue?: unknown
  /** Transform function name (applied during import) */
  transform?: 'lowercase' | 'uppercase' | 'trim' | 'normalize_date' | 'parse_array'
  /** Whether this is a unique identifier field */
  isIdentifier?: boolean
  /** Whether to include in export */
  exportable?: boolean
  /** Whether to include in import template */
  importable?: boolean
  /** Example value for template */
  example?: string
  /** Description/help text */
  description?: string
  /** Description in Arabic */
  descriptionAr?: string
}

/**
 * Entity template definition
 */
export interface EntityTemplate {
  /** Entity type */
  entityType: ExportableEntityType
  /** Template name */
  name: string
  /** Template name in Arabic */
  nameAr: string
  /** Column mappings */
  columns: ColumnMapping[]
  /** Unique identifier columns for matching */
  identifierColumns: string[]
  /** Required columns for import */
  requiredColumns: string[]
  /** Template version */
  version: string
  /** Template description */
  description?: string
  /** Description in Arabic */
  descriptionAr?: string
}

/**
 * Export request parameters
 */
export interface ExportRequest {
  /** Entity type to export */
  entityType: ExportableEntityType
  /** Export format */
  format: ExportFormat
  /** IDs to export (if empty, exports all accessible) */
  ids?: string[]
  /** Columns to include (if empty, includes all) */
  columns?: string[]
  /** Include template headers with instructions */
  includeTemplate?: boolean
  /** Include example data row */
  includeExample?: boolean
  /** Filter criteria */
  filters?: Record<string, unknown>
  /** Language for headers */
  language?: 'en' | 'ar' | 'both'
  /** Sort order */
  sortBy?: string
  /** Sort direction */
  sortDirection?: 'asc' | 'desc'
}

/**
 * Export response
 */
export interface ExportResponse {
  /** Whether export succeeded */
  success: boolean
  /** Generated file URL or blob */
  fileUrl?: string
  /** File name */
  fileName?: string
  /** File content (for direct download) */
  content?: string
  /** File content type */
  contentType?: string
  /** Number of records exported */
  recordCount: number
  /** Export timestamp */
  exportedAt: string
  /** Entity type */
  entityType: ExportableEntityType
  /** Format */
  format: ExportFormat
  /** Error message if failed */
  error?: {
    code: string
    message_en: string
    message_ar: string
  }
}

/**
 * Validation error for a single cell/field
 */
export interface CellValidationError {
  /** Row number (1-indexed) */
  row: number
  /** Column name/field */
  column: string
  /** Error severity */
  severity: ValidationSeverity
  /** Error code */
  code: string
  /** Error message in English */
  message_en: string
  /** Error message in Arabic */
  message_ar: string
  /** The invalid value */
  value?: unknown
  /** Suggested fix */
  suggestion_en?: string
  /** Suggested fix in Arabic */
  suggestion_ar?: string
}

/**
 * Validation result for a single row
 */
export interface RowValidationResult {
  /** Row number (1-indexed, excludes header) */
  row: number
  /** Row status */
  status: ImportRowStatus
  /** Validation errors for this row */
  errors: CellValidationError[]
  /** Parsed/transformed data for valid rows */
  data?: Record<string, unknown>
  /** Existing record ID if found (for updates) */
  existingId?: string
  /** Change detection result (for updates) */
  changes?: FieldChange[]
}

/**
 * Field change for update operations
 */
export interface FieldChange {
  /** Field name */
  field: string
  /** Previous value */
  oldValue: unknown
  /** New value */
  newValue: unknown
  /** Whether this is a significant change */
  isSignificant?: boolean
}

/**
 * Conflict details when existing record is found
 */
export interface ImportConflict {
  /** Row number */
  row: number
  /** Existing record ID */
  existingId: string
  /** Identifier field(s) that matched */
  matchedOn: string[]
  /** Field changes detected */
  changes: FieldChange[]
  /** Resolution applied */
  resolution?: ConflictResolution
  /** User decision (for manual resolution) */
  userDecision?: 'skip' | 'overwrite' | 'merge'
}

/**
 * Import validation result (before actual import)
 */
export interface ImportValidationResult {
  /** Whether validation passed overall */
  valid: boolean
  /** Total rows in file (excluding header) */
  totalRows: number
  /** Valid rows count */
  validRows: number
  /** Invalid rows count */
  invalidRows: number
  /** Warning rows count */
  warningRows: number
  /** Conflict rows count (existing records) */
  conflictRows: number
  /** Validation results per row */
  rows: RowValidationResult[]
  /** Summary of errors by type */
  errorSummary: Record<string, number>
  /** Detected conflicts */
  conflicts: ImportConflict[]
  /** File metadata */
  fileInfo: {
    name: string
    size: number
    rows: number
    columns: string[]
    format: 'csv' | 'xlsx'
    detectedEncoding?: string
  }
  /** Matched template */
  template?: EntityTemplate
  /** Unmapped columns from file */
  unmappedColumns?: string[]
  /** Missing required columns */
  missingRequiredColumns?: string[]
}

/**
 * Import request parameters
 */
export interface ImportRequest {
  /** Entity type to import */
  entityType: ExportableEntityType
  /** Import mode */
  mode: ImportMode
  /** Conflict resolution strategy */
  conflictResolution: ConflictResolution
  /** Validated rows to import */
  rows: RowValidationResult[]
  /** Manual conflict resolutions */
  conflictResolutions?: Record<number, 'skip' | 'overwrite' | 'merge'>
  /** Whether to skip rows with warnings */
  skipWarnings?: boolean
  /** Whether this is a dry run (validate only) */
  dryRun?: boolean
}

/**
 * Import result for a single row
 */
export interface ImportRowResult {
  /** Row number */
  row: number
  /** Whether import succeeded */
  success: boolean
  /** Action performed */
  action: 'created' | 'updated' | 'skipped' | 'failed'
  /** Created/updated record ID */
  recordId?: string
  /** Error if failed */
  error?: {
    code: string
    message_en: string
    message_ar: string
  }
}

/**
 * Import response
 */
export interface ImportResponse {
  /** Whether import succeeded overall */
  success: boolean
  /** Total rows processed */
  totalRows: number
  /** Successfully imported count */
  successCount: number
  /** Failed count */
  failedCount: number
  /** Skipped count */
  skippedCount: number
  /** Created count */
  createdCount: number
  /** Updated count */
  updatedCount: number
  /** Results per row */
  results: ImportRowResult[]
  /** Import timestamp */
  importedAt: string
  /** Import ID for tracking */
  importId: string
  /** Summary message */
  message_en?: string
  /** Summary message in Arabic */
  message_ar?: string
  /** General errors */
  errors?: Array<{
    code: string
    message_en: string
    message_ar: string
  }>
}

/**
 * Template download request
 */
export interface TemplateDownloadRequest {
  /** Entity type */
  entityType: ExportableEntityType
  /** Format */
  format: 'csv' | 'xlsx'
  /** Include sample data */
  includeSampleData?: boolean
  /** Language for headers */
  language?: 'en' | 'ar' | 'both'
}

/**
 * Import progress state
 */
export interface ImportProgress {
  /** Current stage */
  stage: 'uploading' | 'parsing' | 'validating' | 'importing' | 'complete' | 'error'
  /** Progress percentage (0-100) */
  progress: number
  /** Current row being processed */
  currentRow?: number
  /** Total rows */
  totalRows?: number
  /** Status message */
  message_en?: string
  /** Status message in Arabic */
  message_ar?: string
}

/**
 * Export progress state
 */
export interface ExportProgress {
  /** Current stage */
  stage: 'fetching' | 'generating' | 'complete' | 'error'
  /** Progress percentage (0-100) */
  progress: number
  /** Current record being processed */
  currentRecord?: number
  /** Total records */
  totalRecords?: number
  /** Status message */
  message_en?: string
  /** Status message in Arabic */
  message_ar?: string
}

/**
 * Validation error codes
 */
export const VALIDATION_ERROR_CODES = {
  REQUIRED_FIELD: 'required_field',
  INVALID_TYPE: 'invalid_type',
  INVALID_FORMAT: 'invalid_format',
  INVALID_ENUM: 'invalid_enum',
  MAX_LENGTH_EXCEEDED: 'max_length_exceeded',
  MIN_VALUE: 'min_value',
  MAX_VALUE: 'max_value',
  PATTERN_MISMATCH: 'pattern_mismatch',
  DUPLICATE_ROW: 'duplicate_row',
  DUPLICATE_IDENTIFIER: 'duplicate_identifier',
  INVALID_REFERENCE: 'invalid_reference',
  ENCODING_ERROR: 'encoding_error',
  PARSE_ERROR: 'parse_error',
  CONFLICT_DETECTED: 'conflict_detected',
} as const

/**
 * Hook options for useExportData
 */
export interface UseExportDataOptions {
  /** Callback on export success */
  onSuccess?: (response: ExportResponse) => void
  /** Callback on export error */
  onError?: (error: Error) => void
  /** Callback on progress update */
  onProgress?: (progress: ExportProgress) => void
}

/**
 * Hook return type for useExportData
 */
export interface UseExportDataReturn {
  /** Export function */
  exportData: (request: ExportRequest) => Promise<ExportResponse>
  /** Download template function */
  downloadTemplate: (request: TemplateDownloadRequest) => Promise<void>
  /** Current progress */
  progress: ExportProgress | null
  /** Whether export is in progress */
  isExporting: boolean
  /** Last error */
  error: Error | null
  /** Reset state */
  reset: () => void
}

/**
 * Hook options for useImportData
 */
export interface UseImportDataOptions {
  /** Entity type for import */
  entityType: ExportableEntityType
  /** Default import mode */
  defaultMode?: ImportMode
  /** Default conflict resolution */
  defaultConflictResolution?: ConflictResolution
  /** Callback on validation complete */
  onValidationComplete?: (result: ImportValidationResult) => void
  /** Callback on import success */
  onSuccess?: (response: ImportResponse) => void
  /** Callback on error */
  onError?: (error: Error) => void
  /** Callback on progress update */
  onProgress?: (progress: ImportProgress) => void
}

/**
 * Hook return type for useImportData
 */
export interface UseImportDataReturn {
  /** Upload and validate file */
  uploadFile: (file: File) => Promise<ImportValidationResult>
  /** Execute import with validated data */
  executeImport: (request: ImportRequest) => Promise<ImportResponse>
  /** Cancel current operation */
  cancel: () => void
  /** Current validation result */
  validationResult: ImportValidationResult | null
  /** Current import response */
  importResponse: ImportResponse | null
  /** Current progress */
  progress: ImportProgress | null
  /** Whether validation is in progress */
  isValidating: boolean
  /** Whether import is in progress */
  isImporting: boolean
  /** Last error */
  error: Error | null
  /** Reset state */
  reset: () => void
}
