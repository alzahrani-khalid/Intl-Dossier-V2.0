/**
 * Relationship Health Hook
 * Feature: relationship-health-scoring
 *
 * TanStack Query hooks for fetching and managing relationship health data:
 * - useRelationshipHealthList: List all relationship health scores
 * - useRelationshipHealth: Get health score for specific relationship
 * - useRelationshipHealthHistory: Get historical scores for trend analysis
 * - useRelationshipHealthAlerts: Get alerts for a relationship
 * - useCalculateHealthScore: Trigger health score calculation
 * - useUpdateAlert: Update alert (mark read/dismissed)
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
 */
export function useDecliningRelationships() {
  return useRelationshipHealthList({
    trend: 'declining',
    sort_by: 'overall_health_score',
    sort_order: 'asc',
  })
}
