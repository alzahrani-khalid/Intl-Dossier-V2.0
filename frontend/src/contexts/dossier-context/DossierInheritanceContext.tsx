/**
 * DossierInheritanceContext
 *
 * Manages dossier context resolution and inheritance logic.
 * Handles URL-based auto-resolution of dossier context from route params,
 * entity relationships, and the Zustand store's resolution functions.
 * This is derived/computed state that bridges navigation and store.
 */

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useSearch, useLocation } from '@tanstack/react-router'
import type { ContextEntityType } from '@/types/dossier-context.types'
import { useDossierStore, type DossierEntry, type InheritanceContext } from '@/store/dossierStore'
import { useCreationContext } from '@/components/work-creation/hooks/useCreationContext'
import { useDossierNavigation } from './DossierNavigationContext'

// ============================================================================
// Types
// ============================================================================

export interface DossierInheritanceContextValue {
  /** Store-backed active dossier (persisted) */
  activeDossier: DossierEntry | null
  /** How the active dossier was resolved */
  activeInheritance: InheritanceContext | null
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
  /** Set the active dossier scope */
  setActiveDossier: (dossier: DossierEntry | null) => void
}

// ============================================================================
// Context
// ============================================================================

const InheritanceCtx = createContext<DossierInheritanceContextValue | null>(null)

// ============================================================================
// Provider
// ============================================================================

export interface DossierInheritanceProviderProps {
  children: ReactNode
  autoResolve?: boolean
}

export function DossierInheritanceProvider({
  children,
  autoResolve = true,
}: DossierInheritanceProviderProps): ReactNode {
  const { actions } = useDossierNavigation()
  const creationContext = useCreationContext()
  const location = useLocation()

  const activeDossier = useDossierStore((s) => s.activeDossier)
  const activeInheritance = useDossierStore((s) => s.activeInheritance)
  const storeSetActiveDossier = useDossierStore((s) => s.setActiveDossier)
  const resolveContextFromUrl = useDossierStore((s) => s.resolveContextFromUrl)
  const inheritContextFromParent = useDossierStore((s) => s.inheritContextFromParent)

  // Get dossier_id from URL search params
  const search = useSearch({ strict: false }) as { dossier_id?: string } | undefined
  const urlDossierId = search?.dossier_id

  // ============================================================================
  // Auto-resolve from URL/route context
  // ============================================================================

  useEffect(() => {
    if (!autoResolve) return

    const pathname = location.pathname
    const resolved = resolveContextFromUrl(pathname, { dossier_id: urlDossierId ?? '' })

    // Priority 1: Direct dossier from URL search param
    if (urlDossierId !== undefined || resolved.dossierId !== null) {
      actions.setInheritanceSource('direct')
      return
    }

    // Priority 2: Dossier from route (e.g., /dossiers/:dossierId)
    if (creationContext.dossierId !== undefined) {
      actions.setInheritanceSource('direct')
      return
    }

    // Priority 3: Engagement route - needs resolution
    if (creationContext.engagementId !== undefined) {
      actions.setInheritanceSource('engagement')
      actions.setInheritedFrom({ type: 'engagement', id: creationContext.engagementId })
      return
    }

    // Priority 4: After-action route - needs chain resolution
    if (creationContext.afterActionId !== undefined) {
      actions.setInheritanceSource('after_action')
      actions.setInheritedFrom({ type: 'after_action', id: creationContext.afterActionId })
      return
    }

    // Priority 5: Position route - needs resolution
    if (creationContext.positionId !== undefined) {
      actions.setInheritanceSource('position')
      actions.setInheritedFrom({ type: 'position', id: creationContext.positionId })
      return
    }

    // No context available - require manual selection
    actions.setRequiresSelection(true)

    return (): void => {
      actions.reset()
    }
  }, [
    autoResolve,
    urlDossierId,
    creationContext.dossierId,
    creationContext.engagementId,
    creationContext.afterActionId,
    creationContext.positionId,
    location.pathname,
    resolveContextFromUrl,
    actions,
  ])

  const value: DossierInheritanceContextValue = useMemo(
    () => ({
      activeDossier,
      activeInheritance,
      resolveContextFromUrl,
      inheritContextFromParent,
      setActiveDossier: storeSetActiveDossier,
    }),
    [
      activeDossier,
      activeInheritance,
      resolveContextFromUrl,
      inheritContextFromParent,
      storeSetActiveDossier,
    ],
  )

  return <InheritanceCtx.Provider value={value}>{children}</InheritanceCtx.Provider>
}

// ============================================================================
// Hook
// ============================================================================

export function useDossierInheritance(): DossierInheritanceContextValue {
  const context = useContext(InheritanceCtx)
  if (!context) {
    throw new Error('useDossierInheritance must be used within a DossierInheritanceProvider')
  }
  return context
}

export function useDossierInheritanceSafe(): DossierInheritanceContextValue | null {
  return useContext(InheritanceCtx)
}
