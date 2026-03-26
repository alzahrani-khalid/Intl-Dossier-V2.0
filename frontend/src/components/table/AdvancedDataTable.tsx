import * as React from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Row,
} from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import {
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  LayoutGrid,
  Search,
  TableIcon,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useResponsive } from '@/hooks/useResponsive'

type ViewMode = 'table' | 'card'

interface AdvancedDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchPlaceholder?: string
  onRowClick?: (row: TData) => void
  enableRowSelection?: boolean
  enableExport?: boolean
  exportFileName?: string
  /** Show table/card toggle button */
  enableViewToggle?: boolean
  /** Column IDs to show in card view */
  mobileCardColumns?: string[]
  /** Column ID for card title */
  cardTitleColumn?: string
  /** Column ID for card description */
  cardDescriptionColumn?: string
}

export function AdvancedDataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder,
  onRowClick,
  enableRowSelection = false,
  enableExport = true,
  exportFileName = 'export',
  enableViewToggle = true,
  mobileCardColumns,
  cardTitleColumn,
  cardDescriptionColumn,
}: AdvancedDataTableProps<TData, TValue>) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'
  const { isMobile } = useResponsive()

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [viewMode, setViewMode] = React.useState<ViewMode>(isMobile ? 'card' : 'table')

  // Auto-switch view mode when viewport changes
  React.useEffect(() => {
    setViewMode(isMobile ? 'card' : 'table')
  }, [isMobile])

  // Add selection column if enabled
  const tableColumns = React.useMemo(() => {
    if (!enableRowSelection) return columns

    const selectionColumn: ColumnDef<TData> = {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? ('indeterminate' as const)
                : false
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={t('common:selectAll')}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t('common:selectRow')}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }

    return [selectionColumn, ...columns]
  }, [columns, enableRowSelection, t])

  const table = useReactTable({
    data,
    columns: tableColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  })

  // Render mobile card for a row
  const renderMobileCard = (row: Row<TData>): React.ReactNode => {
    const cells = row.getVisibleCells()
    const titleCell = cardTitleColumn
      ? cells.find((c) => c.column.id === cardTitleColumn)
      : (cells.find((c) => c.column.id !== 'select') ?? cells[0])
    const descCell = cardDescriptionColumn
      ? cells.find((c) => c.column.id === cardDescriptionColumn)
      : cells.find((c) => c.column.id !== 'select' && c !== titleCell)
    const displayCells = mobileCardColumns
      ? cells.filter((c) => mobileCardColumns.includes(c.column.id))
      : cells
          .filter(
            (c) =>
              c !== titleCell &&
              c !== descCell &&
              c.column.id !== 'select' &&
              c.column.id !== 'actions',
          )
          .slice(0, 4)

    return (
      <Card
        key={row.id}
        className={cn(
          'transition-colors',
          onRowClick && 'cursor-pointer hover:bg-accent/50 active:bg-accent',
          row.getIsSelected() && 'ring-2 ring-primary bg-primary/5',
        )}
        onClick={() => onRowClick?.(row.original)}
      >
        <CardContent className="p-4 space-y-3">
          {/* Card Header */}
          <div className="flex items-start justify-between gap-3">
            {enableRowSelection && (
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label={t('common:selectRow')}
                className="mt-0.5 min-h-11 min-w-11 flex items-center justify-center"
              />
            )}
            <div className="flex-1 min-w-0">
              {titleCell && (
                <div className="font-medium text-sm sm:text-base truncate">
                  {flexRender(titleCell.column.columnDef.cell, titleCell.getContext())}
                </div>
              )}
              {descCell && descCell !== titleCell && (
                <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2">
                  {flexRender(descCell.column.columnDef.cell, descCell.getContext())}
                </div>
              )}
            </div>
          </div>

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

  // Export to CSV
  const exportToCSV = () => {
    const rows = table.getFilteredRowModel().rows
    if (rows.length === 0) return

    // Get visible columns (excluding select column)
    const visibleColumns = table
      .getAllColumns()
      .filter((col) => col.getIsVisible() && col.id !== 'select' && col.id !== 'actions')

    // Create CSV header
    const headers = visibleColumns.map((col) => {
      const headerValue = col.columnDef.header
      if (typeof headerValue === 'string') return headerValue
      return col.id
    })

    // Create CSV rows
    const csvRows = rows.map((row) => {
      return visibleColumns.map((col) => {
        const cellValue = row.getValue(col.id)
        // Handle different value types
        if (cellValue === null || cellValue === undefined) return ''
        if (typeof cellValue === 'object') return JSON.stringify(cellValue)
        return String(cellValue).replace(/"/g, '""') // Escape quotes
      })
    })

    // Combine header and rows
    const csvContent = [
      headers.join(','),
      ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${exportFileName}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="w-full space-y-3 sm:space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Global Search */}
        <div className="relative flex-1">
          <Search
            className={cn(
              'absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none',
              isRTL ? 'end-3' : 'start-3',
            )}
          />
          <Input
            placeholder={searchPlaceholder || t('common:searchAll')}
            value={globalFilter ?? ''}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className={cn('w-full', isRTL ? 'pe-10 ps-10' : 'ps-10 pe-10')}
          />
          {globalFilter && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'absolute top-1/2 -translate-y-1/2 h-7 w-7 p-0',
                isRTL ? 'start-1' : 'end-1',
              )}
              onClick={() => setGlobalFilter('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* View Toggle, Column Visibility & Export */}
        <div className="flex gap-2">
          {/* View Toggle */}
          {enableViewToggle && (
            <div className="flex items-center rounded-md border border-input p-0.5 sm:hidden">
              <Button
                variant={viewMode === 'card' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0 min-h-11 min-w-11"
                onClick={() => setViewMode('card')}
                aria-label={t('common:cardView', { defaultValue: 'Card view' })}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0 min-h-11 min-w-11"
                onClick={() => setViewMode('table')}
                aria-label={t('common:tableView', { defaultValue: 'Table view' })}
              >
                <TableIcon className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className=" sm:min-h-0">
                <ChevronDown className="h-4 w-4 me-2" />
                {t('common:columns')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export */}
          {enableExport && (
            <Button
              variant="outline"
              onClick={exportToCSV}
              disabled={data.length === 0}
              className=" sm:min-h-0"
            >
              <Download className="h-4 w-4 me-2" />
              {t('common:export')}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Card View */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 gap-3">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => renderMobileCard(row))
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {t('common:noData')}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto touch-pan-x">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead
                          key={header.id}
                          className={cn(
                            'px-3 py-2 sm:px-4 sm:py-3 lg:px-6',
                            header.column.getCanSort() && 'cursor-pointer select-none',
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {header.isPlaceholder ? null : (
                            <div
                              className={cn(
                                'flex items-center gap-2',
                                header.column.getCanSort() && 'hover:text-foreground',
                              )}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getCanSort() && <ArrowUpDown className="h-3 w-3" />}
                            </div>
                          )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className={cn(
                        onRowClick && 'cursor-pointer hover:bg-accent/50',
                        'transition-colors',
                      )}
                      onClick={() => onRowClick?.(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="px-3 py-3 sm:px-4 sm:py-4 lg:px-6 text-xs sm:text-sm"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={tableColumns.length} className="h-24 text-center">
                      {t('common:noData')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        {/* Selection info */}
        {enableRowSelection && (
          <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
            {table.getFilteredSelectedRowModel().rows.length} {t('common:of')}{' '}
            {table.getFilteredRowModel().rows.length} {t('common:selected')}
          </div>
        )}

        {/* Results count */}
        {!enableRowSelection && (
          <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
            {t('common:showing')}{' '}
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} -{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              data.length,
            )}{' '}
            {t('common:of')} {data.length}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className=" min-w-[44px] sm:min-h-0 sm:min-w-0"
          >
            {isRTL ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className=" min-w-[44px] sm:min-h-0 sm:min-w-0"
          >
            {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>

          <span className="text-xs sm:text-sm text-muted-foreground px-2 whitespace-nowrap">
            {t('common:page')} {table.getState().pagination.pageIndex + 1} {t('common:of')}{' '}
            {table.getPageCount()}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className=" min-w-[44px] sm:min-h-0 sm:min-w-0"
          >
            {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className=" min-w-[44px] sm:min-h-0 sm:min-w-0"
          >
            {isRTL ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
