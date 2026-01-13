/**
 * Entity Comparison Types
 * @module types/entity-comparison
 * @feature entity-comparison-view
 *
 * Type definitions for the entity comparison feature that allows
 * side-by-side comparison of dossiers with difference highlighting.
 */

import type { DossierType, Dossier } from '@/lib/dossier-type-guards'

/**
 * Field difference type indicators
 */
export type FieldDifferenceType = 'same' | 'different' | 'added' | 'removed' | 'modified'

/**
 * Represents a single field comparison result
 */
export interface FieldComparison {
  /** Field key/name */
  fieldKey: string
  /** Human-readable field label (for display) */
  fieldLabel: string
  /** Array of values for each entity being compared */
  values: (string | number | boolean | null | undefined)[]
  /** Type of difference detected */
  differenceType: FieldDifferenceType
  /** Field category (base, extension, metadata) */
  category: 'base' | 'extension' | 'metadata'
  /** Is this a bilingual field (has _en/_ar variants) */
  isBilingual: boolean
}

/**
 * Complete comparison result for multiple entities
 */
export interface EntityComparisonResult {
  /** Type of entities being compared */
  entityType: DossierType
  /** Array of entity IDs being compared */
  entityIds: string[]
  /** Array of dossiers being compared */
  entities: Dossier[]
  /** Field-by-field comparison results */
  fieldComparisons: FieldComparison[]
  /** Summary statistics */
  summary: ComparisonSummary
  /** Timestamp when comparison was generated */
  comparedAt: string
}

/**
 * Summary statistics for a comparison
 */
export interface ComparisonSummary {
  /** Total number of fields compared */
  totalFields: number
  /** Number of fields that are identical across all entities */
  sameFields: number
  /** Number of fields that differ between entities */
  differentFields: number
  /** Percentage of similarity (0-100) */
  similarityPercentage: number
  /** Fields with the most variation */
  mostDifferentFields: string[]
}

/**
 * Configuration for field display in comparison
 */
export interface FieldDisplayConfig {
  /** Field key */
  key: string
  /** Display label (translation key) */
  labelKey: string
  /** Field category */
  category: 'base' | 'extension' | 'metadata'
  /** Whether field should be shown by default */
  defaultVisible: boolean
  /** Custom render type for special formatting */
  renderType?: 'text' | 'number' | 'date' | 'boolean' | 'url' | 'array' | 'object' | 'currency'
  /** Format options for the render type */
  formatOptions?: Record<string, unknown>
}

/**
 * Field configuration registry by dossier type
 */
export type FieldConfigRegistry = Record<DossierType, FieldDisplayConfig[]>

/**
 * Comparison view mode
 */
export type ComparisonViewMode = 'table' | 'side_by_side' | 'highlights_only'

/**
 * Comparison filter options
 */
export interface ComparisonFilters {
  /** Show only fields with differences */
  showOnlyDifferences: boolean
  /** Show/hide base fields */
  showBaseFields: boolean
  /** Show/hide extension fields */
  showExtensionFields: boolean
  /** Show/hide metadata fields */
  showMetadataFields: boolean
  /** Specific fields to include (if empty, show all) */
  includedFields: string[]
  /** Specific fields to exclude */
  excludedFields: string[]
}

/**
 * Export format options
 */
export type ComparisonExportFormat = 'csv' | 'json' | 'pdf' | 'xlsx'

/**
 * Export configuration
 */
export interface ComparisonExportConfig {
  /** Export format */
  format: ComparisonExportFormat
  /** Include header row/section */
  includeHeader: boolean
  /** Include summary section */
  includeSummary: boolean
  /** Include only different fields */
  onlyDifferences: boolean
  /** Language for export (affects field labels) */
  language: 'en' | 'ar'
  /** Custom filename (without extension) */
  filename?: string
}

/**
 * URL state for comparison page
 */
export interface ComparisonUrlState {
  /** Dossier type being compared */
  type?: DossierType
  /** Comma-separated list of entity IDs */
  ids?: string
  /** View mode */
  view?: ComparisonViewMode
  /** Show only differences */
  diff?: boolean
}

/**
 * Selection state for entity picker
 */
export interface EntitySelectionState {
  /** Currently selected dossier type */
  selectedType: DossierType | null
  /** List of selected entity IDs */
  selectedIds: string[]
  /** Maximum number of entities that can be selected */
  maxSelections: number
  /** Search query for filtering entities */
  searchQuery: string
}

/**
 * Props for the EntityComparisonTable component
 */
export interface EntityComparisonTableProps {
  /** Comparison result to display */
  comparisonResult: EntityComparisonResult
  /** Current view mode */
  viewMode: ComparisonViewMode
  /** Filter options */
  filters: ComparisonFilters
  /** Callback when view mode changes */
  onViewModeChange?: (mode: ComparisonViewMode) => void
  /** Callback when filters change */
  onFiltersChange?: (filters: ComparisonFilters) => void
  /** Whether the component is in loading state */
  isLoading?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Props for the EntityComparisonSelector component
 */
export interface EntityComparisonSelectorProps {
  /** Current selection state */
  selectionState: EntitySelectionState
  /** Callback when selection changes */
  onSelectionChange: (state: EntitySelectionState) => void
  /** Callback when compare button is clicked */
  onCompare: (type: DossierType, ids: string[]) => void
  /** Minimum number of entities required to compare */
  minSelections?: number
  /** Maximum number of entities allowed */
  maxSelections?: number
  /** Additional CSS classes */
  className?: string
}

/**
 * Props for the ComparisonExport component
 */
export interface ComparisonExportProps {
  /** Comparison result to export */
  comparisonResult: EntityComparisonResult
  /** Export configuration */
  config?: Partial<ComparisonExportConfig>
  /** Callback after successful export */
  onExportComplete?: (format: ComparisonExportFormat) => void
  /** Callback on export error */
  onExportError?: (error: Error) => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Default comparison filters
 */
export const DEFAULT_COMPARISON_FILTERS: ComparisonFilters = {
  showOnlyDifferences: false,
  showBaseFields: true,
  showExtensionFields: true,
  showMetadataFields: true,
  includedFields: [],
  excludedFields: [],
}

/**
 * Default export configuration
 */
export const DEFAULT_EXPORT_CONFIG: ComparisonExportConfig = {
  format: 'csv',
  includeHeader: true,
  includeSummary: true,
  onlyDifferences: false,
  language: 'en',
}

/**
 * Maximum entities that can be compared at once
 */
export const MAX_COMPARISON_ENTITIES = 5

/**
 * Minimum entities required for comparison
 */
export const MIN_COMPARISON_ENTITIES = 2
