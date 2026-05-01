/**
 * Phase 38 plan 04 — Digest widget.
 *
 * DASH-03 right-panel widget. Renders intelligence-digest feed rows (tag chip
 * + headline + source + relative timestamp) plus a refresh button that triggers
 * a `<GlobeSpinner>` overlay while refetching. First domain-code consumer of
 * the Phase 37 signature visual.
 *
 * Data source: `useActivityFeed` (confirmed via human checkpoint 2026-04-25,
 * Option A). Field mapping contains a documented semantic compromise —
 * see 38-04-SUMMARY.md "Deviations" + `deferred-items.md` for the planned
 * migration to a dedicated `useIntelligenceDigest` hook.
 *
 *   tag       ← entity_type (uppercased)
 *   headline  ← description_en | description_ar (by i18n language)
 *   source    ← actor_name  (NOTE: reads as actor, not publication)
 *   timestamp ← created_at
 *
 * Constraints:
 *  - RTL-safe: logical Tailwind only (ms/me/ps/pe, text-start). No ml/mr/pl/pr.
 *  - GlobeSpinner honors `prefers-reduced-motion` internally (Phase 37 VIZ-03).
 *  - No mock constants — zero handoff imports.
 */

import { type ReactElement, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GlobeSpinner } from '@/components/signature-visuals'
import { useActivityFeed } from '@/hooks/useActivityFeed'
import type { ActivityItem } from '@/types/activity-feed.types'
import { WidgetSkeleton } from './WidgetSkeleton'

interface DigestRow {
  id: string
  tag: string
  headline: string
  source: string
  timestamp: string
}

function mapActivityToRow(a: ActivityItem, lang: string): DigestRow {
  const isAr = lang === 'ar'
  const headline =
    (isAr && a.description_ar !== undefined && a.description_ar !== ''
      ? a.description_ar
      : a.description_en) ?? ''
  return {
    id: a.id,
    tag: a.entity_type.toUpperCase(),
    headline,
    source: a.actor_name,
    timestamp: a.created_at,
  }
}

export function Digest(): ReactElement {
  const { t, i18n } = useTranslation('dashboard-widgets')
  const { activities, isLoading, error, refetch } = useActivityFeed()
  const [clicked, setClicked] = useState<boolean>(false)

  const busy = clicked

  const handleRefresh = async (): Promise<void> => {
    setClicked(true)
    try {
      const result = refetch() as unknown
      if (result !== null && result !== undefined && typeof (result as Promise<unknown>).then === 'function') {
        await (result as Promise<unknown>)
      }
    } finally {
      setClicked(false)
    }
  }

  const rows = useMemo<DigestRow[]>(
    () => (activities ?? []).map((a) => mapActivityToRow(a, i18n.language)),
    [activities, i18n.language],
  )

  if (isLoading) return <WidgetSkeleton rows={4} />

  if (error !== null) {
    return (
      <section
        role="region"
        aria-labelledby="digest-heading"
        className="digest card"
      >
        <h3 id="digest-heading" className="card-title text-start mb-2">
          {t('digest.title')}
        </h3>
        <p className="text-sm text-ink-mute text-start">{t('error.load_failed')}</p>
      </section>
    )
  }

  return (
    <section
      role="region"
      aria-labelledby="digest-heading"
      className="digest relative card"
    >
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 id="digest-heading" className="card-title text-start">
          {t('digest.title')}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={(): void => {
            void handleRefresh()
          }}
          aria-label={t('digest.refresh')}
          disabled={busy}
          className="min-h-11 min-w-11"
        >
          <RefreshCcw
            className={`size-4 ${busy ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-ink-mute text-start py-6">{t('digest.empty')}</p>
      ) : (
        <ul className="flex flex-col">
          {rows.map((r) => (
            <li
              key={r.id}
              className="digest-row digest-item py-2 flex items-start gap-3 min-h-11"
            >
              <Badge variant="outline" className="digest-tag shrink-0">
                {r.tag}
              </Badge>
              <div className="flex-1 min-w-0">
                <div className="digest-head text-sm text-ink text-start">{r.headline}</div>
                <div className="digest-source text-xs text-ink-mute text-start">
                  {r.source}
                  {' · '}
                  {new Date(r.timestamp).toLocaleString(
                    i18n.language === 'ar' ? 'ar-SA' : 'en-US',
                    { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {busy && (
        <div aria-busy="true" className="digest-overlay">
          <GlobeSpinner size={28} />
        </div>
      )}
    </section>
  )
}
