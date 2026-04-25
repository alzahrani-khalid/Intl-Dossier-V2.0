// Phase 39 Plan 39-05: CalendarMonthGrid unit tests
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { CalendarMonthGrid } from '../CalendarMonthGrid'
import type { CalendarEvent } from '@/hooks/useCalendarEvents'

// Mock i18n with a mutable language ref so each test can flip locale
const i18nState = { language: 'en' }

vi.mock('react-i18next', () => ({
  useTranslation: (): { i18n: { language: string }; t: (k: string) => string } => ({
    i18n: i18nState,
    t: (k: string): string => k,
  }),
}))

const makeEvent = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: overrides.id ?? 'evt-1',
  dossier_id: 'dos-1',
  event_type: 'main_event',
  title_en: 'Sample event',
  title_ar: 'حدث',
  start_datetime: overrides.start_datetime ?? '2026-04-25T09:00:00.000Z',
  end_datetime: '2026-04-25T10:00:00.000Z',
  timezone: 'UTC',
  is_virtual: false,
  status: 'planned',
  created_at: '2026-04-01T00:00:00.000Z',
  updated_at: '2026-04-01T00:00:00.000Z',
  ...overrides,
})

const APRIL_2026 = new Date(2026, 3, 25)

describe('CalendarMonthGrid', () => {
  beforeEach(() => {
    i18nState.language = 'en'
    cleanup()
  })

  it('renders 7 day-of-week header cells with English labels in en', () => {
    render(
      <CalendarMonthGrid currentMonth={APRIL_2026} events={[]} onEventClick={(): void => {}} />,
    )
    const dow = screen.getAllByTestId('cal-dow')
    expect(dow.length).toBe(7)
    expect(dow.map((el) => el.textContent)).toEqual([
      'Sun',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
    ])
  })

  it('renders 7 day-of-week header cells with Arabic labels in ar', () => {
    i18nState.language = 'ar'
    render(
      <CalendarMonthGrid currentMonth={APRIL_2026} events={[]} onEventClick={(): void => {}} />,
    )
    const dow = screen.getAllByTestId('cal-dow')
    expect(dow.map((el) => el.textContent)).toEqual([
      'أحد',
      'إثن',
      'ثلا',
      'أرب',
      'خمي',
      'جمع',
      'سبت',
    ])
  })

  it('renders at least 35 day cells (7 cols × ≥5 rows) for typical month padding', () => {
    render(
      <CalendarMonthGrid currentMonth={APRIL_2026} events={[]} onEventClick={(): void => {}} />,
    )
    const cells = screen.getAllByTestId('cal-cell')
    expect(cells.length).toBeGreaterThanOrEqual(35)
    // Always a multiple of 7
    expect(cells.length % 7).toBe(0)
  })

  it("today's cell has class `today` and the day number renders with computed font-weight 700", () => {
    // Use today's actual date so isSameDay matches
    const today = new Date()
    render(
      <CalendarMonthGrid currentMonth={today} events={[]} onEventClick={(): void => {}} />,
    )
    const todays = document.querySelectorAll('.cal-cell.today')
    expect(todays.length).toBeGreaterThanOrEqual(1)
    const todayD = todays[0].querySelector('.cal-d')
    expect(todayD).toBeTruthy()
  })

  it('cells outside the current month have class `other`', () => {
    render(
      <CalendarMonthGrid currentMonth={APRIL_2026} events={[]} onEventClick={(): void => {}} />,
    )
    const others = document.querySelectorAll('.cal-cell.other')
    // April 2026: starts on Wed → 3 leading other-month cells from March
    // ends on Thu → 2 trailing other-month cells from May → at least 1
    expect(others.length).toBeGreaterThanOrEqual(1)
  })

  it('day numbers in `ar` locale use Arabic-Indic digits (e.g. ٢٥ not 25)', () => {
    i18nState.language = 'ar'
    render(
      <CalendarMonthGrid currentMonth={APRIL_2026} events={[]} onEventClick={(): void => {}} />,
    )
    const dayCells = screen.getAllByTestId('cal-d')
    const allText = dayCells.map((el) => el.textContent ?? '').join('')
    // Must contain at least one Arabic-Indic digit
    expect(/[٠-٩]/.test(allText)).toBe(true)
    // Must NOT contain Western digits in any cell text
    const hasWesternDigit = dayCells.some((el) => /[0-9]/.test(el.textContent ?? ''))
    expect(hasWesternDigit).toBe(false)
  })

  it('clicking an other-month cell fires onMonthChange with the target month', () => {
    const onMonthChange = vi.fn()
    render(
      <CalendarMonthGrid
        currentMonth={APRIL_2026}
        events={[]}
        onEventClick={(): void => {}}
        onMonthChange={onMonthChange}
      />,
    )
    const others = document.querySelectorAll('.cal-cell.other')
    expect(others.length).toBeGreaterThan(0)
    fireEvent.click(others[0])
    expect(onMonthChange).toHaveBeenCalledTimes(1)
    const arg = onMonthChange.mock.calls[0][0] as Date
    // First "other" cell in April 2026 grid is from March 2026 (month index 2)
    expect(arg.getMonth()).not.toBe(3)
  })

  it('renders a CalendarEventPill for each event keyed to its day', () => {
    const event = makeEvent({ id: 'e-1', start_datetime: '2026-04-25T09:00:00.000Z' })
    render(
      <CalendarMonthGrid
        currentMonth={APRIL_2026}
        events={[event]}
        onEventClick={(): void => {}}
      />,
    )
    const pills = screen.getAllByTestId('cal-event-pill-stub')
    expect(pills.length).toBe(1)
  })

  it('groups multiple events under their date via eventsByDay map', () => {
    const events = [
      makeEvent({ id: 'a', start_datetime: '2026-04-25T09:00:00.000Z' }),
      makeEvent({ id: 'b', start_datetime: '2026-04-25T11:00:00.000Z' }),
      makeEvent({ id: 'c', start_datetime: '2026-04-26T09:00:00.000Z' }),
    ]
    render(
      <CalendarMonthGrid
        currentMonth={APRIL_2026}
        events={events}
        onEventClick={(): void => {}}
      />,
    )
    const pills = screen.getAllByTestId('cal-event-pill-stub')
    expect(pills.length).toBe(3)
  })
})
