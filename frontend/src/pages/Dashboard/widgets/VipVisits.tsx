/**
 * Phase 38 plan 06 — VipVisits widget.
 *
 * Renders upcoming VIP visit rows: <DossierGlyph type="person"> + name + role +
 * <LtrIsolate> `T−N` countdown. The "All" link's arrow-right rotates 180° in
 * RTL (rotate-180) — never mirrored via scaleX (T-38-04).
 *
 * Data: useVipVisits(user?.id) — Wave 1 adapter hook wrapping useUpcomingEvents
 * and filtering event_type === 'vip_visit' (Option B per plan checkpoint).
 * Visual source: handoff dashboard.jsx L189–L207 (verbatim) + widget shell SP-1.
 *
 * Mitigates:
 *   T-38-10 — no data-source discretion; hook was confirmed at checkpoint.
 *   T-38-04 — arrow uses conditional `rotate-180` on isRTL; no scaleX.
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
}

function VipRow({ visit }: VipRowProps): ReactElement {
  return (
    <li className="vip-row min-h-11">
      <DossierGlyph
        type="person"
        iso={visit.personFlag}
        name={visit.name}
        size={20}
        className="vip-flag"
      />
      <div className="min-w-0 flex-1">
        <div className="vip-name text-start truncate">{visit.name}</div>
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
  const isRTL = i18n.language === 'ar'

  if (isLoading) {
    return (
      <section role="region" aria-labelledby="vip-heading" className="vip">
        <h3 id="vip-heading" className="text-sm font-medium mb-3 text-start">
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
        className="vip rounded-lg border border-line p-4"
      >
        <h3 id="vip-heading" className="text-sm font-medium mb-2 text-start">
          {t('vip.title')}
        </h3>
        <p className="text-sm text-start">{t('error.load_failed')}</p>
      </section>
    )
  }

  const visits = data.slice(0, MAX_VISIBLE)

  if (visits.length === 0) {
    return (
      <section
        role="region"
        aria-labelledby="vip-heading"
        className="vip rounded-lg border border-line p-4"
      >
        <h3 id="vip-heading" className="text-sm font-medium mb-2 text-start">
          {t('vip.title')}
        </h3>
        <p className="text-sm text-start">{t('vip.empty')}</p>
      </section>
    )
  }

  return (
    <section role="region" aria-labelledby="vip-heading" className="vip">
      <div className="flex items-center justify-between mb-3">
        <h3 id="vip-heading" className="text-sm font-medium text-start">
          {t('vip.title')}
        </h3>
        <a
          href="/vip-visits"
          className="text-xs text-ink-soft inline-flex items-center gap-1"
          aria-label={t('actions.viewAll')}
        >
          {t('actions.viewAll')}
          <ArrowRight className={`size-3 ${isRTL ? 'rotate-180' : ''}`} aria-hidden="true" />
        </a>
      </div>
      <ul className="vip-list">
        {visits.map(
          (v): ReactElement => (
            <VipRow key={v.id} visit={v} />
          ),
        )}
      </ul>
    </section>
  )
}
