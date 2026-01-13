/**
 * useBulkKanbanOperations - Hook for bulk operations on Kanban items
 * Feature: kanban-task-board
 *
 * Provides:
 * - Multi-select functionality
 * - Bulk move operations
 * - Bulk assign operations
 * - Bulk priority updates
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
 * Hook for managing item selection state
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
 * Combined hook for all bulk operations
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

// Helper functions

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
