// Phase 39 Plan 39-06: CalendarEventPill unit tests
// D-13 fallback (RESEARCH Confirmation #4): live CalendarEvent has no 'travel' / 'pending'
// literals — every event renders default .cal-ev and a single console.warn fires per page mount.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import type { CalendarEvent } from '@/hooks/useCalendarEvents'

// Mock i18n with a mutable language ref so each test can flip locale.
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
  start_datetime: '2026-04-25T09:00:00.000Z',
  end_datetime: '2026-04-25T10:00:00.000Z',
  timezone: 'UTC',
  is_virtual: false,
  status: 'planned',
  created_at: '2026-04-01T00:00:00.000Z',
  updated_at: '2026-04-01T00:00:00.000Z',
  ...overrides,
})

describe('CalendarEventPill', (): void => {
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach((): void => {
    i18nState.language = 'en'
    // Reset module state so the singleton didWarn flag is fresh per test.
    vi.resetModules()
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach((): void => {
    cleanup()
    warnSpy.mockRestore()
  })

  it('renders a button with className "cal-ev" (default — no .travel or .pending)', async (): Promise<void> => {
    const { CalendarEventPill } = await import('../CalendarEventPill')
    const event = makeEvent()
    render(<CalendarEventPill event={event} onEventClick={() => {}} />)
    const button = screen.getByRole('button', { name: 'Sample event' })
    expect(button.tagName).toBe('BUTTON')
    expect(button.className).toBe('cal-ev')
    expect(button.className.includes('travel')).toBeFalsy()
    expect(button.className.includes('pending')).toBeFalsy()
  })

  it('renders title_en when language is en', async (): Promise<void> => {
    const { CalendarEventPill } = await import('../CalendarEventPill')
    i18nState.language = 'en'
    render(<CalendarEventPill event={makeEvent()} onEventClick={() => {}} />)
    expect(screen.getByText('Sample event')).toBeTruthy()
  })

  it('renders title_ar when language is ar', async (): Promise<void> => {
    const { CalendarEventPill } = await import('../CalendarEventPill')
    i18nState.language = 'ar'
    render(<CalendarEventPill event={makeEvent()} onEventClick={() => {}} />)
    expect(screen.getByText('حدث')).toBeTruthy()
  })

  it('falls back to title_en when title_ar is missing in ar locale', async (): Promise<void> => {
    const { CalendarEventPill } = await import('../CalendarEventPill')
    i18nState.language = 'ar'
    const event = makeEvent({ title_ar: undefined })
    render(<CalendarEventPill event={event} onEventClick={() => {}} />)
    expect(screen.getByText('Sample event')).toBeTruthy()
  })

  it('emits exactly one console.warn for the D-13 fallback on first mount', async (): Promise<void> => {
    const { CalendarEventPill } = await import('../CalendarEventPill')
    render(<CalendarEventPill event={makeEvent()} onEventClick={() => {}} />)
    const fallbackCalls = warnSpy.mock.calls.filter((args) => {
      const first = args[0]
      return typeof first === 'string' && first.includes('[Phase39] CalendarEvent variants travel/pending not present in schema')
    })
    expect(fallbackCalls.length).toBe(1)
  })

  it('does not double-warn when multiple pills mount on the same page', async (): Promise<void> => {
    const { CalendarEventPill } = await import('../CalendarEventPill')
    render(
      <>
        <CalendarEventPill event={makeEvent({ id: 'a' })} onEventClick={() => {}} />
        <CalendarEventPill event={makeEvent({ id: 'b' })} onEventClick={() => {}} />
        <CalendarEventPill event={makeEvent({ id: 'c' })} onEventClick={() => {}} />
      </>,
    )
    const fallbackCalls = warnSpy.mock.calls.filter((args) => {
      const first = args[0]
      return typeof first === 'string' && first.includes('[Phase39] CalendarEvent variants travel/pending not present in schema')
    })
    expect(fallbackCalls.length).toBe(1)
  })

  it('fires onEventClick(event) with the exact event object when clicked', async (): Promise<void> => {
    const { CalendarEventPill } = await import('../CalendarEventPill')
    const handler = vi.fn()
    const event = makeEvent({ id: 'click-me' })
    render(<CalendarEventPill event={event} onEventClick={handler} />)
    fireEvent.click(screen.getByRole('button', { name: 'Sample event' }))
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(event)
  })

  it('exposes aria-label equal to the displayed title', async (): Promise<void> => {
    const { CalendarEventPill } = await import('../CalendarEventPill')
    i18nState.language = 'ar'
    render(<CalendarEventPill event={makeEvent()} onEventClick={() => {}} />)
    const button = screen.getByRole('button', { name: 'حدث' })
    expect(button.getAttribute('aria-label')).toBe('حدث')
  })
})
