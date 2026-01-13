/**
 * EnhancedKanbanBoard - Full-featured Kanban board
 * Feature: kanban-task-board
 *
 * Enhanced features:
 * - Swimlanes (by assignee or priority)
 * - WIP (Work In Progress) limits with warnings
 * - Bulk operations (multi-select, bulk move, bulk assign)
 * - Real-time collaboration
 * - Mobile-first responsive design
 * - RTL support for Arabic
 */

import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { UniqueIdentifier } from '@dnd-kit/core'
import {
  ChevronDown,
  ChevronUp,
  CheckSquare,
  X,
  Move,
  UserPlus,
  Signal,
  AlertTriangle,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { groupIntoSwimlanes, getSwimlaneColor, getSwimlaneBackground } from './utils/swimlane-utils'
import {
  checkWipLimit,
  getWipWarningLevel,
  getWipIndicatorColor,
  getWipProgressColor,
} from './utils/wip-limits'
import {
  canDropInColumn,
  getTransitionErrorMessage,
  getUpdatePayload,
} from './utils/status-transitions'
import { useBulkKanbanOperations } from '@/hooks/useBulkKanbanOperations'
import type {
  WorkItem,
  KanbanColumnMode,
  WorkSource,
  KanbanColumn as ColumnDefinition,
  SwimlaneMode,
  WipLimits,
  Swimlane,
  Priority,
} from '@/types/work-item.types'

interface EnhancedBoardProps {
  contextType: 'personal' | 'dossier' | 'engagement'
  contextId?: string
  columnMode?: KanbanColumnMode
  sourceFilter?: WorkSource[]
  showFilters?: boolean
  showModeSwitch?: boolean
  onItemClick?: (item: WorkItem) => void
  className?: string
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
  // Enhanced features
  swimlaneMode?: SwimlaneMode
  onSwimlaneChange?: (mode: SwimlaneMode) => void
  wipLimits?: WipLimits
  enableBulkOperations?: boolean
  enableWipWarnings?: boolean
  // Available assignees for bulk assign
  availableAssignees?: Array<{ id: string; name: string; avatar_url?: string }>
}

export function EnhancedKanbanBoard({
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
  swimlaneMode: initialSwimlaneMode = 'none',
  onSwimlaneChange,
  wipLimits = { in_progress: 5, review: 3 },
  enableBulkOperations = true,
  enableWipWarnings = true,
  availableAssignees = [],
}: EnhancedBoardProps) {
  const { t, i18n } = useTranslation('unified-kanban')
  const isRTL = i18n.language === 'ar'
  const { toast } = useToast()

  // State
  const [columnMode, setColumnMode] = useState<KanbanColumnMode>(initialColumnMode)
  const [sourceFilter, setSourceFilter] = useState<WorkSource[]>(initialSourceFilter)
  const [swimlaneMode, setSwimlaneMode] = useState<SwimlaneMode>(initialSwimlaneMode)
  const [collapsedSwimlanes, setCollapsedSwimlanes] = useState<Set<string>>(new Set())

  // Bulk operations
  const bulkOps = useBulkKanbanOperations(items)

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

  // Group items into swimlanes if enabled
  const swimlanes = useMemo(() => {
    if (swimlaneMode === 'none') return null
    return groupIntoSwimlanes(filteredItems, swimlaneMode)
  }, [filteredItems, swimlaneMode])

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

  // Sync columns when kanbanColumns changes
  useMemo(() => {
    setColumns(kanbanColumns)
  }, [kanbanColumns])

  // Calculate counts
  const totalCount = filteredItems.length
  const overdueCount = filteredItems.filter((item) => item.is_overdue).length

  // Handle swimlane toggle
  const toggleSwimlane = useCallback((swimlaneId: string) => {
    setCollapsedSwimlanes((prev) => {
      const next = new Set(prev)
      if (next.has(swimlaneId)) {
        next.delete(swimlaneId)
      } else {
        next.add(swimlaneId)
      }
      return next
    })
  }, [])

  // Handle swimlane mode change
  const handleSwimlaneChange = useCallback(
    (mode: SwimlaneMode) => {
      setSwimlaneMode(mode)
      onSwimlaneChange?.(mode)
    },
    [onSwimlaneChange],
  )

  // Handle drag end
  const handleDragEnd = useCallback(
    async (
      itemId: UniqueIdentifier,
      _sourceColumnId: UniqueIdentifier,
      targetColumnId: UniqueIdentifier,
    ) => {
      if (!onStatusChange) return

      const item = filteredItems.find((i) => i.id === itemId)
      if (!item) return

      const targetColumnKey = targetColumnId as string

      // Check WIP limit
      if (enableWipWarnings) {
        const targetColumn = kanbanColumns.find((c) => c.id === targetColumnKey)
        const wipStatus = checkWipLimit(targetColumnKey, targetColumn?.items.length || 0, wipLimits)
        const warningLevel = getWipWarningLevel(wipStatus)

        if (warningLevel === 'at_limit' || warningLevel === 'over_limit') {
          toast({
            title: t('wip.limitReached'),
            description: t('wip.limitReachedDescription', {
              column: targetColumnKey,
              limit: wipStatus.limit,
            }),
            variant: 'destructive',
          })
        }
      }

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

        setColumns(kanbanColumns)
        return
      }

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
        setColumns(kanbanColumns)
      }
    },
    [onStatusChange, filteredItems, isRTL, toast, t, kanbanColumns, enableWipWarnings, wipLimits],
  )

  // Handle item click
  const handleItemClick = useCallback(
    (item: WorkItem) => {
      if (bulkOps.selectionState.isSelecting) {
        bulkOps.toggleSelection(item.id)
      } else if (onItemClick) {
        onItemClick(item)
      }
    },
    [onItemClick, bulkOps],
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

  // Render WIP indicator
  const renderWipIndicator = (columnKey: string, itemCount: number) => {
    if (!enableWipWarnings) return null

    const wipStatus = checkWipLimit(columnKey, itemCount, wipLimits)
    if (wipStatus.limit === null) return null

    const warningLevel = getWipWarningLevel(wipStatus)
    const colorClass = getWipIndicatorColor(warningLevel)
    const progressColor = getWipProgressColor(warningLevel)

    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-[40px]">
          <div
            className={cn('h-full transition-all', progressColor)}
            style={{ width: `${wipStatus.percentage}%` }}
          />
        </div>
        <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', colorClass)}>
          {wipStatus.current}/{wipStatus.limit}
        </Badge>
        {(warningLevel === 'at_limit' || warningLevel === 'over_limit') && (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
        )}
      </div>
    )
  }

  // Render bulk action bar
  const renderBulkActionBar = () => {
    if (!enableBulkOperations) return null

    return (
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-2 border-b bg-muted/50',
          bulkOps.selectionState.isSelecting && 'bg-primary/5',
        )}
      >
        <Button
          variant={bulkOps.selectionState.isSelecting ? 'secondary' : 'outline'}
          size="sm"
          onClick={bulkOps.toggleSelectMode}
          className="gap-2"
        >
          {bulkOps.selectionState.isSelecting ? (
            <>
              <X className="h-4 w-4" />
              {t('bulkActions.cancel')}
            </>
          ) : (
            <>
              <CheckSquare className="h-4 w-4" />
              {t('bulkActions.select')}
            </>
          )}
        </Button>

        {bulkOps.selectionState.isSelecting && (
          <>
            <Button variant="ghost" size="sm" onClick={bulkOps.selectAll}>
              {t('bulkActions.selectAll')}
            </Button>

            {bulkOps.selectedCount > 0 && (
              <>
                <Badge variant="secondary">
                  {bulkOps.selectedCount} {t('bulkActions.selected')}
                </Badge>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Move className="h-4 w-4" />
                      {t('bulkActions.moveTo')}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {columnDefinitions.map((col) => (
                      <DropdownMenuItem key={col.key} onClick={() => bulkOps.moveSelected(col.key)}>
                        {isRTL ? col.titleAr : col.title}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {availableAssignees.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        {t('bulkActions.assign')}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => bulkOps.assignSelected(null)}>
                        {t('bulkActions.unassign')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {availableAssignees.map((assignee) => (
                        <DropdownMenuItem
                          key={assignee.id}
                          onClick={() => bulkOps.assignSelected(assignee.id)}
                        >
                          {assignee.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Signal className="h-4 w-4" />
                      {t('bulkActions.priority')}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {(['urgent', 'high', 'medium', 'low'] as Priority[]).map((priority) => (
                      <DropdownMenuItem
                        key={priority}
                        onClick={() => bulkOps.updatePrioritySelected(priority)}
                      >
                        {t(`columns.${priority}`)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={bulkOps.clearSelection}
                  className="ms-auto"
                >
                  {t('bulkActions.clearSelection')}
                </Button>
              </>
            )}
          </>
        )}
      </div>
    )
  }

  // Render swimlane selector
  const renderSwimlaneSelector = () => (
    <div className="flex items-center gap-2 ms-4">
      <Users className="h-4 w-4 text-muted-foreground" />
      <Select value={swimlaneMode} onValueChange={(v) => handleSwimlaneChange(v as SwimlaneMode)}>
        <SelectTrigger className="h-8 w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{t('swimlanes.none')}</SelectItem>
          <SelectItem value="assignee">{t('swimlanes.byAssignee')}</SelectItem>
          <SelectItem value="priority">{t('swimlanes.byPriority')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )

  // Render a single swimlane row
  const renderSwimlane = (swimlane: Swimlane) => {
    const isCollapsed = collapsedSwimlanes.has(swimlane.id)
    const swimlaneItems = swimlane.items

    return (
      <div
        key={swimlane.id}
        className={cn(
          'border rounded-lg mb-4',
          getSwimlaneBackground(swimlane.id),
          'border-s-4',
          getSwimlaneColor(swimlane.id),
        )}
      >
        {/* Swimlane header */}
        <button
          onClick={() => toggleSwimlane(swimlane.id)}
          className={cn(
            'flex items-center justify-between w-full px-4 py-2',
            'hover:bg-muted/50 transition-colors',
            'text-start',
          )}
        >
          <div className="flex items-center gap-2">
            {isCollapsed ? (
              <ChevronUp className={cn('h-4 w-4', isRTL && 'rotate-180')} />
            ) : (
              <ChevronDown className={cn('h-4 w-4', isRTL && 'rotate-180')} />
            )}
            <span className="font-medium">
              {isRTL && swimlane.titleAr ? swimlane.titleAr : swimlane.title}
            </span>
            <Badge variant="secondary" className="text-xs">
              {swimlaneItems.length}
            </Badge>
          </div>
        </button>

        {/* Swimlane content */}
        {!isCollapsed && (
          <div className="px-2 pb-2 overflow-x-auto">
            <div className="flex gap-4 min-w-max">
              {columnOrder.map((columnKey) => {
                const columnDef = columnDefinitions.find((c) => c.key === columnKey)
                const columnItems = swimlaneItems.filter(
                  (item) => mapColumnKey(item.column_key || 'todo') === columnKey,
                )

                return (
                  <div
                    key={columnKey}
                    className="w-[280px] min-w-[280px] bg-card rounded-lg border p-2"
                  >
                    <div className="flex items-center justify-between mb-2 px-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {isRTL && columnDef?.titleAr ? columnDef.titleAr : columnDef?.title}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {columnItems.length}
                      </Badge>
                    </div>
                    <div className="space-y-2 min-h-[100px]">
                      {columnItems.length === 0 ? (
                        <div className="text-xs text-muted-foreground text-center py-4">
                          {t('empty.noItemsInColumn')}
                        </div>
                      ) : (
                        columnItems.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleItemClick(item)}
                            className={cn(
                              'rounded-lg border bg-background p-2 cursor-pointer',
                              'hover:shadow-sm transition-shadow',
                              bulkOps.isSelected(item.id) && 'ring-2 ring-primary',
                            )}
                          >
                            {bulkOps.selectionState.isSelecting && (
                              <Checkbox checked={bulkOps.isSelected(item.id)} className="mb-2" />
                            )}
                            <UnifiedKanbanCardContent item={item} showDragHandle={false} />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

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

      {/* Swimlane selector */}
      <div className="flex items-center px-4 py-2 border-b">{renderSwimlaneSelector()}</div>

      {/* Bulk action bar */}
      {renderBulkActionBar()}

      {/* Board content */}
      <div
        className={cn('flex-1 overflow-x-auto overflow-y-auto', 'px-4 sm:px-6 py-4', 'bg-muted/20')}
      >
        {isLoading ? (
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
        ) : swimlanes && swimlanes.length > 0 ? (
          // Swimlane view
          <div className="space-y-4">{swimlanes.map(renderSwimlane)}</div>
        ) : (
          // Standard board view
          <KanbanProvider<WorkItem>
            columns={columns}
            onColumnsChange={setColumns}
            onDragEnd={handleDragEnd}
            renderOverlay={renderOverlay}
          >
            <KanbanBoard id="enhanced-kanban" data={filteredItems}>
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
                    {/* WIP indicator */}
                    {renderWipIndicator(columnKey, columnItems.length)}

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
                          className={cn(
                            item.is_overdue ? 'border-red-200 bg-red-50/50' : '',
                            bulkOps.isSelected(item.id) && 'ring-2 ring-primary',
                          )}
                        >
                          {bulkOps.selectionState.isSelecting && (
                            <div className="mb-2">
                              <Checkbox
                                checked={bulkOps.isSelected(item.id)}
                                onCheckedChange={() => bulkOps.toggleSelection(item.id)}
                              />
                            </div>
                          )}
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
