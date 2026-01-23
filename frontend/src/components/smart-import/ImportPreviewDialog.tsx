/**
 * ImportPreviewDialog Component
 *
 * Shows preview of items to import with mapping options.
 * Allows users to select items and customize field mappings before import.
 * Mobile-first responsive with RTL support.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  X,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Settings2,
  ArrowRight,
  FileText,
  Calendar,
  User,
  FolderOpen,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import type {
  DataSource,
  ImportableSection,
  ImportPreviewResponse,
  ImportableItem,
  FieldMapping,
  ExecuteImportRequest,
  ExecuteImportResponse,
} from '@/types/smart-import.types'

export interface ImportPreviewDialogProps {
  /** Whether dialog is open */
  open: boolean
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void
  /** Selected data source */
  source: DataSource | null
  /** Target section */
  section: ImportableSection
  /** Entity ID */
  entityId: string
  /** Entity type */
  entityType: string
  /** Preview function */
  onPreview: (sourceId: string) => Promise<ImportPreviewResponse>
  /** Import function */
  onImport: (request: ExecuteImportRequest) => Promise<ExecuteImportResponse>
  /** Whether preview is loading */
  isLoading: boolean
  /** Whether import is in progress */
  isImporting: boolean
  /** Callback when import is complete */
  onImportComplete?: () => void
}

// Section icons
const sectionIcons = {
  documents: FileText,
  contacts: User,
  events: Calendar,
  briefs: FileText,
  relationships: FolderOpen,
}

/**
 * Import preview dialog component
 */
export function ImportPreviewDialog({
  open,
  onOpenChange,
  source,
  section,
  entityId,
  entityType,
  onPreview,
  onImport,
  isLoading,
  isImporting,
  onImportComplete,
}: ImportPreviewDialogProps) {
  const { t, i18n } = useTranslation('smart-import')
  const isRTL = i18n.language === 'ar'

  const [previewData, setPreviewData] = useState<ImportPreviewResponse | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([])
  const [showMappings, setShowMappings] = useState(false)
  const [importResult, setImportResult] = useState<ExecuteImportResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load preview when dialog opens
  useEffect(() => {
    if (open && source && source.status === 'connected') {
      setError(null)
      setImportResult(null)
      onPreview(source.id)
        .then((data) => {
          setPreviewData(data)
          setFieldMappings(data.fieldMappings)
          // Pre-select all items
          setSelectedItems(new Set(data.items.map((item) => item.id)))
        })
        .catch((err) => {
          setError(err.message || t('preview.error', 'Failed to load preview'))
        })
    }
  }, [open, source, onPreview, t])

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setPreviewData(null)
      setSelectedItems(new Set())
      setShowMappings(false)
      setImportResult(null)
      setError(null)
    }
  }, [open])

  // Toggle item selection
  const toggleItem = useCallback((itemId: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }, [])

  // Select/deselect all
  const toggleAll = useCallback(() => {
    if (!previewData) return
    if (selectedItems.size === previewData.items.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(previewData.items.map((item) => item.id)))
    }
  }, [previewData, selectedItems.size])

  // Update field mapping
  const updateMapping = useCallback((index: number, updates: Partial<FieldMapping>) => {
    setFieldMappings((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...updates }
      return next
    })
  }, [])

  // Execute import
  const handleImport = useCallback(async () => {
    if (!source || selectedItems.size === 0) return

    setError(null)
    try {
      const request: ExecuteImportRequest = {
        sourceId: source.id,
        sourceType: source.type,
        targetSection: section,
        entityId,
        entityType,
        itemIds: Array.from(selectedItems),
        fieldMappings,
        skipErrors: true,
        updateExisting: false,
      }

      const result = await onImport(request)
      setImportResult(result)

      if (result.success) {
        // Wait a bit before closing to show success
        setTimeout(() => {
          onImportComplete?.()
        }, 1500)
      }
    } catch (err) {
      setError((err as Error).message || t('import.error', 'Import failed'))
    }
  }, [
    source,
    selectedItems,
    section,
    entityId,
    entityType,
    fieldMappings,
    onImport,
    onImportComplete,
    t,
  ])

  // Get section icon
  const SectionIcon = sectionIcons[section] || FileText

  // Selected count
  const selectedCount = selectedItems.size
  const totalCount = previewData?.items.length || 0

  // Memoized items for rendering
  const items = useMemo(() => previewData?.items || [], [previewData])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] flex-col p-0 sm:max-w-xl md:max-w-2xl lg:max-w-3xl"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogHeader className="px-4 pb-0 pt-4 sm:px-6 sm:pt-6">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <SectionIcon className="size-5 text-primary" />
            {t('preview.title', 'Import Preview')}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {source
              ? t('preview.description', 'Select items to import from {{source}}', {
                  source: isRTL ? source.nameAr : source.name,
                })
              : t('preview.selectSource', 'Select a data source')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-4 sm:px-6">
          {/* Error state */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="size-4" />
              <AlertTitle>{t('preview.errorTitle', 'Error')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Import result */}
          {importResult && (
            <Alert variant={importResult.success ? 'default' : 'destructive'} className="mb-4">
              {importResult.success ? (
                <CheckCircle2 className="size-4 text-green-500" />
              ) : (
                <XCircle className="size-4" />
              )}
              <AlertTitle>
                {importResult.success
                  ? t('import.success', 'Import Complete')
                  : t('import.partialSuccess', 'Import Completed with Errors')}
              </AlertTitle>
              <AlertDescription>
                {t(
                  'import.summary',
                  '{{created}} created, {{skipped}} skipped, {{failed}} failed',
                  {
                    created: importResult.summary.created,
                    skipped: importResult.summary.skipped,
                    failed: importResult.summary.failed,
                  },
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="mb-3 size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {t('preview.loading', 'Loading preview...')}
              </p>
            </div>
          )}

          {/* Preview content */}
          {!isLoading && previewData && !importResult && (
            <div className="space-y-4">
              {/* Selection header */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedCount === totalCount && totalCount > 0}
                    onCheckedChange={toggleAll}
                    aria-label={t('preview.selectAll', 'Select all')}
                  />
                  <span className="text-sm">
                    {t('preview.selected', '{{count}} of {{total}} selected', {
                      count: selectedCount,
                      total: totalCount,
                    })}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMappings(!showMappings)}
                  className="min-h-9"
                >
                  <Settings2 className="me-1 size-4" />
                  {t('preview.mappings', 'Mappings')}
                  {showMappings ? (
                    <ChevronUp className="ms-1 size-4" />
                  ) : (
                    <ChevronDown className="ms-1 size-4" />
                  )}
                </Button>
              </div>

              {/* Field mappings */}
              <Collapsible open={showMappings} onOpenChange={setShowMappings}>
                <CollapsibleContent>
                  <div className="space-y-3 rounded-lg border bg-muted/30 p-3 sm:p-4">
                    <h4 className="text-sm font-medium">
                      {t('preview.fieldMappings', 'Field Mappings')}
                    </h4>
                    <div className="space-y-2">
                      {fieldMappings.map((mapping, index) => (
                        <div
                          key={mapping.sourceField}
                          className="flex flex-wrap items-center gap-2 sm:flex-nowrap"
                        >
                          <span className="min-w-[100px] text-xs text-muted-foreground sm:text-sm">
                            {mapping.sourceField}
                          </span>
                          <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
                          <Select
                            value={mapping.targetField}
                            onValueChange={(value) => updateMapping(index, { targetField: value })}
                          >
                            <SelectTrigger className="h-8 flex-1 text-xs sm:text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={mapping.targetField}>
                                {mapping.displayName}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {mapping.isRequired && (
                            <Badge variant="outline" className="text-xs">
                              {t('preview.required', 'Required')}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Items list */}
              <ScrollArea className="h-[300px] sm:h-[350px]">
                <div className="space-y-2 pe-4">
                  {items.map((item) => (
                    <ImportItemRow
                      key={item.id}
                      item={item}
                      selected={selectedItems.has(item.id)}
                      onToggle={() => toggleItem(item.id)}
                      isRTL={isRTL}
                    />
                  ))}

                  {items.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground">
                      <p className="text-sm">{t('preview.noItems', 'No items to import')}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Warnings */}
              {previewData.warnings && previewData.warnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="size-4" />
                  <AlertTitle>{t('preview.warnings', 'Warnings')}</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-1 list-inside list-disc text-xs">
                      {previewData.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t p-4 sm:px-6">
          <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="min-h-11 w-full sm:w-auto"
              disabled={isImporting}
            >
              {importResult ? t('actions.close', 'Close') : t('actions.cancel', 'Cancel')}
            </Button>
            {!importResult && (
              <Button
                onClick={handleImport}
                disabled={selectedCount === 0 || isLoading || isImporting}
                className="min-h-11 w-full sm:w-auto"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="me-2 size-4 animate-spin" />
                    {t('actions.importing', 'Importing...')}
                  </>
                ) : (
                  <>
                    <Check className="me-2 size-4" />
                    {t('actions.import', 'Import {{count}} Items', { count: selectedCount })}
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Individual item row component
interface ImportItemRowProps {
  item: ImportableItem
  selected: boolean
  onToggle: () => void
  isRTL: boolean
}

function ImportItemRow({ item, selected, onToggle, isRTL }: ImportItemRowProps) {
  const { t } = useTranslation('smart-import')
  const hasErrors = item.validationErrors && item.validationErrors.length > 0

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
        selected ? 'bg-primary/5 border-primary/30' : 'bg-background hover:bg-accent/50',
        hasErrors && 'border-destructive/50',
      )}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle()
        }
      }}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={onToggle}
        onClick={(e) => e.stopPropagation()}
        aria-label={t('preview.selectItem', 'Select {{title}}', { title: item.title })}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.title}</p>
        {item.preview && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.preview}</p>
        )}
        {item.timestamp && (
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(item.timestamp).toLocaleDateString(isRTL ? 'ar' : 'en', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        )}
        {hasErrors && (
          <div className="mt-2 space-y-1">
            {item.validationErrors?.map((error, i) => (
              <p key={i} className="flex items-center gap-1 text-xs text-destructive">
                <XCircle className="size-3 shrink-0" />
                {error}
              </p>
            ))}
          </div>
        )}
      </div>
      {item.mappingConfidence !== undefined && (
        <Badge
          variant={item.mappingConfidence >= 0.8 ? 'default' : 'secondary'}
          className="shrink-0 text-xs"
        >
          {Math.round(item.mappingConfidence * 100)}%
        </Badge>
      )}
    </div>
  )
}

export default ImportPreviewDialog
