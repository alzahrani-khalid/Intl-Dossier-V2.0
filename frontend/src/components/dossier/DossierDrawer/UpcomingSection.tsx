/**
 * UpcomingSection — Wave 1 (Phase 41 plan 04) port of the handoff `Upcoming` block.
 *
 * Source contract: 41-04-PLAN.md Task 1 + 41-UI-SPEC.md "Verbatim Handoff Anatomy".
 * Field shapes: 41-RESEARCH.md §2 — DossierCalendarEvent has NO counterpart/status; we
 * render bilingual day-of-week + Arabic-Indic date + title + location.
 *
 * Decision references: D-03 (top-2 slice), CLAUDE.md (date `Tue 28 Apr` mono, no emoji,
 * logical-only direction).
 */
import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import type { DossierOverviewResponse, DossierCalendarEvent } from '@/types/dossier-overview.types'
import { LtrIsolate } from '@/components/ui/ltr-isolate'
import { formatWeekdayDayMonth } from '@/lib/format-date'

export interface UpcomingSectionProps {
  overview?: DossierOverviewResponse | undefined
}

export function UpcomingSection({ overview }: UpcomingSectionProps): React.JSX.Element {
  const { t, i18n } = useTranslation('dossier-drawer')
  const lang = i18n.language
  const events = (overview?.calendar_events?.upcoming ?? []).slice(0, 2)

  return (
    <section className="flex flex-col gap-2" data-testid="dossier-drawer-upcoming">
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
        {t('section.upcoming')}
      </h3>

      {events.length === 0 ? (
        <p style={{ color: 'var(--ink-mute)', fontSize: 'var(--t-body, 13px)' }}>
          {t('empty.upcoming')}
        </p>
      ) : (
        <ul className="week-list" data-testid="dossier-drawer-upcoming-list">
          {events.map((ev) => (
            <UpcomingRow key={ev.id} event={ev} lang={lang} />
          ))}
        </ul>
      )}
    </section>
  )
}

function UpcomingRow({
  event,
  lang,
}: {
  event: DossierCalendarEvent
  lang: string
}): React.JSX.Element {
  const start = new Date(event.start_datetime)
  const dayLine = formatWeekdayDayMonth(start)
  const timeStr = !event.is_all_day
    ? `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`
    : null
  const title = lang === 'ar' && event.title_ar !== null ? event.title_ar : event.title_en
  const location =
    lang === 'ar' && event.location_ar !== null ? event.location_ar : event.location_en

  return (
    <li className="week-row flex items-center gap-2" data-testid="dossier-drawer-upcoming-row">
      <LtrIsolate>
        <span className="week-date" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          {dayLine}
        </span>
      </LtrIsolate>
      {timeStr !== null ? (
        <LtrIsolate>
          <span className="week-time" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            {timeStr}
          </span>
        </LtrIsolate>
      ) : null}
      <span className="week-title flex-1" style={{ fontSize: 'var(--t-body, 13px)' }}>
        {title}
      </span>
      {location !== null && location.length > 0 ? (
        <span
          className="week-loc"
          style={{ color: 'var(--ink-mute)', fontSize: 'var(--t-meta, 12px)' }}
        >
          {location}
        </span>
      ) : null}
    </li>
  )
}
