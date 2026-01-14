/**
 * Documents Module - Internal Types
 *
 * These types are internal to the Documents module.
 * Use the DTOs from core/contracts for inter-module communication.
 *
 * @module documents/types
 */

// ============================================================================
// Internal Entity Types
// ============================================================================

/**
 * Document entity as stored in the database
 */
export interface Document {
  id: string
  name_en: string
  name_ar?: string
  description_en?: string
  description_ar?: string
  document_type: DocumentType
  mime_type: string
  file_size: number
  file_path: string
  storage_bucket: string
  classification: DocumentClassification
  version_number: number
  is_latest_version: boolean
  parent_document_id?: string
  checksum?: string
  tags?: string[]
  metadata?: Record<string, unknown>
  created_by: string
  updated_by?: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

/**
 * Document version tracking
 */
export interface DocumentVersion {
  id: string
  document_id: string
  version_number: number
  file_path: string
  file_size: number
  checksum?: string
  change_summary?: string
  created_by: string
  created_at: string
}

/**
 * Document link to other entities
 */
export interface DocumentLink {
  id: string
  document_id: string
  linked_module: string
  linked_entity_type: string
  linked_entity_id: string
  link_type: DocumentLinkType
  notes?: string
  created_by: string
  created_at: string
}

// ============================================================================
// Enums and Constants
// ============================================================================

export type DocumentType =
  | 'report'
  | 'memo'
  | 'presentation'
  | 'spreadsheet'
  | 'image'
  | 'audio'
  | 'video'
  | 'pdf'
  | 'archive'
  | 'other'

export type DocumentClassification = 'public' | 'internal' | 'confidential' | 'restricted'

export type DocumentLinkType = 'reference' | 'attachment' | 'related' | 'supporting' | 'output'

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, { en: string; ar: string }> = {
  report: { en: 'Report', ar: 'تقرير' },
  memo: { en: 'Memo', ar: 'مذكرة' },
  presentation: { en: 'Presentation', ar: 'عرض تقديمي' },
  spreadsheet: { en: 'Spreadsheet', ar: 'جدول بيانات' },
  image: { en: 'Image', ar: 'صورة' },
  audio: { en: 'Audio', ar: 'صوت' },
  video: { en: 'Video', ar: 'فيديو' },
  pdf: { en: 'PDF', ar: 'بي دي إف' },
  archive: { en: 'Archive', ar: 'أرشيف' },
  other: { en: 'Other', ar: 'أخرى' },
}

export const DOCUMENT_CLASSIFICATION_LABELS: Record<
  DocumentClassification,
  { en: string; ar: string }
> = {
  public: { en: 'Public', ar: 'عام' },
  internal: { en: 'Internal', ar: 'داخلي' },
  confidential: { en: 'Confidential', ar: 'سري' },
  restricted: { en: 'Restricted', ar: 'مقيد' },
}

// ============================================================================
// Internal Query Types
// ============================================================================

export interface DocumentSearchParams {
  search?: string
  documentTypes?: DocumentType[]
  classifications?: DocumentClassification[]
  tags?: string[]
  createdBy?: string
  createdAfter?: string
  createdBefore?: string
  linkedModuleId?: string
  linkedEntityType?: string
  linkedEntityId?: string
  includeDeleted?: boolean
  limit?: number
  offset?: number
  cursor?: string
  sortBy?: 'name' | 'created_at' | 'updated_at' | 'file_size'
  sortDirection?: 'asc' | 'desc'
}

export interface DocumentCreateParams {
  name_en: string
  name_ar?: string
  description_en?: string
  description_ar?: string
  document_type: DocumentType
  classification: DocumentClassification
  file: File | Blob
  tags?: string[]
  metadata?: Record<string, unknown>
  linkedEntities?: Array<{
    moduleId: string
    entityType: string
    entityId: string
    linkType?: DocumentLinkType
  }>
}

export interface DocumentUpdateParams {
  name_en?: string
  name_ar?: string
  description_en?: string
  description_ar?: string
  classification?: DocumentClassification
  tags?: string[]
  metadata?: Record<string, unknown>
}

// ============================================================================
// Internal Response Types
// ============================================================================

export interface DocumentListResponse {
  documents: Document[]
  total: number
  limit: number
  offset?: number
  cursor?: string
  hasMore: boolean
}

export interface DocumentUploadResponse {
  document: Document
  uploadUrl?: string
  version: DocumentVersion
}

// ============================================================================
// Helper Functions
// ============================================================================

export function getDocumentTypeFromMime(mimeType: string): DocumentType {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'text/csv')
    return 'spreadsheet'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation'
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('compressed'))
    return 'archive'
  return 'other'
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
