/**
 * No-Results Suggestions Hook
 * Feature: Intelligent search suggestions when search returns no results
 * Description: TanStack Query hook for fetching typo corrections, related terms,
 *              popular searches, recent content, and entity creation suggestions
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { NoResultsSuggestions, CreateEntitySuggestion } from '@/types/enhanced-search.types'

// =============================================================================
// Query Keys
// =============================================================================

export const noResultsKeys = {
  all: ['no-results-suggestions'] as const,
  suggestions: (query: string, entityTypes: string[]) =>
    [...noResultsKeys.all, 'suggestions', query, entityTypes] as const,
}

// =============================================================================
// API Functions
// =============================================================================

async function fetchNoResultsSuggestions(
  query: string,
  entityTypes: string[],
  language: string,
): Promise<NoResultsSuggestions> {
  const { data: session } = await supabase.auth.getSession()
  if (!session?.session?.access_token) {
    throw new Error('Not authenticated')
  }

  const params = new URLSearchParams({
    q: query,
    types: entityTypes.join(','),
    lang: language,
  })

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-suggestions/no-results?${params}`,
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
    throw new Error(error.message || 'Failed to fetch no-results suggestions')
  }

  return response.json()
}

// =============================================================================
// Hooks
// =============================================================================

export interface UseNoResultsSuggestionsOptions {
  /** Enable/disable the query */
  enabled?: boolean
  /** Current language for localized content */
  language?: string
}

/**
 * Hook for fetching intelligent suggestions when search returns no results
 *
 * @example
 * ```tsx
 * const {
 *   data: suggestions,
 *   isLoading,
 *   error
 * } = useNoResultsSuggestions('saud', ['dossier', 'country'], {
 *   enabled: searchResults.length === 0,
 *   language: 'en'
 * });
 *
 * // Use suggestions to help user
 * if (suggestions?.typo_corrections.length > 0) {
 *   // Show "Did you mean: Saudi Arabia?"
 * }
 * ```
 */
export function useNoResultsSuggestions(
  query: string,
  entityTypes: string[],
  options?: UseNoResultsSuggestionsOptions,
) {
  const language = options?.language ?? 'en'
  const enabled = options?.enabled !== false && query.trim().length >= 2

  return useQuery({
    queryKey: noResultsKeys.suggestions(query, entityTypes),
    queryFn: () => fetchNoResultsSuggestions(query, entityTypes, language),
    enabled,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

// =============================================================================
// Helper Hooks
// =============================================================================

/**
 * Hook for building navigation routes for create entity suggestions
 */
export function useCreateEntityRoute(suggestion?: CreateEntitySuggestion): string | null {
  if (!suggestion) return null

  const baseRoute = suggestion.route
  const params = new URLSearchParams(suggestion.prefill_params || {})
  const queryString = params.toString()

  return queryString
    ? `${baseRoute}${baseRoute.includes('?') ? '&' : '?'}${queryString}`
    : baseRoute
}

/**
 * Format entity type for display
 */
export function formatEntityTypeLabel(entityType: string, language: string): string {
  const labels: Record<string, { en: string; ar: string }> = {
    dossier: { en: 'Dossier', ar: 'ملف' },
    country: { en: 'Country', ar: 'دولة' },
    organization: { en: 'Organization', ar: 'منظمة' },
    forum: { en: 'Forum', ar: 'منتدى' },
    theme: { en: 'Theme', ar: 'موضوع' },
    engagement: { en: 'Engagement', ar: 'ارتباط' },
    position: { en: 'Position', ar: 'موقف' },
    document: { en: 'Document', ar: 'مستند' },
    person: { en: 'Person', ar: 'شخص' },
  }

  const label = labels[entityType]
  if (!label) return entityType

  return language === 'ar' ? label.ar : label.en
}

export default useNoResultsSuggestions
