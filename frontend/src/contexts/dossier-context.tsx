/**
 * DossierContextProvider
 * Feature: 035-dossier-context (Smart Dossier Context Inheritance)
 *
 * React Context for managing dossier context during work item creation.
 * Synchronizes with URL via TanStack Router useSearch.
 * Provides auto-resolution from entity relationships.
 */

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import { useSearch } from '@tanstack/react-router'
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
// Context
// ============================================================================

const DossierContext = createContext<DossierContextValue | null>(null)

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

  const setResolvedContext = useCallback((context: ResolvedDossierContext[]) => {
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
      }
    } else {
      // No dossiers resolved - require manual selection
      dispatch({ type: 'SET_REQUIRES_SELECTION', payload: true })
    }
  }, [])

  const selectDossier = useCallback((dossier: DossierReference) => {
    dispatch({ type: 'ADD_DOSSIER', payload: dossier })
  }, [])

  const deselectDossier = useCallback((dossierId: string) => {
    dispatch({ type: 'REMOVE_DOSSIER', payload: dossierId })
  }, [])

  const setPrimaryDossier = useCallback((dossier: DossierReference | null) => {
    dispatch({ type: 'SET_PRIMARY_DOSSIER', payload: dossier })
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  // ============================================================================
  // Auto-resolve from URL/route context
  // ============================================================================

  useEffect(() => {
    if (!autoResolve) return

    // Priority 1: Direct dossier from URL search param
    if (urlDossierId) {
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

  const value: DossierContextValue = {
    state,
    actions,
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
export function useDossierContextInternal(): DossierContextValue {
  const context = useContext(DossierContext)
  if (!context) {
    throw new Error('useDossierContextInternal must be used within a DossierContextProvider')
  }
  return context
}

export default DossierContextProvider
