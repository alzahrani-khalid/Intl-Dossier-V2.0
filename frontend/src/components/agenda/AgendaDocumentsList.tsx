/**
 * AgendaDocumentsList Component
 * Feature: meeting-agenda-builder
 *
 * Document management for meeting agendas with:
 * - Upload/remove documents
 * - Link documents to specific agenda items
 * - Document type categorization
 * - File preview and download
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDropzone } from 'react-dropzone'
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Eye,
  Paperclip,
  Presentation,
  FileSpreadsheet,
  Image,
  File,
  MoreHorizontal,
  Plus,
  Link,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAddAgendaDocument, useRemoveAgendaDocument } from '@/hooks/useMeetingAgenda'
import type { AgendaDocument, AgendaItem, AgendaDocumentType } from '@/types/meeting-agenda.types'
import { AGENDA_DOCUMENT_TYPES } from '@/types/meeting-agenda.types'
import { cn } from '@/lib/utils'

interface AgendaDocumentsListProps {
  agendaId: string
  documents: AgendaDocument[]
  items: AgendaItem[]
  canEdit: boolean
}

// File type icons
const FILE_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-5 w-5 text-red-500" />,
  doc: <FileText className="h-5 w-5 text-blue-500" />,
  docx: <FileText className="h-5 w-5 text-blue-500" />,
  xls: <FileSpreadsheet className="h-5 w-5 text-green-500" />,
  xlsx: <FileSpreadsheet className="h-5 w-5 text-green-500" />,
  ppt: <Presentation className="h-5 w-5 text-orange-500" />,
  pptx: <Presentation className="h-5 w-5 text-orange-500" />,
  jpg: <Image className="h-5 w-5 text-purple-500" />,
  jpeg: <Image className="h-5 w-5 text-purple-500" />,
  png: <Image className="h-5 w-5 text-purple-500" />,
  gif: <Image className="h-5 w-5 text-purple-500" />,
  default: <File className="h-5 w-5 text-gray-500" />,
}

// Document type colors
const DOC_TYPE_COLORS: Record<AgendaDocumentType, { bg: string; text: string }> = {
  attachment: { bg: 'bg-gray-100', text: 'text-gray-700' },
  presentation: { bg: 'bg-orange-100', text: 'text-orange-700' },
  reference: { bg: 'bg-blue-100', text: 'text-blue-700' },
  handout: { bg: 'bg-green-100', text: 'text-green-700' },
  supporting_document: { bg: 'bg-purple-100', text: 'text-purple-700' },
  agenda_pdf: { bg: 'bg-red-100', text: 'text-red-700' },
}

// Format file size
function formatFileSize(bytes?: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Get file extension
function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export function AgendaDocumentsList({
  agendaId,
  documents,
  items,
  canEdit,
}: AgendaDocumentsListProps) {
  const { t, i18n } = useTranslation('agenda')
  const isRTL = i18n.language === 'ar'

  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadData, setUploadData] = useState({
    title_en: '',
    title_ar: '',
    document_type: 'attachment' as AgendaDocumentType,
    agenda_item_id: '',
    shared_before_meeting: false,
  })

  // Mutations
  const addDocument = useAddAgendaDocument()
  const removeDocument = useRemoveAgendaDocument()

  // File drop handler
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setUploadFile(file)
      setUploadData((prev) => ({
        ...prev,
        title_en: file.name.replace(/\.[^/.]+$/, ''),
      }))
      setShowUploadDialog(true)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: !canEdit,
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  })

  // Group documents by item
  const groupedDocuments = documents.reduce(
    (acc, doc) => {
      const key = doc.agenda_item_id || 'general'
      if (!acc[key]) acc[key] = []
      acc[key].push(doc)
      return acc
    },
    {} as Record<string, AgendaDocument[]>,
  )

  // Get item title by ID
  const getItemTitle = (itemId: string) => {
    const item = items.find((i) => i.id === itemId)
    if (!item) return t('unknownItem')
    return isRTL ? item.title_ar || item.title_en : item.title_en
  }

  // Handle upload
  const handleUpload = async () => {
    if (!uploadFile) return

    // In a real implementation, you'd upload to Supabase Storage first
    // For now, we'll just simulate with placeholder data
    const storagePath = `agendas/${agendaId}/documents/${uploadFile.name}`

    await addDocument.mutateAsync({
      agendaId,
      input: {
        agenda_id: agendaId,
        agenda_item_id: uploadData.agenda_item_id || undefined,
        title_en: uploadData.title_en,
        title_ar: uploadData.title_ar || undefined,
        storage_path: storagePath,
        file_name: uploadFile.name,
        file_type: getFileExtension(uploadFile.name),
        file_size_bytes: uploadFile.size,
        mime_type: uploadFile.type,
        document_type: uploadData.document_type,
        shared_before_meeting: uploadData.shared_before_meeting,
      },
    })

    setShowUploadDialog(false)
    setUploadFile(null)
    setUploadData({
      title_en: '',
      title_ar: '',
      document_type: 'attachment',
      agenda_item_id: '',
      shared_before_meeting: false,
    })
  }

  // Handle remove
  const handleRemove = async (documentId: string) => {
    if (confirm(t('confirmRemoveDocument'))) {
      await removeDocument.mutateAsync({ agendaId, documentId })
    }
  }

  // Get display title
  const getDisplayTitle = (doc: AgendaDocument) => {
    return isRTL ? doc.title_ar || doc.title_en : doc.title_en
  }

  // Render document card
  const renderDocument = (doc: AgendaDocument) => {
    const ext = getFileExtension(doc.file_name)
    const icon = FILE_ICONS[ext] || FILE_ICONS.default
    const typeColors = DOC_TYPE_COLORS[doc.document_type]

    return (
      <div
        key={doc.id}
        className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
      >
        {/* Icon */}
        <div className="flex-shrink-0">{icon}</div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{getDisplayTitle(doc)}</span>
            <Badge variant="outline" className={cn(typeColors.bg, typeColors.text, 'text-xs')}>
              {t(`documentTypes.${doc.document_type}`)}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{doc.file_name}</span>
            {doc.file_size_bytes && <span>• {formatFileSize(doc.file_size_bytes)}</span>}
            {doc.shared_before_meeting && (
              <Badge variant="outline" className="text-xs">
                {t('sharedBeforeMeeting')}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="min-h-9 min-w-9"
            onClick={() => {
              // Open document preview/download
              window.open(doc.storage_path, '_blank')
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="min-h-9 min-w-9"
            onClick={() => {
              // Download document
              const link = document.createElement('a')
              link.href = doc.storage_path
              link.download = doc.file_name
              link.click()
            }}
          >
            <Download className="h-4 w-4" />
          </Button>

          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="min-h-9 min-w-9">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                <DropdownMenuItem
                  onClick={() => handleRemove(doc.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                  {t('remove')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Paperclip className="h-5 w-5" />
            {t('documents')}
            <Badge variant="secondary">{documents.length}</Badge>
          </CardTitle>

          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUploadDialog(true)}
              className="min-h-10"
            >
              <Upload className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
              {t('uploadDocument')}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Drop zone */}
        {canEdit && (
          <div
            {...getRootProps()}
            className={cn(
              'cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors',
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
            )}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              {isDragActive ? t('dropFileHere') : t('dragOrClickToUpload')}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t('maxFileSize')}</p>
          </div>
        )}

        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">{t('noDocuments')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* General documents */}
            {groupedDocuments.general && groupedDocuments.general.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  {t('generalDocuments')}
                </h4>
                <div className="space-y-2">{groupedDocuments.general.map(renderDocument)}</div>
              </div>
            )}

            {/* Documents by item */}
            {Object.entries(groupedDocuments)
              .filter(([key]) => key !== 'general')
              .map(([itemId, docs]) => (
                <div key={itemId} className="space-y-2">
                  <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Link className="h-4 w-4" />
                    {getItemTitle(itemId)}
                  </h4>
                  <div className="space-y-2">{docs.map(renderDocument)}</div>
                </div>
              ))}
          </div>
        )}
      </CardContent>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{t('uploadDocument')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* File info */}
            {uploadFile && (
              <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                {FILE_ICONS[getFileExtension(uploadFile.name)] || FILE_ICONS.default}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{uploadFile.name}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(uploadFile.size)}</p>
                </div>
              </div>
            )}

            {/* Title EN */}
            <div className="space-y-2">
              <Label>{t('titleEn')} *</Label>
              <Input
                value={uploadData.title_en}
                onChange={(e) => setUploadData({ ...uploadData, title_en: e.target.value })}
                placeholder={t('enterTitleEn')}
                className="min-h-11"
              />
            </div>

            {/* Title AR */}
            <div className="space-y-2">
              <Label>{t('titleAr')}</Label>
              <Input
                value={uploadData.title_ar}
                onChange={(e) => setUploadData({ ...uploadData, title_ar: e.target.value })}
                placeholder={t('enterTitleAr')}
                dir="rtl"
                className="min-h-11"
              />
            </div>

            {/* Document type */}
            <div className="space-y-2">
              <Label>{t('documentType')}</Label>
              <Select
                value={uploadData.document_type}
                onValueChange={(v) =>
                  setUploadData({ ...uploadData, document_type: v as AgendaDocumentType })
                }
              >
                <SelectTrigger className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AGENDA_DOCUMENT_TYPES.filter((t) => t !== 'agenda_pdf').map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`documentTypes.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Link to item */}
            <div className="space-y-2">
              <Label>{t('linkToItem')}</Label>
              <Select
                value={uploadData.agenda_item_id}
                onValueChange={(v) => setUploadData({ ...uploadData, agenda_item_id: v })}
              >
                <SelectTrigger className="min-h-11">
                  <SelectValue placeholder={t('selectItem')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('noItem')}</SelectItem>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {isRTL ? item.title_ar || item.title_en : item.title_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadDialog(false)
                setUploadFile(null)
              }}
              className="min-h-11"
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!uploadFile || !uploadData.title_en || addDocument.isPending}
              className="min-h-11"
            >
              <Upload className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
              {t('upload')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default AgendaDocumentsList
