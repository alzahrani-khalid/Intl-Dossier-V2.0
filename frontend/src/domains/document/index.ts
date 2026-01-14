/**
 * Document Bounded Context - Public API
 *
 * This module exports all public types, hooks, and services
 * from the Document context.
 *
 * Import from this module:
 * ```typescript
 * import {
 *   useDocuments,
 *   useDocument,
 *   Document,
 *   documentService
 * } from '@/domains/document'
 * ```
 */

// ============================================================================
// Types
// ============================================================================

// Document Types
export type {
  DocumentStatus,
  DocumentClassification,
  DocumentCategory,
  Document,
  DocumentListItem,
  DocumentCreate,
  DocumentUpdate,
  DocumentSearchParams,
  DocumentUploadResponse,
} from './types/document'
export {
  isImageDocument,
  isPdfDocument,
  isTextDocument,
  isOfficeDocument,
  formatFileSize,
} from './types/document'

// Version Types
export type {
  DocumentChangeType,
  DiffViewMode,
  DiffChangeType,
  DocumentVersion,
  DiffLine,
  DiffHunk,
  DiffStats,
  MetadataChange,
  VersionComparisonResult,
  VersionRevertRecord,
  VersionHistoryOptions,
  VersionCompareOptions,
  RevertOptions,
  VersionCreate,
} from './types/version'
export {
  formatVersionLabel,
  isTextComparableType,
  calculateSizeDiff,
  sortVersions,
} from './types/version'

// Labels
export {
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_CLASSIFICATION_LABELS,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_CHANGE_TYPE_LABELS,
  getDocumentStatusLabel,
  getDocumentClassificationLabel,
  getDocumentCategoryLabel,
  getDocumentChangeTypeLabel,
  CLASSIFICATION_COLORS,
  STATUS_COLORS,
} from './types/labels'

// ============================================================================
// Repository
// ============================================================================

export {
  documentRepository,
  type DocumentRepository,
  type DocumentListResponse,
  type VersionListResponse,
} from './repositories/document.repository'

// ============================================================================
// Service
// ============================================================================

export { documentService, type DocumentService } from './services/document.service'

// ============================================================================
// Hooks
// ============================================================================

export {
  // Query Keys
  documentKeys,
  // Document Hooks
  useDocuments,
  useDocument,
  useUploadDocument,
  useUpdateDocument,
  useArchiveDocument,
  // Version Hooks
  useDocumentVersions,
  useUploadVersion,
  useVersionComparison,
  useRevertVersion,
  // Linked Documents Hook
  useLinkedDocuments,
  // Utility Hooks
  useInvalidateDocuments,
} from './hooks/useDocuments'
