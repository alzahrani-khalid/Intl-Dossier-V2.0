/**
 * Navigation State Preservation Hook (T058)
 *
 * Preserves UI state across cross-module navigation
 * Strategy: TanStack Router search params for filters, sessionStorage for scroll/UI state
 * Features: Auto-save on unmount, auto-restore on mount, TTL for stale state
 */

import { useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'

interface NavigationState {
  scrollPosition?: number
  selectedItems?: string[]
  expandedSections?: string[]
  activeTab?: string
  timestamp: number
}

const STATE_TTL = 30 * 60 * 1000 // 30 minutes

/**
 * Hook to preserve and restore navigation state for a given context
 *
 * @param contextKey - Unique key for this context (e.g., 'positions-library', 'dossier-123-positions')
 * @param options - Configuration options
 * @returns State management utilities
 */
export function useNavigationState<T extends Record<string, unknown>>(
  contextKey: string,
  options: {
    defaultState?: Partial<T>
    includeScrollPosition?: boolean
  } = {},
) {
  const { includeScrollPosition = true } = options
  const navigate = useNavigate()
  const searchParams = useSearch()
  const scrollRestoredRef = useRef(false)
  const stateKey = `nav-state:${contextKey}`

  /**
   * Load state from sessionStorage
   */
  const loadState = useCallback((): NavigationState | null => {
    try {
      const stored = sessionStorage.getItem(stateKey)
      if (!stored) return null

      const state: NavigationState = JSON.parse(stored)

      // Check if state is stale (older than TTL)
      const now = Date.now()
      if (now - state.timestamp > STATE_TTL) {
        sessionStorage.removeItem(stateKey)
        return null
      }

      return state
    } catch (error) {
      console.error('Failed to load navigation state:', error)
      return null
    }
  }, [stateKey])

  /**
   * Save state to sessionStorage
   */
  const saveState = useCallback(
    (state: Partial<NavigationState>) => {
      try {
        const currentState = loadState() || { timestamp: Date.now() }
        const newState: NavigationState = {
          ...currentState,
          ...state,
          timestamp: Date.now(),
        }
        sessionStorage.setItem(stateKey, JSON.stringify(newState))
      } catch (error) {
        console.error('Failed to save navigation state:', error)
      }
    },
    [stateKey, loadState],
  )

  /**
   * Clear state from sessionStorage
   */
  const clearState = useCallback(() => {
    try {
      sessionStorage.removeItem(stateKey)
    } catch (error) {
      console.error('Failed to clear navigation state:', error)
    }
  }, [stateKey])

  /**
   * Get current scroll position
   */
  const getCurrentScrollPosition = useCallback(() => {
    return window.scrollY || document.documentElement.scrollTop
  }, [])

  /**
   * Save scroll position
   */
  const saveScrollPosition = useCallback(() => {
    if (!includeScrollPosition) return
    const scrollPosition = getCurrentScrollPosition()
    saveState({ scrollPosition })
  }, [includeScrollPosition, getCurrentScrollPosition, saveState])

  /**
   * Restore scroll position
   */
  const restoreScrollPosition = useCallback(() => {
    if (!includeScrollPosition || scrollRestoredRef.current) return

    const state = loadState()
    if (state?.scrollPosition !== undefined) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo(0, state.scrollPosition!)
        scrollRestoredRef.current = true
      })
    }
  }, [includeScrollPosition, loadState])

  /**
   * Update search params (for filters)
   */
  const updateSearchParams = useCallback(
    (updates: Partial<T>) => {
      void navigate({
        search: (prev) => ({
          ...(prev as Record<string, unknown>),
          ...updates,
        }),
        replace: true,
      })
    },
    [navigate],
  )

  /**
   * Save UI state (selected items, expanded sections, etc.)
   */
  const saveUIState = useCallback(
    (state: { selectedItems?: string[]; expandedSections?: string[]; activeTab?: string }) => {
      saveState(state)
    },
    [saveState],
  )

  /**
   * Load UI state
   */
  const loadUIState = useCallback(() => {
    const state = loadState()
    return {
      selectedItems: state?.selectedItems || [],
      expandedSections: state?.expandedSections || [],
      activeTab: state?.activeTab,
    }
  }, [loadState])

  // Restore scroll position on mount
  useEffect(() => {
    restoreScrollPosition()
  }, [restoreScrollPosition])

  // Save scroll position on unmount
  useEffect(() => {
    return () => {
      saveScrollPosition()
    }
  }, [saveScrollPosition])

  // Auto-save scroll position periodically
  useEffect(() => {
    if (!includeScrollPosition) return

    const handleScroll = () => {
      saveScrollPosition()
    }

    // Throttle scroll events
    let timeoutId: NodeJS.Timeout
    const throttledHandleScroll = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleScroll, 500)
    }

    window.addEventListener('scroll', throttledHandleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll)
      clearTimeout(timeoutId)
    }
  }, [includeScrollPosition, saveScrollPosition])

  return {
    // Search params (for filters)
    searchParams: searchParams as T,
    updateSearchParams,

    // UI state (for complex state like selections)
    saveUIState,
    loadUIState,
    clearState,

    // Scroll position
    saveScrollPosition,
    restoreScrollPosition,
  }
}

/**
 * Simple hook for managing filter state in URL
 *
 * @param defaultFilters - Default filter values
 * @returns Filter state and updater
 */
export function useFilterState<T extends Record<string, unknown>>(defaultFilters: T) {
  const navigate = useNavigate()
  const searchParams = useSearch()

  const filters = useMemo(
    () =>
      ({
        ...defaultFilters,
        ...searchParams,
      }) as T,
    [defaultFilters, searchParams],
  )

  const updateFilters = useCallback(
    (updates: Partial<T> | ((prev: T) => Partial<T>)) => {
      const newFilters = typeof updates === 'function' ? updates(filters) : updates

      void navigate({
        search: (prev) => ({
          ...(prev as Record<string, unknown>),
          ...newFilters,
        }),
        replace: true,
      })
    },
    [navigate, filters],
  )

  const resetFilters = useCallback(() => {
    void navigate({
      search: defaultFilters,
      replace: true,
    })
  }, [navigate, defaultFilters])

  return {
    filters,
    updateFilters,
    resetFilters,
  }
}

/**
 * Hook for preserving selected items across navigation
 *
 * @param contextKey - Unique context identifier
 * @returns Selection state and management
 */
export function useSelectionState(contextKey: string) {
  const { saveUIState, loadUIState } = useNavigationState(contextKey, {
    includeScrollPosition: false,
  })

  const { selectedItems = [] } = loadUIState()

  const setSelectedItems = useCallback(
    (items: string[] | ((prev: string[]) => string[])) => {
      const newItems = typeof items === 'function' ? items(selectedItems) : items
      saveUIState({ selectedItems: newItems })
    },
    [selectedItems, saveUIState],
  )

  const toggleItem = useCallback(
    (itemId: string) => {
      const newSelected = selectedItems.includes(itemId)
        ? selectedItems.filter((id) => id !== itemId)
        : [...selectedItems, itemId]
      saveUIState({ selectedItems: newSelected })
    },
    [selectedItems, saveUIState],
  )

  const clearSelection = useCallback(() => {
    saveUIState({ selectedItems: [] })
  }, [saveUIState])

  return {
    selectedItems,
    setSelectedItems,
    toggleItem,
    clearSelection,
    isSelected: (itemId: string) => selectedItems.includes(itemId),
  }
}
