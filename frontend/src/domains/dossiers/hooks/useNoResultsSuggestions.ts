/**
 * No-Results Suggestions Hook (Domain)
 * Feature: Intelligent search suggestions when search returns no results
 *
 * Delegates API calls to dossiers.repository.
 */

import { useQuery } from '@tanstack/react-query'
import * as dossiersRepo from '../repositories/dossiers.repository'
import type { CreateEntitySuggestion } from '@/types/enhanced-search.types'

// =============================================================================
// Query Keys
// =============================================================================

export const noResultsKeys = {
  all: ['no-results-suggestions'] as const,
  suggestions: (query: string, entityTypes: string[]) =>
    [...noResultsKeys.all, 'suggestions', query, entityTypes] as const,
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
 * Hook for fetching intelligent suggestions when search returns no results.
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
    queryFn: () => dossiersRepo.getNoResultsSuggestions(query, entityTypes, language),
    enabled,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
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
    dossier: { en: 'Dossier', ar: '\u0645\u0644\u0641' },
    country: { en: 'Country', ar: '\u062F\u0648\u0644\u0629' },
    organization: { en: 'Organization', ar: '\u0645\u0646\u0638\u0645\u0629' },
    forum: { en: 'Forum', ar: '\u0645\u0646\u062A\u062F\u0649' },
    theme: { en: 'Theme', ar: '\u0645\u0648\u0636\u0648\u0639' },
    engagement: { en: 'Engagement', ar: '\u0627\u0631\u062A\u0628\u0627\u0637' },
    position: { en: 'Position', ar: '\u0645\u0648\u0642\u0641' },
    document: { en: 'Document', ar: '\u0645\u0633\u062A\u0646\u062F' },
    person: { en: 'Person', ar: '\u0634\u062E\u0635' },
  }

  const label = labels[entityType]
  if (!label) return entityType

  return language === 'ar' ? label.ar : label.en
}

export default useNoResultsSuggestions
