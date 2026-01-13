/**
 * RelationshipHealthTrend Component
 * Feature: relationship-health-scoring
 *
 * Displays trend visualization for relationship health scores
 * including historical chart and component trends.
 *
 * Mobile-first, RTL-compatible design following project conventions.
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, Minus, Calendar, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  RelationshipHealthHistory,
  HealthScoreComponents,
} from '@/types/relationship-health.types'
import { getTrendColor, COMPONENT_LABELS } from '@/types/relationship-health.types'

// ============================================================================
// Component Props
// ============================================================================

interface RelationshipHealthTrendProps {
  /** Historical health data */
  history: RelationshipHealthHistory[]
  /** Loading state */
  isLoading?: boolean
  /** Additional class names */
  className?: string
  /** Height of the chart area */
  chartHeight?: number
}

interface MiniChartProps {
  data: number[]
  height?: number
  color?: string
}

interface ComponentTrendProps {
  component: keyof HealthScoreComponents
  current: number
  previous: number | null
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Simple SVG line chart for trend visualization
 */
function MiniChart({ data, height = 60, color = 'currentColor' }: MiniChartProps) {
  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground text-sm"
        style={{ height }}
      >
        <BarChart3 className="h-5 w-5 me-2" />
        <span>Not enough data</span>
      </div>
    )
  }

  const width = 100
  const padding = 4
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  const minValue = Math.min(...data)
  const maxValue = Math.max(...data)
  const range = maxValue - minValue || 1

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth
    const y = padding + chartHeight - ((value - minValue) / range) * chartHeight
    return `${x},${y}`
  })

  const pathD = `M ${points.join(' L ')}`

  // Area fill
  const areaD = `${pathD} L ${padding + chartWidth},${padding + chartHeight} L ${padding},${padding + chartHeight} Z`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ height }}
      preserveAspectRatio="none"
    >
      {/* Area fill */}
      <path d={areaD} fill={color} fillOpacity={0.1} />
      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Data points */}
      {data.map((value, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth
        const y = padding + chartHeight - ((value - minValue) / range) * chartHeight
        return <circle key={index} cx={x} cy={y} r={2} fill={color} />
      })}
    </svg>
  )
}

function ComponentTrend({ component, current, previous }: ComponentTrendProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const diff = previous !== null ? current - previous : 0
  const trend = diff > 2 ? 'improving' : diff < -2 ? 'declining' : 'stable'

  const Icon = trend === 'improving' ? TrendingUp : trend === 'declining' ? TrendingDown : Minus

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <span className="text-sm text-muted-foreground">
        {COMPONENT_LABELS[component][isRTL ? 'ar' : 'en']}
      </span>
      <div className="flex items-center gap-2">
        <span className="font-medium">{current}</span>
        {previous !== null && diff !== 0 && (
          <div className={cn('flex items-center text-xs', getTrendColor(trend))}>
            <Icon className={cn('h-3 w-3', isRTL && trend !== 'stable' && 'rotate-180')} />
            <span>{Math.abs(diff)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Date range display
 */
function DateRange({ start, end }: { start: string; end: string }) {
  const { i18n } = useTranslation()

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <Calendar className="h-3 w-3" />
      <span>{formatDate(start)}</span>
      <span>-</span>
      <span>{formatDate(end)}</span>
    </div>
  )
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function RelationshipHealthTrendSkeleton() {
  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <Skeleton className="h-5 w-1/3" />
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
        <Skeleton className="h-16 w-full" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function RelationshipHealthTrend({
  history,
  isLoading = false,
  className,
  chartHeight = 80,
}: RelationshipHealthTrendProps) {
  const { t, i18n } = useTranslation('relationship-health')
  const isRTL = i18n.language === 'ar'

  // Sort history by date (newest first)
  const sortedHistory = useMemo(() => {
    return [...history].sort(
      (a, b) => new Date(b.calculated_at).getTime() - new Date(a.calculated_at).getTime(),
    )
  }, [history])

  // Extract overall scores for chart (reversed to show oldest to newest)
  const overallScores = useMemo(() => {
    return [...sortedHistory].reverse().map((h) => h.overall_score)
  }, [sortedHistory])

  // Current and previous for component comparison
  const current = sortedHistory[0]
  const previous = sortedHistory[1] || null

  // Calculate overall trend
  const overallTrend = useMemo(() => {
    if (sortedHistory.length < 2) return 'stable'
    const recentAvg =
      sortedHistory.slice(0, 3).reduce((sum, h) => sum + h.overall_score, 0) /
      Math.min(sortedHistory.length, 3)
    const olderAvg =
      sortedHistory.slice(-3).reduce((sum, h) => sum + h.overall_score, 0) /
      Math.min(sortedHistory.length, 3)
    if (recentAvg > olderAvg + 5) return 'improving'
    if (recentAvg < olderAvg - 5) return 'declining'
    return 'stable'
  }, [sortedHistory])

  // Chart color based on trend
  const chartColor = useMemo(() => {
    if (overallTrend === 'improving') return 'rgb(34, 197, 94)' // green-500
    if (overallTrend === 'declining') return 'rgb(239, 68, 68)' // red-500
    return 'rgb(107, 114, 128)' // gray-500
  }, [overallTrend])

  if (isLoading) {
    return <RelationshipHealthTrendSkeleton />
  }

  if (history.length === 0) {
    return (
      <Card className={className} dir={isRTL ? 'rtl' : 'ltr'}>
        <CardContent className="p-6 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">{t('trend.noHistory')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="p-4 sm:p-6 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-sm sm:text-base">{t('trend.title')}</CardTitle>
          {sortedHistory.length > 0 &&
            (() => {
              const firstItem = sortedHistory[0]
              const lastItem = sortedHistory[sortedHistory.length - 1]
              if (firstItem && lastItem) {
                return <DateRange start={lastItem.period_start} end={firstItem.period_end} />
              }
              return null
            })()}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-2 space-y-4">
        {/* Overall score chart */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('trend.overallScore')}</span>
            <div className={cn('flex items-center gap-1', getTrendColor(overallTrend))}>
              {overallTrend === 'improving' && (
                <TrendingUp className={cn('h-4 w-4', isRTL && 'rotate-180')} />
              )}
              {overallTrend === 'declining' && (
                <TrendingDown className={cn('h-4 w-4', isRTL && 'rotate-180')} />
              )}
              {overallTrend === 'stable' && <Minus className="h-4 w-4" />}
            </div>
          </div>
          <div className="rounded-lg bg-muted/30 p-2">
            <MiniChart data={overallScores} height={chartHeight} color={chartColor} />
          </div>
          {/* Score labels */}
          <div className="flex justify-between text-xs text-muted-foreground px-1">
            <span>{overallScores[0]}</span>
            <span>{current?.overall_score}</span>
          </div>
        </div>

        {/* Component trends */}
        {current && (
          <div className="space-y-1">
            <h4 className="text-sm font-medium mb-2">{t('trend.componentTrends')}</h4>
            {(Object.keys(current.components) as (keyof HealthScoreComponents)[]).map(
              (component) => (
                <ComponentTrend
                  key={component}
                  component={component}
                  current={current.components[component]}
                  previous={previous?.components[component] ?? null}
                />
              ),
            )}
          </div>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div className="text-center">
            <div className="text-lg sm:text-xl font-bold">{history.length}</div>
            <div className="text-xs text-muted-foreground">{t('trend.dataPoints')}</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl font-bold">{Math.max(...overallScores)}</div>
            <div className="text-xs text-muted-foreground">{t('trend.highScore')}</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl font-bold">{Math.min(...overallScores)}</div>
            <div className="text-xs text-muted-foreground">{t('trend.lowScore')}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Exports
// ============================================================================

export { MiniChart, ComponentTrend, DateRange, RelationshipHealthTrendSkeleton }
