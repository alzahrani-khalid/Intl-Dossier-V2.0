/**
 * Contextual Suggestions Hook
 * @module domains/tags/hooks/useContextualSuggestions
 *
 * Hook for fetching contextual suggestions based on entity context.
 * API calls delegated to tags.repository.
 */

import { useQuery } from '@tanstack/react-query'
import { getContextualSuggestions } from '../repositories/tags.repository'

export const suggestionKeys = {
  all: ['contextual-suggestions'] as const,
  forEntity: (entityType: string, entityId: string) =>
    [...suggestionKeys.all, entityType, entityId] as const,
}

import type { ContextualSuggestion } from '@/types/contextual-suggestion.types'

export function hasUrgentSuggestions(suggestions: ContextualSuggestion[]): boolean {
  return suggestions.some((s) => s.priority === 'high')
}

export function useContextualSuggestions(params: {
  entityType: string
  entityId: string
  field?: string
  context?: string
  enabled?: boolean
}): ReturnType<typeof useQuery> {
  const searchParams = new URLSearchParams()
  searchParams.set('entity_type', params.entityType)
  searchParams.set('entity_id', params.entityId)
  if (params.field) searchParams.set('field', params.field)
  if (params.context) searchParams.set('context', params.context)

  return useQuery({
    queryKey: suggestionKeys.forEntity(params.entityType, params.entityId),
    queryFn: () => getContextualSuggestions(searchParams),
    enabled: params.enabled !== false && Boolean(params.entityType) && Boolean(params.entityId),
    staleTime: 60 * 1000,
  })
}
