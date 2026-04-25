// Phase 39 Plan 39-07: WeekListMobile — mobile (<640px) week-row view replacing
// the 7×5 cal-grid. Renders 7 day rows for the active week with prev/next/today
// nav. Bilingual labels reuse the same DOW arrays as CalendarMonthGrid (39-05).
// Day numbers go through toArDigits() so AR locale renders Indic glyphs.
//
// Hard rules (RTL/CLAUDE.md):
//   - NEVER textAlign: 'right' (forceRTL flips it to LEFT)
//   - NEVER physical-direction Tailwind (ml-*, mr-*, pl-*, pr-*)
//   - NEVER .reverse() on day arrays — forceRTL handles visual direction
//   - Touch targets ≥ 44×44 — enforced via .weeklist-nav / .weeklist-today CSS
import { type ReactElement, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format, startOfWeek, addDays, isSameDay, addWeeks } from 'date-fns'
import { LtrIsolate } from '@/components/ui/ltr-isolate'
import { toArDigits } from '@/lib/i18n/toArDigits'
import { CalendarEventPill } from './CalendarEventPill'
import type { CalendarEvent } from '@/hooks/useCalendarEvents'

// Verbatim mirror of CalendarMonthGrid (39-05) DOW arrays — keep in sync.
const DOW_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const DOW_AR = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'] as const

export interface WeekListMobileProps {
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
}

export function WeekListMobile({ events, onEventClick }: WeekListMobileProps): ReactElement {
  const { t, i18n } = useTranslation('calendar')
  const lang = i18n.language
  const [activeWeek, setActiveWeek] = useState<Date>(() => startOfWeek(new Date()))

  const days: Date[] = Array.from({ length: 7 }, (_, i): Date => addDays(activeWeek, i))
  const labels = lang === 'ar' ? DOW_AR : DOW_EN

  const handlePrev = (): void => {
    setActiveWeek(addWeeks(activeWeek, -1))
  }
  const handleNext = (): void => {
    setActiveWeek(addWeeks(activeWeek, 1))
  }
  const handleToday = (): void => {
    setActiveWeek(startOfWeek(new Date()))
  }
  const handleEventClick = (event: CalendarEvent): void => {
    onEventClick?.(event)
  }

  return (
    <div className="week-list-mobile">
      <div className="week-list-toolbar">
        <button
          type="button"
          className="weeklist-nav"
          onClick={handlePrev}
          aria-label={t('weeklist.previousWeek')}
        >
          ‹
        </button>
        <button type="button" className="weeklist-today" onClick={handleToday}>
          {t('weeklist.today')}
        </button>
        <button
          type="button"
          className="weeklist-nav"
          onClick={handleNext}
          aria-label={t('weeklist.nextWeek')}
        >
          ›
        </button>
      </div>
      <ul className="week-list" aria-live="polite">
        {days.map((d): ReactElement => {
          const isToday = isSameDay(d, new Date())
          const dayEvents = events.filter((ev): boolean =>
            isSameDay(new Date(ev.start_datetime), d),
          )
          return (
            <li
              key={d.toISOString()}
              className="day-row"
              {...(isToday ? { 'aria-current': 'date' as const } : {})}
            >
              <span className="day-row-label">
                <span>{labels[d.getDay()]}</span>{' '}
                <LtrIsolate>
                  <span className="font-mono">{toArDigits(format(d, 'd'), lang)}</span>
                </LtrIsolate>
              </span>
              <div className="day-row-events">
                {dayEvents.map(
                  (ev): ReactElement => (
                    <CalendarEventPill key={ev.id} event={ev} onEventClick={handleEventClick} />
                  ),
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
