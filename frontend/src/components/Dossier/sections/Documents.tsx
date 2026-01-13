/**
 * Documents Section Component (Feature 028 - T060)
 *
 * Displays polymorphic documents attached to any entity type/entity_id.
 * Reusable across all 6 dossier types. Mobile-first with file upload and RTL support.
 * Includes in-browser preview for PDF, images, and other document types.
 * Now includes document classification with field-level access control.
 *
 * @example
 * ```tsx
 * <Documents entityType="dossier" entityId={dossier.id} />
 * ```
 */

import { useTranslation } from 'react-i18next'
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  Calendar,
  FileType,
  Image as ImageIcon,
  FileSpreadsheet,
  History,
  Shield,
  Lock,
  FilePlus,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, memo, useCallback } from 'react'
import { supabase } from '@/lib/supabase-client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DocumentPreviewModal } from '@/components/document-preview'
import { DocumentVersionModal } from '@/components/document-versions'
import {
  ClassificationBadge,
  ClassificationChangeDialog,
} from '@/components/document-classification'
import { TemplateSelectionDialog } from '@/components/document-templates'
import { SmartImportSuggestion } from '@/components/smart-import'
import {
  useDocumentClassificationManager,
  useUserClearance,
} from '@/hooks/useDocumentClassification'
import { isPreviewable, getFileTypeFromMime } from '@/types/document-preview.types'
import type { PreviewDocument } from '@/types/document-preview.types'
import type {
  DocumentClassification,
  ClassifiedDocument,
} from '@/types/document-classification.types'
import { canAccessClassification } from '@/types/document-classification.types'

interface Document {
  id: string
  entity_type: string
  entity_id: string
  file_name: string
  file_path: string
  mime_type: string
  size_bytes: number
  uploaded_at: string
  uploaded_by?: string
  classification?: DocumentClassification
  classification_label?: string
  can_download?: boolean
  handling_instructions?: string
  declassification_date?: string
}

interface DocumentsProps {
  /**
   * Entity type (e.g., 'dossier', 'position', 'mou')
   */
  entityType: string
  /**
   * Entity ID
   */
  entityId: string
  /**
   * Optional filter by MIME type
   */
  mimeTypeFilter?: string
  /**
   * Allow file upload
   */
  allowUpload?: boolean
  /**
   * Allow file delete
   */
  allowDelete?: boolean
  /**
   * Allow document preview
   */
  allowPreview?: boolean
  /**
   * Allow version history viewing
   */
  allowVersionHistory?: boolean
  /**
   * Allow classification changes (requires sufficient clearance)
   */
  allowClassificationChange?: boolean
  /**
   * Show classification badges on documents
   */
  showClassification?: boolean
  /**
   * Optional CSS class for container
   */
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
 * Format date in localized format
 */
function formatDate(dateString: string, locale: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateString
  }
}

/**
 * Get icon for MIME type
 */
function getFileTypeIcon(mimeType: string): React.ReactNode {
  const fileType = getFileTypeFromMime(mimeType)
  switch (fileType) {
    case 'image':
      return <ImageIcon className="h-4 w-4 text-blue-500" />
    case 'pdf':
      return <FileText className="h-4 w-4 text-red-500" />
    case 'word':
      return <FileText className="h-4 w-4 text-blue-600" />
    case 'excel':
      return <FileSpreadsheet className="h-4 w-4 text-green-600" />
    case 'text':
      return <FileType className="h-4 w-4 text-gray-500" />
    default:
      return <FileText className="h-4 w-4 text-muted-foreground" />
  }
}

/**
 * Document card component with classification support (memoized for performance)
 */
const DocumentCard = memo(
  ({
    document: doc,
    isRTL,
    locale,
    userClearance,
    allowDelete,
    allowPreview,
    allowVersionHistory,
    allowClassificationChange,
    showClassification,
    onDelete,
    onDownload,
    onPreview,
    onViewVersions,
    onChangeClassification,
  }: {
    document: Document
    isRTL: boolean
    locale: string
    userClearance: number
    allowDelete: boolean
    allowPreview: boolean
    allowVersionHistory: boolean
    allowClassificationChange: boolean
    showClassification: boolean
    onDelete: (id: string) => void
    onDownload: (doc: Document) => void
    onPreview: (doc: Document) => void
    onViewVersions: (doc: Document) => void
    onChangeClassification: (doc: Document) => void
  }) => {
    const { t } = useTranslation('document-preview')
    const { t: tVersions } = useTranslation('document-versions')
    const { t: tClassification } = useTranslation('document-classification')
    const canPreview = isPreviewable(doc.mime_type)

    // Check if user can download based on classification
    const classification = doc.classification || 'internal'
    const canDownload =
      doc.can_download !== undefined
        ? doc.can_download
        : canAccessClassification(userClearance, classification)

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-start gap-2">
                {getFileTypeIcon(doc.mime_type)}
                <h4 className="text-sm sm:text-base font-semibold text-foreground break-all">
                  {doc.file_name}
                </h4>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {formatFileSize(doc.size_bytes)}
                </Badge>

                {/* Classification badge */}
                {showClassification && (
                  <ClassificationBadge
                    classification={classification}
                    size="sm"
                    showTooltip={true}
                  />
                )}

                {canPreview && (
                  <Badge variant="secondary" className="text-xs">
                    {t('actions.preview', 'Previewable')}
                  </Badge>
                )}

                {/* Download restricted indicator */}
                {!canDownload && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="destructive" className="text-xs flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        {tClassification('documentCard.accessRestricted', 'Restricted')}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent dir={isRTL ? 'rtl' : 'ltr'}>
                      {tClassification(
                        'accessDenied.description',
                        'You do not have the required clearance level to download this document.',
                      )}
                    </TooltipContent>
                  </Tooltip>
                )}

                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                  {formatDate(doc.uploaded_at, locale)}
                </span>
              </div>

              {/* Handling instructions for authorized users */}
              {doc.handling_instructions && canDownload && (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {doc.handling_instructions}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Classification change button */}
              {allowClassificationChange && userClearance >= 2 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onChangeClassification(doc)}
                  className="flex items-center gap-2"
                  title={tClassification(
                    'documentCard.changeClassification',
                    'Change Classification',
                  )}
                >
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {tClassification('documentCard.changeClassification', 'Classify')}
                  </span>
                </Button>
              )}

              {allowVersionHistory && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewVersions(doc)}
                  className="flex items-center gap-2"
                  title={tVersions('history.title', 'Version History')}
                >
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">{tVersions('history.title', 'History')}</span>
                </Button>
              )}
              {allowPreview && canPreview && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPreview(doc)}
                  className="flex items-center gap-2"
                  title={t('actions.preview', 'Preview')}
                >
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('actions.preview', 'Preview')}</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload(doc)}
                className="flex items-center gap-2"
                disabled={!canDownload}
                title={
                  canDownload
                    ? t('actions.download', 'Download')
                    : tClassification('documentCard.accessRestricted', 'Restricted')
                }
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">{t('actions.download', 'Download')}</span>
              </Button>
              {allowDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(doc.id)}
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  title={t('actions.delete', 'Delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  },
)
DocumentCard.displayName = 'DocumentCard'

/**
 * Shared Documents Section Component
 *
 * Displays documents for any entity type with upload/delete/preview capabilities
 * and classification-based access control
 */
export function Documents({
  entityType,
  entityId,
  mimeTypeFilter,
  allowUpload = false,
  allowDelete = false,
  allowPreview = true,
  allowVersionHistory = true,
  allowClassificationChange = false,
  showClassification = true,
  className = '',
}: DocumentsProps) {
  const { t, i18n } = useTranslation('dossier')
  const { t: tPreview } = useTranslation('document-preview')
  const { t: tClassification } = useTranslation('document-classification')
  const { t: tTemplates } = useTranslation('document-templates')
  const isRTL = i18n.language === 'ar'
  const queryClient = useQueryClient()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null)
  const [previewDocument, setPreviewDocument] = useState<PreviewDocument | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false)
  const [versionHistoryDocument, setVersionHistoryDocument] = useState<Document | null>(null)
  const [classificationDialogOpen, setClassificationDialogOpen] = useState(false)
  const [classificationDocument, setClassificationDocument] = useState<ClassifiedDocument | null>(
    null,
  )
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)

  // Get user clearance level
  const { data: userClearance = 1 } = useUserClearance()

  // Fetch documents with classification info
  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', entityType, entityId, mimeTypeFilter],
    queryFn: async () => {
      let query = supabase
        .from('documents')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)

      if (mimeTypeFilter) {
        query = query.eq('mime_type', mimeTypeFilter)
      }

      const { data, error } = await query.order('uploaded_at', { ascending: false })

      if (error) throw error
      return data as Document[]
    },
  })

  // Classification change mutation
  const changeClassificationMutation = useMutation({
    mutationFn: async ({
      documentId,
      newClassification,
      reason,
    }: {
      documentId: string
      newClassification: DocumentClassification
      reason: string
    }) => {
      const { data, error } = await supabase.functions.invoke('document-classification', {
        body: {
          action: 'change',
          documentId,
          newClassification,
          reason,
        },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', entityType, entityId] })
      setClassificationDialogOpen(false)
      setClassificationDocument(null)
    },
  })

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase.from('documents').delete().eq('id', documentId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', entityType, entityId] })
    },
  })

  // Handle delete confirmation
  const handleDeleteClick = useCallback((id: string) => {
    setDocumentToDelete(id)
    setDeleteDialogOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(() => {
    if (documentToDelete) {
      deleteMutation.mutate(documentToDelete)
      setDeleteDialogOpen(false)
      setDocumentToDelete(null)
    }
  }, [documentToDelete, deleteMutation])

  // Handle document download
  const handleDownload = useCallback(async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage.from('documents').download(doc.file_path)
      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
    }
  }, [])

  // Handle document preview
  const handlePreview = useCallback((doc: Document) => {
    const previewDoc: PreviewDocument = {
      id: doc.id,
      file_name: doc.file_name,
      file_path: doc.file_path,
      mime_type: doc.mime_type,
      size_bytes: doc.size_bytes,
      uploaded_at: doc.uploaded_at,
      uploaded_by: doc.uploaded_by,
      entity_type: doc.entity_type,
      entity_id: doc.entity_id,
    }
    setPreviewDocument(previewDoc)
    setPreviewOpen(true)
  }, [])

  // Handle view version history
  const handleViewVersions = useCallback((doc: Document) => {
    setVersionHistoryDocument(doc)
    setVersionHistoryOpen(true)
  }, [])

  // Handle classification change
  const handleChangeClassification = useCallback((doc: Document) => {
    const classifiedDoc: ClassifiedDocument = {
      id: doc.id,
      entity_type: doc.entity_type,
      entity_id: doc.entity_id,
      file_name: doc.file_name,
      file_path: doc.file_path,
      mime_type: doc.mime_type,
      size_bytes: doc.size_bytes,
      uploaded_at: doc.uploaded_at,
      uploaded_by: doc.uploaded_by,
      classification: doc.classification || 'internal',
      can_download: doc.can_download ?? true,
    }
    setClassificationDocument(classifiedDoc)
    setClassificationDialogOpen(true)
  }, [])

  // Handle classification submit
  const handleClassificationSubmit = useCallback(
    async (documentId: string, newClassification: DocumentClassification, reason: string) => {
      await changeClassificationMutation.mutateAsync({
        documentId,
        newClassification,
        reason,
      })
    },
    [changeClassificationMutation],
  )

  // Handle template document created
  const handleTemplateDocumentCreated = useCallback(() => {
    // Refresh documents list after a templated document is created
    queryClient.invalidateQueries({ queryKey: ['documents', entityType, entityId] })
    setTemplateDialogOpen(false)
  }, [queryClient, entityType, entityId])

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center py-12 sm:py-16 ${className}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="text-center">
          <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-sm sm:text-base text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  // Handle smart import complete
  const handleSmartImportComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['documents', entityType, entityId] })
  }, [queryClient, entityType, entityId])

  // Empty state
  if (!documents || documents.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center py-8 sm:py-12 text-center ${className}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="mb-4 sm:mb-6">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          </div>
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
          {t('section.documentsEmpty')}
        </h3>

        <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-6 px-4">
          {t('section.documentsEmptyDescription')}
        </p>

        {allowUpload && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 me-2" />
              {t('actions.uploadDocument')}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setTemplateDialogOpen(true)}>
              <FilePlus className="h-4 w-4 me-2" />
              {tTemplates('actions.createFromTemplate', 'Create from Template')}
            </Button>
          </div>
        )}

        {/* Smart Import Suggestion */}
        <SmartImportSuggestion
          section="documents"
          entityId={entityId}
          entityType={entityType}
          onImportComplete={handleSmartImportComplete}
          className="w-full max-w-lg"
        />

        {/* Template Selection Dialog for empty state */}
        <TemplateSelectionDialog
          open={templateDialogOpen}
          onOpenChange={setTemplateDialogOpen}
          entityType={entityType}
          entityId={entityId}
          onDocumentCreated={handleTemplateDocumentCreated}
        />
      </div>
    )
  }

  // Documents list
  return (
    <div className={className} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Upload and Template buttons */}
      {allowUpload && (
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <Upload className="h-4 w-4 me-2" />
            {t('actions.uploadDocument')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => setTemplateDialogOpen(true)}
          >
            <FilePlus className="h-4 w-4 me-2" />
            {tTemplates('actions.createFromTemplate', 'Create from Template')}
          </Button>
        </div>
      )}

      {/* Documents grid */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {documents.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            isRTL={isRTL}
            locale={i18n.language}
            userClearance={userClearance}
            allowDelete={allowDelete}
            allowPreview={allowPreview}
            allowVersionHistory={allowVersionHistory}
            allowClassificationChange={allowClassificationChange}
            showClassification={showClassification}
            onDelete={handleDeleteClick}
            onDownload={handleDownload}
            onPreview={handlePreview}
            onViewVersions={handleViewVersions}
            onChangeClassification={handleChangeClassification}
          />
        ))}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.deleteDocument.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.deleteDocument.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground"
            >
              {t('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        document={previewDocument}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        allowDownload={true}
        showAnnotations={false}
        allowAnnotate={false}
      />

      {/* Document Version History Modal */}
      {versionHistoryDocument && (
        <DocumentVersionModal
          documentId={versionHistoryDocument.id}
          documentName={versionHistoryDocument.file_name}
          open={versionHistoryOpen}
          onOpenChange={setVersionHistoryOpen}
        />
      )}

      {/* Classification Change Dialog */}
      <ClassificationChangeDialog
        document={classificationDocument}
        open={classificationDialogOpen}
        onOpenChange={setClassificationDialogOpen}
        onSubmit={handleClassificationSubmit}
        userClearance={userClearance}
        isLoading={changeClassificationMutation.isPending}
      />

      {/* Template Selection Dialog */}
      <TemplateSelectionDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        entityType={entityType}
        entityId={entityId}
        onDocumentCreated={handleTemplateDocumentCreated}
      />
    </div>
  )
}
