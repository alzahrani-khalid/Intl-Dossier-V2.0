/**
 * Bulk Actions Types
 * Feature: bulk-actions-ui
 *
 * TypeScript interfaces for multi-select and bulk operation UI.
 * Supports bulk status updates, assignments, tagging, export, and deletion
 * with confirmation workflows and undo capability.
 */

/**
 * Entity types that support bulk actions
 */
export type BulkActionEntityType =
  | 'entity'
  | 'document'
  | 'ticket'
  | 'dossier'
  | 'engagement'
  | 'commitment'
  | 'deliverable'
  | 'person'
  | 'working-group'

/**
 * Available bulk action types
 */
export type BulkActionType =
  | 'update-status'
  | 'assign'
  | 'unassign'
  | 'add-tags'
  | 'remove-tags'
  | 'export'
  | 'delete'
  | 'archive'
  | 'restore'
  | 'send-reminder'
  | 'escalate'
  | 'change-priority'

/**
 * Bulk action status
 */
export type BulkActionStatus =
  | 'idle'
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'

/**
 * Common status values for entities
 */
export type EntityStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'draft'
  | 'review'
  | 'approved'
  | 'rejected'
  | 'archived'

/**
 * Priority levels
 */
export type Priority = 'low' | 'medium' | 'high' | 'urgent'

/**
 * Export format options
 */
export type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'json'

/**
 * Base item interface for bulk selection
 */
export interface BulkSelectableItem {
  id: string
  [key: string]: unknown
}

/**
 * Bulk action definition
 */
export interface BulkActionDefinition<T extends BulkSelectableItem = BulkSelectableItem> {
  /** Unique action identifier */
  id: BulkActionType
  /** Display label (i18n key) */
  labelKey: string
  /** Icon name from lucide-react */
  icon: string
  /** Action variant for styling */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost'
  /** Whether this action requires confirmation */
  requiresConfirmation?: boolean
  /** Whether this action is destructive */
  isDestructive?: boolean
  /** Whether this action supports undo */
  supportsUndo?: boolean
  /** Minimum items required for this action */
  minItems?: number
  /** Maximum items allowed for this action */
  maxItems?: number
  /** Check if action is available for the selected items */
  isAvailable?: (selectedItems: T[]) => boolean
  /** Execute the action */
  execute?: (selectedItems: T[], params?: BulkActionParams) => Promise<BulkActionResult>
}

/**
 * Parameters for bulk actions
 */
export interface BulkActionParams {
  /** New status for status update actions */
  status?: EntityStatus
  /** User ID for assignment actions */
  assigneeId?: string
  /** Tags for tag actions */
  tags?: string[]
  /** Export format */
  exportFormat?: ExportFormat
  /** Priority for priority change actions */
  priority?: Priority
  /** Notes or reason for the action */
  notes?: string
  /** Additional custom parameters */
  [key: string]: unknown
}

/**
 * Result of a bulk action execution
 */
export interface BulkActionResult {
  /** Whether the action succeeded */
  success: boolean
  /** Number of items successfully processed */
  successCount: number
  /** Number of items that failed */
  failedCount: number
  /** IDs of items that failed */
  failedIds: string[]
  /** Error messages per item */
  errors?: Record<string, string>
  /** Data for undo operation (if supported) */
  undoData?: BulkActionUndoData
  /** Optional message */
  message?: string
}

/**
 * Data required to undo a bulk action
 */
export interface BulkActionUndoData {
  /** The action type that was performed */
  actionType: BulkActionType
  /** Entity type */
  entityType: BulkActionEntityType
  /** IDs of affected items */
  itemIds: string[]
  /** Previous state of items (for restoration) */
  previousState?: Record<string, unknown>[]
  /** Timestamp when action was performed */
  timestamp: number
  /** TTL for undo capability in ms (default: 30000) */
  ttl?: number
}

/**
 * Bulk selection state
 */
export interface BulkSelectionState {
  /** Currently selected item IDs */
  selectedIds: Set<string>
  /** Number of selected items */
  selectedCount: number
  /** Whether selection is at max capacity */
  maxReached: boolean
  /** Whether more items can be selected */
  canSelectMore: boolean
  /** Whether all visible items are selected */
  allSelected: boolean
  /** Whether some (but not all) visible items are selected */
  partiallySelected: boolean
}

/**
 * Bulk action state
 */
export interface BulkActionState {
  /** Current action status */
  status: BulkActionStatus
  /** Current action being performed */
  currentAction: BulkActionType | null
  /** Progress percentage (0-100) */
  progress: number
  /** Number of items processed */
  processedCount: number
  /** Total items to process */
  totalCount: number
  /** Result of the last completed action */
  lastResult: BulkActionResult | null
  /** Error message if action failed */
  error: string | null
}

/**
 * Confirmation dialog props
 */
export interface BulkActionConfirmationProps {
  /** Whether dialog is open */
  open: boolean
  /** Action to confirm */
  action: BulkActionDefinition | null
  /** Number of items affected */
  itemCount: number
  /** Entity type for display */
  entityType: BulkActionEntityType
  /** Callback when confirmed */
  onConfirm: (params?: BulkActionParams) => void
  /** Callback when cancelled */
  onCancel: () => void
  /** Whether action is currently processing */
  isProcessing?: boolean
}

/**
 * Progress indicator props
 */
export interface BulkActionProgressProps {
  /** Current status */
  status: BulkActionStatus
  /** Progress percentage */
  progress: number
  /** Number processed */
  processedCount: number
  /** Total to process */
  totalCount: number
  /** Action being performed */
  actionType: BulkActionType | null
  /** Entity type */
  entityType: BulkActionEntityType
  /** Callback to cancel operation */
  onCancel?: () => void
}

/**
 * Undo toast props
 */
export interface BulkActionUndoToastProps {
  /** Whether toast is visible */
  visible: boolean
  /** Action that was performed */
  action: BulkActionType
  /** Number of items affected */
  itemCount: number
  /** Remaining time to undo (ms) */
  remainingTime: number
  /** Callback to undo the action */
  onUndo: () => void
  /** Callback when toast is dismissed */
  onDismiss: () => void
}

/**
 * Toolbar props for bulk actions
 */
export interface BulkActionsToolbarProps<T extends BulkSelectableItem = BulkSelectableItem> {
  /** Selection state */
  selection: BulkSelectionState
  /** Available actions */
  actions: BulkActionDefinition<T>[]
  /** Entity type for display */
  entityType: BulkActionEntityType
  /** Action state */
  actionState: BulkActionState
  /** Callback when action is triggered */
  onActionClick: (action: BulkActionDefinition<T>) => void
  /** Callback to clear selection */
  onClearSelection: () => void
  /** Callback to select all visible items */
  onSelectAll?: () => void
  /** Whether component is disabled */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Selectable data table props
 */
export interface SelectableDataTableProps<T extends BulkSelectableItem> {
  /** Data items */
  data: T[]
  /** Column definitions */
  columns: SelectableColumnDef<T>[]
  /** Selection state */
  selection: BulkSelectionState
  /** Callback when selection changes */
  onSelectionChange: (ids: Set<string>) => void
  /** ID field name (default: 'id') */
  idField?: keyof T
  /** Whether selection is disabled */
  selectionDisabled?: boolean
  /** Row render function for custom rendering */
  renderRow?: (item: T, isSelected: boolean) => React.ReactNode
}

/**
 * Column definition for selectable data table
 */
export interface SelectableColumnDef<T> {
  /** Column ID */
  id: string
  /** Header label (i18n key) */
  headerKey: string
  /** Accessor function or key */
  accessor: keyof T | ((item: T) => React.ReactNode)
  /** Whether column is sortable */
  sortable?: boolean
  /** Column width */
  width?: string | number
  /** Cell alignment */
  align?: 'start' | 'center' | 'end'
  /** Cell render function */
  cell?: (item: T) => React.ReactNode
}

/**
 * Preview state for bulk actions with item exclusion
 */
export interface BulkActionPreviewState<T extends BulkSelectableItem = BulkSelectableItem> {
  /** Whether preview is open */
  open: boolean
  /** Action being previewed */
  action: BulkActionDefinition<T> | null
  /** Items being previewed */
  items: T[]
}

/**
 * Hook return type for useBulkActions
 */
export interface UseBulkActionsReturn<T extends BulkSelectableItem = BulkSelectableItem> {
  // Selection
  selection: BulkSelectionState
  isSelected: (id: string) => boolean
  toggleSelection: (id: string) => void
  selectAll: (ids: string[]) => void
  selectRange: (startId: string, endId: string, allIds: string[]) => void
  clearSelection: () => void

  // Actions
  actionState: BulkActionState
  executeAction: (
    action: BulkActionDefinition<T>,
    params?: BulkActionParams,
  ) => Promise<BulkActionResult>
  executeActionWithItems: (
    action: BulkActionDefinition<T>,
    items: T[],
    params?: BulkActionParams,
  ) => Promise<BulkActionResult>
  cancelAction: () => void
  resetActionState: () => void

  // Undo
  canUndo: boolean
  undoData: BulkActionUndoData | null
  executeUndo: () => Promise<boolean>
  clearUndoData: () => void

  // Confirmation
  pendingConfirmation: BulkActionConfirmationProps | null
  requestConfirmation: (action: BulkActionDefinition<T>, items: T[]) => void
  confirmAction: (params?: BulkActionParams) => void
  cancelConfirmation: () => void

  // Preview (for item exclusion before action)
  previewState: BulkActionPreviewState<T>
  requestPreview: (action: BulkActionDefinition<T>, items: T[]) => void
  confirmPreview: (includedItems: T[], params?: BulkActionParams) => void
  cancelPreview: () => void
}

/**
 * Configuration options for useBulkActions hook
 */
export interface UseBulkActionsOptions<T extends BulkSelectableItem = BulkSelectableItem> {
  /** Maximum number of items that can be selected */
  maxSelection?: number
  /** Default actions available */
  actions?: BulkActionDefinition<T>[]
  /** Entity type */
  entityType: BulkActionEntityType
  /** Undo TTL in ms (default: 30000) */
  undoTtl?: number
  /** Callback after action completes */
  onActionComplete?: (result: BulkActionResult) => void
  /** Callback on action error */
  onActionError?: (error: Error) => void
  /** Callback when undo is executed */
  onUndo?: (undoData: BulkActionUndoData) => Promise<boolean>
}

/**
 * Maximum selection limit
 */
export const MAX_BULK_SELECTION = 100

/**
 * Default undo TTL (30 seconds)
 */
export const DEFAULT_UNDO_TTL = 30000

/**
 * Default actions available for most entities
 */
export const DEFAULT_BULK_ACTIONS: BulkActionDefinition[] = [
  {
    id: 'update-status',
    labelKey: 'bulkActions.actions.updateStatus',
    icon: 'RefreshCw',
    requiresConfirmation: true,
    supportsUndo: true,
  },
  {
    id: 'assign',
    labelKey: 'bulkActions.actions.assign',
    icon: 'UserPlus',
    requiresConfirmation: true,
    supportsUndo: true,
  },
  {
    id: 'add-tags',
    labelKey: 'bulkActions.actions.addTags',
    icon: 'Tags',
    requiresConfirmation: false,
    supportsUndo: true,
  },
  {
    id: 'export',
    labelKey: 'bulkActions.actions.export',
    icon: 'Download',
    requiresConfirmation: false,
    supportsUndo: false,
  },
  {
    id: 'delete',
    labelKey: 'bulkActions.actions.delete',
    icon: 'Trash2',
    variant: 'destructive',
    requiresConfirmation: true,
    isDestructive: true,
    supportsUndo: true,
  },
]

/**
 * Entity-specific action configurations
 */
export const ENTITY_ACTIONS: Record<BulkActionEntityType, BulkActionType[]> = {
  entity: ['update-status', 'assign', 'add-tags', 'export', 'delete'],
  document: ['add-tags', 'remove-tags', 'export', 'delete', 'archive'],
  ticket: ['update-status', 'assign', 'change-priority', 'escalate', 'export'],
  dossier: ['update-status', 'assign', 'add-tags', 'export', 'archive'],
  engagement: ['update-status', 'assign', 'add-tags', 'export'],
  commitment: ['update-status', 'assign', 'change-priority', 'export'],
  deliverable: ['update-status', 'assign', 'change-priority', 'export'],
  person: ['add-tags', 'remove-tags', 'export', 'delete'],
  'working-group': ['update-status', 'assign', 'add-tags', 'export'],
}
