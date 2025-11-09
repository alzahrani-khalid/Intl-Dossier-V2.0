import * as React from 'react';
import { cn } from '@/lib/utils';

// Base Kanban container component
interface KanbanProps extends React.HTMLAttributes<HTMLDivElement> {
 children: React.ReactNode;
}

export const Kanban = React.forwardRef<HTMLDivElement, KanbanProps>(
 ({ className, children, ...props }, ref) => {
 return (
 <div
 ref={ref}
 className={cn(
 'flex gap-4 overflow-x-auto pb-4',
 'min-h-[400px] sm:min-h-[500px] md:min-h-[600px]',
 className
 )}
 {...props}
 >
 {children}
 </div>
 );
 }
);
Kanban.displayName = 'Kanban';

// Column component (droppable area)
interface KanbanColumnProps extends React.HTMLAttributes<HTMLDivElement> {
 title: string;
 count?: number;
 isOver?: boolean;
}

export const KanbanColumn = React.forwardRef<HTMLDivElement, KanbanColumnProps>(
 ({ className, title, count, isOver, children, ...props }, ref) => {
 return (
 <div
 ref={ref}
 className={cn(
 'flex flex-col',
 'min-w-[280px] sm:min-w-[320px] md:min-w-[360px]',
 'rounded-lg border bg-card text-card-foreground shadow-sm',
 isOver && 'ring-2 ring-primary ring-offset-2',
 className
 )}
 {...props}
 >
 <div className="flex items-center justify-between px-4 py-3 border-b">
 <h3 className="text-sm sm:text-base font-semibold text-start">
 {title}
 </h3>
 {count !== undefined && (
 <span className="text-xs sm:text-sm text-muted-foreground px-2 py-1 rounded-md bg-muted">
 {count}
 </span>
 )}
 </div>
 <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-2">
 {children}
 </div>
 </div>
 );
 }
);
KanbanColumn.displayName = 'KanbanColumn';

// Card component (draggable item)
interface KanbanCardProps extends React.HTMLAttributes<HTMLDivElement> {
 isDragging?: boolean;
}

export const KanbanCard = React.forwardRef<HTMLDivElement, KanbanCardProps>(
 ({ className, isDragging, children, ...props }, ref) => {
 return (
 <div
 ref={ref}
 className={cn(
 'rounded-lg border bg-card p-3 sm:p-4',
 'cursor-grab active:cursor-grabbing',
 'transition-shadow hover:shadow-md',
 'min-h-11 min-w-11', // Touch target size
 isDragging && 'opacity-50 shadow-lg scale-105',
 className
 )}
 {...props}
 >
 {children}
 </div>
 );
 }
);
KanbanCard.displayName = 'KanbanCard';

// Empty state component
interface KanbanEmptyProps extends React.HTMLAttributes<HTMLDivElement> {
 message?: string;
}

export const KanbanEmpty = React.forwardRef<HTMLDivElement, KanbanEmptyProps>(
 ({ className, message = 'No items', ...props }, ref) => {
 return (
 <div
 ref={ref}
 className={cn(
 'flex items-center justify-center',
 'p-4 text-sm text-muted-foreground text-center',
 'rounded-md border-2 border-dashed',
 className
 )}
 {...props}
 >
 {message}
 </div>
 );
 }
);
KanbanEmpty.displayName = 'KanbanEmpty';
