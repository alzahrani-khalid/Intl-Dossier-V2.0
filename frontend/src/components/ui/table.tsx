import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * TableContainer - Wrapper for horizontal scrolling on mobile
 * Prevents tables from causing horizontal overflow on small screens
 */
export function TableContainer({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="table-container"
      className={cn('w-full overflow-x-auto scrollbar-thin -mx-4 px-4 sm:mx-0 sm:px-0', className)}
      data-testid="table-container"
      {...props}
    >
      {children}
    </div>
  )
}

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <table
      data-slot="table"
      role="table"
      className={cn('tbl caption-bottom', className)}
      {...props}
    />
  )
}

export function TableHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead data-slot="table-header" role="rowgroup" className={cn(className)} {...props} />
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody data-slot="table-body" role="rowgroup" className={cn(className)} {...props} />
}

export function TableFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot
      data-slot="table-footer"
      role="rowgroup"
      className={cn('border-t border-[var(--line)] font-medium', className)}
      {...props}
    />
  )
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      data-slot="table-row"
      role="row"
      className={cn('transition-colors data-[state=selected]:bg-[var(--accent-soft)]', className)}
      {...props}
    />
  )
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      data-slot="table-head"
      role="columnheader"
      className={cn('align-middle [&:has([role=checkbox])]:pe-0', className)}
      {...props}
    />
  )
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      data-slot="table-cell"
      role="cell"
      className={cn('align-middle [&:has([role=checkbox])]:pe-0', className)}
      {...props}
    />
  )
}

export function TableCaption({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableCaptionElement>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('text-muted-foreground mt-4 text-sm', className)}
      {...props}
    />
  )
}
