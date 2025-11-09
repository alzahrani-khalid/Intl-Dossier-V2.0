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
 Search,
 X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
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

interface AdvancedDataTableProps<TData, TValue> {
 columns: ColumnDef<TData, TValue>[]
 data: TData[]
 searchPlaceholder?: string
 onRowClick?: (row: TData) => void
 enableRowSelection?: boolean
 enableExport?: boolean
 exportFileName?: string
}

export function AdvancedDataTable<TData, TValue>({
 columns,
 data,
 searchPlaceholder,
 onRowClick,
 enableRowSelection = false,
 enableExport = true,
 exportFileName = 'export',
}: AdvancedDataTableProps<TData, TValue>) {
 const { t, i18n } = useTranslation()
 const isRTL = i18n.dir() === 'rtl'

 const [sorting, setSorting] = React.useState<SortingState>([])
 const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
 const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
 const [rowSelection, setRowSelection] = React.useState({})
 const [globalFilter, setGlobalFilter] = React.useState('')

 // Add selection column if enabled
 const tableColumns = React.useMemo(() => {
 if (!enableRowSelection) return columns

 const selectionColumn: ColumnDef<TData> = {
 id: 'select',
 header: ({ table }) => (
 <Checkbox
 checked={
 table.getIsAllPageRowsSelected() ||
 (table.getIsSomePageRowsSelected() && 'indeterminate')
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
 <Search className={cn(
 "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none",
 isRTL ? "right-3" : "left-3"
 )} />
 <Input
 placeholder={searchPlaceholder || t('common:searchAll')}
 value={globalFilter ?? ''}
 onChange={(event) => setGlobalFilter(event.target.value)}
 className={cn(
 "w-full",
 isRTL ? "pr-10 pl-10" : "pl-10 pr-10"
 )}
 />
 {globalFilter && (
 <Button
 variant="ghost"
 size="sm"
 className={cn(
 "absolute top-1/2 -translate-y-1/2 h-7 w-7 p-0",
 isRTL ? "left-1" : "right-1"
 )}
 onClick={() => setGlobalFilter('')}
 >
 <X className="h-4 w-4" />
 </Button>
 )}
 </div>

 {/* Column Visibility & Export */}
 <div className="flex gap-2">
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

 {/* Table */}
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
 "px-3 py-2 sm:px-4 sm:py-3 lg:px-6",
 header.column.getCanSort() && "cursor-pointer select-none"
 )}
 onClick={header.column.getToggleSortingHandler()}
 >
 {header.isPlaceholder ? null : (
 <div className={cn(
 "flex items-center gap-2",
 header.column.getCanSort() && "hover:text-foreground"
 )}>
 {flexRender(
 header.column.columnDef.header,
 header.getContext()
 )}
 {header.column.getCanSort() && (
 <ArrowUpDown className="h-3 w-3" />
 )}
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
 'transition-colors'
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
 <TableCell
 colSpan={tableColumns.length}
 className="h-24 text-center"
 >
 {t('common:noData')}
 </TableCell>
 </TableRow>
 )}
 </TableBody>
 </Table>
 </div>
 </div>

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
 {t('common:showing')} {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} -{' '}
 {Math.min(
 (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
 data.length
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
