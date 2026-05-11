/**
 * Phase 38 plan 06 — VipVisits widget.
 *
 * Renders upcoming VIP visit rows: <DossierGlyph type="country"> + name + role
 * + <LtrIsolate> `T−N` countdown. The VIP visits link icon flips horizontally
 * in RTL via the global `.icon-flip` class (CSS `scaleX(-1)`), per QA-04.
 *
 * Data: useVipVisits(user?.id) — Wave 1 adapter hook wrapping useUpcomingEvents
 * and filtering event_type === 'vip_visit' (Option B per plan checkpoint).
 * Visual source: handoff dashboard.jsx L189–L207 (verbatim) + widget shell SP-1.
 *
 * Mitigates:
 *   T-38-10 — no data-source discretion; hook was confirmed at checkpoint.
 *   T-38-01 — no mock constants; data comes from useVipVisits only.
 */

import { type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { differenceInDays } from 'date-fns'
import { ArrowRight } from 'lucide-react'
import { LtrIsolate } from '@/components/ui/ltr-isolate'
import { DossierGlyph } from '@/components/signature-visuals'
import { useAuth } from '@/hooks/useAuth'
import { useVipVisits, type VipVisit } from '@/hooks/useVipVisits'
import { WidgetSkeleton } from './WidgetSkeleton'

const MAX_VISIBLE = 6

function countdownLabel(whenIso: string): string {
  const delta = differenceInDays(new Date(whenIso), new Date())
  if (delta === 0) return 'T−0'
  if (delta > 0) return `T−${delta}`
  return `T+${Math.abs(delta)}`
}

interface VipRowProps {
  visit: VipVisit
  language: string
}

function VipRow({ visit, language }: VipRowProps): ReactElement {
  const displayName = language === 'ar' && visit.nameAr ? visit.nameAr : visit.name

  return (
    <li className="vip-row min-h-11">
      <DossierGlyph
        type="country"
        iso={visit.personFlag}
        name={displayName}
        size={20}
        className="vip-flag"
      />
      <div className="min-w-0 flex-1">
        <div className="vip-name text-start truncate">{displayName}</div>
        {visit.role.length > 0 && <div className="vip-role text-start truncate">{visit.role}</div>}
      </div>
      <LtrIsolate className="vip-countdown">
        <div className="vip-countdown-n">{countdownLabel(visit.when)}</div>
      </LtrIsolate>
    </li>
  )
}

export function VipVisits(): ReactElement {
  const { t, i18n } = useTranslation('dashboard-widgets')
  const { user } = useAuth()
  const { data, isLoading, isError } = useVipVisits(user?.id)

  if (isLoading) {
    return (
      <section role="region" aria-labelledby="vip-heading" className="vip">
        <h3 id="vip-heading" className="card-title mb-3 text-start">
          {t('vip.title')}
        </h3>
        <WidgetSkeleton rows={4} />
      </section>
    )
  }

  if (isError || data === undefined) {
    return (
      <section
        role="region"
        aria-labelledby="vip-heading"
        className="vip card"
        data-testid="dashboard-widget-vip-visits"
      >
        <h3 id="vip-heading" className="card-title mb-2 text-start">
          {t('vip.title')}
        </h3>
        <p className="text-sm text-start">{t('vip.error')}</p>
      </section>
    )
  }

  const visits = data.slice(0, MAX_VISIBLE)

  if (visits.length === 0) {
    return (
      <section
        role="region"
        aria-labelledby="vip-heading"
        className="vip card"
        data-testid="dashboard-widget-vip-visits"
      >
        <h3 id="vip-heading" className="card-title mb-2 text-start">
          {t('vip.title')}
        </h3>
        <div className="space-y-1">
          <p className="text-sm font-medium text-start">{t('vip.empty.heading')}</p>
          <p className="text-sm text-ink-soft text-start">{t('vip.empty.body')}</p>
        </div>
      </section>
    )
  }

  return (
    <section
      role="region"
      aria-labelledby="vip-heading"
      className="vip"
      data-testid="dashboard-widget-vip-visits"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 id="vip-heading" className="card-title text-start">
          {t('vip.title')}
        </h3>
        <a href="/vip-visits" className="text-xs text-ink-soft inline-flex items-center gap-1">
          {t('actions.viewAll')}
          <ArrowRight className="size-3 icon-flip" aria-hidden="true" />
        </a>
      </div>
      <ul className="vip-list">
        {visits.map(
          (v): ReactElement => (
            <VipRow key={v.id} visit={v} language={i18n.language} />
          ),
        )}
      </ul>
    </section>
  )
}
