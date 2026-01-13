/**
 * Analytics Dashboard Hook
 * Feature: analytics-dashboard
 *
 * TanStack Query hooks for fetching analytics dashboard data:
 * - useAnalyticsSummary: High-level summary metrics
 * - useEngagementMetrics: Engagement data and trends
 * - useRelationshipHealthTrends: Relationship health distribution
 * - useCommitmentFulfillment: Commitment completion rates
 * - useWorkloadDistribution: Team workload distribution
 * - useAnalyticsDashboard: Combined hook for all analytics data
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  TimeRange,
  DateRange,
  AnalyticsSummary,
  EngagementMetrics,
  RelationshipHealthTrends,
  CommitmentFulfillment,
  WorkloadDistribution,
} from '@/types/analytics.types'

// ============================================================================
// Query Keys Factory
// ============================================================================

// Use timeRange string for stable query keys, not the DateRange object (which has timestamps)
export const analyticsKeys = {
  all: ['analytics'] as const,
  summary: (timeRange: TimeRange) => [...analyticsKeys.all, 'summary', timeRange] as const,
  engagements: (timeRange: TimeRange) => [...analyticsKeys.all, 'engagements', timeRange] as const,
  relationships: (timeRange: TimeRange) =>
    [...analyticsKeys.all, 'relationships', timeRange] as const,
  commitments: (timeRange: TimeRange) => [...analyticsKeys.all, 'commitments', timeRange] as const,
  workload: () => [...analyticsKeys.all, 'workload'] as const,
}

// ============================================================================
// API Functions
// ============================================================================

async function fetchAnalyticsEndpoint<T>(
  endpoint: 'summary' | 'engagements' | 'relationships' | 'commitments' | 'workload',
  dateRange?: DateRange,
): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session) {
    throw new Error('Not authenticated')
  }

  const params = new URLSearchParams({ endpoint })
  if (dateRange) {
    params.set('startDate', dateRange.start)
    params.set('endDate', dateRange.end)
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analytics-dashboard?${params}`,
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
    throw new Error(error.error?.message || `Failed to fetch ${endpoint} analytics`)
  }

  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error?.message || `Failed to fetch ${endpoint} analytics`)
  }

  return result.data
}

// ============================================================================
// Helper Function
// ============================================================================

/**
 * Computes a stable date range based on time range.
 * Rounds to start of current day for cache-friendly query keys.
 */
function computeDateRange(timeRange: TimeRange, customRange?: DateRange): DateRange {
  if (timeRange === 'custom' && customRange) {
    return customRange
  }

  // Round to start of current day for stable query keys
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)

  switch (timeRange) {
    case '7d':
      start.setDate(start.getDate() - 7)
      break
    case '30d':
      start.setDate(start.getDate() - 30)
      break
    case '90d':
      start.setDate(start.getDate() - 90)
      break
    case '365d':
      start.setDate(start.getDate() - 365)
      break
    default:
      start.setDate(start.getDate() - 30)
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

/**
 * Hook to get memoized date range based on time range.
 * This prevents infinite re-renders from changing date objects.
 */
function useDateRange(timeRange: TimeRange, customRange?: DateRange): DateRange {
  return useMemo(
    () => computeDateRange(timeRange, customRange),
    [timeRange, customRange?.start, customRange?.end],
  )
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to fetch analytics summary
 */
export function useAnalyticsSummary(
  timeRange: TimeRange = '30d',
  customRange?: DateRange,
  enabled = true,
) {
  const dateRange = useDateRange(timeRange, customRange)

  return useQuery({
    queryKey: analyticsKeys.summary(timeRange),
    queryFn: () => fetchAnalyticsEndpoint<{ summary: AnalyticsSummary }>('summary', dateRange),
    select: (data) => data.summary,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled,
  })
}

/**
 * Hook to fetch engagement metrics
 */
export function useEngagementMetrics(
  timeRange: TimeRange = '30d',
  customRange?: DateRange,
  enabled = true,
) {
  const dateRange = useDateRange(timeRange, customRange)

  return useQuery({
    queryKey: analyticsKeys.engagements(timeRange),
    queryFn: () =>
      fetchAnalyticsEndpoint<{ engagements: EngagementMetrics }>('engagements', dateRange),
    select: (data) => data.engagements,
    staleTime: 5 * 60 * 1000,
    enabled,
  })
}

/**
 * Hook to fetch relationship health trends
 */
export function useRelationshipHealthTrends(
  timeRange: TimeRange = '30d',
  customRange?: DateRange,
  enabled = true,
) {
  const dateRange = useDateRange(timeRange, customRange)

  return useQuery({
    queryKey: analyticsKeys.relationships(timeRange),
    queryFn: () =>
      fetchAnalyticsEndpoint<{ relationships: RelationshipHealthTrends }>(
        'relationships',
        dateRange,
      ),
    select: (data) => data.relationships,
    staleTime: 5 * 60 * 1000,
    enabled,
  })
}

/**
 * Hook to fetch commitment fulfillment data
 */
export function useCommitmentFulfillment(
  timeRange: TimeRange = '30d',
  customRange?: DateRange,
  enabled = true,
) {
  const dateRange = useDateRange(timeRange, customRange)

  return useQuery({
    queryKey: analyticsKeys.commitments(timeRange),
    queryFn: () =>
      fetchAnalyticsEndpoint<{ commitments: CommitmentFulfillment }>('commitments', dateRange),
    select: (data) => data.commitments,
    staleTime: 5 * 60 * 1000,
    enabled,
  })
}

/**
 * Hook to fetch workload distribution
 */
export function useWorkloadDistribution(enabled = true) {
  return useQuery({
    queryKey: analyticsKeys.workload(),
    queryFn: () => fetchAnalyticsEndpoint<{ workload: WorkloadDistribution }>('workload'),
    select: (data) => data.workload,
    staleTime: 2 * 60 * 1000, // 2 minutes - more real-time
    enabled,
  })
}

/**
 * Combined hook for analytics dashboard
 */
export function useAnalyticsDashboard(
  timeRange: TimeRange = '30d',
  customRange?: DateRange,
  activeTab: 'overview' | 'engagements' | 'relationships' | 'commitments' | 'workload' = 'overview',
) {
  const dateRange = useDateRange(timeRange, customRange)

  // Always fetch summary for overview
  const summaryQuery = useAnalyticsSummary(timeRange, customRange, true)

  // Fetch section-specific data based on active tab
  const engagementsQuery = useEngagementMetrics(
    timeRange,
    customRange,
    activeTab === 'overview' || activeTab === 'engagements',
  )

  const relationshipsQuery = useRelationshipHealthTrends(
    timeRange,
    customRange,
    activeTab === 'overview' || activeTab === 'relationships',
  )

  const commitmentsQuery = useCommitmentFulfillment(
    timeRange,
    customRange,
    activeTab === 'overview' || activeTab === 'commitments',
  )

  const workloadQuery = useWorkloadDistribution(
    activeTab === 'overview' || activeTab === 'workload',
  )

  const isLoading =
    summaryQuery.isLoading ||
    (activeTab === 'overview' &&
      (engagementsQuery.isLoading ||
        relationshipsQuery.isLoading ||
        commitmentsQuery.isLoading ||
        workloadQuery.isLoading)) ||
    (activeTab === 'engagements' && engagementsQuery.isLoading) ||
    (activeTab === 'relationships' && relationshipsQuery.isLoading) ||
    (activeTab === 'commitments' && commitmentsQuery.isLoading) ||
    (activeTab === 'workload' && workloadQuery.isLoading)

  const isError =
    summaryQuery.isError ||
    engagementsQuery.isError ||
    relationshipsQuery.isError ||
    commitmentsQuery.isError ||
    workloadQuery.isError

  const error =
    summaryQuery.error ||
    engagementsQuery.error ||
    relationshipsQuery.error ||
    commitmentsQuery.error ||
    workloadQuery.error

  return {
    summary: summaryQuery.data,
    engagements: engagementsQuery.data,
    relationships: relationshipsQuery.data,
    commitments: commitmentsQuery.data,
    workload: workloadQuery.data,
    isLoading,
    isError,
    error,
    dateRange,
    refetch: () => {
      summaryQuery.refetch()
      engagementsQuery.refetch()
      relationshipsQuery.refetch()
      commitmentsQuery.refetch()
      workloadQuery.refetch()
    },
  }
}

/**
 * Hook to export analytics data
 */
export function useAnalyticsExport() {
  const exportData = async (
    timeRange: TimeRange,
    customRange?: DateRange,
    format: 'csv' | 'json' = 'json',
  ) => {
    const dateRange = computeDateRange(timeRange, customRange)

    // Fetch all data
    const [summary, engagements, relationships, commitments, workload] = await Promise.all([
      fetchAnalyticsEndpoint<{ summary: AnalyticsSummary }>('summary', dateRange),
      fetchAnalyticsEndpoint<{ engagements: EngagementMetrics }>('engagements', dateRange),
      fetchAnalyticsEndpoint<{ relationships: RelationshipHealthTrends }>(
        'relationships',
        dateRange,
      ),
      fetchAnalyticsEndpoint<{ commitments: CommitmentFulfillment }>('commitments', dateRange),
      fetchAnalyticsEndpoint<{ workload: WorkloadDistribution }>('workload'),
    ])

    const data = {
      exportedAt: new Date().toISOString(),
      timeRange: dateRange,
      summary: summary.summary,
      engagements: engagements.engagements,
      relationships: relationships.relationships,
      commitments: commitments.commitments,
      workload: workload.workload,
    }

    if (format === 'json') {
      return JSON.stringify(data, null, 2)
    }

    // CSV export - simplified summary
    const csvRows = [
      ['Metric', 'Value', 'Change'],
      ['Total Engagements', data.summary.totalEngagements, `${data.summary.engagementsChange}%`],
      ['Avg Health Score', data.summary.avgHealthScore, `${data.summary.healthScoreChange}%`],
      [
        'Fulfillment Rate',
        `${data.summary.fulfillmentRate}%`,
        `${data.summary.fulfillmentRateChange}%`,
      ],
      ['Active Work Items', data.summary.totalActiveWork, `${data.summary.activeWorkChange}%`],
      ['Critical Alerts', data.summary.criticalAlerts, ''],
      ['Overdue Items', data.summary.overdueItems, ''],
    ]

    return csvRows.map((row) => row.join(',')).join('\n')
  }

  return { exportData }
}
