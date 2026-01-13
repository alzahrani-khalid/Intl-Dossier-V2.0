/**
 * Smart Import Types
 * Feature: Smart Import Suggestions for Empty Sections
 *
 * Detects available data sources and suggests importing relevant data
 * from connected systems (email, calendar, documents).
 */

/**
 * Type of data source for smart import
 */
export type DataSourceType =
  | 'calendar'
  | 'email'
  | 'email_signature'
  | 'document'
  | 'existing_dossier'
  | 'external_api'

/**
 * Status of a data source connection
 */
export type DataSourceStatus = 'connected' | 'disconnected' | 'partial' | 'error'

/**
 * Section type that can receive smart imports
 */
export type ImportableSection = 'documents' | 'contacts' | 'events' | 'briefs' | 'relationships'

/**
 * Represents an available data source for importing
 */
export interface DataSource {
  /** Unique identifier for the data source */
  id: string
  /** Type of data source */
  type: DataSourceType
  /** Display name */
  name: string
  /** Display name in Arabic */
  nameAr: string
  /** Description of what can be imported */
  description: string
  /** Description in Arabic */
  descriptionAr: string
  /** Connection status */
  status: DataSourceStatus
  /** Icon name (Lucide icon) */
  icon: string
  /** Number of items available for import */
  itemCount?: number
  /** Last sync timestamp */
  lastSyncAt?: string
  /** Provider-specific identifier (e.g., calendar connection ID) */
  providerId?: string
  /** Whether this source is recommended for the section */
  isRecommended?: boolean
}

/**
 * Item that can be imported from a data source
 */
export interface ImportableItem {
  /** Unique identifier */
  id: string
  /** Source identifier */
  sourceId: string
  /** Source type */
  sourceType: DataSourceType
  /** Display title */
  title: string
  /** Display title in Arabic (if available) */
  titleAr?: string
  /** Preview/description text */
  preview?: string
  /** Whether item is selected for import */
  selected: boolean
  /** Raw data from source */
  rawData: Record<string, unknown>
  /** Mapped fields ready for import */
  mappedData?: Record<string, unknown>
  /** Detected entity type for mapping */
  detectedType?: string
  /** Confidence score for mapping (0-1) */
  mappingConfidence?: number
  /** Validation errors */
  validationErrors?: string[]
  /** Timestamp of the item */
  timestamp?: string
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Field mapping for import
 */
export interface FieldMapping {
  /** Source field path */
  sourceField: string
  /** Target field in our system */
  targetField: string
  /** Field display name */
  displayName: string
  /** Whether this mapping is required */
  isRequired: boolean
  /** Whether mapping was auto-detected */
  isAutoMapped: boolean
  /** Transformation to apply */
  transform?: 'none' | 'lowercase' | 'uppercase' | 'trim' | 'parse_date' | 'extract_email'
  /** Default value if source is empty */
  defaultValue?: unknown
}

/**
 * Import suggestion for a section
 */
export interface ImportSuggestion {
  /** Section this suggestion applies to */
  section: ImportableSection
  /** Available data sources */
  dataSources: DataSource[]
  /** Recommended source (if any) */
  recommendedSource?: DataSource
  /** Total items available across all sources */
  totalAvailableItems: number
  /** Whether any connected sources have data */
  hasAvailableData: boolean
  /** Message explaining the suggestion */
  message?: string
  /** Message in Arabic */
  messageAr?: string
}

/**
 * Import preview request
 */
export interface ImportPreviewRequest {
  /** Data source to preview */
  sourceId: string
  /** Source type */
  sourceType: DataSourceType
  /** Target section */
  targetSection: ImportableSection
  /** Entity ID to import into */
  entityId: string
  /** Entity type */
  entityType: string
  /** Maximum items to preview */
  limit?: number
  /** Filter criteria */
  filters?: Record<string, unknown>
}

/**
 * Import preview response
 */
export interface ImportPreviewResponse {
  /** Items available for import */
  items: ImportableItem[]
  /** Suggested field mappings */
  fieldMappings: FieldMapping[]
  /** Total count (may be more than items returned) */
  totalCount: number
  /** Whether there are more items */
  hasMore: boolean
  /** Preview generated at */
  generatedAt: string
  /** Any warnings about the import */
  warnings?: string[]
}

/**
 * Execute import request
 */
export interface ExecuteImportRequest {
  /** Source ID */
  sourceId: string
  /** Source type */
  sourceType: DataSourceType
  /** Target section */
  targetSection: ImportableSection
  /** Entity ID */
  entityId: string
  /** Entity type */
  entityType: string
  /** Items to import (with their IDs) */
  itemIds: string[]
  /** Field mappings to use */
  fieldMappings: FieldMapping[]
  /** Whether to skip items with errors */
  skipErrors?: boolean
  /** Whether to update existing items */
  updateExisting?: boolean
}

/**
 * Import result for a single item
 */
export interface ImportItemResult {
  /** Item ID */
  itemId: string
  /** Whether import succeeded */
  success: boolean
  /** Created/updated record ID */
  recordId?: string
  /** Action taken */
  action?: 'created' | 'updated' | 'skipped' | 'failed'
  /** Error message if failed */
  error?: string
}

/**
 * Execute import response
 */
export interface ExecuteImportResponse {
  /** Whether overall import succeeded */
  success: boolean
  /** Results per item */
  results: ImportItemResult[]
  /** Summary counts */
  summary: {
    total: number
    created: number
    updated: number
    skipped: number
    failed: number
  }
  /** Import completed at */
  completedAt: string
  /** General error if complete failure */
  error?: string
}

/**
 * Hook options for useSmartImportSuggestions
 */
export interface UseSmartImportSuggestionsOptions {
  /** Section to get suggestions for */
  section: ImportableSection
  /** Entity ID for context */
  entityId: string
  /** Entity type for context */
  entityType: string
  /** Whether to auto-detect available sources */
  autoDetect?: boolean
  /** Callback when suggestions are loaded */
  onSuggestionsLoaded?: (suggestions: ImportSuggestion) => void
}

/**
 * Hook return type for useSmartImportSuggestions
 */
export interface UseSmartImportSuggestionsReturn {
  /** Import suggestions for the section */
  suggestions: ImportSuggestion | null
  /** Whether suggestions are loading */
  isLoading: boolean
  /** Error if any */
  error: Error | null
  /** Available data sources */
  dataSources: DataSource[]
  /** Whether there are any available data sources */
  hasDataSources: boolean
  /** Preview items from a source */
  previewSource: (sourceId: string) => Promise<ImportPreviewResponse>
  /** Execute import */
  executeImport: (request: ExecuteImportRequest) => Promise<ExecuteImportResponse>
  /** Whether preview is loading */
  isPreviewLoading: boolean
  /** Whether import is executing */
  isImporting: boolean
  /** Refresh suggestions */
  refresh: () => void
}
