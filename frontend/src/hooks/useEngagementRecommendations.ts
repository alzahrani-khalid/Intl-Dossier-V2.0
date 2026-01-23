/**
 * Engagement Recommendations Management Hooks
 * @module hooks/useEngagementRecommendations
 * @feature predictive-engagement-recommendations
 * @feature ai-recommendations-engine
 *
 * Comprehensive TanStack Query hooks for managing AI-driven engagement recommendations
 * with automatic caching, filtering, pagination, and user feedback.
 *
 * @description
 * This module provides a complete set of React hooks for engagement recommendation management:
 * - Query hooks for fetching lists, single recommendations, and statistics
 * - Infinite scrolling support for recommendation lists
 * - Mutation hooks for accepting/dismissing recommendations
 * - Feedback submission for improving AI recommendations
 * - Recommendation generation triggers
 * - Utility hooks for filtered views (high-priority, critical, relationship-specific)
 * - Automatic cache invalidation and optimistic updates
 *
 * The recommendation system uses AI to suggest timely diplomatic engagements based on:
 * - Historical engagement patterns
 * - Relationship health metrics
 * - Strategic priorities
 * - Recent events and interactions
 *
 * @example
 * // Fetch paginated recommendations
 * const { data } = useEngagementRecommendations({
 *   status: ['pending', 'viewed'],
 *   min_priority: 4,
 *   sort_by: 'priority',
 *   sort_order: 'desc',
 *   limit: 20,
 * });
 *
 * @example
 * // Fetch single recommendation
 * const { data } = useEngagementRecommendation('recommendation-uuid');
 *
 * @example
 * // Accept a recommendation
 * const { mutate } = useAcceptRecommendation();
 * mutate('recommendation-uuid', {
 *   action_notes: 'Scheduled for next month',
 *   resulting_engagement_id: 'engagement-uuid',
 * });
 *
 * @example
 * // Fetch high-priority pending recommendations
 * const { data } = useHighPriorityRecommendations(5);
 *
 * @example
 * // Generate new recommendations
 * const { mutate } = useGenerateRecommendations();
 * mutate({ min_priority: 3, urgency_threshold: 'high' });
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

/**
 * Query Keys Factory for engagement recommendation-related queries
 *
 * @description
 * Provides a hierarchical key structure for TanStack Query cache management.
 * Keys are structured to enable granular cache invalidation for recommendation
 * lists, details, statistics, and infinite scroll queries.
 *
 * @example
 * // Invalidate all recommendation queries
 * queryClient.invalidateQueries({ queryKey: recommendationKeys.all });
 *
 * @example
 * // Invalidate only list queries
 * queryClient.invalidateQueries({ queryKey: recommendationKeys.lists() });
 *
 * @example
 * // Invalidate specific recommendation detail
 * queryClient.invalidateQueries({ queryKey: recommendationKeys.detail('uuid') });
 *
 * @example
 * // Invalidate statistics
 * queryClient.invalidateQueries({ queryKey: recommendationKeys.stats() });
 */
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

/**
 * Helper function to get authentication token from Supabase session
 *
 * @description
 * Retrieves the current Supabase session access token for authenticated
 * API requests to Edge Functions. Throws error if no active session.
 *
 * @returns {Promise<string>} Access token
 * @throws {Error} Throws if no active session
 * @private
 */
async function getAuthToken(): Promise<string> {
  const { data: authData } = await supabase.auth.getSession()
  const token = authData.session?.access_token
  if (!token) {
    throw new Error('Authentication required')
  }
  return token
}

/**
 * Async function to fetch engagement recommendations from Edge Function
 *
 * @description
 * Performs an authenticated API request to fetch paginated recommendations
 * with optional filtering by status, type, urgency, priority, confidence,
 * dossier, relationship, and more. Supports sorting and pagination.
 *
 * @param {RecommendationListParams} params - Query parameters
 * @returns {Promise<RecommendationListResponse>} Recommendations list with pagination
 * @throws {Error} Throws if API request fails or authentication required
 * @private
 */
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

/**
 * Async function to fetch a single recommendation by ID
 *
 * @description
 * Performs an authenticated API request to fetch a single recommendation
 * with full details including rationale, signals, and metadata.
 *
 * @param {string} id - Recommendation UUID
 * @returns {Promise<EngagementRecommendationSummary>} Full recommendation details
 * @throws {Error} Throws if API request fails or recommendation not found
 * @private
 */
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

/**
 * Async function to fetch recommendation statistics
 *
 * @description
 * Performs an authenticated API request to fetch aggregated statistics
 * including counts by status, type, urgency, and average confidence scores.
 *
 * @returns {Promise<RecommendationStats>} Statistics object
 * @throws {Error} Throws if API request fails
 * @private
 */
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

/**
 * Async function to update a recommendation
 *
 * @description
 * Performs an authenticated API request to update a recommendation's status,
 * action notes, or resulting engagement. Used for accepting/dismissing recommendations.
 *
 * @param {string} id - Recommendation UUID
 * @param {RecommendationUpdateParams} updates - Update parameters
 * @returns {Promise<EngagementRecommendationSummary>} Updated recommendation
 * @throws {Error} Throws if API request fails
 * @private
 */
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

/**
 * Async function to add user feedback to a recommendation
 *
 * @description
 * Performs an authenticated API request to submit user feedback on a recommendation.
 * Feedback is used to improve the AI recommendation engine.
 *
 * @param {string} recommendationId - Recommendation UUID
 * @param {RecommendationFeedbackCreate} feedback - Feedback data
 * @returns {Promise<RecommendationFeedback>} Created feedback record
 * @throws {Error} Throws if API request fails
 * @private
 */
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

/**
 * Async function to trigger generation of new recommendations
 *
 * @description
 * Performs an authenticated API request to trigger the AI recommendation engine
 * to generate new engagement recommendations based on current system state.
 *
 * @param {GenerateRecommendationsParams} [params={}] - Generation parameters
 * @returns {Promise<GenerateRecommendationsResponse>} Generation result
 * @throws {Error} Throws if API request fails
 * @private
 */
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
 *
 * @description
 * Fetches a paginated list of AI-driven engagement recommendations with optional
 * filtering by status, type, urgency, priority, confidence, dossier, and relationship.
 * Results are cached for 5 minutes and can be sorted by various criteria.
 *
 * @param {RecommendationListParams} [params={}] - Query parameters
 * @returns {UseQueryResult<RecommendationListResponse>} TanStack Query result
 *
 * @example
 * // Fetch pending high-priority recommendations
 * const { data, isLoading } = useEngagementRecommendations({
 *   status: ['pending', 'viewed'],
 *   min_priority: 4,
 *   sort_by: 'priority',
 *   sort_order: 'desc',
 *   limit: 20,
 * });
 *
 * @example
 * // Fetch recommendations for a specific dossier
 * const { data } = useEngagementRecommendations({
 *   target_dossier_id: 'country-uuid',
 *   min_confidence: 0.7,
 * });
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
 *
 * @description
 * Fetches recommendations with infinite scroll support using TanStack Query's
 * useInfiniteQuery. Automatically handles pagination and "load more" functionality.
 *
 * @param {Omit<RecommendationListParams, 'offset'>} [params={}] - Query parameters (excluding offset)
 * @returns {UseInfiniteQueryResult<RecommendationListResponse>} TanStack Infinite Query result
 *
 * @example
 * // Infinite scroll for recommendations
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteRecommendations({
 *   status: 'pending',
 *   limit: 20,
 * });
 *
 * @example
 * // Load more button
 * <button onClick={() => fetchNextPage()} disabled={!hasNextPage || isFetchingNextPage}>
 *   {isFetchingNextPage ? 'Loading...' : hasNextPage ? 'Load More' : 'No more'}
 * </button>
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
 *
 * @description
 * Fetches a single engagement recommendation by ID with full details including
 * rationale, AI signals, metadata, and relationship context. Useful for detail pages.
 *
 * @param {string} id - Recommendation UUID
 * @param {boolean} [enabled=true] - Whether the query should run
 * @returns {UseQueryResult<EngagementRecommendationSummary>} TanStack Query result
 *
 * @example
 * // Fetch single recommendation
 * const { data, isLoading } = useEngagementRecommendation('recommendation-uuid');
 *
 * @example
 * // Conditional fetching
 * const { data } = useEngagementRecommendation(recommendationId, !!recommendationId);
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
 *
 * @description
 * Fetches aggregated statistics for engagement recommendations including counts
 * by status, type, urgency, and average confidence scores. Auto-refreshes every 5 minutes.
 *
 * @returns {UseQueryResult<RecommendationStats>} TanStack Query result with statistics
 *
 * @example
 * const { data: stats } = useRecommendationStats();
 * console.log(stats?.pending_count); // Number of pending recommendations
 * console.log(stats?.average_confidence); // Average confidence score
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
 *
 * @description
 * Updates a recommendation's status, action notes, or resulting engagement.
 * On success, updates the cache and invalidates list/stats queries.
 *
 * @returns {UseMutationResult} TanStack Mutation result
 *
 * @example
 * const { mutate } = useUpdateRecommendation();
 * mutate({
 *   id: 'recommendation-uuid',
 *   updates: {
 *     status: 'accepted',
 *     action_notes: 'Scheduled for Q2',
 *     resulting_engagement_id: 'engagement-uuid',
 *   },
 * });
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
 *
 * @description
 * Convenience hook that wraps useUpdateRecommendation to accept a recommendation
 * with optional action notes and resulting engagement ID.
 *
 * @returns {Object} Mutation object with custom mutate/mutateAsync signatures
 *
 * @example
 * const { mutate } = useAcceptRecommendation();
 * mutate('recommendation-uuid', {
 *   action_notes: 'Scheduled for June',
 *   resulting_engagement_id: 'engagement-uuid',
 * });
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
 *
 * @description
 * Convenience hook that wraps useUpdateRecommendation to dismiss a recommendation
 * with optional action notes.
 *
 * @returns {Object} Mutation object with custom mutate/mutateAsync signatures
 *
 * @example
 * const { mutate } = useDismissRecommendation();
 * mutate('recommendation-uuid', 'Not relevant at this time');
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
 *
 * @description
 * Submits user feedback on a recommendation to help improve the AI recommendation engine.
 * On success, invalidates the specific recommendation query to refresh feedback data.
 *
 * @returns {UseMutationResult} TanStack Mutation result
 *
 * @example
 * const { mutate } = useAddRecommendationFeedback();
 * mutate({
 *   recommendationId: 'recommendation-uuid',
 *   feedback: {
 *     is_helpful: true,
 *     feedback_text: 'Very timely and relevant suggestion',
 *     accuracy_score: 5,
 *   },
 * });
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
 *
 * @description
 * Triggers the AI recommendation engine to generate new engagement recommendations
 * based on current system state. On success, invalidates all recommendation queries
 * to fetch newly generated recommendations.
 *
 * @returns {UseMutationResult} TanStack Mutation result
 *
 * @example
 * const { mutate, isPending } = useGenerateRecommendations();
 * mutate({ min_priority: 3, urgency_threshold: 'high' });
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
 *
 * @description
 * Convenience hook that fetches pending/viewed recommendations with minimum
 * priority of 4, sorted by priority descending. Useful for dashboard widgets.
 *
 * @param {number} [limit=5] - Number of recommendations to fetch
 * @returns {UseQueryResult<RecommendationListResponse>} TanStack Query result
 *
 * @example
 * const { data } = useHighPriorityRecommendations(5);
 * // Returns top 5 high-priority pending recommendations
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
 *
 * @description
 * Convenience hook that fetches pending/viewed recommendations for a specific
 * dossier relationship, sorted by priority. Useful for relationship detail pages.
 *
 * @param {string} relationshipId - Relationship UUID
 * @param {boolean} [enabled=true] - Whether the query should run
 * @returns {UseQueryResult<RecommendationListResponse>} TanStack Query result
 *
 * @example
 * const { data } = useRelationshipRecommendations('relationship-uuid');
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
 *
 * @description
 * Convenience hook that fetches pending/viewed recommendations for a specific
 * dossier (country, organization, etc.), sorted by priority. Useful for dossier detail pages.
 *
 * @param {string} dossierId - Dossier UUID
 * @param {boolean} [enabled=true] - Whether the query should run
 * @returns {UseQueryResult<RecommendationListResponse>} TanStack Query result
 *
 * @example
 * const { data } = useDossierRecommendations('country-uuid');
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
 *
 * @description
 * Convenience hook that fetches pending/viewed recommendations with critical urgency,
 * sorted by creation date descending. Useful for urgent notifications and alerts.
 *
 * @param {number} [limit=10] - Number of recommendations to fetch
 * @returns {UseQueryResult<RecommendationListResponse>} TanStack Query result
 *
 * @example
 * const { data } = useCriticalRecommendations(10);
 * // Returns up to 10 critical urgency recommendations
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
