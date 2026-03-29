/**
 * useRecentNavigation Hook
 *
 * Tracks recently visited pages in localStorage for the command palette.
 * Provides page-level navigation history (distinct from entity-level recent items
 * in useQuickSwitcherSearch which tracks dossier/work-item visits).
 *
 * Features:
 * - Auto-tracks page visits via TanStack Router location changes
 * - Deduplicates by path, keeps most recent visit
 * - Configurable max items (default 10)
 * - SSR-safe localStorage access
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useLocation } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  createNavigationGroups,
  type NavigationItem,
} from '@/components/layout/navigation-config'

const STORAGE_KEY = 'recent_navigation'
const MAX_ITEMS = 10

export interface RecentNavigationItem {
  path: string
  title: string
  type: 'page' | 'dossier' | 'work-item'
  icon?: string // lucide icon name for serialization
  timestamp: number
}

interface UseRecentNavigationReturn {
  recentItems: RecentNavigationItem[]
  addRecent: (item: Omit<RecentNavigationItem, 'timestamp'>) => void
  clearRecents: () => void
}

/**
 * Read recent items from localStorage safely
 */
function readFromStorage(): RecentNavigationItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as RecentNavigationItem[]
      return Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : []
    }
  } catch {
    // SSR or corrupted data — ignore
  }
  return []
}

/**
 * Write recent items to localStorage safely
 */
function writeToStorage(items: RecentNavigationItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Storage full or unavailable — ignore
  }
}

/**
 * Build a flat lookup of path -> label from navigation config
 */
function buildPathTitleMap(): Map<string, string> {
  // Use default counts (0) and admin=true to get all possible pages
  const groups = createNavigationGroups({ tasks: 0, approvals: 0, engagements: 0 }, true)
  const map = new Map<string, string>()

  for (const group of groups) {
    for (const item of group.items) {
      map.set(item.path, item.label)
    }
  }

  return map
}

/**
 * Determine if a path should be tracked.
 * Skip redirects, auth pages, and other non-meaningful navigations.
 */
function shouldTrackPath(path: string): boolean {
  const skipPatterns = [
    /^\/login/,
    /^\/auth/,
    /^\/callback/,
    /^\/redirect/,
    /^\/$/, // root redirect
  ]
  return !skipPatterns.some((pattern) => pattern.test(path))
}

/**
 * Determine the type of a navigation path
 */
function getPathType(path: string): RecentNavigationItem['type'] {
  if (path.startsWith('/dossiers/') && path.split('/').length > 3) {
    return 'dossier'
  }
  if (
    path.startsWith('/tasks/') ||
    path.startsWith('/commitments/') ||
    path.startsWith('/positions/') ||
    path.startsWith('/intake/')
  ) {
    const segments = path.split('/')
    if (segments.length > 2 && segments[2] !== '') {
      return 'work-item'
    }
  }
  return 'page'
}

export function useRecentNavigation(): UseRecentNavigationReturn {
  const [recentItems, setRecentItems] = useState<RecentNavigationItem[]>(readFromStorage)
  const location = useLocation()
  const { t } = useTranslation('common')
  const prevPathRef = useRef<string>('')
  const pathTitleMapRef = useRef<Map<string, string> | null>(null)

  // Lazily build path title map
  const getPathTitleMap = useCallback((): Map<string, string> => {
    if (pathTitleMapRef.current === null) {
      pathTitleMapRef.current = buildPathTitleMap()
    }
    return pathTitleMapRef.current
  }, [])

  const addRecent = useCallback(
    (item: Omit<RecentNavigationItem, 'timestamp'>) => {
      const newItem: RecentNavigationItem = {
        ...item,
        timestamp: Date.now(),
      }

      setRecentItems((prev) => {
        // Remove duplicate by path
        const filtered = prev.filter((existing) => existing.path !== newItem.path)
        // Add to front, trim to max
        const updated = [newItem, ...filtered].slice(0, MAX_ITEMS)
        writeToStorage(updated)
        return updated
      })
    },
    [],
  )

  const clearRecents = useCallback(() => {
    setRecentItems([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore
    }
  }, [])

  // Auto-track page visits on location change
  useEffect(() => {
    const currentPath = location.pathname

    // Skip if same path as last tracked (consecutive navigations)
    if (currentPath === prevPathRef.current) {
      return
    }

    // Skip non-meaningful paths
    if (!shouldTrackPath(currentPath)) {
      return
    }

    prevPathRef.current = currentPath

    // Resolve title from navigation config or use pathname
    const titleMap = getPathTitleMap()
    const i18nKey = titleMap.get(currentPath)
    const title = i18nKey != null ? t(i18nKey, currentPath) : formatPathAsTitle(currentPath)
    const type = getPathType(currentPath)

    addRecent({
      path: currentPath,
      title,
      type,
    })
  }, [location.pathname, addRecent, getPathTitleMap, t])

  return {
    recentItems,
    addRecent,
    clearRecents,
  }
}

/**
 * Convert a path like "/dossiers/countries" to a human-readable title "Countries"
 */
function formatPathAsTitle(path: string): string {
  const segments = path.split('/').filter(Boolean)
  const last = segments[segments.length - 1]
  if (last == null) return path

  // Remove UUIDs (common pattern: 36 char hex with dashes)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(last)) {
    // Use the segment before UUID if available
    const secondLast = segments[segments.length - 2]
    if (secondLast != null) {
      return secondLast
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
    }
  }

  return last
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
