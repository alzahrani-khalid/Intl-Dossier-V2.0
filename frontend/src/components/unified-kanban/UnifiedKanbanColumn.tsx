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
    <div className="flex h-[500px] w-full flex-col rounded-lg border bg-muted/30 sm:w-[300px] sm:min-w-[300px]">
      <div className="flex items-center justify-between border-b bg-muted/50 p-3">
        <div className="h-5 w-20 animate-pulse rounded bg-muted" />
        <div className="h-5 w-6 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="flex-1 space-y-2 p-2">
        <UnifiedKanbanCardSkeleton />
        <UnifiedKanbanCardSkeleton />
        <UnifiedKanbanCardSkeleton />
      </div>
    </div>
  )
}
