/**
 * UnifiedKanbanBoard - Main Kanban board using shadcn-ui-kit primitives
 * Feature: 034-unified-kanban (redesigned)
 *
 * Supports:
 * - Three context types: personal, dossier, engagement
 * - Three column modes: status, priority, tracking_type
 * - Drag and drop with validation (powered by dnd-kit)
 * - Real-time updates
 * - Mobile-first responsive design
 * - RTL support for Arabic
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { UniqueIdentifier, DragEndEvent } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import * as Kanban from '@/components/ui/kanban'
import { UnifiedKanbanHeader } from './UnifiedKanbanHeader'
import { UnifiedKanbanCardContent, UnifiedKanbanCardSkeleton } from './UnifiedKanbanCard'
import { getColumnsForMode, getColumnOrder } from './utils/column-definitions'
import {
  canDropInColumn,
  getTransitionErrorMessage,
  getUpdatePayload,
} from './utils/status-transitions'
import type {
  UnifiedKanbanBoardProps,
  WorkItem,
  KanbanColumnMode,
  WorkSource,
  KanbanColumn as ColumnDefinition,
} from '@/types/work-item.types'

interface BoardProps extends UnifiedKanbanBoardProps {
  items?: WorkItem[]
  isLoading?: boolean
  isError?: boolean
  onStatusChange?: (
    itemId: string,
    source: WorkSource,
    newStatus: string,
    workflowStage?: string,
  ) => Promise<void>
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function UnifiedKanbanBoard({
  contextType: _contextType,
  contextId: _contextId,
  columnMode: initialColumnMode = 'status',
  sourceFilter: initialSourceFilter = [],
  showFilters = true,
  showModeSwitch = true,
  onItemClick,
  className,
  items = [],
  isLoading = false,
  isError = false,
  onStatusChange,
  onRefresh,
  isRefreshing = false,
}: BoardProps) {
  const { t, i18n } = useTranslation('unified-kanban')
  const isRTL = i18n.language === 'ar'
  const { toast } = useToast()

  // State
  const [columnMode, setColumnMode] = useState<KanbanColumnMode>(initialColumnMode)
  const [sourceFilter, setSourceFilter] = useState<WorkSource[]>(initialSourceFilter)

  // Get column definitions
  const columnDefinitions = useMemo(() => getColumnsForMode(columnMode), [columnMode])
  const columnOrder = useMemo(() => getColumnOrder(columnMode, isRTL), [columnMode, isRTL])

  // Filter items by source
  const filteredItems = useMemo(() => {
    if (sourceFilter.length === 0) return items
    return items.filter((item) => sourceFilter.includes(item.source))
  }, [items, sourceFilter])

  // Map column_key from database to frontend column key
  const mapColumnKey = (columnKey: string): string => {
    if (columnKey === 'pending') return 'todo'
    return columnKey
  }

  // Build Record<string, WorkItem[]> for the Kanban.Root value
  const columnsRecord = useMemo((): Record<string, WorkItem[]> => {
    const record: Record<string, WorkItem[]> = {}
    for (const columnKey of columnOrder) {
      record[columnKey] = filteredItems.filter((item) => {
        const itemColumnKey = mapColumnKey(item.column_key || 'todo')
        return itemColumnKey === columnKey
      })
    }
    return record
  }, [columnOrder, filteredItems])

  // Track columns state for DnD
  const [columns, setColumns] = useState(columnsRecord)

  // Sync columns when columnsRecord changes (from props)
  useEffect(() => {
    setColumns(columnsRecord)
  }, [columnsRecord])

  // Calculate counts
  const totalCount = filteredItems.length
  const overdueCount = filteredItems.filter((item) => item.is_overdue).length

  // Handle drag end - validate and update status
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      if (!onStatusChange) return

      const { active, over } = event
      if (!over) return

      // Find the item that was dragged
      const itemId = active.id as string
      const item = filteredItems.find((i) => i.id === itemId)
      if (!item) return

      // Find what column the item ended up in
      const findColumn = (id: UniqueIdentifier): string | null => {
        if (id in columns) return id as string
        for (const [colKey, colItems] of Object.entries(columns)) {
          if (colItems.some((i) => i.id === id)) return colKey
        }
        return null
      }

      const sourceColumnKey = mapColumnKey(item.column_key || 'todo')
      const targetColumnKey = findColumn(over.id)
      if (!targetColumnKey || sourceColumnKey === targetColumnKey) return

      // Validate the transition
      const canDrop = canDropInColumn(
        item.source,
        item.status,
        item.workflow_stage,
        targetColumnKey,
      )

      if (!canDrop) {
        const errorMsg = getTransitionErrorMessage(
          item.source,
          item.column_key,
          targetColumnKey,
          isRTL ? 'ar' : 'en',
        )

        toast({
          title: t('errors.invalidTransition', { column: targetColumnKey }),
          description: errorMsg,
          variant: 'destructive',
        })

        // Revert the columns state
        setColumns(columnsRecord)
        return
      }

      // Get the update payload
      const { status, workflow_stage } = getUpdatePayload(item.source, targetColumnKey)

      try {
        await onStatusChange(item.id, item.source, status!, workflow_stage)
        toast({
          title: t('success.statusUpdated'),
          description: t('success.statusUpdatedDescription'),
        })
      } catch (_error) {
        toast({
          title: t('errors.updateFailed'),
          description: t('errors.updateFailedDescription'),
          variant: 'destructive',
        })
        // Revert the columns state
        setColumns(columnsRecord)
      }
    },
    [onStatusChange, filteredItems, columns, isRTL, toast, t, columnsRecord],
  )

  // Handle item click
  const handleItemClick = useCallback(
    (item: WorkItem) => {
      if (onItemClick) {
        onItemClick(item)
      }
    },
    [onItemClick],
  )

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <p className="text-lg text-muted-foreground mb-4">{t('errors.loadFailed')}</p>
        <p className="text-sm text-muted-foreground mb-4">{t('errors.loadFailedDescription')}</p>
        {onRefresh && (
          <button onClick={onRefresh} className="text-primary hover:underline">
            {t('actions.retry')}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <UnifiedKanbanHeader
        columnMode={columnMode}
        onColumnModeChange={setColumnMode}
        sourceFilter={sourceFilter}
        onSourceFilterChange={setSourceFilter}
        showFilters={showFilters}
        showModeSwitch={showModeSwitch}
        showViewToggle={false}
        isRefreshing={isRefreshing}
        onRefresh={onRefresh}
        totalCount={totalCount}
        overdueCount={overdueCount}
      />

      {/* Board */}
      <div
        className={cn(
          'flex-1 overflow-x-auto overflow-y-hidden',
          'px-4 sm:px-6 py-4',
          'bg-background',
        )}
      >
        {isLoading ? (
          // Loading skeletons
          <div className="flex gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex flex-col bg-muted rounded-lg w-full sm:w-[320px] sm:min-w-[320px] h-[500px] p-2.5"
              >
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="h-5 w-20 bg-background rounded animate-pulse" />
                  <div className="h-5 w-6 bg-background rounded-full animate-pulse" />
                </div>
                <div className="flex-1 space-y-2">
                  <UnifiedKanbanCardSkeleton />
                  <UnifiedKanbanCardSkeleton />
                  <UnifiedKanbanCardSkeleton />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Kanban.Kanban<WorkItem>
            value={columns}
            onValueChange={setColumns}
            getItemValue={(item) => item.id}
            onDragEnd={handleDragEnd}
            flatCursor
          >
            <Kanban.Board className="flex w-full gap-4 overflow-x-auto pb-4">
              {columnOrder.map((columnKey) => {
                const columnDef = columnDefinitions.find(
                  (c) => c.key === columnKey,
                ) as ColumnDefinition
                const columnItems = columns[columnKey] || []

                return (
                  <Kanban.Column
                    key={columnKey}
                    value={columnKey}
                    className="w-full sm:w-[320px] sm:min-w-[320px] shrink-0"
                  >
                    {/* Column header */}
                    <div className="flex items-center justify-between px-1 mb-1">
                      <span className="text-sm font-semibold text-start">
                        {isRTL && columnDef?.titleAr
                          ? columnDef.titleAr
                          : columnDef?.title || columnKey}
                      </span>
                      <Badge variant="outline" className="text-xs tabular-nums">
                        {columnItems.length}
                      </Badge>
                    </div>

                    {/* Column items */}
                    {columnItems.length === 0 ? (
                      <div
                        className={cn(
                          'flex flex-col items-center justify-center',
                          'p-4 text-sm text-muted-foreground text-center',
                          'rounded-md border-2 border-dashed min-h-[100px]',
                        )}
                      >
                        <p>{t('empty.noItemsInColumn')}</p>
                        <p className="text-xs mt-1">{t('empty.dragHere')}</p>
                      </div>
                    ) : (
                      columnItems.map((item) => (
                        <Kanban.Item key={item.id} value={item.id} asHandle asChild>
                          <Card
                            className={cn(
                              'border-0 p-3 cursor-grab active:cursor-grabbing',
                              item.is_overdue && 'ring-1 ring-destructive/30',
                            )}
                            onClick={() => handleItemClick(item)}
                          >
                            <UnifiedKanbanCardContent item={item} />
                          </Card>
                        </Kanban.Item>
                      ))
                    )}
                  </Kanban.Column>
                )
              })}
            </Kanban.Board>

            <Kanban.Overlay>
              <div className="bg-primary/10 size-full rounded-md" />
            </Kanban.Overlay>
          </Kanban.Kanban>
        )}
      </div>

      {/* Empty state */}
      {!isLoading && filteredItems.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-center p-8">
            <p className="text-lg font-medium text-muted-foreground mb-2">{t('empty.noItems')}</p>
            <p className="text-sm text-muted-foreground">{t('empty.noItemsDescription')}</p>
          </div>
        </div>
      )}
    </div>
  )
}
