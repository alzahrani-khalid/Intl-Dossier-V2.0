import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { TimelineActivity } from '@/hooks/useDossierActivityTimeline'
import enDossier from '@/i18n/en/dossier.json'
import arDossier from '@/i18n/ar/dossier.json'

// Mutable holder the hook mock reads on every render. Declared via vi.hoisted so
// it is initialised before the hoisted vi.mock factory below runs.
const mockState = vi.hoisted(() => ({
  activities: [] as TimelineActivity[],
  isError: false,
}))

const { mockLocale } = vi.hoisted(() => ({
  mockLocale: { current: 'en' as 'en' | 'ar' },
}))

vi.mock('react-i18next', async () => {
  const [{ default: enBundle }, { default: arBundle }] = await Promise.all([
    vi.importActual<typeof import('@/i18n/en/dossier.json')>('@/i18n/en/dossier.json'),
    vi.importActual<typeof import('@/i18n/ar/dossier.json')>('@/i18n/ar/dossier.json'),
  ])
  const bundles = { en: enBundle, ar: arBundle }

  const resolveTranslation = (key: string, options: Record<string, unknown> = {}): string => {
    const separator = key.indexOf(':')
    const path = separator === -1 ? key : key.slice(separator + 1)
    let value: unknown = bundles[mockLocale.current]
    for (const segment of path.split('.')) {
      if (value === null || typeof value !== 'object' || !(segment in value)) {
        throw new Error(`Missing recent-activity test translation: ${key}`)
      }
      value = (value as Record<string, unknown>)[segment]
    }
    if (typeof value !== 'string') {
      throw new Error(`Non-string recent-activity test translation: ${key}`)
    }
    return value.replace(/\{\{(\w+)\}\}/g, (match, token: string) =>
      token in options ? String(options[token]) : match,
    )
  }

  return {
    // Phase 98 (D-25): the component now imports `@/lib/format-date`, which imports the
    // i18n SINGLETON to read the session language at call time. That module calls
    // `.use(initReactI18next)` at import, so a partial react-i18next mock without this
    // export fails the whole suite at import time rather than at an assertion.
    initReactI18next: { type: '3rdParty', init: (): void => undefined },
    useTranslation: () => ({
      t: (key: string, options?: Record<string, unknown>) => resolveTranslation(key, options),
      i18n: {
        get language(): 'en' | 'ar' {
          return mockLocale.current
        },
      },
    }),
  }
})

// Stub the activity-timeline hook so the card renders against a controlled
// payload. The barrel '@/hooks/useDossierActivityTimeline' re-exports the
// canonical domain hook; mocking the barrel covers the card's import path.
vi.mock('@/hooks/useDossierActivityTimeline', () => ({
  useDossierActivityTimeline: () => ({
    activities: mockState.activities,
    isLoading: false,
    isError: mockState.isError,
    error: null,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
    refetch: vi.fn(),
    totalCount: mockState.activities.length,
  }),
}))

import { SharedRecentActivityCard } from '../SharedRecentActivityCard'

// Required real fields the edge function always emits. Note the deliberate
// ABSENCE of created_at / id / due_date — the bug was reading those non-existent
// fields, so the fixture must not supply them.
const base: TimelineActivity = {
  link_id: 'l0',
  work_item_id: 'w0',
  work_item_type: 'commitment',
  dossier_id: 'd1',
  activity_title: 'Base activity',
  status: 'in_progress',
  priority: 'medium',
  assignee_id: null,
  inheritance_source: 'direct',
  activity_timestamp: new Date().toISOString(),
}

const makeActivity = (overrides: Partial<TimelineActivity>): TimelineActivity => ({
  ...base,
  ...overrides,
})

describe('SharedRecentActivityCard', () => {
  beforeEach(() => {
    mockLocale.current = 'en'
    mockState.activities = []
    mockState.isError = false
  })

  it('resolves visible copy from the real English and Arabic dossier bundles without rendering keys', () => {
    mockState.isError = true

    const english = render(<SharedRecentActivityCard dossierId="d1" />)
    expect(screen.getByRole('heading', { name: enDossier.overview.recentActivity })).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toBe(enDossier.overview.sectionError)
    expect(english.container.innerHTML).not.toContain('overview.recentActivity')
    expect(english.container.innerHTML).not.toContain('overview.sectionError')
    english.unmount()

    mockLocale.current = 'ar'
    const arabic = render(<SharedRecentActivityCard dossierId="d1" />)
    expect(screen.getByRole('heading', { name: arDossier.overview.recentActivity })).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toBe(arDossier.overview.sectionError)
    expect(arabic.container.innerHTML).not.toContain('overview.recentActivity')
    expect(arabic.container.innerHTML).not.toContain('overview.sectionError')
  })

  it('renders the real edge-function payload (link_id + activity_timestamp, no created_at) without throwing', () => {
    mockState.activities = [
      makeActivity({
        link_id: 'l1',
        work_item_id: 'w1',
        activity_title: 'Overdue commitment',
        status: 'overdue',
        priority: 'high',
        activity_timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      }),
    ]

    expect(() => render(<SharedRecentActivityCard dossierId="d1" />)).not.toThrow()
    expect(screen.getByText('Overdue commitment')).toBeTruthy()
    expect(screen.getByText(/ago/i)).toBeTruthy()
  })

  it('renders a placeholder instead of throwing when activity_timestamp is invalid', () => {
    mockState.activities = [
      makeActivity({
        link_id: 'l2',
        activity_title: 'No timestamp',
        activity_timestamp: 'not-a-date',
      }),
    ]

    expect(() => render(<SharedRecentActivityCard dossierId="d1" />)).not.toThrow()
    expect(screen.getByText('No timestamp')).toBeTruthy()
  })

  it('renders the section error line, not the no-recent-activity empty copy, on section failure (OVRERR-01)', () => {
    mockState.isError = true
    mockState.activities = []

    render(<SharedRecentActivityCard dossierId="d1" />)

    expect(screen.getByRole('alert').textContent).toBe(enDossier.overview.sectionError)
    expect(screen.queryByText(enDossier.overview.noRecentActivity)).toBeNull()
  })

  it('renders cached activities and no error line on background refetch failure (stale-while-error)', () => {
    mockState.isError = true
    mockState.activities = [
      makeActivity({ link_id: 'l9', activity_title: 'Stale-but-real activity' }),
    ]

    render(<SharedRecentActivityCard dossierId="d1" />)

    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByText('Stale-but-real activity')).toBeTruthy()
  })
})
