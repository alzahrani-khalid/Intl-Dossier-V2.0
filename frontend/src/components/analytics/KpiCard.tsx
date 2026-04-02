/**
 * KpiCard -- Single KPI metric card (value + label + trend)
 * Phase 13: Feature Absorption -- Analytics into Dashboard
 *
 * Displays a high-level KPI with optional trend indicator.
 * Used by AnalyticsWidget on the dashboard zone.
 */

import type { ReactElement } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { LtrIsolate } from '@/components/ui/ltr-isolate'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface KpiTrend {
  direction: 'up' | 'down' | 'neutral'
  percentage: number
}

interface KpiCardProps {
  label: string
  value: number | string | undefined
  trend?: KpiTrend
  isLoading?: boolean
}

// ============================================================================
// Helpers
// ============================================================================

function TrendIndicator({ trend }: { trend: KpiTrend }): ReactElement {
  const Icon =
    trend.direction === 'up'
      ? TrendingUp
      : trend.direction === 'down'
        ? TrendingDown
        : Minus

  const colorClass =
    trend.direction === 'up'
      ? 'text-success'
      : trend.direction === 'down'
        ? 'text-destructive'
        : 'text-muted-foreground'

  return (
    <span className={cn('flex items-center gap-1 text-xs font-medium', colorClass)}>
      <Icon className="size-3.5" aria-hidden="true" />
      <LtrIsolate>
        {trend.percentage}%
      </LtrIsolate>
    </span>
  )
}

// ============================================================================
// Component
// ============================================================================

export function KpiCard({
  label,
  value,
  trend,
  isLoading = false,
}: KpiCardProps): ReactElement {
  if (isLoading) {
    return (
      <div className="rounded-lg bg-card p-4 space-y-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-card p-4 space-y-1">
      <div className="flex items-end gap-2">
        <LtrIsolate className="text-4xl font-semibold leading-tight">
          {value ?? '--'}
        </LtrIsolate>
        {trend != null && <TrendIndicator trend={trend} />}
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-start">
        {label}
      </p>
    </div>
  )
}
