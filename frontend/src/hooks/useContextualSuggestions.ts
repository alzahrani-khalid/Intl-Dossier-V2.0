/**
 * Contextual Suggestions Hook
 * Feature: intelligent-empty-states
 *
 * TanStack Query hook for fetching contextually relevant suggestions
 * based on current date, upcoming events, and organizational calendar.
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  ContextualSuggestion,
  ContextualSuggestionsParams,
  ContextualSuggestionsResponse,
  SuggestionContext,
} from '@/types/contextual-suggestion.types'

// API Base URL
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

// ============================================================================
// Query Keys
// ============================================================================

export const contextualSuggestionKeys = {
  all: ['contextual-suggestions'] as const,
  list: (params?: ContextualSuggestionsParams) =>
    [...contextualSuggestionKeys.all, params] as const,
  context: (context: SuggestionContext) =>
    [...contextualSuggestionKeys.all, 'context', context] as const,
}

// ============================================================================
// Auth Helper
// ============================================================================

const getAuthHeaders = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token}`,
  }
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Hook to fetch contextually relevant suggestions for empty states
 *
 * @param params - Parameters to filter suggestions
 * @param options - TanStack Query options
 * @returns Query result with suggestions
 *
 * @example
 * // Dashboard empty state
 * const { data, isLoading } = useContextualSuggestions({
 *   context: 'dashboard',
 *   limit: 5
 * })
 *
 * @example
 * // Engagement list empty state
 * const { data } = useContextualSuggestions({
 *   context: 'engagement',
 *   include_low_priority: true
 * })
 */
export function useContextualSuggestions(
  params?: ContextualSuggestionsParams,
  options?: Omit<UseQueryOptions<ContextualSuggestionsResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: contextualSuggestionKeys.list(params),
    queryFn: async (): Promise<ContextualSuggestionsResponse> => {
      const headers = await getAuthHeaders()
      const searchParams = new URLSearchParams()

      if (params?.context) searchParams.set('context', params.context)
      if (params?.entity_type) searchParams.set('entity_type', params.entity_type)
      if (params?.entity_id) searchParams.set('entity_id', params.entity_id)
      if (params?.limit) searchParams.set('limit', String(params.limit))
      if (params?.include_low_priority) searchParams.set('include_low_priority', 'true')
      if (params?.reference_date) searchParams.set('reference_date', params.reference_date)

      const response = await fetch(`${API_BASE_URL}/contextual-suggestions?${searchParams}`, {
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message_en || 'Failed to fetch suggestions')
      }

      return response.json()
    },
    staleTime: 5 * 60_000, // 5 minutes - suggestions don't change frequently
    gcTime: 15 * 60_000, // 15 minutes cache
    refetchOnWindowFocus: false,
    ...options,
  })
}

// ============================================================================
// Specialized Hooks
// ============================================================================

/**
 * Hook for dashboard contextual suggestions
 */
export function useDashboardSuggestions(
  options?: Omit<UseQueryOptions<ContextualSuggestionsResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  return useContextualSuggestions({ context: 'dashboard', limit: 5 }, options)
}

/**
 * Hook for calendar empty state suggestions
 */
export function useCalendarSuggestions(
  options?: Omit<UseQueryOptions<ContextualSuggestionsResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  return useContextualSuggestions({ context: 'calendar', limit: 4 }, options)
}

/**
 * Hook for engagement list suggestions
 */
export function useEngagementSuggestions(
  options?: Omit<UseQueryOptions<ContextualSuggestionsResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  return useContextualSuggestions({ context: 'engagement', limit: 3 }, options)
}

/**
 * Hook for commitment list suggestions
 */
export function useCommitmentSuggestions(
  options?: Omit<UseQueryOptions<ContextualSuggestionsResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  return useContextualSuggestions({ context: 'commitment', limit: 3 }, options)
}

/**
 * Hook for dossier detail suggestions
 */
export function useDossierSuggestions(
  dossierId: string,
  options?: Omit<UseQueryOptions<ContextualSuggestionsResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  return useContextualSuggestions(
    { context: 'dossier', entity_type: 'dossier', entity_id: dossierId, limit: 3 },
    { ...options, enabled: !!dossierId && options?.enabled !== false },
  )
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the highest priority suggestion from a list
 */
export function getTopSuggestion(
  suggestions: ContextualSuggestion[],
): ContextualSuggestion | undefined {
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  return [...suggestions].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])[0]
}

/**
 * Filter suggestions by category
 */
export function filterSuggestionsByCategory(
  suggestions: ContextualSuggestion[],
  category: ContextualSuggestion['category'],
): ContextualSuggestion[] {
  return suggestions.filter((s) => s.category === category)
}

/**
 * Check if there are any urgent suggestions
 */
export function hasUrgentSuggestions(suggestions: ContextualSuggestion[]): boolean {
  return suggestions.some(
    (s) => s.priority === 'high' || (s.days_until_event !== undefined && s.days_until_event <= 7),
  )
}

/**
 * Group suggestions by category
 */
export function groupSuggestionsByCategory(
  suggestions: ContextualSuggestion[],
): Record<ContextualSuggestion['category'], ContextualSuggestion[]> {
  return suggestions.reduce(
    (acc, suggestion) => {
      if (!acc[suggestion.category]) {
        acc[suggestion.category] = []
      }
      acc[suggestion.category].push(suggestion)
      return acc
    },
    {} as Record<ContextualSuggestion['category'], ContextualSuggestion[]>,
  )
}
