/**
 * EnhancedKanbanBoard - Full-featured Kanban board using shadcn-ui-kit primitives
 * Feature: kanban-task-board (redesigned)
 *
 * Enhanced features:
 * - Swimlanes (by assignee or priority)
 * - WIP (Work In Progress) limits with warnings
 * - Bulk operations (multi-select, bulk move, bulk assign)
 * - Real-time collaboration
 * - Mobile-first responsive design
 * - RTL support for Arabic
 */

import { useState, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { UniqueIdentifier, DragEndEvent } from '@dnd-kit/core'
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
  Link2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
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
import * as Kanban from '@/components/ui/kanban'
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
import { DossierPicker } from '@/components/work-creation/DossierPicker'
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
import { useDirection } from '@/hooks/useDirection'

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
  // Pagination
  hasMore?: Record<string, boolean>
  totalCountPerColumn?: Record<string, number>
  onLoadMore?: (columnKey: string) => void
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
  hasMore: hasMoreMap = {},
  totalCountPerColumn = {},
  onLoadMore,
}: EnhancedBoardProps) {
  const { t } = useTranslation('unified-kanban')
  const { isRTL } = useDirection()
const { toast } = useToast()

  // State
  const [columnMode, setColumnMode] = useState<KanbanColumnMode>(initialColumnMode)
  const [sourceFilter, setSourceFilter] = useState<WorkSource[]>(initialSourceFilter)
  const [swimlaneMode, setSwimlaneMode] = useState<SwimlaneMode>(initialSwimlaneMode)
  const [collapsedSwimlanes, setCollapsedSwimlanes] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [showDossierPicker, setShowDossierPicker] = useState(false)

  // Track shift key for range selection through KanbanItem
  const lastClickEventRef = useRef<MouseEvent | null>(null)

  // Bulk operations
  const bulkOps = useBulkKanbanOperations(items)

  // Get column definitions
  const columnDefinitions = useMemo(() => getColumnsForMode(columnMode), [columnMode])
  const columnOrder = useMemo(() => getColumnOrder(columnMode, isRTL), [columnMode, isRTL])

  // Filter items by source and search query
  const filteredItems = useMemo(() => {
    let result = items
    if (sourceFilter.length > 0) {
      result = result.filter((item) => sourceFilter.includes(item.source))
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.title_ar?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.assignee?.name.toLowerCase().includes(q),
      )
    }
    return result
  }, [items, sourceFilter, searchQuery])

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

  // Sync columns when columnsRecord changes (render-time adjustment)
  const prevColumnsRecordRef = useRef(columnsRecord)
  if (prevColumnsRecordRef.current !== columnsRecord) {
    prevColumnsRecordRef.current = columnsRecord
    setColumns(columnsRecord)
  }

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
    async (event: DragEndEvent) => {
      if (!onStatusChange) return

      const { active, over } = event
      if (!over) return

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

      // Check WIP limit
      if (enableWipWarnings) {
        const targetItems = columns[targetColumnKey] || []
        const wipStatus = checkWipLimit(targetColumnKey, targetItems.length, wipLimits)
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

        setColumns(columnsRecord)
        return
      }

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
        setColumns(columnsRecord)
      }
    },
    [
      onStatusChange,
      filteredItems,
      columns,
      isRTL,
      toast,
      t,
      columnsRecord,
      enableWipWarnings,
      wipLimits,
    ],
  )

  // Handle item click (with shift-click for range selection)
  const handleItemClick = useCallback(
    (item: WorkItem, event?: React.MouseEvent) => {
      const shiftKey = event?.shiftKey || lastClickEventRef.current?.shiftKey || false
      lastClickEventRef.current = null
      if (bulkOps.selectionState.isSelecting) {
        bulkOps.toggleSelection(item.id, shiftKey)
      } else if (onItemClick) {
        onItemClick(item)
      }
    },
    [onItemClick, bulkOps],
  )

  // Capture native click events on the board for shift-key detection
  const boardClickCapture = useCallback((e: React.MouseEvent) => {
    lastClickEventRef.current = e.nativeEvent
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
        <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden min-w-[40px]">
          <div
            className={cn('h-full transition-all', progressColor)}
            style={{ width: `${wipStatus.percentage}%` }}
          />
        </div>
        <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', colorClass)}>
          {wipStatus.current}/{wipStatus.limit}
        </Badge>
        {(warningLevel === 'at_limit' || warningLevel === 'over_limit') && (
          <AlertTriangle className="size-3.5 text-amber-500" />
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
          className="gap-2 min-h-11"
        >
          {bulkOps.selectionState.isSelecting ? (
            <>
              <X className="size-4" />
              {t('bulkActions.cancel')}
            </>
          ) : (
            <>
              <CheckSquare className="size-4" />
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
                      <Move className="size-4" />
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
                        <UserPlus className="size-4" />
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
                      <Signal className="size-4" />
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

                {/* Link to Dossier */}
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDossierPicker(!showDossierPicker)}
                    className="gap-2"
                  >
                    <Link2 className="size-4" />
                    {t('bulkActions.linkToDossier', 'Link to Dossier')}
                  </Button>
                  {showDossierPicker && (
                    <div className="absolute top-full mt-1 start-0 z-50 w-[300px]">
                      <DossierPicker
                        onChange={(dossierId) => {
                          if (dossierId) {
                            bulkOps.linkSelectedToDossier(dossierId)
                          }
                          setShowDossierPicker(false)
                        }}
                        placeholder={t('bulkActions.selectDossier', 'Select a dossier...')}
                      />
                    </div>
                  )}
                </div>

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
      <Users className="size-4 text-muted-foreground" />
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
            'flex items-center justify-between w-full px-4 py-2 min-h-11',
            'hover:bg-muted/50 transition-colors',
            'text-start',
          )}
        >
          <div className="flex items-center gap-2">
            {isCollapsed ? (
              <ChevronUp className={cn('size-4', isRTL && 'rotate-180')} />
            ) : (
              <ChevronDown className={cn('size-4', isRTL && 'rotate-180')} />
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
          <div className="px-2 pb-2 overflow-x-auto scrollbar-thin">
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
                            onClick={(e) => handleItemClick(item, e)}
                            className={cn(
                              'rounded-lg bg-background p-2 cursor-pointer',
                              'hover:shadow-sm transition-shadow',
                              item.is_overdue && 'ring-1 ring-destructive/30',
                              bulkOps.isSelected(item.id) && 'ring-2 ring-primary',
                            )}
                          >
                            {bulkOps.selectionState.isSelecting && (
                              <Checkbox checked={bulkOps.isSelected(item.id)} className="mb-2" />
                            )}
                            <UnifiedKanbanCardContent item={item} />
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
          <button onClick={onRefresh} className="text-primary hover:underline min-h-11">
            {t('actions.retry')}
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn('flex flex-col h-full', className)}
      onClickCapture={boardClickCapture}
    >
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
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Swimlane selector */}
      <div className="flex items-center px-4 py-2 border-b">{renderSwimlaneSelector()}</div>

      {/* Bulk action bar */}
      {renderBulkActionBar()}

      {/* Board content */}
      <div
        className={cn(
          'flex-1 overflow-x-auto scrollbar-thin overflow-y-auto',
          'px-4 sm:px-6 py-4',
          'bg-background',
        )}
      >
        {isLoading ? (
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
        ) : swimlanes && swimlanes.length > 0 ? (
          // Swimlane view
          <div className="space-y-4">{swimlanes.map(renderSwimlane)}</div>
        ) : (
          // Standard board view
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
                        {totalCountPerColumn[columnKey] != null
                          ? `${columnItems.length}/${totalCountPerColumn[columnKey]}`
                          : columnItems.length}
                      </Badge>
                    </div>

                    {/* WIP indicator */}
                    {renderWipIndicator(columnKey, columnItems.length)}

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
                      <>
                        {columnItems.map((item) => (
                          <Kanban.Item key={item.id} value={item.id} asHandle asChild>
                            <Card
                              className={cn(
                                'border-0 p-3 min-h-12 cursor-grab active:cursor-grabbing',
                                item.is_overdue && 'ring-1 ring-destructive/30',
                                bulkOps.isSelected(item.id) && 'ring-2 ring-primary',
                              )}
                              onClick={() => handleItemClick(item)}
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
                            </Card>
                          </Kanban.Item>
                        ))}

                        {/* Load more button */}
                        {hasMoreMap[columnKey] && onLoadMore && (
                          <button
                            type="button"
                            onClick={() => onLoadMore(columnKey)}
                            className={cn(
                              'w-full py-2 text-xs text-muted-foreground',
                              'rounded-md border-2 border-dashed',
                              'hover:bg-background/50 hover:text-foreground transition-colors',
                              'min-h-11',
                            )}
                          >
                            {totalCountPerColumn[columnKey] != null
                              ? `${t('actions.loadMore')} (${columnItems.length}/${totalCountPerColumn[columnKey]})`
                              : t('actions.loadMore')}
                          </button>
                        )}
                      </>
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
