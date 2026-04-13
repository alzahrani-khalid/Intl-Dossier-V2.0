/**
 * DossierCollectionContext
 *
 * Manages persisted dossier collections: recent dossiers and pinned favorites.
 * This state changes rarely (only when user explicitly pins or views a dossier).
 * Backed by Zustand store with localStorage persistence.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useDossierStore, type DossierEntry } from '@/store/dossierStore'

// ============================================================================
// Types
// ============================================================================

export interface DossierCollectionContextValue {
  recentDossiers: DossierEntry[]
  pinnedDossiers: DossierEntry[]
  addToRecentDossiers: (dossier: DossierEntry) => void
  pinDossier: (dossier: DossierEntry) => boolean
  unpinDossier: (dossierId: string) => void
  togglePinned: (dossier: DossierEntry) => boolean
  isPinned: (dossierId: string) => boolean
}

// ============================================================================
// Context
// ============================================================================

const CollectionContext = createContext<DossierCollectionContextValue | null>(null)

// ============================================================================
// Provider
// ============================================================================

export interface DossierCollectionProviderProps {
  children: ReactNode
}

export function DossierCollectionProvider({ children }: DossierCollectionProviderProps): ReactNode {
  const recentDossiers = useDossierStore((s) => s.recentDossiers)
  const pinnedDossiers = useDossierStore((s) => s.pinnedDossiers)
  const addToRecentDossiers = useDossierStore((s) => s.addToRecentDossiers)
  const pinDossier = useDossierStore((s) => s.pinDossier)
  const unpinDossier = useDossierStore((s) => s.unpinDossier)
  const togglePinned = useDossierStore((s) => s.togglePinned)
  const isPinned = useDossierStore((s) => s.isPinned)

  const value: DossierCollectionContextValue = useMemo(
    () => ({
      recentDossiers,
      pinnedDossiers,
      addToRecentDossiers,
      pinDossier,
      unpinDossier,
      togglePinned,
      isPinned,
    }),
    [
      recentDossiers,
      pinnedDossiers,
      addToRecentDossiers,
      pinDossier,
      unpinDossier,
      togglePinned,
      isPinned,
    ],
  )

  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>
}

// ============================================================================
// Hook
// ============================================================================

export function useDossierCollection(): DossierCollectionContextValue {
  const context = useContext(CollectionContext)
  if (!context) {
    throw new Error('useDossierCollection must be used within a DossierCollectionProvider')
  }
  return context
}

export function useDossierCollectionSafe(): DossierCollectionContextValue | null {
  return useContext(CollectionContext)
}
