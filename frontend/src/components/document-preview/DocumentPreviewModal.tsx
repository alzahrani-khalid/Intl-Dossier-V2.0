/**
 * DocumentPreviewModal Component
 *
 * Full-screen modal for previewing documents.
 * Supports PDF, images, and text files.
 * Mobile-first with gesture support and RTL compatibility.
 */
import { useCallback, useMemo, memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  File,
  Download,
  X,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ImagePreview } from './ImagePreview'
import { PDFPreview } from './PDFPreview'
import { DocumentAnnotation } from './DocumentAnnotation'
import { useDocumentPreview } from '@/hooks/useDocumentPreview'
import type {
  PreviewDocument,
  Annotation,
  PreviewableFileType,
} from '@/types/document-preview.types'
import { getFileTypeFromMime } from '@/types/document-preview.types'

interface DocumentPreviewModalProps {
  document: PreviewDocument | null
  open: boolean
  onOpenChange: (open: boolean) => void
  showAnnotations?: boolean
  allowAnnotate?: boolean
  allowDownload?: boolean
  onSaveAnnotations?: (annotations: Annotation[]) => void
  className?: string
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Get icon for file type
 */
function getFileTypeIcon(fileType: PreviewableFileType) {
  switch (fileType) {
    case 'pdf':
      return <FileText className="size-5 text-red-500" />
    case 'image':
      return <ImageIcon className="size-5 text-blue-500" />
    case 'excel':
      return <FileSpreadsheet className="size-5 text-green-500" />
    case 'word':
      return <FileText className="size-5 text-blue-600" />
    case 'text':
      return <FileText className="size-5 text-gray-500" />
    default:
      return <File className="size-5 text-gray-400" />
  }
}

/**
 * Text file preview component
 */
const TextPreview = memo(function TextPreview({
  content,
  onClose,
  onDownload,
}: {
  content: string
  onClose?: () => void
  onDownload?: () => void
}) {
  const { t, i18n } = useTranslation('document-preview')
  const isRTL = i18n.language === 'ar'

  return (
    <div className="flex h-full flex-col bg-gray-50 dark:bg-gray-900" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-2 border-b bg-white p-2 dark:bg-gray-800 sm:p-3">
        {onDownload && (
          <Button variant="ghost" size="sm" onClick={onDownload}>
            <Download className="me-2 size-4" />
            {t('actions.download', 'Download')}
          </Button>
        )}
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200">
          {content}
        </pre>
      </div>
    </div>
  )
})

/**
 * Unsupported file type component
 */
const UnsupportedPreview = memo(function UnsupportedPreview({
  document,
  onDownload,
  onClose,
}: {
  document: PreviewDocument
  onDownload?: () => void
  onClose?: () => void
}) {
  const { t, i18n } = useTranslation('document-preview')
  const isRTL = i18n.language === 'ar'

  return (
    <div
      className="flex h-full flex-col items-center justify-center p-6 text-center"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="mb-6">
        <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 sm:size-24">
          <AlertCircle className="size-10 text-gray-400 sm:size-12" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100 sm:text-xl">
          {t('unsupported.title', 'Preview Not Available')}
        </h3>
        <p className="max-w-md text-sm text-gray-500 dark:text-gray-400 sm:text-base">
          {t(
            'unsupported.description',
            'This file type cannot be previewed in the browser. You can download it to view locally.',
          )}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {onDownload && (
          <Button onClick={onDownload} className="min-w-[160px]">
            <Download className="me-2 size-4" />
            {t('actions.download', 'Download')}
          </Button>
        )}
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            {t('actions.close', 'Close')}
          </Button>
        )}
      </div>

      <div className="mt-6 text-xs text-gray-400">
        {document.mime_type || t('unknown', 'Unknown file type')}
      </div>
    </div>
  )
})

export const DocumentPreviewModal = memo(function DocumentPreviewModal({
  document,
  open,
  onOpenChange,
  showAnnotations = false,
  allowAnnotate = false,
  allowDownload = true,
  onSaveAnnotations,
  className,
}: DocumentPreviewModalProps) {
  const { t, i18n } = useTranslation('document-preview')
  const isRTL = i18n.language === 'ar'

  // Use the preview hook
  const {
    previewUrl,
    status,
    error,
    isPreviewable: canPreview,
    currentPage,
    totalPages,
    setCurrentPage,
    setTotalPages,
    downloadDocument,
  } = useDocumentPreview({ enabled: open && !!document })

  // Local annotations state
  const [annotations, setAnnotations] = useState<Annotation[]>([])

  // Memoized file type detection
  const detectedFileType = useMemo<PreviewableFileType>(() => {
    if (!document?.mime_type) return 'unsupported'
    return getFileTypeFromMime(document.mime_type)
  }, [document?.mime_type])

  // Text content state (for text files)
  const [textContent, setTextContent] = useState<string | null>(null)

  // Close handler
  const handleClose = useCallback(() => {
    onOpenChange(false)
    setTextContent(null)
    setAnnotations([])
  }, [onOpenChange])

  // Download handler
  const handleDownload = useCallback(async () => {
    if (!document) return
    try {
      await downloadDocument(document)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }, [document, downloadDocument])

  // Page change handler
  const handlePageChange = useCallback(
    (page: number, total: number) => {
      setCurrentPage(page)
      setTotalPages(total)
    },
    [setCurrentPage, setTotalPages],
  )

  // Annotation handlers
  const handleAddAnnotation = useCallback((annotation: Omit<Annotation, 'id' | 'created_at'>) => {
    const newAnnotation: Annotation = {
      ...annotation,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    }
    setAnnotations((prev) => [...prev, newAnnotation])
  }, [])

  const handleUpdateAnnotation = useCallback((id: string, updates: Partial<Annotation>) => {
    setAnnotations((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, ...updates, updated_at: new Date().toISOString() } : a,
      ),
    )
  }, [])

  const handleDeleteAnnotation = useCallback((id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const handleSaveAnnotations = useCallback(() => {
    onSaveAnnotations?.(annotations)
  }, [annotations, onSaveAnnotations])

  if (!document) return null

  const showPreviewable = canPreview && previewUrl

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-[95vw] max-h-[95vh] w-full h-full p-0 gap-0',
          'sm:max-w-[90vw] sm:max-h-[90vh]',
          'lg:max-w-[85vw] lg:max-h-[85vh]',
          className,
        )}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <DialogHeader className="shrink-0 border-b px-3 py-2 sm:px-4 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {getFileTypeIcon(detectedFileType)}
              <DialogTitle className="truncate text-sm sm:text-base">
                {document.file_name}
              </DialogTitle>
              <Badge variant="outline" className="hidden text-xs sm:inline-flex">
                {formatFileSize(document.size_bytes)}
              </Badge>
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              {previewUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(previewUrl, '_blank')}
                  className="size-8 p-0"
                  title={t('actions.openInNewTab', 'Open in new tab')}
                >
                  <ExternalLink className="size-4" />
                </Button>
              )}
              {allowDownload && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="size-8 p-0"
                  title={t('actions.download', 'Download')}
                >
                  <Download className="size-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="size-8 p-0"
                title={t('actions.close', 'Close')}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="relative flex-1 overflow-hidden">
          {/* Loading state */}
          {status === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <Skeleton className="mx-auto mb-4 size-16 rounded-full" />
                <Skeleton className="mx-auto h-4 w-32" />
              </div>
            </div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="p-4 text-center">
                <AlertCircle className="mx-auto mb-4 size-12 text-destructive" />
                <p className="text-destructive">
                  {error || t('errors.loadFailed', 'Failed to load preview')}
                </p>
                <Button variant="outline" className="mt-4" onClick={handleDownload}>
                  <Download className="me-2 size-4" />
                  {t('actions.downloadInstead', 'Download instead')}
                </Button>
              </div>
            </div>
          )}

          {/* Preview content */}
          {status === 'ready' && showPreviewable && (
            <div className="relative h-full">
              {/* PDF Preview */}
              {detectedFileType === 'pdf' && (
                <PDFPreview
                  src={previewUrl}
                  onClose={handleClose}
                  onDownload={handleDownload}
                  onPageChange={handlePageChange}
                  className="h-full"
                />
              )}

              {/* Image Preview */}
              {detectedFileType === 'image' && (
                <ImagePreview
                  src={previewUrl}
                  alt={document.file_name}
                  onClose={handleClose}
                  onDownload={handleDownload}
                  className="h-full"
                />
              )}

              {/* Text Preview */}
              {detectedFileType === 'text' && textContent && (
                <TextPreview
                  content={textContent}
                  onClose={handleClose}
                  onDownload={handleDownload}
                />
              )}

              {/* Annotation overlay */}
              {showAnnotations && (detectedFileType === 'pdf' || detectedFileType === 'image') && (
                <DocumentAnnotation
                  documentId={document.id}
                  currentPage={currentPage}
                  annotations={annotations}
                  onAddAnnotation={handleAddAnnotation}
                  onUpdateAnnotation={handleUpdateAnnotation}
                  onDeleteAnnotation={handleDeleteAnnotation}
                  onSave={onSaveAnnotations ? handleSaveAnnotations : undefined}
                  readOnly={!allowAnnotate}
                  className="absolute inset-0"
                />
              )}
            </div>
          )}

          {/* Unsupported file type */}
          {status === 'ready' && !showPreviewable && (
            <UnsupportedPreview
              document={document}
              onDownload={handleDownload}
              onClose={handleClose}
            />
          )}
        </div>

        {/* Footer with page info for PDFs */}
        {detectedFileType === 'pdf' && totalPages > 0 && (
          <div className="border-t px-3 py-2 text-center text-xs text-muted-foreground sm:px-4 sm:text-sm">
            {t('pdf.pageInfo', 'Page {{current}} of {{total}}', {
              current: currentPage,
              total: totalPages,
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
})

export default DocumentPreviewModal
