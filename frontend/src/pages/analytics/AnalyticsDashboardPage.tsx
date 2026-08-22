/**
 * Analytics Dashboard Page
 * Feature: analytics-dashboard
 *
 * Main analytics dashboard with high-level metrics, engagement trends,
 * relationship health, commitment fulfillment, and workload distribution.
 *
 * P96 DEAD-05 (Branch A — real data): the five regions read the deployed `analytics-dashboard`
 * edge fn, one query each. A failed region renders the shared inline error next to its succeeded
 * siblings; only an all-region failure replaces the page. The sample-data mode and the
 * "Insights you'll gain" preview overlay are gone — fabricated visuals over live chrome are the
 * forbidden shape this requirement exists to kill.
 */

import { useState, useMemo, useCallback, type JSX, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart3,
  TrendingUp,
  Users,
  ClipboardCheck,
  AlertTriangle,
  Clock,
  RefreshCw,
  Download,
  Calendar,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { QueryErrorState } from '@/components/error-states/QueryErrorState'
import { MetricsGridSkeleton, ChartSkeleton } from '@/components/ui/content-skeletons'
import { cn } from '@/lib/utils'
import {
  SummaryCard,
  EngagementMetricsChart,
  RelationshipHealthChart,
  CommitmentFulfillmentChart,
  WorkloadDistributionChart,
} from '@/components/analytics'
import {
  useAnalyticsDashboard as useAnalyticsDashboardQuery,
  useAnalyticsExport as useAnalyticsExportMutation,
} from '@/hooks/useAnalyticsDashboard'
import type { TimeRange, AnalyticsUrlState } from '@/types/analytics.types'
import { TIME_RANGE_OPTIONS } from '@/types/analytics.types'

/**
 * The trend rule (D-04): a delta renders only from a COMPLETED comparison.
 *
 * `get_analytics_summary` returns 0 for every change it cannot compute — its `ELSE 0` branches
 * when the previous period holds no rows, and `healthScoreChange`, which is a literal `0::NUMERIC`
 * in the RPC body — and the edge fn coerces null to 0 before it ships. The payload therefore
 * cannot distinguish "no prior period" from a genuine 0.0% change, so this fails closed: an exact
 * zero renders no delta row at all rather than a confident "+0.0% from previous".
 */
function settledDelta(change: number | null | undefined): number | undefined {
  if (change === null || change === undefined || change === 0) return undefined
  return change
}

/** Renders the shared inline error in place of one region, leaving its siblings alone. */
function Region({
  isError,
  onRetry,
  className,
  children,
}: {
  isError: boolean
  onRetry: () => void
  className?: string
  children: ReactNode
}): JSX.Element {
  if (isError) {
    return <QueryErrorState variant="inline" onRetry={onRetry} className={className} />
  }
  return <>{children}</>
}

function useAnalyticsExport(): {
  exportData: (
    timeRange: TimeRange,
    entityType: string | undefined,
    format: 'json' | 'csv',
  ) => Promise<string>
} {
  const mutation = useAnalyticsExportMutation()
  return {
    exportData: async (timeRange, entityType, format) => {
      const result = await mutation.mutateAsync({ timeRange, entityType, format })
      // The export endpoint returns a URL or a stringified payload; we return a
      // best-effort JSON representation so the page can wrap it in a Blob.
      return JSON.stringify(result)
    },
  }
}

interface AnalyticsDashboardPageProps {
  initialState?: AnalyticsUrlState
}

export function AnalyticsDashboardPage({ initialState }: AnalyticsDashboardPageProps) {
  const { t } = useTranslation('analytics')
  // State
  const [timeRange, setTimeRange] = useState<TimeRange>(initialState?.timeRange || '30d')
  const [activeTab, setActiveTab] = useState<
    'overview' | 'engagements' | 'relationships' | 'commitments' | 'workload'
  >(initialState?.tab || 'overview')

  // Data fetching — one query per edge-fn endpoint
  const queries = useAnalyticsDashboardQuery({ timeRange })
  const { summary: summaryQuery, engagements, relationships, commitments, workload } = queries
  const summary = summaryQuery.data
  const regions = [summaryQuery, engagements, relationships, commitments, workload]

  const isLoading = summaryQuery.isLoading
  const isFetching = regions.some((region) => region.isFetching)
  // Only a total failure replaces the page; a single failed region renders inline (UI-SPEC).
  const isError = regions.every((region) => region.isError)

  const refetch = useCallback(() => {
    for (const region of regions) {
      void region.refetch()
    }
  }, [summaryQuery, engagements, relationships, commitments, workload])

  const { exportData } = useAnalyticsExport()

  // Handlers
  const handleTimeRangeChange = useCallback((value: string) => {
    setTimeRange(value as TimeRange)
  }, [])

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as typeof activeTab)
  }, [])

  const handleExport = useCallback(async () => {
    try {
      const data = await exportData(timeRange, undefined, 'json')
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }, [exportData, timeRange])

  // Alerts to display
  const alerts = useMemo(() => {
    if (!summary) return []
    const items = []
    if (summary.criticalAlerts > 0) {
      items.push({
        type: 'critical' as const,
        message: t('alerts.criticalRelationships', { count: summary.criticalAlerts }),
      })
    }
    if (summary.overdueItems > 0) {
      items.push({
        type: 'warning' as const,
        message: t('alerts.overdueCommitments', { count: summary.overdueItems }),
      })
    }
    if (summary.relationshipsNeedingAttention > 0) {
      items.push({
        type: 'info' as const,
        message: t('alerts.decliningHealth', {
          count: summary.relationshipsNeedingAttention,
        }),
      })
    }
    return items
  }, [summary, t])

  // Loading skeleton - content-aware skeleton that mirrors analytics dashboard structure
  if (isLoading && !summary) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        {/* Metrics grid skeleton - mirrors the 4 summary cards */}
        <MetricsGridSkeleton count={4} columns={4} className="mb-6" />
        {/* Charts grid skeleton - mirrors the 2x2 layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton height="h-64 sm:h-80" />
          <ChartSkeleton height="h-64 sm:h-80" />
          <ChartSkeleton height="h-64 sm:h-80" />
          <ChartSkeleton height="h-64 sm:h-80" className="lg:col-span-2" />
        </div>
      </div>
    )
  }

  // Error state — the shared component, never the error object (D-08/D-21). Page-level only when
  // every region failed; a partial failure renders inline beside the regions that succeeded.
  if (isError) {
    return (
      <div className="space-y-6">
        <QueryErrorState variant="page" onRetry={refetch} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<BarChart3 className="h-6 w-6" />}
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <>
            <Select value={timeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="w-full sm:w-40">
                <Calendar className="h-4 w-4 me-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_RANGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={refetch}
              disabled={isFetching}
              className="min-h-11 min-w-11"
            >
              <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
              <span className="sr-only">
                {t('common:actions.refresh', { defaultValue: 'Refresh' })}
              </span>
            </Button>
            {/* Export disabled: useAnalyticsExport is a stub (no real export
                endpoint), so a click would download a misleading payload.
                Honest UX: disable with a bilingual "not yet available" tooltip
                until a real export API exists. Handler kept wired for re-enable. */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleExport}
              disabled
              title={t('common:notYetAvailable', { defaultValue: 'Not yet available' })}
              className="min-h-11 min-w-11"
            >
              <Download className="h-4 w-4" />
              <span className="sr-only">{t('common:export', { defaultValue: 'Export' })}</span>
            </Button>
          </>
        }
      />

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2 mb-6">
          {alerts.map((alert) => (
            <Alert
              key={alert.type}
              variant={alert.type === 'critical' ? 'destructive' : 'default'}
              className={cn(
                alert.type === 'warning' && 'border-warning/50 bg-warning/10 dark:bg-warning/20',
                alert.type === 'info' && 'border-info/50 bg-info/10 dark:bg-info/20',
              )}
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Summary Cards — only rendered when real summary data exists.
          Without this gate a failed/empty API response renders misleading zeros.
          Deltas follow the trend rule: absent unless the comparison completed. */}
      {summaryQuery.isError ? (
        <QueryErrorState
          variant="inline"
          onRetry={() => {
            void summaryQuery.refetch()
          }}
          className="mb-6"
        />
      ) : (
        summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <SummaryCard
              title={t('summary.totalEngagements')}
              value={summary.totalEngagements || 0}
              change={settledDelta(summary.engagementsChange)}
              changeLabel={t('summary.fromPrevious')}
              icon={<BarChart3 className="h-5 w-5" />}
              format="number"
            />
            <SummaryCard
              title={t('summary.avgHealthScore')}
              value={summary.avgHealthScore || 0}
              change={settledDelta(summary.healthScoreChange)}
              changeLabel={t('summary.fromPrevious')}
              icon={<TrendingUp className="h-5 w-5" />}
              format="score"
            />
            <SummaryCard
              title={t('summary.fulfillmentRate')}
              value={summary.fulfillmentRate || 0}
              change={settledDelta(summary.fulfillmentRateChange)}
              changeLabel={t('summary.fromPrevious')}
              icon={<ClipboardCheck className="h-5 w-5" />}
              format="percentage"
            />
            <SummaryCard
              title={t('summary.totalActiveWork')}
              value={summary.totalActiveWork || 0}
              change={settledDelta(summary.activeWorkChange)}
              changeLabel={t('summary.fromPrevious')}
              icon={<Users className="h-5 w-5" />}
              format="number"
            />
          </div>
        )
      )}

      {/* Alert summary cards */}
      {summary && (summary.criticalAlerts > 0 || summary.overdueItems > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {summary.criticalAlerts > 0 && (
            <Card className="border-danger/30 bg-danger/10 dark:bg-danger/20">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-danger" />
                <div>
                  <p className="text-2xl font-bold text-danger dark:text-danger">
                    {summary.criticalAlerts}
                  </p>
                  <p className="text-sm text-muted-foreground">{t('summary.criticalAlerts')}</p>
                </div>
              </CardContent>
            </Card>
          )}
          {summary.overdueItems > 0 && (
            <Card className="border-warning/30 bg-warning/10 dark:bg-warning/20">
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="h-8 w-8 text-warning" />
                <div>
                  <p className="text-2xl font-bold text-warning dark:text-warning">
                    {summary.overdueItems}
                  </p>
                  <p className="text-sm text-muted-foreground">{t('summary.overdueItems')}</p>
                </div>
              </CardContent>
            </Card>
          )}
          {summary.relationshipsNeedingAttention > 0 && (
            <Card className="border-info/30 bg-info/10 dark:bg-info/20">
              <CardContent className="p-4 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-info" />
                <div>
                  <p className="text-2xl font-bold text-info dark:text-info">
                    {summary.relationshipsNeedingAttention}
                  </p>
                  <p className="text-sm text-muted-foreground">{t('summary.needsAttention')}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Main content tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full sm:w-auto flex flex-wrap mb-6">
          <TabsTrigger value="overview" className="flex-1 sm:flex-none min-h-11">
            {t('tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="engagements" className="flex-1 sm:flex-none min-h-11">
            {t('tabs.engagements')}
          </TabsTrigger>
          <TabsTrigger value="relationships" className="flex-1 sm:flex-none min-h-11">
            {t('tabs.relationships')}
          </TabsTrigger>
          <TabsTrigger value="commitments" className="flex-1 sm:flex-none min-h-11">
            {t('tabs.commitments')}
          </TabsTrigger>
          <TabsTrigger value="workload" className="flex-1 sm:flex-none min-h-11">
            {t('tabs.workload')}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Region
              isError={engagements.isError}
              onRetry={() => {
                void engagements.refetch()
              }}
            >
              <EngagementMetricsChart data={engagements.data} isLoading={engagements.isLoading} />
            </Region>
            <Region
              isError={relationships.isError}
              onRetry={() => {
                void relationships.refetch()
              }}
            >
              <RelationshipHealthChart
                data={relationships.data}
                isLoading={relationships.isLoading}
              />
            </Region>
            <Region
              isError={commitments.isError}
              onRetry={() => {
                void commitments.refetch()
              }}
            >
              <CommitmentFulfillmentChart
                data={commitments.data}
                isLoading={commitments.isLoading}
              />
            </Region>
            <Region
              isError={workload.isError}
              onRetry={() => {
                void workload.refetch()
              }}
              className="lg:col-span-2"
            >
              <WorkloadDistributionChart
                data={workload.data}
                isLoading={workload.isLoading}
                className="lg:col-span-2"
              />
            </Region>
          </div>
        </TabsContent>

        {/* Engagements Tab */}
        <TabsContent value="engagements" className="mt-0">
          <Region
            isError={engagements.isError}
            onRetry={() => {
              void engagements.refetch()
            }}
          >
            <EngagementMetricsChart
              data={engagements.data}
              isLoading={engagements.isLoading}
              className="w-full"
            />
          </Region>
        </TabsContent>

        {/* Relationships Tab */}
        <TabsContent value="relationships" className="mt-0">
          <Region
            isError={relationships.isError}
            onRetry={() => {
              void relationships.refetch()
            }}
          >
            <RelationshipHealthChart
              data={relationships.data}
              isLoading={relationships.isLoading}
              className="w-full"
            />
          </Region>
        </TabsContent>

        {/* Commitments Tab */}
        <TabsContent value="commitments" className="mt-0">
          <Region
            isError={commitments.isError}
            onRetry={() => {
              void commitments.refetch()
            }}
          >
            <CommitmentFulfillmentChart
              data={commitments.data}
              isLoading={commitments.isLoading}
              className="w-full"
            />
          </Region>
        </TabsContent>

        {/* Workload Tab */}
        <TabsContent value="workload" className="mt-0">
          <Region
            isError={workload.isError}
            onRetry={() => {
              void workload.refetch()
            }}
          >
            <WorkloadDistributionChart
              data={workload.data}
              isLoading={workload.isLoading}
              className="w-full"
            />
          </Region>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AnalyticsDashboardPage
