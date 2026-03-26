/**
 * useDossierFirstSearch Hook (Domain)
 * Feature: Dossier-first search experience
 *
 * Custom TanStack Query hook for the dossier-first search pattern.
 * Delegates API calls to dossiers.repository.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, useMemo } from 'react'
import * as dossiersRepo from '../repositories/dossiers.repository'
import type { DossierType } from '@/lib/dossier-type-guards'
import type {
  DossierSearchFilters,
} from '@/types/dossier-search.types'

/**
 * Debounce helper
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Default filters
 */
export const DEFAULT_FILTERS: DossierSearchFilters = {
  types: 'all',
  status: 'all',
  myDossiersOnly: false,
  query: '',
}

/**
 * useDossierFirstSearch hook
 *
 * @param initialQuery - Initial search query
 * @param initialFilters - Initial filter state
 * @param options - Hook options
 * @returns Search state and methods
 */
export function useDossierFirstSearch(
  initialQuery: string = '',
  initialFilters: Partial<DossierSearchFilters> = {},
  options: {
    debounceMs?: number
    pageSize?: number
    enabled?: boolean
  } = {},
) {
  const { debounceMs = 300, pageSize = 20, enabled = true } = options
  const queryClient = useQueryClient()

  // State
  const [query, setQuery] = useState(initialQuery)
  const [filters, setFilters] = useState<DossierSearchFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
    query: initialQuery,
  })
  const [dossierPage, setDossierPage] = useState(1)
  const [workPage, setWorkPage] = useState(1)

  // Debounced query
  const debouncedQuery = useDebounce(query, debounceMs)

  // Update filters.query when query changes
  useEffect(() => {
    setFilters((prev) => ({ ...prev, query }))
  }, [query])

  // Main search query — uses repository instead of raw fetch
  const searchQuery = useQuery({
    queryKey: ['dossier-first-search', debouncedQuery, filters, dossierPage, workPage, pageSize],
    queryFn: () => dossiersRepo.getDossierFirstSearch(debouncedQuery, filters, dossierPage, pageSize),
    enabled: enabled && debouncedQuery.trim().length > 0,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    placeholderData: (previousData) => previousData,
  })

  // Type counts (for filter UI)
  const typeCounts = useMemo(() => {
    if (!searchQuery.data) return undefined

    const counts: Record<DossierType | 'all', number> = {
      all: searchQuery.data.dossiers_total,
      country: 0,
      organization: 0,
      forum: 0,
      engagement: 0,
      topic: 0,
      working_group: 0,
      person: 0,
    }

    searchQuery.data.dossiers.forEach((d) => {
      counts[d.type] = (counts[d.type] || 0) + 1
    })

    return counts
  }, [searchQuery.data])

  // Load more handlers
  const loadMoreDossiers = () => {
    if (searchQuery.data?.has_more_dossiers) {
      setDossierPage((prev) => prev + 1)
    }
  }

  const loadMoreWork = () => {
    if (searchQuery.data?.has_more_work) {
      setWorkPage((prev) => prev + 1)
    }
  }

  // Update filters
  const updateFilters = (newFilters: Partial<DossierSearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
    setDossierPage(1)
    setWorkPage(1)
  }

  // Clear search
  const clearSearch = () => {
    setQuery('')
    setFilters({ ...DEFAULT_FILTERS })
    setDossierPage(1)
    setWorkPage(1)
  }

  // Prefetch next page
  const prefetchNextPage = () => {
    if (!searchQuery.data) return

    if (searchQuery.data.has_more_dossiers) {
      queryClient.prefetchQuery({
        queryKey: [
          'dossier-first-search',
          debouncedQuery,
          filters,
          dossierPage + 1,
          workPage,
          pageSize,
        ],
        queryFn: () =>
          dossiersRepo.getDossierFirstSearch(debouncedQuery, filters, dossierPage + 1, pageSize),
      })
    }
  }

  return {
    // State
    query,
    filters,
    dossierPage,
    workPage,

    // Data
    dossiers: searchQuery.data?.dossiers || [],
    relatedWork: searchQuery.data?.related_work || [],
    dossiersTotal: searchQuery.data?.dossiers_total || 0,
    relatedWorkTotal: searchQuery.data?.related_work_total || 0,
    hasMoreDossiers: searchQuery.data?.has_more_dossiers || false,
    hasMoreWork: searchQuery.data?.has_more_work || false,
    typeCounts,

    // Query metadata
    queryMetadata: searchQuery.data?.query,
    tookMs: searchQuery.data?.took_ms,

    // Loading/error states
    isLoading: searchQuery.isLoading,
    isFetching: searchQuery.isFetching,
    isError: searchQuery.isError,
    error: searchQuery.error,

    // Actions
    setQuery,
    updateFilters,
    loadMoreDossiers,
    loadMoreWork,
    clearSearch,
    prefetchNextPage,
    refetch: searchQuery.refetch,
  }
}
