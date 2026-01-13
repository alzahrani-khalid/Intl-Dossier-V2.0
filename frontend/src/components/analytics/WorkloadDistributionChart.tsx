/**
 * Workload Distribution Chart Component
 * Feature: analytics-dashboard
 *
 * Displays team workload distribution and priority breakdown
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { WorkloadDistribution } from '@/types/analytics.types'
import { PRIORITY_COLORS } from '@/types/analytics.types'
import { AnalyticsPreviewOverlay } from './AnalyticsPreviewOverlay'

interface WorkloadDistributionChartProps {
  data?: WorkloadDistribution
  isLoading?: boolean
  className?: string
  /** Show preview overlay when no data */
  showPreview?: boolean
  /** Callback when user wants to see sample data */
  onShowSampleData?: () => void
}

export function WorkloadDistributionChart({
  data,
  isLoading,
  className,
  showPreview = true,
  onShowSampleData,
}: WorkloadDistributionChartProps) {
  const { t, i18n } = useTranslation('analytics')
  const isRTL = i18n.language === 'ar'

  const userWorkloadData = useMemo(() => {
    if (!data?.byUser) return []
    return data.byUser.slice(0, 10).map((user) => ({
      ...user,
      name: isRTL && user.userNameAr ? user.userNameAr : user.userName,
      shortName: (isRTL && user.userNameAr ? user.userNameAr : user.userName)
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2),
    }))
  }, [data?.byUser, isRTL])

  const priorityData = useMemo(() => {
    if (!data?.byPriority) return []
    return data.byPriority.map((item) => ({
      ...item,
      name: t(`workload.priorities.${item.priority}`),
      fill: PRIORITY_COLORS[item.priority] || '#9CA3AF',
    }))
  }, [data?.byPriority, t])

  const statusData = useMemo(() => {
    if (!data?.byStatus) return []
    return data.byStatus.map((item) => ({
      ...item,
      name: t(`workload.statuses.${item.status}`, { defaultValue: item.status }),
    }))
  }, [data?.byStatus, t])

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
          chartType="workload"
          onShowSampleData={onShowSampleData}
          className={className}
        />
      )
    }
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{t('workload.title')}</CardTitle>
          <CardDescription>{t('workload.description')}</CardDescription>
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
    <Card className={cn('col-span-full', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle>{t('workload.title')}</CardTitle>
        <CardDescription>{t('workload.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-4 w-full sm:w-auto flex flex-wrap">
            <TabsTrigger value="users" className="flex-1 sm:flex-none">
              {t('workload.tabs.byUser')}
            </TabsTrigger>
            <TabsTrigger value="priority" className="flex-1 sm:flex-none">
              {t('workload.tabs.byPriority')}
            </TabsTrigger>
            <TabsTrigger value="status" className="flex-1 sm:flex-none">
              {t('workload.tabs.byStatus')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="h-64 sm:h-80">
            {userWorkloadData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={userWorkloadData}
                  layout="vertical"
                  margin={{ top: 5, right: isRTL ? 20 : 30, left: isRTL ? 30 : 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    width={90}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="totalItems"
                    name={t('workload.totalItems')}
                    fill="#3B82F6"
                    radius={[0, 4, 4, 0]}
                    stackId="a"
                  />
                  <Bar
                    dataKey="overdueItems"
                    name={t('workload.overdueItems')}
                    fill="#EF4444"
                    radius={[0, 4, 4, 0]}
                    stackId="b"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                {t('errors.noData')}
              </div>
            )}
          </TabsContent>

          <TabsContent value="priority" className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="name"
                  label={(props: any) => `${props.name}: ${props.percentage?.toFixed(0) ?? 0}%`}
                  labelLine={{ strokeWidth: 1 }}
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="status" className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={statusData}
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
                <Bar
                  dataKey="count"
                  name={t('workload.count')}
                  fill="#8B5CF6"
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
              {data.totalActiveItems}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {t('workload.totalActive')}
            </div>
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20">
            <div className="text-lg sm:text-xl font-bold text-violet-600 dark:text-violet-400">
              {data.avgItemsPerUser.toFixed(1)}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {t('workload.avgPerUser')}
            </div>
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
            <div className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">
              {data.overloadedUsers}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {t('workload.overloaded')}
            </div>
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="text-lg sm:text-xl font-bold text-gray-600 dark:text-gray-400">
              {data.idleUsers}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">{t('workload.idle')}</div>
          </div>
        </div>

        {/* Top users list (mobile-friendly) */}
        {userWorkloadData.length > 0 && (
          <div className="mt-4 block sm:hidden">
            <h4 className="text-sm font-medium mb-2">{t('workload.topUsers')}</h4>
            <div className="space-y-2">
              {userWorkloadData.slice(0, 5).map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs">{user.shortName}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate max-w-[120px]">{user.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{user.totalItems}</span>
                    {user.overdueItems > 0 && (
                      <span className="text-red-500">({user.overdueItems})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
