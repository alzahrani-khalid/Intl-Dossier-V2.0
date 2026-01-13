/**
 * Analytics Dashboard Route
 * Feature: analytics-dashboard
 */

import { createFileRoute } from '@tanstack/react-router'
import { AnalyticsDashboardPage } from '@/pages/analytics'
import type { TimeRange, AnalyticsUrlState } from '@/types/analytics.types'

// Search params schema
interface AnalyticsSearchParams {
  timeRange?: TimeRange
  tab?: 'overview' | 'engagements' | 'relationships' | 'commitments' | 'workload'
}

export const Route = createFileRoute('/_protected/analytics')({
  validateSearch: (search: Record<string, unknown>): AnalyticsSearchParams => {
    const timeRange = search.timeRange as string | undefined
    const tab = search.tab as string | undefined

    return {
      timeRange: ['7d', '30d', '90d', '365d', 'custom'].includes(timeRange || '')
        ? (timeRange as TimeRange)
        : undefined,
      tab: ['overview', 'engagements', 'relationships', 'commitments', 'workload'].includes(
        tab || '',
      )
        ? (tab as AnalyticsSearchParams['tab'])
        : undefined,
    }
  },
  component: AnalyticsRoute,
})

function AnalyticsRoute() {
  const { timeRange, tab } = Route.useSearch()

  const initialState: AnalyticsUrlState = {
    timeRange: timeRange || '30d',
    tab: tab || 'overview',
  }

  return <AnalyticsDashboardPage initialState={initialState} />
}
