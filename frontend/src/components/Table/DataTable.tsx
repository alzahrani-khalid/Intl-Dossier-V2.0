import React from 'react'
import {
 useReactTable,
 getCoreRowModel,
 getPaginationRowModel,
 getSortedRowModel,
 getFilteredRowModel,
 flexRender,
} from '@tanstack/react-table'
import type {
 ColumnDef,
 SortingState,
 ColumnFiltersState,
} from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from 'lucide-react'

interface DataTableProps<TData, TValue> {
 columns: ColumnDef<TData, TValue>[]
 data: TData[]
 pageSize?: number
 enableFiltering?: boolean
 enableSorting?: boolean
 enablePagination?: boolean
 onRowClick?: (row: TData) => void
}

export function DataTable<TData, TValue>({
 columns,
 data,
 pageSize = 10,
 enableFiltering = true,
 enableSorting = true,
 enablePagination = true,
 onRowClick,
}: DataTableProps<TData, TValue>) {
 const { t, i18n } = useTranslation()
 const isRTL = i18n.dir() === 'rtl'

 const [sorting, setSorting] = React.useState<SortingState>([])
 const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
 const [globalFilter, setGlobalFilter] = React.useState('')

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
 state: {
 sorting,
 columnFilters,
 globalFilter,
 },
 initialState: {
 pagination: {
 pageSize,
 },
 },
 })

 return (
 <div className="space-y-3 sm:space-y-4">
 {/* Global Search - Mobile First */}
 {enableFiltering && (
 <div className="px-2 sm:px-0">
 <input
 type="text"
 value={globalFilter ?? ''}
 onChange={(e) => setGlobalFilter(e.target.value)}
 placeholder={t('common.search')}
 className="w-full sm:max-w-sm px-3 py-2 sm:px-4 text-sm sm:text-base border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
 />
 </div>
 )}

 {/* Table - Responsive with better scroll */}
 <div className="rounded-lg border border-border overflow-hidden">
 <div className="overflow-x-auto touch-pan-x">
 <table className="w-full min-w-max">
 <thead className="bg-muted/50">
 {table.getHeaderGroups().map((headerGroup) => (
 <tr key={headerGroup.id}>
 {headerGroup.headers.map((header) => (
 <th
 key={header.id}
 className={`px-3 py-2 sm:px-4 sm:py-3 lg:px-6 text-${isRTL ? 'end' : 'start'} text-xs font-medium text-muted-foreground uppercase tracking-wider`}
 >
 {header.isPlaceholder ? null : (
 <div
 className={
 header.column.getCanSort()
 ? 'flex items-center gap-1 sm:gap-2 cursor-pointer select-none hover:text-foreground min-h-[44px] sm:min-h-0'
 : 'min-h-[44px] sm:min-h-0 flex items-center'
 }
 onClick={header.column.getToggleSortingHandler()}
 >
 {flexRender(
 header.column.columnDef.header,
 header.getContext()
 )}
 {header.column.getCanSort() && (
 <ArrowUpDown className="h-3 w-3 flex-shrink-0" />
 )}
 </div>
 )}
 </th>
 ))}
 </tr>
 ))}
 </thead>
 <tbody className="bg-background divide-y divide-border">
 {table.getRowModel().rows.map((row) => (
 <tr
 key={row.id}
 className={`hover:bg-accent/50 transition-colors ${onRowClick ? 'cursor-pointer active:bg-accent' : ''}`}
 onClick={() => onRowClick?.(row.original)}
 >
 {row.getVisibleCells().map((cell) => (
 <td
 key={cell.id}
 className="px-3 py-3 sm:px-4 sm:py-4 lg:px-6 whitespace-nowrap text-xs sm:text-sm text-foreground"
 >
 {flexRender(cell.column.columnDef.cell, cell.getContext())}
 </td>
 ))}
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 {/* Pagination - Mobile First */}
 {enablePagination && (
 <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-2 sm:px-0">
 {/* Results count */}
 <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
 {t('Showing')} {table.getState().pagination.pageIndex * pageSize + 1} -{' '}
 {Math.min(
 (table.getState().pagination.pageIndex + 1) * pageSize,
 data.length
 )}{' '}
 {t('of')} {data.length}
 </div>

 {/* Pagination controls - Touch friendly */}
 <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
 <button
 onClick={() => table.setPageIndex(0)}
 disabled={!table.getCanPreviousPage()}
 className=" min-w-[44px] sm:min-h-0 sm:min-w-0 sm:p-2 flex items-center justify-center rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
 aria-label="First page"
 >
 {isRTL ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
 </button>
 <button
 onClick={() => table.previousPage()}
 disabled={!table.getCanPreviousPage()}
 className=" min-w-[44px] sm:min-h-0 sm:min-w-0 sm:p-2 flex items-center justify-center rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
 aria-label="Previous page"
 >
 {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
 </button>

 <span className="text-xs sm:text-sm text-muted-foreground px-2 whitespace-nowrap">
 {t('Page')} {table.getState().pagination.pageIndex + 1} {t('of')}{' '}
 {table.getPageCount()}
 </span>

 <button
 onClick={() => table.nextPage()}
 disabled={!table.getCanNextPage()}
 className=" min-w-[44px] sm:min-h-0 sm:min-w-0 sm:p-2 flex items-center justify-center rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
 aria-label="Next page"
 >
 {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
 </button>
 <button
 onClick={() => table.setPageIndex(table.getPageCount() - 1)}
 disabled={!table.getCanNextPage()}
 className=" min-w-[44px] sm:min-h-0 sm:min-w-0 sm:p-2 flex items-center justify-center rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
 aria-label="Last page"
 >
 {isRTL ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
 </button>
 </div>
 </div>
 )}
 </div>
 )
}