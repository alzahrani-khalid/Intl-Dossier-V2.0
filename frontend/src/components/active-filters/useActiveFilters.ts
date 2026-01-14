/**
 * useActiveFilters Hook v1.0
 * Feature: Active Filters Display
 *
 * A hook to manage active filter state and convert filters to chip configurations.
 * Supports:
 * - Generic filter object conversion to chips
 * - Array filter handling (multi-select)
 * - Date filter formatting
 * - Boolean filter display
 * - Custom label/value formatters
 */

import { useMemo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { FilterChipConfig } from './ActiveFiltersBar'

/**
 * Filter field configuration
 */
export interface FilterFieldConfig {
  /** The key in the filter object */
  key: string
  /** Translation key for the label (or custom label) */
  labelKey?: string
  /** Custom label (overrides labelKey) */
  label?: string
  /** Type of the filter field */
  type: 'string' | 'array' | 'boolean' | 'date' | 'dateRange'
  /** Category name for grouping */
  category?: string
  /** Translation namespace for values */
  valueTranslationPrefix?: string
  /** Custom value formatter */
  formatValue?: (value: unknown) => string
  /** Variant for styling */
  variant?: FilterChipConfig['variant']
  /** Custom icon */
  icon?: React.ReactNode
  /** Fields to skip displaying (always filtered out) */
  skip?: boolean
}

export interface UseActiveFiltersOptions<T extends Record<string, unknown>> {
  /** Current filter values */
  filters: T
  /** Configuration for each filter field */
  fieldConfigs: FilterFieldConfig[]
  /** Translation namespace */
  namespace?: string
  /** Callback when filters change */
  onFiltersChange: (filters: T) => void
  /** Default/empty filter values */
  defaultFilters?: Partial<T>
}

export interface UseActiveFiltersReturn {
  /** Computed filter chips for display */
  filterChips: FilterChipConfig[]
  /** Count of active filters */
  activeFilterCount: number
  /** Remove a single filter */
  removeFilter: (key: string, arrayValue?: string) => void
  /** Clear all filters */
  clearAllFilters: () => void
  /** Check if any filters are active */
  hasActiveFilters: boolean
  /** Collapsed state for mobile */
  collapsed: boolean
  /** Toggle collapsed state */
  toggleCollapsed: () => void
}

/**
 * Hook to manage active filters and generate chip configurations
 */
export function useActiveFilters<T extends Record<string, unknown>>({
  filters,
  fieldConfigs,
  namespace = 'active-filters',
  onFiltersChange,
  defaultFilters = {} as Partial<T>,
}: UseActiveFiltersOptions<T>): UseActiveFiltersReturn {
  const { t, i18n } = useTranslation(namespace)
  const [collapsed, setCollapsed] = useState(false)

  /**
   * Format date for display
   */
  const formatDate = useCallback(
    (dateStr: string) => {
      try {
        const date = new Date(dateStr)
        return date.toLocaleDateString(i18n.language, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      } catch {
        return dateStr
      }
    },
    [i18n.language],
  )

  /**
   * Convert filters to chip configurations
   */
  const filterChips = useMemo<FilterChipConfig[]>(() => {
    const chips: FilterChipConfig[] = []

    fieldConfigs.forEach((config) => {
      if (config.skip) return

      const value = filters[config.key]

      // Skip undefined, null, or empty values
      if (value === undefined || value === null) return
      if (typeof value === 'string' && value === '') return
      if (Array.isArray(value) && value.length === 0) return

      const label = config.label || (config.labelKey ? t(config.labelKey) : config.key)

      switch (config.type) {
        case 'array': {
          // Handle array filters (multi-select)
          const arrayValue = value as unknown[]
          arrayValue.forEach((item) => {
            const itemStr = String(item)
            const displayValue = config.formatValue
              ? config.formatValue(item)
              : config.valueTranslationPrefix
                ? t(`${config.valueTranslationPrefix}.${itemStr}`)
                : itemStr

            chips.push({
              key: config.key,
              label,
              value: displayValue,
              category: config.category,
              arrayValue: itemStr,
              variant: config.variant,
              icon: config.icon,
            })
          })
          break
        }

        case 'boolean': {
          // Handle boolean filters
          if (value === true) {
            const displayValue = config.formatValue
              ? config.formatValue(value)
              : t(`${config.key}_enabled`, label)

            chips.push({
              key: config.key,
              label,
              value: displayValue,
              category: config.category,
              variant: config.variant || 'warning',
              icon: config.icon,
            })
          }
          break
        }

        case 'date': {
          // Handle date filters
          const dateValue = value as string
          const displayValue = config.formatValue
            ? config.formatValue(dateValue)
            : formatDate(dateValue)

          chips.push({
            key: config.key,
            label,
            value: displayValue,
            category: config.category,
            variant: config.variant,
            icon: config.icon,
          })
          break
        }

        case 'dateRange': {
          // Handle date range (expects { from: string, to: string })
          const rangeValue = value as { from?: string; to?: string }
          if (rangeValue.from) {
            chips.push({
              key: `${config.key}.from`,
              label: `${label} (${t('from')})`,
              value: formatDate(rangeValue.from),
              category: config.category,
              variant: config.variant,
              icon: config.icon,
            })
          }
          if (rangeValue.to) {
            chips.push({
              key: `${config.key}.to`,
              label: `${label} (${t('to')})`,
              value: formatDate(rangeValue.to),
              category: config.category,
              variant: config.variant,
              icon: config.icon,
            })
          }
          break
        }

        case 'string':
        default: {
          // Handle string/enum filters
          const strValue = String(value)
          const displayValue = config.formatValue
            ? config.formatValue(value)
            : config.valueTranslationPrefix
              ? t(`${config.valueTranslationPrefix}.${strValue}`)
              : strValue

          chips.push({
            key: config.key,
            label,
            value: displayValue,
            category: config.category,
            variant: config.variant,
            icon: config.icon,
          })
          break
        }
      }
    })

    return chips
  }, [filters, fieldConfigs, t, formatDate])

  /**
   * Remove a single filter
   */
  const removeFilter = useCallback(
    (key: string, arrayValue?: string) => {
      const newFilters = { ...filters }

      // Handle nested keys (e.g., 'dateRange.from')
      if (key.includes('.')) {
        const parts = key.split('.')
        const parentKey = parts[0]
        const childKey = parts[1]
        if (parentKey && childKey) {
          const parentValue = newFilters[parentKey] as Record<string, unknown> | undefined
          if (parentValue && typeof parentValue === 'object') {
            const updatedParent = { ...parentValue }
            delete updatedParent[childKey]
            // If parent object is empty, remove it entirely
            if (Object.keys(updatedParent).length === 0) {
              delete newFilters[parentKey]
            } else {
              ;(newFilters as Record<string, unknown>)[parentKey] = updatedParent
            }
          }
        }
      } else if (arrayValue !== undefined) {
        // Handle array filter removal
        const currentArray = (newFilters[key] as unknown[]) || []
        const updatedArray = currentArray.filter((item) => String(item) !== arrayValue)
        if (updatedArray.length === 0) {
          delete newFilters[key]
        } else {
          ;(newFilters as Record<string, unknown>)[key] = updatedArray
        }
      } else {
        // Handle simple filter removal
        delete newFilters[key]
      }

      onFiltersChange(newFilters)
    },
    [filters, onFiltersChange],
  )

  /**
   * Clear all filters
   */
  const clearAllFilters = useCallback(() => {
    onFiltersChange(defaultFilters as T)
  }, [defaultFilters, onFiltersChange])

  /**
   * Toggle collapsed state
   */
  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev)
  }, [])

  return {
    filterChips,
    activeFilterCount: filterChips.length,
    removeFilter,
    clearAllFilters,
    hasActiveFilters: filterChips.length > 0,
    collapsed,
    toggleCollapsed,
  }
}

export default useActiveFilters
