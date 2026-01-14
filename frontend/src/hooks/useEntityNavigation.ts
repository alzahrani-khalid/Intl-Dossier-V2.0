/**
 * useEntityNavigation Hook
 *
 * Hook for tracking entity navigation in detail pages.
 * Automatically adds entities to the breadcrumb trail history.
 */

import { useEffect, useRef } from 'react'
import {
  useEntityHistoryStore,
  type EntityType,
  type EntityHistoryEntry,
  createDossierHistoryEntry,
  createPersonHistoryEntry,
  createEngagementHistoryEntry,
  createPositionHistoryEntry,
} from '@/store/entityHistoryStore'

interface UseEntityNavigationOptions {
  /** Skip tracking this entity (e.g., when loading) */
  skip?: boolean
}

/**
 * Hook to track a dossier entity in navigation history
 */
export function useDossierNavigation(
  id: string | undefined,
  dossier:
    | { name_en?: string; name_ar?: string; dossier_type?: string; type?: string }
    | null
    | undefined,
  options?: UseEntityNavigationOptions,
) {
  const { addEntity } = useEntityHistoryStore()
  const hasTracked = useRef(false)

  useEffect(() => {
    // Skip if no ID, no dossier data, explicitly skipped, or already tracked
    if (!id || !dossier || options?.skip || hasTracked.current) {
      return
    }

    // Track this entity
    const entry = createDossierHistoryEntry(id, dossier)
    addEntity(entry)
    hasTracked.current = true
  }, [id, dossier, options?.skip, addEntity])

  // Reset tracking when ID changes
  useEffect(() => {
    hasTracked.current = false
  }, [id])
}

/**
 * Hook to track a person entity in navigation history
 */
export function usePersonNavigation(
  id: string | undefined,
  person: { name_en?: string; name_ar?: string } | null | undefined,
  options?: UseEntityNavigationOptions,
) {
  const { addEntity } = useEntityHistoryStore()
  const hasTracked = useRef(false)

  useEffect(() => {
    if (!id || !person || options?.skip || hasTracked.current) {
      return
    }

    const entry = createPersonHistoryEntry(id, person)
    addEntity(entry)
    hasTracked.current = true
  }, [id, person, options?.skip, addEntity])

  useEffect(() => {
    hasTracked.current = false
  }, [id])
}

/**
 * Hook to track an engagement entity in navigation history
 */
export function useEngagementNavigation(
  id: string | undefined,
  engagement: { name_en?: string; name_ar?: string; engagement_type?: string } | null | undefined,
  options?: UseEntityNavigationOptions,
) {
  const { addEntity } = useEntityHistoryStore()
  const hasTracked = useRef(false)

  useEffect(() => {
    if (!id || !engagement || options?.skip || hasTracked.current) {
      return
    }

    const entry = createEngagementHistoryEntry(id, engagement)
    addEntity(entry)
    hasTracked.current = true
  }, [id, engagement, options?.skip, addEntity])

  useEffect(() => {
    hasTracked.current = false
  }, [id])
}

/**
 * Hook to track a position entity in navigation history
 */
export function usePositionNavigation(
  id: string | undefined,
  position: { title_en?: string; title_ar?: string; position_type?: string } | null | undefined,
  options?: UseEntityNavigationOptions,
) {
  const { addEntity } = useEntityHistoryStore()
  const hasTracked = useRef(false)

  useEffect(() => {
    if (!id || !position || options?.skip || hasTracked.current) {
      return
    }

    const entry = createPositionHistoryEntry(id, position)
    addEntity(entry)
    hasTracked.current = true
  }, [id, position, options?.skip, addEntity])

  useEffect(() => {
    hasTracked.current = false
  }, [id])
}

/**
 * Generic hook to track any entity in navigation history
 */
export function useEntityNavigation(
  id: string | undefined,
  entityData:
    | {
        name_en?: string
        name_ar?: string
        type: EntityType
        route: string
        subType?: string
      }
    | null
    | undefined,
  options?: UseEntityNavigationOptions,
) {
  const { addEntity } = useEntityHistoryStore()
  const hasTracked = useRef(false)

  useEffect(() => {
    if (!id || !entityData || options?.skip || hasTracked.current) {
      return
    }

    const entry: Omit<EntityHistoryEntry, 'timestamp'> = {
      id,
      type: entityData.type,
      name_en: entityData.name_en || 'Unknown',
      name_ar: entityData.name_ar || entityData.name_en || 'غير معروف',
      route: entityData.route,
      subType: entityData.subType,
    }

    addEntity(entry)
    hasTracked.current = true
  }, [id, entityData, options?.skip, addEntity])

  useEffect(() => {
    hasTracked.current = false
  }, [id])
}

/**
 * Hook to get entity history data
 */
export function useEntityHistory(count?: number) {
  const { history, getRecentEntities, clearHistory, removeEntity } = useEntityHistoryStore()

  return {
    history,
    recentEntities: getRecentEntities(count),
    clearHistory,
    removeEntity,
    isEmpty: history.length === 0,
    count: history.length,
  }
}
