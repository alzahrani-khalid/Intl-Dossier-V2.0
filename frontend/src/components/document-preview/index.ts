/**
 * Document Preview Components
 *
 * In-browser document preview system with support for:
 * - PDF viewing with pagination
 * - Image preview with zoom/pan/rotate
 * - Document annotations (highlight, comment, draw, text)
 * - Thumbnail caching
 * - Mobile-first responsive design
 * - RTL support
 */

export { DocumentPreviewModal } from './DocumentPreviewModal'
export { ImagePreview } from './ImagePreview'
export { PDFPreview } from './PDFPreview'
export { DocumentAnnotation } from './DocumentAnnotation'

// Re-export types
export type {
  PreviewDocument,
  PreviewOptions,
  PDFViewerOptions,
  ImageViewerOptions,
  Annotation,
  AnnotationType,
  PreviewableFileType,
  ThumbnailSize,
} from '@/types/document-preview.types'

// Re-export utilities
export {
  getFileTypeFromMime,
  isPreviewable,
  getExtensionFromMime,
  PREVIEWABLE_MIME_TYPES,
  THUMBNAIL_DIMENSIONS,
} from '@/types/document-preview.types'
