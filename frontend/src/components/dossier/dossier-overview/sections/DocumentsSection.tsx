/**
 * DocumentsSection Component
 * Feature: Everything about [Dossier] comprehensive view
 *
 * Displays documents linked to the dossier: positions, MOUs, briefs, attachments.
 * Mobile-first, RTL-supported.
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FileStack,
  FileText,
  FileSignature,
  ScrollText,
  Paperclip,
  Calendar,
  Shield,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

  // D-58-04-18: 5-status doc palette mapped onto canonical statusColors family.
  //   draft     (yellow) → warning
  //   active    (green)  → success
  //   approved  (blue)   → primary
  //   archived  (gray)   → muted
  //   template  (purple) → secondary (D-07 collision)
  const statusColors: Record<string, string> = {
    draft: 'bg-warning/10 text-warning',
    active: 'bg-success/10 text-success',
    approved: 'bg-primary/10 text-primary',
    archived: 'bg-muted text-muted-foreground',
    template: 'bg-secondary text-secondary-foreground',
  }

  return (
    <Card className="hover:border-accent transition-colors">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-muted shrink-0">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold line-clamp-2 mb-1">
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
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {document.classification}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(document.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
              {document.size_bytes && (
                <>
                  <span>•</span>
                  <span>{formatFileSize(document.size_bytes)}</span>
                </>
              )}
            </div>
          </div>
          {/* No view/download actions: neither had a click handler or target;
              wire them once a document preview/storage-download path exists */}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Empty state component
 */
function EmptyState({ type }: { type?: DossierDocumentType | 'all' }) {
  const { t } = useTranslation('dossier-overview')

  return (
    <div className="text-center py-6 sm:py-8">
      <div className="p-3 rounded-full bg-muted inline-block mb-3">
        <FileStack className="h-6 w-6 text-muted-foreground" />
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
    return <EmptyState type={emptyType} />
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
  dossierType,
  isLoading,
  isRTL = false,
  className = '',
}: DocumentsSectionProps) {
  const { t } = useTranslation('dossier-overview')

  // Type-aware bucket visibility (R14-01):
  // - MoUs are only supported for country/organization signatories.
  // - Briefs are never populatable (the dossier-scoped sub-fetch was removed in
  //   round-11 and is hardcoded empty for every type) -> hidden entirely.
  // - Attachments are likewise dead today -> shown only if rows actually exist.
  const canShowMous = dossierType === 'country' || dossierType === 'organization'
  const visibleMous = canShowMous ? (data?.mous ?? []) : []
  const visibleAttachments = data?.attachments ?? []
  const showAttachments = visibleAttachments.length > 0

  // Combine the VISIBLE buckets for the "All" tab and the section totals, so a
  // hidden/dead bucket can never keep the section alive or inflate the count.
  const allDocuments = useMemo(() => {
    if (!data) return []
    return [...data.positions, ...visibleMous, ...visibleAttachments].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  }, [data, visibleMous, visibleAttachments])

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[0, 1, 2].map((n) => (
              <div key={n} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || allDocuments.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <FileStack className="h-5 w-5" />
            {t('documents.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <EmptyState type="all" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <FileStack className="h-5 w-5" />
          {t('documents.title')}
          <Badge variant="secondary">{allDocuments.length}</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-0">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto scrollbar-hide flex-nowrap mb-4 h-auto p-1">
            <TabsTrigger value="all" className="text-xs sm:text-sm shrink-0">
              {t('documents.tabs.all')} ({allDocuments.length})
            </TabsTrigger>
            <TabsTrigger value="positions" className="text-xs sm:text-sm shrink-0">
              <FileSignature className="h-4 w-4 me-1" />
              {t('documents.tabs.positions')} ({data.positions.length})
            </TabsTrigger>
            {canShowMous && (
              <TabsTrigger value="mous" className="text-xs sm:text-sm shrink-0">
                <ScrollText className="h-4 w-4 me-1" />
                {t('documents.tabs.mous')} ({visibleMous.length})
              </TabsTrigger>
            )}
            {showAttachments && (
              <TabsTrigger value="attachments" className="text-xs sm:text-sm shrink-0">
                <Paperclip className="h-4 w-4 me-1" />
                {t('documents.tabs.attachments')} ({visibleAttachments.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <DocumentList documents={allDocuments} isRTL={isRTL} emptyType="all" />
          </TabsContent>

          <TabsContent value="positions" className="mt-0">
            <DocumentList documents={data.positions} isRTL={isRTL} emptyType="position" />
          </TabsContent>

          {canShowMous && (
            <TabsContent value="mous" className="mt-0">
              <DocumentList documents={visibleMous} isRTL={isRTL} emptyType="mou" />
            </TabsContent>
          )}

          {showAttachments && (
            <TabsContent value="attachments" className="mt-0">
              <DocumentList documents={visibleAttachments} isRTL={isRTL} emptyType="attachment" />
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}
