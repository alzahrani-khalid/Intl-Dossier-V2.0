/**
 * RecentActivitySection — Wave 1 (Phase 41 plan 04) port of the handoff Recent Activity block.
 *
 * Source contract: 41-04-PLAN.md Task 2 + 41-UI-SPEC.md "Verbatim Handoff Anatomy".
 * Field shapes: 41-RESEARCH.md §2 + Pitfall 3 — recent_activities (NOT activities),
 *   actor.name (NOT actor_name), timestamp (NOT created_at), title_en/title_ar
 *   (NOT action_label).
 *
 * Anatomy: 3-column grid (60px time + 24px dot + 1fr who+what) — handoff app.css#L444-446.
 * Time uses formatRelativeTimeShort: '09:42' / 'yday' / '2d' / '22 Apr' bilingual.
 * D-03: top-4 fixed slice; no infinite scroll.
 *
 * Deviation from plan template: plan imported `Icon` from `@/components/signature-visuals`
 * but that barrel does not export `Icon` (Phase 37 only ships GlobeLoader/Sparkline/Donut/
 * GlobeSpinner/FullscreenLoader/DossierGlyph). Plan 41-01 hit the same gap and used
 * lucide-react `X`. Following that precedent, use lucide-react `Dot` (the only generic
 * dot glyph already on the dependency tree) instead of inventing a new Icon component.
 */
import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Dot } from 'lucide-react'
import type { DossierOverviewResponse } from '@/types/dossier-overview.types'
import type { UnifiedActivity } from '@/types/unified-dossier-activity.types'
import { formatRelativeTimeShort } from '@/lib/i18n/relativeTime'
import { LtrIsolate } from '@/components/ui/ltr-isolate'

export interface RecentActivitySectionProps {
  overview?: DossierOverviewResponse | undefined
}

export function RecentActivitySection({
  overview,
}: RecentActivitySectionProps): React.JSX.Element {
  const { t, i18n } = useTranslation('dossier-drawer')
  const lang = i18n.language
  const rows: UnifiedActivity[] =
    overview?.activity_timeline?.recent_activities?.slice(0, 4) ?? []

  return (
    <section className="flex flex-col gap-2" data-testid="dossier-drawer-activity">
      <h3
        className="t-label"
        style={{
          fontSize: 'var(--t-label, 10.5px)',
          fontWeight: 600,
          letterSpacing: 'var(--tracking-label, 0.1em)',
          color: 'var(--ink-mute)',
          textTransform: 'uppercase',
        }}
      >
        {t('section.recent_activity')}
      </h3>

      {rows.length === 0 ? (
        <p style={{ color: 'var(--ink-mute)', fontSize: 'var(--t-body, 13px)' }}>
          {t('empty.recent_activity')}
        </p>
      ) : (
        <div className="act-list" data-testid="dossier-drawer-activity-list">
          {rows.map((a) => {
            const actorName =
              a.actor?.name !== null && a.actor?.name !== undefined && a.actor.name.length > 0
                ? a.actor.name
                : '—'
            const title =
              lang === 'ar' && a.title_ar !== null && a.title_ar !== undefined && a.title_ar.length > 0
                ? a.title_ar
                : a.title_en
            return (
              <div
                key={a.id}
                className="act-row"
                data-testid="dossier-drawer-activity-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 24px 1fr',
                  gap: 10,
                  paddingBlock: 8,
                  paddingInline: 4,
                  borderBlockEnd: '1px solid var(--line-soft)',
                  alignItems: 'baseline',
                  fontSize: 'var(--t-body, 13px)',
                }}
              >
                <LtrIsolate>
                  <span
                    className="act-t"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--t-mono-small, 11px)',
                      color: 'var(--ink-mute)',
                    }}
                  >
                    {formatRelativeTimeShort(a.timestamp, lang)}
                  </span>
                </LtrIsolate>
                <span
                  style={{
                    color: 'var(--ink-faint)',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                  aria-hidden="true"
                >
                  <Dot size={16} />
                </span>
                <div>
                  <span className="act-who" style={{ fontWeight: 500 }}>
                    {actorName}
                  </span>{' '}
                  <span className="act-what" style={{ color: 'var(--ink-mute)' }}>
                    {title}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
