/**
 * Dossier Store
 * Feature: 035-dossier-context (Smart Dossier Context Inheritance)
 *
 * Zustand store for enhanced dossier state management.
 * Provides:
 * - activeDossier: Current dossier scope
 * - recentDossiers: Last 10 viewed dossiers
 * - pinnedDossiers: User's pinned favorites
 * - Smart context resolution from URL and parent entities
 *
 * Persists pinned dossiers and recent history to localStorage.
 */

import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'
import type {
  DossierReference,
  DossierType,
  DossierStatus,
  InheritanceSource,
  ContextEntityType,
  ResolvedDossierContext,
} from '@/types/dossier-context.types'

// =============================================================================
// Types
// =============================================================================

/**
 * Extended dossier reference with additional metadata
 */
export interface DossierEntry extends DossierReference {
  /** Timestamp when dossier was viewed */
  viewedAt?: number
  /** Timestamp when dossier was pinned */
  pinnedAt?: number
  /** User-defined color for visual grouping */
  color?: 'default' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple'
  /** Route path for navigation */
  route?: string
}

/**
 * Inheritance context for resolved dossiers
 */
export interface InheritanceContext {
  source: InheritanceSource
  fromType?: ContextEntityType
  fromId?: string
  fromName?: string
}

/**
 * Dossier store state
 */
export interface DossierStoreState {
  // ============================================================================
  // Active Dossier State
  // ============================================================================
  /** Currently active/focused dossier */
  activeDossier: DossierEntry | null
  /** How the active dossier was resolved */
  activeInheritance: InheritanceContext | null
  /** Whether context resolution is in progress */
  isResolving: boolean
  /** Error from context resolution */
  resolutionError: string | null

  // ============================================================================
  // Recent Dossiers (History)
  // ============================================================================
  /** Maximum recent dossiers to store */
  maxRecentDossiers: number
  /** List of recently viewed dossiers (newest first) */
  recentDossiers: DossierEntry[]

  // ============================================================================
  // Pinned Dossiers (Favorites)
  // ============================================================================
  /** Maximum pinned dossiers */
  maxPinnedDossiers: number
  /** List of user-pinned dossiers */
  pinnedDossiers: DossierEntry[]

  // ============================================================================
  // Context Resolution State
  // ============================================================================
  /** Resolved dossiers from entity relationships */
  resolvedDossiers: ResolvedDossierContext[]
  /** Entity the context was resolved from */
  resolvedFrom: { type: ContextEntityType; id: string } | null
}

/**
 * Dossier store actions
 */
export interface DossierStoreActions {
  // ============================================================================
  // Active Dossier Actions
  // ============================================================================
  /** Set the active dossier */
  setActiveDossier: (dossier: DossierEntry | null, inheritance?: InheritanceContext) => void
  /** Clear the active dossier */
  clearActiveDossier: () => void

  // ============================================================================
  // Recent Dossiers Actions
  // ============================================================================
  /** Add a dossier to recent history */
  addToRecentDossiers: (dossier: DossierEntry) => void
  /** Remove a dossier from recent history */
  removeFromRecentDossiers: (dossierId: string) => void
  /** Clear all recent dossiers */
  clearRecentDossiers: () => void
  /** Get recent dossiers with optional limit */
  getRecentDossiers: (limit?: number) => DossierEntry[]

  // ============================================================================
  // Pinned Dossiers Actions
  // ============================================================================
  /** Pin a dossier */
  pinDossier: (dossier: DossierEntry) => boolean
  /** Unpin a dossier */
  unpinDossier: (dossierId: string) => void
  /** Toggle pinned status */
  togglePinned: (dossier: DossierEntry) => boolean
  /** Check if a dossier is pinned */
  isPinned: (dossierId: string) => boolean
  /** Reorder pinned dossiers */
  reorderPinnedDossiers: (fromIndex: number, toIndex: number) => void
  /** Update pinned dossier color */
  updatePinnedDossierColor: (dossierId: string, color: DossierEntry['color']) => void
  /** Clear all pinned dossiers */
  clearPinnedDossiers: () => void
  /** Get pinned dossiers by type */
  getPinnedDossiersByType: (type: DossierType) => DossierEntry[]

  // ============================================================================
  // Context Resolution Actions
  // ============================================================================
  /** Resolve context from URL parameters */
  resolveContextFromUrl: (
    pathname: string,
    searchParams?: Record<string, string>,
  ) => {
    entityType: ContextEntityType | null
    entityId: string | null
    dossierId: string | null
  }
  /** Inherit context from a parent entity */
  inheritContextFromParent: (
    parentType: ContextEntityType,
    parentId: string,
  ) => Promise<DossierEntry[]>
  /** Set resolved context from API response */
  setResolvedContext: (
    dossiers: ResolvedDossierContext[],
    fromType: ContextEntityType,
    fromId: string,
  ) => void
  /** Set resolution loading state */
  setIsResolving: (isResolving: boolean) => void
  /** Set resolution error */
  setResolutionError: (error: string | null) => void
  /** Clear resolved context */
  clearResolvedContext: () => void

  // ============================================================================
  // Utility Actions
  // ============================================================================
  /** Reset entire store to initial state */
  resetStore: () => void
}

/**
 * Full store type
 */
export type DossierStore = DossierStoreState & DossierStoreActions

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_MAX_RECENT = 10
const DEFAULT_MAX_PINNED = 10

const initialState: DossierStoreState = {
  // Active dossier
  activeDossier: null,
  activeInheritance: null,
  isResolving: false,
  resolutionError: null,

  // Recent dossiers
  maxRecentDossiers: DEFAULT_MAX_RECENT,
  recentDossiers: [],

  // Pinned dossiers
  maxPinnedDossiers: DEFAULT_MAX_PINNED,
  pinnedDossiers: [],

  // Context resolution
  resolvedDossiers: [],
  resolvedFrom: null,
}

// =============================================================================
// URL Pattern Matching for Context Resolution
// =============================================================================

const URL_PATTERNS = {
  dossier: /\/dossiers\/([a-f0-9-]+)/i,
  country: /\/dossiers\/countries\/([a-f0-9-]+)/i,
  organization: /\/dossiers\/organizations\/([a-f0-9-]+)/i,
  forum: /\/dossiers\/forums\/([a-f0-9-]+)/i,
  topic: /\/dossiers\/topics\/([a-f0-9-]+)/i,
  engagement: /\/engagements\/([a-f0-9-]+)/i,
  after_action: /\/after-actions\/([a-f0-9-]+)/i,
  position: /\/positions\/([a-f0-9-]+)/i,
}

// =============================================================================
// Store Implementation
// =============================================================================

export const useDossierStore = create<DossierStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...initialState,

        // ========================================================================
        // Active Dossier Actions
        // ========================================================================

        setActiveDossier: (dossier, inheritance) => {
          set({
            activeDossier: dossier,
            activeInheritance: inheritance || {
              source: 'direct',
            },
          })

          // Also add to recent if not null
          if (dossier) {
            get().addToRecentDossiers(dossier)
          }
        },

        clearActiveDossier: () => {
          set({
            activeDossier: null,
            activeInheritance: null,
          })
        },

        // ========================================================================
        // Recent Dossiers Actions
        // ========================================================================

        addToRecentDossiers: (dossier) => {
          set((state) => {
            // Remove existing entry (prevent duplicates)
            const filtered = state.recentDossiers.filter((d) => d.id !== dossier.id)

            // Add at beginning with timestamp
            const newEntry: DossierEntry = {
              ...dossier,
              viewedAt: Date.now(),
            }

            // Limit to maxRecentDossiers
            const newRecent = [newEntry, ...filtered].slice(0, state.maxRecentDossiers)

            return { recentDossiers: newRecent }
          })
        },

        removeFromRecentDossiers: (dossierId) => {
          set((state) => ({
            recentDossiers: state.recentDossiers.filter((d) => d.id !== dossierId),
          }))
        },

        clearRecentDossiers: () => {
          set({ recentDossiers: [] })
        },

        getRecentDossiers: (limit) => {
          const state = get()
          const effectiveLimit = limit ?? state.maxRecentDossiers
          return state.recentDossiers.slice(0, effectiveLimit)
        },

        // ========================================================================
        // Pinned Dossiers Actions
        // ========================================================================

        pinDossier: (dossier) => {
          const state = get()

          // Check if already pinned
          if (state.pinnedDossiers.some((d) => d.id === dossier.id)) {
            return false
          }

          // Check max limit
          if (state.pinnedDossiers.length >= state.maxPinnedDossiers) {
            return false
          }

          set((state) => ({
            pinnedDossiers: [...state.pinnedDossiers, { ...dossier, pinnedAt: Date.now() }],
          }))

          return true
        },

        unpinDossier: (dossierId) => {
          set((state) => ({
            pinnedDossiers: state.pinnedDossiers.filter((d) => d.id !== dossierId),
          }))
        },

        togglePinned: (dossier) => {
          const state = get()
          const isPinned = state.pinnedDossiers.some((d) => d.id === dossier.id)

          if (isPinned) {
            state.unpinDossier(dossier.id)
            return false
          } else {
            return state.pinDossier(dossier)
          }
        },

        isPinned: (dossierId) => {
          return get().pinnedDossiers.some((d) => d.id === dossierId)
        },

        reorderPinnedDossiers: (fromIndex, toIndex) => {
          set((state) => {
            const newPinned = [...state.pinnedDossiers]
            const [removed] = newPinned.splice(fromIndex, 1)
            if (removed) {
              newPinned.splice(toIndex, 0, removed)
            }
            return { pinnedDossiers: newPinned }
          })
        },

        updatePinnedDossierColor: (dossierId, color) => {
          set((state) => ({
            pinnedDossiers: state.pinnedDossiers.map((d) =>
              d.id === dossierId ? { ...d, color } : d,
            ),
          }))
        },

        clearPinnedDossiers: () => {
          set({ pinnedDossiers: [] })
        },

        getPinnedDossiersByType: (type) => {
          return get().pinnedDossiers.filter((d) => d.type === type)
        },

        // ========================================================================
        // Context Resolution Actions
        // ========================================================================

        resolveContextFromUrl: (pathname, searchParams) => {
          // Check for explicit dossier_id in search params
          const explicitDossierId = searchParams?.dossier_id
          if (explicitDossierId) {
            return {
              entityType: 'dossier' as ContextEntityType,
              entityId: explicitDossierId,
              dossierId: explicitDossierId,
            }
          }

          // Try to match URL patterns
          for (const [key, pattern] of Object.entries(URL_PATTERNS)) {
            const match = pathname.match(pattern)
            if (match && match[1]) {
              const entityId = match[1]

              // Determine entity type and dossier ID
              if (
                key === 'dossier' ||
                key === 'country' ||
                key === 'organization' ||
                key === 'forum' ||
                key === 'topic'
              ) {
                return {
                  entityType: 'dossier' as ContextEntityType,
                  entityId,
                  dossierId: entityId,
                }
              }

              // For engagement, after_action, position - need resolution
              return {
                entityType: key as ContextEntityType,
                entityId,
                dossierId: null, // Needs resolution from parent
              }
            }
          }

          // No context found
          return {
            entityType: null,
            entityId: null,
            dossierId: null,
          }
        },

        inheritContextFromParent: async (parentType, parentId) => {
          const state = get()

          // Set loading state
          set({ isResolving: true, resolutionError: null })

          try {
            // This would typically call the resolve-dossier-context Edge Function
            // For now, we'll set up the structure and let the hook handle the actual API call
            // The hook will call setResolvedContext after fetching

            // Return empty array - actual resolution happens via useResolveDossierContext hook
            return []
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Failed to resolve context'
            set({ resolutionError: errorMessage, isResolving: false })
            return []
          }
        },

        setResolvedContext: (dossiers, fromType, fromId) => {
          // Convert resolved dossiers to DossierEntry format
          const entries: DossierEntry[] = dossiers.map((d) => ({
            id: d.dossier_id,
            name_en: d.dossier_name_en,
            name_ar: d.dossier_name_ar,
            type: d.dossier_type as DossierType,
            status: d.dossier_status as DossierStatus,
          }))

          // Set first as active if we have results
          const firstDossier = entries[0] || null
          const inheritance: InheritanceContext | null =
            firstDossier && dossiers[0]
              ? {
                  source: dossiers[0].inheritance_source,
                  fromType,
                  fromId,
                }
              : null

          set({
            resolvedDossiers: dossiers,
            resolvedFrom: { type: fromType, id: fromId },
            activeDossier: firstDossier,
            activeInheritance: inheritance,
            isResolving: false,
            resolutionError: null,
          })

          // Add to recent
          if (firstDossier) {
            get().addToRecentDossiers(firstDossier)
          }
        },

        setIsResolving: (isResolving) => {
          set({ isResolving })
        },

        setResolutionError: (error) => {
          set({ resolutionError: error, isResolving: false })
        },

        clearResolvedContext: () => {
          set({
            resolvedDossiers: [],
            resolvedFrom: null,
          })
        },

        // ========================================================================
        // Utility Actions
        // ========================================================================

        resetStore: () => {
          set(initialState)
        },
      }),
      {
        name: 'dossier-store',
        // Only persist recent and pinned dossiers, not active state
        partialize: (state) => ({
          recentDossiers: state.recentDossiers,
          pinnedDossiers: state.pinnedDossiers,
          maxRecentDossiers: state.maxRecentDossiers,
          maxPinnedDossiers: state.maxPinnedDossiers,
        }),
      },
    ),
  ),
)

// =============================================================================
// Selector Hooks for Common Use Cases
// =============================================================================

/**
 * Hook for active dossier state
 */
export function useActiveDossier() {
  return useDossierStore((state) => ({
    dossier: state.activeDossier,
    inheritance: state.activeInheritance,
    isResolving: state.isResolving,
    error: state.resolutionError,
    setActiveDossier: state.setActiveDossier,
    clearActiveDossier: state.clearActiveDossier,
  }))
}

/**
 * Hook for recent dossiers
 */
export function useRecentDossiers(limit?: number) {
  const store = useDossierStore((state) => ({
    recentDossiers: limit ? state.recentDossiers.slice(0, limit) : state.recentDossiers,
    addToRecentDossiers: state.addToRecentDossiers,
    removeFromRecentDossiers: state.removeFromRecentDossiers,
    clearRecentDossiers: state.clearRecentDossiers,
  }))
  return store
}

/**
 * Hook for pinned dossiers
 */
export function usePinnedDossiers() {
  return useDossierStore((state) => ({
    pinnedDossiers: state.pinnedDossiers,
    pinDossier: state.pinDossier,
    unpinDossier: state.unpinDossier,
    togglePinned: state.togglePinned,
    isPinned: state.isPinned,
    reorderPinnedDossiers: state.reorderPinnedDossiers,
    updatePinnedDossierColor: state.updatePinnedDossierColor,
    clearPinnedDossiers: state.clearPinnedDossiers,
    getPinnedDossiersByType: state.getPinnedDossiersByType,
  }))
}

/**
 * Hook for context resolution
 */
export function useDossierContextResolution() {
  return useDossierStore((state) => ({
    resolvedDossiers: state.resolvedDossiers,
    resolvedFrom: state.resolvedFrom,
    isResolving: state.isResolving,
    error: state.resolutionError,
    resolveContextFromUrl: state.resolveContextFromUrl,
    inheritContextFromParent: state.inheritContextFromParent,
    setResolvedContext: state.setResolvedContext,
    setIsResolving: state.setIsResolving,
    setResolutionError: state.setResolutionError,
    clearResolvedContext: state.clearResolvedContext,
  }))
}

/**
 * Helper to get dossier route based on type
 */
export function getDossierRoute(dossier: DossierEntry): string {
  if (dossier.route) return dossier.route

  const typeRouteMap: Record<DossierType, string> = {
    country: 'countries',
    organization: 'organizations',
    forum: 'forums',
    theme: 'topics',
  }

  const segment = typeRouteMap[dossier.type] || 'countries'
  return `/dossiers/${segment}/${dossier.id}`
}

/**
 * Helper to get color class for pinned dossier
 */
export function getDossierColorClass(color: DossierEntry['color']): string {
  const colorMap: Record<NonNullable<DossierEntry['color']>, string> = {
    default: 'bg-muted text-muted-foreground',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
    yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  }
  return colorMap[color || 'default']
}

export default useDossierStore
