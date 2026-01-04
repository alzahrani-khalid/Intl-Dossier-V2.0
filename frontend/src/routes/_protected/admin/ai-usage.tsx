/**
 * Route: /admin/ai-usage
 * AI Usage Dashboard
 * Feature: 033-ai-brief-generation
 * Tasks: T051, T052
 */

import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  Users,
  FileText,
  MessageSquare,
  Link2,
  Calendar,
  RefreshCw,
} from 'lucide-react'

export const Route = createFileRoute('/_protected/admin/ai-usage')({
  component: AIUsageDashboard,
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const user = session?.user
    const isAdmin = user?.user_metadata?.role === 'admin' || user?.app_metadata?.role === 'admin'
    if (!isAdmin) {
      throw new Error('Admin access required')
    }
  },
})

interface UsageMetrics {
  totalRuns: number
  totalTokens: number
  totalCost: number
  averageLatency: number
  successRate: number
  runsByType: Record<string, number>
  costByProvider: Record<string, number>
  dailyUsage: Array<{ date: string; runs: number; tokens: number; cost: number }>
  topUsers: Array<{ user_id: string; email: string; runs: number; cost: number }>
}

// API base URL for future direct API calls
// const API_BASE = import.meta.env.VITE_API_URL || '/api';

function AIUsageDashboard() {
  const { t, i18n } = useTranslation('ai-admin')
  const isRTL = i18n.language === 'ar'
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'breakdown'>('overview')

  const {
    data: metrics,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['ai-usage-metrics', dateRange],
    queryFn: async (): Promise<UsageMetrics> => {
      // Ensure user is authenticated (session is validated by route beforeLoad)
      await supabase.auth.getSession()

      // Calculate date range
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Fetch runs data from ai_runs table
      const { data: runs, error } = await supabase
        .from('ai_runs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      // Calculate metrics
      const totalRuns = runs?.length || 0
      const totalTokens = runs?.reduce((sum, r) => sum + (r.total_tokens || 0), 0) || 0
      const totalCost = runs?.reduce((sum, r) => sum + (r.total_cost || 0), 0) || 0
      const successfulRuns = runs?.filter((r) => r.status === 'completed').length || 0
      const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0
      const totalLatency = runs?.reduce((sum, r) => sum + (r.latency_ms || 0), 0) || 0
      const averageLatency = totalRuns > 0 ? totalLatency / totalRuns : 0

      // Group by run type
      const runsByType: Record<string, number> = {}
      runs?.forEach((r) => {
        runsByType[r.run_type] = (runsByType[r.run_type] || 0) + 1
      })

      // Group by provider
      const costByProvider: Record<string, number> = {}
      runs?.forEach((r) => {
        const provider = r.model_id?.split('/')[0] || 'unknown'
        costByProvider[provider] = (costByProvider[provider] || 0) + (r.total_cost || 0)
      })

      // Daily usage
      const dailyMap = new Map<string, { runs: number; tokens: number; cost: number }>()
      runs?.forEach((r) => {
        if (!r.created_at) return
        const date = new Date(r.created_at).toISOString().split('T')[0] as string
        const existing = dailyMap.get(date) || { runs: 0, tokens: 0, cost: 0 }
        dailyMap.set(date, {
          runs: existing.runs + 1,
          tokens: existing.tokens + (r.total_tokens || 0),
          cost: existing.cost + (r.total_cost || 0),
        })
      })
      const dailyUsage = Array.from(dailyMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date))

      // Top users
      const userMap = new Map<string, { runs: number; cost: number }>()
      runs?.forEach((r) => {
        const existing = userMap.get(r.user_id) || { runs: 0, cost: 0 }
        userMap.set(r.user_id, {
          runs: existing.runs + 1,
          cost: existing.cost + (r.total_cost || 0),
        })
      })

      // Get user emails
      const userIds = Array.from(userMap.keys())
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds)

      const emailMap = new Map(profiles?.map((p) => [p.id, p.email]) || [])

      const topUsers = Array.from(userMap.entries())
        .map(([user_id, data]) => ({
          user_id,
          email: emailMap.get(user_id) || 'Unknown',
          ...data,
        }))
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 10)

      return {
        totalRuns,
        totalTokens,
        totalCost,
        averageLatency,
        successRate,
        runsByType,
        costByProvider,
        dailyUsage,
        topUsers,
      }
    },
    staleTime: 60 * 1000,
  })

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(cost)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(i18n.language).format(num)
  }

  const RUN_TYPE_ICONS: Record<string, typeof FileText> = {
    brief_generation: FileText,
    chat: MessageSquare,
    entity_linking: Link2,
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" />
            {t('usage.title', 'AI Usage Dashboard')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('usage.description', 'Monitor AI feature usage, costs, and performance')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 me-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{t('usage.dateRange.7d', 'Last 7 days')}</SelectItem>
              <SelectItem value="30d">{t('usage.dateRange.30d', 'Last 30 days')}</SelectItem>
              <SelectItem value="90d">{t('usage.dateRange.90d', 'Last 90 days')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={cn('h-4 w-4', isRefetching && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title={t('usage.metrics.totalRuns', 'Total Runs')}
          value={isLoading ? undefined : formatNumber(metrics?.totalRuns || 0)}
          icon={Zap}
          isLoading={isLoading}
        />
        <MetricCard
          title={t('usage.metrics.totalTokens', 'Total Tokens')}
          value={isLoading ? undefined : formatNumber(metrics?.totalTokens || 0)}
          icon={BarChart3}
          isLoading={isLoading}
        />
        <MetricCard
          title={t('usage.metrics.totalCost', 'Total Cost')}
          value={isLoading ? undefined : formatCost(metrics?.totalCost || 0)}
          icon={DollarSign}
          trend={metrics?.totalCost && metrics.totalCost > 0 ? 'up' : undefined}
          isLoading={isLoading}
        />
        <MetricCard
          title={t('usage.metrics.successRate', 'Success Rate')}
          value={isLoading ? undefined : `${(metrics?.successRate || 0).toFixed(1)}%`}
          icon={TrendingUp}
          trend={(metrics?.successRate || 0) >= 95 ? 'up' : 'down'}
          isLoading={isLoading}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">{t('usage.tabs.overview', 'Overview')}</TabsTrigger>
          <TabsTrigger value="users">{t('usage.tabs.users', 'Top Users')}</TabsTrigger>
          <TabsTrigger value="breakdown">{t('usage.tabs.breakdown', 'Breakdown')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Usage by Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('usage.byType', 'Usage by Feature')}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(metrics?.runsByType || {}).map(([type, count]) => {
                      const Icon = RUN_TYPE_ICONS[type] || Zap
                      const total = metrics?.totalRuns || 1
                      const percentage = (count / total) * 100
                      return (
                        <div key={type} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium capitalize">
                                {type.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {formatNumber(count)} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      )
                    })}
                    {Object.keys(metrics?.runsByType || {}).length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        {t('usage.noData', 'No usage data available')}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cost by Provider */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t('usage.byProvider', 'Cost by Provider')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(metrics?.costByProvider || {}).map(([provider, cost]) => {
                      const total = metrics?.totalCost || 1
                      const percentage = (cost / total) * 100
                      return (
                        <div key={provider} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium capitalize">{provider}</span>
                            <span className="text-sm text-muted-foreground">
                              {formatCost(cost)} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      )
                    })}
                    {Object.keys(metrics?.costByProvider || {}).length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        {t('usage.noData', 'No cost data available')}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Daily Usage Chart (Simple bar representation) */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">{t('usage.dailyUsage', 'Daily Usage')}</CardTitle>
              <CardDescription>
                {t('usage.dailyUsageDesc', 'Number of AI runs per day')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <div className="h-48 flex items-end gap-1">
                  {metrics?.dailyUsage.slice(-30).map((day) => {
                    const maxRuns = Math.max(...(metrics?.dailyUsage.map((d) => d.runs) || [1]))
                    const height = (day.runs / maxRuns) * 100
                    return (
                      <div
                        key={day.date}
                        className="flex-1 bg-primary/80 hover:bg-primary rounded-t transition-colors cursor-pointer group relative"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${day.date}: ${day.runs} runs`}
                      >
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {day.date}: {day.runs} runs
                        </div>
                      </div>
                    )
                  })}
                  {(metrics?.dailyUsage.length || 0) === 0 && (
                    <p className="w-full text-center text-muted-foreground py-8">
                      {t('usage.noData', 'No usage data available')}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('usage.topUsers', 'Top Users by Cost')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {metrics?.topUsers.map((user, index) => (
                    <div
                      key={user.user_id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                        >
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm">{user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatNumber(user.runs)} {t('usage.runs', 'runs')}
                          </p>
                        </div>
                      </div>
                      <div className="text-end">
                        <p className="font-medium">{formatCost(user.cost)}</p>
                      </div>
                    </div>
                  ))}
                  {(metrics?.topUsers.length || 0) === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      {t('usage.noUsers', 'No user data available')}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('usage.performance', 'Performance')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('usage.avgLatency', 'Avg. Latency')}</span>
                  <Badge variant="outline">
                    {isLoading ? '...' : `${(metrics?.averageLatency || 0).toFixed(0)}ms`}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('usage.successRate', 'Success Rate')}</span>
                  <Badge variant={(metrics?.successRate || 0) >= 95 ? 'default' : 'destructive'}>
                    {isLoading ? '...' : `${(metrics?.successRate || 0).toFixed(1)}%`}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('usage.avgTokensPerRun', 'Avg. Tokens/Run')}</span>
                  <Badge variant="outline">
                    {isLoading
                      ? '...'
                      : formatNumber(
                          metrics?.totalRuns
                            ? Math.round((metrics?.totalTokens || 0) / metrics.totalRuns)
                            : 0,
                        )}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t('usage.costBreakdown', 'Cost Summary')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('usage.totalCost', 'Total Cost')}</span>
                  <span className="font-bold text-lg">
                    {isLoading ? '...' : formatCost(metrics?.totalCost || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('usage.avgCostPerRun', 'Avg. Cost/Run')}</span>
                  <Badge variant="outline">
                    {isLoading
                      ? '...'
                      : formatCost(
                          metrics?.totalRuns ? (metrics?.totalCost || 0) / metrics.totalRuns : 0,
                        )}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {t('usage.projectedMonthly', 'Projected Monthly')}
                  </span>
                  <Badge variant="secondary">
                    {isLoading
                      ? '...'
                      : formatCost(
                          ((metrics?.totalCost || 0) /
                            (dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90)) *
                            30,
                        )}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value?: string
  icon: typeof BarChart3
  trend?: 'up' | 'down'
  isLoading?: boolean
}

function MetricCard({ title, value, icon: Icon, trend, isLoading }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <p className="text-2xl font-bold mt-1">{value}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {trend &&
              (trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ))}
            <div className="p-2 rounded-full bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default AIUsageDashboard
