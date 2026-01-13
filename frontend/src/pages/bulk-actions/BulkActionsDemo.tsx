import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BulkActionsToolbar,
  BulkActionConfirmDialog,
  BulkActionProgressIndicator,
  SelectableDataTable,
  UndoToast,
  useBulkActions,
  DEFAULT_BULK_ACTIONS,
  DEFAULT_UNDO_TTL,
} from '@/components/bulk-actions'
import type {
  BulkSelectableItem,
  BulkActionDefinition,
  BulkActionParams,
  BulkActionUndoData,
  SelectableColumnDef,
} from '@/types/bulk-actions.types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * Demo item type
 */
interface DemoItem extends BulkSelectableItem {
  id: string
  name: string
  status: string
  priority: string
  assignee: string
  createdAt: string
}

/**
 * Generate demo data
 */
function generateDemoData(count: number): DemoItem[] {
  const statuses = ['pending', 'in_progress', 'completed', 'cancelled'] as const
  const priorities = ['low', 'medium', 'high', 'urgent'] as const
  const assignees = ['John Doe', 'Jane Smith', 'Ahmed Ali', 'Sarah Johnson'] as const

  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i + 1}`,
    name: `Item ${i + 1}`,
    status: statuses[Math.floor(Math.random() * statuses.length)] as string,
    priority: priorities[Math.floor(Math.random() * priorities.length)] as string,
    assignee: assignees[Math.floor(Math.random() * assignees.length)] as string,
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  }))
}

/**
 * BulkActionsDemo - Demonstration page for bulk actions feature
 */
export function BulkActionsDemo() {
  const { t, i18n } = useTranslation('bulk-actions')
  const isRTL = i18n.language === 'ar'

  // Demo data
  const [data] = useState<DemoItem[]>(() => generateDemoData(25))

  // Undo toast state
  const [showUndoToast, setShowUndoToast] = useState(false)
  const [lastAction, setLastAction] = useState<{
    action: string
    count: number
  } | null>(null)

  // Handle undo callback
  const handleUndo = useCallback(async (undoData: BulkActionUndoData): Promise<boolean> => {
    console.log('Undo requested:', undoData)
    // Simulate undo operation
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return true
  }, [])

  // Bulk actions hook
  const {
    selection,
    toggleSelection,
    selectAll,
    selectRange,
    clearSelection,
    actionState,
    executeAction,
    resetActionState,
    pendingConfirmation,
    requestConfirmation,
    confirmAction,
    cancelConfirmation,
    executeUndo,
    clearUndoData,
  } = useBulkActions<DemoItem>({
    entityType: 'entity',
    undoTtl: DEFAULT_UNDO_TTL,
    onActionComplete: (result) => {
      console.log('Action completed:', result)
      if (result.success) {
        setLastAction({
          action: actionState.currentAction || 'action',
          count: result.successCount,
        })
        setShowUndoToast(true)
      }
    },
    onActionError: (error) => {
      console.error('Action error:', error)
    },
    onUndo: handleUndo,
  })

  // Define columns for the data table
  const columns: SelectableColumnDef<DemoItem>[] = useMemo(
    () => [
      {
        id: 'name',
        headerKey: 'Name',
        accessor: 'name',
        sortable: true,
      },
      {
        id: 'status',
        headerKey: 'Status',
        accessor: 'status',
        cell: (item) => (
          <Badge
            variant="secondary"
            className={cn(
              item.status === 'completed' && 'bg-green-100 text-green-800',
              item.status === 'in_progress' && 'bg-blue-100 text-blue-800',
              item.status === 'pending' && 'bg-yellow-100 text-yellow-800',
              item.status === 'cancelled' && 'bg-gray-100 text-gray-800',
            )}
          >
            {t(`status.${item.status}`)}
          </Badge>
        ),
      },
      {
        id: 'priority',
        headerKey: 'Priority',
        accessor: 'priority',
        cell: (item) => (
          <Badge
            variant="outline"
            className={cn(
              item.priority === 'urgent' && 'border-red-500 text-red-600',
              item.priority === 'high' && 'border-orange-500 text-orange-600',
              item.priority === 'medium' && 'border-yellow-500 text-yellow-600',
              item.priority === 'low' && 'border-green-500 text-green-600',
            )}
          >
            {t(`priority.${item.priority}`)}
          </Badge>
        ),
      },
      {
        id: 'assignee',
        headerKey: 'Assignee',
        accessor: 'assignee',
      },
      {
        id: 'createdAt',
        headerKey: 'Created',
        accessor: (item) => new Date(item.createdAt).toLocaleDateString(),
      },
    ],
    [t],
  )

  // Handle action click
  const handleActionClick = useCallback(
    (action: BulkActionDefinition<DemoItem>) => {
      const selectedItems = data.filter((item) => selection.selectedIds.has(item.id))

      if (action.requiresConfirmation) {
        requestConfirmation(action, selectedItems)
      } else {
        executeAction(action)
      }
    },
    [data, selection.selectedIds, requestConfirmation, executeAction],
  )

  // Handle confirmation
  const handleConfirm = useCallback(
    (params?: BulkActionParams) => {
      confirmAction(params)
    },
    [confirmAction],
  )

  // Handle undo toast actions
  const handleUndoClick = useCallback(async () => {
    await executeUndo()
    setShowUndoToast(false)
  }, [executeUndo])

  const handleUndoDismiss = useCallback(() => {
    setShowUndoToast(false)
    clearUndoData()
  }, [clearUndoData])

  // Get all IDs for select all
  const allIds = useMemo(() => data.map((item) => item.id), [data])

  return (
    <div
      className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold sm:text-3xl">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selection={selection}
        actions={DEFAULT_BULK_ACTIONS}
        entityType="entity"
        actionState={actionState}
        onActionClick={handleActionClick}
        onClearSelection={clearSelection}
        onSelectAll={() => selectAll(allIds)}
      />

      {/* Progress Indicator (shows during processing) */}
      {actionState.status !== 'idle' && (
        <BulkActionProgressIndicator
          status={actionState.status}
          progress={actionState.progress}
          processedCount={actionState.processedCount}
          totalCount={actionState.totalCount}
          actionType={actionState.currentAction}
          entityType="entity"
          onCancel={resetActionState}
        />
      )}

      {/* Data Table */}
      <div className="border rounded-lg overflow-hidden">
        <SelectableDataTable
          data={data}
          columns={columns}
          selection={selection}
          onToggleSelection={toggleSelection}
          onSelectAll={selectAll}
          onClearSelection={clearSelection}
          onSelectRange={selectRange}
        />
      </div>

      {/* Confirmation Dialog */}
      <BulkActionConfirmDialog
        open={!!pendingConfirmation}
        action={pendingConfirmation?.action || null}
        itemCount={pendingConfirmation?.itemCount || 0}
        entityType="entity"
        onConfirm={handleConfirm}
        onCancel={cancelConfirmation}
        isProcessing={actionState.status === 'processing'}
      />

      {/* Undo Toast */}
      <UndoToast
        visible={showUndoToast && !!lastAction}
        action={(lastAction?.action as any) || 'update-status'}
        itemCount={lastAction?.count || 0}
        undoTtl={DEFAULT_UNDO_TTL}
        onUndo={handleUndoClick}
        onDismiss={handleUndoDismiss}
      />
    </div>
  )
}

export default BulkActionsDemo
