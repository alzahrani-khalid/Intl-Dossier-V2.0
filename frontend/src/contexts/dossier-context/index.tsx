/**
 * Dossier Context — Combined Provider & Facade
 *
 * Composes DossierNavigationContext, DossierCollectionContext, and
 * DossierInheritanceContext into a single provider tree.
 *
 * Exports a backward-compatible `useDossierContext()` facade that returns
 * the same shape as the old monolithic ExtendedDossierContextValue.
 */

import type { ReactNode } from 'react'
import type {
  DossierContextActions,
  DossierContextValue,
  ContextEntityType,
} from '@/types/dossier-context.types'
import type { DossierEntry, InheritanceContext } from '@/store/dossierStore'

import {
  DossierNavigationProvider,
  useDossierNavigation,
  useDossierNavigationSafe,
} from './DossierNavigationContext'
import {
  DossierCollectionProvider,
  useDossierCollection,
  useDossierCollectionSafe,
} from './DossierCollectionContext'
import {
  DossierInheritanceProvider,
  useDossierInheritance,
  useDossierInheritanceSafe,
} from './DossierInheritanceContext'

// ============================================================================
// Re-export sub-context hooks for granular usage
// ============================================================================

export { useDossierNavigation, useDossierNavigationSafe } from './DossierNavigationContext'
export { useDossierCollection, useDossierCollectionSafe } from './DossierCollectionContext'
export { useDossierInheritance, useDossierInheritanceSafe } from './DossierInheritanceContext'

// Re-export sub-context types
export type { DossierNavigationContextValue } from './DossierNavigationContext'
export type { DossierCollectionContextValue } from './DossierCollectionContext'
export type { DossierInheritanceContextValue } from './DossierInheritanceContext'

// ============================================================================
// Extended Context Value (backward compat with old monolithic shape)
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
// Combined Provider
// ============================================================================

export interface DossierContextProviderProps {
  children: ReactNode
  autoResolve?: boolean
}

/**
 * Combined DossierProvider that nests all three sub-context providers.
 * Drop-in replacement for the old monolithic DossierContextProvider.
 */
export function DossierContextProvider({
  children,
  autoResolve = true,
}: DossierContextProviderProps): ReactNode {
  return (
    <DossierNavigationProvider>
      <DossierCollectionProvider>
        <DossierInheritanceProvider autoResolve={autoResolve}>
          {children}
        </DossierInheritanceProvider>
      </DossierCollectionProvider>
    </DossierNavigationProvider>
  )
}

// Alias for backward compat
export const DossierProvider = DossierContextProvider

// ============================================================================
// Facade Hook — backward-compatible with old useDossierContextInternal
// ============================================================================

/**
 * Access the full dossier context (all 3 sub-contexts composed).
 * Returns the same ExtendedDossierContextValue shape as the old monolithic context.
 * Must be used within a DossierContextProvider (or DossierProvider).
 */
export function useDossierContextInternal(): ExtendedDossierContextValue {
  const nav = useDossierNavigation()
  const collection = useDossierCollection()
  const inheritance = useDossierInheritance()

  const actions: DossierContextActions = {
    setLoading: nav.actions.setLoading,
    setError: nav.actions.setError,
    setResolvedContext: nav.actions.setResolvedContext,
    selectDossier: nav.actions.selectDossier,
    deselectDossier: nav.actions.deselectDossier,
    setPrimaryDossier: nav.actions.setPrimaryDossier,
    reset: nav.actions.reset,
  }

  const storeActions = {
    setActiveDossier: inheritance.setActiveDossier,
    pinDossier: collection.pinDossier,
    unpinDossier: collection.unpinDossier,
    togglePinned: collection.togglePinned,
    isPinned: collection.isPinned,
    addToRecentDossiers: collection.addToRecentDossiers,
    resolveContextFromUrl: inheritance.resolveContextFromUrl,
    inheritContextFromParent: inheritance.inheritContextFromParent,
  }

  return {
    state: nav.state,
    actions,
    activeDossier: inheritance.activeDossier,
    activeInheritance: inheritance.activeInheritance,
    recentDossiers: collection.recentDossiers,
    pinnedDossiers: collection.pinnedDossiers,
    storeActions,
  }
}

/**
 * Safe version that doesn't throw if provider is missing.
 * Returns null if used outside of provider.
 */
export function useDossierContextSafe(): ExtendedDossierContextValue | null {
  const nav = useDossierNavigationSafe()
  const collection = useDossierCollectionSafe()
  const inheritance = useDossierInheritanceSafe()

  if (nav === null || collection === null || inheritance === null) {
    return null
  }

  const actions: DossierContextActions = {
    setLoading: nav.actions.setLoading,
    setError: nav.actions.setError,
    setResolvedContext: nav.actions.setResolvedContext,
    selectDossier: nav.actions.selectDossier,
    deselectDossier: nav.actions.deselectDossier,
    setPrimaryDossier: nav.actions.setPrimaryDossier,
    reset: nav.actions.reset,
  }

  const storeActions = {
    setActiveDossier: inheritance.setActiveDossier,
    pinDossier: collection.pinDossier,
    unpinDossier: collection.unpinDossier,
    togglePinned: collection.togglePinned,
    isPinned: collection.isPinned,
    addToRecentDossiers: collection.addToRecentDossiers,
    resolveContextFromUrl: inheritance.resolveContextFromUrl,
    inheritContextFromParent: inheritance.inheritContextFromParent,
  }

  return {
    state: nav.state,
    actions,
    activeDossier: inheritance.activeDossier,
    activeInheritance: inheritance.activeInheritance,
    recentDossiers: collection.recentDossiers,
    pinnedDossiers: collection.pinnedDossiers,
    storeActions,
  }
}
