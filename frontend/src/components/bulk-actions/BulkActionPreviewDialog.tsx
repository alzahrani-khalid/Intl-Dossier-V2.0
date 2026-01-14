import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Loader2, Search, X, CheckSquare, Square, Eye, EyeOff } from 'lucide-react'
import type {
  BulkActionDefinition,
  BulkActionEntityType,
  BulkActionParams,
  BulkSelectableItem,
  EntityStatus,
  Priority,
  ExportFormat,
} from '@/types/bulk-actions.types'
import { cn } from '@/lib/utils'
import { DEFAULT_UNDO_TTL } from '@/types/bulk-actions.types'

/**
 * Preview item with display information
 */
export interface PreviewItem extends BulkSelectableItem {
  id: string
  name?: string
  title?: string
  label?: string
  status?: string
  priority?: string
  assignee?: string
  [key: string]: unknown
}

export interface BulkActionPreviewDialogProps<T extends PreviewItem = PreviewItem> {
  /** Whether dialog is open */
  open: boolean
  /** Action to confirm */
  action: BulkActionDefinition | null
  /** Items to preview */
  items: T[]
  /** Entity type for display */
  entityType: BulkActionEntityType
  /** Callback when confirmed with final items */
  onConfirm: (includedItems: T[], params?: BulkActionParams) => void
  /** Callback when cancelled */
  onCancel: () => void
  /** Whether action is currently processing */
  isProcessing?: boolean
  /** Undo TTL in ms */
  undoTtl?: number
  /** Custom render function for item display */
  renderItem?: (item: T) => React.ReactNode
  /** Field to use as display name */
  displayField?: keyof T
}

/**
 * Status options for status update action
 */
const STATUS_OPTIONS: EntityStatus[] = [
  'pending',
  'in_progress',
  'completed',
  'cancelled',
  'draft',
  'review',
  'approved',
  'rejected',
  'archived',
]

/**
 * Priority options for priority change action
 */
const PRIORITY_OPTIONS: Priority[] = ['low', 'medium', 'high', 'urgent']

/**
 * Export format options
 */
const EXPORT_FORMAT_OPTIONS: ExportFormat[] = ['csv', 'xlsx', 'pdf', 'json']

/**
 * BulkActionPreviewDialog - Enhanced confirmation dialog with item preview and exclusion
 *
 * Features:
 * - Detailed list of affected items
 * - Individual item exclusion with checkboxes
 * - Search/filter within items
 * - Select all / deselect all toggles
 * - Shows excluded item count
 * - Mobile-first responsive design
 * - RTL support
 */
export function BulkActionPreviewDialog<T extends PreviewItem = PreviewItem>({
  open,
  action,
  items,
  entityType,
  onConfirm,
  onCancel,
  isProcessing = false,
  undoTtl = DEFAULT_UNDO_TTL,
  renderItem,
  displayField,
}: BulkActionPreviewDialogProps<T>) {
  const { t, i18n } = useTranslation('bulk-actions')
  const isRTL = i18n.language === 'ar'

  // Excluded items state
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [showExcludedOnly, setShowExcludedOnly] = useState(false)

  // Parameter state
  const [selectedStatus, setSelectedStatus] = useState<EntityStatus>('pending')
  const [selectedPriority, setSelectedPriority] = useState<Priority>('medium')
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv')
  const [notes, setNotes] = useState('')

  // Reset state when dialog opens
  const resetState = useCallback(() => {
    setExcludedIds(new Set())
    setSearchQuery('')
    setShowExcludedOnly(false)
    setSelectedStatus('pending')
    setSelectedPriority('medium')
    setSelectedFormat('csv')
    setNotes('')
  }, [])

  // Get display name for an item
  const getItemDisplayName = useCallback(
    (item: T): string => {
      if (displayField && item[displayField]) {
        return String(item[displayField])
      }
      return item.name || item.title || item.label || item.id
    },
    [displayField],
  )

  // Filter items based on search and exclusion view
  const filteredItems = useMemo(() => {
    let result = items

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((item) => {
        const displayName = getItemDisplayName(item).toLowerCase()
        return displayName.includes(query) || item.id.toLowerCase().includes(query)
      })
    }

    // Filter by exclusion view
    if (showExcludedOnly) {
      result = result.filter((item) => excludedIds.has(item.id))
    }

    return result
  }, [items, searchQuery, showExcludedOnly, excludedIds, getItemDisplayName])

  // Included items (all items minus excluded)
  const includedItems = useMemo(() => {
    return items.filter((item) => !excludedIds.has(item.id))
  }, [items, excludedIds])

  // Statistics
  const totalCount = items.length
  const excludedCount = excludedIds.size
  const includedCount = totalCount - excludedCount

  // Toggle individual item exclusion
  const toggleItemExclusion = useCallback((id: string) => {
    setExcludedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  // Select all visible items (include them)
  const includeAll = useCallback(() => {
    setExcludedIds((prev) => {
      const newSet = new Set(prev)
      filteredItems.forEach((item) => newSet.delete(item.id))
      return newSet
    })
  }, [filteredItems])

  // Exclude all visible items
  const excludeAll = useCallback(() => {
    setExcludedIds((prev) => {
      const newSet = new Set(prev)
      filteredItems.forEach((item) => newSet.add(item.id))
      return newSet
    })
  }, [filteredItems])

  if (!action) return null

  const entityLabel =
    includedCount === 1 ? t(`entityTypes.${entityType}`) : t(`entityTypes.${entityType}_plural`)

  const actionLabel = t(`actions.${action.id.replace(/-/g, '')}`)
  const undoSeconds = Math.round(undoTtl / 1000)

  const handleConfirm = () => {
    const params: BulkActionParams = {}

    switch (action.id) {
      case 'update-status':
        params.status = selectedStatus
        break
      case 'change-priority':
        params.priority = selectedPriority
        break
      case 'export':
        params.exportFormat = selectedFormat
        break
      case 'escalate':
        params.notes = notes
        break
    }

    onConfirm(includedItems as T[], params)
    resetState()
  }

  const handleCancel = () => {
    onCancel()
    resetState()
  }

  // Check if all visible items are included
  const allVisibleIncluded = filteredItems.every((item) => !excludedIds.has(item.id))

  const renderActionContent = () => {
    switch (action.id) {
      case 'update-status':
        return (
          <div className="space-y-3 py-2">
            <Label htmlFor="status-select">{t('confirmation.updateStatus.selectStatus')}</Label>
            <Select
              value={selectedStatus}
              onValueChange={(v) => setSelectedStatus(v as EntityStatus)}
            >
              <SelectTrigger id="status-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`status.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'change-priority':
        return (
          <div className="space-y-3 py-2">
            <Label htmlFor="priority-select">
              {t('confirmation.changePriority.selectPriority')}
            </Label>
            <Select
              value={selectedPriority}
              onValueChange={(v) => setSelectedPriority(v as Priority)}
            >
              <SelectTrigger id="priority-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {t(`priority.${priority}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'export':
        return (
          <div className="space-y-3 py-2">
            <Label htmlFor="format-select">{t('confirmation.export.selectFormat')}</Label>
            <Select
              value={selectedFormat}
              onValueChange={(v) => setSelectedFormat(v as ExportFormat)}
            >
              <SelectTrigger id="format-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPORT_FORMAT_OPTIONS.map((format) => (
                  <SelectItem key={format} value={format}>
                    {t(`confirmation.export.formats.${format}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'escalate':
        return (
          <div className="space-y-3 py-2">
            <Label htmlFor="escalate-reason">{t('confirmation.escalate.reason')}</Label>
            <Textarea
              id="escalate-reason"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('confirmation.escalate.reasonPlaceholder')}
              className="min-h-[60px]"
            />
          </div>
        )

      case 'delete':
        return (
          <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-md">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm text-red-800 dark:text-red-200">
                {t('confirmation.delete.warning')}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">
                {t('confirmation.delete.permanentWarning')}
              </p>
            </div>
          </div>
        )

      case 'archive':
        return (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {t('confirmation.archive.note')}
            </p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <AlertDialogContent
        className={cn(
          'max-w-lg w-[calc(100%-2rem)] sm:w-full max-h-[90vh]',
          'mx-4 sm:mx-auto flex flex-col',
        )}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t(`confirmation.${action.id.replace(/-/g, '')}.title`, {
              defaultValue: t('confirmation.title', { action: actionLabel }),
            })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('preview.description', {
              action: actionLabel.toLowerCase(),
              count: includedCount,
              entityType: entityLabel,
              defaultValue: `${actionLabel} ${includedCount} ${entityLabel}`,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Action-specific content */}
        {renderActionContent()}

        {/* Preview Section */}
        <div className="space-y-3 flex-1 min-h-0">
          {/* Stats and controls */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {t('preview.includedCount', {
                  count: includedCount,
                  defaultValue: `${includedCount} included`,
                })}
              </Badge>
              {excludedCount > 0 && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  {t('preview.excludedCount', {
                    count: excludedCount,
                    defaultValue: `${excludedCount} excluded`,
                  })}
                </Badge>
              )}
            </div>

            {/* Toggle buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={includeAll}
                disabled={allVisibleIncluded || isProcessing}
                className="h-7 px-2 text-xs"
                title={t('preview.includeAll', { defaultValue: 'Include all' })}
              >
                <CheckSquare className="h-3.5 w-3.5 me-1" />
                {t('preview.includeAll', { defaultValue: 'All' })}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={excludeAll}
                disabled={filteredItems.length === 0 || isProcessing}
                className="h-7 px-2 text-xs"
                title={t('preview.excludeAll', { defaultValue: 'Exclude all' })}
              >
                <Square className="h-3.5 w-3.5 me-1" />
                {t('preview.excludeAll', { defaultValue: 'None' })}
              </Button>
              {excludedCount > 0 && (
                <Button
                  variant={showExcludedOnly ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setShowExcludedOnly(!showExcludedOnly)}
                  className="h-7 px-2 text-xs"
                  title={t('preview.showExcluded', { defaultValue: 'Show excluded only' })}
                >
                  {showExcludedOnly ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('preview.searchPlaceholder', { defaultValue: 'Search items...' })}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-8 pe-8 h-9"
              disabled={isProcessing}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery('')}
                className="absolute end-1 top-1/2 -translate-y-1/2 h-6 w-6"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* Item list */}
          <ScrollArea className="h-[200px] sm:h-[250px] border rounded-md">
            <div className="p-2 space-y-1">
              {filteredItems.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  {searchQuery
                    ? t('preview.noResults', { defaultValue: 'No items match your search' })
                    : t('preview.noItems', { defaultValue: 'No items to preview' })}
                </p>
              ) : (
                filteredItems.map((item) => {
                  const isExcluded = excludedIds.has(item.id)
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-md transition-colors',
                        'hover:bg-muted/50 cursor-pointer',
                        isExcluded && 'opacity-50 bg-muted/30',
                      )}
                      onClick={() => !isProcessing && toggleItemExclusion(item.id)}
                    >
                      <Checkbox
                        checked={!isExcluded}
                        disabled={isProcessing}
                        className="shrink-0"
                        aria-label={
                          isExcluded
                            ? t('preview.includeItem', {
                                name: getItemDisplayName(item),
                                defaultValue: `Include ${getItemDisplayName(item)}`,
                              })
                            : t('preview.excludeItem', {
                                name: getItemDisplayName(item),
                                defaultValue: `Exclude ${getItemDisplayName(item)}`,
                              })
                        }
                      />
                      <div className="flex-1 min-w-0">
                        {renderItem ? (
                          renderItem(item)
                        ) : (
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                            <span
                              className={cn(
                                'text-sm font-medium truncate flex-1',
                                isExcluded && 'line-through text-muted-foreground',
                              )}
                            >
                              {getItemDisplayName(item)}
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {item.status && (
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    'text-xs shrink-0',
                                    item.status === 'completed' &&
                                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                                    item.status === 'in_progress' &&
                                      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                                    item.status === 'pending' &&
                                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                                    item.status === 'cancelled' &&
                                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
                                    item.status === 'draft' &&
                                      'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
                                    item.status === 'review' &&
                                      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
                                    item.status === 'approved' &&
                                      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
                                    item.status === 'rejected' &&
                                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                                    item.status === 'archived' &&
                                      'bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200',
                                  )}
                                >
                                  {t(`status.${item.status}`, { defaultValue: item.status })}
                                </Badge>
                              )}
                              {item.priority && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-xs shrink-0',
                                    item.priority === 'urgent' &&
                                      'border-red-500 text-red-600 dark:border-red-400 dark:text-red-400',
                                    item.priority === 'high' &&
                                      'border-orange-500 text-orange-600 dark:border-orange-400 dark:text-orange-400',
                                    item.priority === 'medium' &&
                                      'border-yellow-500 text-yellow-600 dark:border-yellow-400 dark:text-yellow-400',
                                    item.priority === 'low' &&
                                      'border-green-500 text-green-600 dark:border-green-400 dark:text-green-400',
                                  )}
                                >
                                  {t(`priority.${item.priority}`, { defaultValue: item.priority })}
                                </Badge>
                              )}
                              {item.assignee && (
                                <span className="text-xs text-muted-foreground truncate max-w-[100px] hidden sm:inline">
                                  {item.assignee}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Undo availability notice */}
        {action.supportsUndo && !action.isDestructive && (
          <p className="text-xs text-muted-foreground mt-2">
            {t('confirmation.undoAvailable', { seconds: undoSeconds })}
          </p>
        )}

        {/* Warning if no items included */}
        {includedCount === 0 && (
          <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-950 rounded-md mt-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              {t('preview.noItemsWarning', {
                defaultValue: 'No items selected. Please include at least one item.',
              })}
            </p>
          </div>
        )}

        <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0 mt-4">
          <AlertDialogCancel onClick={handleCancel} disabled={isProcessing} className="mt-0">
            {t('confirmation.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isProcessing || includedCount === 0}
            className={cn(action.isDestructive && 'bg-red-600 hover:bg-red-700 focus:ring-red-600')}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {t('confirmation.processing')}
              </>
            ) : (
              <>
                {t('confirmation.confirm')} ({includedCount})
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default BulkActionPreviewDialog
