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
 * Honesty rule (dashboard inspection 2026-06-09, Findings 2+3): the Phase 41
 * hardcoded delta chips and the static i18n meta lines ("5 this week · 3
 * travel") were fabricated fixtures, not data. Both are removed until
 * `get_dashboard_stats` (or a successor RPC) returns real week-over-week
 * deltas / breakdowns. `delta`/`trend`/`meta` stay on the interface so the
 * render path is ready when real values exist.
 *
 * RTL: every numeral wrapped in `<LtrIsolate>` (SP-4) so Latin digits don't
 * reflow under `forceRTL`. Delta uses `dir="ltr"` for the same reason.
 */

interface KpiCard {
  label: string
  value: number
  meta?: string
  delta?: number
  trend?: 'up' | 'down'
  accent?: boolean
}

function KpiStripSkeleton(): ReactElement {
  return (
    <div className="kpi-strip" aria-hidden="true">
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

  // Counts only — no fabricated deltas/meta. TODO Phase 42: extend
  // useDashboardStats to return week-over-week deltas + meta breakdowns,
  // then populate `delta`/`trend`/`meta` from the payload.
  const cards: ReadonlyArray<KpiCard> = [
    { label: t('kpi.activeEngagements'), value: data.active_engagements },
    { label: t('kpi.openCommitments'), value: data.open_tasks },
    { label: t('kpi.slaAtRisk'), value: data.sla_at_risk, accent: true },
    { label: t('kpi.weekAhead'), value: data.upcoming_week },
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
            {k.meta != null && k.meta !== '' && <div className="kpi-meta">{k.meta}</div>}
          </div>
        )
      })}
    </div>
  )
}
