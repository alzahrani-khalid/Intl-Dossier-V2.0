/**
 * Enhanced Search Hook
 * Feature: Enhanced search with real-time suggestions, fuzzy matching, search history
 * Description: TanStack Query hooks for intelligent search with suggestions and adaptive filters
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useReducer, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  type CategorizedSuggestions,
  type SearchHistoryItem,
  type FilterCount,
  type EnhancedSearchState,
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
// API Functions
// =============================================================================

async function fetchSuggestions(
  query: string,
  entityTypes: string[],
  limit: number = 10,
): Promise<CategorizedSuggestions> {
  const { data: session } = await supabase.auth.getSession()
  if (!session?.session?.access_token) {
    throw new Error('Not authenticated')
  }

  const params = new URLSearchParams({
    q: query,
    types: entityTypes.join(','),
    limit: limit.toString(),
    include_history: 'true',
  })

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-suggestions?${params}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch suggestions')
  }

  const data = await response.json()
  return data.suggestions
}

async function fetchSearchHistory(limit: number = 10): Promise<SearchHistoryItem[]> {
  const { data: session } = await supabase.auth.getSession()
  if (!session?.session?.access_token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-suggestions/history?limit=${limit}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch search history')
  }

  const data = await response.json()
  return data.history
}

async function addSearchToHistory(
  query: string,
  entityTypes: string[],
  resultCount: number,
  filters?: Record<string, unknown>,
): Promise<string> {
  const { data: session } = await supabase.auth.getSession()
  if (!session?.session?.access_token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-suggestions/history`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        query,
        entity_types: entityTypes,
        result_count: resultCount,
        filters,
      }),
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to add to history')
  }

  const data = await response.json()
  return data.history_id
}

async function clearSearchHistory(): Promise<number> {
  const { data: session } = await supabase.auth.getSession()
  if (!session?.session?.access_token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-suggestions/history`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${session.session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to clear history')
  }

  const data = await response.json()
  return data.deleted_count
}

async function fetchFilterCounts(
  cacheKey: string,
  entityTypes: string[],
  baseQuery?: string,
): Promise<FilterCount[]> {
  const { data: session } = await supabase.auth.getSession()
  if (!session?.session?.access_token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-suggestions/filter-counts`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        cache_key: cacheKey,
        entity_types: entityTypes,
        base_query: baseQuery,
        compute_if_missing: true,
      }),
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch filter counts')
  }

  const data = await response.json()
  return data.filter_counts
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
) {
  const minLength = options?.minQueryLength ?? 2
  const enabled = options?.enabled !== false && query.trim().length >= minLength

  return useQuery({
    queryKey: enhancedSearchKeys.suggestions(query, entityTypes),
    queryFn: () => fetchSuggestions(query, entityTypes),
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

/**
 * Hook for managing search history
 */
export function useSearchHistory(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient()

  const historyQuery = useQuery({
    queryKey: ['enhanced-search', 'history'],
    queryFn: () => fetchSearchHistory(20),
    enabled: options?.enabled !== false,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
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
      queryClient.invalidateQueries({ queryKey: ['enhanced-search', 'history'] })
    },
  })

  const clearHistoryMutation = useMutation({
    mutationFn: clearSearchHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-search', 'history'] })
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
) {
  return useQuery({
    queryKey: enhancedSearchKeys.filterCounts(cacheKey),
    queryFn: () => fetchFilterCounts(cacheKey, entityTypes, baseQuery),
    enabled: options?.enabled !== false && entityTypes.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes (matches server cache TTL)
    gcTime: 10 * 60 * 1000, // 10 minutes
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
) {
  const debounceMs = options?.debounceMs ?? 300
  const minQueryLength = options?.minQueryLength ?? 2

  const [state, dispatch] = useReducer(enhancedSearchReducer, defaultEnhancedSearchState)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch suggestions when query changes
  const {
    data: suggestions,
    isLoading: isLoadingSuggestions,
    isFetching: isFetchingSuggestions,
  } = useSearchSuggestions(state.query, entityTypes, {
    enabled: state.query.trim().length >= minQueryLength && state.isFocused,
    minQueryLength,
  })

  // Update suggestions in state when data changes
  useEffect(() => {
    if (suggestions) {
      dispatch({ type: 'SET_SUGGESTIONS', payload: suggestions })
    }
  }, [suggestions])

  // Update loading state
  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: isLoadingSuggestions || isFetchingSuggestions })
  }, [isLoadingSuggestions, isFetchingSuggestions])

  // Handle query change with debouncing
  const handleQueryChange = useCallback(
    (value: string) => {
      dispatch({ type: 'SET_QUERY', payload: value })

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Set new timer for showing suggestions
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

  // Handle search submission
  const handleSearch = useCallback(
    (query: string) => {
      dispatch({ type: 'SET_SHOW_SUGGESTIONS', payload: false })
      if (options?.onSearch) {
        options.onSearch(query)
      }
    },
    [options],
  )

  // Handle suggestion selection
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

  // Handle keyboard navigation
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

  // Handle focus
  const handleFocus = useCallback(() => {
    dispatch({ type: 'SET_FOCUSED', payload: true })
    if (state.query.trim().length >= minQueryLength) {
      dispatch({ type: 'SET_SHOW_SUGGESTIONS', payload: true })
    }
  }, [state.query, minQueryLength])

  // Handle blur
  const handleBlur = useCallback(() => {
    // Delay hiding to allow click on suggestions
    setTimeout(() => {
      dispatch({ type: 'SET_FOCUSED', payload: false })
      dispatch({ type: 'SET_SHOW_SUGGESTIONS', payload: false })
    }, 200)
  }, [])

  // Clear query
  const clearQuery = useCallback(() => {
    dispatch({ type: 'RESET' })
    inputRef.current?.focus()
  }, [])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return {
    // State
    query: state.query,
    isLoading: state.isLoading,
    isFocused: state.isFocused,
    showSuggestions: state.showSuggestions,
    suggestions: state.suggestions,
    selectedSuggestionIndex: state.selectedSuggestionIndex,

    // Refs
    inputRef,

    // Handlers
    handleQueryChange,
    handleSearch,
    handleSuggestionSelect,
    handleKeyDown,
    handleFocus,
    handleBlur,
    clearQuery,

    // Utilities
    dispatch,
  }
}

// =============================================================================
// Fuzzy Matching Utilities
// =============================================================================

/**
 * Simple fuzzy matching function for client-side filtering
 */
export function fuzzyMatch(query: string, text: string, options?: { threshold?: number }): boolean {
  const threshold = options?.threshold ?? 0.3
  const normalizedQuery = query.toLowerCase().trim()
  const normalizedText = text.toLowerCase().trim()

  if (normalizedQuery.length === 0) return true
  if (normalizedText.length === 0) return false

  // Exact match
  if (normalizedText === normalizedQuery) return true

  // Contains match
  if (normalizedText.includes(normalizedQuery)) return true

  // Starts with match
  if (normalizedText.startsWith(normalizedQuery)) return true

  // Fuzzy character matching
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

/**
 * Calculate similarity score between two strings (Levenshtein-based)
 */
export function calculateSimilarity(str1: string, str2: string): number {
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

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

/**
 * Highlight matched characters in text
 */
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
      // No more matches, add remaining text
      if (lastIndex < text.length) {
        result.push({ text: text.substring(lastIndex), isMatch: false })
      }
      break
    }

    // Add non-matching text before match
    if (matchIndex > lastIndex) {
      result.push({ text: text.substring(lastIndex, matchIndex), isMatch: false })
    }

    // Add matching text
    result.push({
      text: text.substring(matchIndex, matchIndex + query.length),
      isMatch: true,
    })

    lastIndex = matchIndex + query.length
    searchIndex = lastIndex
  }

  return result
}
