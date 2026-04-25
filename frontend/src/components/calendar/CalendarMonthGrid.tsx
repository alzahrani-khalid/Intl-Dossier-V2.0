// Phase 39 Plan 39-05: CalendarMonthGrid — verbatim handoff .cal-grid 7×N layout
// with bilingual day-of-week header, today highlight, other-month dim, and
// Arabic-Indic digit rendering for day numbers.
//
// Hard rules (CLAUDE.md + 39-CONTEXT D-02):
//  - NEVER .reverse() — RTL handled by document dir
//  - NEVER textAlign: 'right'
//  - Day-of-week labels are static const arrays (handoff verbatim)
//  - Day numbers go through toArDigits in ar locale
import { useMemo, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import {
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  endOfMonth,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
} from 'date-fns'
import { LtrIsolate } from '@/components/ui/ltr-isolate'
import { toArDigits } from '@/lib/i18n/toArDigits'
import { cn } from '@/lib/utils'
import { CalendarEventPill } from './CalendarEventPill'
import type { CalendarEvent } from '@/hooks/useCalendarEvents'

// Verbatim from /tmp/inteldossier-handoff/inteldossier/project/src/pages.jsx#L177
const DOW_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const DOW_AR = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'] as const

export interface CalendarMonthGridProps {
  currentMonth: Date
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onMonthChange?: (date: Date) => void
}

export function CalendarMonthGrid({
  currentMonth,
  events,
  onEventClick,
  onMonthChange,
}: CalendarMonthGridProps): ReactElement {
  const { i18n } = useTranslation('calendar')
  const lang = i18n.language
  const labels = lang === 'ar' ? DOW_AR : DOW_EN

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth))
    const end = endOfWeek(endOfMonth(currentMonth))
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    events.forEach((event) => {
      const key = format(new Date(event.start_datetime), 'yyyy-MM-dd')
      const bucket = map.get(key)
      if (bucket) {
        bucket.push(event)
      } else {
        map.set(key, [event])
      }
    })
    return map
  }, [events])

  const today = new Date()
  const monthStart = startOfMonth(currentMonth)

  const handleCellClick = (day: Date, isOther: boolean): void => {
    if (!isOther || !onMonthChange) return
    const direction = day < monthStart ? -1 : 1
    onMonthChange(addMonths(currentMonth, direction))
  }

  return (
    <div className="cal-grid" data-testid="cal-grid">
      {/* Mobile collapse handled in 39-07 */}
      {labels.map((label, idx) => (
        <div key={`dow-${idx}`} className="cal-dow" data-testid="cal-dow">
          {label}
        </div>
      ))}
      {days.map((day) => {
        const dateKey = format(day, 'yyyy-MM-dd')
        const dayEvents = eventsByDay.get(dateKey) ?? []
        const isOther = !isSameMonth(day, currentMonth)
        const isToday = isSameDay(day, today)
        return (
          <div
            key={dateKey}
            className={cn('cal-cell', isOther && 'other', isToday && 'today')}
            data-testid="cal-cell"
            onClick={(): void => handleCellClick(day, isOther)}
          >
            <LtrIsolate>
              <span className="cal-d" data-testid="cal-d">
                {toArDigits(format(day, 'd'), lang)}
              </span>
            </LtrIsolate>
            {dayEvents.map((event) => (
              <CalendarEventPill key={event.id} event={event} onEventClick={onEventClick} />
            ))}
          </div>
        )
      })}
    </div>
  )
}
