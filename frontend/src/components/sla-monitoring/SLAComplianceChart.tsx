/**
 * SLA Compliance Chart Component
 * Feature: sla-monitoring
 *
 * Displays SLA compliance trends over time with RTL support
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { SLATrendDataPoint } from '@/types/sla.types'
import { cn } from '@/lib/utils'

interface SLAComplianceChartProps {
  data?: SLATrendDataPoint[]
  isLoading?: boolean
  className?: string
}

export function SLAComplianceChart({ data, isLoading, className }: SLAComplianceChartProps) {
  const { t, i18n } = useTranslation('sla')
  const isRTL = i18n.language === 'ar'

  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      // Generate mock data for empty state
      return []
    }

    return data.map((point) => ({
      ...point,
      date: new Date(point.date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
        month: 'short',
        day: 'numeric',
      }),
      compliance: point.compliance_pct,
    }))
  }, [data, isRTL])

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

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{t('charts.complianceTrend')}</CardTitle>
          <CardDescription>{t('charts.complianceTrendDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            {t('charts.noDataAvailable')}
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
                {entry.name === t('charts.compliance')
                  ? `${entry.value}%`
                  : entry.value.toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card className={className} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle>{t('charts.complianceTrend')}</CardTitle>
        <CardDescription>{t('charts.complianceTrendDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="line" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="line">{t('charts.lineChart')}</TabsTrigger>
            <TabsTrigger value="area">{t('charts.areaChart')}</TabsTrigger>
          </TabsList>

          <TabsContent value="line" className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: isRTL ? 20 : 30, left: isRTL ? 30 : 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
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
                  dataKey="compliance"
                  name={t('charts.compliance')}
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="area" className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: isRTL ? 20 : 30, left: isRTL ? 30 : 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
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
                <defs>
                  <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="compliance"
                  name={t('charts.compliance')}
                  stroke="#22c55e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCompliance)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
