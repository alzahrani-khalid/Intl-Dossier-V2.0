/**
 * Document Version Types
 *
 * Types for document version comparison, history tracking,
 * and revert functionality.
 */

/**
 * Types of changes that can occur between document versions
 */
export type DocumentChangeType = 'initial' | 'update' | 'major_revision' | 'minor_edit' | 'revert'

/**
 * Diff comparison view modes
 */
export type DiffViewMode = 'side_by_side' | 'inline' | 'unified'

/**
 * Diff change types for individual hunks
 */
export type DiffChangeType = 'added' | 'removed' | 'modified' | 'unchanged'

/**
 * A single document version record
 */
export interface DocumentVersion {
  id: string
  document_id: string
  version_number: number
  file_path: string
  file_name: string
  mime_type: string
  size_bytes: number
  checksum?: string
  change_summary?: string
  change_type: DocumentChangeType
  created_by: string
  created_by_name?: string
  created_at: string
  has_text_content?: boolean
  text_content?: string
  metadata?: Record<string, unknown>
}

/**
 * A line in a text diff
 */
export interface DiffLine {
  type: DiffChangeType
  lineNumber?: number
  lineNumberOld?: number
  lineNumberNew?: number
  content: string
}

/**
 * A hunk (chunk) of changes in a diff
 */
export interface DiffHunk {
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  lines: DiffLine[]
}

/**
 * Statistics about the differences between two versions
 */
export interface DiffStats {
  additions: number
  deletions: number
  changes: number
  totalLines: number
  similarity: number // 0-100 percentage
}

/**
 * Result of comparing two document versions
 */
export interface VersionComparisonResult {
  versionA: DocumentVersion
  versionB: DocumentVersion
  canCompareText: boolean
  diffHunks?: DiffHunk[]
  diffStats?: DiffStats
  metadataChanges?: MetadataChange[]
}

/**
 * A change in document metadata between versions
 */
export interface MetadataChange {
  field: string
  oldValue: unknown
  newValue: unknown
  changeType: 'added' | 'removed' | 'modified'
}

/**
 * Revert history record
 */
export interface VersionRevertRecord {
  id: string
  document_id: string
  from_version: number
  to_version: number
  reverted_by: string
  reverted_by_name?: string
  reverted_at: string
  reason?: string
  new_version_id?: string
}

/**
 * Options for fetching version history
 */
export interface VersionHistoryOptions {
  documentId: string
  limit?: number
  offset?: number
}

/**
 * Options for comparing versions
 */
export interface VersionCompareOptions {
  documentId: string
  versionA: number
  versionB: number
  viewMode?: DiffViewMode
}

/**
 * Options for reverting to a version
 */
export interface RevertOptions {
  documentId: string
  targetVersion: number
  reason?: string
}

/**
 * State for the version comparison UI
 */
export interface VersionComparisonState {
  isLoading: boolean
  error: string | null
  versions: DocumentVersion[]
  selectedVersionA: number | null
  selectedVersionB: number | null
  comparisonResult: VersionComparisonResult | null
  viewMode: DiffViewMode
}

/**
 * Props for the DocumentVersionHistory component
 */
export interface DocumentVersionHistoryProps {
  documentId: string
  currentVersion?: number
  onVersionSelect?: (version: DocumentVersion) => void
  onCompare?: (versionA: number, versionB: number) => void
  onRevert?: (version: number) => void
  allowRevert?: boolean
  className?: string
}

/**
 * Props for the DocumentVersionComparison component
 */
export interface DocumentVersionComparisonProps {
  documentId: string
  versionA: number
  versionB: number
  viewMode?: DiffViewMode
  onViewModeChange?: (mode: DiffViewMode) => void
  onClose?: () => void
  className?: string
}

/**
 * Helper to format a version for display
 */
export function formatVersionLabel(version: DocumentVersion): string {
  const typeLabels: Record<DocumentChangeType, string> = {
    initial: 'Initial',
    update: 'Updated',
    major_revision: 'Major Revision',
    minor_edit: 'Minor Edit',
    revert: 'Reverted',
  }
  return `v${version.version_number} - ${typeLabels[version.change_type] || version.change_type}`
}

/**
 * Helper to check if text comparison is supported for a mime type
 */
export function isTextComparableType(mimeType: string): boolean {
  const textTypes = [
    'text/plain',
    'text/csv',
    'text/markdown',
    'text/html',
    'application/json',
    'application/xml',
    'text/xml',
  ]
  return textTypes.includes(mimeType) || mimeType.startsWith('text/')
}

/**
 * Helper to calculate size difference between versions
 */
export function calculateSizeDiff(
  sizeA: number,
  sizeB: number,
): {
  diff: number
  percentage: number
  direction: 'increased' | 'decreased' | 'unchanged'
} {
  const diff = sizeB - sizeA
  const percentage = sizeA > 0 ? Math.round((Math.abs(diff) / sizeA) * 100) : 0
  const direction = diff > 0 ? 'increased' : diff < 0 ? 'decreased' : 'unchanged'
  return { diff, percentage, direction }
}
