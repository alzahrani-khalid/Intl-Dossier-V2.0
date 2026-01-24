/**
 * Bulk Kanban Operations Hooks
 * @module hooks/useBulkKanbanOperations
 * @feature kanban-task-board
 * @feature 032-unified-work-management
 *
 * React hooks for bulk operations on unified work items in Kanban board.
 * Supports multi-select, bulk move, bulk assign, and bulk priority updates
 * across all work item sources (task, commitment, intake).
 *
 * @description
 * This module provides specialized bulk operations for the unified Kanban board:
 * - **Selection**: Multi-select with range support (Shift+Click), select by column
 * - **Bulk Move**: Move items across workflow columns with source-specific status mapping
 * - **Bulk Assign**: Assign multiple items to a user (handles source-specific field names)
 * - **Bulk Priority**: Update priority for multiple items
 *
 * Key features:
 * - Unified interface for heterogeneous work items (tasks, commitments, intake tickets)
 * - Source-aware database operations (different tables and field names)
 * - Automatic cache invalidation via TanStack Query
 * - Toast notifications with success/failure counts
 * - Promise.allSettled for partial success handling
 *
 * @example
 * // Use in Kanban board component
 * const bulkOps = useBulkKanbanOperations(workItems);
 *
 * // Select items
 * bulkOps.toggleSelection('task-123');
 * bulkOps.selectByColumn('in_progress');
 *
 * // Bulk move to done column
 * await bulkOps.moveSelected('done');
 *
 * @example
 * // Range selection with Shift+Click
 * const handleClick = (itemId, event) => {
 *   bulkOps.toggleSelection(itemId, event.shiftKey);
 * };
 *
 * @example
 * // Bulk operations
 * await bulkOps.assignSelected('user-uuid-123');
 * await bulkOps.updatePrioritySelected('urgent');
 */

import { useState, useCallback, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { kanbanKeys } from '@/hooks/useUnifiedKanban'
import type { WorkItem, WorkSource, SelectionState, Priority } from '@/types/work-item.types'

interface BulkMoveParams {
  itemIds: string[]
  targetColumn: string
  items: WorkItem[]
}

interface BulkAssignParams {
  itemIds: string[]
  assigneeId: string | null
  items: WorkItem[]
}

interface BulkPriorityParams {
  itemIds: string[]
  priority: Priority
  items: WorkItem[]
}

/**
 * Hook for managing Kanban item selection state
 *
 * @description
 * Provides selection management with support for:
 * - Single item toggle
 * - Range selection (Shift+Click)
 * - Select all items
 * - Select by column
 * - Clear selection
 * - Select mode toggle (for mobile UI)
 *
 * Tracks last selected ID for range selection behavior.
 *
 * @param items - Array of work items available for selection
 * @returns Selection state and control methods
 *
 * @example
 * const selection = useKanbanSelection(workItems);
 *
 * // Toggle with range support
 * const handleClick = (id, event) => {
 *   selection.toggleSelection(id, event.shiftKey);
 * };
 *
 * @example
 * // Select all items in a column
 * selection.selectByColumn('in_progress');
 */
export function useKanbanSelection(items: WorkItem[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isSelecting, setIsSelecting] = useState(false)
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null)

  const toggleSelection = useCallback(
    (itemId: string, shiftKey = false) => {
      setSelectedIds((prev) => {
        const next = new Set(prev)

        if (shiftKey && lastSelectedId) {
          // Range selection
          const allIds = items.map((i) => i.id)
          const startIndex = allIds.indexOf(lastSelectedId)
          const endIndex = allIds.indexOf(itemId)

          if (startIndex !== -1 && endIndex !== -1) {
            const [from, to] =
              startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex]

            for (let i = from; i <= to; i++) {
              const id = allIds[i]
              if (id) next.add(id)
            }
          }
        } else {
          // Toggle single item
          if (next.has(itemId)) {
            next.delete(itemId)
          } else {
            next.add(itemId)
          }
        }

        return next
      })

      setLastSelectedId(itemId)
    },
    [items, lastSelectedId],
  )

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map((i) => i.id)))
  }, [items])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
    setLastSelectedId(null)
  }, [])

  const selectByColumn = useCallback(
    (columnKey: string) => {
      const columnItems = items.filter((i) => i.column_key === columnKey)
      setSelectedIds(new Set(columnItems.map((i) => i.id)))
    },
    [items],
  )

  const toggleSelectMode = useCallback(() => {
    setIsSelecting((prev) => {
      if (prev) {
        // Exiting select mode, clear selection
        setSelectedIds(new Set())
        setLastSelectedId(null)
      }
      return !prev
    })
  }, [])

  const selectedItems = useMemo(() => {
    return items.filter((i) => selectedIds.has(i.id))
  }, [items, selectedIds])

  const selectionState: SelectionState = {
    selectedIds,
    isSelecting,
    lastSelectedId,
  }

  return {
    selectionState,
    selectedItems,
    selectedCount: selectedIds.size,
    toggleSelection,
    selectAll,
    clearSelection,
    selectByColumn,
    toggleSelectMode,
    isSelected: (id: string) => selectedIds.has(id),
  }
}

/**
 * Hook for bulk move operations
 *
 * @description
 * TanStack Query mutation for moving multiple work items to a target column.
 * Handles source-specific table names and status mapping.
 *
 * Status mapping per source:
 * - **tasks**: Updates `workflow_stage` and `status` fields
 * - **commitments**: Updates `status` field
 * - **intake**: Updates `status` field with different value set
 *
 * Uses Promise.allSettled to support partial success scenarios.
 *
 * @returns TanStack Query mutation with success/error handlers
 *
 * @example
 * const bulkMove = useBulkMove();
 * await bulkMove.mutateAsync({
 *   itemIds: ['task-1', 'task-2'],
 *   targetColumn: 'done',
 *   items: workItems,
 * });
 */
export function useBulkMove() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ itemIds, targetColumn, items }: BulkMoveParams) => {
      const results = await Promise.allSettled(
        itemIds.map(async (itemId) => {
          const item = items.find((i) => i.id === itemId)
          if (!item) throw new Error(`Item ${itemId} not found`)

          const table = getTableForSource(item.source)
          const updateData = getUpdateDataForMove(item.source, targetColumn)

          const { error } = await supabase.from(table).update(updateData).eq('id', itemId)

          if (error) throw error
          return { itemId, success: true }
        }),
      )

      const succeeded = results.filter((r) => r.status === 'fulfilled').length
      const failed = results.filter((r) => r.status === 'rejected').length

      return { succeeded, failed, total: itemIds.length }
    },

    onSuccess: ({ succeeded, failed, total }) => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.all })

      if (failed === 0) {
        toast({
          title: 'Items moved successfully',
          description: `Moved ${succeeded} item${succeeded > 1 ? 's' : ''} to the new column.`,
        })
      } else {
        toast({
          title: 'Partial success',
          description: `Moved ${succeeded} of ${total} items. ${failed} failed.`,
          variant: 'destructive',
        })
      }
    },

    onError: (error) => {
      toast({
        title: 'Failed to move items',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Hook for bulk assign operations
 *
 * @description
 * TanStack Query mutation for assigning multiple work items to a user.
 * Handles source-specific assignee field names:
 * - tasks: `assignee_id`
 * - commitments: `owner_user_id`
 * - intake: `assigned_to`
 *
 * Uses Promise.allSettled to support partial success scenarios.
 *
 * @returns TanStack Query mutation with success/error handlers
 *
 * @example
 * const bulkAssign = useBulkAssign();
 * await bulkAssign.mutateAsync({
 *   itemIds: ['task-1', 'commitment-2'],
 *   assigneeId: 'user-uuid-123',
 *   items: workItems,
 * });
 */
export function useBulkAssign() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ itemIds, assigneeId, items }: BulkAssignParams) => {
      const results = await Promise.allSettled(
        itemIds.map(async (itemId) => {
          const item = items.find((i) => i.id === itemId)
          if (!item) throw new Error(`Item ${itemId} not found`)

          const table = getTableForSource(item.source)
          const assigneeField = getAssigneeFieldForSource(item.source)

          const { error } = await supabase
            .from(table)
            .update({
              [assigneeField]: assigneeId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', itemId)

          if (error) throw error
          return { itemId, success: true }
        }),
      )

      const succeeded = results.filter((r) => r.status === 'fulfilled').length
      const failed = results.filter((r) => r.status === 'rejected').length

      return { succeeded, failed, total: itemIds.length }
    },

    onSuccess: ({ succeeded, failed, total }) => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.all })

      if (failed === 0) {
        toast({
          title: 'Items assigned successfully',
          description: `Assigned ${succeeded} item${succeeded > 1 ? 's' : ''}.`,
        })
      } else {
        toast({
          title: 'Partial success',
          description: `Assigned ${succeeded} of ${total} items. ${failed} failed.`,
          variant: 'destructive',
        })
      }
    },

    onError: (error) => {
      toast({
        title: 'Failed to assign items',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Hook for bulk priority updates
 *
 * @description
 * TanStack Query mutation for updating priority of multiple work items.
 * Priority field is consistent across all sources: `priority`.
 *
 * Uses Promise.allSettled to support partial success scenarios.
 *
 * @returns TanStack Query mutation with success/error handlers
 *
 * @example
 * const bulkPriority = useBulkPriority();
 * await bulkPriority.mutateAsync({
 *   itemIds: ['task-1', 'task-2'],
 *   priority: 'urgent',
 *   items: workItems,
 * });
 */
export function useBulkPriority() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ itemIds, priority, items }: BulkPriorityParams) => {
      const results = await Promise.allSettled(
        itemIds.map(async (itemId) => {
          const item = items.find((i) => i.id === itemId)
          if (!item) throw new Error(`Item ${itemId} not found`)

          const table = getTableForSource(item.source)

          const { error } = await supabase
            .from(table)
            .update({
              priority,
              updated_at: new Date().toISOString(),
            })
            .eq('id', itemId)

          if (error) throw error
          return { itemId, success: true }
        }),
      )

      const succeeded = results.filter((r) => r.status === 'fulfilled').length
      const failed = results.filter((r) => r.status === 'rejected').length

      return { succeeded, failed, total: itemIds.length }
    },

    onSuccess: ({ succeeded, failed, total }) => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.all })

      if (failed === 0) {
        toast({
          title: 'Priority updated successfully',
          description: `Updated priority for ${succeeded} item${succeeded > 1 ? 's' : ''}.`,
        })
      } else {
        toast({
          title: 'Partial success',
          description: `Updated ${succeeded} of ${total} items. ${failed} failed.`,
          variant: 'destructive',
        })
      }
    },

    onError: (error) => {
      toast({
        title: 'Failed to update priority',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Combined hook for all Kanban bulk operations
 *
 * @description
 * Aggregates selection and bulk operation hooks into a unified interface.
 * Provides convenience methods that handle selection clearing after operations.
 *
 * Returns:
 * - All selection methods from useKanbanSelection
 * - moveSelected, assignSelected, updatePrioritySelected (with auto-clear)
 * - isLoading flag (true when any operation is pending)
 *
 * This is the recommended hook to use in Kanban board components.
 *
 * @param items - Array of work items for the board
 * @returns Combined selection state and bulk operation methods
 *
 * @example
 * // Complete bulk operations workflow
 * const bulkOps = useBulkKanbanOperations(workItems);
 *
 * // Enable select mode
 * bulkOps.toggleSelectMode();
 *
 * // Select items
 * bulkOps.toggleSelection('task-1');
 * bulkOps.toggleSelection('task-2');
 *
 * // Perform bulk operation
 * await bulkOps.moveSelected('done');
 * // Selection is automatically cleared
 *
 * @example
 * // Disable UI during operations
 * {bulkOps.isLoading && <Spinner />}
 */
export function useBulkKanbanOperations(items: WorkItem[]) {
  const selection = useKanbanSelection(items)
  const bulkMove = useBulkMove()
  const bulkAssign = useBulkAssign()
  const bulkPriority = useBulkPriority()

  const moveSelected = useCallback(
    async (targetColumn: string) => {
      if (selection.selectedCount === 0) return
      await bulkMove.mutateAsync({
        itemIds: Array.from(selection.selectionState.selectedIds),
        targetColumn,
        items,
      })
      selection.clearSelection()
    },
    [selection, bulkMove, items],
  )

  const assignSelected = useCallback(
    async (assigneeId: string | null) => {
      if (selection.selectedCount === 0) return
      await bulkAssign.mutateAsync({
        itemIds: Array.from(selection.selectionState.selectedIds),
        assigneeId,
        items,
      })
      selection.clearSelection()
    },
    [selection, bulkAssign, items],
  )

  const updatePrioritySelected = useCallback(
    async (priority: Priority) => {
      if (selection.selectedCount === 0) return
      await bulkPriority.mutateAsync({
        itemIds: Array.from(selection.selectionState.selectedIds),
        priority,
        items,
      })
      selection.clearSelection()
    },
    [selection, bulkPriority, items],
  )

  return {
    ...selection,
    moveSelected,
    assignSelected,
    updatePrioritySelected,
    isLoading: bulkMove.isPending || bulkAssign.isPending || bulkPriority.isPending,
  }
}

/**
 * Helper functions for source-aware database operations
 */

/**
 * Get database table name for work source
 *
 * @description
 * Maps work item source to corresponding Supabase table name.
 *
 * Mapping:
 * - task → tasks
 * - commitment → aa_commitments
 * - intake → intake_tickets
 *
 * @param source - Work item source type
 * @returns Database table name
 * @throws Error if source is unknown
 * @internal
 */
function getTableForSource(source: WorkSource): string {
  switch (source) {
    case 'task':
      return 'tasks'
    case 'commitment':
      return 'aa_commitments'
    case 'intake':
      return 'intake_tickets'
    default:
      throw new Error(`Unknown source: ${source}`)
  }
}

/**
 * Get assignee field name for work source
 *
 * @description
 * Maps work item source to corresponding assignee field name in database.
 *
 * Mapping:
 * - task → assignee_id
 * - commitment → owner_user_id
 * - intake → assigned_to
 *
 * @param source - Work item source type
 * @returns Assignee field name
 * @throws Error if source is unknown
 * @internal
 */
function getAssigneeFieldForSource(source: WorkSource): string {
  switch (source) {
    case 'task':
      return 'assignee_id'
    case 'commitment':
      return 'owner_user_id'
    case 'intake':
      return 'assigned_to'
    default:
      throw new Error(`Unknown source: ${source}`)
  }
}

/**
 * Get update data for moving item to target column
 *
 * @description
 * Generates database update object based on source type and target column.
 * Handles source-specific field names and status value mapping.
 *
 * Field mappings:
 * - **tasks**: Updates `workflow_stage` and `status` (different values)
 * - **commitments**: Updates `status` only
 * - **intake**: Updates `status` only (different values than commitments)
 *
 * Column → Status mapping:
 * - todo → pending
 * - in_progress → in_progress
 * - review → in_progress (tasks only)
 * - done → completed (or resolved for intake)
 * - cancelled → cancelled (or closed for intake)
 *
 * @param source - Work item source type
 * @param targetColumn - Target Kanban column key
 * @returns Update object for Supabase query
 * @internal
 */
function getUpdateDataForMove(source: WorkSource, targetColumn: string): Record<string, unknown> {
  const baseUpdate = {
    updated_at: new Date().toISOString(),
  }

  if (source === 'task') {
    // Tasks use workflow_stage
    const statusMap: Record<string, { status: string; workflow_stage: string }> = {
      todo: { status: 'pending', workflow_stage: 'todo' },
      in_progress: { status: 'in_progress', workflow_stage: 'in_progress' },
      review: { status: 'in_progress', workflow_stage: 'review' },
      done: { status: 'completed', workflow_stage: 'done' },
      cancelled: { status: 'cancelled', workflow_stage: 'cancelled' },
    }
    return { ...baseUpdate, ...statusMap[targetColumn] }
  }

  if (source === 'commitment') {
    const statusMap: Record<string, string> = {
      todo: 'pending',
      in_progress: 'in_progress',
      done: 'completed',
      cancelled: 'cancelled',
    }
    return { ...baseUpdate, status: statusMap[targetColumn] || 'pending' }
  }

  if (source === 'intake') {
    const statusMap: Record<string, string> = {
      todo: 'pending',
      in_progress: 'in_progress',
      done: 'resolved',
      cancelled: 'closed',
    }
    return { ...baseUpdate, status: statusMap[targetColumn] || 'pending' }
  }

  return baseUpdate
}
