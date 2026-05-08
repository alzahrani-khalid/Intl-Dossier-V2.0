import { type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'
import { LtrIsolate } from '@/components/ui/ltr-isolate'
import { useAuth } from '@/hooks/useAuth'
import { useDashboardStats } from '@/domains/operations-hub/hooks/useDashboardStats'

/**
 * Phase 38 Plan 01 — KpiStrip widget.
 *
 * Verbatim port of the handoff `kpi-strip` row (4 metric cards) wired to
 * `useDashboardStats(user.id)`. Card 3 (SLA at Risk) carries the
 * `kpi-accent` class — `dashboard.css` paints the `var(--accent)` top-bar.
 *
 * Phase 41: deltas added per handoff dashboard.jsx lines 45-58. Until
 * useDashboardStats returns delta info, values are hardcoded to match the
 * design fixtures. `dir` is the trend semantic (up=good, down=bad), not the
 * sign of `delta` — e.g. SLA at Risk going up by 2 is `dir: 'down'` because
 * more risk is bad. `.kpi-delta.up` paints --ok green, `.down` paints --danger.
 *
 * RTL: every numeral wrapped in `<LtrIsolate>` (SP-4) so Latin digits don't
 * reflow under `forceRTL`. Delta uses `dir="ltr"` for the same reason.
 */

interface KpiCard {
  label: string
  value: number
  meta: string
  delta?: number
  trend?: 'up' | 'down'
  accent?: boolean
}

function KpiStripSkeleton(): ReactElement {
  return (
    <div className="kpi-strip" aria-hidden="true" data-testid="dashboard-widget-kpi-strip">
      {Array.from({ length: 4 }).map((_, i): ReactElement => {
        const accent = i === 2 ? ' kpi-accent' : ''
        return (
          <div key={i} className={`kpi${accent}`}>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        )
      })}
    </div>
  )
}

function formatDelta(delta: number): string {
  if (delta === 0) return '0'
  const prefix = delta > 0 ? '+' : '−' // U+2212 minus, not hyphen
  return `${prefix}${Math.abs(delta)}`
}

export function KpiStrip(): ReactElement {
  const { t } = useTranslation('dashboard-widgets')
  const { user } = useAuth()
  const { data, isLoading } = useDashboardStats(user?.id)

  if (isLoading || !data) return <KpiStripSkeleton />

  // Phase-41 design fixtures: deltas + trends per handoff dashboard.jsx 45-48.
  // TODO Phase 42: extend useDashboardStats to return week-over-week deltas.
  const cards: ReadonlyArray<KpiCard> = [
    {
      label: t('kpi.activeEngagements'),
      value: data.active_engagements,
      meta: t('kpi.activeMeta'),
      delta: 2,
      trend: 'up',
    },
    {
      label: t('kpi.openCommitments'),
      value: data.open_tasks,
      meta: t('kpi.openMeta'),
      delta: -4,
      trend: 'up', // fewer open commitments = good trend
    },
    {
      label: t('kpi.slaAtRisk'),
      value: data.sla_at_risk,
      meta: t('kpi.slaMeta'),
      delta: 2,
      trend: 'down', // more SLA at risk = bad trend
      accent: true,
    },
    {
      label: t('kpi.weekAhead'),
      value: data.upcoming_week,
      meta: t('kpi.weekAheadMeta'),
      delta: 1,
      trend: 'up',
    },
  ]

  return (
    <div
      className="kpi-strip"
      role="group"
      aria-label={t('kpi.strip')}
      data-testid="dashboard-widget-kpi-strip"
    >
      {cards.map((k, i): ReactElement => {
        const accentClass = k.accent === true ? ' kpi-accent' : ''
        return (
          <div key={i} className={`kpi${accentClass}`}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" data-testid="kpi-value">
              <LtrIsolate>{k.value}</LtrIsolate>
              {k.delta != null && k.trend != null && (
                <span className={`kpi-delta ${k.trend}`} dir="ltr">
                  {formatDelta(k.delta)}
                </span>
              )}
            </div>
            {k.meta !== '' && <div className="kpi-meta">{k.meta}</div>}
          </div>
        )
      })}
    </div>
  )
}
