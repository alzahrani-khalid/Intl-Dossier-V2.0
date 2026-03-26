/**
 * useQuickSwitcherSearch Hook (Domain)
 * Feature: global-search-quickswitcher
 *
 * Custom TanStack Query hook for the QuickSwitcher (Cmd+K) typeahead search.
 * Delegates API calls to dossiers.repository.
 */

import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import * as dossiersRepo from '../repositories/dossiers.repository'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { DossierType } from '@/lib/dossier-type-guards'
import { getDossierDetailPath } from '@/lib/dossier-routes'

// Maximum recent items to store
const MAX_RECENT_ITEMS = 10
const RECENT_ITEMS_KEY = 'quickswitcher_recent_items'

/**
 * Dossier search result
 */
export interface QuickSwitcherDossier {
  id: string
  type: DossierType
  name_en: string
  name_ar: string
  description_en?: string
  description_ar?: string
  status: 'active' | 'archived'
  relevance_score: number
  matched_field: string
  updated_at: string
  stats?: {
    total_engagements: number
    total_documents: number
    total_positions: number
  }
}

/**
 * Related work item types
 */
export type WorkItemType = 'position' | 'task' | 'commitment' | 'intake' | 'mou' | 'document'

/**
 * Related work search result
 */
export interface QuickSwitcherWorkItem {
  id: string
  type: WorkItemType
  title_en: string
  title_ar: string
  description_en?: string
  description_ar?: string
  status?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  relevance_score: number
  matched_field: string
  updated_at: string
  deadline?: string
  dossier_context?: {
    id: string
    type: DossierType
    name_en: string
    name_ar: string
  }
}

/**
 * Recent item stored in localStorage
 */
export interface RecentItem {
  id: string
  type: 'dossier' | WorkItemType
  dossierType?: DossierType
  title_en: string
  title_ar: string
  url: string
  visitedAt: string
}

/**
 * Get URL for a work item
 */
function getWorkItemUrl(item: QuickSwitcherWorkItem): string {
  switch (item.type) {
    case 'position':
      return `/positions/${item.id}`
    case 'task':
      return `/tasks/${item.id}`
    case 'commitment':
      return `/commitments/${item.id}`
    case 'intake':
      return `/intake/${item.id}`
    case 'mou':
      return `/mous/${item.id}`
    case 'document':
      return `/documents/${item.id}`
    default:
      return '#'
  }
}

/**
 * useQuickSwitcherSearch hook
 *
 * @param options - Hook configuration options
 * @returns Search state and methods
 */
export function useQuickSwitcherSearch(
  options: {
    debounceMs?: number
    limit?: number
    enabled?: boolean
  } = {},
) {
  const { debounceMs = 300, limit = 20, enabled = true } = options
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  // State
  const [query, setQuery] = useState('')
  const [recentItems, setRecentItems] = useState<RecentItem[]>([])

  // Debounced query
  const debouncedQuery = useDebouncedValue(query, debounceMs)

  // Load recent items from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_ITEMS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as RecentItem[]
        setRecentItems(parsed.slice(0, MAX_RECENT_ITEMS))
      }
    } catch (e) {
      console.error('Failed to load recent items:', e)
    }
  }, [])

  // TanStack Query for search — uses repository
  const searchQuery = useQuery({
    queryKey: ['quickswitcher-search', debouncedQuery, limit],
    queryFn: () => dossiersRepo.getQuickSwitcherSearch(debouncedQuery, limit),
    enabled: enabled && debouncedQuery.trim().length >= 2,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    placeholderData: (previousData) => previousData,
  })

  // Add item to recent items
  const addToRecentItems = useCallback(
    (item: {
      id: string
      type: 'dossier' | WorkItemType
      dossierType?: DossierType
      title_en: string
      title_ar: string
      url: string
    }) => {
      const newItem: RecentItem = {
        ...item,
        visitedAt: new Date().toISOString(),
      }

      setRecentItems((prev) => {
        const filtered = prev.filter((i) => i.id !== item.id)
        const updated = [newItem, ...filtered].slice(0, MAX_RECENT_ITEMS)
        try {
          localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(updated))
        } catch (e) {
          console.error('Failed to save recent items:', e)
        }
        return updated
      })
    },
    [],
  )

  // Handle dossier selection
  const handleDossierSelect = useCallback(
    (dossier: QuickSwitcherDossier) => {
      const url = getDossierDetailPath(dossier.id, dossier.type)
      addToRecentItems({
        id: dossier.id,
        type: 'dossier',
        dossierType: dossier.type,
        title_en: dossier.name_en,
        title_ar: dossier.name_ar,
        url,
      })
      return url
    },
    [addToRecentItems],
  )

  // Handle work item selection
  const handleWorkItemSelect = useCallback(
    (item: QuickSwitcherWorkItem) => {
      const url = getWorkItemUrl(item)
      addToRecentItems({
        id: item.id,
        type: item.type,
        title_en: item.title_en,
        title_ar: item.title_ar,
        url,
      })
      return url
    },
    [addToRecentItems],
  )

  // Clear recent items
  const clearRecentItems = useCallback(() => {
    setRecentItems([])
    try {
      localStorage.removeItem(RECENT_ITEMS_KEY)
    } catch (e) {
      console.error('Failed to clear recent items:', e)
    }
  }, [])

  // Get display title based on language
  const getDisplayTitle = useCallback(
    (item: { title_en?: string; title_ar?: string; name_en?: string; name_ar?: string }) => {
      if (isRTL) {
        return item.title_ar || item.name_ar || item.title_en || item.name_en || ''
      }
      return item.title_en || item.name_en || item.title_ar || item.name_ar || ''
    },
    [isRTL],
  )

  // Computed values
  const hasResults = useMemo(() => {
    if (!searchQuery.data) return false
    return searchQuery.data.dossiers.length > 0 || searchQuery.data.related_work.length > 0
  }, [searchQuery.data])

  const totalResults = useMemo(() => {
    if (!searchQuery.data) return 0
    return searchQuery.data.dossiers.length + searchQuery.data.related_work.length
  }, [searchQuery.data])

  return {
    // Search state
    query,
    setQuery,
    debouncedQuery,

    // Results
    dossiers: searchQuery.data?.dossiers || [],
    relatedWork: searchQuery.data?.related_work || [],
    hasResults,
    totalResults,

    // Query metadata
    queryMetadata: searchQuery.data?.query,
    tookMs: searchQuery.data?.took_ms,
    cacheHit: searchQuery.data?.cache_hit,

    // Recent items
    recentItems,
    addToRecentItems,
    clearRecentItems,

    // Loading/error states
    isLoading: searchQuery.isLoading,
    isFetching: searchQuery.isFetching,
    isError: searchQuery.isError,
    error: searchQuery.error,

    // Selection handlers
    handleDossierSelect,
    handleWorkItemSelect,

    // Utilities
    getDisplayTitle,
    isRTL,
  }
}
