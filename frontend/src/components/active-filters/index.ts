/**
 * Active Filters Components
 * Feature: Persistent filter chip bar
 *
 * Exports:
 * - ActiveFiltersBar: Main component for displaying active filters
 * - useActiveFilters: Hook for managing filter state
 * - Types for filter configuration
 */

export {
  ActiveFiltersBar,
  type ActiveFiltersBarProps,
  type FilterChipConfig,
} from './ActiveFiltersBar'
export {
  useActiveFilters,
  type UseActiveFiltersOptions,
  type UseActiveFiltersReturn,
} from './useActiveFilters'
