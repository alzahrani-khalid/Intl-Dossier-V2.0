import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { TimelineActivity } from '@/hooks/useDossierActivityTimeline'

// Mutable holder the hook mock reads on every render. Declared via vi.hoisted so
// it is initialised before the hoisted vi.mock factory below runs.
const mockState = vi.hoisted(() => ({ activities: [] as TimelineActivity[] }))

// Echo translation keys, honouring defaultValue so the card title resolves to
// its English fallback ('Recent Activity') without loading i18n resources.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
    i18n: { language: 'en' },
  }),
}))

// Stub the activity-timeline hook so the card renders against a controlled
// payload. The barrel '@/hooks/useDossierActivityTimeline' re-exports the
// canonical domain hook; mocking the barrel covers the card's import path.
vi.mock('@/hooks/useDossierActivityTimeline', () => ({
  useDossierActivityTimeline: () => ({
    activities: mockState.activities,
    isLoading: false,
    isError: false,
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
})
