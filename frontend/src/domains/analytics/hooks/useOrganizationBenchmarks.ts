/**
 * Organization Benchmarks Hook
 * @module domains/analytics/hooks/useOrganizationBenchmarks
 *
 * TanStack Query hooks for organization benchmarking.
 * API calls delegated to analytics.repository.
 */

import { useQuery } from '@tanstack/react-query'
import { STALE_TIME } from '@/lib/query-tiers'
import {
  getOrganizationBenchmarks as getOrganizationBenchmarksApi,
  getCurrentStats,
} from '../repositories/analytics.repository'

export const benchmarkKeys = {
  all: ['benchmarks'] as const,
  list: (params?: Record<string, unknown>) => [...benchmarkKeys.all, 'list', params] as const,
  currentStats: () => [...benchmarkKeys.all, 'current-stats'] as const,
}

export function useOrganizationBenchmarks(params?: {
  timeRange?: string
  metric?: string
  enabled?: boolean
}): ReturnType<typeof useQuery> {
  const searchParams = new URLSearchParams()
  if (params?.timeRange) searchParams.set('time_range', params.timeRange)
  if (params?.metric) searchParams.set('metric', params.metric)

  return useQuery({
    queryKey: benchmarkKeys.list(params),
    queryFn: () => getOrganizationBenchmarksApi(searchParams),
    enabled: params?.enabled !== false,
    staleTime: STALE_TIME.NORMAL,
  })
}

export function useCurrentStats(): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: benchmarkKeys.currentStats(),
    queryFn: () => getCurrentStats(),
    staleTime: STALE_TIME.NORMAL,
  })
}

/* Stub hook – removed during refactoring, still imported by dashboard widgets */

export function useBenchmarkPreview(params?: Record<string, unknown>): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: [...benchmarkKeys.all, 'preview', params],
    queryFn: () => Promise.resolve([]),
    staleTime: STALE_TIME.NORMAL,
  })
}
