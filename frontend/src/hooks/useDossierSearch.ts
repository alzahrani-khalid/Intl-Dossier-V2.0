/**
 * useDossierSearch Hook
 * Feature: 035-dossier-context (Smart Dossier Context Inheritance)
 * Task: T035
 *
 * TanStack Query hook for dossier search/autocomplete.
 * Optimized for the DossierSelector component with debouncing.
 */

import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useMemo } from 'react'
import { useDossiers, dossierKeys } from './useDossiers'
import type { DossierType, Dossier } from '@/types/dossier'

// ============================================================================
// Types
// ============================================================================

export interface DossierSearchResult {
  id: string
  type: DossierType
  name_en: string
  name_ar: string | null
  status: string
}

export interface UseDossierSearchOptions {
  /**
   * Search query string.
   */
  query?: string
  /**
   * Debounce delay in milliseconds.
   * @default 300
   */
  debounceMs?: number
  /**
   * Filter by dossier type(s).
   */
  types?: DossierType[]
  /**
   * Maximum number of results to return.
   * @default 20
   */
  limit?: number
  /**
   * Whether to enable the query.
   * @default true
   */
  enabled?: boolean
}

export interface UseDossierSearchReturn {
  results: DossierSearchResult[]
  isLoading: boolean
  isSearching: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
  totalCount: number
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Debounced dossier search hook for autocomplete/selector components.
 *
 * @example
 * ```tsx
 * const { results, isSearching } = useDossierSearch({
 *   query: searchTerm,
 *   types: ['country', 'organization'],
 *   limit: 10,
 * });
 * ```
 */
export function useDossierSearch(options: UseDossierSearchOptions = {}): UseDossierSearchReturn {
  const { query = '', debounceMs = 300, types, limit = 20, enabled = true } = options

  // Debounced search query
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, debounceMs])

  // Build filters for useDossiers
  const filters = useMemo(() => {
    const result: Record<string, any> = {
      status: 'active',
      page_size: limit,
    }

    if (debouncedQuery.trim()) {
      result.search = debouncedQuery.trim()
    }

    if (types && types.length > 0) {
      // If single type, use direct filter
      if (types.length === 1) {
        result.type = types[0]
      }
      // Multiple types would need backend support for type[] filter
      // For now, we'll filter client-side if multiple types
    }

    return result
  }, [debouncedQuery, types, limit])

  // Use existing useDossiers hook
  const { data, isLoading, isError, error, refetch } = useDossiers(enabled ? filters : undefined)

  // Transform and filter results
  const results = useMemo<DossierSearchResult[]>(() => {
    if (!data?.data) return []

    let filtered = data.data

    // Client-side filter for multiple types if needed
    if (types && types.length > 1) {
      filtered = filtered.filter((d) => types.includes(d.type))
    }

    return filtered.map((d) => ({
      id: d.id,
      type: d.type,
      name_en: d.name_en,
      name_ar: d.name_ar,
      status: d.status,
    }))
  }, [data?.data, types])

  return {
    results,
    isLoading,
    isSearching: query !== debouncedQuery,
    isError,
    error: error as Error | null,
    refetch,
    totalCount: data?.total ?? 0,
  }
}

export default useDossierSearch
