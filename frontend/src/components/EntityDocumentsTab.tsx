import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  FileText,
  Download,
  Trash2,
  Upload,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react'
import { DocumentUploader } from '@/components/documents/DocumentUploader'
import { DocumentEmptyState } from '@/components/documents/DocumentEmptyState'
import { useToast } from '@/hooks/use-toast'
import { useDocuments, type Document as DocumentType } from '@/hooks/useDocuments'
import { formatBytes } from '@/lib/utils'
import type { DocumentTemplate } from '@/types/document-template.types'

interface EntityDocumentsTabProps {
  ownerType: string
  ownerId: string
  entityName?: string
  onTemplateSelect?: (template: DocumentTemplate) => void
}

// Extended document interface with all fields we expect from the API
interface Document extends DocumentType {
  file_name?: string
  file_size?: number
  uploaded_at?: string
  scan_status?: 'pending' | 'clean' | 'infected'
  sensitivity_level?: 'public' | 'internal' | 'confidential' | 'secret'
  version_number?: number
  tags?: string[]
}

const scanStatusConfig = {
  pending: {
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    icon: Clock,
  },
  clean: {
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    icon: CheckCircle2,
  },
  infected: {
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    icon: AlertCircle,
  },
}

const sensitivityLevelConfig = {
  public: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  internal: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
  confidential: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
  secret: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
}

const mimeTypeIcons: Record<string, typeof FileText> = {
  'application/pdf': FileText,
  'image/': FileText,
  'video/': FileText,
  'text/': FileText,
  default: FileText,
}

function getMimeIcon(mimeType: string | undefined): typeof FileText {
  if (!mimeType) return FileText
  const match = Object.keys(mimeTypeIcons).find((key) => mimeType.startsWith(key))
  if (match && mimeTypeIcons[match]) {
    return mimeTypeIcons[match]
  }
  return FileText
}

export function EntityDocumentsTab({
  ownerType,
  ownerId,
  entityName,
  onTemplateSelect,
}: EntityDocumentsTabProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [latestOnly, setLatestOnly] = useState(true)
  const [scanStatusFilter, setScanStatusFilter] = useState<string>('all')
  const [showUploader, setShowUploader] = useState(false)

  // Handle files dropped in empty state
  const handleFilesSelected = useCallback((_files: File[]) => {
    setShowUploader(true)
  }, [])

  // Handle template selection from empty state
  const handleTemplateSelect = useCallback(
    (template: DocumentTemplate) => {
      if (onTemplateSelect) {
        onTemplateSelect(template)
      }
    },
    [onTemplateSelect],
  )

  // Fetch documents
  const { documents, isLoading, error, refetch } = useDocuments({
    owner_type: ownerType,
    owner_id: ownerId,
  })

  // Cast documents to extended type
  const typedDocuments = documents as Document[]

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Failed to delete document: ${response.statusText}`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['documents', { owner_type: ownerType, owner_id: ownerId }],
      })
      refetch()
      toast({
        title: t('documents.delete.success_title'),
        description: t('documents.delete.success_description'),
      })
    },
    onError: (error) => {
      toast({
        title: t('documents.delete.error_title'),
        description: error instanceof Error ? error.message : t('common.error.unknown'),
        variant: 'destructive',
      })
    },
  })

  // Download handler
  const handleDownload = async (document: Document) => {
    try {
      // Get signed URL from Supabase Storage
      const response = await fetch(`/api/documents/${document.id}/download`)
      if (!response.ok) {
        throw new Error('Failed to get download URL')
      }
      const { url } = await response.json()

      // Trigger download
      const link = window.document.createElement('a')
      link.href = url
      link.download = document.file_name || document.title_en || 'document'
      link.click()
    } catch (error) {
      toast({
        title: t('documents.download.error_title'),
        description: error instanceof Error ? error.message : t('common.error.unknown'),
        variant: 'destructive',
      })
    }
  }

  // Check if we have no documents - show empty state
  const hasDocuments = typedDocuments && typedDocuments.length > 0

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header - only show when there are documents */}
      {hasDocuments && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-start text-lg font-semibold">{t('documents.tab.title')}</h2>
            <p className="text-start text-sm text-muted-foreground">
              {t('documents.tab.description')}
            </p>
          </div>
          <Button onClick={() => setShowUploader(!showUploader)} className="w-full sm:w-auto">
            <Upload className="me-2 size-4" />
            {t('documents.upload.button')}
          </Button>
        </div>
      )}

      {/* Upload Section */}
      {showUploader && (
        <Card>
          <CardHeader>
            <CardTitle className="text-start text-base">{t('documents.upload.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentUploader
              ownerType={ownerType}
              ownerId={ownerId}
              onUploadComplete={() => {
                setShowUploader(false)
                queryClient.invalidateQueries({
                  queryKey: ['documents', { owner_type: ownerType, owner_id: ownerId }],
                })
                refetch()
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Content Area */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12 text-destructive">
            <AlertCircle className="me-2 size-5" />
            <span className="text-sm">
              {error instanceof Error ? error.message : t('documents.list.error')}
            </span>
          </CardContent>
        </Card>
      ) : hasDocuments ? (
        <>
          {/* Filters - only show when there are documents */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Latest Only Toggle */}
                <div className="flex items-center justify-between space-x-2">
                  <Label
                    htmlFor="latest-only"
                    className="cursor-pointer text-start text-sm font-medium"
                  >
                    {t('documents.filter.latest_only')}
                  </Label>
                  <Switch id="latest-only" checked={latestOnly} onCheckedChange={setLatestOnly} />
                </div>

                {/* Scan Status Filter */}
                <div>
                  <Label className="mb-2 block text-start text-sm font-medium">
                    {t('documents.filter.scan_status')}
                  </Label>
                  <Select value={scanStatusFilter} onValueChange={setScanStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('documents.filter.all_statuses')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('documents.filter.all_statuses')}</SelectItem>
                      <SelectItem value="pending">{t('documents.scan_status.pending')}</SelectItem>
                      <SelectItem value="clean">{t('documents.scan_status.clean')}</SelectItem>
                      <SelectItem value="infected">
                        {t('documents.scan_status.infected')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-start text-base">
                {t('documents.list.title', { count: typedDocuments?.length || 0 })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {typedDocuments.map((doc) => {
                    const Icon = getMimeIcon(doc.mime_type)
                    const scanStatus = doc.scan_status || 'pending'
                    const sensitivityLevel = doc.sensitivity_level || 'internal'
                    const ScanIcon = scanStatusConfig[scanStatus].icon

                    return (
                      <div
                        key={doc.id}
                        className="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                      >
                        <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />

                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-start text-sm font-medium">
                              {doc.file_name || doc.title_en || doc.title_ar || 'Untitled'}
                            </p>
                            {(doc.version_number || 0) > 1 && (
                              <Badge variant="outline" className="shrink-0 text-xs">
                                v{doc.version_number}
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatBytes(doc.file_size || 0)}</span>
                            <span>•</span>
                            <span>
                              {new Date(doc.uploaded_at || doc.created_at).toLocaleDateString(
                                i18n.language,
                              )}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge className={scanStatusConfig[scanStatus].color}>
                              <ScanIcon className="me-1 size-3" />
                              {t(`documents.scan_status.${scanStatus}`)}
                            </Badge>
                            <Badge className={sensitivityLevelConfig[sensitivityLevel]}>
                              {t(`documents.sensitivity.${sensitivityLevel}`)}
                            </Badge>
                            {doc.tags && doc.tags.length > 0 && (
                              <Badge variant="outline">{doc.tags[0]}</Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDownload(doc)}
                            className="size-8"
                          >
                            <Download className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(doc.id)}
                            disabled={deleteMutation.isPending}
                            className="size-8 text-destructive hover:text-destructive"
                          >
                            {deleteMutation.isPending ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Empty State with Drag & Drop Upload */
        <DocumentEmptyState
          entityType={ownerType}
          entityId={ownerId}
          entityName={entityName}
          onFilesSelected={handleFilesSelected}
          onTemplateSelect={onTemplateSelect ? handleTemplateSelect : undefined}
        />
      )}
    </div>
  )
}
