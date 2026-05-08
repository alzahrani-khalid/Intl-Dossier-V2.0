/**
 * Digest widget.
 *
 * DASH-03 right-panel widget. Renders intelligence-digest feed rows (tag chip
 * + headline + source + relative timestamp) plus a refresh button that triggers
 * a `<GlobeSpinner>` overlay while refetching.
 *
 *   tag       ← digest.tag translation
 *   headline  ← headline_en | headline_ar (by i18n language)
 *   source    ← source_publication
 *   timestamp ← occurred_at
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
import { useIntelligenceDigest, type IntelligenceDigestRow } from '@/hooks/useIntelligenceDigest'
import { WidgetSkeleton } from './WidgetSkeleton'

interface DigestRow {
  id: string
  tag: string
  headline: string
  source: string
  timestamp: string
}

function mapDigestToRow(row: IntelligenceDigestRow, lang: string, tag: string): DigestRow {
  const isAr = lang === 'ar'
  const headline =
    isAr && row.headline_ar !== null && row.headline_ar.trim() !== ''
      ? row.headline_ar
      : row.headline_en
  return {
    id: row.id,
    tag,
    headline,
    source: row.source_publication,
    timestamp: row.occurred_at,
  }
}

export function Digest(): ReactElement {
  const { t, i18n } = useTranslation('dashboard-widgets')
  const { data, isLoading, error, refetch } = useIntelligenceDigest()
  const [clicked, setClicked] = useState<boolean>(false)

  const busy = clicked

  const handleRefresh = async (): Promise<void> => {
    setClicked(true)
    try {
      const result = refetch() as unknown
      if (
        result !== null &&
        result !== undefined &&
        typeof (result as Promise<unknown>).then === 'function'
      ) {
        await (result as Promise<unknown>)
      }
    } finally {
      setClicked(false)
    }
  }

  const rows = useMemo<DigestRow[]>(
    () => (data ?? []).map((row) => mapDigestToRow(row, i18n.language, t('digest.tag'))),
    [data, i18n.language, t],
  )

  if (isLoading) return <WidgetSkeleton rows={4} />

  if (error !== null) {
    return (
      <section
        role="region"
        aria-labelledby="digest-heading"
        className="digest card"
        data-testid="dashboard-widget-digest"
      >
        <h3 id="digest-heading" className="card-title text-start mb-2">
          {t('digest.title')}
        </h3>
        <p className="text-sm text-ink-mute text-start">{t('digest.error')}</p>
      </section>
    )
  }

  return (
    <section
      role="region"
      aria-labelledby="digest-heading"
      className="digest relative card"
      data-testid="dashboard-widget-digest"
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
          <RefreshCcw className={`size-4 ${busy ? 'animate-spin' : ''}`} aria-hidden="true" />
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="text-start py-6">
          <p className="text-sm text-ink text-start">{t('digest.empty.heading')}</p>
          <p className="text-sm text-ink-mute text-start">{t('digest.empty.body')}</p>
        </div>
      ) : (
        <ul className="flex flex-col">
          {rows.map((r) => (
            <li key={r.id} className="digest-row digest-item py-2 flex items-start gap-3 min-h-11">
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
