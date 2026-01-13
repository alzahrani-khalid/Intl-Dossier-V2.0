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
 * useBulkActions - Comprehensive hook for managing bulk selection and actions
 *
 * Features:
 * - Selection management with max limit (100 items)
 * - Range selection with Shift+Click
 * - Action execution with progress tracking
 * - Confirmation workflow for destructive actions
 * - Undo capability with TTL countdown
 * - Cancellation support
 *
 * @param options Configuration options
 * @returns Bulk actions state and methods
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

  // Selection computed values
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

  // Check if item is selected
  const isSelected = useCallback((id: string): boolean => selectedIds.has(id), [selectedIds])

  // Toggle single item selection
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

  // Select all items (respecting max limit)
  const selectAll = useCallback(
    (ids: string[]) => {
      setVisibleIds(ids)
      setSelectedIds(new Set(ids.slice(0, maxSelection)))
    },
    [maxSelection],
  )

  // Range selection (for Shift+Click)
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

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
    lastSelectedIdRef.current = null
  }, [])

  // Execute a bulk action with specific items (for preview exclusion support)
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

  // Execute a bulk action using selected IDs
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

  // Cancel current action
  const cancelAction = useCallback(() => {
    cancelledRef.current = true
    setActionState((prev) => ({
      ...prev,
      status: 'cancelled',
    }))
  }, [])

  // Reset action state
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

  // Execute undo
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

  // Clear undo data
  const clearUndoData = useCallback(() => {
    setUndoData(null)
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current)
    }
  }, [])

  // Request confirmation for an action
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

  // Confirm the pending action
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

  // Cancel confirmation
  const cancelConfirmation = useCallback(() => {
    setPendingConfirmation(null)
    pendingActionRef.current = null
  }, [])

  // Request preview for item exclusion
  const requestPreview = useCallback((action: BulkActionDefinition<T>, items: T[]) => {
    previewActionRef.current = { action }
    setPreviewState({
      open: true,
      action: action,
      items: items,
    })
  }, [])

  // Confirm preview and execute action with included items
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

  // Cancel preview
  const cancelPreview = useCallback(() => {
    setPreviewState({ open: false, action: null, items: [] })
    previewActionRef.current = null
  }, [])

  // Cleanup on unmount
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
