/**
 * UnifiedKanbanColumn - Column skeleton component
 * Feature: 034-unified-kanban
 *
 * Note: The main column rendering is now handled by the KanbanColumn
 * component from ui/kanban. This file provides the skeleton component
 * for loading states.
 */

import { UnifiedKanbanCardSkeleton } from './UnifiedKanbanCard'

// Re-export the column from kanban UI for convenience
export { KanbanColumn as UnifiedKanbanColumn } from '@/components/ui/kanban'

/**
 * Skeleton for loading state
 */
export function UnifiedKanbanColumnSkeleton() {
  return (
    <div className="flex flex-col rounded-lg border bg-muted/30 w-full sm:w-[300px] sm:min-w-[300px] h-[500px]">
      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
        <div className="h-5 w-20 bg-muted rounded animate-pulse" />
        <div className="h-5 w-6 bg-muted rounded-full animate-pulse" />
      </div>
      <div className="flex-1 p-2 space-y-2">
        <UnifiedKanbanCardSkeleton />
        <UnifiedKanbanCardSkeleton />
        <UnifiedKanbanCardSkeleton />
      </div>
    </div>
  )
}
