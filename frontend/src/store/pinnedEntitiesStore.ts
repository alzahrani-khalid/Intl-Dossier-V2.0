/**
 * Pinned Entities Store
 *
 * Zustand store for managing user-pinned entities for quick navigation.
 * Persists pinned entities to localStorage for cross-session access.
 * Mobile-first, RTL-compatible.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EntityType } from './entityHistoryStore'

/** Pinned entity entry */
export interface PinnedEntityEntry {
  /** Unique entity ID */
  id: string
  /** Entity type for routing and icon display */
  type: EntityType
  /** Display name in English */
  name_en: string
  /** Display name in Arabic */
  name_ar: string
  /** Route path for navigation */
  route: string
  /** Timestamp when entity was pinned */
  pinnedAt: number
  /** Optional sub-type for dossiers (Country, Organization, etc.) */
  subType?: string
  /** User-defined color for visual grouping */
  color?: 'default' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple'
}

interface PinnedEntitiesState {
  /** Maximum number of pinned entities */
  maxPinned: number
  /** List of pinned entities (ordered by pinnedAt) */
  pinned: PinnedEntityEntry[]

  /** Pin an entity */
  pinEntity: (entity: Omit<PinnedEntityEntry, 'pinnedAt'>) => boolean
  /** Unpin an entity by ID */
  unpinEntity: (id: string) => void
  /** Check if an entity is pinned */
  isPinned: (id: string) => boolean
  /** Toggle pinned status */
  togglePinned: (entity: Omit<PinnedEntityEntry, 'pinnedAt'>) => boolean
  /** Reorder pinned entities */
  reorderPinned: (fromIndex: number, toIndex: number) => void
  /** Update pinned entity color */
  updatePinnedColor: (id: string, color: PinnedEntityEntry['color']) => void
  /** Clear all pinned entities */
  clearPinned: () => void
  /** Get pinned entities by type */
  getPinnedByType: (type: EntityType) => PinnedEntityEntry[]
}

/** Default max pinned items */
const DEFAULT_MAX_PINNED = 10

export const usePinnedEntitiesStore = create<PinnedEntitiesState>()(
  persist(
    (set, get) => ({
      maxPinned: DEFAULT_MAX_PINNED,
      pinned: [],

      pinEntity: (entity) => {
        const state = get()

        // Check if already pinned
        if (state.pinned.some((p) => p.id === entity.id)) {
          return false
        }

        // Check if max limit reached
        if (state.pinned.length >= state.maxPinned) {
          return false
        }

        set((state) => ({
          pinned: [...state.pinned, { ...entity, pinnedAt: Date.now() }],
        }))

        return true
      },

      unpinEntity: (id) => {
        set((state) => ({
          pinned: state.pinned.filter((p) => p.id !== id),
        }))
      },

      isPinned: (id) => {
        return get().pinned.some((p) => p.id === id)
      },

      togglePinned: (entity) => {
        const state = get()
        const isPinned = state.pinned.some((p) => p.id === entity.id)

        if (isPinned) {
          state.unpinEntity(entity.id)
          return false
        } else {
          return state.pinEntity(entity)
        }
      },

      reorderPinned: (fromIndex, toIndex) => {
        set((state) => {
          const newPinned = [...state.pinned]
          const [removed] = newPinned.splice(fromIndex, 1)
          newPinned.splice(toIndex, 0, removed)
          return { pinned: newPinned }
        })
      },

      updatePinnedColor: (id, color) => {
        set((state) => ({
          pinned: state.pinned.map((p) => (p.id === id ? { ...p, color } : p)),
        }))
      },

      clearPinned: () => {
        set({ pinned: [] })
      },

      getPinnedByType: (type) => {
        return get().pinned.filter((p) => p.type === type)
      },
    }),
    {
      name: 'pinned-entities-storage',
      partialize: (state) => ({
        pinned: state.pinned,
        maxPinned: state.maxPinned,
      }),
    },
  ),
)

/**
 * Helper to get pinned entity color class
 */
export function getPinnedColorClass(color: PinnedEntityEntry['color']): string {
  const colorMap: Record<NonNullable<PinnedEntityEntry['color']>, string> = {
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
