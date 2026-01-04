/**
 * DataTable Component
 * Mobile-first responsive data table with card view for mobile devices
 * Full RTL support with logical properties
 */

import React, { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type VisibilityState,
} from '@tanstack/react-table'
import type { ColumnDef, SortingState, ColumnFiltersState, Row } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  TableIcon,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageSize?: number
  pageSizeOptions?: number[]
  enableFiltering?: boolean
  enableSorting?: boolean
  enablePagination?: boolean
  enableColumnVisibility?: boolean
  enableViewToggle?: boolean
  onRowClick?: (row: TData) => void
  isLoading?: boolean
  emptyMessage?: string
  searchPlaceholder?: string
  /** Columns to show in mobile card view (column IDs) */
  mobileCardColumns?: string[]
  /** Column ID to use as card title */
  cardTitleColumn?: string
  /** Column ID to use as card description */
  cardDescriptionColumn?: string
}

type ViewMode = 'table' | 'card'

export function DataTable<TData, TValue>({
  columns,
  data,
  pageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  enableFiltering = true,
  enableSorting = true,
  enablePagination = true,
  enableColumnVisibility = true,
  enableViewToggle = true,
  onRowClick,
  isLoading = false,
  emptyMessage,
  searchPlaceholder,
  mobileCardColumns,
  cardTitleColumn,
  cardDescriptionColumn,
}: DataTableProps<TData, TValue>) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  })

  // Get visible columns for mobile card view
  const visibleColumns = useMemo(() => {
    return table.getAllColumns().filter((col) => col.getIsVisible())
  }, [table, columnVisibility])

  // Render sort icon
  const renderSortIcon = (isSorted: false | 'asc' | 'desc') => {
    if (isSorted === 'asc') return <ArrowUp className="h-3.5 w-3.5 flex-shrink-0" />
    if (isSorted === 'desc') return <ArrowDown className="h-3.5 w-3.5 flex-shrink-0" />
    return <ArrowUpDown className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
  }

  // Render mobile card
  const renderMobileCard = (row: Row<TData>) => {
    const cells = row.getVisibleCells()
    const titleCell = cardTitleColumn
      ? cells.find((c) => c.column.id === cardTitleColumn)
      : cells[0]
    const descCell = cardDescriptionColumn
      ? cells.find((c) => c.column.id === cardDescriptionColumn)
      : cells[1]
    const displayCells = mobileCardColumns
      ? cells.filter((c) => mobileCardColumns.includes(c.column.id))
      : cells.slice(2, 5)

    return (
      <Card
        key={row.id}
        className={cn(
          'transition-colors',
          onRowClick && 'cursor-pointer hover:bg-accent/50 active:bg-accent',
        )}
        onClick={() => onRowClick?.(row.original)}
      >
        <CardContent className="p-4 space-y-3">
          {/* Card Header */}
          {titleCell && (
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm sm:text-base truncate">
                  {flexRender(titleCell.column.columnDef.cell, titleCell.getContext())}
                </div>
                {descCell && descCell !== titleCell && (
                  <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2">
                    {flexRender(descCell.column.columnDef.cell, descCell.getContext())}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Card Details */}
          {displayCells.length > 0 && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-border">
              {displayCells.map((cell) => (
                <div key={cell.id} className="space-y-0.5">
                  <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">
                    {typeof cell.column.columnDef.header === 'string'
                      ? cell.column.columnDef.header
                      : cell.column.id}
                  </div>
                  <div className="text-xs sm:text-sm font-medium">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 min-w-0 w-full" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        {/* Search */}
        {enableFiltering && (
          <div className="relative flex-1 max-w-xs">
            <Search
              className={cn(
                'absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground',
                isRTL ? 'end-2.5' : 'start-2.5',
              )}
            />
            <Input
              type="text"
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={searchPlaceholder || t('common.search', 'Search...')}
              className={cn('w-full h-8 text-sm', isRTL ? 'pe-2.5 ps-8' : 'ps-8 pe-2.5')}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {/* View Toggle - Show only on mobile */}
          {enableViewToggle && (
            <div className="flex items-center rounded-md border border-input p-0.5 sm:hidden">
              <Button
                variant={viewMode === 'card' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setViewMode('card')}
                aria-label={t('common.cardView', 'Card view')}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setViewMode('table')}
                aria-label={t('common.tableView', 'Table view')}
              >
                <TableIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {/* Column Visibility */}
          {enableColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t('common.columns', 'Columns')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-44">
                <DropdownMenuLabel className="text-xs">
                  {t('common.toggleColumns', 'Toggle columns')}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter((col) => col.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      className="capitalize text-xs"
                    >
                      {typeof column.columnDef.header === 'string'
                        ? column.columnDef.header
                        : column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Mobile Card View */}
      <div className={cn('sm:hidden', viewMode === 'table' && 'hidden')}>
        {table.getRowModel().rows.length > 0 ? (
          <div className="space-y-3">
            {table.getRowModel().rows.map((row) => renderMobileCard(row))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {emptyMessage || t('common.noResults', 'No results found.')}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desktop Table View */}
      <div
        className={cn(
          'rounded-md border border-border overflow-hidden',
          viewMode === 'card' ? 'hidden sm:block' : 'hidden sm:block',
        )}
      >
        <table className="w-full table-fixed">
          <thead className="bg-muted/40 border-b border-border">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const size = header.column.columnDef.size
                  const hasFixedWidth = size && size !== 150 // 150 is default

                  return (
                    <th
                      key={header.id}
                      className={cn(
                        'px-3 py-2 text-start text-[11px] font-medium text-muted-foreground uppercase tracking-wide overflow-hidden',
                        header.column.getCanSort() &&
                          'cursor-pointer select-none hover:text-foreground',
                        !hasFixedWidth && 'max-w-0',
                      )}
                      style={hasFixedWidth ? { width: size } : undefined}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center gap-1">
                          <span className="truncate">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          {header.column.getCanSort() &&
                            renderSortIcon(header.column.getIsSorted())}
                        </div>
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    'bg-background transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-accent/50',
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => {
                    const size = cell.column.columnDef.size
                    const hasFixedWidth = size && size !== 150

                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          'px-3 py-2 text-sm text-foreground align-top overflow-hidden',
                          !hasFixedWidth && 'max-w-0',
                        )}
                        style={hasFixedWidth ? { width: size } : undefined}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    )
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="h-20 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage || t('common.noResults', 'No results found.')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {enablePagination && table.getRowModel().rows.length > 0 && (
        <div className="flex items-center justify-between pt-1">
          {/* Results info & Page size */}
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {t('common.showing', 'Showing')}{' '}
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
              {' - '}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                data.length,
              )}{' '}
              {t('common.of', 'of')} {data.length}
            </p>

            {/* Page size selector */}
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="h-7 w-[60px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)} className="text-xs">
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pagination controls */}
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              aria-label={t('common.firstPage', 'First page')}
            >
              {isRTL ? (
                <ChevronsRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronsLeft className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label={t('common.previousPage', 'Previous page')}
            >
              {isRTL ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronLeft className="h-3.5 w-3.5" />
              )}
            </Button>

            <span className="px-1.5 text-xs text-muted-foreground whitespace-nowrap">
              {t('common.page', 'Page')} {table.getState().pagination.pageIndex + 1} /{' '}
              {table.getPageCount() || 1}
            </span>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label={t('common.nextPage', 'Next page')}
            >
              {isRTL ? (
                <ChevronLeft className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              aria-label={t('common.lastPage', 'Last page')}
            >
              {isRTL ? (
                <ChevronsLeft className="h-3.5 w-3.5" />
              ) : (
                <ChevronsRight className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable
