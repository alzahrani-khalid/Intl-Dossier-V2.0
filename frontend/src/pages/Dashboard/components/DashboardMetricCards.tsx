/**
 * Dashboard Metric Cards
 *
 * 4 metric cards matching shadcn-ui-kit reference layout:
 * CardHeader: Title → Description (with inline trend span) → CardAction (bare icon)
 * CardContent: Large value number
 * Uniform gradient applied via parent grid.
 *
 * Trends are computed dynamically by comparing current vs previous period summary.
 */

import { useTranslation } from 'react-i18next'
import { FolderKanban, Activity, Clock, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { DossierDashboardSummary } from '@/types/dossier-dashboard.types'

interface DashboardMetricCardsProps {
  summary: DossierDashboardSummary | undefined
  previousSummary?: DossierDashboardSummary | undefined
  isLoading: boolean
  className?: string
}

interface MetricCardConfig {
  key: string
  titleKey: string
  descKey: string
  icon: React.ComponentType<{ className?: string }>
  getValue: (s: DossierDashboardSummary) => number
}

function computeTrend(
  current: number,
  previous: number | undefined,
): { value: number; direction: 'up' | 'down' } | null {
  if (previous == null || previous === 0) return null
  const change = ((current - previous) / previous) * 100
  if (change === 0) return null
  return {
    value: Math.abs(Math.round(change * 10) / 10),
    direction: change > 0 ? 'up' : 'down',
  }
}

export function DashboardMetricCards({
  summary,
  previousSummary,
  isLoading,
  className,
}: DashboardMetricCardsProps) {
  const { t, i18n } = useTranslation('dashboard')

  const cards: MetricCardConfig[] = [
    {
      key: 'myDossiers',
      titleKey: 'metrics.myDossiers',
      descKey: 'metrics.myDossiers_desc',
      icon: FolderKanban,
      getValue: (s) => s.total_dossiers,
    },
    {
      key: 'activeDossiers',
      titleKey: 'metrics.activeDossiers',
      descKey: 'metrics.activeDossiers_desc',
      icon: Activity,
      getValue: (s) => s.active_dossiers,
    },
    {
      key: 'pendingWork',
      titleKey: 'metrics.pendingWork',
      descKey: 'metrics.pendingWork_desc',
      icon: Clock,
      getValue: (s) => s.total_pending_work,
    },
    {
      key: 'needsAttention',
      titleKey: 'metrics.needsAttention',
      descKey: 'metrics.needsAttention_desc',
      icon: AlertTriangle,
      getValue: (s) => s.attention_needed,
    },
  ]

  if (isLoading) {
    return (
      <div
        className={cn(
          'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:bg-gradient-to-t',
          className,
        )}
      >
        {[0, 1, 2, 3].map((n) => (
          <Card key={n}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
              <CardAction>
                <Skeleton className="size-4 lg:size-6" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:bg-gradient-to-t',
        className,
      )}
    >
      {cards.map((card) => {
        const Icon = card.icon
        const value = summary ? card.getValue(summary) : 0
        const prevValue = previousSummary ? card.getValue(previousSummary) : undefined
        const trend = computeTrend(value, prevValue)

        return (
          <Card key={card.key}>
            <CardHeader>
              <CardTitle>{t(card.titleKey)}</CardTitle>
              <CardDescription>
                {trend != null ? (
                  <>
                    <span className={trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}>
                      {trend.direction === 'up' ? '+' : '-'}
                      {trend.value}%
                    </span>{' '}
                  </>
                ) : null}
                {t('metrics.trend_from_last_month')}
              </CardDescription>
              <CardAction>
                <Icon className="text-muted-foreground/50 size-4 lg:size-6" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="font-display text-2xl font-semibold tabular-nums lg:text-3xl">
                {value.toLocaleString(i18n.language)}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
