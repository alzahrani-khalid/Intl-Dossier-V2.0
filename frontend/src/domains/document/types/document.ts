/**
 * Document Context - Domain Types
 *
 * Core domain types for the Document bounded context.
 * These types represent documents and their versions.
 */

import type { AuditInfo, DossierReference } from '@/domains/shared'

// ============================================================================
// Document Classification Types
// ============================================================================

/**
 * Document status values
 */
export type DocumentStatus = 'active' | 'archived' | 'draft' | 'pending_review'

/**
 * Document classification levels
 */
export type DocumentClassification =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted'
  | 'secret'

/**
 * Document categories
 */
export type DocumentCategory =
  | 'agreement'
  | 'report'
  | 'correspondence'
  | 'presentation'
  | 'minutes'
  | 'policy'
  | 'legal'
  | 'financial'
  | 'technical'
  | 'other'

// ============================================================================
// Document Domain Model
// ============================================================================

/**
 * Document entity
 */
export interface Document extends AuditInfo {
  id: string
  title_en: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  category: DocumentCategory
  classification: DocumentClassification
  status: DocumentStatus
  file_name: string
  file_path: string
  mime_type: string
  size_bytes: number
  checksum?: string
  current_version: number
  tags?: string[]
  metadata?: Record<string, unknown>
  // Optional linked dossier reference
  linked_dossier?: DossierReference
  linked_dossier_id?: string
}

/**
 * Document list item (compact version for lists)
 */
export interface DocumentListItem {
  id: string
  title_en: string
  title_ar?: string
  category: DocumentCategory
  classification: DocumentClassification
  status: DocumentStatus
  file_name: string
  mime_type: string
  size_bytes: number
  current_version: number
  created_at: string
  updated_at: string
  linked_dossier_id?: string
  linked_dossier_name_en?: string
  linked_dossier_name_ar?: string
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * Input for creating a new document
 */
export interface DocumentCreate {
  title_en: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  category: DocumentCategory
  classification?: DocumentClassification
  tags?: string[]
  metadata?: Record<string, unknown>
  linked_dossier_id?: string
}

/**
 * Input for updating a document
 */
export interface DocumentUpdate {
  title_en?: string
  title_ar?: string
  description_en?: string
  description_ar?: string
  category?: DocumentCategory
  classification?: DocumentClassification
  status?: DocumentStatus
  tags?: string[]
  metadata?: Record<string, unknown>
}

/**
 * Search parameters for documents
 */
export interface DocumentSearchParams {
  search?: string
  category?: DocumentCategory
  classification?: DocumentClassification
  status?: DocumentStatus
  linked_dossier_id?: string
  mime_type?: string
  from_date?: string
  to_date?: string
  page?: number
  limit?: number
}

/**
 * Document upload response
 */
export interface DocumentUploadResponse {
  document: Document
  upload_url?: string
  message_en: string
  message_ar: string
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if document is an image
 */
export function isImageDocument(doc: Document | DocumentListItem): boolean {
  return doc.mime_type.startsWith('image/')
}

/**
 * Check if document is a PDF
 */
export function isPdfDocument(doc: Document | DocumentListItem): boolean {
  return doc.mime_type === 'application/pdf'
}

/**
 * Check if document is a text-based file
 */
export function isTextDocument(doc: Document | DocumentListItem): boolean {
  const textTypes = [
    'text/plain',
    'text/csv',
    'text/markdown',
    'text/html',
    'application/json',
    'application/xml',
    'text/xml',
  ]
  return textTypes.includes(doc.mime_type) || doc.mime_type.startsWith('text/')
}

/**
 * Check if document is an office document
 */
export function isOfficeDocument(doc: Document | DocumentListItem): boolean {
  const officeTypes = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ]
  return officeTypes.includes(doc.mime_type)
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
