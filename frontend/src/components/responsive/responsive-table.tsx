import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useResponsive } from '../../hooks/use-responsive';
import { useDirection } from '../../hooks/use-theme';
import { cn } from '../../lib/utils';

export interface ResponsiveTableColumn<T> {
  key: string;
  header: string;
  accessor: (item: T) => React.ReactNode;
  priority?: 'high' | 'medium' | 'low';
  hideOnMobile?: boolean;
  mobileLabel?: string;
  align?: 'left' | 'center' | 'right';
}

export interface ResponsiveTableProps<T> {
  data: T[];
  columns: ResponsiveTableColumn<T>[];
  className?: string;
  mobileView?: 'card' | 'list' | 'table';
  striped?: boolean;
  hoverable?: boolean;
  emptyMessage?: string;
}

export function ResponsiveTable<T extends { id?: string | number }>({
  data,
  columns,
  className,
  mobileView = 'card',
  striped = false,
  hoverable = true,
  emptyMessage = 'No data available',
}: ResponsiveTableProps<T>) {
  const { viewport, isMobile } = useResponsive();
  const { isRTL } = useDirection();
  
  const visibleColumns = isMobile 
    ? columns.filter(col => !col.hideOnMobile)
    : columns;
  
  const highPriorityColumns = columns.filter(col => col.priority === 'high');
  const shouldUseMobileView = isMobile && mobileView !== 'table';
  
  if (data.length === 0) {
    return (
      <div className={cn(
        'text-center py-8 text-muted-foreground',
        className
      )}>
        {emptyMessage}
      </div>
    );
  }
  
  if (shouldUseMobileView && mobileView === 'card') {
    return (
      <div className={cn('space-y-4', className)}>
        {data.map((item, index) => (
          <Card key={item.id || index} className="border-[0.5px]">
            <CardContent className="p-4 space-y-2">
              {visibleColumns.map(column => (
                <div
                  key={column.key}
                  className={cn(
                    'flex justify-between items-center',
                    column.priority === 'high' && 'font-medium'
                  )}
                >
                  <span className="text-sm text-muted-foreground">
                    {column.mobileLabel || column.header}:
                  </span>
                  <span className={cn(
                    'text-sm',
                    column.align === 'right' && 'text-right',
                    column.align === 'center' && 'text-center'
                  )}>
                    {column.accessor(item)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (shouldUseMobileView && mobileView === 'list') {
    return (
      <div className={cn('space-y-2', className)}>
        {data.map((item, index) => (
          <div
            key={item.id || index}
            className={cn(
              'p-3 border-[0.5px] rounded-md',
              hoverable && 'hover:bg-accent/50 transition-colors'
            )}
          >
            <div className="space-y-1">
              {highPriorityColumns.map(column => (
                <div key={column.key} className="font-medium">
                  {column.accessor(item)}
                </div>
              ))}
              {visibleColumns
                .filter(col => col.priority !== 'high')
                .map(column => (
                  <div key={column.key} className="text-sm text-muted-foreground">
                    <span className="font-medium">{column.mobileLabel || column.header}:</span>{' '}
                    {column.accessor(item)}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className={cn(
      'w-full overflow-auto',
      isMobile && 'max-w-full',
      className
    )}>
      <Table>
        <TableHeader>
          <TableRow>
            {visibleColumns.map(column => (
              <TableHead
                key={column.key}
                className={cn(
                  column.align === 'right' && 'text-right',
                  column.align === 'center' && 'text-center',
                  isRTL && column.align === 'right' && 'text-left',
                  isRTL && column.align === 'left' && 'text-right'
                )}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow
              key={item.id || index}
              className={cn(
                striped && index % 2 === 0 && 'bg-accent/20',
                hoverable && 'hover:bg-accent/50 transition-colors'
              )}
            >
              {visibleColumns.map(column => (
                <TableCell
                  key={column.key}
                  className={cn(
                    column.align === 'right' && 'text-right',
                    column.align === 'center' && 'text-center',
                    isRTL && column.align === 'right' && 'text-left',
                    isRTL && column.align === 'left' && 'text-right'
                  )}
                >
                  {column.accessor(item)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export interface ResponsiveDataGridProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveDataGrid({ children, className }: ResponsiveDataGridProps) {
  const { viewport } = useResponsive();
  
  const gridClasses = {
    mobile: 'grid-cols-1',
    tablet: 'grid-cols-2 lg:grid-cols-3',
    desktop: 'grid-cols-3 xl:grid-cols-4',
    wide: 'grid-cols-4 2xl:grid-cols-5',
  };
  
  return (
    <div className={cn(
      'grid gap-4',
      gridClasses[viewport],
      className
    )}>
      {children}
    </div>
  );
}