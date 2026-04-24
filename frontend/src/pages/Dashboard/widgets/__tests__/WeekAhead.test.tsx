/**
 * Phase 38 plan 02 — WeekAhead unit tests.
 *
 * Verifies: day-grouping, max-visible expand toggle, DossierGlyph wiring,
 * LtrIsolate-wrapped time range, status-chip rendering, error/empty/skeleton.
 *
 * NOTE: `useWeekAhead` returns the real `TimelineEvent` shape from
 * `frontend/src/domains/operations-hub/types/operations-hub.types.ts` — i.e.
 * `start_date` / `end_date` / `engagement_name` (not the plan's draft stub
 * with `counterpart`/`counterpartFlag`). The widget derives the glyph
 * country ISO from the event_type or falls back to a person/forum glyph.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ReactElement } from 'react'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: (): { user: { id: string } } => ({ user: { id: 'u1' } }),
}))

vi.mock('@/hooks/useWeekAhead', () => ({
  useWeekAhead: vi.fn(),
}))

vi.mock('@/components/signature-visuals', () => ({
  DossierGlyph: (p: { name?: string; iso?: string; type: string }): ReactElement => (
    <span data-testid="glyph" data-name={p.name ?? ''} data-iso={p.iso ?? ''} data-type={p.type} />
  ),
}))

import { useWeekAhead } from '@/hooks/useWeekAhead'
import { WeekAhead } from '../WeekAhead'

interface MakeEventOpts {
  prefix?: string
  count: number
}

function makeEvents({ prefix = 'e', count }: MakeEventOpts): unknown[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i}`,
    title: `Event ${prefix}-${i}`,
    title_ar: null,
    start_date: '2026-04-25T09:00:00Z',
    end_date: '2026-04-25T10:00:00Z',
    event_type: 'meeting',
    engagement_id: `eng-${i}`,
    engagement_name: 'Saudi Arabia',
    engagement_name_ar: null,
    lifecycle_stage: 'scheduled',
  }))
}

beforeEach(() => {
  vi.mocked(useWeekAhead).mockReset()
})

describe('WeekAhead widget', () => {
  it('renders 4 day group headers when all 4 buckets are populated', () => {
    vi.mocked(useWeekAhead).mockReturnValue({
      data: {
        today: makeEvents({ prefix: 'today', count: 2 }),
        tomorrow: makeEvents({ prefix: 'tomorrow', count: 1 }),
        this_week: makeEvents({ prefix: 'tw', count: 3 }),
        next_week: makeEvents({ prefix: 'nw', count: 1 }),
      },
      isLoading: false,
      isError: false,
    } as never)

    render(<WeekAhead />)

    const headers = screen.getAllByRole('heading', { level: 4 })
    expect(headers).toHaveLength(4)
  })

  it('shows at most 5 rows per group; expand button reveals the rest', () => {
    vi.mocked(useWeekAhead).mockReturnValue({
      data: {
        today: makeEvents({ prefix: 't', count: 8 }),
        tomorrow: [],
        this_week: [],
        next_week: [],
      },
      isLoading: false,
      isError: false,
    } as never)

    const { container } = render(<WeekAhead />)
    expect(container.querySelectorAll('.week-row')).toHaveLength(5)

    fireEvent.click(screen.getByRole('button', { name: /show more|expand/i }))
    expect(container.querySelectorAll('.week-row')).toHaveLength(8)
  })

  it('renders DossierGlyph and a `.week-time` element with dir="ltr" isolation', () => {
    vi.mocked(useWeekAhead).mockReturnValue({
      data: {
        today: makeEvents({ prefix: 't', count: 1 }),
        tomorrow: [],
        this_week: [],
        next_week: [],
      },
      isLoading: false,
      isError: false,
    } as never)

    const { container } = render(<WeekAhead />)
    expect(screen.getAllByTestId('glyph').length).toBeGreaterThanOrEqual(1)

    const timeEl = container.querySelector('.week-time') as HTMLElement | null
    expect(timeEl).not.toBeNull()
    // The LtrIsolate wrapper renders `dir="ltr"` on its container.
    const ltrAncestor = timeEl?.closest('[dir="ltr"]')
    expect(ltrAncestor).not.toBeNull()
  })

  it('renders a status chip when lifecycle_stage is present', () => {
    vi.mocked(useWeekAhead).mockReturnValue({
      data: {
        today: makeEvents({ prefix: 't', count: 1 }),
        tomorrow: [],
        this_week: [],
        next_week: [],
      },
      isLoading: false,
      isError: false,
    } as never)

    const { container } = render(<WeekAhead />)
    expect(container.querySelector('[data-testid="week-status"]')).not.toBeNull()
  })

  it('shows skeleton on loading', () => {
    vi.mocked(useWeekAhead).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as never)

    const { container } = render(<WeekAhead />)
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
  })

  it('shows empty state when all buckets are empty', () => {
    vi.mocked(useWeekAhead).mockReturnValue({
      data: { today: [], tomorrow: [], this_week: [], next_week: [] },
      isLoading: false,
      isError: false,
    } as never)

    render(<WeekAhead />)
    expect(screen.getByText('No upcoming events')).toBeTruthy()
  })

  it('shows error state on isError', () => {
    vi.mocked(useWeekAhead).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as never)

    render(<WeekAhead />)
    expect(screen.getByText("Couldn't load widget")).toBeTruthy()
  })
})
