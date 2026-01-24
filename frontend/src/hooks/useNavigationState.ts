/**
 * Navigation State Preservation Hooks
 * @module hooks/useNavigationState
 * @feature T058
 *
 * Comprehensive state preservation across navigation for seamless user experience.
 *
 * @description
 * This module provides hooks for preserving and restoring various types of UI state
 * across navigation events. State is persisted using a combination of:
 * - TanStack Router search params for filter state (URL-based, shareable)
 * - sessionStorage for complex UI state (scroll position, selections, expanded sections)
 * - Automatic TTL-based cleanup (30 minutes) to prevent stale state
 *
 * Features:
 * - Automatic scroll position preservation and restoration
 * - URL-based filter state management with type safety
 * - UI state persistence (selections, expanded sections, active tabs)
 * - Throttled auto-save to minimize performance impact
 * - Context-based state isolation (different states for different pages)
 *
 * @example
 * // Preserve scroll and UI state for a list page
 * const {
 *   searchParams,
 *   updateSearchParams,
 *   saveUIState,
 *   loadUIState
 * } = useNavigationState('positions-library');
 *
 * @example
 * // Simple filter state management
 * const { filters, updateFilters, resetFilters } = useFilterState({
 *   status: 'active',
 *   type: 'all'
 * });
 *
 * @example
 * // Selection state preservation
 * const { selectedItems, toggleItem, clearSelection } = useSelectionState('tasks-list');
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
 * @description
 * Provides comprehensive state preservation across navigation using a hybrid approach:
 * - URL search params for filter state (shareable, bookmarkable)
 * - sessionStorage for UI state (scroll, selections, expanded sections)
 * - Automatic cleanup based on TTL (30 minutes)
 * - Throttled auto-save for scroll position (500ms debounce)
 *
 * The hook automatically saves state on unmount and restores it on mount,
 * ensuring a seamless user experience when navigating between pages.
 *
 * @template T - Type of the search params/filter state
 * @param contextKey - Unique identifier for this context (e.g., 'positions-library', 'dossier-123-positions')
 * @param options - Configuration options
 * @param options.defaultState - Default values for state properties
 * @param options.includeScrollPosition - Whether to track scroll position (default: true)
 * @returns State management utilities object containing:
 * - `searchParams`: Current URL search parameters typed as T
 * - `updateSearchParams`: Function to update URL search parameters
 * - `saveUIState`: Function to save UI state to sessionStorage
 * - `loadUIState`: Function to load UI state from sessionStorage
 * - `clearState`: Function to clear all saved state
 * - `saveScrollPosition`: Function to manually save scroll position
 * - `restoreScrollPosition`: Function to manually restore scroll position
 *
 * @example
 * // Preserve filters and scroll for a list page
 * interface ListFilters {
 *   status: string;
 *   search: string;
 *   page: number;
 * }
 *
 * function PositionsList() {
 *   const {
 *     searchParams,
 *     updateSearchParams,
 *     saveUIState,
 *     loadUIState
 *   } = useNavigationState<ListFilters>('positions-library');
 *
 *   const { selectedItems = [] } = loadUIState();
 *
 *   const handleFilterChange = (newFilters: Partial<ListFilters>) => {
 *     updateSearchParams(newFilters);
 *   };
 *
 *   const handleSelectionChange = (items: string[]) => {
 *     saveUIState({ selectedItems: items });
 *   };
 * }
 *
 * @example
 * // Without scroll position tracking
 * const { searchParams, updateSearchParams } = useNavigationState('filters-only', {
 *   includeScrollPosition: false
 * });
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
 * Hook for managing filter state in URL search parameters
 *
 * @description
 * Provides a simplified interface for managing filter state in the URL.
 * All filter changes are synchronized with URL search params, making filters
 * bookmarkable and shareable. Uses TanStack Router's search param management
 * with replace mode to avoid polluting browser history.
 *
 * @template T - Type of the filter state object
 * @param defaultFilters - Default filter values to use when params are not present
 * @returns Filter management utilities object containing:
 * - `filters`: Current filter values (merged from defaults and URL params)
 * - `updateFilters`: Function to update filters (accepts partial or updater function)
 * - `resetFilters`: Function to reset all filters to default values
 *
 * @example
 * // Basic filter management
 * interface ListFilters {
 *   status: 'all' | 'active' | 'archived';
 *   search: string;
 *   sortBy: string;
 * }
 *
 * function FilterableList() {
 *   const { filters, updateFilters, resetFilters } = useFilterState<ListFilters>({
 *     status: 'all',
 *     search: '',
 *     sortBy: 'name'
 *   });
 *
 *   return (
 *     <div>
 *       <input
 *         value={filters.search}
 *         onChange={(e) => updateFilters({ search: e.target.value })}
 *       />
 *       <select
 *         value={filters.status}
 *         onChange={(e) => updateFilters({ status: e.target.value })}
 *       >
 *         <option value="all">All</option>
 *         <option value="active">Active</option>
 *       </select>
 *       <button onClick={resetFilters}>Reset</button>
 *     </div>
 *   );
 * }
 *
 * @example
 * // Using updater function
 * updateFilters(prev => ({
 *   ...prev,
 *   page: prev.page + 1
 * }));
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
 * @description
 * Manages selection state for lists with automatic persistence to sessionStorage.
 * Selected items are preserved when navigating away and restored when returning
 * to the same context. Useful for bulk operations, multi-select interfaces,
 * and maintaining user selections across route changes.
 *
 * @param contextKey - Unique context identifier (e.g., 'tasks-list', 'dossiers-grid')
 * @returns Selection management utilities object containing:
 * - `selectedItems`: Array of currently selected item IDs
 * - `setSelectedItems`: Function to set selected items (accepts array or updater function)
 * - `toggleItem`: Function to toggle selection state of a single item
 * - `clearSelection`: Function to clear all selections
 * - `isSelected`: Function to check if an item ID is selected
 *
 * @example
 * // Multi-select list with bulk actions
 * function TasksList() {
 *   const {
 *     selectedItems,
 *     toggleItem,
 *     clearSelection,
 *     isSelected
 *   } = useSelectionState('tasks-list');
 *
 *   const handleBulkDelete = async () => {
 *     await deleteMany(selectedItems);
 *     clearSelection();
 *   };
 *
 *   return (
 *     <div>
 *       {selectedItems.length > 0 && (
 *         <button onClick={handleBulkDelete}>
 *           Delete {selectedItems.length} items
 *         </button>
 *       )}
 *       {tasks.map(task => (
 *         <div key={task.id}>
 *           <input
 *             type="checkbox"
 *             checked={isSelected(task.id)}
 *             onChange={() => toggleItem(task.id)}
 *           />
 *           {task.name}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 *
 * @example
 * // Programmatic selection updates
 * const { setSelectedItems } = useSelectionState('items');
 *
 * // Select all
 * setSelectedItems(allItems.map(i => i.id));
 *
 * // Select using updater function
 * setSelectedItems(prev => [...prev, newItemId]);
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
