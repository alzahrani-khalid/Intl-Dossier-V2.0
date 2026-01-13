/**
 * Bulk Actions Components
 * Feature: bulk-actions-ui
 *
 * Multi-select and bulk operation UI for entities, documents, and tickets.
 * Supports bulk status updates, assignments, tagging, export, and deletion
 * with confirmation workflows and undo capability.
 */

// Components
export { BulkActionsToolbar } from './BulkActionsToolbar'
export type { BulkActionsToolbarProps } from './BulkActionsToolbar'

export { BulkActionConfirmDialog } from './BulkActionConfirmDialog'
export type { BulkActionConfirmDialogProps } from './BulkActionConfirmDialog'

export { BulkActionPreviewDialog } from './BulkActionPreviewDialog'
export type { BulkActionPreviewDialogProps, PreviewItem } from './BulkActionPreviewDialog'

export { BulkActionProgressIndicator } from './BulkActionProgressIndicator'
export type { BulkActionProgressIndicatorProps } from './BulkActionProgressIndicator'

export { SelectableDataTable } from './SelectableDataTable'
export type { SelectableDataTableProps } from './SelectableDataTable'

export { UndoToast } from './UndoToast'
export type { UndoToastProps } from './UndoToast'

export { EnhancedUndoToast } from './EnhancedUndoToast'
export type { EnhancedUndoToastProps } from './EnhancedUndoToast'

// Re-export types for convenience
export type {
  BulkActionEntityType,
  BulkActionType,
  BulkActionStatus,
  EntityStatus,
  Priority,
  ExportFormat,
  BulkSelectableItem,
  BulkActionDefinition,
  BulkActionParams,
  BulkActionResult,
  BulkActionUndoData,
  BulkSelectionState,
  BulkActionState,
  BulkActionConfirmationProps,
  BulkActionProgressProps,
  BulkActionUndoToastProps,
  BulkActionPreviewState,
  SelectableColumnDef,
  UseBulkActionsReturn,
  UseBulkActionsOptions,
} from '@/types/bulk-actions.types'

export {
  MAX_BULK_SELECTION,
  DEFAULT_UNDO_TTL,
  DEFAULT_BULK_ACTIONS,
  ENTITY_ACTIONS,
} from '@/types/bulk-actions.types'

// Re-export hook
export { useBulkActions } from '@/hooks/useBulkActions'
