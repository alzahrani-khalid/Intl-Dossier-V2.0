// Phase 39 Plan 39-06 will replace this placeholder.
// CalendarMonthGrid (39-05) imports it; this stub keeps the type graph compiling.
import { type ReactElement } from 'react'
import type { CalendarEvent } from '@/hooks/useCalendarEvents'

export interface CalendarEventPillProps {
  event: CalendarEvent
  onEventClick?: (event: CalendarEvent) => void
}

export function CalendarEventPill({ event, onEventClick }: CalendarEventPillProps): ReactElement {
  return (
    <button
      type="button"
      data-testid="cal-event-pill-stub"
      className="cal-event-pill-stub"
      onClick={(): void => onEventClick?.(event)}
    >
      {event.title_en ?? event.title_ar ?? event.id}
    </button>
  )
}
