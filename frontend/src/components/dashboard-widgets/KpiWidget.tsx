/**
 * KpiWidget Component
 *
 * Displays key performance indicators with value, trend, sparkline,
 * and comparison to previous period. Supports RTL layout.
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import type { KpiWidgetConfig, KpiData, TrendDirection } from '@/types/dashboard-widget.types'

interface KpiWidgetProps {
  config: KpiWidgetConfig
  data: KpiData | null
  isLoading?: boolean
}

/**
 * Sparkline component for KPI trend visualization
 */
function Sparkline({
  data,
  className,
  color = 'currentColor',
}: {
  data: number[]
  className?: string
  color?: string
}) {
  const path = useMemo(() => {
    if (data.length < 2) return ''

    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1
    const width = 100
    const height = 24
    const padding = 2

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * (width - padding * 2) + padding
      const y = height - padding - ((value - min) / range) * (height - padding * 2)
      return `${x},${y}`
    })

    return `M ${points.join(' L ')}`
  }, [data])

  if (data.length < 2) return null

  return (
    <svg className={cn('w-full h-6', className)} viewBox="0 0 100 24" preserveAspectRatio="none">
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Trend indicator component
 */
function TrendIndicator({
  direction,
  percentage,
  period,
}: {
  direction: TrendDirection
  percentage: number
  period: string
}) {
  const { t } = useTranslation('dashboard-widgets')

  const TrendIcon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus

  const trendColors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-muted-foreground',
  }

  const bgColors = {
    up: 'bg-green-100 dark:bg-green-900/30',
    down: 'bg-red-100 dark:bg-red-900/30',
    neutral: 'bg-muted',
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <span
        className={cn(
          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium',
          trendColors[direction],
          bgColors[direction],
        )}
      >
        <TrendIcon className="h-3 w-3" />
        <span>{percentage.toFixed(1)}%</span>
      </span>
      <span className="text-xs text-muted-foreground">
        {t('trends.fromLastPeriod', { period: t(`periods.${period}`) })}
      </span>
    </div>
  )
}

/**
 * Target progress indicator
 */
function TargetProgress({
  current,
  target,
  progress,
}: {
  current: number
  target: number
  progress: number
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Target className="h-3 w-3" />
          <span>
            {current.toLocaleString()} / {target.toLocaleString()}
          </span>
        </div>
        <span>{progress.toFixed(0)}%</span>
      </div>
      <Progress value={progress} className="h-1.5" />
    </div>
  )
}

export function KpiWidget({ config, data, isLoading }: KpiWidgetProps) {
  const { t, i18n } = useTranslation('dashboard-widgets')
  const isRTL = i18n.language === 'ar'

  const {
    settings: { metric, showTrend, showSparkline, comparisonPeriod },
  } = config

  // Get metric label
  const metricLabel = t(`metrics.${metric}`, metric)

  // Loading skeleton
  if (isLoading || !data) {
    return (
      <div className="h-full flex flex-col justify-center animate-pulse">
        <div className="h-3 w-24 bg-muted rounded mb-2" />
        <div className="h-8 w-32 bg-muted rounded mb-3" />
        <div className="h-3 w-20 bg-muted rounded" />
      </div>
    )
  }

  const { value, trend, trendPercentage, sparklineData, target, targetProgress } = data

  // Format value based on metric type
  const formattedValue = useMemo(() => {
    if (metric === 'response-rate' || metric === 'sla-compliance') {
      return `${value.toFixed(1)}%`
    }
    return value.toLocaleString(isRTL ? 'ar-SA' : 'en-US')
  }, [value, metric, isRTL])

  // Sparkline color based on trend
  const sparklineColor =
    trend === 'up'
      ? 'rgb(22, 163, 74)'
      : trend === 'down'
        ? 'rgb(220, 38, 38)'
        : 'rgb(156, 163, 175)'

  return (
    <div className="h-full flex flex-col justify-between">
      {/* Metric Label */}
      <p className="text-xs sm:text-sm text-muted-foreground mb-1">{metricLabel}</p>

      {/* Main Value */}
      <div className="flex-1 flex flex-col justify-center">
        <p
          className={cn(
            'text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight',
            'tabular-nums',
          )}
          dir="ltr"
        >
          {formattedValue}
        </p>

        {/* Sparkline */}
        {showSparkline && sparklineData && sparklineData.length > 1 && (
          <div className="mt-2">
            <Sparkline data={sparklineData} color={sparklineColor} className="opacity-80" />
          </div>
        )}
      </div>

      {/* Bottom Section: Trend or Target */}
      <div className="mt-2 space-y-2">
        {/* Trend Indicator */}
        {showTrend && (
          <TrendIndicator
            direction={trend}
            percentage={trendPercentage}
            period={comparisonPeriod}
          />
        )}

        {/* Target Progress */}
        {target && targetProgress !== undefined && (
          <TargetProgress current={value} target={target} progress={targetProgress} />
        )}
      </div>
    </div>
  )
}

export default KpiWidget
