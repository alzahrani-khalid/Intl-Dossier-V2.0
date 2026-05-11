/**
 * useEntityNavigation Hook
 *
 * Hook for tracking entity navigation in detail pages.
 * Automatically adds entities to the breadcrumb trail history.
 */

import { useEffect, useRef } from 'react'
import {
  useEntityHistoryStore,
  createPersonHistoryEntry,
  createEngagementHistoryEntry,
  createPositionHistoryEntry,
} from '@/store/entityHistoryStore'

interface UseEntityNavigationOptions {
  /** Skip tracking this entity (e.g., when loading) */
  skip?: boolean
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
