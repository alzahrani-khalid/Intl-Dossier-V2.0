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
import { useDirection } from '@/hooks/useDirection'
import { LtrIsolate } from '@/components/ui/ltr-isolate'
import { toFormatLocale } from '@/lib/format-locale'

function WorkloadCustomTooltip({ active, payload, label, isRTL }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">
              {entry.value.toLocaleString(toFormatLocale(isRTL ? 'ar' : 'en'))}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

function WorkloadPieTooltip({ active, payload, isRTL }: any) {
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

interface WorkloadDistributionChartProps {
  data?: WorkloadDistribution
  isLoading?: boolean
  className?: string
}

export function WorkloadDistributionChart({
  data,
  isLoading,
  className,
}: WorkloadDistributionChartProps) {
  const { t } = useTranslation('analytics')
  const { isRTL } = useDirection()
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
      fill: PRIORITY_COLORS[item.priority] || 'var(--ink-faint)',
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

  return (
    <Card className={cn('col-span-full', className)}>
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
              <LtrIsolate className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={userWorkloadData}
                    layout="vertical"
                    margin={{ top: 5, right: isRTL ? 20 : 30, left: isRTL ? 30 : 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      width={90}
                    />
                    <Tooltip content={<WorkloadCustomTooltip isRTL={isRTL} />} />
                    <Legend />
                    <Bar
                      dataKey="totalItems"
                      name={t('workload.totalItems')}
                      fill="var(--chart-1)"
                      radius={[0, 4, 4, 0]}
                      stackId="a"
                    />
                    <Bar
                      dataKey="overdueItems"
                      name={t('workload.overdueItems')}
                      fill="var(--danger)"
                      radius={[0, 4, 4, 0]}
                      stackId="b"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </LtrIsolate>
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
                <Tooltip content={<WorkloadPieTooltip isRTL={isRTL} />} />
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
                <Tooltip content={<WorkloadCustomTooltip isRTL={isRTL} />} />
                <Bar
                  dataKey="count"
                  name={t('workload.count')}
                  fill="var(--chart-7)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>

        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-center">
          <div className="p-2 sm:p-3 rounded-lg bg-status-1-soft">
            <div className="text-lg sm:text-xl font-bold text-status-1">
              {data.totalActiveItems}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {t('workload.totalActive')}
            </div>
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-chart-7/10">
            <div className="text-lg sm:text-xl font-bold text-chart-7">
              {data.avgItemsPerUser.toFixed(1)}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {t('workload.avgPerUser')}
            </div>
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-danger/10">
            <div className="text-lg sm:text-xl font-bold text-danger">{data.overloadedUsers}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {t('workload.overloaded')}
            </div>
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-surface-raised">
            <div className="text-lg sm:text-xl font-bold text-ink-mute">{data.idleUsers}</div>
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
                      <span className="text-danger">({user.overdueItems})</span>
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
