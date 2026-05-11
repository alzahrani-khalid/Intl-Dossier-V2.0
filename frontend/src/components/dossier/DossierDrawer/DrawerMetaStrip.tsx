/**
 * DrawerMetaStrip — Wave 1 (Phase 41 plan 02 Task 2) — 4-segment meta strip.
 *
 * Renders per pages.jsx#L498-503:
 *   [📍location] · [Lead: name|—] · [N engagements] · [last touched]
 *
 * Notes:
 *   - Replaces handoff `📍` emoji with lucide-react `MapPin` (CLAUDE.md
 *     "No emoji in user-visible copy"; UI-SPEC anti-list).
 *   - Engagement count is wrapped in <LtrIsolate> so Indic digits render LTR
 *     inside the surrounding RTL line (Phase 38 pattern).
 *   - Last-touched semantics differ from formatRelativeTimeShort: this strip
 *     uses labelled keys (today / yesterday / N-day relative) per UI-SPEC
 *     Copywriting Contract; raw "HH:mm" is reserved for activity-row times.
 */
import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { differenceInCalendarDays } from 'date-fns'
import { MapPin } from 'lucide-react'
import { toArDigits } from '@/lib/i18n/toArDigits'
import { LtrIsolate } from '@/components/ui/ltr-isolate'

export interface DrawerMetaStripProps {
  dossierId: string
  metadata?: Record<string, unknown> | undefined
  updatedAt?: string | undefined
  engagementCount?: number
}

const DOT = '·' // U+00B7 middle dot

function readString(metadata: Record<string, unknown> | undefined, key: string): string | null {
  if (metadata === undefined) return null
  const v = metadata[key]
  return typeof v === 'string' && v.length > 0 ? v : null
}

export function DrawerMetaStrip(props: DrawerMetaStripProps): React.JSX.Element {
  const { metadata, updatedAt, engagementCount = 0 } = props
  const { t, i18n } = useTranslation('dossier-drawer')
  const lang = i18n.language

  const region = readString(metadata, 'region')
  const location = region ?? t('meta.location_fallback')

  const leadName = readString(metadata, 'lead_name')
  const leadSegment = leadName !== null ? `${t('meta.lead_prefix')}: ${leadName}` : '—'

  const engagementSegment = `${toArDigits(engagementCount, lang)} ${t('meta.engagements_suffix')}`

  let lastTouched: string
  if (typeof updatedAt === 'string' && updatedAt.length > 0) {
    const days = differenceInCalendarDays(new Date(), new Date(updatedAt))
    if (days <= 0) {
      lastTouched = t('meta.last_touched_today')
    } else if (days === 1) {
      lastTouched = t('meta.last_touched_yesterday')
    } else {
      lastTouched = t('meta.last_touched_relative', { n: toArDigits(days, lang) })
    }
  } else {
    lastTouched = t('meta.last_touched_today')
  }

  return (
    <div className="drawer-meta flex items-center gap-2 flex-wrap">
      <span className="inline-flex items-center gap-1">
        <MapPin size={14} className="shrink-0" />
        {location}
      </span>
      <span aria-hidden="true">{DOT}</span>
      <span>{leadSegment}</span>
      <span aria-hidden="true">{DOT}</span>
      <LtrIsolate className="inline-flex">{engagementSegment}</LtrIsolate>
      <span aria-hidden="true">{DOT}</span>
      <span>{lastTouched}</span>
    </div>
  )
}
