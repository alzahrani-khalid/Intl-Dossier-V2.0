/**
 * Phase 38 Plan 05 — SlaHealth widget (DASH-05).
 *
 * Composition: <Donut> (OK / Risk / Bad SLA segments) + 3-row legend +
 * 14-day <Sparkline> of net open SLA load (created − completed, clamped ≥ 0)
 * derived from `useDashboardTrends('30d').slice(-14)`.
 *
 * Phase 37 signature-visual contract (read carefully):
 *  - <Donut> takes `value: number` + `variants: [ok%, risk%, bad%]` and
 *    fills the three arcs from `var(--ok) / var(--risk) / var(--bad)`
 *    tokens internally. The legend swatches still bind to the SLA-specific
 *    `var(--sla-ok) / var(--sla-risk) / var(--sla-bad)` tokens (Phase 33).
 *  - <Sparkline> auto-flips via `useLocale()` (Phase 37 plan 37-08-04).
 *    DO NOT wrap it in another horizontal-mirror transform — that would
 *    land the trailing dot on the LEFT in Arabic (RESEARCH Pitfall 1,
 *    double-flip).
 *  - <Sparkline> uses `width` / `height` (NOT `w` / `h`).
 *
 * Data shape note (deviation Rule 3 — blocking):
 *   `DashboardStats` exposes only `sla_at_risk` + `open_tasks`. We map:
 *     - bad   = stats.sla_at_risk count beyond a coarse threshold (here
 *               we treat the full `sla_at_risk` as the at-risk band; the
 *               "bad" band is reserved for future schema extension and
 *               currently renders 0 — see open_risks in 38-05-SUMMARY).
 *     - risk  = stats.sla_at_risk
 *     - ok    = max(open_tasks − sla_at_risk, 0)
 *   Donut variants are converted to percentages of the visible total.
 *   Legend counts use raw values (not percentages) per handoff DASH-05.
 */
import { type ReactElement, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Donut, Sparkline } from '@/components/signature-visuals'
import { useAuth } from '@/hooks/useAuth'
import { useDashboardStats } from '@/domains/operations-hub/hooks/useDashboardStats'
import { useDashboardTrends } from '@/hooks/useDashboardTrends'
import { WidgetSkeleton } from './WidgetSkeleton'

const SPARK_DAYS = 14

export function SlaHealth(): ReactElement {
  const { t } = useTranslation('dashboard-widgets')
  const { user } = useAuth()
  const stats = useDashboardStats(user?.id)
  // RESEARCH Pitfall 9 — request '30d' and slice 14 (not '14d', which the
  // hook does not accept — TrendRange is '7d' | '30d' | '90d').
  const trends = useDashboardTrends('30d')

  const sparkSeries = useMemo((): number[] => {
    if (trends.data == null) return []
    // Net open SLA load per day = max(created − completed, 0)
    return trends.data.slice(-SPARK_DAYS).map((d): number => Math.max(0, d.created - d.completed))
  }, [trends.data])

  if (stats.isLoading || trends.isLoading) {
    return <WidgetSkeleton rows={3} />
  }

  if (stats.isError || stats.data == null) {
    return (
      <section
        role="region"
        aria-labelledby="sla-heading"
        className="sla card"
        data-testid="dashboard-widget-sla-health"
      >
        <h3 id="sla-heading" className="card-title mb-1 text-start">
          {t('sla.title')}
        </h3>
        <p className="text-sm text-ink-soft">{t('error.load_failed')}</p>
      </section>
    )
  }

  const stat = stats.data
  const risk = stat.sla_at_risk
  const bad = 0 // schema does not yet differentiate bad from at-risk
  const ok = Math.max(stat.open_tasks - risk - bad, 0)
  const total = ok + risk + bad

  // Donut takes percentages — guard div-by-zero.
  const okPct = total > 0 ? (ok / total) * 100 : 0
  const riskPct = total > 0 ? (risk / total) * 100 : 0
  const badPct = total > 0 ? (bad / total) * 100 : 0
  const variants = [okPct, riskPct, badPct] as const

  const legend = [
    { label: t('sla.legend_ok'), count: ok, swatch: 'var(--sla-ok)', cls: 'ok' },
    { label: t('sla.legend_risk'), count: risk, swatch: 'var(--sla-risk)', cls: 'risk' },
    { label: t('sla.legend_bad'), count: bad, swatch: 'var(--sla-bad)', cls: 'bad' },
  ]

  return (
    <section
      role="region"
      aria-labelledby="sla-heading"
      className="sla card"
      data-testid="dashboard-widget-sla-health"
    >
      <h3 id="sla-heading" className="card-title mb-3 text-start">
        {t('sla.title')}
      </h3>
      <div className="sla-body flex items-center gap-4">
        <div className="sla-donut">
          <Donut value={okPct} variants={variants} size={84} />
        </div>
        <ul className="sla-legend flex-1 space-y-1">
          {legend.map(
            (row): ReactElement => (
              <li key={row.cls} className={`sla-row ${row.cls} flex items-center gap-2 text-xs`}>
                <span
                  className="dot inline-block size-2 rounded-full"
                  style={{ backgroundColor: row.swatch }}
                  aria-hidden="true"
                />
                <span className="flex-1 text-ink text-start">{row.label}</span>
                <span className="sla-count font-mono text-ink-soft">{row.count}</span>
              </li>
            ),
          )}
        </ul>
      </div>
      {/* No parent transform — Sparkline auto-flips via Phase 37 37-08-04. */}
      <div className="sla-spark mt-3">
        <Sparkline data={sparkSeries} width={80} height={22} />
      </div>
    </section>
  )
}
