/**
 * useDossierContext Hook
 * Feature: 035-dossier-context (Smart Dossier Context Inheritance)
 *
 * Exposes dossier context state and actions from the DossierContextProvider.
 * Provides a convenient API for components that need dossier context.
 */

import { useMemo } from 'react'
import { useDossierContextInternal } from '@/contexts/dossier-context'
import type {
  DossierReference,
  InheritanceSource,
  ContextEntityType,
} from '@/types/dossier-context.types'

/**
 * Return type for useDossierContext hook
 */
export interface UseDossierContextReturn {
  // State
  isLoading: boolean
  error: string | null
  selectedDossiers: DossierReference[]
  primaryDossier: DossierReference | null
  requiresSelection: boolean
  inheritanceSource: InheritanceSource
  inheritedFrom: { type: ContextEntityType; id: string } | null

  // Computed
  hasDossierContext: boolean
  dossierId: string | null
  dossierIds: string[]

  // Actions
  selectDossier: (dossier: DossierReference) => void
  deselectDossier: (dossierId: string) => void
  setPrimaryDossier: (dossier: DossierReference | null) => void
  reset: () => void

  // For form integration
  getFormData: () => {
    dossier_ids: string[]
    inheritance_source: InheritanceSource
    inherited_from_type?: ContextEntityType
    inherited_from_id?: string
    is_primary_dossier_id?: string
  }
}

/**
 * Hook to access dossier context for work item creation.
 *
 * @example
 * ```tsx
 * const {
 *   isLoading,
 *   requiresSelection,
 *   selectedDossiers,
 *   selectDossier,
 *   getFormData,
 * } = useDossierContext();
 *
 * // In form submission:
 * const dossierData = getFormData();
 * await createWorkItemDossierLinks({
 *   work_item_type: 'task',
 *   work_item_id: newTask.id,
 *   ...dossierData,
 * });
 * ```
 */
export function useDossierContext(): UseDossierContextReturn {
  const { state, actions } = useDossierContextInternal()

  // Computed values
  const hasDossierContext = useMemo(
    () => state.selectedDossiers.length > 0,
    [state.selectedDossiers],
  )

  const dossierId = useMemo(() => state.primaryDossier?.id ?? null, [state.primaryDossier])

  const dossierIds = useMemo(
    () => state.selectedDossiers.map((d) => d.id),
    [state.selectedDossiers],
  )

  // Form data helper
  const getFormData = useMemo(
    () => () => ({
      dossier_ids: dossierIds,
      inheritance_source: state.inheritanceSource,
      inherited_from_type: state.inheritedFrom?.type,
      inherited_from_id: state.inheritedFrom?.id,
      is_primary_dossier_id: state.primaryDossier?.id,
    }),
    [dossierIds, state.inheritanceSource, state.inheritedFrom, state.primaryDossier],
  )

  return {
    // State
    isLoading: state.isLoading,
    error: state.error,
    selectedDossiers: state.selectedDossiers,
    primaryDossier: state.primaryDossier,
    requiresSelection: state.requiresSelection,
    inheritanceSource: state.inheritanceSource,
    inheritedFrom: state.inheritedFrom,

    // Computed
    hasDossierContext,
    dossierId,
    dossierIds,

    // Actions
    selectDossier: actions.selectDossier,
    deselectDossier: actions.deselectDossier,
    setPrimaryDossier: actions.setPrimaryDossier,
    reset: actions.reset,

    // Form integration
    getFormData,
  }
}

export default useDossierContext
