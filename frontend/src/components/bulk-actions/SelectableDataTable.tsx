import { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import type {
  BulkSelectableItem,
  BulkSelectionState,
  SelectableColumnDef,
} from '@/types/bulk-actions.types'
import { MAX_BULK_SELECTION } from '@/types/bulk-actions.types'
import { cn } from '@/lib/utils'

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
}: SelectableDataTableProps<T>) {
  const { t, i18n } = useTranslation('bulk-actions')
  const isRTL = i18n.language === 'ar'
  const lastClickedRef = useRef<string | null>(null)

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
  const renderCell = (item: T, column: SelectableColumnDef<T>) => {
    if (column.cell) {
      return column.cell(item)
    }
    if (typeof column.accessor === 'function') {
      return column.accessor(item)
    }
    return String(item[column.accessor] ?? '')
  }

  return (
    <div className={cn('w-full overflow-auto', className)} dir={isRTL ? 'rtl' : 'ltr'}>
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

      {/* Selection info footer */}
      {selectedCount > 0 && (
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
    </div>
  )
}

export default SelectableDataTable
