/**
 * FieldHistoryTimeline Component
 *
 * Displays a timeline of field-level changes for an entity with:
 * - Before/after value comparisons
 * - User and timestamp information
 * - Rollback capability for individual changes
 * - Mobile-first responsive design with RTL support
 */

import { memo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  History,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Check,
  X,
  Plus,
  Edit3,
  Trash2,
  Clock,
  User,
  Filter,
  Layers,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useFieldHistory, useFieldHistoryGrouped, useFieldRollback } from '@/hooks/useFieldHistory'
import type {
  FieldHistoryTimelineProps,
  FieldHistoryEntry,
  FieldHistoryGrouped,
  ChangeType,
  FieldCategory,
  TrackableEntityType,
} from '@/types/field-history.types'
import {
  CHANGE_TYPE_CONFIG,
  FIELD_CATEGORY_CONFIG,
  ENTITY_TYPE_DISPLAY,
} from '@/types/field-history.types'

// =============================================
// ICON MAPPING
// =============================================

const CHANGE_TYPE_ICONS: Record<ChangeType, React.FC<{ className?: string }>> = {
  create: Plus,
  update: Edit3,
  delete: Trash2,
  rollback: RotateCcw,
}

// =============================================
// VALUE DISPLAY HELPER
// =============================================

function formatValue(value: unknown, isRTL: boolean): string {
  if (value === null || value === undefined) {
    return '-'
  }

  if (typeof value === 'boolean') {
    return value ? '✓' : '✗'
  }

  if (typeof value === 'number') {
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US').format(value)
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '-'
    return value.map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(', ')
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }

  // Check if it's a date string
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    try {
      const date = new Date(value)
      return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return String(value)
    }
  }

  return String(value)
}

// =============================================
// RELATIVE TIME HELPER
// =============================================

function getRelativeTime(dateString: string, isRTL: boolean): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  const rtf = new Intl.RelativeTimeFormat(isRTL ? 'ar' : 'en', { numeric: 'auto' })

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second')
  }
  if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute')
  }
  if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour')
  }
  if (diffInSeconds < 604800) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day')
  }
  if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 604800), 'week')
  }
  return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month')
}

// =============================================
// FIELD HISTORY ENTRY CARD
// =============================================

interface EntryCardProps {
  entry: FieldHistoryEntry
  isRTL: boolean
  onRollback?: (entry: FieldHistoryEntry) => void
  isExpanded: boolean
  onToggleExpand: () => void
}

const FieldHistoryEntryCard = memo(function FieldHistoryEntryCard({
  entry,
  isRTL,
  onRollback,
  isExpanded,
  onToggleExpand,
}: EntryCardProps) {
  const { t } = useTranslation('field-history')

  const config = CHANGE_TYPE_CONFIG[entry.change_type]
  const Icon = CHANGE_TYPE_ICONS[entry.change_type]
  const categoryConfig = FIELD_CATEGORY_CONFIG[entry.field_category]

  const fieldLabel = isRTL
    ? entry.field_label.ar || entry.field_name
    : entry.field_label.en || entry.field_name

  return (
    <div
      className={cn(
        'relative border-s-4 ps-4 pb-4',
        entry.rolled_back_at
          ? 'border-gray-300 opacity-60'
          : config.color.replace('text-', 'border-'),
      )}
    >
      {/* Timeline dot */}
      <div
        className={cn(
          'absolute -start-2.5 top-0 h-5 w-5 rounded-full flex items-center justify-center',
          entry.rolled_back_at ? 'bg-gray-200' : config.bgColor,
        )}
      >
        <Icon className="h-3 w-3" />
      </div>

      <Card className={cn('ms-2', entry.rolled_back_at && 'bg-muted/50')}>
        <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Badge variant="outline" className={cn('text-xs', config.bgColor, config.color)}>
                    {isRTL ? config.label_ar : config.label_en}
                  </Badge>
                  <span className="font-medium text-sm truncate">{fieldLabel}</span>
                  <Badge
                    variant="secondary"
                    className={cn('text-xs hidden sm:inline-flex', categoryConfig.color)}
                  >
                    {isRTL
                      ? FIELD_CATEGORY_CONFIG[entry.field_category].label_ar
                      : FIELD_CATEGORY_CONFIG[entry.field_category].label_en}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getRelativeTime(entry.created_at, isRTL)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {new Date(entry.created_at).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0">
              <Separator className="mb-3" />

              {/* Value comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                {/* Old value */}
                <div className="p-2 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                  <div className="text-xs text-red-600 dark:text-red-400 mb-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {t('entry.oldValue')}
                  </div>
                  <div className="text-sm break-words font-mono">
                    {formatValue(entry.old_value, isRTL)}
                  </div>
                </div>

                {/* New value */}
                <div className="p-2 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                  <div className="text-xs text-green-600 dark:text-green-400 mb-1 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    {t('entry.newValue')}
                  </div>
                  <div className="text-sm break-words font-mono">
                    {formatValue(entry.new_value, isRTL)}
                  </div>
                </div>
              </div>

              {/* User info */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{entry.changed_by.email || t('entry.unknownUser')}</span>
                  {entry.changed_by.role && (
                    <Badge variant="outline" className="text-xs ms-1">
                      {entry.changed_by.role}
                    </Badge>
                  )}
                </div>

                {/* Rollback status or button */}
                {entry.rolled_back_at ? (
                  <div className="flex items-center gap-1 text-amber-600">
                    <AlertCircle className="h-3 w-3" />
                    {t('entry.rolledBackAt', {
                      date: getRelativeTime(entry.rolled_back_at, isRTL),
                    })}
                  </div>
                ) : (
                  entry.can_rollback &&
                  onRollback && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRollback(entry)
                      }}
                      className="h-7 text-xs"
                    >
                      <RotateCcw className={cn('h-3 w-3 me-1', isRTL && 'rotate-180')} />
                      {t('entry.rollback')}
                    </Button>
                  )
                )}
              </div>

              {/* Rollback reference */}
              {entry.is_rollback && entry.rollback_of_id && (
                <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                  <RotateCcw className="h-3 w-3" />
                  {t('entry.rollbackOf')}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  )
})

// =============================================
// GROUPED FIELD CARD
// =============================================

interface GroupedFieldCardProps {
  field: FieldHistoryGrouped
  isRTL: boolean
  onClick: () => void
}

const GroupedFieldCard = memo(function GroupedFieldCard({
  field,
  isRTL,
  onClick,
}: GroupedFieldCardProps) {
  const { t } = useTranslation('field-history')

  const fieldLabel = isRTL
    ? field.field_label.ar || field.field_name
    : field.field_label.en || field.field_name

  const categoryConfig = FIELD_CATEGORY_CONFIG[field.field_category]

  return (
    <Card className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={onClick}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="font-medium text-sm truncate">{fieldLabel}</span>
            <Badge variant="secondary" className={cn('text-xs', categoryConfig.color)}>
              {isRTL ? categoryConfig.label_ar : categoryConfig.label_en}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <History className="h-3 w-3" />
              {field.statistics.change_count} {t('grouped.changes')}
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {getRelativeTime(field.statistics.last_change_at, isRTL)}
            </span>
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground truncate">
          {t('grouped.currentValue')}: {formatValue(field.current_value, isRTL)}
        </div>
      </CardContent>
    </Card>
  )
})

// =============================================
// ROLLBACK CONFIRM DIALOG
// =============================================

interface RollbackDialogProps {
  entry: FieldHistoryEntry | null
  isOpen: boolean
  isLoading: boolean
  onConfirm: () => void
  onCancel: () => void
  isRTL: boolean
}

const RollbackConfirmDialog = memo(function RollbackConfirmDialog({
  entry,
  isOpen,
  isLoading,
  onConfirm,
  onCancel,
  isRTL,
}: RollbackDialogProps) {
  const { t } = useTranslation('field-history')

  if (!entry) return null

  const fieldLabel = isRTL
    ? entry.field_label.ar || entry.field_name
    : entry.field_label.en || entry.field_name

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className={cn('h-5 w-5', isRTL && 'rotate-180')} />
            {t('rollback.title')}
          </DialogTitle>
          <DialogDescription>{t('rollback.description')}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('rollback.field')}:</span>
              <span className="font-medium">{fieldLabel}</span>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 rounded-md bg-muted">
                <div className="text-xs text-muted-foreground mb-1">
                  {t('rollback.currentValue')}
                </div>
                <div className="text-sm font-mono truncate">
                  {formatValue(entry.new_value, isRTL)}
                </div>
              </div>
              <div className="p-2 rounded-md bg-green-50 dark:bg-green-950/20">
                <div className="text-xs text-green-600 dark:text-green-400 mb-1">
                  {t('rollback.restoreTo')}
                </div>
                <div className="text-sm font-mono truncate">
                  {formatValue(entry.old_value, isRTL)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            {t('rollback.cancel')}
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {t('rollback.rolling')}
              </span>
            ) : (
              <>
                <RotateCcw className={cn('h-4 w-4 me-2', isRTL && 'rotate-180')} />
                {t('rollback.confirm')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})

// =============================================
// LOADING SKELETON
// =============================================

const TimelineSkeleton = memo(function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="relative border-s-4 border-gray-200 ps-4 pb-4">
          <div className="absolute -start-2.5 top-0 h-5 w-5 rounded-full bg-gray-200" />
          <Card className="ms-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            </CardHeader>
          </Card>
        </div>
      ))}
    </div>
  )
})

// =============================================
// MAIN COMPONENT
// =============================================

export const FieldHistoryTimeline = memo(function FieldHistoryTimeline({
  entityType,
  entityId,
  initialFieldName,
  showFilters = true,
  showGroupedView = true,
  onRollback: onRollbackProp,
  className,
}: FieldHistoryTimelineProps) {
  const { t, i18n } = useTranslation('field-history')
  const isRTL = i18n.language === 'ar'

  // View mode state
  const [viewMode, setViewMode] = useState<'timeline' | 'grouped'>('timeline')
  const [selectedFieldName, setSelectedFieldName] = useState<string | undefined>(initialFieldName)
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<FieldCategory | 'all'>('all')

  // Rollback state
  const [rollbackEntry, setRollbackEntry] = useState<FieldHistoryEntry | null>(null)

  // Data hooks
  const {
    entries,
    isLoading: isLoadingHistory,
    error: historyError,
    metadata,
    nextPage,
    prevPage,
    refetch: refetchHistory,
  } = useFieldHistory(entityType, entityId, {
    field_name: selectedFieldName,
    field_category: categoryFilter !== 'all' ? categoryFilter : undefined,
  })

  const {
    fields,
    isLoading: isLoadingGrouped,
    error: groupedError,
  } = useFieldHistoryGrouped(entityType, entityId)

  const { rollback, isRollingBack } = useFieldRollback()

  // Handlers
  const handleRollbackClick = useCallback((entry: FieldHistoryEntry) => {
    setRollbackEntry(entry)
  }, [])

  const handleRollbackConfirm = useCallback(async () => {
    if (!rollbackEntry) return

    try {
      await rollback(rollbackEntry.id)
      setRollbackEntry(null)
      refetchHistory()
      onRollbackProp?.(rollbackEntry)
    } catch (error) {
      console.error('Rollback failed:', error)
    }
  }, [rollbackEntry, rollback, refetchHistory, onRollbackProp])

  const handleRollbackCancel = useCallback(() => {
    setRollbackEntry(null)
  }, [])

  const handleFieldSelect = useCallback((fieldName: string) => {
    setSelectedFieldName(fieldName)
    setViewMode('timeline')
  }, [])

  const handleToggleExpand = useCallback((entryId: string) => {
    setExpandedEntryId((prev) => (prev === entryId ? null : entryId))
  }, [])

  // Filter entries by category if in timeline view
  const filteredEntries =
    categoryFilter === 'all' ? entries : entries.filter((e) => e.field_category === categoryFilter)

  // Entity display name
  const entityDisplay = ENTITY_TYPE_DISPLAY[entityType]
  const entityName = isRTL ? entityDisplay.ar : entityDisplay.en

  return (
    <div className={cn('space-y-4', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <History className="h-5 w-5" />
              {t('title')} - {entityName}
            </CardTitle>

            {/* View mode toggle */}
            {showGroupedView && (
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'timeline' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('timeline')}
                >
                  <History className="h-4 w-4 me-1" />
                  <span className="hidden sm:inline">{t('viewMode.timeline')}</span>
                </Button>
                <Button
                  variant={viewMode === 'grouped' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grouped')}
                >
                  <Layers className="h-4 w-4 me-1" />
                  <span className="hidden sm:inline">{t('viewMode.grouped')}</span>
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        {/* Filters */}
        {showFilters && viewMode === 'timeline' && (
          <CardContent className="pb-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Category filter */}
              <Select
                value={categoryFilter}
                onValueChange={(v) => setCategoryFilter(v as FieldCategory | 'all')}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 me-2" />
                  <SelectValue placeholder={t('filters.category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.allCategories')}</SelectItem>
                  {Object.values(FIELD_CATEGORY_CONFIG).map((config) => (
                    <SelectItem key={config.category} value={config.category}>
                      {isRTL ? config.label_ar : config.label_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Field name filter (if selected from grouped view) */}
              {selectedFieldName && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFieldName(undefined)}
                  className="h-9"
                >
                  <X className="h-4 w-4 me-1" />
                  {t('filters.clearField', { field: selectedFieldName })}
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Content */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          {viewMode === 'grouped' ? (
            // Grouped view
            isLoadingGrouped ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : groupedError ? (
              <div className="text-center py-8 text-destructive">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>{t('error.loading')}</p>
              </div>
            ) : fields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{t('empty.noHistory')}</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] sm:h-[500px]">
                <div className="space-y-3 pe-4">
                  {fields.map((field) => (
                    <GroupedFieldCard
                      key={field.field_name}
                      field={field}
                      isRTL={isRTL}
                      onClick={() => handleFieldSelect(field.field_name)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )
          ) : // Timeline view
          isLoadingHistory ? (
            <TimelineSkeleton />
          ) : historyError ? (
            <div className="text-center py-8 text-destructive">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>{t('error.loading')}</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{t('empty.noHistory')}</p>
            </div>
          ) : (
            <>
              <ScrollArea className="h-[400px] sm:h-[500px]">
                <div className="space-y-0 pe-4">
                  {filteredEntries.map((entry) => (
                    <FieldHistoryEntryCard
                      key={entry.id}
                      entry={entry}
                      isRTL={isRTL}
                      onRollback={handleRollbackClick}
                      isExpanded={expandedEntryId === entry.id}
                      onToggleExpand={() => handleToggleExpand(entry.id)}
                    />
                  ))}
                </div>
              </ScrollArea>

              {/* Pagination */}
              {metadata && (metadata.has_more || metadata.offset > 0) && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {t('pagination.showing', {
                      start: metadata.offset + 1,
                      end: Math.min(metadata.offset + metadata.limit, metadata.total),
                      total: metadata.total,
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevPage}
                      disabled={metadata.offset === 0}
                    >
                      {t('pagination.prev')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextPage}
                      disabled={!metadata.has_more}
                    >
                      {t('pagination.next')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Rollback confirmation dialog */}
      <RollbackConfirmDialog
        entry={rollbackEntry}
        isOpen={Boolean(rollbackEntry)}
        isLoading={isRollingBack}
        onConfirm={handleRollbackConfirm}
        onCancel={handleRollbackCancel}
        isRTL={isRTL}
      />
    </div>
  )
})

export default FieldHistoryTimeline
