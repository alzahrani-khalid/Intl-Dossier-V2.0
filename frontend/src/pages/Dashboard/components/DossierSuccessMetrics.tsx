/**
 * Dossier Success Metrics Card
 *
 * Matches shadcn-ui-kit reference:
 * - Large number in header (CardDescription label + CardTitle value)
 * - Avatar stack (size-12, border-4)
 * - Highlights section with divide-y rows and directional arrows
 *
 * Now uses real data from useDashboardSuccessMetrics hook.
 */

import { useTranslation } from 'react-i18next'
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardSuccessMetrics } from '@/hooks/useDashboardSuccessMetrics'

interface DossierSuccessMetricsProps {
  isLoading?: boolean
  className?: string
}

function formatResponseTime(hours: number | null): string {
  if (hours == null) return '--'
  if (hours < 1) return `${Math.round(hours * 60)}m`
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function DossierSuccessMetrics({
  isLoading: parentLoading,
  className,
}: DossierSuccessMetricsProps) {
  const { t } = useTranslation('dashboard')
  const { data: metrics, isLoading: metricsLoading } = useDashboardSuccessMetrics()

  const isLoading = parentLoading || metricsLoading

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-16" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  const activeContributors = metrics?.activeContributors ?? 0
  const contributors = metrics?.contributors ?? []
  const completionRate = metrics?.completionRate ?? null
  const avgResponseTime = metrics?.avgResponseTimeHours ?? null

  const highlights: Array<{
    key: string
    value: string
    direction: 'up' | 'down' | 'neutral'
  }> = [
    {
      key: 'completionRate',
      value: completionRate != null ? `${Math.round(completionRate)}%` : '--',
      direction: completionRate != null && completionRate >= 70 ? 'up' : 'neutral',
    },
    {
      key: 'avgResponseTime',
      value: formatResponseTime(avgResponseTime),
      // Lower response time is better → "down" is positive
      direction: avgResponseTime != null && avgResponseTime <= 24 ? 'down' : 'neutral',
    },
    {
      key: 'activeContributors',
      value: String(activeContributors),
      direction: activeContributors > 0 ? 'up' : 'neutral',
    },
  ]

  return (
    <Card className={className}>
      <CardHeader>
        <CardDescription>{t('successMetrics.professionals')}</CardDescription>
        <CardTitle className="font-display text-2xl font-semibold tabular-nums lg:text-3xl">
          {activeContributors}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Stack — Today's Heroes */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('successMetrics.todaysHeroes')}</p>
          {contributors.length > 0 ? (
            <div className="flex -space-x-4">
              {contributors.map((c) => (
                <Tooltip key={c.initials}>
                  <TooltipTrigger asChild>
                    <Avatar className="size-12 border-4 border-card">
                      <AvatarFallback className="text-sm">{c.initials}</AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>{c.name}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">--</p>
          )}
        </div>

        {/* Highlights */}
        <div className="space-y-2">
          <p className="text-sm font-bold">{t('successMetrics.highlights')}</p>
          <div className="divide-y *:py-3">
            {highlights.map((h) => (
              <div key={h.key} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t(`successMetrics.${h.key}`)}
                </span>
                <span className="flex items-center gap-1 text-sm font-medium">
                  {h.value}
                  {h.direction === 'up' && <ArrowUpRight className="size-4 text-green-600" />}
                  {h.direction === 'down' && <ArrowDownLeft className="size-4 text-green-600" />}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
