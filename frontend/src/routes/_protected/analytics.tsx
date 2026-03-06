/**
 * Analytics Dashboard Route
 * Feature: analytics-dashboard
 *
 * Performance: Lazy-loaded for code splitting.
 */

import { createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import type { TimeRange, AnalyticsUrlState } from '@/types/analytics.types'

const AnalyticsDashboardPage = lazy(() =>
  import('@/pages/analytics').then((m) => ({
    default: m.AnalyticsDashboardPage,
  })),
)

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

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <AnalyticsDashboardPage initialState={initialState} />
    </Suspense>
  )
}
