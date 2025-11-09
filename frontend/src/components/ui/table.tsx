import * as React from 'react'

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
 return <table role="table" className={className} {...props} />
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
 return <thead role="rowgroup" className={className} {...props} />
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
 return <tbody role="rowgroup" className={className} {...props} />
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
 return <tr role="row" className={className} {...props} />
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
 return <th role="columnheader" className={className} {...props} />
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
 return <td role="cell" className={className} {...props} />
}

