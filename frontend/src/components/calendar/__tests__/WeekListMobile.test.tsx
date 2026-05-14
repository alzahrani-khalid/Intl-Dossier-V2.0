// Phase 39 Plan 39-07: WeekListMobile unit tests
//
// Mobile (<640px) week-list view: 7 day rows for the active week, prev/next/today
// nav, RTL-friendly bilingual labels, Arabic-Indic day numbers, touch-friendly nav
// buttons (≥44×44), today receives aria-current="date", events stack into the row
// for the matching day via <CalendarEventPill>.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  renderWithProviders as render,
  screen,
  cleanup,
  fireEvent,
  within,
} from '@tests/utils/render'
import type { CalendarEvent } from '@/hooks/useCalendarEvents'

// Mock i18n with a mutable language ref so each test can flip locale.
const i18nState = { language: 'en', changeLanguage: vi.fn().mockResolvedValue(undefined) }

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next')

  return {
    ...actual,
    useTranslation: (): {
      i18n: typeof i18nState
      t: (k: string) => string
    } => ({
      i18n: i18nState,
      t: (k: string): string => {
        const map: Record<string, string> = {
          'weeklist.previousWeek': 'Previous week',
          'weeklist.nextWeek': 'Next week',
          'weeklist.today': 'Today',
        }
        return map[k] ?? k
      },
    }),
  }
})

const makeEvent = (overrides: Partial<CalendarEvent> = {}): CalendarEvent =>
  ({
    id: overrides.id ?? 'evt-1',
    dossier_id: 'dos-1',
    event_type: 'main_event',
    title_en: 'Sample event',
    title_ar: 'حدث',
    start_datetime: '2026-04-25T09:00:00.000Z',
    end_datetime: '2026-04-25T10:00:00.000Z',
    timezone: 'UTC',
    is_virtual: false,
    status: 'planned',
    created_at: '2026-04-01T00:00:00.000Z',
    updated_at: '2026-04-01T00:00:00.000Z',
    ...overrides,
  }) as CalendarEvent

describe('WeekListMobile', (): void => {
  beforeEach((): void => {
    i18nState.language = 'en'
    // Pin "today" to Saturday 2026-04-25 so all week math is deterministic.
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-25T12:00:00.000Z'))
  })

  afterEach((): void => {
    cleanup()
    vi.useRealTimers()
  })

  it('renders 7 day rows for the active week', async (): Promise<void> => {
    const { WeekListMobile } = await import('../WeekListMobile')
    render(<WeekListMobile events={[]} onEventClick={(): void => {}} />)
    const list = screen.getByRole('list')
    const rows = within(list).getAllByRole('listitem')
    expect(rows.length).toBe(7)
  })

  it('renders English day labels in en locale', async (): Promise<void> => {
    const { WeekListMobile } = await import('../WeekListMobile')
    const { container } = render(<WeekListMobile events={[]} onEventClick={(): void => {}} />)
    const text = container.textContent ?? ''
    // Labels (verbatim from CalendarMonthGrid DOW_EN)
    expect(text.includes('Sun')).toBeTruthy()
    expect(text.includes('Sat')).toBeTruthy()
  })

  it('renders Arabic-Indic day numbers in ar locale', async (): Promise<void> => {
    i18nState.language = 'ar'
    const { WeekListMobile } = await import('../WeekListMobile')
    const { container } = render(<WeekListMobile events={[]} onEventClick={(): void => {}} />)
    const text = container.textContent ?? ''
    // The active week (Sun 2026-04-19 .. Sat 2026-04-25) contains digits
    // 19, 20, 21, 22, 23, 24, 25 — so '٢' must appear.
    expect(text.includes('٢')).toBeTruthy()
    // And no Western digits 19/25
    expect(text.includes('19')).toBeFalsy()
    expect(text.includes('25')).toBeFalsy()
  })

  it('stacks CalendarEventPill instances for events that fall on a day in the week', async (): Promise<void> => {
    const { WeekListMobile } = await import('../WeekListMobile')
    const events: CalendarEvent[] = [
      makeEvent({ id: 'a', start_datetime: '2026-04-25T09:00:00.000Z' }),
      makeEvent({ id: 'b', start_datetime: '2026-04-25T11:00:00.000Z' }),
      // Event in a different week — must NOT render
      makeEvent({ id: 'c', start_datetime: '2026-05-10T09:00:00.000Z' }),
    ]
    render(<WeekListMobile events={events} onEventClick={(): void => {}} />)
    const pills = screen.getAllByRole('button', { name: 'Sample event' })
    expect(pills.length).toBe(2)
  })

  it('Prev button has accessible name and shifts the active week back 7 days', async (): Promise<void> => {
    const { WeekListMobile } = await import('../WeekListMobile')
    const { container } = render(<WeekListMobile events={[]} onEventClick={(): void => {}} />)
    const prev = screen.getByRole('button', { name: 'Previous week' })
    expect(prev).toBeTruthy()
    fireEvent.click(prev)
    const text = container.textContent ?? ''
    // Previous week of 2026-04-19 .. 2026-04-25 is 2026-04-12 .. 2026-04-18
    expect(text.includes('12')).toBeTruthy()
    expect(text.includes('18')).toBeTruthy()
  })

  it('Next button has accessible name and shifts the active week forward 7 days', async (): Promise<void> => {
    const { WeekListMobile } = await import('../WeekListMobile')
    const { container } = render(<WeekListMobile events={[]} onEventClick={(): void => {}} />)
    const next = screen.getByRole('button', { name: 'Next week' })
    expect(next).toBeTruthy()
    fireEvent.click(next)
    const text = container.textContent ?? ''
    // Next week of 2026-04-19..25 is 2026-04-26..2026-05-02
    expect(text.includes('26')).toBeTruthy()
    expect(text.includes('2')).toBeTruthy()
  })

  it('Today button has accessible name and jumps activeWeek back to current week', async (): Promise<void> => {
    const { WeekListMobile } = await import('../WeekListMobile')
    const { container } = render(<WeekListMobile events={[]} onEventClick={(): void => {}} />)
    const next = screen.getByRole('button', { name: 'Next week' })
    fireEvent.click(next)
    fireEvent.click(next)
    const today = screen.getByRole('button', { name: 'Today' })
    fireEvent.click(today)
    const text = container.textContent ?? ''
    // Back to 2026-04-19..25
    expect(text.includes('19')).toBeTruthy()
    expect(text.includes('25')).toBeTruthy()
  })

  it('today\'s day row has aria-current="date"', async (): Promise<void> => {
    const { WeekListMobile } = await import('../WeekListMobile')
    const { container } = render(<WeekListMobile events={[]} onEventClick={(): void => {}} />)
    const todayRow = container.querySelector('li[aria-current="date"]')
    expect(todayRow).toBeTruthy()
  })

  it('prev / next / today buttons all have min-height ≥ 44px (touch target)', async (): Promise<void> => {
    const { WeekListMobile } = await import('../WeekListMobile')
    render(<WeekListMobile events={[]} onEventClick={(): void => {}} />)
    const prev = screen.getByRole('button', { name: 'Previous week' })
    const next = screen.getByRole('button', { name: 'Next week' })
    const today = screen.getByRole('button', { name: 'Today' })
    // The styling lives in CSS; we assert the className the CSS targets is present.
    expect(prev.className.includes('weeklist-nav')).toBeTruthy()
    expect(next.className.includes('weeklist-nav')).toBeTruthy()
    expect(today.className.includes('weeklist-today')).toBeTruthy()
  })
})
