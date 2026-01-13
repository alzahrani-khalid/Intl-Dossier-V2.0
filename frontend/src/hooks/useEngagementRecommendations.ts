/**
 * TanStack Query Hook: useEngagementRecommendations
 * Feature: predictive-engagement-recommendations
 *
 * Fetches AI-driven engagement recommendations with filtering, pagination,
 * and mutation support for accepting/dismissing recommendations.
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  EngagementRecommendationSummary,
  EngagementRecommendationListItem,
  RecommendationListParams,
  RecommendationListResponse,
  RecommendationStats,
  RecommendationUpdateParams,
  RecommendationFeedbackCreate,
  RecommendationFeedback,
  GenerateRecommendationsParams,
  GenerateRecommendationsResponse,
  RecommendationType,
  RecommendationUrgency,
  RecommendationStatus,
} from '@/types/engagement-recommendation.types'

// ============================================================================
// Query Key Factory
// ============================================================================

export const recommendationKeys = {
  all: ['engagement-recommendations'] as const,
  lists: () => [...recommendationKeys.all, 'list'] as const,
  list: (params: RecommendationListParams) => [...recommendationKeys.lists(), params] as const,
  details: () => [...recommendationKeys.all, 'detail'] as const,
  detail: (id: string) => [...recommendationKeys.details(), id] as const,
  stats: () => [...recommendationKeys.all, 'stats'] as const,
  infinite: (params: RecommendationListParams) =>
    [...recommendationKeys.all, 'infinite', params] as const,
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

async function fetchRecommendations(
  params: RecommendationListParams,
): Promise<RecommendationListResponse> {
  const token = await getAuthToken()

  const searchParams = new URLSearchParams()

  if (params.limit) searchParams.set('limit', params.limit.toString())
  if (params.offset) searchParams.set('offset', params.offset.toString())
  if (params.status) {
    const statuses = Array.isArray(params.status) ? params.status : [params.status]
    searchParams.set('status', statuses.join(','))
  }
  if (params.recommendation_type) {
    const types = Array.isArray(params.recommendation_type)
      ? params.recommendation_type
      : [params.recommendation_type]
    searchParams.set('recommendation_type', types.join(','))
  }
  if (params.urgency) {
    const urgencies = Array.isArray(params.urgency) ? params.urgency : [params.urgency]
    searchParams.set('urgency', urgencies.join(','))
  }
  if (params.min_priority) searchParams.set('min_priority', params.min_priority.toString())
  if (params.min_confidence) searchParams.set('min_confidence', params.min_confidence.toString())
  if (params.target_dossier_id) searchParams.set('target_dossier_id', params.target_dossier_id)
  if (params.relationship_id) searchParams.set('relationship_id', params.relationship_id)
  if (params.include_expired) searchParams.set('include_expired', 'true')
  if (params.sort_by) searchParams.set('sort_by', params.sort_by)
  if (params.sort_order) searchParams.set('sort_order', params.sort_order)

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/engagement-recommendations?${searchParams.toString()}`,
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

async function fetchRecommendation(id: string): Promise<EngagementRecommendationSummary> {
  const token = await getAuthToken()

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/engagement-recommendations/${id}`,
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

async function fetchRecommendationStats(): Promise<RecommendationStats> {
  const token = await getAuthToken()

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/engagement-recommendations/stats`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to fetch recommendation stats')
  }

  return response.json()
}

async function updateRecommendation(
  id: string,
  updates: RecommendationUpdateParams,
): Promise<EngagementRecommendationSummary> {
  const token = await getAuthToken()

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/engagement-recommendations/${id}`,
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

async function addFeedback(
  recommendationId: string,
  feedback: RecommendationFeedbackCreate,
): Promise<RecommendationFeedback> {
  const token = await getAuthToken()

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/engagement-recommendations/${recommendationId}/feedback`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedback),
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to add feedback')
  }

  return response.json()
}

async function generateRecommendations(
  params: GenerateRecommendationsParams = {},
): Promise<GenerateRecommendationsResponse> {
  const token = await getAuthToken()

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/engagement-recommendations/generate`,
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
 * Hook for fetching paginated engagement recommendations
 */
export function useEngagementRecommendations(params: RecommendationListParams = {}) {
  return useQuery({
    queryKey: recommendationKeys.list(params),
    queryFn: () => fetchRecommendations(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  })
}

/**
 * Hook for infinite scrolling recommendations
 */
export function useInfiniteRecommendations(params: Omit<RecommendationListParams, 'offset'> = {}) {
  const pageSize = params.limit || 20

  return useInfiniteQuery({
    queryKey: recommendationKeys.infinite(params),
    queryFn: ({ pageParam = 0 }) =>
      fetchRecommendations({ ...params, offset: pageParam, limit: pageSize }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.pagination.has_more) return undefined
      return allPages.length * pageSize
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })
}

/**
 * Hook for fetching a single recommendation with full details
 */
export function useEngagementRecommendation(id: string, enabled = true) {
  return useQuery({
    queryKey: recommendationKeys.detail(id),
    queryFn: () => fetchRecommendation(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })
}

/**
 * Hook for fetching recommendation statistics
 */
export function useRecommendationStats() {
  return useQuery({
    queryKey: recommendationKeys.stats(),
    queryFn: fetchRecommendationStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  })
}

/**
 * Hook for updating a recommendation (accept/dismiss)
 */
export function useUpdateRecommendation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: RecommendationUpdateParams }) =>
      updateRecommendation(id, updates),
    onSuccess: (data, variables) => {
      // Update the specific recommendation in cache
      queryClient.setQueryData(recommendationKeys.detail(variables.id), data)

      // Invalidate lists to reflect the change
      queryClient.invalidateQueries({ queryKey: recommendationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: recommendationKeys.stats() })
    },
  })
}

/**
 * Hook for accepting a recommendation
 */
export function useAcceptRecommendation() {
  const updateMutation = useUpdateRecommendation()

  return {
    ...updateMutation,
    mutate: (id: string, options?: { action_notes?: string; resulting_engagement_id?: string }) =>
      updateMutation.mutate({
        id,
        updates: {
          status: 'accepted',
          ...options,
        },
      }),
    mutateAsync: (
      id: string,
      options?: { action_notes?: string; resulting_engagement_id?: string },
    ) =>
      updateMutation.mutateAsync({
        id,
        updates: {
          status: 'accepted',
          ...options,
        },
      }),
  }
}

/**
 * Hook for dismissing a recommendation
 */
export function useDismissRecommendation() {
  const updateMutation = useUpdateRecommendation()

  return {
    ...updateMutation,
    mutate: (id: string, action_notes?: string) =>
      updateMutation.mutate({
        id,
        updates: {
          status: 'dismissed',
          action_notes,
        },
      }),
    mutateAsync: (id: string, action_notes?: string) =>
      updateMutation.mutateAsync({
        id,
        updates: {
          status: 'dismissed',
          action_notes,
        },
      }),
  }
}

/**
 * Hook for adding feedback to a recommendation
 */
export function useAddRecommendationFeedback() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      recommendationId,
      feedback,
    }: {
      recommendationId: string
      feedback: RecommendationFeedbackCreate
    }) => addFeedback(recommendationId, feedback),
    onSuccess: (_, variables) => {
      // Invalidate the specific recommendation to refresh feedback
      queryClient.invalidateQueries({
        queryKey: recommendationKeys.detail(variables.recommendationId),
      })
    },
  })
}

/**
 * Hook for generating new recommendations
 */
export function useGenerateRecommendations() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: generateRecommendations,
    onSuccess: () => {
      // Invalidate all recommendation queries to fetch new data
      queryClient.invalidateQueries({ queryKey: recommendationKeys.all })
    },
  })
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook for fetching high-priority pending recommendations
 */
export function useHighPriorityRecommendations(limit = 5) {
  return useEngagementRecommendations({
    status: ['pending', 'viewed'],
    min_priority: 4,
    sort_by: 'priority',
    sort_order: 'desc',
    limit,
  })
}

/**
 * Hook for fetching recommendations for a specific relationship
 */
export function useRelationshipRecommendations(relationshipId: string, enabled = true) {
  return useEngagementRecommendations({
    relationship_id: relationshipId,
    status: ['pending', 'viewed'],
    sort_by: 'priority',
    sort_order: 'desc',
  })
}

/**
 * Hook for fetching recommendations for a specific dossier
 */
export function useDossierRecommendations(dossierId: string, enabled = true) {
  return useEngagementRecommendations({
    target_dossier_id: dossierId,
    status: ['pending', 'viewed'],
    sort_by: 'priority',
    sort_order: 'desc',
  })
}

/**
 * Hook for fetching critical urgency recommendations
 */
export function useCriticalRecommendations(limit = 10) {
  return useEngagementRecommendations({
    urgency: 'critical',
    status: ['pending', 'viewed'],
    sort_by: 'created_at',
    sort_order: 'desc',
    limit,
  })
}

// ============================================================================
// Type Exports
// ============================================================================

export type {
  EngagementRecommendationSummary,
  EngagementRecommendationListItem,
  RecommendationListParams,
  RecommendationListResponse,
  RecommendationStats,
  RecommendationUpdateParams,
  RecommendationFeedbackCreate,
  RecommendationType,
  RecommendationUrgency,
  RecommendationStatus,
}
