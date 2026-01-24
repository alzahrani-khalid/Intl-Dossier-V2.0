/**
 * Bulk Actions Hook
 * @module hooks/useBulkActions
 * @feature bulk-actions
 *
 * Comprehensive React hook for managing bulk selection and batch operations
 * with progress tracking, undo support, and confirmation workflows.
 *
 * @description
 * This module provides a complete solution for bulk operations on any selectable items:
 * - **Selection Management**: Multi-select with 100-item limit, range selection (Shift+Click)
 * - **Action Execution**: Custom actions with progress tracking and batch processing
 * - **Confirmation Workflow**: User confirmation for destructive actions
 * - **Preview & Exclusion**: Review and exclude items before executing
 * - **Undo Support**: Time-limited undo with configurable TTL
 * - **Cancellation**: Abort long-running operations
 *
 * Designed to work with any entity type that implements BulkSelectableItem interface.
 *
 * Action lifecycle:
 * 1. **Select**: User selects items (toggleSelection, selectAll, selectRange)
 * 2. **Preview** (optional): Review items, exclude unwanted ones
 * 3. **Confirm** (optional): Show confirmation dialog for destructive actions
 * 4. **Execute**: Run action with progress tracking
 * 5. **Undo** (optional): Revert changes within TTL window
 *
 * @example
 * // Basic usage with custom delete action
 * const bulkActions = useBulkActions({
 *   entityType: 'dossier',
 *   maxSelection: 50,
 *   onActionComplete: (result) => {
 *     console.log(`Success: ${result.successCount}/${result.totalCount}`);
 *   },
 * });
 *
 * // Select items
 * bulkActions.toggleSelection('item-1');
 * bulkActions.toggleSelection('item-2');
 *
 * @example
 * // Execute bulk delete with confirmation
 * const deleteAction = {
 *   id: 'delete',
 *   label: 'Delete',
 *   requiresConfirmation: true,
 *   execute: async (items) => {
 *     await deleteItems(items.map(i => i.id));
 *     return { success: true, successCount: items.length };
 *   },
 * };
 * await bulkActions.executeAction(deleteAction);
 *
 * @example
 * // Range selection with Shift+Click
 * bulkActions.selectRange('item-1', 'item-5', allItemIds);
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import type {
  BulkSelectableItem,
  BulkActionDefinition,
  BulkActionParams,
  BulkActionResult,
  BulkActionUndoData,
  BulkSelectionState,
  BulkActionState,
  BulkActionConfirmationProps,
  BulkActionPreviewState,
  UseBulkActionsReturn,
  UseBulkActionsOptions,
} from '@/types/bulk-actions.types'
import { MAX_BULK_SELECTION, DEFAULT_UNDO_TTL } from '@/types/bulk-actions.types'

/**
 * Hook for managing bulk selection and actions
 *
 * @description
 * Provides complete bulk operation workflow with selection, actions, undo, and confirmation.
 *
 * Selection features:
 * - Single item toggle (click)
 * - Range selection (Shift+Click)
 * - Select all (respects max limit)
 * - Clear all
 * - Max 100 items by default (configurable)
 *
 * Action features:
 * - Custom execute functions
 * - Progress tracking (0-100%)
 * - Batch processing simulation
 * - Success/failure per-item results
 * - Cancel support
 *
 * Undo features:
 * - Automatic state capture
 * - TTL-based expiration (default: 10s)
 * - Auto-cleanup on unmount
 *
 * @param options - Configuration options
 * @param options.maxSelection - Maximum items that can be selected (default: 100)
 * @param options.entityType - Type of entity for display (e.g., 'dossier', 'person')
 * @param options.undoTtl - Undo time-to-live in milliseconds (default: 10000)
 * @param options.onActionComplete - Callback after action completes
 * @param options.onActionError - Callback when action fails
 * @param options.onUndo - Callback to handle undo (must return Promise<boolean>)
 * @returns Bulk actions state and control methods
 *
 * @example
 * // Configure with undo support
 * const bulkActions = useBulkActions({
 *   entityType: 'task',
 *   onUndo: async (undoData) => {
 *     await restoreItems(undoData.previousState);
 *     return true;
 *   },
 * });
 *
 * @example
 * // Check selection state
 * const { selection } = bulkActions;
 * console.log(`Selected: ${selection.selectedCount}`);
 * if (selection.maxReached) {
 *   toast.warning('Maximum selection reached');
 * }
 */
export function useBulkActions<T extends BulkSelectableItem = BulkSelectableItem>(
  options: UseBulkActionsOptions<T>,
): UseBulkActionsReturn<T> {
  const {
    maxSelection = MAX_BULK_SELECTION,
    entityType,
    undoTtl = DEFAULT_UNDO_TTL,
    onActionComplete,
    onActionError,
    onUndo,
  } = options

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [visibleIds, setVisibleIds] = useState<string[]>([])
  const lastSelectedIdRef = useRef<string | null>(null)

  // Action state
  const [actionState, setActionState] = useState<BulkActionState>({
    status: 'idle',
    currentAction: null,
    progress: 0,
    processedCount: 0,
    totalCount: 0,
    lastResult: null,
    error: null,
  })

  // Undo state
  const [undoData, setUndoData] = useState<BulkActionUndoData | null>(null)
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Confirmation state
  const [pendingConfirmation, setPendingConfirmation] =
    useState<BulkActionConfirmationProps | null>(null)
  const pendingActionRef = useRef<{
    action: BulkActionDefinition<T>
    items: T[]
  } | null>(null)

  // Preview state (for item exclusion before action)
  const [previewState, setPreviewState] = useState<BulkActionPreviewState<T>>({
    open: false,
    action: null,
    items: [],
  })
  const previewActionRef = useRef<{
    action: BulkActionDefinition<T>
  } | null>(null)

  // Cancellation ref
  const cancelledRef = useRef(false)

  /**
   * Computed selection state
   * @description Aggregates selection metrics and provides reactive state
   */
  const selection: BulkSelectionState = useMemo(() => {
    const selectedCount = selectedIds.size
    const maxReached = selectedCount >= maxSelection
    const canSelectMore = selectedCount < maxSelection
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id))
    const partiallySelected = visibleIds.some((id) => selectedIds.has(id)) && !allSelected

    return {
      selectedIds,
      selectedCount,
      maxReached,
      canSelectMore,
      allSelected,
      partiallySelected,
    }
  }, [selectedIds, maxSelection, visibleIds])

  /**
   * Check if an item is selected
   * @param id - Item ID to check
   * @returns True if item is in selection
   */
  const isSelected = useCallback((id: string): boolean => selectedIds.has(id), [selectedIds])

  /**
   * Toggle single item selection
   * @description Adds item if not selected, removes if selected. Respects max limit.
   * @param id - Item ID to toggle
   */
  const toggleSelection = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(id)) {
          newSet.delete(id)
        } else if (newSet.size < maxSelection) {
          newSet.add(id)
        } else {
          console.warn(`Maximum selection limit (${maxSelection}) reached`)
          return prev
        }
        return newSet
      })
      lastSelectedIdRef.current = id
    },
    [maxSelection],
  )

  /**
   * Select all items from provided list
   * @description Selects up to maxSelection items. Updates visibleIds for allSelected check.
   * @param ids - Array of all item IDs to select
   */
  const selectAll = useCallback(
    (ids: string[]) => {
      setVisibleIds(ids)
      setSelectedIds(new Set(ids.slice(0, maxSelection)))
    },
    [maxSelection],
  )

  /**
   * Select range of items (Shift+Click support)
   * @description Selects all items between startId and endId, respecting max limit.
   * @param startId - Start of range
   * @param endId - End of range
   * @param allIds - Array of all item IDs in order
   */
  const selectRange = useCallback(
    (startId: string, endId: string, allIds: string[]) => {
      const startIndex = allIds.indexOf(startId)
      const endIndex = allIds.indexOf(endId)

      if (startIndex === -1 || endIndex === -1) return

      const minIndex = Math.min(startIndex, endIndex)
      const maxIndex = Math.max(startIndex, endIndex)

      setSelectedIds((prev) => {
        const newSet = new Set(prev)
        for (let i = minIndex; i <= maxIndex && newSet.size < maxSelection; i++) {
          const id = allIds[i]
          if (id) {
            newSet.add(id)
          }
        }
        return newSet
      })
    },
    [maxSelection],
  )

  /**
   * Clear all selections
   * @description Resets selection to empty state
   */
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
    lastSelectedIdRef.current = null
  }, [])

  /**
   * Execute bulk action with specific items
   * @description Used for preview workflow where user can exclude items before execution.
   * @param action - Action definition with execute function
   * @param items - Specific items to process (may be subset of selection)
   * @param params - Optional parameters for action
   * @returns Promise resolving to action result
   */
  const executeActionWithItems = useCallback(
    async (
      action: BulkActionDefinition<T>,
      items: T[],
      params?: BulkActionParams,
    ): Promise<BulkActionResult> => {
      const itemIds = items.map((item) => item.id)
      const totalCount = itemIds.length

      if (totalCount === 0) {
        return {
          success: false,
          successCount: 0,
          failedCount: 0,
          failedIds: [],
          message: 'No items selected',
        }
      }

      cancelledRef.current = false

      setActionState({
        status: 'processing',
        currentAction: action.id,
        progress: 0,
        processedCount: 0,
        totalCount,
        lastResult: null,
        error: null,
      })

      try {
        let result: BulkActionResult

        if (action.execute) {
          // Use custom execute function if provided
          result = await action.execute(items, params)
        } else {
          // Simulate processing for demo purposes
          result = await simulateBulkAction(action.id, itemIds, (processed) => {
            if (cancelledRef.current) return
            const progress = Math.round((processed / totalCount) * 100)
            setActionState((prev) => ({
              ...prev,
              progress,
              processedCount: processed,
            }))
          })
        }

        if (cancelledRef.current) {
          const cancelledResult: BulkActionResult = {
            success: false,
            successCount: 0,
            failedCount: totalCount,
            failedIds: itemIds,
            message: 'Action cancelled',
          }

          setActionState((prev) => ({
            ...prev,
            status: 'cancelled',
            lastResult: cancelledResult,
          }))

          return cancelledResult
        }

        // Store undo data if action supports undo
        if (action.supportsUndo && result.success) {
          const newUndoData: BulkActionUndoData = {
            actionType: action.id,
            entityType,
            itemIds: itemIds.filter((id) => !result.failedIds.includes(id)),
            previousState: items.map((item) => ({ ...item })),
            timestamp: Date.now(),
            ttl: undoTtl,
          }
          setUndoData(newUndoData)

          // Set timer to clear undo data
          if (undoTimerRef.current) {
            clearTimeout(undoTimerRef.current)
          }
          undoTimerRef.current = setTimeout(() => {
            setUndoData(null)
          }, undoTtl)
        }

        setActionState((prev) => ({
          ...prev,
          status: result.success ? 'completed' : 'failed',
          progress: 100,
          processedCount: totalCount,
          lastResult: result,
          error: result.success ? null : result.message || 'Action failed',
        }))

        // Clear selection on success
        if (result.success) {
          clearSelection()
        }

        onActionComplete?.(result)
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const failedResult: BulkActionResult = {
          success: false,
          successCount: 0,
          failedCount: totalCount,
          failedIds: itemIds,
          message: errorMessage,
        }

        setActionState((prev) => ({
          ...prev,
          status: 'failed',
          lastResult: failedResult,
          error: errorMessage,
        }))

        onActionError?.(error instanceof Error ? error : new Error(errorMessage))
        return failedResult
      }
    },
    [entityType, undoTtl, onActionComplete, onActionError, clearSelection],
  )

  /**
   * Execute bulk action using current selection
   * @description Convenience wrapper that uses selectedIds. For full item data, use executeActionWithItems.
   * @param action - Action definition
   * @param params - Optional action parameters
   * @returns Promise resolving to action result
   */
  const executeAction = useCallback(
    async (
      action: BulkActionDefinition<T>,
      params?: BulkActionParams,
    ): Promise<BulkActionResult> => {
      const itemIds = Array.from(selectedIds)
      const items = itemIds.map((id) => ({ id }) as T)
      return executeActionWithItems(action, items, params)
    },
    [selectedIds, executeActionWithItems],
  )

  /**
   * Cancel currently executing action
   * @description Sets cancelled flag and updates state. Action execution checks flag.
   */
  const cancelAction = useCallback(() => {
    cancelledRef.current = true
    setActionState((prev) => ({
      ...prev,
      status: 'cancelled',
    }))
  }, [])

  /**
   * Reset action state to idle
   * @description Clears progress, results, and errors. Does not affect selection.
   */
  const resetActionState = useCallback(() => {
    setActionState({
      status: 'idle',
      currentAction: null,
      progress: 0,
      processedCount: 0,
      totalCount: 0,
      lastResult: null,
      error: null,
    })
  }, [])

  /**
   * Execute undo of last action
   * @description Calls onUndo callback with saved state. Clears undo data on success.
   * @returns Promise resolving to true if undo succeeded
   */
  const executeUndo = useCallback(async (): Promise<boolean> => {
    if (!undoData || !onUndo) return false

    try {
      const success = await onUndo(undoData)
      if (success) {
        setUndoData(null)
        if (undoTimerRef.current) {
          clearTimeout(undoTimerRef.current)
        }
      }
      return success
    } catch {
      return false
    }
  }, [undoData, onUndo])

  /**
   * Clear undo data and cancel timer
   * @description Manually expires undo window before TTL
   */
  const clearUndoData = useCallback(() => {
    setUndoData(null)
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current)
    }
  }, [])

  /**
   * Request user confirmation before action
   * @description Shows confirmation dialog. Store action in ref for confirmAction callback.
   * @param action - Action requiring confirmation
   * @param items - Items that will be affected
   */
  const requestConfirmation = useCallback(
    (action: BulkActionDefinition<T>, items: T[]) => {
      pendingActionRef.current = { action, items }
      // Cast to BulkActionDefinition to satisfy type constraint
      const actionDef = action as unknown as BulkActionDefinition
      setPendingConfirmation({
        open: true,
        action: actionDef,
        itemCount: items.length,
        entityType,
        onConfirm: () => {},
        onCancel: () => {},
      })
    },
    [entityType],
  )

  /**
   * Confirm and execute pending action
   * @description Retrieves action from ref and executes it with optional params
   * @param params - Optional parameters to pass to action
   */
  const confirmAction = useCallback(
    (params?: BulkActionParams) => {
      const pending = pendingActionRef.current
      if (!pending) return

      setPendingConfirmation(null)
      pendingActionRef.current = null

      executeAction(pending.action, params)
    },
    [executeAction],
  )

  /**
   * Cancel confirmation dialog
   * @description Closes dialog and clears pending action
   */
  const cancelConfirmation = useCallback(() => {
    setPendingConfirmation(null)
    pendingActionRef.current = null
  }, [])

  /**
   * Request preview/exclusion workflow
   * @description Shows preview UI where user can exclude items before execution
   * @param action - Action to preview
   * @param items - Items to show in preview
   */
  const requestPreview = useCallback((action: BulkActionDefinition<T>, items: T[]) => {
    previewActionRef.current = { action }
    setPreviewState({
      open: true,
      action: action,
      items: items,
    })
  }, [])

  /**
   * Confirm preview and execute with included items
   * @description Executes action only on items user included (not excluded)
   * @param includedItems - Items to include in action (after exclusion)
   * @param params - Optional action parameters
   */
  const confirmPreview = useCallback(
    (includedItems: T[], params?: BulkActionParams) => {
      const pending = previewActionRef.current
      if (!pending || includedItems.length === 0) {
        setPreviewState({ open: false, action: null, items: [] })
        previewActionRef.current = null
        return
      }

      setPreviewState({ open: false, action: null, items: [] })
      previewActionRef.current = null

      executeActionWithItems(pending.action, includedItems, params)
    },
    [executeActionWithItems],
  )

  /**
   * Cancel preview dialog
   * @description Closes preview and clears pending action
   */
  const cancelPreview = useCallback(() => {
    setPreviewState({ open: false, action: null, items: [] })
    previewActionRef.current = null
  }, [])

  /**
   * Cleanup effect - clear undo timer on unmount
   */
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current)
      }
    }
  }, [])

  return {
    // Selection
    selection,
    isSelected,
    toggleSelection,
    selectAll,
    selectRange,
    clearSelection,

    // Actions
    actionState,
    executeAction,
    executeActionWithItems,
    cancelAction,
    resetActionState,

    // Undo
    canUndo: !!undoData && !!onUndo,
    undoData,
    executeUndo,
    clearUndoData,

    // Confirmation
    pendingConfirmation,
    requestConfirmation,
    confirmAction,
    cancelConfirmation,

    // Preview (for item exclusion)
    previewState,
    requestPreview,
    confirmPreview,
    cancelPreview,
  }
}

/**
 * Simulate bulk action processing for demo/fallback
 *
 * @description
 * Provides a fallback action executor when custom execute function is not provided.
 * Processes items in batches with simulated delay and progress callbacks.
 *
 * Used for:
 * - Testing bulk action UI without backend
 * - Demonstration purposes
 * - Fallback when action.execute is undefined
 *
 * @param _actionType - Action type (unused in simulation)
 * @param itemIds - Array of item IDs to process
 * @param onProgress - Callback invoked with count of processed items
 * @returns Promise resolving to action result (always succeeds in simulation)
 * @internal
 */
async function simulateBulkAction(
  _actionType: string,
  itemIds: string[],
  onProgress: (processed: number) => void,
): Promise<BulkActionResult> {
  const totalCount = itemIds.length
  const batchSize = 10
  const delayMs = 50

  let processed = 0
  const failedIds: string[] = []

  for (let i = 0; i < totalCount; i += batchSize) {
    await new Promise((resolve) => setTimeout(resolve, delayMs))
    processed = Math.min(i + batchSize, totalCount)
    onProgress(processed)
  }

  return {
    success: failedIds.length === 0,
    successCount: totalCount - failedIds.length,
    failedCount: failedIds.length,
    failedIds,
  }
}

export default useBulkActions
