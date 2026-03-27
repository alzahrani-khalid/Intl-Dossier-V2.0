/**
 * Analytics Dashboard Hook
 * @module domains/analytics/hooks/useAnalyticsDashboard
 *
 * TanStack Query hooks for analytics dashboard data.
 * API calls delegated to analytics.repository.
 */

import { useMutation, useQuery } from '@tanstack/react-query'
import { STALE_TIME } from '@/lib/query-tiers'
import { getAnalyticsDashboard as getAnalyticsDashboardApi } from '../repositories/analytics.repository'

export const analyticsKeys = {
  all: ['analytics'] as const,
  dashboard: (params?: Record<string, unknown>) =>
    [...analyticsKeys.all, 'dashboard', params] as const,
}

export function useAnalyticsDashboard(params?: {
  timeRange?: string
  entityType?: string
  metric?: string
  enabled?: boolean
}): ReturnType<typeof useQuery> {
  const searchParams = new URLSearchParams()
  if (params?.timeRange) searchParams.set('time_range', params.timeRange)
  if (params?.entityType) searchParams.set('entity_type', params.entityType)
  if (params?.metric) searchParams.set('metric', params.metric)

  return useQuery({
    queryKey: analyticsKeys.dashboard(params),
    queryFn: () => getAnalyticsDashboardApi(searchParams),
    enabled: params?.enabled !== false,
    staleTime: STALE_TIME.NORMAL,
    gcTime: 10 * 60 * 1000,
  })
}

/* Stub hook – removed during refactoring, still imported by pages */

export function useAnalyticsExport(): ReturnType<typeof useMutation> {
  return useMutation({
    mutationFn: (_params: Record<string, unknown>) => Promise.resolve({ url: '', success: true }),
  })
}
