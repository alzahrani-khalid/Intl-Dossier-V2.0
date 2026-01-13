/**
 * Engagement Metrics Chart Component
 * Feature: analytics-dashboard
 *
 * Displays engagement trends and breakdown by type/outcome
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
import type { EngagementMetrics } from '@/types/analytics.types'
import { DEFAULT_CHART_COLORS } from '@/types/analytics.types'
import { AnalyticsPreviewOverlay } from './AnalyticsPreviewOverlay'

interface EngagementMetricsChartProps {
  data?: EngagementMetrics
  isLoading?: boolean
  className?: string
  /** Show preview overlay when no data */
  showPreview?: boolean
  /** Callback when user wants to see sample data */
  onShowSampleData?: () => void
}

const OUTCOME_COLORS = {
  positive: '#10B981',
  neutral: '#9CA3AF',
  negative: '#EF4444',
}

export function EngagementMetricsChart({
  data,
  isLoading,
  className,
  showPreview = true,
  onShowSampleData,
}: EngagementMetricsChartProps) {
  const { t, i18n } = useTranslation('analytics')
  const isRTL = i18n.language === 'ar'

  const trendData = useMemo(() => {
    if (!data?.engagementTrend) return []
    return data.engagementTrend.map((point) => ({
      ...point,
      dateLabel: new Date(point.date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
        month: 'short',
        day: 'numeric',
      }),
    }))
  }, [data?.engagementTrend, isRTL])

  const typeData = useMemo(() => {
    if (!data?.engagementsByType) return []
    return data.engagementsByType.map((item, index) => ({
      ...item,
      name: t(`engagements.types.${item.type}`, { defaultValue: item.type }),
      fill: DEFAULT_CHART_COLORS[index % DEFAULT_CHART_COLORS.length],
    }))
  }, [data?.engagementsByType, t])

  const outcomeData = useMemo(() => {
    if (!data?.engagementsByOutcome) return []
    return data.engagementsByOutcome.map((item) => ({
      ...item,
      name: t(`engagements.outcomes.${item.outcome}`),
      fill: OUTCOME_COLORS[item.outcome],
    }))
  }, [data?.engagementsByOutcome, t])

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
          chartType="engagements"
          onShowSampleData={onShowSampleData}
          className={className}
        />
      )
    }
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{t('engagements.title')}</CardTitle>
          <CardDescription>{t('engagements.description')}</CardDescription>
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
                {entry.value.toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
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
        <CardTitle>{t('engagements.title')}</CardTitle>
        <CardDescription>{t('engagements.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="trend" className="w-full">
          <TabsList className="mb-4 w-full sm:w-auto flex flex-wrap">
            <TabsTrigger value="trend" className="flex-1 sm:flex-none">
              {t('engagements.tabs.trend')}
            </TabsTrigger>
            <TabsTrigger value="type" className="flex-1 sm:flex-none">
              {t('engagements.tabs.byType')}
            </TabsTrigger>
            <TabsTrigger value="outcome" className="flex-1 sm:flex-none">
              {t('engagements.tabs.byOutcome')}
            </TabsTrigger>
          </TabsList>

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
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  orientation={isRTL ? 'right' : 'left'}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  name={t('engagements.engagementCount')}
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="type" className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={typeData}
                layout="vertical"
                margin={{ top: 5, right: isRTL ? 20 : 30, left: isRTL ? 30 : 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name={t('engagements.count')} radius={[0, 4, 4, 0]}>
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="outcome" className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={outcomeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="name"
                  label={(props: any) => `${props.name}: ${props.percentage?.toFixed(0) ?? 0}%`}
                  labelLine={{ strokeWidth: 1 }}
                >
                  {outcomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
