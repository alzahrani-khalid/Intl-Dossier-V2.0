/**
 * UnifiedKanbanBoard - Main Kanban board using Kibo UI pattern
 * Feature: 034-unified-kanban
 *
 * Supports:
 * - Three context types: personal, dossier, engagement
 * - Three column modes: status, priority, tracking_type
 * - Drag and drop with validation (powered by dnd-kit)
 * - Real-time updates
 * - Mobile-first responsive design
 * - RTL support for Arabic
 */

import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { UniqueIdentifier } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import {
  KanbanProvider,
  KanbanBoard,
  KanbanColumn,
  KanbanCard,
  KanbanEmpty,
  type KanbanColumn as KanbanColumnType,
} from '@/components/ui/kanban'
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
  // (handles migration from 'pending' to 'todo')
  const mapColumnKey = (columnKey: string): string => {
    if (columnKey === 'pending') return 'todo'
    return columnKey
  }

  // Convert to kanban columns format
  const kanbanColumns = useMemo((): KanbanColumnType<WorkItem>[] => {
    return columnOrder.map((columnKey) => {
      const columnDef = columnDefinitions.find((c) => c.key === columnKey) as ColumnDefinition
      const columnItems = filteredItems.filter((item) => {
        const itemColumnKey = mapColumnKey(item.column_key || 'todo')
        return itemColumnKey === columnKey
      })

      return {
        id: columnKey,
        title: columnDef?.title || columnKey,
        items: columnItems,
      }
    })
  }, [columnOrder, columnDefinitions, filteredItems])

  // Track columns state for DnD
  const [columns, setColumns] = useState(kanbanColumns)

  // Sync columns when kanbanColumns changes (from props)
  useMemo(() => {
    setColumns(kanbanColumns)
  }, [kanbanColumns])

  // Calculate counts
  const totalCount = filteredItems.length
  const overdueCount = filteredItems.filter((item) => item.is_overdue).length

  // Handle drag end - validate and update status
  const handleDragEnd = useCallback(
    async (
      itemId: UniqueIdentifier,
      sourceColumnId: UniqueIdentifier,
      targetColumnId: UniqueIdentifier,
    ) => {
      if (!onStatusChange) return

      const item = filteredItems.find((i) => i.id === itemId)
      if (!item) return

      const targetColumnKey = targetColumnId as string

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
        setColumns(kanbanColumns)
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
      } catch (error) {
        toast({
          title: t('errors.updateFailed'),
          description: t('errors.updateFailedDescription'),
          variant: 'destructive',
        })
        // Revert the columns state
        setColumns(kanbanColumns)
      }
    },
    [onStatusChange, filteredItems, isRTL, toast, t, kanbanColumns],
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

  // Render overlay for dragging
  const renderOverlay = useCallback((activeItem: WorkItem | null) => {
    if (!activeItem) return null
    return (
      <div className="rounded-lg border bg-card p-3 shadow-lg cursor-grabbing min-w-[280px]">
        <UnifiedKanbanCardContent item={activeItem} />
      </div>
    )
  }, [])

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
          'bg-muted/20',
        )}
      >
        {isLoading ? (
          // Loading skeletons
          <KanbanBoard id="loading" data={[]}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex flex-col rounded-lg border bg-muted/30 w-full sm:w-[300px] sm:min-w-[300px] h-[500px]"
              >
                <div className="flex items-center justify-between p-3 border-b bg-muted/50">
                  <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                  <div className="h-5 w-6 bg-muted rounded-full animate-pulse" />
                </div>
                <div className="flex-1 p-2 space-y-2">
                  <UnifiedKanbanCardSkeleton />
                  <UnifiedKanbanCardSkeleton />
                  <UnifiedKanbanCardSkeleton />
                </div>
              </div>
            ))}
          </KanbanBoard>
        ) : (
          <KanbanProvider<WorkItem>
            columns={columns}
            onColumnsChange={setColumns}
            onDragEnd={handleDragEnd}
            renderOverlay={renderOverlay}
          >
            <KanbanBoard id="unified-kanban" data={filteredItems}>
              {columnOrder.map((columnKey) => {
                const columnDef = columnDefinitions.find(
                  (c) => c.key === columnKey,
                ) as ColumnDefinition
                const column = columns.find((c) => c.id === columnKey)
                const columnItems = column?.items || []

                return (
                  <KanbanColumn<WorkItem>
                    key={columnKey}
                    id={columnKey}
                    title={columnDef?.title || columnKey}
                    titleAr={columnDef?.titleAr}
                    items={columnItems}
                    isRTL={isRTL}
                    className={columnDef?.bgColor}
                    headerClassName={cn(columnDef?.bgColor, columnDef?.color)}
                  >
                    {columnItems.length === 0 ? (
                      <KanbanEmpty
                        message={t('empty.noItemsInColumn')}
                        subMessage={t('empty.dragHere')}
                      />
                    ) : (
                      columnItems.map((item) => (
                        <KanbanCard
                          key={item.id}
                          id={item.id}
                          onClick={() => handleItemClick(item)}
                          className={item.is_overdue ? 'border-red-200 bg-red-50/50' : ''}
                        >
                          <UnifiedKanbanCardContent item={item} />
                        </KanbanCard>
                      ))
                    )}
                  </KanbanColumn>
                )
              })}
            </KanbanBoard>
          </KanbanProvider>
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
