/**
 * useDossierContext Hook
 * Feature: 035-dossier-context (Smart Dossier Context Inheritance)
 *
 * Exposes dossier context state and actions from the DossierContextProvider.
 * Now includes store-backed capabilities:
 * - activeDossier: Current dossier scope
 * - recentDossiers: Last 10 viewed dossiers
 * - pinnedDossiers: User's pinned favorites
 * - Smart context resolution functions
 */

import { useMemo } from 'react'
import { useDossierContextInternal, useDossierContextSafe } from '@/contexts/dossier-context'
import type {
  DossierReference,
  InheritanceSource,
  ContextEntityType,
} from '@/types/dossier-context.types'
import type { DossierEntry, InheritanceContext } from '@/store/dossierStore'

/**
 * Return type for useDossierContext hook
 */
export interface UseDossierContextReturn {
  // ============================================================================
  // Context State (from React Context)
  // ============================================================================
  isLoading: boolean
  error: string | null
  selectedDossiers: DossierReference[]
  primaryDossier: DossierReference | null
  requiresSelection: boolean
  inheritanceSource: InheritanceSource
  inheritedFrom: { type: ContextEntityType; id: string } | null

  // ============================================================================
  // Computed Values
  // ============================================================================
  hasDossierContext: boolean
  dossierId: string | null
  dossierIds: string[]

  // ============================================================================
  // Store-Backed State (Persisted)
  // ============================================================================
  /** Currently active dossier (persisted to localStorage) */
  activeDossier: DossierEntry | null
  /** How the active dossier was resolved */
  activeInheritance: InheritanceContext | null
  /** Last 10 viewed dossiers (persisted) */
  recentDossiers: DossierEntry[]
  /** User's pinned favorite dossiers (persisted) */
  pinnedDossiers: DossierEntry[]

  // ============================================================================
  // Context Actions
  // ============================================================================
  selectDossier: (dossier: DossierReference) => void
  deselectDossier: (dossierId: string) => void
  setPrimaryDossier: (dossier: DossierReference | null) => void
  reset: () => void

  // ============================================================================
  // Store Actions (Pin/Recent/Context Resolution)
  // ============================================================================
  /** Set the active dossier scope */
  setActiveDossier: (dossier: DossierEntry | null) => void
  /** Pin a dossier to favorites */
  pinDossier: (dossier: DossierEntry) => boolean
  /** Unpin a dossier from favorites */
  unpinDossier: (dossierId: string) => void
  /** Toggle pinned status for a dossier */
  togglePinned: (dossier: DossierEntry) => boolean
  /** Check if a dossier is pinned */
  isPinned: (dossierId: string) => boolean
  /** Add a dossier to recent history */
  addToRecentDossiers: (dossier: DossierEntry) => void
  /** Resolve dossier context from URL pathname and search params */
  resolveContextFromUrl: (
    pathname: string,
    searchParams?: Record<string, string>,
  ) => {
    entityType: ContextEntityType | null
    entityId: string | null
    dossierId: string | null
  }
  /** Inherit context from a parent entity (engagement, after-action, position) */
  inheritContextFromParent: (
    parentType: ContextEntityType,
    parentId: string,
  ) => Promise<DossierEntry[]>

  // ============================================================================
  // Form Integration
  // ============================================================================
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
 * Provides both transient context state and persisted store state.
 *
 * @example
 * ```tsx
 * const {
 *   // Context state
 *   isLoading,
 *   requiresSelection,
 *   selectedDossiers,
 *   selectDossier,
 *   getFormData,
 *
 *   // Store state (persisted)
 *   activeDossier,
 *   recentDossiers,
 *   pinnedDossiers,
 *
 *   // Store actions
 *   pinDossier,
 *   unpinDossier,
 *   setActiveDossier,
 *   resolveContextFromUrl,
 * } = useDossierContext();
 *
 * // Pin current dossier
 * if (activeDossier) {
 *   pinDossier(activeDossier);
 * }
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
  const {
    state,
    actions,
    activeDossier,
    activeInheritance,
    recentDossiers,
    pinnedDossiers,
    storeActions,
  } = useDossierContextInternal()

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
    // Context state
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

    // Store-backed state (persisted)
    activeDossier,
    activeInheritance,
    recentDossiers,
    pinnedDossiers,

    // Context actions
    selectDossier: actions.selectDossier,
    deselectDossier: actions.deselectDossier,
    setPrimaryDossier: actions.setPrimaryDossier,
    reset: actions.reset,

    // Store actions
    setActiveDossier: storeActions.setActiveDossier,
    pinDossier: storeActions.pinDossier,
    unpinDossier: storeActions.unpinDossier,
    togglePinned: storeActions.togglePinned,
    isPinned: storeActions.isPinned,
    addToRecentDossiers: storeActions.addToRecentDossiers,
    resolveContextFromUrl: storeActions.resolveContextFromUrl,
    inheritContextFromParent: storeActions.inheritContextFromParent,

    // Form integration
    getFormData,
  }
}

/**
 * Standalone hook for just the store-backed dossier state.
 * Can be used without a DossierContextProvider.
 * Useful for components that only need access to pinned/recent dossiers.
 *
 * @example
 * ```tsx
 * const {
 *   activeDossier,
 *   recentDossiers,
 *   pinnedDossiers,
 *   pinDossier,
 *   unpinDossier,
 * } = useDossierStoreState();
 * ```
 */
export function useDossierStoreState() {
  // Import directly from store to avoid context requirement
  const {
    useDossierStore,
    useActiveDossier,
    useRecentDossiers,
    usePinnedDossiers,
  } = require('@/store/dossierStore')

  const active = useActiveDossier()
  const recent = useRecentDossiers()
  const pinned = usePinnedDossiers()

  return {
    // State
    activeDossier: active.dossier,
    activeInheritance: active.inheritance,
    isResolving: active.isResolving,
    resolutionError: active.error,
    recentDossiers: recent.recentDossiers,
    pinnedDossiers: pinned.pinnedDossiers,

    // Actions
    setActiveDossier: active.setActiveDossier,
    clearActiveDossier: active.clearActiveDossier,
    addToRecentDossiers: recent.addToRecentDossiers,
    removeFromRecentDossiers: recent.removeFromRecentDossiers,
    clearRecentDossiers: recent.clearRecentDossiers,
    pinDossier: pinned.pinDossier,
    unpinDossier: pinned.unpinDossier,
    togglePinned: pinned.togglePinned,
    isPinned: pinned.isPinned,
    reorderPinnedDossiers: pinned.reorderPinnedDossiers,
    updatePinnedDossierColor: pinned.updatePinnedDossierColor,
    clearPinnedDossiers: pinned.clearPinnedDossiers,
    getPinnedDossiersByType: pinned.getPinnedDossiersByType,
  }
}

/**
 * Safe version of useDossierContext that doesn't throw if provider is missing.
 * Returns null values for state and no-op functions for actions when outside provider.
 *
 * @example
 * ```tsx
 * const ctx = useDossierContextSafe();
 * if (ctx?.activeDossier) {
 *   // Safe to use
 * }
 * ```
 */
export function useDossierContextSafeHook(): Partial<UseDossierContextReturn> | null {
  const context = useDossierContextSafe()

  if (!context) {
    return null
  }

  const {
    state,
    actions,
    activeDossier,
    activeInheritance,
    recentDossiers,
    pinnedDossiers,
    storeActions,
  } = context

  const hasDossierContext = state.selectedDossiers.length > 0
  const dossierId = state.primaryDossier?.id ?? null
  const dossierIds = state.selectedDossiers.map((d) => d.id)

  return {
    // Context state
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

    // Store-backed state
    activeDossier,
    activeInheritance,
    recentDossiers,
    pinnedDossiers,

    // Actions
    selectDossier: actions.selectDossier,
    deselectDossier: actions.deselectDossier,
    setPrimaryDossier: actions.setPrimaryDossier,
    reset: actions.reset,

    // Store actions
    setActiveDossier: storeActions.setActiveDossier,
    pinDossier: storeActions.pinDossier,
    unpinDossier: storeActions.unpinDossier,
    togglePinned: storeActions.togglePinned,
    isPinned: storeActions.isPinned,
    addToRecentDossiers: storeActions.addToRecentDossiers,
    resolveContextFromUrl: storeActions.resolveContextFromUrl,
    inheritContextFromParent: storeActions.inheritContextFromParent,

    // Form integration
    getFormData: () => ({
      dossier_ids: dossierIds,
      inheritance_source: state.inheritanceSource,
      inherited_from_type: state.inheritedFrom?.type,
      inherited_from_id: state.inheritedFrom?.id,
      is_primary_dossier_id: state.primaryDossier?.id,
    }),
  }
}

export default useDossierContext
