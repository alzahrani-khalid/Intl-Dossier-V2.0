/**
 * Commitment Fulfillment Chart Component
 * Feature: analytics-dashboard
 *
 * Displays commitment completion rates and trends
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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
  completedOnTime: '#10B981',
  completedLate: '#F59E0B',
  overdue: '#EF4444',
  pending: '#9CA3AF',
}

const SOURCE_COLORS = {
  commitment: '#3B82F6',
  task: '#8B5CF6',
  intake: '#EC4899',
}

export function CommitmentFulfillmentChart({
  data,
  isLoading,
  className,
  showPreview = true,
  onShowSampleData,
}: CommitmentFulfillmentChartProps) {
  const { t, i18n } = useTranslation('analytics')
  const isRTL = i18n.language === 'ar'

  const trendData = useMemo(() => {
    if (!data?.fulfillmentTrend) return []
    return data.fulfillmentTrend.map((point) => ({
      ...point,
      dateLabel: new Date(point.date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
        month: 'short',
        day: 'numeric',
      }),
    }))
  }, [data?.fulfillmentTrend, isRTL])

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
      fill: SOURCE_COLORS[item.source] || '#9CA3AF',
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3" dir={isRTL ? 'rtl' : 'ltr'}>
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium">
                {entry.dataKey === 'value'
                  ? `${entry.value.toFixed(1)}%`
                  : entry.value.toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0]
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.payload.fill }} />
            <span className="font-medium">{item.name}</span>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {item.value.toLocaleString(isRTL ? 'ar-SA' : 'en-US')} (
            {item.payload.percentage?.toFixed(1)}%)
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className={cn('col-span-full lg:col-span-2', className)} dir={isRTL ? 'rtl' : 'ltr'}>
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
                <Tooltip content={<PieTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="trend" className="h-64 sm:h-72">
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
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  name={t('commitments.fulfillmentRate')}
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="source" className="h-64 sm:h-72">
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
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  dataKey="total"
                  name={t('commitments.total')}
                  fill="#9CA3AF"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="completed"
                  name={t('commitments.completed')}
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>

        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-center">
          <div className="p-2 sm:p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <div className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
              {data.fulfillmentRate.toFixed(1)}%
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {t('commitments.fulfillmentRate')}
            </div>
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
            <div className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {data.onTimeRate.toFixed(1)}%
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {t('commitments.onTimeRate')}
            </div>
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <div className="text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400">
              {data.avgCompletionDays.toFixed(1)}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {t('commitments.avgDays')}
            </div>
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
            <div className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">
              {data.overdue}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {t('commitments.overdue')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
