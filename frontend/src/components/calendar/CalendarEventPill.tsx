// Phase 39 Plan 39-06: CalendarEventPill — single-event chip rendered inside .cal-cell.
//
// D-13 fallback (RESEARCH.md Confirmation #4): the live CalendarEvent schema does NOT have
// 'travel' or 'pending' literals (the type field is 'main_event' | 'session' | ... and
// the lifecycle field is 'planned' | 'ongoing' | ...). Per the fallback, we render every event with
// the default .cal-ev (accent-soft) class and emit ONE console.warn per page mount documenting
// the missing schema fields so backend follow-up wires .cal-ev.travel / .cal-ev.pending later
// without touching this JSX.
//
// Plan-vs-schema deviation (Rule 3): the plan's <interfaces> sketch listed `event.title`,
// `event.start`, and `event.dossier.flag`. The real schema (frontend/src/domains/calendar/types)
// uses `title_en` / `title_ar` / `start_datetime` / `end_datetime` and the `dossier` sub-object
// has no `flag` field — only `id` / `type` / `name_en` / `name_ar`. We therefore omit the
// DossierGlyph render (no flag to pass) and rely on the textual title alone, matching what the
// 39-05 grid already exercises.
import { type ReactElement, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { CalendarEvent } from '@/hooks/useCalendarEvents'

export interface CalendarEventPillProps {
  event: CalendarEvent
  onEventClick?: (event: CalendarEvent) => void
}

let didWarn = false

export function CalendarEventPill({ event, onEventClick }: CalendarEventPillProps): ReactElement {
  const { i18n } = useTranslation('calendar')
  const lang = i18n.language

  useEffect((): void => {
    if (!didWarn) {
      didWarn = true
      console.warn(
        '[Phase39] CalendarEvent variants travel/pending not present in schema; rendering all events as default accent-soft. Backend follow-up will wire .cal-ev.travel and .cal-ev.pending classes.',
      )
    }
  }, [])

  const title = lang === 'ar' && event.title_ar ? event.title_ar : (event.title_en ?? event.title_ar ?? event.id)

  return (
    <button
      type="button"
      className="cal-ev"
      onClick={(): void => onEventClick?.(event)}
      aria-label={title}
      style={lang === 'ar' ? { writingDirection: 'rtl' } : undefined}
    >
      <span>{title}</span>
    </button>
  )
}
