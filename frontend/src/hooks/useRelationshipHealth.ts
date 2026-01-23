/**
 * Relationship Health Hooks
 * @module hooks/useRelationshipHealth
 * @feature relationship-health-scoring
 *
 * TanStack Query hooks for fetching and managing relationship health scores and alerts.
 *
 * @description
 * This module provides comprehensive hooks for relationship health monitoring:
 * - Query hooks for health scores, history, and alerts
 * - Mutation hooks for triggering calculations and managing alerts
 * - Utility hooks for statistics and filtered views
 * - Automatic caching and real-time updates
 *
 * Health scoring includes metrics for:
 * - Engagement frequency and recency
 * - Document activity and collaboration
 * - Commitment fulfillment
 * - Overall trend analysis (improving/declining/stable)
 *
 * @example
 * // Fetch health score for a relationship
 * const { data } = useRelationshipHealth('relationship-uuid');
 * console.log(data?.overall_score); // 0-100
 * console.log(data?.health_level); // 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
 *
 * @example
 * // Get historical trend data
 * const { data } = useRelationshipHealthHistory('relationship-uuid', 30);
 *
 * @example
 * // Trigger health score calculation
 * const { mutate } = useCalculateHealthScore();
 * mutate('relationship-uuid');
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  RelationshipHealthScore,
  RelationshipHealthAlert,
  HealthScoreListParams,
  AlertListParams,
  HealthScoreListResponse,
  HealthHistoryListResponse,
  AlertListResponse,
  CalculationResultResponse,
} from '@/types/relationship-health.types'

// ============================================================================
// Query Keys Factory
// ============================================================================

/**
 * Query Keys Factory for relationship health queries
 *
 * @description
 * Provides a hierarchical key structure for TanStack Query cache management.
 * Keys are structured to enable granular cache invalidation.
 *
 * @example
 * // Invalidate all health queries
 * queryClient.invalidateQueries({ queryKey: relationshipHealthKeys.all });
 *
 * @example
 * // Invalidate specific relationship's health data
 * queryClient.invalidateQueries({ queryKey: relationshipHealthKeys.detail('uuid') });
 */
export const relationshipHealthKeys = {
  all: ['relationship-health'] as const,
  lists: () => [...relationshipHealthKeys.all, 'list'] as const,
  list: (params: HealthScoreListParams) => [...relationshipHealthKeys.lists(), params] as const,
  details: () => [...relationshipHealthKeys.all, 'detail'] as const,
  detail: (id: string) => [...relationshipHealthKeys.details(), id] as const,
  history: (id: string) => [...relationshipHealthKeys.all, 'history', id] as const,
  alerts: (id: string) => [...relationshipHealthKeys.all, 'alerts', id] as const,
  allAlerts: () => [...relationshipHealthKeys.all, 'all-alerts'] as const,
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch list of relationship health scores
 *
 * @description
 * Internal API function to fetch paginated list of health scores with filtering.
 *
 * @param params - Query parameters for filtering and sorting
 * @returns Promise resolving to HealthScoreListResponse
 * @throws Error on authentication or fetch failures
 */
async function fetchHealthScoreList(
  params: HealthScoreListParams,
): Promise<HealthScoreListResponse> {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session) {
    throw new Error('Not authenticated')
  }

  const queryParams = new URLSearchParams()
  if (params.limit) queryParams.set('limit', params.limit.toString())
  if (params.offset) queryParams.set('offset', params.offset.toString())
  if (params.trend) queryParams.set('trend', params.trend)
  if (params.min_score) queryParams.set('min_score', params.min_score.toString())
  if (params.max_score) queryParams.set('max_score', params.max_score.toString())
  if (params.sort_by) queryParams.set('sort_by', params.sort_by)
  if (params.sort_order) queryParams.set('sort_order', params.sort_order)

  const queryString = queryParams.toString()
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/relationship-health${queryString ? `?${queryString}` : ''}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to fetch health scores')
  }

  return response.json() as Promise<HealthScoreListResponse>
}

/**
 * Fetch health score for a specific relationship
 *
 * @param relationshipId - UUID of the relationship
 * @returns Promise resolving to RelationshipHealthScore
 * @throws Error on authentication or fetch failures
 */
async function fetchHealthScore(relationshipId: string): Promise<RelationshipHealthScore> {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/relationship-health/${relationshipId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`,
        'Content-Type': 'application/json',
      },
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to fetch health score')
  }

  return response.json()
}

/**
 * Fetch health score history for trend analysis
 *
 * @param relationshipId - UUID of the relationship
 * @param limit - Number of historical records to fetch (default 30)
 * @param offset - Pagination offset (default 0)
 * @returns Promise resolving to HealthHistoryListResponse
 * @throws Error on authentication or fetch failures
 */
async function fetchHealthHistory(
  relationshipId: string,
  limit = 30,
  offset = 0,
): Promise<HealthHistoryListResponse> {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/relationship-health/${relationshipId}/history?limit=${limit}&offset=${offset}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`,
        'Content-Type': 'application/json',
      },
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to fetch health history')
  }

  return response.json()
}

/**
 * Fetch alerts for a relationship
 *
 * @param relationshipId - UUID of the relationship
 * @param params - Optional parameters to include read/dismissed alerts
 * @returns Promise resolving to AlertListResponse
 * @throws Error on authentication or fetch failures
 */
async function fetchAlerts(
  relationshipId: string,
  params?: AlertListParams,
): Promise<AlertListResponse> {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session) {
    throw new Error('Not authenticated')
  }

  const queryParams = new URLSearchParams()
  if (params?.include_read) queryParams.set('include_read', 'true')
  if (params?.include_dismissed) queryParams.set('include_dismissed', 'true')

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/relationship-health/${relationshipId}/alerts?${queryParams}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`,
        'Content-Type': 'application/json',
      },
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to fetch alerts')
  }

  return response.json()
}

/**
 * Trigger health score calculation
 *
 * @param relationshipId - Optional UUID of specific relationship (omit for bulk calculation)
 * @returns Promise resolving to RelationshipHealthScore or CalculationResultResponse
 * @throws Error on authentication or calculation failures
 */
async function calculateHealthScore(
  relationshipId?: string,
): Promise<RelationshipHealthScore | CalculationResultResponse> {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session) {
    throw new Error('Not authenticated')
  }

  const url = relationshipId
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/relationship-health/calculate/${relationshipId}`
    : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/relationship-health/calculate`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to calculate health score')
  }

  return response.json()
}

/**
 * Update an alert (mark as read or dismissed)
 *
 * @param alertId - UUID of the alert
 * @param updates - Fields to update (is_read and/or is_dismissed)
 * @returns Promise resolving to updated RelationshipHealthAlert
 * @throws Error on authentication or update failures
 */
async function updateAlert(
  alertId: string,
  updates: { is_read?: boolean; is_dismissed?: boolean },
): Promise<RelationshipHealthAlert> {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/relationship-health/alerts/${alertId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message_en || 'Failed to update alert')
  }

  return response.json()
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to fetch list of relationship health scores
 *
 * @description
 * Fetches a paginated list of relationship health scores with optional filtering
 * by trend, score range, and sorting. Data is cached for 5 minutes.
 *
 * @param params - Query parameters for filtering and sorting
 * @returns TanStack Query result with HealthScoreListResponse
 *
 * @example
 * // Fetch all health scores
 * const { data } = useRelationshipHealthList();
 *
 * @example
 * // Fetch declining relationships only
 * const { data } = useRelationshipHealthList({
 *   trend: 'declining',
 *   sort_by: 'overall_health_score',
 *   sort_order: 'asc',
 * });
 */
export function useRelationshipHealthList(params: HealthScoreListParams = {}) {
  return useQuery({
    queryKey: relationshipHealthKeys.list(params),
    queryFn: () => fetchHealthScoreList(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to fetch health score for a specific relationship
 *
 * @description
 * Fetches the current health score and metrics for a single relationship.
 * Includes overall score, health level, trend, and component scores.
 *
 * @param relationshipId - UUID of the relationship (undefined disables query)
 * @returns TanStack Query result with RelationshipHealthScore
 *
 * @example
 * const { data, isLoading } = useRelationshipHealth('relationship-uuid');
 *
 * if (data) {
 *   console.log(`Score: ${data.overall_score}/100`);
 *   console.log(`Level: ${data.health_level}`); // 'excellent', 'good', etc.
 *   console.log(`Trend: ${data.trend}`); // 'improving', 'declining', 'stable'
 * }
 */
export function useRelationshipHealth(relationshipId: string | undefined) {
  return useQuery({
    queryKey: relationshipHealthKeys.detail(relationshipId || ''),
    queryFn: () => fetchHealthScore(relationshipId!),
    enabled: !!relationshipId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to fetch health score history for trend analysis
 *
 * @description
 * Fetches historical health scores for a relationship to analyze trends over time.
 * Useful for charts and timeline visualizations. Data is cached for 10 minutes.
 *
 * @param relationshipId - UUID of the relationship (undefined disables query)
 * @param limit - Number of historical records to fetch (default 30)
 * @param offset - Pagination offset (default 0)
 * @returns TanStack Query result with HealthHistoryListResponse
 *
 * @example
 * // Fetch last 30 days of history
 * const { data } = useRelationshipHealthHistory('relationship-uuid', 30);
 *
 * @example
 * // Use for trend chart
 * const { data } = useRelationshipHealthHistory(relationshipId);
 * const chartData = data?.data.map(h => ({
 *   date: h.calculated_at,
 *   score: h.overall_score,
 * }));
 */
export function useRelationshipHealthHistory(
  relationshipId: string | undefined,
  limit = 30,
  offset = 0,
) {
  return useQuery({
    queryKey: [...relationshipHealthKeys.history(relationshipId || ''), { limit, offset }],
    queryFn: () => fetchHealthHistory(relationshipId!, limit, offset),
    enabled: !!relationshipId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to fetch alerts for a relationship
 *
 * @description
 * Fetches alerts generated by health score changes (e.g., score drops, declining trends).
 * By default, only shows unread and non-dismissed alerts. Data is cached for 2 minutes.
 *
 * @param relationshipId - UUID of the relationship (undefined disables query)
 * @param params - Optional parameters to include read/dismissed alerts
 * @returns TanStack Query result with AlertListResponse
 *
 * @example
 * // Fetch active alerts only
 * const { data } = useRelationshipHealthAlerts('relationship-uuid');
 *
 * @example
 * // Include all alerts (read and dismissed)
 * const { data } = useRelationshipHealthAlerts('uuid', {
 *   include_read: true,
 *   include_dismissed: true,
 * });
 */
export function useRelationshipHealthAlerts(
  relationshipId: string | undefined,
  params?: AlertListParams,
) {
  return useQuery({
    queryKey: [...relationshipHealthKeys.alerts(relationshipId || ''), params],
    queryFn: () => fetchAlerts(relationshipId!, params),
    enabled: !!relationshipId,
    staleTime: 2 * 60 * 1000, // 2 minutes (alerts are more time-sensitive)
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook to trigger health score calculation
 *
 * @description
 * Triggers recalculation of health score for a specific relationship or all relationships.
 * On success, invalidates relevant queries to refetch updated scores.
 *
 * @returns TanStack Mutation result with mutate function accepting optional relationshipId
 *
 * @example
 * // Calculate for specific relationship
 * const { mutate, isLoading } = useCalculateHealthScore();
 * mutate('relationship-uuid');
 *
 * @example
 * // Bulk calculation for all relationships
 * const { mutate } = useCalculateHealthScore();
 * mutate(); // No ID = calculate all
 */
export function useCalculateHealthScore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (relationshipId?: string) => calculateHealthScore(relationshipId),
    onSuccess: (_data, relationshipId) => {
      // Invalidate relevant queries
      if (relationshipId) {
        queryClient.invalidateQueries({
          queryKey: relationshipHealthKeys.detail(relationshipId),
        })
        queryClient.invalidateQueries({
          queryKey: relationshipHealthKeys.history(relationshipId),
        })
        queryClient.invalidateQueries({
          queryKey: relationshipHealthKeys.alerts(relationshipId),
        })
      } else {
        // Invalidate all health queries
        queryClient.invalidateQueries({
          queryKey: relationshipHealthKeys.all,
        })
      }
    },
  })
}

/**
 * Hook to update an alert (mark as read/dismissed)
 *
 * @description
 * Updates alert status (read or dismissed). On success, invalidates the alerts query
 * for the related relationship to refetch updated data.
 *
 * @returns TanStack Mutation result with mutate function accepting { alertId, updates }
 *
 * @example
 * const { mutate } = useUpdateAlert();
 *
 * mutate({
 *   alertId: 'alert-uuid',
 *   updates: { is_read: true },
 * });
 */
export function useUpdateAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      alertId,
      updates,
    }: {
      alertId: string
      updates: { is_read?: boolean; is_dismissed?: boolean }
    }) => updateAlert(alertId, updates),
    onSuccess: (data) => {
      // Invalidate alerts query for this relationship
      queryClient.invalidateQueries({
        queryKey: relationshipHealthKeys.alerts(data.relationship_id),
      })
    },
  })
}

/**
 * Hook to mark alert as read
 *
 * @description
 * Convenience hook that wraps useUpdateAlert to specifically mark alerts as read.
 *
 * @returns Mutation object with simplified mutate function accepting only alertId
 *
 * @example
 * const { mutate: markRead } = useMarkAlertRead();
 * markRead('alert-uuid');
 */
export function useMarkAlertRead() {
  const updateAlertMutation = useUpdateAlert()

  return {
    ...updateAlertMutation,
    mutate: (alertId: string) =>
      updateAlertMutation.mutate({ alertId, updates: { is_read: true } }),
    mutateAsync: (alertId: string) =>
      updateAlertMutation.mutateAsync({ alertId, updates: { is_read: true } }),
  }
}

/**
 * Hook to dismiss alert
 *
 * @description
 * Convenience hook that wraps useUpdateAlert to specifically dismiss alerts.
 *
 * @returns Mutation object with simplified mutate function accepting only alertId
 *
 * @example
 * const { mutate: dismiss } = useDismissAlert();
 * dismiss('alert-uuid');
 */
export function useDismissAlert() {
  const updateAlertMutation = useUpdateAlert()

  return {
    ...updateAlertMutation,
    mutate: (alertId: string) =>
      updateAlertMutation.mutate({ alertId, updates: { is_dismissed: true } }),
    mutateAsync: (alertId: string) =>
      updateAlertMutation.mutateAsync({ alertId, updates: { is_dismissed: true } }),
  }
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to get summary statistics for all relationships
 *
 * @description
 * Calculates aggregate statistics from relationship health scores including counts
 * by health level, trend distribution, and average score.
 *
 * @returns Object with { stats, isLoading, error }
 *
 * @example
 * const { stats, isLoading } = useRelationshipHealthStats();
 *
 * if (stats) {
 *   console.log(`Total: ${stats.total}`);
 *   console.log(`Critical: ${stats.critical}`);
 *   console.log(`Declining: ${stats.declining}`);
 *   console.log(`Average: ${stats.averageScore}`);
 * }
 */
export function useRelationshipHealthStats() {
  const { data, isLoading, error } = useRelationshipHealthList({ limit: 100 })

  const stats = data?.data
    ? {
        total: data.data.length,
        excellent: data.data.filter((r) => r.health_level === 'excellent').length,
        good: data.data.filter((r) => r.health_level === 'good').length,
        fair: data.data.filter((r) => r.health_level === 'fair').length,
        poor: data.data.filter((r) => r.health_level === 'poor').length,
        critical: data.data.filter((r) => r.health_level === 'critical').length,
        unknown: data.data.filter((r) => r.health_level === 'unknown').length,
        improving: data.data.filter((r) => r.trend === 'improving').length,
        declining: data.data.filter((r) => r.trend === 'declining').length,
        averageScore:
          data.data.filter((r) => r.overall_score !== null).length > 0
            ? Math.round(
                data.data
                  .filter((r) => r.overall_score !== null)
                  .reduce((sum, r) => sum + (r.overall_score || 0), 0) /
                  data.data.filter((r) => r.overall_score !== null).length,
              )
            : null,
      }
    : null

  return { stats, isLoading, error }
}

/**
 * Hook to get relationships that need attention (critical or poor health)
 *
 * @description
 * Fetches relationships with health scores below 40 (critical or poor health level).
 * Sorted by score ascending (worst first).
 *
 * @returns TanStack Query result with filtered HealthScoreListResponse
 *
 * @example
 * const { data } = useRelationshipsNeedingAttention();
 * const criticalRelationships = data?.data; // Sorted worst-first
 */
export function useRelationshipsNeedingAttention() {
  return useRelationshipHealthList({
    max_score: 40,
    sort_by: 'overall_health_score',
    sort_order: 'asc',
  })
}

/**
 * Hook to get improving relationships
 *
 * @description
 * Fetches relationships with an 'improving' trend. Sorted by score descending (best first).
 *
 * @returns TanStack Query result with filtered HealthScoreListResponse
 *
 * @example
 * const { data } = useImprovingRelationships();
 * const improvingList = data?.data; // Sorted best-first
 */
export function useImprovingRelationships() {
  return useRelationshipHealthList({
    trend: 'improving',
    sort_by: 'overall_health_score',
    sort_order: 'desc',
  })
}

/**
 * Hook to get declining relationships
 *
 * @description
 * Fetches relationships with a 'declining' trend. Sorted by score ascending (worst first).
 *
 * @returns TanStack Query result with filtered HealthScoreListResponse
 *
 * @example
 * const { data } = useDecliningRelationships();
 * const decliningList = data?.data; // Sorted worst-first
 */
export function useDecliningRelationships() {
  return useRelationshipHealthList({
    trend: 'declining',
    sort_by: 'overall_health_score',
    sort_order: 'asc',
  })
}
