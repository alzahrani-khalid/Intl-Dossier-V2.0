/**
 * DossierNavigationContext
 *
 * Manages the active dossier navigation state: which dossier is currently
 * selected, primary dossier, and the selection/deselection actions.
 * This state changes frequently (on every navigation).
 */

import { createContext, useContext, useReducer, useCallback, useMemo, type ReactNode } from 'react'
import type {
  DossierReference,
  ResolvedDossierContext,
  InheritanceSource,
  ContextEntityType,
} from '@/types/dossier-context.types'
import { useDossierStore, type DossierEntry } from '@/store/dossierStore'

// ============================================================================
// State & Actions
// ============================================================================

export interface DossierNavigationState {
  isLoading: boolean
  error: string | null
  resolvedContext: ResolvedDossierContext[]
  selectedDossiers: DossierReference[]
  primaryDossier: DossierReference | null
  requiresSelection: boolean
  inheritanceSource: InheritanceSource
  inheritedFrom: { type: ContextEntityType; id: string } | null
}

export interface DossierNavigationActions {
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setResolvedContext: (context: ResolvedDossierContext[]) => void
  selectDossier: (dossier: DossierReference) => void
  deselectDossier: (dossierId: string) => void
  setPrimaryDossier: (dossier: DossierReference | null) => void
  setRequiresSelection: (requires: boolean) => void
  setInheritanceSource: (source: InheritanceSource) => void
  setInheritedFrom: (from: { type: ContextEntityType; id: string } | null) => void
  reset: () => void
}

export interface DossierNavigationContextValue {
  state: DossierNavigationState
  actions: DossierNavigationActions
}

// ============================================================================
// Action Types
// ============================================================================

type NavigationAction =
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

const initialState: DossierNavigationState = {
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

function navigationReducer(
  state: DossierNavigationState,
  action: NavigationAction,
): DossierNavigationState {
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
        primaryDossier:
          action.payload.length > 0 ? (state.primaryDossier ?? action.payload[0] ?? null) : null,
      }
    case 'SET_PRIMARY_DOSSIER':
      return { ...state, primaryDossier: action.payload }
    case 'ADD_DOSSIER': {
      if (state.selectedDossiers.some((d) => d.id === action.payload.id)) {
        return state
      }
      const newSelected = [...state.selectedDossiers, action.payload]
      return {
        ...state,
        selectedDossiers: newSelected,
        primaryDossier: state.primaryDossier ?? action.payload,
      }
    }
    case 'REMOVE_DOSSIER': {
      const filtered = state.selectedDossiers.filter((d) => d.id !== action.payload)
      return {
        ...state,
        selectedDossiers: filtered,
        primaryDossier:
          state.primaryDossier?.id === action.payload
            ? (filtered[0] ?? null)
            : state.primaryDossier,
      }
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

const NavigationContext = createContext<DossierNavigationContextValue | null>(null)

// ============================================================================
// Provider
// ============================================================================

export interface DossierNavigationProviderProps {
  children: ReactNode
}

export function DossierNavigationProvider({ children }: DossierNavigationProviderProps): ReactNode {
  const [state, dispatch] = useReducer(navigationReducer, initialState)
  const storeSetActiveDossier = useDossierStore((s) => s.setActiveDossier)

  const setLoading = useCallback((loading: boolean): void => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }, [])

  const setError = useCallback((error: string | null): void => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }, [])

  const setResolvedContext = useCallback(
    (context: ResolvedDossierContext[]): void => {
      dispatch({ type: 'SET_RESOLVED_CONTEXT', payload: context })

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

        const firstContext = context[0]
        if (firstContext) {
          const source = firstContext.inheritance_source
          dispatch({ type: 'SET_INHERITANCE_SOURCE', payload: source })

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
        dispatch({ type: 'SET_REQUIRES_SELECTION', payload: true })
      }
    },
    [storeSetActiveDossier],
  )

  const selectDossier = useCallback(
    (dossier: DossierReference): void => {
      dispatch({ type: 'ADD_DOSSIER', payload: dossier })
      const entry: DossierEntry = {
        ...dossier,
        viewedAt: Date.now(),
      }
      storeSetActiveDossier(entry)
    },
    [storeSetActiveDossier],
  )

  const deselectDossier = useCallback((dossierId: string): void => {
    dispatch({ type: 'REMOVE_DOSSIER', payload: dossierId })
  }, [])

  const setPrimaryDossier = useCallback(
    (dossier: DossierReference | null): void => {
      dispatch({ type: 'SET_PRIMARY_DOSSIER', payload: dossier })
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

  const setRequiresSelection = useCallback((requires: boolean): void => {
    dispatch({ type: 'SET_REQUIRES_SELECTION', payload: requires })
  }, [])

  const setInheritanceSource = useCallback((source: InheritanceSource): void => {
    dispatch({ type: 'SET_INHERITANCE_SOURCE', payload: source })
  }, [])

  const setInheritedFrom = useCallback(
    (from: { type: ContextEntityType; id: string } | null): void => {
      dispatch({ type: 'SET_INHERITED_FROM', payload: from })
    },
    [],
  )

  const reset = useCallback((): void => {
    dispatch({ type: 'RESET' })
  }, [])

  const actions: DossierNavigationActions = useMemo(
    () => ({
      setLoading,
      setError,
      setResolvedContext,
      selectDossier,
      deselectDossier,
      setPrimaryDossier,
      setRequiresSelection,
      setInheritanceSource,
      setInheritedFrom,
      reset,
    }),
    [
      setLoading,
      setError,
      setResolvedContext,
      selectDossier,
      deselectDossier,
      setPrimaryDossier,
      setRequiresSelection,
      setInheritanceSource,
      setInheritedFrom,
      reset,
    ],
  )

  const value: DossierNavigationContextValue = useMemo(() => ({ state, actions }), [state, actions])

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
}

// ============================================================================
// Hook
// ============================================================================

export function useDossierNavigation(): DossierNavigationContextValue {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useDossierNavigation must be used within a DossierNavigationProvider')
  }
  return context
}

export function useDossierNavigationSafe(): DossierNavigationContextValue | null {
  return useContext(NavigationContext)
}
