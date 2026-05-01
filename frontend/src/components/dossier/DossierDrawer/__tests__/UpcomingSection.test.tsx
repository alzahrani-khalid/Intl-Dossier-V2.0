/**
 * UpcomingSection — Wave 1 (Phase 41 plan 04) tests.
 *
 * Behavior asserted (per 41-04-PLAN.md Task 1):
 *   1. With 5 upcoming events, renders only top 2 rows
 *   2. With 0 upcoming events, renders t('empty.upcoming') (no week-list)
 *   3. Each row shows bilingual day-of-week + day + month (Tue 28 Apr / الثلاثاء)
 *   4. Each row shows time HH:mm wrapped in LtrIsolate; suppressed when is_all_day===true
 *   5. Each row shows event title_en under EN, title_ar under AR (when present)
 *   6. Each row shows location_en/location_ar when present (no rendering when null)
 *   7. Section heading renders t('section.upcoming')
 */
import { render, screen, cleanup, within } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'

const i18nState: { language: string } = { language: 'en' }

vi.mock('react-i18next', () => ({
  useTranslation: (): {
    t: (key: string) => string
    i18n: { language: string }
  } => ({
    t: (key: string): string => key,
    i18n: { language: i18nState.language },
  }),
}))

import { UpcomingSection } from '../UpcomingSection'
import type {
  DossierOverviewResponse,
  DossierCalendarEvent,
} from '@/types/dossier-overview.types'

function buildEvent(overrides: Partial<DossierCalendarEvent>): DossierCalendarEvent {
  return {
    id: 'evt-default',
    title_en: 'Default title',
    title_ar: null,
    event_type: 'meeting',
    start_datetime: '2026-04-28T14:30:00Z',
    end_datetime: null,
    is_all_day: false,
    location_en: null,
    location_ar: null,
    is_virtual: false,
    meeting_link: null,
    description_en: null,
    description_ar: null,
    created_at: '2026-04-01T00:00:00Z',
    ...overrides,
  }
}

function buildOverview(events: DossierCalendarEvent[]): DossierOverviewResponse {
  return {
    calendar_events: { upcoming: events, past: [], today: [], total_count: events.length },
    activity_timeline: { recent_activities: [], has_more: false, next_cursor: null, total_count: 0 },
  } as unknown as DossierOverviewResponse
}

afterEach(() => {
  i18nState.language = 'en'
  cleanup()
})

describe('UpcomingSection', () => {
  it('with 5 upcoming events, renders only top 2 rows', () => {
    const events = Array.from({ length: 5 }, (_, i) =>
      buildEvent({
        id: `evt-${i}`,
        title_en: `Event ${i}`,
        start_datetime: `2026-04-${String(20 + i).padStart(2, '0')}T10:00:00Z`,
      }),
    )
    render(<UpcomingSection overview={buildOverview(events)} />)
    const rows = screen.getAllByTestId('dossier-drawer-upcoming-row')
    expect(rows).toHaveLength(2)
    expect(screen.getByText('Event 0')).toBeTruthy()
    expect(screen.getByText('Event 1')).toBeTruthy()
    expect(screen.queryByText('Event 2')).toBeNull()
  })

  it('with 0 upcoming events, renders empty.upcoming (no week-list)', () => {
    render(<UpcomingSection overview={buildOverview([])} />)
    expect(screen.getByText('empty.upcoming')).toBeTruthy()
    expect(screen.queryByTestId('dossier-drawer-upcoming-list')).toBeNull()
  })

  it('renders bilingual day-of-week + day + month under EN', () => {
    const event = buildEvent({
      id: 'evt-1',
      title_en: 'Meeting alpha',
      start_datetime: '2026-04-28T14:30:00Z',
    })
    render(<UpcomingSection overview={buildOverview([event])} />)
    const expected = format(new Date(event.start_datetime), 'EEE d MMM', { locale: enUS })
    expect(screen.getByText(expected)).toBeTruthy()
  })

  it('renders Arabic day-of-week + Arabic-Indic digits under AR', () => {
    i18nState.language = 'ar'
    const event = buildEvent({
      id: 'evt-1',
      title_en: 'Meeting alpha',
      title_ar: 'اجتماع ألفا',
      start_datetime: '2026-04-28T14:30:00Z',
    })
    render(<UpcomingSection overview={buildOverview([event])} />)
    const formatted = format(new Date(event.start_datetime), 'EEE d MMM', { locale: ar })
    // Convert any ASCII digits to Arabic-Indic digits
    const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
    const expected = formatted.replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)])
    expect(screen.getByText(expected)).toBeTruthy()
    expect(screen.getByText('اجتماع ألفا')).toBeTruthy()
  })

  it('renders time HH:mm in LtrIsolate when is_all_day is false', () => {
    const event = buildEvent({
      id: 'evt-1',
      title_en: 'Timed meeting',
      start_datetime: '2026-04-28T14:30:00Z',
      is_all_day: false,
    })
    render(<UpcomingSection overview={buildOverview([event])} />)
    const start = new Date(event.start_datetime)
    const hh = String(start.getHours()).padStart(2, '0')
    const mm = String(start.getMinutes()).padStart(2, '0')
    const expected = `${hh}:${mm}`
    expect(screen.getByText(expected)).toBeTruthy()
  })

  it('suppresses time when is_all_day is true', () => {
    const event = buildEvent({
      id: 'evt-allday',
      title_en: 'All day event',
      start_datetime: '2026-04-28T00:00:00Z',
      is_all_day: true,
    })
    render(<UpcomingSection overview={buildOverview([event])} />)
    // No HH:mm string should be present (week-time has font-mono mark)
    const row = screen.getByTestId('dossier-drawer-upcoming-row')
    expect(within(row).queryByText(/^\d{2}:\d{2}$/)).toBeNull()
  })

  it('renders title_en + location_en when present (EN)', () => {
    const event = buildEvent({
      id: 'evt-loc',
      title_en: 'Bilateral meeting',
      title_ar: 'اجتماع ثنائي',
      location_en: 'Riyadh',
      location_ar: 'الرياض',
    })
    render(<UpcomingSection overview={buildOverview([event])} />)
    expect(screen.getByText('Bilateral meeting')).toBeTruthy()
    expect(screen.getByText('Riyadh')).toBeTruthy()
  })

  it('does not render location node when location_en/location_ar are both null', () => {
    const event = buildEvent({
      id: 'evt-no-loc',
      title_en: 'No location event',
      location_en: null,
      location_ar: null,
    })
    const { container } = render(<UpcomingSection overview={buildOverview([event])} />)
    expect(container.querySelector('.week-loc')).toBeNull()
  })

  it('section heading renders t(section.upcoming)', () => {
    render(<UpcomingSection overview={buildOverview([])} />)
    expect(screen.getByText('section.upcoming')).toBeTruthy()
  })
})
