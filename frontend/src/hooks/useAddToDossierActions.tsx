/**
 * useAddToDossierActions - Hook for managing "Add to Dossier" action handlers
 *
 * Provides state management and handlers for all dossier-context actions:
 * - Intake, Task, Commitment creation with dossier context
 * - Position, Event scheduling
 * - Relationship, Brief generation, Document upload
 *
 * Each action automatically inherits dossier context with 'direct' inheritance_source.
 *
 * @module useAddToDossierActions
 * @see specs/035-dossier-context
 */

import * as React from 'react'
import type { Dossier } from '@/lib/dossier-type-guards'
import type { DossierType, InheritanceSource } from '@/types/dossier-context.types'
import type { AddToDossierActionType, DossierContext } from '@/components/Dossier/AddToDossierMenu'

// =============================================================================
// Types
// =============================================================================

export interface ActionDialogState {
  intake: boolean
  task: boolean
  commitment: boolean
  position: boolean
  event: boolean
  relationship: boolean
  brief: boolean
  document: boolean
}

export interface DossierContextForAction {
  dossier_id: string
  dossier_type: DossierType
  dossier_name_en: string
  dossier_name_ar: string | null
  inheritance_source: InheritanceSource
}

export interface UseAddToDossierActionsOptions {
  /** The dossier to add items to */
  dossier: Dossier
  /** Called when an action is triggered (before dialog opens) */
  onActionStart?: (actionType: AddToDossierActionType, context: DossierContextForAction) => void
  /** Called when an action completes successfully */
  onActionComplete?: (actionType: AddToDossierActionType, result: unknown) => void
  /** Called when an action fails */
  onActionError?: (actionType: AddToDossierActionType, error: Error) => void
}

export interface UseAddToDossierActionsReturn {
  /** Current dialog open states */
  dialogStates: ActionDialogState
  /** Open a specific dialog */
  openDialog: (actionType: AddToDossierActionType) => void
  /** Close a specific dialog */
  closeDialog: (actionType: AddToDossierActionType) => void
  /** Close all dialogs */
  closeAllDialogs: () => void
  /** Handle action from AddToDossierMenu */
  handleAction: (actionType: AddToDossierActionType, context: DossierContext) => void
  /** Get dossier context for passing to forms */
  getDossierContext: () => DossierContextForAction
  /** Check if any dialog is open */
  isAnyDialogOpen: boolean
  /** Current active action type (if any) */
  activeAction: AddToDossierActionType | null
}

// =============================================================================
// Initial State
// =============================================================================

const initialDialogState: ActionDialogState = {
  intake: false,
  task: false,
  commitment: false,
  position: false,
  event: false,
  relationship: false,
  brief: false,
  document: false,
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useAddToDossierActions({
  dossier,
  onActionStart,
}: UseAddToDossierActionsOptions): UseAddToDossierActionsReturn {
  // Dialog state management
  const [dialogStates, setDialogStates] = React.useState<ActionDialogState>(initialDialogState)
  const [activeAction, setActiveAction] = React.useState<AddToDossierActionType | null>(null)

  // Build dossier context
  const getDossierContext = React.useCallback((): DossierContextForAction => {
    return {
      dossier_id: dossier.id,
      dossier_type: dossier.type as DossierType,
      dossier_name_en: dossier.name_en,
      dossier_name_ar: dossier.name_ar ?? null,
      inheritance_source: 'direct',
    }
  }, [dossier])

  // Open a specific dialog
  const openDialog = React.useCallback(
    (actionType: AddToDossierActionType) => {
      const context = getDossierContext()
      onActionStart?.(actionType, context)

      setActiveAction(actionType)
      setDialogStates((prev) => ({
        ...prev,
        [actionType]: true,
      }))
    },
    [getDossierContext, onActionStart],
  )

  // Close a specific dialog
  const closeDialog = React.useCallback((actionType: AddToDossierActionType) => {
    setDialogStates((prev) => ({
      ...prev,
      [actionType]: false,
    }))
    setActiveAction(null)
  }, [])

  // Close all dialogs
  const closeAllDialogs = React.useCallback(() => {
    setDialogStates(initialDialogState)
    setActiveAction(null)
  }, [])

  // Handle action from AddToDossierMenu
  const handleAction = React.useCallback(
    (actionType: AddToDossierActionType, _context: DossierContext) => {
      // Special handling for actions that navigate instead of opening dialog
      switch (actionType) {
        case 'brief':
          // Navigate to brief generation page with dossier context
          // TODO: Implement when brief generation feature is complete
          openDialog(actionType)
          break

        case 'intake':
          // Open intake dialog with pre-filled dossier context
          openDialog(actionType)
          break

        case 'task':
          // Open task dialog with pre-filled dossier context
          openDialog(actionType)
          break

        case 'commitment':
          // Open commitment dialog with pre-filled dossier context
          openDialog(actionType)
          break

        case 'position':
          // Open position dialog with pre-filled dossier context
          openDialog(actionType)
          break

        case 'event':
          // Open event scheduling dialog
          openDialog(actionType)
          break

        case 'relationship':
          // Open relationship dialog
          openDialog(actionType)
          break

        case 'document':
          // Open document upload dialog
          openDialog(actionType)
          break

        default:
          console.warn(`Unknown action type: ${actionType}`)
      }
    },
    [openDialog],
  )

  // Check if any dialog is open
  const isAnyDialogOpen = React.useMemo(
    () => Object.values(dialogStates).some(Boolean),
    [dialogStates],
  )

  // Close dialogs on Escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAnyDialogOpen) {
        closeAllDialogs()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isAnyDialogOpen, closeAllDialogs])

  return {
    dialogStates,
    openDialog,
    closeDialog,
    closeAllDialogs,
    handleAction,
    getDossierContext,
    isAnyDialogOpen,
    activeAction,
  }
}

// =============================================================================
// Context Provider (Optional - for deep nesting)
// =============================================================================

interface AddToDossierContextValue extends UseAddToDossierActionsReturn {
  dossier: Dossier
}

const AddToDossierContext = React.createContext<AddToDossierContextValue | null>(null)

export interface AddToDossierProviderProps {
  dossier: Dossier
  children: React.ReactNode
  onActionStart?: (actionType: AddToDossierActionType, context: DossierContextForAction) => void
  onActionComplete?: (actionType: AddToDossierActionType, result: unknown) => void
  onActionError?: (actionType: AddToDossierActionType, error: Error) => void
}

export function AddToDossierProvider({
  dossier,
  children,
  onActionStart,
  onActionComplete,
  onActionError,
}: AddToDossierProviderProps) {
  const actions = useAddToDossierActions({
    dossier,
    onActionStart,
    onActionComplete,
    onActionError,
  })

  const value = React.useMemo(
    () => ({
      ...actions,
      dossier,
    }),
    [actions, dossier],
  )

  return <AddToDossierContext.Provider value={value}>{children}</AddToDossierContext.Provider>
}

export function useAddToDossierContext() {
  const context = React.useContext(AddToDossierContext)
  if (!context) {
    throw new Error('useAddToDossierContext must be used within AddToDossierProvider')
  }
  return context
}

// =============================================================================
// Helper: Create Work Item with Dossier Context
// =============================================================================

export interface CreateWorkItemWithContextOptions {
  workItemType: 'task' | 'commitment' | 'intake'
  workItemId: string
  dossierContext: DossierContextForAction
}

/**
 * Creates the payload for linking a work item to a dossier
 */
export function buildWorkItemDossierLinkPayload(options: CreateWorkItemWithContextOptions) {
  return {
    work_item_type: options.workItemType,
    work_item_id: options.workItemId,
    dossier_ids: [options.dossierContext.dossier_id],
    inheritance_source: options.dossierContext.inheritance_source,
    inherited_from_type: null as null,
    inherited_from_id: null as null,
    is_primary: true,
  }
}
