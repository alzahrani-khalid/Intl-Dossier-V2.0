/**
 * Analytics Dashboard Page
 * Feature: analytics-dashboard
 *
 * Main analytics dashboard with high-level metrics, engagement trends,
 * relationship health, commitment fulfillment, and workload distribution.
 */

import { useState, useMemo, useCallback } from 'react'
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { MetricsGridSkeleton, ChartSkeleton } from '@/components/ui/content-skeletons'
import { cn } from '@/lib/utils'
import {
  SummaryCard,
  EngagementMetricsChart,
  RelationshipHealthChart,
  CommitmentFulfillmentChart,
  WorkloadDistributionChart,
  AnalyticsPreviewOverlay,
  generateSampleEngagementMetrics,
  generateSampleRelationshipHealthTrends,
  generateSampleCommitmentFulfillment,
  generateSampleWorkloadDistribution,
  generateSampleAnalyticsSummary,
} from '@/components/analytics'
import {
  useAnalyticsDashboard as useAnalyticsDashboardQuery,
  useAnalyticsExport as useAnalyticsExportMutation,
} from '@/hooks/useAnalyticsDashboard'
import type {
  TimeRange,
  AnalyticsUrlState,
  AnalyticsSummary,
  EngagementMetrics,
  RelationshipHealthTrends,
  CommitmentFulfillment,
  WorkloadDistribution,
} from '@/types/analytics.types'
import { TIME_RANGE_OPTIONS } from '@/types/analytics.types'

interface AnalyticsDashboardData {
  summary?: AnalyticsSummary
  engagements?: EngagementMetrics
  relationships?: RelationshipHealthTrends
  commitments?: CommitmentFulfillment
  workload?: WorkloadDistribution
}

// Page-level adapter: wraps the underlying useQuery into the page's expected
// `{ summary, engagements, relationships, commitments, workload, ... }` shape.
function useAnalyticsDashboard(
  timeRange: TimeRange,
  entityType: string | undefined,
  metric: string,
): {
  summary?: AnalyticsSummary
  engagements?: EngagementMetrics
  relationships?: RelationshipHealthTrends
  commitments?: CommitmentFulfillment
  workload?: WorkloadDistribution
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
} {
  const query = useAnalyticsDashboardQuery({ timeRange, entityType, metric })
  const data = query.data as AnalyticsDashboardData | undefined

  return {
    summary: data?.summary,
    engagements: data?.engagements,
    relationships: data?.relationships,
    commitments: data?.commitments,
    workload: data?.workload,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: () => {
      void query.refetch()
    },
  }
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
  const [showingSampleData, setShowingSampleData] = useState(false)

  // Data fetching
  const {
    summary,
    engagements,
    relationships,
    commitments,
    workload,
    isLoading,
    isError,
    error,
    refetch,
  } = useAnalyticsDashboard(timeRange, undefined, activeTab)

  const { exportData } = useAnalyticsExport()

  // Handlers
  const handleTimeRangeChange = useCallback((value: string) => {
    setTimeRange(value as TimeRange)
  }, [])

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as typeof activeTab)
  }, [])

  // Sample data handlers
  const handleShowSampleData = useCallback(() => {
    setShowingSampleData(true)
  }, [])

  const handleHideSampleData = useCallback(() => {
    setShowingSampleData(false)
  }, [])

  // Generate sample data when showing sample data mode
  const sampleData = useMemo(() => {
    if (!showingSampleData) return null
    return {
      summary: generateSampleAnalyticsSummary(),
      engagements: generateSampleEngagementMetrics(),
      relationships: generateSampleRelationshipHealthTrends(),
      commitments: generateSampleCommitmentFulfillment(),
      workload: generateSampleWorkloadDistribution(),
    }
  }, [showingSampleData])

  // Determine which data to display (real data or sample data)
  const displayData = useMemo(() => {
    if (showingSampleData && sampleData) {
      return sampleData
    }
    return {
      summary,
      engagements,
      relationships,
      commitments,
      workload,
    }
  }, [showingSampleData, sampleData, summary, engagements, relationships, commitments, workload])

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

  // Alerts to display (don't show alerts for sample data)
  const alerts = useMemo(() => {
    if (!displayData.summary || showingSampleData) return []
    const items = []
    if (displayData.summary.criticalAlerts > 0) {
      items.push({
        type: 'critical' as const,
        message: t('alerts.criticalRelationships', { count: displayData.summary.criticalAlerts }),
      })
    }
    if (displayData.summary.overdueItems > 0) {
      items.push({
        type: 'warning' as const,
        message: t('alerts.overdueCommitments', { count: displayData.summary.overdueItems }),
      })
    }
    if (displayData.summary.relationshipsNeedingAttention > 0) {
      items.push({
        type: 'info' as const,
        message: t('alerts.decliningHealth', {
          count: displayData.summary.relationshipsNeedingAttention,
        }),
      })
    }
    return items
  }, [displayData.summary, showingSampleData, t])

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

  // Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('errors.loadFailed')}</AlertTitle>
          <AlertDescription>{error?.message || t('errors.networkError')}</AlertDescription>
        </Alert>
        <Button onClick={() => refetch()} className="mt-4">
          <RefreshCw className="h-4 w-4 me-2" />
          {t('refresh.button')}
        </Button>
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
              onClick={() => refetch()}
              disabled={isLoading}
              className="min-h-11 min-w-11"
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleExport}
              className="min-h-11 min-w-11"
            >
              <Download className="h-4 w-4" />
            </Button>
          </>
        }
      />

      {/* Sample Data Banner */}
      {showingSampleData && (
        <AnalyticsPreviewOverlay
          chartType="overview"
          showingSampleData={true}
          onHideSampleData={handleHideSampleData}
          className="mb-6"
        />
      )}

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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          title={t('summary.totalEngagements')}
          value={displayData.summary?.totalEngagements || 0}
          change={displayData.summary?.engagementsChange}
          changeLabel={t('summary.fromPrevious')}
          icon={<BarChart3 className="h-5 w-5" />}
          format="number"
        />
        <SummaryCard
          title={t('summary.avgHealthScore')}
          value={displayData.summary?.avgHealthScore || 0}
          change={displayData.summary?.healthScoreChange}
          changeLabel={t('summary.fromPrevious')}
          icon={<TrendingUp className="h-5 w-5" />}
          format="score"
        />
        <SummaryCard
          title={t('summary.fulfillmentRate')}
          value={displayData.summary?.fulfillmentRate || 0}
          change={displayData.summary?.fulfillmentRateChange}
          changeLabel={t('summary.fromPrevious')}
          icon={<ClipboardCheck className="h-5 w-5" />}
          format="percentage"
        />
        <SummaryCard
          title={t('summary.totalActiveWork')}
          value={displayData.summary?.totalActiveWork || 0}
          change={displayData.summary?.activeWorkChange}
          changeLabel={t('summary.fromPrevious')}
          icon={<Users className="h-5 w-5" />}
          format="number"
        />
      </div>

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
            <EngagementMetricsChart
              data={displayData.engagements}
              isLoading={isLoading}
              showPreview={!showingSampleData}
              onShowSampleData={handleShowSampleData}
            />
            <RelationshipHealthChart
              data={displayData.relationships}
              isLoading={isLoading}
              showPreview={!showingSampleData}
              onShowSampleData={handleShowSampleData}
            />
            <CommitmentFulfillmentChart
              data={displayData.commitments}
              isLoading={isLoading}
              showPreview={!showingSampleData}
              onShowSampleData={handleShowSampleData}
            />
            <WorkloadDistributionChart
              data={displayData.workload}
              isLoading={isLoading}
              showPreview={!showingSampleData}
              onShowSampleData={handleShowSampleData}
              className="lg:col-span-2"
            />
          </div>
        </TabsContent>

        {/* Engagements Tab */}
        <TabsContent value="engagements" className="mt-0">
          <EngagementMetricsChart
            data={displayData.engagements}
            isLoading={isLoading}
            showPreview={!showingSampleData}
            onShowSampleData={handleShowSampleData}
            className="w-full"
          />
        </TabsContent>

        {/* Relationships Tab */}
        <TabsContent value="relationships" className="mt-0">
          <RelationshipHealthChart
            data={displayData.relationships}
            isLoading={isLoading}
            showPreview={!showingSampleData}
            onShowSampleData={handleShowSampleData}
            className="w-full"
          />
        </TabsContent>

        {/* Commitments Tab */}
        <TabsContent value="commitments" className="mt-0">
          <CommitmentFulfillmentChart
            data={displayData.commitments}
            isLoading={isLoading}
            showPreview={!showingSampleData}
            onShowSampleData={handleShowSampleData}
            className="w-full"
          />
        </TabsContent>

        {/* Workload Tab */}
        <TabsContent value="workload" className="mt-0">
          <WorkloadDistributionChart
            data={displayData.workload}
            isLoading={isLoading}
            showPreview={!showingSampleData}
            onShowSampleData={handleShowSampleData}
            className="w-full"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AnalyticsDashboardPage
