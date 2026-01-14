/**
 * Entity History Store
 *
 * Zustand store for tracking recently viewed entities.
 * Persists the last 10 entities viewed for quick navigation.
 * Mobile-first, RTL-compatible.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Supported entity types for breadcrumb tracking */
export type EntityType =
  | 'dossier'
  | 'country'
  | 'organization'
  | 'person'
  | 'engagement'
  | 'position'
  | 'forum'
  | 'working_group'
  | 'topic'

/** Entity entry in the history trail */
export interface EntityHistoryEntry {
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
  /** Timestamp when entity was viewed */
  timestamp: number
  /** Optional sub-type for dossiers (Country, Organization, etc.) */
  subType?: string
}

interface EntityHistoryState {
  /** Maximum number of entities to store */
  maxItems: number
  /** List of recently viewed entities (newest first) */
  history: EntityHistoryEntry[]

  /** Add an entity to the history trail */
  addEntity: (entity: Omit<EntityHistoryEntry, 'timestamp'>) => void
  /** Remove an entity from history by ID */
  removeEntity: (id: string) => void
  /** Clear all history */
  clearHistory: () => void
  /** Get the most recent N entities */
  getRecentEntities: (count?: number) => EntityHistoryEntry[]
  /** Check if an entity is in history */
  hasEntity: (id: string) => boolean
  /** Set maximum items to store */
  setMaxItems: (count: number) => void
}

/** Default max items to keep in history */
const DEFAULT_MAX_ITEMS = 10

export const useEntityHistoryStore = create<EntityHistoryState>()(
  persist(
    (set, get) => ({
      maxItems: DEFAULT_MAX_ITEMS,
      history: [],

      addEntity: (entity) => {
        set((state) => {
          const timestamp = Date.now()

          // Remove existing entry with same ID (prevents duplicates)
          const filteredHistory = state.history.filter((e) => e.id !== entity.id)

          // Add new entry at the beginning
          const newHistory = [{ ...entity, timestamp }, ...filteredHistory].slice(0, state.maxItems) // Limit to maxItems

          return { history: newHistory }
        })
      },

      removeEntity: (id) => {
        set((state) => ({
          history: state.history.filter((e) => e.id !== id),
        }))
      },

      clearHistory: () => {
        set({ history: [] })
      },

      getRecentEntities: (count) => {
        const { history, maxItems } = get()
        const limit = count ?? maxItems
        return history.slice(0, limit)
      },

      hasEntity: (id) => {
        return get().history.some((e) => e.id === id)
      },

      setMaxItems: (count) => {
        set((state) => ({
          maxItems: count,
          // Trim history if needed
          history: state.history.slice(0, count),
        }))
      },
    }),
    {
      name: 'entity-history-storage',
      // Only persist history and maxItems
      partialize: (state) => ({
        history: state.history,
        maxItems: state.maxItems,
      }),
    },
  ),
)

/**
 * Helper to create an entity history entry from dossier data
 */
export function createDossierHistoryEntry(
  id: string,
  dossier: {
    name_en?: string
    name_ar?: string
    dossier_type?: string
    type?: string
  },
): Omit<EntityHistoryEntry, 'timestamp'> {
  const dossierType = dossier.dossier_type || dossier.type || 'dossier'

  // Map dossier types to entity types
  const typeMap: Record<string, EntityType> = {
    Country: 'country',
    Organization: 'organization',
    Person: 'person',
    Engagement: 'engagement',
    Forum: 'forum',
    WorkingGroup: 'working_group',
    Topic: 'topic',
  }

  const entityType = typeMap[dossierType] || 'dossier'

  return {
    id,
    type: entityType,
    name_en: dossier.name_en || 'Unknown',
    name_ar: dossier.name_ar || dossier.name_en || 'غير معروف',
    route: `/dossiers/${id}`,
    subType: dossierType,
  }
}

/**
 * Helper to create an entity history entry from person data
 */
export function createPersonHistoryEntry(
  id: string,
  person: {
    name_en?: string
    name_ar?: string
  },
): Omit<EntityHistoryEntry, 'timestamp'> {
  return {
    id,
    type: 'person',
    name_en: person.name_en || 'Unknown',
    name_ar: person.name_ar || person.name_en || 'غير معروف',
    route: `/persons/${id}`,
  }
}

/**
 * Helper to create an entity history entry from engagement data
 */
export function createEngagementHistoryEntry(
  id: string,
  engagement: {
    name_en?: string
    name_ar?: string
    engagement_type?: string
  },
): Omit<EntityHistoryEntry, 'timestamp'> {
  return {
    id,
    type: 'engagement',
    name_en: engagement.name_en || 'Unknown',
    name_ar: engagement.name_ar || engagement.name_en || 'غير معروف',
    route: `/engagements/${id}`,
    subType: engagement.engagement_type,
  }
}

/**
 * Helper to create an entity history entry from position data
 */
export function createPositionHistoryEntry(
  id: string,
  position: {
    title_en?: string
    title_ar?: string
    position_type?: string
  },
): Omit<EntityHistoryEntry, 'timestamp'> {
  return {
    id,
    type: 'position',
    name_en: position.title_en || 'Unknown',
    name_ar: position.title_ar || position.title_en || 'غير معروف',
    route: `/positions/${id}`,
    subType: position.position_type,
  }
}
