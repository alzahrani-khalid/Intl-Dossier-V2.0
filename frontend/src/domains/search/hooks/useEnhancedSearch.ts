/**
 * Enhanced Search Hook
 * @module domains/search/hooks/useEnhancedSearch
 *
 * TanStack Query hooks for intelligent search with suggestions and adaptive filters.
 * API calls delegated to search.repository.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useReducer, useRef, useEffect } from 'react'
import {
  fetchSuggestions,
  fetchSearchHistory,
  addSearchToHistory,
  clearSearchHistory as clearSearchHistoryApi,
  fetchFilterCounts,
} from '../repositories/search.repository'
import {
  type CategorizedSuggestions,
  type SearchHistoryItem,
  type FilterCount,
  type SearchSuggestion,
  type HistorySuggestion,
  enhancedSearchReducer,
  defaultEnhancedSearchState,
  getSuggestionAtIndex,
  isSearchSuggestion,
} from '@/types/enhanced-search.types'

// =============================================================================
// Query Keys
// =============================================================================

export const enhancedSearchKeys = {
  all: ['enhanced-search'] as const,
  suggestions: (query: string, entityTypes: string[]) =>
    [...enhancedSearchKeys.all, 'suggestions', query, entityTypes] as const,
  history: (userId: string) => [...enhancedSearchKeys.all, 'history', userId] as const,
  filterCounts: (cacheKey: string) =>
    [...enhancedSearchKeys.all, 'filter-counts', cacheKey] as const,
  popular: (entityTypes: string[]) => [...enhancedSearchKeys.all, 'popular', entityTypes] as const,
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook for fetching search suggestions with debouncing
 */
export function useSearchSuggestions(
  query: string,
  entityTypes: string[],
  options?: {
    enabled?: boolean
    debounceMs?: number
    minQueryLength?: number
  },
): ReturnType<typeof useQuery<CategorizedSuggestions>> {
  const minLength = options?.minQueryLength ?? 2
  const enabled = options?.enabled !== false && query.trim().length >= minLength

  return useQuery({
    queryKey: enhancedSearchKeys.suggestions(query, entityTypes),
    queryFn: () => fetchSuggestions(query, entityTypes),
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

/**
 * Hook for managing search history
 */
function useSearchHistory(options?: { enabled?: boolean }): {
  history: SearchHistoryItem[]
  isLoading: boolean
  error: Error | null
  addToHistory: (params: {
    query: string
    entityTypes: string[]
    resultCount: number
    filters?: Record<string, unknown>
  }) => Promise<string>
  clearHistory: () => Promise<number>
  isAddingToHistory: boolean
  isClearingHistory: boolean
} {
  const queryClient = useQueryClient()

  const historyQuery = useQuery({
    queryKey: ['enhanced-search', 'history'],
    queryFn: () => fetchSearchHistory(20),
    enabled: options?.enabled !== false,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const addToHistoryMutation = useMutation({
    mutationFn: ({
      query,
      entityTypes,
      resultCount,
      filters,
    }: {
      query: string
      entityTypes: string[]
      resultCount: number
      filters?: Record<string, unknown>
    }) => addSearchToHistory(query, entityTypes, resultCount, filters),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['enhanced-search', 'history'] })
    },
  })

  const clearHistoryMutation = useMutation({
    mutationFn: clearSearchHistoryApi,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['enhanced-search', 'history'] })
    },
  })

  return {
    history: historyQuery.data ?? [],
    isLoading: historyQuery.isLoading,
    error: historyQuery.error,
    addToHistory: addToHistoryMutation.mutateAsync,
    clearHistory: clearHistoryMutation.mutateAsync,
    isAddingToHistory: addToHistoryMutation.isPending,
    isClearingHistory: clearHistoryMutation.isPending,
  }
}

/**
 * Hook for adaptive filter counts
 */
export function useFilterCounts(
  cacheKey: string,
  entityTypes: string[],
  baseQuery?: string,
  options?: { enabled?: boolean },
): ReturnType<typeof useQuery<FilterCount[]>> {
  return useQuery({
    queryKey: enhancedSearchKeys.filterCounts(cacheKey),
    queryFn: () => fetchFilterCounts(cacheKey, entityTypes, baseQuery),
    enabled: options?.enabled !== false && entityTypes.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

/**
 * Main enhanced search hook with state management
 */
export function useEnhancedSearch(
  entityTypes: string[],
  options?: {
    debounceMs?: number
    minQueryLength?: number
    onSearch?: (query: string) => void
    onSuggestionSelect?: (suggestion: SearchSuggestion | HistorySuggestion) => void
  },
): {
  query: string
  isLoading: boolean
  isFocused: boolean
  showSuggestions: boolean
  suggestions: CategorizedSuggestions | null
  selectedSuggestionIndex: number
  inputRef: React.RefObject<HTMLInputElement | null>
  handleQueryChange: (value: string) => void
  handleSearch: (query: string) => void
  handleSuggestionSelect: (suggestion: SearchSuggestion | HistorySuggestion) => void
  handleKeyDown: (e: React.KeyboardEvent) => void
  handleFocus: () => void
  handleBlur: () => void
  clearQuery: () => void
  dispatch: React.Dispatch<ReturnType<typeof enhancedSearchReducer> extends infer S ? { type: string; payload?: unknown } : never>
} {
  const debounceMs = options?.debounceMs ?? 300
  const minQueryLength = options?.minQueryLength ?? 2

  const [state, dispatch] = useReducer(enhancedSearchReducer, defaultEnhancedSearchState)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    data: suggestions,
    isLoading: isLoadingSuggestions,
    isFetching: isFetchingSuggestions,
  } = useSearchSuggestions(state.query, entityTypes, {
    enabled: state.query.trim().length >= minQueryLength && state.isFocused,
    minQueryLength,
  })

  useEffect(() => {
    if (suggestions) {
      dispatch({ type: 'SET_SUGGESTIONS', payload: suggestions })
    }
  }, [suggestions])

  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: isLoadingSuggestions || isFetchingSuggestions })
  }, [isLoadingSuggestions, isFetchingSuggestions])

  const handleQueryChange = useCallback(
    (value: string) => {
      dispatch({ type: 'SET_QUERY', payload: value })

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      if (value.trim().length >= minQueryLength) {
        dispatch({ type: 'SET_LOADING', payload: true })
        debounceTimerRef.current = setTimeout(() => {
          dispatch({ type: 'SET_SHOW_SUGGESTIONS', payload: true })
        }, debounceMs)
      } else {
        dispatch({ type: 'SET_SHOW_SUGGESTIONS', payload: false })
        dispatch({ type: 'SET_SUGGESTIONS', payload: null })
      }
    },
    [debounceMs, minQueryLength],
  )

  const handleSearch = useCallback(
    (query: string) => {
      dispatch({ type: 'SET_SHOW_SUGGESTIONS', payload: false })
      if (options?.onSearch) {
        options.onSearch(query)
      }
    },
    [options],
  )

  const handleSuggestionSelect = useCallback(
    (suggestion: SearchSuggestion | HistorySuggestion) => {
      const query = isSearchSuggestion(suggestion) ? suggestion.suggestion : suggestion.query
      dispatch({ type: 'SET_QUERY', payload: query })
      dispatch({ type: 'SET_SHOW_SUGGESTIONS', payload: false })

      if (options?.onSuggestionSelect) {
        options.onSuggestionSelect(suggestion)
      }
      if (options?.onSearch) {
        options.onSearch(query)
      }
    },
    [options],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!state.showSuggestions || !state.suggestions) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          dispatch({ type: 'INCREMENT_SELECTED_INDEX' })
          break
        case 'ArrowUp':
          e.preventDefault()
          dispatch({ type: 'DECREMENT_SELECTED_INDEX' })
          break
        case 'Enter':
          e.preventDefault()
          if (state.selectedSuggestionIndex >= 0) {
            const selected = getSuggestionAtIndex(state.suggestions, state.selectedSuggestionIndex)
            if (selected) {
              handleSuggestionSelect(selected)
            }
          } else {
            handleSearch(state.query)
          }
          break
        case 'Escape':
          dispatch({ type: 'SET_SHOW_SUGGESTIONS', payload: false })
          break
        case 'Tab':
          if (state.selectedSuggestionIndex >= 0) {
            e.preventDefault()
            const selected = getSuggestionAtIndex(state.suggestions, state.selectedSuggestionIndex)
            if (selected) {
              const query = isSearchSuggestion(selected) ? selected.suggestion : selected.query
              dispatch({ type: 'SET_QUERY', payload: query })
            }
          }
          break
      }
    },
    [
      state.showSuggestions,
      state.suggestions,
      state.selectedSuggestionIndex,
      state.query,
      handleSearch,
      handleSuggestionSelect,
    ],
  )

  const handleFocus = useCallback(() => {
    dispatch({ type: 'SET_FOCUSED', payload: true })
    if (state.query.trim().length >= minQueryLength) {
      dispatch({ type: 'SET_SHOW_SUGGESTIONS', payload: true })
    }
  }, [state.query, minQueryLength])

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      dispatch({ type: 'SET_FOCUSED', payload: false })
      dispatch({ type: 'SET_SHOW_SUGGESTIONS', payload: false })
    }, 200)
  }, [])

  const clearQuery = useCallback(() => {
    dispatch({ type: 'RESET' })
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    return (): void => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return {
    query: state.query,
    isLoading: state.isLoading,
    isFocused: state.isFocused,
    showSuggestions: state.showSuggestions,
    suggestions: state.suggestions,
    selectedSuggestionIndex: state.selectedSuggestionIndex,
    inputRef,
    handleQueryChange,
    handleSearch,
    handleSuggestionSelect,
    handleKeyDown,
    handleFocus,
    handleBlur,
    clearQuery,
    dispatch,
  }
}

// =============================================================================
// Fuzzy Matching Utilities
// =============================================================================

function fuzzyMatch(query: string, text: string, options?: { threshold?: number }): boolean {
  const threshold = options?.threshold ?? 0.3
  const normalizedQuery = query.toLowerCase().trim()
  const normalizedText = text.toLowerCase().trim()

  if (normalizedQuery.length === 0) return true
  if (normalizedText.length === 0) return false
  if (normalizedText === normalizedQuery) return true
  if (normalizedText.includes(normalizedQuery)) return true
  if (normalizedText.startsWith(normalizedQuery)) return true

  let queryIndex = 0
  let matchedChars = 0

  for (let i = 0; i < normalizedText.length && queryIndex < normalizedQuery.length; i++) {
    if (normalizedText[i] === normalizedQuery[queryIndex]) {
      matchedChars++
      queryIndex++
    }
  }

  const score = matchedChars / normalizedQuery.length
  return score >= threshold
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0]![j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i]![j] = matrix[i - 1]![j - 1]!
      } else {
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j - 1]! + 1,
          matrix[i]![j - 1]! + 1,
          matrix[i - 1]![j]! + 1,
        )
      }
    }
  }

  return matrix[str2.length]![str1.length]!
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase()
  const s2 = str2.toLowerCase()

  if (s1 === s2) return 1
  if (s1.length === 0 || s2.length === 0) return 0

  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1
  const longerLength = longer.length
  if (longerLength === 0) return 1

  const distance = levenshteinDistance(longer, shorter)
  return (longerLength - distance) / longerLength
}

export function highlightMatch(text: string, query: string): { text: string; isMatch: boolean }[] {
  if (!query.trim()) {
    return [{ text, isMatch: false }]
  }

  const normalizedQuery = query.toLowerCase()
  const normalizedText = text.toLowerCase()
  const result: { text: string; isMatch: boolean }[] = []

  let lastIndex = 0
  let searchIndex = 0

  while (searchIndex < normalizedText.length) {
    const matchIndex = normalizedText.indexOf(normalizedQuery, searchIndex)

    if (matchIndex === -1) {
      if (lastIndex < text.length) {
        result.push({ text: text.substring(lastIndex), isMatch: false })
      }
      break
    }

    if (matchIndex > lastIndex) {
      result.push({ text: text.substring(lastIndex, matchIndex), isMatch: false })
    }

    result.push({
      text: text.substring(matchIndex, matchIndex + query.length),
      isMatch: true,
    })

    lastIndex = matchIndex + query.length
    searchIndex = lastIndex
  }

  return result
}

export { useSearchHistory, fuzzyMatch, calculateSimilarity }
