/**
 * DocumentsSection Component
 * Feature: Everything about [Dossier] comprehensive view
 *
 * Displays documents linked to the dossier: positions, MOUs, briefs, attachments.
 * Mobile-first, RTL-supported.
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import {
  FileStack,
  FileText,
  FileSignature,
  ScrollText,
  Paperclip,
  Download,
  Eye,
  Calendar,
  ChevronRight,
  Shield,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type {
  DocumentsSectionProps,
  DossierDocument,
  DossierDocumentType,
} from '@/types/dossier-overview.types'

/**
 * Get icon for document type
 */
function getDocumentTypeIcon(type: DossierDocumentType) {
  const icons: Record<DossierDocumentType, React.ElementType> = {
    position: FileSignature,
    mou: ScrollText,
    brief: FileText,
    attachment: Paperclip,
  }
  return icons[type] || FileText
}

/**
 * Format file size
 */
function formatFileSize(bytes: number | null): string {
  if (!bytes) return ''
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Document card component
 */
function DocumentCard({ document, isRTL }: { document: DossierDocument; isRTL: boolean }) {
  const { t } = useTranslation('dossier-overview')
  const Icon = getDocumentTypeIcon(document.document_type)

  const statusColors: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    template: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  }

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-lg bg-muted p-2">
            <Icon className="size-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="mb-1 line-clamp-2 text-sm font-semibold">
              {isRTL && document.title_ar ? document.title_ar : document.title_en}
            </h4>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {t(`documentType.${document.document_type}`)}
              </Badge>
              <Badge className={`text-xs ${statusColors[document.status] || statusColors.active}`}>
                {t(`documentStatus.${document.status}`, { defaultValue: document.status })}
              </Badge>
              {document.classification && (
                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                  <Shield className="size-3" />
                  {document.classification}
                </Badge>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="size-3" />
              {new Date(document.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
              {document.size_bytes && (
                <>
                  <span>•</span>
                  <span>{formatFileSize(document.size_bytes)}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {document.file_path && (
              <Button variant="ghost" size="icon" className="size-8">
                <Download className="size-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="size-8">
              <Eye className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Empty state component
 */
function EmptyState({ type, isRTL }: { type?: DossierDocumentType | 'all'; isRTL: boolean }) {
  const { t } = useTranslation('dossier-overview')

  return (
    <div className="py-6 text-center sm:py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mb-3 inline-block rounded-full bg-muted p-3">
        <FileStack className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">
        {type && type !== 'all' ? t(`documents.empty.${type}`) : t('documents.empty.all')}
      </p>
    </div>
  )
}

/**
 * Document list component
 */
function DocumentList({
  documents,
  isRTL,
  emptyType,
}: {
  documents: DossierDocument[]
  isRTL: boolean
  emptyType?: DossierDocumentType | 'all'
}) {
  if (documents.length === 0) {
    return <EmptyState type={emptyType} isRTL={isRTL} />
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {documents.map((doc) => (
        <DocumentCard key={doc.id} document={doc} isRTL={isRTL} />
      ))}
    </div>
  )
}

/**
 * Main DocumentsSection component
 */
export function DocumentsSection({
  data,
  dossierId,
  isLoading,
  isRTL = false,
  className = '',
}: DocumentsSectionProps) {
  const { t } = useTranslation('dossier-overview')

  // Combine all documents for the "All" tab
  const allDocuments = useMemo(() => {
    if (!data) return []
    return [...data.positions, ...data.mous, ...data.briefs, ...data.attachments].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  }, [data])

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.total_count === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <FileStack className="size-5" />
            {t('documents.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6">
          <EmptyState type="all" isRTL={isRTL} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <FileStack className="size-5" />
          {t('documents.title')}
          <Badge variant="secondary">{data.total_count}</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 pt-0 sm:p-6">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4 h-auto w-full flex-nowrap justify-start overflow-x-auto p-1">
            <TabsTrigger value="all" className="shrink-0 text-xs sm:text-sm">
              {t('documents.tabs.all')} ({allDocuments.length})
            </TabsTrigger>
            <TabsTrigger value="positions" className="shrink-0 text-xs sm:text-sm">
              <FileSignature className="me-1 size-4" />
              {t('documents.tabs.positions')} ({data.positions.length})
            </TabsTrigger>
            <TabsTrigger value="mous" className="shrink-0 text-xs sm:text-sm">
              <ScrollText className="me-1 size-4" />
              {t('documents.tabs.mous')} ({data.mous.length})
            </TabsTrigger>
            <TabsTrigger value="briefs" className="shrink-0 text-xs sm:text-sm">
              <FileText className="me-1 size-4" />
              {t('documents.tabs.briefs')} ({data.briefs.length})
            </TabsTrigger>
            <TabsTrigger value="attachments" className="shrink-0 text-xs sm:text-sm">
              <Paperclip className="me-1 size-4" />
              {t('documents.tabs.attachments')} ({data.attachments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <DocumentList documents={allDocuments} isRTL={isRTL} emptyType="all" />
          </TabsContent>

          <TabsContent value="positions" className="mt-0">
            <DocumentList documents={data.positions} isRTL={isRTL} emptyType="position" />
          </TabsContent>

          <TabsContent value="mous" className="mt-0">
            <DocumentList documents={data.mous} isRTL={isRTL} emptyType="mou" />
          </TabsContent>

          <TabsContent value="briefs" className="mt-0">
            <DocumentList documents={data.briefs} isRTL={isRTL} emptyType="brief" />
          </TabsContent>

          <TabsContent value="attachments" className="mt-0">
            <DocumentList documents={data.attachments} isRTL={isRTL} emptyType="attachment" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default DocumentsSection
