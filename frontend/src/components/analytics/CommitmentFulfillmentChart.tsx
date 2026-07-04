/**
 * Commitment Fulfillment Chart Component
 * Feature: analytics-dashboard
 *
 * Displays commitment completion rates and trends
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { CommitmentFulfillment } from '@/types/analytics.types'
import { AnalyticsPreviewOverlay } from './AnalyticsPreviewOverlay'
import { useDirection } from '@/hooks/useDirection'
import { LtrIsolate } from '@/components/ui/ltr-isolate'
import { toFormatLocale } from '@/lib/format-locale'

function CommitmentCustomTooltip({ active, payload, label, isRTL }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">
              {entry.dataKey === 'value'
                ? `${entry.value.toFixed(1)}%`
                : entry.value.toLocaleString(toFormatLocale(isRTL ? 'ar' : 'en'))}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

function CommitmentPieTooltip({ active, payload, isRTL }: any) {
  if (active && payload && payload.length) {
    const item = payload[0]
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.payload.fill }} />
          <span className="font-medium">{item.name}</span>
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {item.value.toLocaleString(toFormatLocale(isRTL ? 'ar' : 'en'))} (
          {item.payload.percentage?.toFixed(1)}%)
        </div>
      </div>
    )
  }
  return null
}

interface CommitmentFulfillmentChartProps {
  data?: CommitmentFulfillment
  isLoading?: boolean
  className?: string
  /** Show preview overlay when no data */
  showPreview?: boolean
  /** Callback when user wants to see sample data */
  onShowSampleData?: () => void
}

const STATUS_COLORS = {
  completedOnTime: 'var(--ok)',
  completedLate: 'var(--warn)',
  overdue: 'var(--danger)',
  pending: 'var(--ink-faint)',
}

const SOURCE_COLORS = {
  commitment: 'var(--chart-1)',
  task: 'var(--chart-7)',
  intake: 'var(--chart-6)',
}

export function CommitmentFulfillmentChart({
  data,
  isLoading,
  className,
  showPreview = true,
  onShowSampleData,
}: CommitmentFulfillmentChartProps) {
  const { t } = useTranslation('analytics')
  const { isRTL } = useDirection()
  const trendData = useMemo(() => {
    if (!data?.fulfillmentTrend) return []
    return data.fulfillmentTrend.map((point) => ({
      ...point,
      dateLabel: format(new Date(point.date), 'd MMM'),
    }))
  }, [data?.fulfillmentTrend])

  const statusData = useMemo(() => {
    if (!data) return []
    return [
      {
        name: t('commitments.completedOnTime'),
        value: data.completedOnTime,
        fill: STATUS_COLORS.completedOnTime,
        percentage:
          data.totalCommitments > 0 ? (data.completedOnTime / data.totalCommitments) * 100 : 0,
      },
      {
        name: t('commitments.completedLate'),
        value: data.completedLate,
        fill: STATUS_COLORS.completedLate,
        percentage:
          data.totalCommitments > 0 ? (data.completedLate / data.totalCommitments) * 100 : 0,
      },
      {
        name: t('commitments.overdue'),
        value: data.overdue,
        fill: STATUS_COLORS.overdue,
        percentage: data.totalCommitments > 0 ? (data.overdue / data.totalCommitments) * 100 : 0,
      },
      {
        name: t('commitments.pending'),
        value: data.pending,
        fill: STATUS_COLORS.pending,
        percentage: data.totalCommitments > 0 ? (data.pending / data.totalCommitments) * 100 : 0,
      },
    ].filter((item) => item.value > 0)
  }, [data, t])

  const sourceData = useMemo(() => {
    if (!data?.bySource) return []
    return data.bySource.map((item) => ({
      ...item,
      name: t(`commitments.sources.${item.source}`),
      fill: SOURCE_COLORS[item.source] || 'var(--ink-faint)',
    }))
  }, [data?.bySource, t])

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    if (showPreview) {
      return (
        <AnalyticsPreviewOverlay
          chartType="commitments"
          onShowSampleData={onShowSampleData}
          className={className}
        />
      )
    }
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{t('commitments.title')}</CardTitle>
          <CardDescription>{t('commitments.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            {t('errors.noData')}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('col-span-full lg:col-span-2', className)}>
      <CardHeader>
        <CardTitle>{t('commitments.title')}</CardTitle>
        <CardDescription>{t('commitments.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="mb-4 w-full sm:w-auto flex flex-wrap">
            <TabsTrigger value="status" className="flex-1 sm:flex-none">
              {t('commitments.tabs.byStatus')}
            </TabsTrigger>
            <TabsTrigger value="trend" className="flex-1 sm:flex-none">
              {t('commitments.tabs.trend')}
            </TabsTrigger>
            <TabsTrigger value="source" className="flex-1 sm:flex-none">
              {t('commitments.tabs.bySource')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="h-64 sm:h-72">
            <LtrIsolate className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={(props: any) => `${props.name}: ${props.percentage?.toFixed(0) ?? 0}%`}
                    labelLine={{ strokeWidth: 1 }}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CommitmentPieTooltip isRTL={isRTL} />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </LtrIsolate>
          </TabsContent>

          <TabsContent value="trend" className="h-64 sm:h-72">
            <LtrIsolate className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ top: 5, right: isRTL ? 20 : 30, left: isRTL ? 30 : 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    reversed={isRTL}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                    orientation={isRTL ? 'right' : 'left'}
                  />
                  <Tooltip content={<CommitmentCustomTooltip isRTL={isRTL} />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={t('commitments.fulfillmentRate')}
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </LtrIsolate>
          </TabsContent>

          <TabsContent value="source" className="h-64 sm:h-72">
            <LtrIsolate className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sourceData}
                  margin={{ top: 5, right: isRTL ? 20 : 30, left: isRTL ? 30 : 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    orientation={isRTL ? 'right' : 'left'}
                  />
                  <Tooltip content={<CommitmentCustomTooltip isRTL={isRTL} />} />
                  <Legend />
                  <Bar
                    dataKey="total"
                    name={t('commitments.total')}
                    fill="var(--ink-faint)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="completed"
                    name={t('commitments.completed')}
                    fill="var(--ok)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </LtrIsolate>
          </TabsContent>
        </Tabs>

        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-center">
          <div className="p-2 sm:p-3 rounded-lg bg-status-1-soft">
            <div className="text-lg sm:text-xl font-bold text-status-1">
              {data.fulfillmentRate.toFixed(1)}%
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {t('commitments.fulfillmentRate')}
            </div>
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-ok/10">
            <div className="text-lg sm:text-xl font-bold text-ok">
              {data.onTimeRate.toFixed(1)}%
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {t('commitments.onTimeRate')}
            </div>
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-warn/10">
            <div className="text-lg sm:text-xl font-bold text-warn">
              {data.avgCompletionDays.toFixed(1)}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {t('commitments.avgDays')}
            </div>
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-danger/10">
            <div className="text-lg sm:text-xl font-bold text-danger">{data.overdue}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {t('commitments.overdue')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
