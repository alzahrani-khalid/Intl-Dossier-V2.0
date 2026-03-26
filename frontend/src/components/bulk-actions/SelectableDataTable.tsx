import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { MobileActionBar } from '@/components/ui/mobile-action-bar'
import { LayoutGrid, TableIcon } from 'lucide-react'
import type {
  BulkSelectableItem,
  BulkSelectionState,
  SelectableColumnDef,
} from '@/types/bulk-actions.types'
import { MAX_BULK_SELECTION } from '@/types/bulk-actions.types'
import { cn } from '@/lib/utils'
import { useResponsive } from '@/hooks/useResponsive'

type ViewMode = 'table' | 'card'

export interface SelectableDataTableProps<T extends BulkSelectableItem> {
  /** Data items */
  data: T[]
  /** Column definitions */
  columns: SelectableColumnDef<T>[]
  /** Selection state */
  selection: BulkSelectionState
  /** Callback when item is toggled */
  onToggleSelection: (id: string) => void
  /** Callback when all items are selected/deselected */
  onSelectAll: (ids: string[]) => void
  /** Callback to clear all selections */
  onClearSelection: () => void
  /** Callback for range selection (Shift+Click) */
  onSelectRange?: (startId: string, endId: string, allIds: string[]) => void
  /** ID field name (default: 'id') */
  idField?: keyof T
  /** Whether selection is disabled */
  selectionDisabled?: boolean
  /** Row click handler */
  onRowClick?: (item: T) => void
  /** Custom row class name */
  rowClassName?: (item: T, isSelected: boolean) => string
  /** Empty state message */
  emptyMessage?: string
  /** Additional CSS classes */
  className?: string
  /** Show table/card toggle button */
  enableViewToggle?: boolean
  /** Column IDs to show in card view */
  mobileCardColumns?: string[]
  /** Column ID for card title */
  cardTitleColumn?: string
  /** Column ID for card description */
  cardDescriptionColumn?: string
  /** Bulk action buttons to render in MobileActionBar on mobile */
  bulkActions?: React.ReactNode
}

/**
 * SelectableDataTable - Data table with multi-select capability
 *
 * Features:
 * - Checkbox-based selection
 * - Select all header checkbox
 * - Range selection with Shift+Click
 * - Max selection limit enforcement
 * - Mobile-first responsive design
 * - RTL support
 * - Keyboard accessible
 */
export function SelectableDataTable<T extends BulkSelectableItem>({
  data,
  columns,
  selection,
  onToggleSelection,
  onSelectAll,
  onClearSelection,
  onSelectRange,
  idField = 'id' as keyof T,
  selectionDisabled = false,
  onRowClick,
  rowClassName,
  emptyMessage,
  className,
  enableViewToggle = true,
  mobileCardColumns,
  cardTitleColumn,
  cardDescriptionColumn,
  bulkActions,
}: SelectableDataTableProps<T>) {
  const { t, i18n } = useTranslation('bulk-actions')
  const isRTL = i18n.language === 'ar'
  const lastClickedRef = useRef<string | null>(null)
  const { isMobile } = useResponsive()
  const [viewMode, setViewMode] = useState<ViewMode>(isMobile ? 'card' : 'table')

  // Auto-switch view mode when viewport changes
  useEffect(() => {
    setViewMode(isMobile ? 'card' : 'table')
  }, [isMobile])

  const { selectedIds, selectedCount, allSelected, partiallySelected, maxReached } = selection

  // Get all IDs from data
  const allIds = useMemo(() => data.map((item) => String(item[idField])), [data, idField])

  // Handle select all checkbox
  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      onClearSelection()
    } else {
      onSelectAll(allIds)
    }
  }, [allSelected, allIds, onSelectAll, onClearSelection])

  // Handle row checkbox click with Shift support
  const handleRowCheckboxClick = useCallback(
    (e: React.MouseEvent, id: string) => {
      // If Shift is held and we have a previous selection, select range
      if (e.shiftKey && lastClickedRef.current && onSelectRange) {
        onSelectRange(lastClickedRef.current, id, allIds)
      } else {
        onToggleSelection(id)
      }
      lastClickedRef.current = id
    },
    [allIds, onToggleSelection, onSelectRange],
  )

  // Handle row click (for non-checkbox area)
  const handleRowClick = useCallback(
    (e: React.MouseEvent, item: T) => {
      // Don't trigger row click if clicking on checkbox
      if ((e.target as HTMLElement).closest('[role="checkbox"]')) {
        return
      }
      onRowClick?.(item)
    },
    [onRowClick],
  )

  // Render cell content
  const renderCell = (item: T, column: SelectableColumnDef<T>): React.ReactNode => {
    if (column.cell) {
      return column.cell(item)
    }
    if (typeof column.accessor === 'function') {
      return column.accessor(item)
    }
    return String(item[column.accessor] ?? '')
  }

  // Render mobile card for an item
  const renderMobileCard = (item: T): React.ReactNode => {
    const id = String(item[idField])
    const isSelected = selectedIds.has(id)
    const canSelect = isSelected || !maxReached

    // Determine title, description, and detail columns
    const titleColumn = cardTitleColumn ? columns.find((c) => c.id === cardTitleColumn) : columns[0]
    const descColumn = cardDescriptionColumn
      ? columns.find((c) => c.id === cardDescriptionColumn)
      : columns[1]
    const displayColumns = mobileCardColumns
      ? columns.filter((c) => mobileCardColumns.includes(c.id))
      : columns.filter((c) => c !== titleColumn && c !== descColumn).slice(0, 4)

    return (
      <Card
        key={id}
        className={cn(
          'transition-colors',
          isSelected && 'ring-2 ring-primary bg-primary/5',
          onRowClick && 'cursor-pointer hover:bg-accent/50 active:bg-accent',
          rowClassName?.(item, isSelected),
        )}
        onClick={(e) => handleRowClick(e as React.MouseEvent, item)}
        data-selected={isSelected}
      >
        <CardContent className="p-4 space-y-3">
          {/* Card Header with Checkbox */}
          <div className="flex items-start gap-3">
            <div
              className="flex items-center justify-center min-h-11 min-w-11"
              role="checkbox"
              aria-checked={isSelected}
            >
              <Checkbox
                checked={isSelected}
                onClick={(e) => handleRowCheckboxClick(e, id)}
                disabled={selectionDisabled || (!isSelected && !canSelect)}
                aria-label={t('accessibility.selectionCheckbox', {
                  name: (item as Record<string, unknown>).name || id,
                })}
              />
            </div>
            <div className="flex-1 min-w-0">
              {titleColumn && (
                <div className="font-medium text-sm sm:text-base truncate">
                  {renderCell(item, titleColumn)}
                </div>
              )}
              {descColumn && descColumn !== titleColumn && (
                <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2">
                  {renderCell(item, descColumn)}
                </div>
              )}
            </div>
          </div>

          {/* Card Details */}
          {displayColumns.length > 0 && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-border">
              {displayColumns.map((column) => (
                <div key={column.id} className="space-y-0.5">
                  <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">
                    {t(column.headerKey, { defaultValue: column.headerKey })}
                  </div>
                  <div className="text-xs sm:text-sm font-medium">{renderCell(item, column)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('w-full', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* View Toggle (mobile only) */}
      {enableViewToggle && (
        <div className="flex items-center justify-between mb-3 sm:hidden">
          <div className="text-xs text-muted-foreground">
            {selectedCount > 0 && (
              <span>
                {t('selection.selected', { count: selectedCount })} / {data.length}
              </span>
            )}
          </div>
          <div className="flex items-center rounded-md border border-input p-0.5">
            <Button
              variant={viewMode === 'card' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0 min-h-11 min-w-11"
              onClick={() => setViewMode('card')}
              aria-label={t('accessibility.cardView', { defaultValue: 'Card view' })}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0 min-h-11 min-w-11"
              onClick={() => setViewMode('table')}
              aria-label={t('accessibility.tableView', { defaultValue: 'Table view' })}
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Card View */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 gap-3">
          {data.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {emptyMessage || t('errors.noSelection')}
              </CardContent>
            </Card>
          ) : (
            data.map((item) => renderMobileCard(item))
          )}
        </div>
      )}

      {/* Desktop Table View */}
      {viewMode === 'table' && (
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {/* Selection checkbox column */}
                <TableHead className="w-12">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={allSelected ? true : partiallySelected ? 'indeterminate' : false}
                      onCheckedChange={handleSelectAll}
                      disabled={selectionDisabled || data.length === 0}
                      aria-label={t('accessibility.selectAllCheckbox')}
                    />
                  </div>
                </TableHead>

                {/* Data columns */}
                {columns.map((column) => (
                  <TableHead
                    key={column.id}
                    className={cn(
                      column.width && `w-[${column.width}]`,
                      column.align === 'center' && 'text-center',
                      column.align === 'end' && 'text-end',
                    )}
                  >
                    {t(column.headerKey, { defaultValue: column.headerKey })}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {emptyMessage || t('errors.noSelection')}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => {
                  const id = String(item[idField])
                  const isSelected = selectedIds.has(id)
                  const canSelect = isSelected || !maxReached

                  return (
                    <TableRow
                      key={id}
                      onClick={(e) => handleRowClick(e, item)}
                      className={cn(
                        'cursor-pointer',
                        isSelected && 'bg-blue-50 dark:bg-blue-950',
                        onRowClick && 'hover:bg-muted/50',
                        rowClassName?.(item, isSelected),
                      )}
                      data-selected={isSelected}
                    >
                      {/* Selection checkbox */}
                      <TableCell className="w-12">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={isSelected}
                            onClick={(e) => handleRowCheckboxClick(e, id)}
                            disabled={selectionDisabled || (!isSelected && !canSelect)}
                            aria-label={t('accessibility.selectionCheckbox', {
                              name: (item as Record<string, unknown>).name || id,
                            })}
                          />
                        </div>
                      </TableCell>

                      {/* Data cells */}
                      {columns.map((column) => (
                        <TableCell
                          key={column.id}
                          className={cn(
                            column.align === 'center' && 'text-center',
                            column.align === 'end' && 'text-end',
                          )}
                        >
                          {renderCell(item, column)}
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Selection info footer (desktop) */}
      {selectedCount > 0 && !isMobile && (
        <div className="flex items-center justify-between p-3 border-t bg-muted/30 text-sm">
          <span className="text-muted-foreground">
            {t('selection.selected', { count: selectedCount })} / {data.length}
          </span>
          {maxReached && (
            <span className="text-xs text-orange-600 dark:text-orange-400">
              {t('selection.maxReachedDescription', { max: MAX_BULK_SELECTION })}
            </span>
          )}
        </div>
      )}

      {/* Mobile Bulk Action Bar */}
      {isMobile && selectedCount > 0 && (
        <MobileActionBar variant="auto" blurBackground>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{selectedCount}</span>
            <span>{t('selection.selected', { count: selectedCount })}</span>
            {maxReached && (
              <span className="text-xs text-orange-600 dark:text-orange-400">
                ({t('selection.maxReachedDescription', { max: MAX_BULK_SELECTION })})
              </span>
            )}
          </div>
          {bulkActions && <MobileActionBar.ActionGroup>{bulkActions}</MobileActionBar.ActionGroup>}
        </MobileActionBar>
      )}
    </div>
  )
}

export default SelectableDataTable
