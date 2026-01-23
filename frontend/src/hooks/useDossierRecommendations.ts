/**
 * TanStack Query Hook: useDossierRecommendations
 * Feature: ai-dossier-recommendations
 *
 * Fetches proactive dossier recommendations based on pgvector similarity search
 * with support for interaction tracking and "Why recommended" explainability.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
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
// API Functions
// ============================================================================

async function getAuthToken(): Promise<string> {
  const { data: authData } = await supabase.auth.getSession()
  const token = authData.session?.access_token
  if (!token) {
    throw new Error('Authentication required')
  }
  return token
}

async function fetchDossierRecommendations(
  params: DossierRecommendationListParams,
): Promise<DossierRecommendationListResponse> {
  const token = await getAuthToken()

  const searchParams = new URLSearchParams()
  searchParams.set('source_dossier_id', params.source_dossier_id)

  if (params.limit) searchParams.set('limit', params.limit.toString())
  if (params.offset) searchParams.set('offset', params.offset.toString())
  if (params.status) {
    const statuses = Array.isArray(params.status) ? params.status : [params.status]
    searchParams.set('status', statuses.join(','))
  }
  if (params.min_similarity) {
    searchParams.set('min_similarity', params.min_similarity.toString())
  }
  if (params.include_expired) {
    searchParams.set('include_expired', 'true')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dossier-recommendations?${searchParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to fetch recommendations')
  }

  return response.json()
}

async function fetchDossierRecommendation(id: string): Promise<DossierRecommendation> {
  const token = await getAuthToken()

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dossier-recommendations/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to fetch recommendation')
  }

  return response.json()
}

async function updateDossierRecommendation(
  id: string,
  updates: DossierRecommendationUpdateParams,
): Promise<DossierRecommendation> {
  const token = await getAuthToken()

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dossier-recommendations/${id}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to update recommendation')
  }

  return response.json()
}

async function trackInteraction(
  params: TrackInteractionParams,
): Promise<{ message_en: string; message_ar: string }> {
  const token = await getAuthToken()

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dossier-recommendations/${params.recommendation_id}/interaction`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        interaction_type: params.interaction_type,
        feedback_text: params.feedback_text,
        context: params.context,
      }),
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to track interaction')
  }

  return response.json()
}

async function generateDossierRecommendations(
  params: GenerateDossierRecommendationsParams,
): Promise<GenerateDossierRecommendationsResponse> {
  const token = await getAuthToken()

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dossier-recommendations/generate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to generate recommendations')
  }

  return response.json()
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
    queryFn: () => fetchDossierRecommendations(params),
    enabled: enabled && !!sourceDossierId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  })
}

/**
 * Hook for fetching a single recommendation with full details
 */
export function useDossierRecommendation(id: string, enabled = true) {
  return useQuery({
    queryKey: dossierRecommendationKeys.detail(id),
    queryFn: () => fetchDossierRecommendation(id),
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
      updateDossierRecommendation(id, updates),
    onSuccess: (data, variables) => {
      // Update the specific recommendation in cache
      queryClient.setQueryData(dossierRecommendationKeys.detail(variables.id), data)

      // Invalidate lists to reflect the change
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
    mutationFn: trackInteraction,
    onSuccess: (_, variables) => {
      // If the interaction changes status (clicked/dismissed), invalidate queries
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
    mutationFn: generateDossierRecommendations,
    onSuccess: (_, variables) => {
      // Invalidate recommendations for this dossier
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
        fetchDossierRecommendations({
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
