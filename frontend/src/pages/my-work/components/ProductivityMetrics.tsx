/**
 * Productivity Metrics Component
 * Displays: Completed (30d), On-Time Rate, Avg Completion Time
 * Mobile-first, RTL-compatible
 */
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Clock, TrendingUp, type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import type { UserProductivityMetrics } from '@/types/unified-work.types'
import { cn } from '@/lib/utils'

interface ProductivityMetricsProps {
  metrics?: UserProductivityMetrics
  isLoading: boolean
}

export function ProductivityMetrics({ metrics, isLoading }: ProductivityMetricsProps) {
  const { t, i18n } = useTranslation('my-work')
  const isRTL = i18n.language === 'ar'

  if (isLoading) {
    return (
      <Card className="mb-3 sm:mb-4">
        <CardContent className="px-3 py-2 sm:px-4">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={`skeleton-metric-${i}`} className="flex items-center gap-2">
                <Skeleton className="h-7 w-7 rounded-md" />
                <div className="flex-1">
                  <Skeleton className="h-2.5 w-14 mb-1" />
                  <Skeleton className="h-4 w-10" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Format completion time to hours/days
  const formatCompletionTime = (hours: number): string => {
    if (hours < 24) {
      return `${Math.round(hours)}h`
    }
    const days = Math.round(hours / 24)
    return `${days}d`
  }

  const metricItems: {
    key: string
    label: string
    value: number
    icon: LucideIcon
    color: string
    format: (v: number) => string
    showProgress?: boolean
  }[] = [
    {
      key: 'completed',
      label: t('metrics.completed30d', 'Completed (30d)'),
      value: metrics?.completed_count_30d || 0,
      icon: CheckCircle2,
      color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
      format: (v: number) => v.toLocaleString(isRTL ? 'ar-SA' : 'en-US'),
    },
    {
      key: 'on-time',
      label: t('metrics.onTimeRate', 'On-Time Rate'),
      value: metrics?.on_time_rate_30d || 0,
      icon: TrendingUp,
      color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
      format: (v: number) => `${v}%`,
      showProgress: true,
    },
    {
      key: 'avg-time',
      label: t('metrics.avgCompletionTime', 'Avg Completion'),
      value: metrics?.avg_completion_hours_30d || 0,
      icon: Clock,
      color: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30',
      format: formatCompletionTime,
    },
  ]

  return (
    <Card className="mb-3 sm:mb-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <CardContent className="px-3 py-2 sm:px-4">
        <p className="text-xs font-medium text-muted-foreground text-start mb-2">
          {t('metrics.title', 'Your Productivity')}
        </p>
        <div className="grid grid-cols-3 gap-3">
          {metricItems.map((item) => {
            const Icon = item.icon

            return (
              <div key={item.key} className="flex items-center gap-2">
                <div className={cn('p-1.5 rounded-md shrink-0', item.color)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-muted-foreground text-start leading-none mb-0.5">
                    {item.label}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm sm:text-base font-semibold text-start leading-tight">
                      {item.format(item.value)}
                    </p>
                    {item.showProgress && (
                      <Progress value={item.value} className="h-1.5 flex-1 max-w-16" />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
