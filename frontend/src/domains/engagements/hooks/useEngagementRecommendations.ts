/**
 * Engagement Recommendations Hook (Domain)
 * @module domains/engagements/hooks/useEngagementRecommendations
 *
 * TanStack Query hooks for AI-driven engagement recommendations.
 * Delegates API calls to engagements.repository.
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import * as engagementsRepo from '../repositories/engagements.repository'
import type {
  EngagementRecommendationSummary,
  EngagementRecommendationListItem,
  RecommendationListParams,
  RecommendationListResponse,
  RecommendationStats,
  RecommendationUpdateParams,
  RecommendationFeedbackCreate,
  GenerateRecommendationsParams,
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
// Hooks
// ============================================================================

export function useEngagementRecommendations(
  params: RecommendationListParams = {},
): ReturnType<typeof useQuery<RecommendationListResponse>> {
  return useQuery({
    queryKey: recommendationKeys.list(params),
    queryFn: () => engagementsRepo.getRecommendations(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })
}

export function useInfiniteRecommendations(
  params: Omit<RecommendationListParams, 'offset'> = {},
): ReturnType<typeof useInfiniteQuery> {
  const pageSize = params.limit || 20

  return useInfiniteQuery({
    queryKey: recommendationKeys.infinite(params),
    queryFn: ({ pageParam = 0 }) =>
      engagementsRepo.getRecommendations({ ...params, offset: pageParam as number, limit: pageSize }),
    getNextPageParam: (lastPage: RecommendationListResponse, allPages: RecommendationListResponse[]) => {
      if (!lastPage.pagination.has_more) return undefined
      return allPages.length * pageSize
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })
}

export function useEngagementRecommendation(
  id: string,
  enabled = true,
): ReturnType<typeof useQuery<EngagementRecommendationSummary>> {
  return useQuery({
    queryKey: recommendationKeys.detail(id),
    queryFn: () => engagementsRepo.getRecommendation(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })
}

export function useRecommendationStats(): ReturnType<typeof useQuery<RecommendationStats>> {
  return useQuery({
    queryKey: recommendationKeys.stats(),
    queryFn: engagementsRepo.getRecommendationStats,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })
}

export function useUpdateRecommendation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: RecommendationUpdateParams }) =>
      engagementsRepo.updateRecommendation(id, updates),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(recommendationKeys.detail(variables.id), data)
      queryClient.invalidateQueries({ queryKey: recommendationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: recommendationKeys.stats() })
    },
  })
}

export function useAcceptRecommendation(): {
  mutate: (id: string, options?: { action_notes?: string; resulting_engagement_id?: string }) => void
  mutateAsync: (id: string, options?: { action_notes?: string; resulting_engagement_id?: string }) => Promise<EngagementRecommendationSummary>
  isPending: boolean
  isError: boolean
  error: Error | null
} {
  const updateMutation = useUpdateRecommendation()

  return {
    ...updateMutation,
    mutate: (id: string, options?: { action_notes?: string; resulting_engagement_id?: string }) =>
      updateMutation.mutate({
        id,
        updates: { status: 'accepted', ...options },
      }),
    mutateAsync: (id: string, options?: { action_notes?: string; resulting_engagement_id?: string }) =>
      updateMutation.mutateAsync({
        id,
        updates: { status: 'accepted', ...options },
      }),
  } as ReturnType<typeof useAcceptRecommendation>
}

export function useDismissRecommendation(): {
  mutate: (id: string, action_notes?: string) => void
  mutateAsync: (id: string, action_notes?: string) => Promise<EngagementRecommendationSummary>
  isPending: boolean
  isError: boolean
  error: Error | null
} {
  const updateMutation = useUpdateRecommendation()

  return {
    ...updateMutation,
    mutate: (id: string, action_notes?: string) =>
      updateMutation.mutate({
        id,
        updates: { status: 'dismissed', action_notes },
      }),
    mutateAsync: (id: string, action_notes?: string) =>
      updateMutation.mutateAsync({
        id,
        updates: { status: 'dismissed', action_notes },
      }),
  } as ReturnType<typeof useDismissRecommendation>
}

export function useAddRecommendationFeedback() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      recommendationId,
      feedback,
    }: {
      recommendationId: string
      feedback: RecommendationFeedbackCreate
    }) => engagementsRepo.addRecommendationFeedback(recommendationId, feedback),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: recommendationKeys.detail(variables.recommendationId),
      })
    },
  })
}

export function useGenerateRecommendations() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: GenerateRecommendationsParams) =>
      engagementsRepo.generateRecommendations(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recommendationKeys.all })
    },
  })
}

// ============================================================================
// Utility Hooks
// ============================================================================

export function useHighPriorityRecommendations(
  limit = 5,
): ReturnType<typeof useQuery<RecommendationListResponse>> {
  return useEngagementRecommendations({
    status: ['pending', 'viewed'],
    min_priority: 4,
    sort_by: 'priority',
    sort_order: 'desc',
    limit,
  })
}

export function useRelationshipRecommendations(
  relationshipId: string,
  _enabled = true,
): ReturnType<typeof useQuery<RecommendationListResponse>> {
  return useEngagementRecommendations({
    relationship_id: relationshipId,
    status: ['pending', 'viewed'],
    sort_by: 'priority',
    sort_order: 'desc',
  })
}

export function useDossierRecommendations(
  dossierId: string,
  _enabled = true,
): ReturnType<typeof useQuery<RecommendationListResponse>> {
  return useEngagementRecommendations({
    target_dossier_id: dossierId,
    status: ['pending', 'viewed'],
    sort_by: 'priority',
    sort_order: 'desc',
  })
}

export function useCriticalRecommendations(
  limit = 10,
): ReturnType<typeof useQuery<RecommendationListResponse>> {
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
