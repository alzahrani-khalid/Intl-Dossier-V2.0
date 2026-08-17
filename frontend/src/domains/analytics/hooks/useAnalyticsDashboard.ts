/**
 * Analytics Dashboard Hook
 * @module domains/analytics/hooks/useAnalyticsDashboard
 *
 * TanStack Query hooks for analytics dashboard data.
 * API calls delegated to analytics.repository.
 *
 * P96 DEAD-05: the deployed edge fn serves ONE section per call, so this is five parallel
 * queries rather than one. Each section owns its own loading/error state, which is what lets the
 * page render a failed widget's error inline while its succeeded siblings still render.
 */

import { useMemo } from 'react'
import { useMutation, useQuery, type UseQueryResult } from '@tanstack/react-query'
import { STALE_TIME } from '@/lib/query-tiers'
import { getAnalyticsEndpoint, type AnalyticsEndpoint } from '../repositories/analytics.repository'
import type {
  AnalyticsDashboardResponse,
  AnalyticsSummary,
  CommitmentFulfillment,
  EngagementMetrics,
  RelationshipHealthTrends,
  TimeRange,
  WorkloadDistribution,
} from '@/types/analytics.types'
import { TIME_RANGE_OPTIONS } from '@/types/analytics.types'

export const analyticsKeys = {
  all: ['analytics'] as const,
  dashboard: (params?: Record<string, unknown>) =>
    [...analyticsKeys.all, 'dashboard', params] as const,
}

type AnalyticsSections = AnalyticsDashboardResponse['data']

export interface AnalyticsDashboardQueries {
  summary: UseQueryResult<AnalyticsSummary | undefined, Error>
  engagements: UseQueryResult<EngagementMetrics | undefined, Error>
  relationships: UseQueryResult<RelationshipHealthTrends | undefined, Error>
  commitments: UseQueryResult<CommitmentFulfillment | undefined, Error>
  workload: UseQueryResult<WorkloadDistribution | undefined, Error>
}

function useAnalyticsSection<E extends AnalyticsEndpoint>(
  endpoint: E,
  startDate: string,
  enabled: boolean,
): UseQueryResult<AnalyticsSections[E], Error> {
  return useQuery({
    queryKey: analyticsKeys.dashboard({ endpoint, startDate }),
    queryFn: () => getAnalyticsEndpoint(endpoint, { startDate }),
    enabled,
    staleTime: STALE_TIME.NORMAL,
    gcTime: 10 * 60 * 1000,
  })
}

export function useAnalyticsDashboard(params?: {
  timeRange?: TimeRange
  enabled?: boolean
}): AnalyticsDashboardQueries {
  const timeRange = params?.timeRange ?? '30d'
  const enabled = params?.enabled !== false

  // The edge fn defaults the window end to "now"; only the start is sent, rounded to the day so
  // the query key is stable across renders (a fresh timestamp per render would refetch forever).
  const startDate = useMemo(() => {
    const days = TIME_RANGE_OPTIONS.find((option) => option.value === timeRange)?.days ?? 30
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  }, [timeRange])

  return {
    summary: useAnalyticsSection('summary', startDate, enabled),
    engagements: useAnalyticsSection('engagements', startDate, enabled),
    relationships: useAnalyticsSection('relationships', startDate, enabled),
    commitments: useAnalyticsSection('commitments', startDate, enabled),
    workload: useAnalyticsSection('workload', startDate, enabled),
  }
}

/* Stub hook – removed during refactoring, still imported by pages */

export function useAnalyticsExport() {
  return useMutation({
    mutationFn: (_params: Record<string, unknown>) => Promise.resolve({ url: '', success: true }),
  })
}
