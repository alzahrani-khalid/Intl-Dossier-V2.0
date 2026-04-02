/**
 * Lifecycle Hooks (Domain)
 * @module domains/engagements/hooks/useLifecycle
 *
 * TanStack Query hooks for engagement lifecycle operations:
 * - Stage transitions with audit trail
 * - Transition history queries
 * - Intake ticket promotion to engagements
 * - Forum session creation and listing
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  transitionLifecycleStage,
  getLifecycleHistory,
  promoteIntakeToEngagement,
  createForumSession,
  getForumSessions,
} from '../repositories/engagements.repository'
import { engagementKeys } from './useEngagements'
import type {
  LifecycleTransition,
  LifecycleTransitionRequest,
  IntakePromotionRequest,
  IntakePromotionResponse,
  ForumSessionCreateRequest,
} from '@/types/lifecycle.types'
import type {
  EngagementFullProfile,
  EngagementListResponse,
} from '@/types/engagement.types'

// ============================================================================
// Query Keys
// ============================================================================

export const lifecycleKeys = {
  all: ['lifecycle'] as const,
  history: (engagementId: string) =>
    [...engagementKeys.all, engagementId, 'lifecycle'] as const,
  forumSessions: (forumId: string) =>
    [...engagementKeys.all, 'forum-sessions', forumId] as const,
}

// ============================================================================
// useLifecycleHistory
// ============================================================================

/**
 * Fetches the lifecycle transition history for an engagement.
 */
export function useLifecycleHistory(
  engagementId: string,
): UseQueryResult<LifecycleTransition[], Error> {
  return useQuery({
    queryKey: lifecycleKeys.history(engagementId),
    queryFn: async (): Promise<LifecycleTransition[]> => {
      return getLifecycleHistory(engagementId)
    },
    enabled: !!engagementId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}

// ============================================================================
// useLifecycleTransition
// ============================================================================

/**
 * Mutation hook for transitioning an engagement's lifecycle stage.
 */
export function useLifecycleTransition(
  engagementId: string,
): UseMutationResult<
  { lifecycle_stage: string; transition_id: string },
  Error,
  LifecycleTransitionRequest
> {
  const queryClient = useQueryClient()
  const { t } = useTranslation('lifecycle')

  return useMutation({
    mutationFn: async (
      data: LifecycleTransitionRequest,
    ): Promise<{ lifecycle_stage: string; transition_id: string }> => {
      return transitionLifecycleStage(engagementId, data)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: engagementKeys.detail(engagementId),
      })
      void queryClient.invalidateQueries({
        queryKey: lifecycleKeys.history(engagementId),
      })
      toast.success(t('messages.transitionSuccess', 'Stage transition successful'))
    },
    onError: (error: Error) => {
      toast.error(
        t('messages.transitionError', {
          error: error.message,
          defaultValue: 'Failed to transition stage',
        }),
      )
    },
  })
}

// ============================================================================
// usePromoteIntake
// ============================================================================

/**
 * Mutation hook for promoting an intake ticket to an engagement.
 */
export function usePromoteIntake(): UseMutationResult<
  IntakePromotionResponse,
  Error,
  IntakePromotionRequest
> {
  const queryClient = useQueryClient()
  const { t } = useTranslation('lifecycle')

  return useMutation({
    mutationFn: async (
      data: IntakePromotionRequest,
    ): Promise<IntakePromotionResponse> => {
      return promoteIntakeToEngagement(data)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['intake'] })
      void queryClient.invalidateQueries({ queryKey: engagementKeys.lists() })
      toast.success(t('messages.promotionSuccess', 'Intake promoted to engagement'))
    },
    onError: (error: Error) => {
      toast.error(
        t('messages.promotionError', {
          error: error.message,
          defaultValue: 'Failed to promote intake',
        }),
      )
    },
  })
}

// ============================================================================
// useCreateForumSession
// ============================================================================

/**
 * Mutation hook for creating a forum session engagement.
 */
export function useCreateForumSession(): UseMutationResult<
  EngagementFullProfile,
  Error,
  ForumSessionCreateRequest
> {
  const queryClient = useQueryClient()
  const { t } = useTranslation('lifecycle')

  return useMutation({
    mutationFn: async (
      data: ForumSessionCreateRequest,
    ): Promise<EngagementFullProfile> => {
      return createForumSession(data)
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: engagementKeys.lists() })
      void queryClient.invalidateQueries({
        queryKey: lifecycleKeys.forumSessions(variables.parent_forum_id),
      })
      toast.success(t('messages.forumSessionCreated', 'Forum session created'))
    },
    onError: (error: Error) => {
      toast.error(
        t('messages.forumSessionCreateError', {
          error: error.message,
          defaultValue: 'Failed to create forum session',
        }),
      )
    },
  })
}

// ============================================================================
// useForumSessions
// ============================================================================

/**
 * Fetches all forum sessions for a given parent forum.
 */
export function useForumSessions(
  forumId: string,
): UseQueryResult<EngagementListResponse, Error> {
  return useQuery({
    queryKey: lifecycleKeys.forumSessions(forumId),
    queryFn: async (): Promise<EngagementListResponse> => {
      return getForumSessions(forumId)
    },
    enabled: !!forumId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}
