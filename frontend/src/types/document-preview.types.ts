/**
 * Document Preview Types
 *
 * Types for in-browser document preview functionality including
 * PDF viewing, image preview, thumbnails, and annotations.
 */

/**
 * Supported preview file types
 */
export type PreviewableFileType = 'pdf' | 'image' | 'word' | 'excel' | 'text' | 'unsupported'

/**
 * MIME type mappings for previewable files
 */
export const PREVIEWABLE_MIME_TYPES = {
  pdf: ['application/pdf'],
  image: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
  ],
  word: [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  excel: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  text: ['text/plain', 'text/csv', 'text/markdown'],
} as const

/**
 * Document preview status
 */
export type PreviewStatus = 'idle' | 'loading' | 'ready' | 'error'

/**
 * Thumbnail size presets
 */
export type ThumbnailSize = 'small' | 'medium' | 'large'

export const THUMBNAIL_DIMENSIONS: Record<ThumbnailSize, { width: number; height: number }> = {
  small: { width: 80, height: 80 },
  medium: { width: 160, height: 160 },
  large: { width: 320, height: 320 },
}

/**
 * Annotation types
 */
export type AnnotationType = 'highlight' | 'comment' | 'drawing' | 'text'

/**
 * Annotation interface
 */
export interface Annotation {
  id: string
  document_id: string
  type: AnnotationType
  page?: number
  position: {
    x: number
    y: number
    width?: number
    height?: number
  }
  content?: string
  color?: string
  created_by: string
  created_at: string
  updated_at?: string
}

/**
 * Cached thumbnail metadata
 */
export interface ThumbnailCache {
  document_id: string
  storage_path: string
  size: ThumbnailSize
  generated_at: string
  expires_at: string
  checksum: string
}

/**
 * Document preview state
 */
export interface DocumentPreviewState {
  document_id: string
  file_url: string | null
  thumbnail_url: string | null
  status: PreviewStatus
  error: string | null
  current_page: number
  total_pages: number
  zoom_level: number
  annotations: Annotation[]
  file_type: PreviewableFileType
}

/**
 * Preview options
 */
export interface PreviewOptions {
  show_annotations?: boolean
  allow_download?: boolean
  allow_print?: boolean
  allow_annotate?: boolean
  initial_zoom?: number
  initial_page?: number
  cache_thumbnails?: boolean
  thumbnail_size?: ThumbnailSize
}

/**
 * PDF viewer specific options
 */
export interface PDFViewerOptions {
  show_page_navigation?: boolean
  show_toolbar?: boolean
  show_thumbnails_sidebar?: boolean
  fit_mode?: 'width' | 'height' | 'page'
  rotation?: 0 | 90 | 180 | 270
}

/**
 * Image viewer specific options
 */
export interface ImageViewerOptions {
  enable_zoom?: boolean
  enable_pan?: boolean
  enable_rotate?: boolean
  min_zoom?: number
  max_zoom?: number
  show_controls?: boolean
}

/**
 * Document info for preview
 */
export interface PreviewDocument {
  id: string
  file_name: string
  file_path: string
  mime_type: string
  size_bytes: number
  uploaded_at: string
  uploaded_by?: string
  entity_type?: string
  entity_id?: string
}

/**
 * Helper to determine file type from MIME type
 */
export function getFileTypeFromMime(mimeType: string): PreviewableFileType {
  for (const [type, mimes] of Object.entries(PREVIEWABLE_MIME_TYPES)) {
    if ((mimes as readonly string[]).includes(mimeType)) {
      return type as PreviewableFileType
    }
  }
  return 'unsupported'
}

/**
 * Check if a file type is previewable
 */
export function isPreviewable(mimeType: string): boolean {
  return getFileTypeFromMime(mimeType) !== 'unsupported'
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMime(mimeType: string): string {
  const extensionMap: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/bmp': 'bmp',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'text/plain': 'txt',
    'text/csv': 'csv',
    'text/markdown': 'md',
  }
  return extensionMap[mimeType] || ''
}

/**
 * Thumbnail generation request
 */
export interface ThumbnailRequest {
  document_id: string
  storage_path: string
  size: ThumbnailSize
  force_regenerate?: boolean
}

/**
 * Thumbnail generation response
 */
export interface ThumbnailResponse {
  document_id: string
  thumbnail_url: string
  size: ThumbnailSize
  cached: boolean
  generated_at: string
}
