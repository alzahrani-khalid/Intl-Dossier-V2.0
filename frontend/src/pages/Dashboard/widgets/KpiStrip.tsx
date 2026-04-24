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
 * RTL: every numeral wrapped in `<LtrIsolate>` (SP-4) so Latin digits don't
 * reflow under `forceRTL`.
 *
 * No HeroUI <Card> wrapper here — `dashboard.css` already styles `.kpi`
 * with surface/padding/radius from Phase 33 tokens; wrapping in `<Card>`
 * would double-paint borders and break the verbatim handoff layout.
 */

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

export function KpiStrip(): ReactElement {
  const { t } = useTranslation('dashboard-widgets')
  const { user } = useAuth()
  const { data, isLoading } = useDashboardStats(user?.id)

  if (isLoading || !data) return <KpiStripSkeleton />

  const cards: ReadonlyArray<{ label: string; value: number; meta: string; accent?: boolean }> = [
    {
      label: t('kpi.activeEngagements'),
      value: data.active_engagements,
      meta: t('kpi.activeMeta'),
    },
    {
      label: t('kpi.openCommitments'),
      value: data.open_tasks,
      meta: t('kpi.openMeta'),
    },
    {
      label: t('kpi.slaAtRisk'),
      value: data.sla_at_risk,
      meta: t('kpi.slaMeta'),
      accent: true,
    },
    {
      label: t('kpi.weekAhead'),
      value: data.upcoming_week,
      meta: t('kpi.weekAheadMeta'),
    },
  ]

  return (
    <div className="kpi-strip" role="group" aria-label={t('kpi.strip')}>
      {cards.map((k, i): ReactElement => {
        const accentClass = k.accent === true ? ' kpi-accent' : ''
        return (
          <div key={i} className={`kpi${accentClass}`}>
            <div className="kpi-label">{k.label}</div>
            <LtrIsolate className="kpi-value" data-testid="kpi-value">
              {k.value}
            </LtrIsolate>
            {k.meta !== '' && <div className="kpi-meta">{k.meta}</div>}
          </div>
        )
      })}
    </div>
  )
}
