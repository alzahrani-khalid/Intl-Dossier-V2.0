/**
 * Relationship Health Chart Component
 * Feature: analytics-dashboard
 *
 * Displays relationship health distribution and trends
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
import type { RelationshipHealthTrends } from '@/types/analytics.types'
import { HEALTH_LEVEL_COLORS, TREND_COLORS } from '@/types/analytics.types'
import { AnalyticsPreviewOverlay } from './AnalyticsPreviewOverlay'

interface RelationshipHealthChartProps {
  data?: RelationshipHealthTrends
  isLoading?: boolean
  className?: string
  /** Show preview overlay when no data */
  showPreview?: boolean
  /** Callback when user wants to see sample data */
  onShowSampleData?: () => void
}

export function RelationshipHealthChart({
  data,
  isLoading,
  className,
  showPreview = true,
  onShowSampleData,
}: RelationshipHealthChartProps) {
  const { t, i18n } = useTranslation('analytics')
  const isRTL = i18n.language === 'ar'

  const trendData = useMemo(() => {
    if (!data?.scoreTrend) return []
    return data.scoreTrend.map((point) => ({
      ...point,
      dateLabel: new Date(point.date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
        month: 'short',
        day: 'numeric',
      }),
    }))
  }, [data?.scoreTrend, isRTL])

  const healthLevelData = useMemo(() => {
    if (!data?.byHealthLevel) return []
    return data.byHealthLevel.map((item) => ({
      ...item,
      name: t(`relationships.healthLevels.${item.level}`),
      fill: HEALTH_LEVEL_COLORS[item.level] || '#9CA3AF',
    }))
  }, [data?.byHealthLevel, t])

  const trendDistributionData = useMemo(() => {
    if (!data?.byTrend) return []
    return data.byTrend.map((item) => ({
      ...item,
      name: t(`relationships.trends.${item.trend}`),
      fill: TREND_COLORS[item.trend] || '#9CA3AF',
    }))
  }, [data?.byTrend, t])

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
          chartType="relationships"
          onShowSampleData={onShowSampleData}
          className={className}
        />
      )
    }
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{t('relationships.title')}</CardTitle>
          <CardDescription>{t('relationships.description')}</CardDescription>
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
                {typeof entry.value === 'number'
                  ? entry.value.toLocaleString(isRTL ? 'ar-SA' : 'en-US')
                  : entry.value}
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
        <CardTitle>{t('relationships.title')}</CardTitle>
        <CardDescription>{t('relationships.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="distribution" className="w-full">
          <TabsList className="mb-4 w-full sm:w-auto flex flex-wrap">
            <TabsTrigger value="distribution" className="flex-1 sm:flex-none">
              {t('relationships.tabs.distribution')}
            </TabsTrigger>
            <TabsTrigger value="trend" className="flex-1 sm:flex-none">
              {t('relationships.tabs.trend')}
            </TabsTrigger>
            <TabsTrigger value="trendType" className="flex-1 sm:flex-none">
              {t('relationships.tabs.byTrend')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="distribution" className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={healthLevelData}
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
                  {healthLevelData.map((entry, index) => (
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
                  orientation={isRTL ? 'right' : 'left'}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  name={t('relationships.avgScore')}
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="trendType" className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={trendDistributionData}
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
                <Bar dataKey="count" name={t('relationships.count')} radius={[4, 4, 0, 0]}>
                  {trendDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>

        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4 text-center">
          <div className="p-2 sm:p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
            <div className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">
              {data.criticalRelationships}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {t('relationships.critical')}
            </div>
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
            <div className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {data.improvingRelationships}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {t('relationships.improving')}
            </div>
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
            <div className="text-lg sm:text-xl font-bold text-orange-600 dark:text-orange-400">
              {data.decliningRelationships}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {t('relationships.declining')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
