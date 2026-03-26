/**
 * Position Suggestions Hook (Domain)
 * @module domains/positions/hooks/usePositionSuggestions
 *
 * TanStack Query hook for AI-suggested positions for an engagement.
 * Delegates API calls to positions.repository.
 */

import { useQuery } from '@tanstack/react-query'
import * as positionsRepo from '../repositories/positions.repository'
import type {
  PositionSuggestion,
  SuggestionsMeta,
} from '../types'

export interface UsePositionSuggestionsOptions {
  engagementId: string
  minRelevance?: number
  limit?: number
  enabled?: boolean
}

export interface UsePositionSuggestionsResult {
  suggestions: PositionSuggestion[]
  meta: SuggestionsMeta | null
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

export function usePositionSuggestions(
  options: UsePositionSuggestionsOptions,
): UsePositionSuggestionsResult {
  const { engagementId, minRelevance = 0.7, limit = 10, enabled = true } = options

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['position-suggestions', engagementId, minRelevance, limit],
    queryFn: () =>
      positionsRepo.getPositionSuggestions({
        engagementId,
        minRelevance,
        limit,
      }),
    enabled: enabled && !!engagementId,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  })

  return {
    suggestions: data?.suggestions || [],
    meta: data?.meta || null,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  }
}
