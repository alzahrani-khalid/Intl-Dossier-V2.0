/**
 * TanStack Query Hook: useDossierRecommendations (Domain)
 * Feature: ai-dossier-recommendations
 *
 * Fetches proactive dossier recommendations based on pgvector similarity search.
 * Delegates all API calls to dossiers.repository.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as dossiersRepo from '../repositories/dossiers.repository'
import type {
  DossierRecommendation,
  DossierRecommendationListItem,
  DossierRecommendationListParams,
  DossierRecommendationListResponse,
  DossierRecommendationUpdateParams,
  GenerateDossierRecommendationsParams,
  GenerateDossierRecommendationsResponse,
  TrackInteractionParams,
  RecommendationInteractionType,
} from '@/types/dossier-recommendation.types'

// ============================================================================
// Query Key Factory
// ============================================================================

export const dossierRecommendationKeys = {
  all: ['dossier-recommendations'] as const,
  lists: () => [...dossierRecommendationKeys.all, 'list'] as const,
  list: (params: DossierRecommendationListParams) =>
    [...dossierRecommendationKeys.lists(), params] as const,
  details: () => [...dossierRecommendationKeys.all, 'detail'] as const,
  detail: (id: string) => [...dossierRecommendationKeys.details(), id] as const,
  forDossier: (dossierId: string) =>
    [...dossierRecommendationKeys.all, 'forDossier', dossierId] as const,
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook for fetching dossier recommendations for a specific source dossier
 */
export function useDossierRecommendations(
  sourceDossierId: string,
  options: Omit<DossierRecommendationListParams, 'source_dossier_id'> = {},
  enabled = true,
) {
  const params: DossierRecommendationListParams = {
    source_dossier_id: sourceDossierId,
    ...options,
  }

  return useQuery({
    queryKey: dossierRecommendationKeys.forDossier(sourceDossierId),
    queryFn: () => dossiersRepo.getDossierRecommendations(params),
    enabled: enabled && !!sourceDossierId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })
}

/**
 * Hook for fetching a single recommendation with full details
 */
export function useDossierRecommendation(id: string, enabled = true) {
  return useQuery({
    queryKey: dossierRecommendationKeys.detail(id),
    queryFn: () => dossiersRepo.getDossierRecommendation(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })
}

/**
 * Hook for updating a recommendation status
 */
export function useUpdateDossierRecommendation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: DossierRecommendationUpdateParams }) =>
      dossiersRepo.updateDossierRecommendation(id, updates),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(dossierRecommendationKeys.detail(variables.id), data)
      queryClient.invalidateQueries({ queryKey: dossierRecommendationKeys.lists() })
    },
  })
}

/**
 * Hook for tracking user interactions with recommendations
 */
export function useTrackRecommendationInteraction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: TrackInteractionParams) =>
      dossiersRepo.trackRecommendationInteraction(params),
    onSuccess: (_, variables) => {
      if (variables.interaction_type === 'clicked' || variables.interaction_type === 'dismissed') {
        queryClient.invalidateQueries({
          queryKey: dossierRecommendationKeys.detail(variables.recommendation_id),
        })
        queryClient.invalidateQueries({ queryKey: dossierRecommendationKeys.lists() })
      }
    },
  })
}

/**
 * Hook for accepting/clicking a recommendation
 */
export function useAcceptDossierRecommendation() {
  const trackMutation = useTrackRecommendationInteraction()

  return {
    ...trackMutation,
    mutate: (recommendationId: string, context?: Record<string, unknown>) =>
      trackMutation.mutate({
        recommendation_id: recommendationId,
        interaction_type: 'clicked',
        context,
      }),
    mutateAsync: (recommendationId: string, context?: Record<string, unknown>) =>
      trackMutation.mutateAsync({
        recommendation_id: recommendationId,
        interaction_type: 'clicked',
        context,
      }),
  }
}

/**
 * Hook for dismissing a recommendation
 */
export function useDismissDossierRecommendation() {
  const trackMutation = useTrackRecommendationInteraction()

  return {
    ...trackMutation,
    mutate: (recommendationId: string, feedbackText?: string) =>
      trackMutation.mutate({
        recommendation_id: recommendationId,
        interaction_type: 'dismissed',
        feedback_text: feedbackText,
      }),
    mutateAsync: (recommendationId: string, feedbackText?: string) =>
      trackMutation.mutateAsync({
        recommendation_id: recommendationId,
        interaction_type: 'dismissed',
        feedback_text: feedbackText,
      }),
  }
}

/**
 * Hook for tracking "Why recommended" expansion
 */
export function useTrackWhyRecommendedExpand() {
  const trackMutation = useTrackRecommendationInteraction()

  return {
    ...trackMutation,
    mutate: (recommendationId: string) =>
      trackMutation.mutate({
        recommendation_id: recommendationId,
        interaction_type: 'expanded',
      }),
    mutateAsync: (recommendationId: string) =>
      trackMutation.mutateAsync({
        recommendation_id: recommendationId,
        interaction_type: 'expanded',
      }),
  }
}

/**
 * Hook for submitting feedback on a recommendation
 */
export function useSubmitRecommendationFeedback() {
  const trackMutation = useTrackRecommendationInteraction()

  return {
    ...trackMutation,
    mutate: (recommendationId: string, isPositive: boolean, feedbackText?: string) =>
      trackMutation.mutate({
        recommendation_id: recommendationId,
        interaction_type: isPositive ? 'feedback_positive' : 'feedback_negative',
        feedback_text: feedbackText,
      }),
    mutateAsync: (recommendationId: string, isPositive: boolean, feedbackText?: string) =>
      trackMutation.mutateAsync({
        recommendation_id: recommendationId,
        interaction_type: isPositive ? 'feedback_positive' : 'feedback_negative',
        feedback_text: feedbackText,
      }),
  }
}

/**
 * Hook for generating new recommendations for a dossier
 */
export function useGenerateDossierRecommendations() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: GenerateDossierRecommendationsParams) =>
      dossiersRepo.generateDossierRecommendations(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: dossierRecommendationKeys.forDossier(variables.source_dossier_id),
      })
    },
  })
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook for fetching high-priority recommendations for a dossier
 */
export function useHighPriorityDossierRecommendations(sourceDossierId: string, enabled = true) {
  return useDossierRecommendations(
    sourceDossierId,
    {
      status: ['pending', 'viewed'],
      min_similarity: 0.8,
      limit: 5,
    },
    enabled,
  )
}

/**
 * Hook for prefetching recommendations when hovering over a dossier
 */
export function usePrefetchDossierRecommendations() {
  const queryClient = useQueryClient()

  return (dossierId: string) => {
    queryClient.prefetchQuery({
      queryKey: dossierRecommendationKeys.forDossier(dossierId),
      queryFn: () =>
        dossiersRepo.getDossierRecommendations({
          source_dossier_id: dossierId,
          limit: 5,
          status: ['pending', 'viewed'],
        }),
      staleTime: 5 * 60 * 1000,
    })
  }
}

// ============================================================================
// Type Exports
// ============================================================================

export type {
  DossierRecommendation,
  DossierRecommendationListItem,
  DossierRecommendationListParams,
  DossierRecommendationListResponse,
  DossierRecommendationUpdateParams,
  GenerateDossierRecommendationsParams,
  GenerateDossierRecommendationsResponse,
  TrackInteractionParams,
  RecommendationInteractionType,
}
