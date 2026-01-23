/**
 * DossierContextProvider
 * Feature: 035-dossier-context (Smart Dossier Context Inheritance)
 *
 * Enhanced React Context for managing dossier context.
 * Now integrates with the Zustand dossier store for:
 * - activeDossier: Current dossier scope
 * - recentDossiers: Last 10 viewed dossiers
 * - pinnedDossiers: User's pinned favorites
 *
 * Provides smart context resolution from URL and parent entities.
 */

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import { useSearch, useLocation } from '@tanstack/react-router'
import type {
  DossierContextState,
  DossierContextActions,
  DossierContextValue,
  DossierReference,
  ResolvedDossierContext,
  InheritanceSource,
  ContextEntityType,
} from '@/types/dossier-context.types'
import { useCreationContext } from '@/components/work-creation/hooks/useCreationContext'
import { useDossierStore, type DossierEntry, type InheritanceContext } from '@/store/dossierStore'

// ============================================================================
// Action Types
// ============================================================================

type DossierContextAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_RESOLVED_CONTEXT'; payload: ResolvedDossierContext[] }
  | { type: 'SET_SELECTED_DOSSIERS'; payload: DossierReference[] }
  | { type: 'SET_PRIMARY_DOSSIER'; payload: DossierReference | null }
  | { type: 'ADD_DOSSIER'; payload: DossierReference }
  | { type: 'REMOVE_DOSSIER'; payload: string }
  | { type: 'SET_REQUIRES_SELECTION'; payload: boolean }
  | { type: 'SET_INHERITANCE_SOURCE'; payload: InheritanceSource }
  | { type: 'SET_INHERITED_FROM'; payload: { type: ContextEntityType; id: string } | null }
  | { type: 'RESET' }

// ============================================================================
// Initial State
// ============================================================================

const initialState: DossierContextState = {
  isLoading: false,
  error: null,
  resolvedContext: [],
  selectedDossiers: [],
  primaryDossier: null,
  requiresSelection: false,
  inheritanceSource: 'direct',
  inheritedFrom: null,
}

// ============================================================================
// Reducer
// ============================================================================

function dossierContextReducer(
  state: DossierContextState,
  action: DossierContextAction,
): DossierContextState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    case 'SET_RESOLVED_CONTEXT':
      return {
        ...state,
        resolvedContext: action.payload,
        isLoading: false,
        error: null,
      }
    case 'SET_SELECTED_DOSSIERS':
      return {
        ...state,
        selectedDossiers: action.payload,
        // Set primary to first if not already set
        primaryDossier:
          action.payload.length > 0 ? (state.primaryDossier ?? action.payload[0] ?? null) : null,
      }
    case 'SET_PRIMARY_DOSSIER':
      return { ...state, primaryDossier: action.payload }
    case 'ADD_DOSSIER':
      // Avoid duplicates
      if (state.selectedDossiers.some((d) => d.id === action.payload.id)) {
        return state
      }
      const newSelected = [...state.selectedDossiers, action.payload]
      return {
        ...state,
        selectedDossiers: newSelected,
        // Set primary if this is the first dossier
        primaryDossier: state.primaryDossier ?? action.payload,
      }
    case 'REMOVE_DOSSIER':
      const filtered = state.selectedDossiers.filter((d) => d.id !== action.payload)
      return {
        ...state,
        selectedDossiers: filtered,
        // Clear primary if removed
        primaryDossier:
          state.primaryDossier?.id === action.payload
            ? (filtered[0] ?? null)
            : state.primaryDossier,
      }
    case 'SET_REQUIRES_SELECTION':
      return { ...state, requiresSelection: action.payload }
    case 'SET_INHERITANCE_SOURCE':
      return { ...state, inheritanceSource: action.payload }
    case 'SET_INHERITED_FROM':
      return { ...state, inheritedFrom: action.payload }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

// ============================================================================
// Extended Context Value with Store Integration
// ============================================================================

export interface ExtendedDossierContextValue extends DossierContextValue {
  /** Store-backed active dossier (persisted) */
  activeDossier: DossierEntry | null
  /** How the active dossier was resolved */
  activeInheritance: InheritanceContext | null
  /** Recent dossiers from store (persisted) */
  recentDossiers: DossierEntry[]
  /** Pinned dossiers from store (persisted) */
  pinnedDossiers: DossierEntry[]
  /** Store actions */
  storeActions: {
    setActiveDossier: (dossier: DossierEntry | null) => void
    pinDossier: (dossier: DossierEntry) => boolean
    unpinDossier: (dossierId: string) => void
    togglePinned: (dossier: DossierEntry) => boolean
    isPinned: (dossierId: string) => boolean
    addToRecentDossiers: (dossier: DossierEntry) => void
    resolveContextFromUrl: (
      pathname: string,
      searchParams?: Record<string, string>,
    ) => {
      entityType: ContextEntityType | null
      entityId: string | null
      dossierId: string | null
    }
    inheritContextFromParent: (
      parentType: ContextEntityType,
      parentId: string,
    ) => Promise<DossierEntry[]>
  }
}

// ============================================================================
// Context
// ============================================================================

const DossierContext = createContext<ExtendedDossierContextValue | null>(null)

// ============================================================================
// Provider Props
// ============================================================================

export interface DossierContextProviderProps {
  children: ReactNode
  /**
   * Whether to auto-resolve dossier context from URL/route.
   * Defaults to true.
   */
  autoResolve?: boolean
}

// ============================================================================
// Provider Component
// ============================================================================

export function DossierContextProvider({
  children,
  autoResolve = true,
}: DossierContextProviderProps) {
  const [state, dispatch] = useReducer(dossierContextReducer, initialState)
  const creationContext = useCreationContext()
  const location = useLocation()

  // Get state and actions from the Zustand store
  const {
    activeDossier,
    activeInheritance,
    recentDossiers,
    pinnedDossiers,
    setActiveDossier: storeSetActiveDossier,
    pinDossier,
    unpinDossier,
    togglePinned,
    isPinned,
    addToRecentDossiers,
    resolveContextFromUrl,
    inheritContextFromParent,
    setResolvedContext: storeSetResolvedContext,
  } = useDossierStore()

  // Try to get dossier_id from URL search params
  // This provides URL sync for direct dossier links
  let urlDossierId: string | undefined
  try {
    // useSearch may throw if route doesn't define search params
    const search = useSearch({ strict: false }) as { dossier_id?: string } | undefined
    urlDossierId = search?.dossier_id
  } catch {
    // Ignore - search params not available
  }

  // ============================================================================
  // Actions
  // ============================================================================

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }, [])

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }, [])

  const setResolvedContext = useCallback(
    (context: ResolvedDossierContext[]) => {
      dispatch({ type: 'SET_RESOLVED_CONTEXT', payload: context })

      // Auto-select resolved dossiers
      if (context.length > 0) {
        const dossierRefs: DossierReference[] = context.map((ctx) => ({
          id: ctx.dossier_id,
          name_en: ctx.dossier_name_en,
          name_ar: ctx.dossier_name_ar,
          type: ctx.dossier_type as DossierReference['type'],
          status: ctx.dossier_status as DossierReference['status'],
        }))
        dispatch({ type: 'SET_SELECTED_DOSSIERS', payload: dossierRefs })
        dispatch({ type: 'SET_REQUIRES_SELECTION', payload: false })

        // Set inheritance source from first resolved context
        const firstContext = context[0]
        if (firstContext) {
          const source = firstContext.inheritance_source
          dispatch({ type: 'SET_INHERITANCE_SOURCE', payload: source })

          // Also update the Zustand store with first dossier
          const firstDossier: DossierEntry = {
            id: firstContext.dossier_id,
            name_en: firstContext.dossier_name_en,
            name_ar: firstContext.dossier_name_ar,
            type: firstContext.dossier_type as DossierReference['type'],
            status: firstContext.dossier_status as DossierReference['status'],
          }
          storeSetActiveDossier(firstDossier, {
            source: firstContext.inheritance_source,
          })
        }
      } else {
        // No dossiers resolved - require manual selection
        dispatch({ type: 'SET_REQUIRES_SELECTION', payload: true })
      }
    },
    [storeSetActiveDossier],
  )

  const selectDossier = useCallback(
    (dossier: DossierReference) => {
      dispatch({ type: 'ADD_DOSSIER', payload: dossier })

      // Also update the store
      const entry: DossierEntry = {
        ...dossier,
        viewedAt: Date.now(),
      }
      storeSetActiveDossier(entry)
    },
    [storeSetActiveDossier],
  )

  const deselectDossier = useCallback((dossierId: string) => {
    dispatch({ type: 'REMOVE_DOSSIER', payload: dossierId })
  }, [])

  const setPrimaryDossier = useCallback(
    (dossier: DossierReference | null) => {
      dispatch({ type: 'SET_PRIMARY_DOSSIER', payload: dossier })

      // Also update the store
      if (dossier) {
        const entry: DossierEntry = {
          ...dossier,
          viewedAt: Date.now(),
        }
        storeSetActiveDossier(entry)
      }
    },
    [storeSetActiveDossier],
  )

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  // ============================================================================
  // Auto-resolve from URL/route context
  // ============================================================================

  useEffect(() => {
    if (!autoResolve) return

    // Use the store's URL resolver
    const pathname = location.pathname
    const resolved = resolveContextFromUrl(pathname, { dossier_id: urlDossierId || '' })

    // Priority 1: Direct dossier from URL search param
    if (urlDossierId || resolved.dossierId) {
      dispatch({
        type: 'SET_INHERITANCE_SOURCE',
        payload: 'direct',
      })
      // We have a dossier ID but need to fetch full details
      // This will be handled by useResolveDossierContext hook
      return
    }

    // Priority 2: Dossier from route (e.g., /dossiers/:dossierId)
    if (creationContext.dossierId) {
      dispatch({
        type: 'SET_INHERITANCE_SOURCE',
        payload: 'direct',
      })
      return
    }

    // Priority 3: Engagement route - needs resolution
    if (creationContext.engagementId) {
      dispatch({
        type: 'SET_INHERITANCE_SOURCE',
        payload: 'engagement',
      })
      dispatch({
        type: 'SET_INHERITED_FROM',
        payload: { type: 'engagement', id: creationContext.engagementId },
      })
      return
    }

    // Priority 4: After-action route - needs chain resolution
    if (creationContext.afterActionId) {
      dispatch({
        type: 'SET_INHERITANCE_SOURCE',
        payload: 'after_action',
      })
      dispatch({
        type: 'SET_INHERITED_FROM',
        payload: { type: 'after_action', id: creationContext.afterActionId },
      })
      return
    }

    // Priority 5: Position route - needs resolution
    if (creationContext.positionId) {
      dispatch({
        type: 'SET_INHERITANCE_SOURCE',
        payload: 'position',
      })
      dispatch({
        type: 'SET_INHERITED_FROM',
        payload: { type: 'position', id: creationContext.positionId },
      })
      return
    }

    // No context available - require manual selection
    dispatch({ type: 'SET_REQUIRES_SELECTION', payload: true })
  }, [
    autoResolve,
    urlDossierId,
    creationContext.dossierId,
    creationContext.engagementId,
    creationContext.afterActionId,
    creationContext.positionId,
    location.pathname,
    resolveContextFromUrl,
  ])

  // ============================================================================
  // Build context value
  // ============================================================================

  const actions: DossierContextActions = {
    setLoading,
    setError,
    setResolvedContext,
    selectDossier,
    deselectDossier,
    setPrimaryDossier,
    reset,
  }

  const storeActions = {
    setActiveDossier: storeSetActiveDossier,
    pinDossier,
    unpinDossier,
    togglePinned,
    isPinned,
    addToRecentDossiers,
    resolveContextFromUrl,
    inheritContextFromParent,
  }

  const value: ExtendedDossierContextValue = {
    state,
    actions,
    // Store-backed state
    activeDossier,
    activeInheritance,
    recentDossiers,
    pinnedDossiers,
    storeActions,
  }

  return <DossierContext.Provider value={value}>{children}</DossierContext.Provider>
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Access dossier context state and actions.
 * Must be used within a DossierContextProvider.
 */
export function useDossierContextInternal(): ExtendedDossierContextValue {
  const context = useContext(DossierContext)
  if (!context) {
    throw new Error('useDossierContextInternal must be used within a DossierContextProvider')
  }
  return context
}

/**
 * Access dossier context state and actions.
 * Safe version that doesn't throw if provider is missing.
 * Returns null if used outside of provider.
 */
export function useDossierContextSafe(): ExtendedDossierContextValue | null {
  return useContext(DossierContext)
}

export default DossierContextProvider
