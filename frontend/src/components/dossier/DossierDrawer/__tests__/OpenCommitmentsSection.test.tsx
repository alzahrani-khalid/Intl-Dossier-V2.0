/**
 * OpenCommitmentsSection — Phase 41 Plan 05 tests (DRAWER-02).
 *
 * Mocks:
 *   - @tanstack/react-router → controllable useNavigate
 *   - react-i18next → per-test (overrides global passthrough mock so we can
 *     toggle language between en/ar for digit rendering assertions).
 *
 * Behavior asserted (12 tests, per 41-05-PLAN.md Task 1 <behavior>):
 *   1. status filter — completed + cancelled excluded
 *   2. empty list renders t('empty.open_commitments')
 *   3. priority=high → severity dot var(--danger)
 *   4. priority=urgent → severity dot var(--danger)
 *   5. priority=medium → severity dot var(--warn)
 *   6. priority=low → severity dot var(--ink-faint)
 *   7. AR title falls through to title_en when title_ar null
 *   8. days label: T-N for past, T+N for future, '—' for null deadline
 *   9. owner initials computed; '—' when assignee_name null
 *  10. row click → navigate({ to: '/commitments', search: { id } })
 *  11. row min-block-size === 44
 *  12. section heading renders t('section.open_commitments')
 */
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type {
  DossierOverviewResponse,
  DossierWorkItem,
} from '@/types/dossier-overview.types'

const navigateMock = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}))

// Per-file override of the global react-i18next mock so we can flip language.
const i18nState: { language: string } = { language: 'en' }
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: i18nState,
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
}))

import { OpenCommitmentsSection } from '../OpenCommitmentsSection'

// Helpers ----------------------------------------------------------------

function mkItem(overrides: Partial<DossierWorkItem>): DossierWorkItem {
  return {
    id: 'wi-' + Math.random().toString(36).slice(2, 8),
    source: 'commitment',
    title_en: 'Sample commitment',
    title_ar: null,
    description_en: null,
    description_ar: null,
    status: 'pending',
    priority: 'medium',
    deadline: null,
    assignee_id: null,
    assignee_name: null,
    inheritance_source: 'direct',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function mkOverview(commitments: DossierWorkItem[]): DossierOverviewResponse {
  return {
    work_items: {
      total_count: commitments.length,
      status_breakdown: {
        pending: 0,
        in_progress: 0,
        review: 0,
        completed: 0,
        cancelled: 0,
        overdue: 0,
      },
      by_source: { tasks: [], commitments, intakes: [] },
      urgent_items: [],
      overdue_items: [],
    },
  } as unknown as DossierOverviewResponse
}

// Sets are kept in JSX-order for deterministic indexing.

// Pin "now" for days-label assertions.
const FIXED_NOW = new Date('2026-05-02T12:00:00.000Z')

beforeEach(() => {
  navigateMock.mockReset()
  i18nState.language = 'en'
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_NOW)
})

afterEach(() => {
  vi.useRealTimers()
  cleanup()
})

describe('OpenCommitmentsSection (Phase 41 Plan 05)', () => {
  it('1. filters out completed and cancelled commitments (renders 3 of 5)', () => {
    const items = [
      mkItem({ id: 'a', status: 'pending', title_en: 'A pending' }),
      mkItem({ id: 'b', status: 'in_progress', title_en: 'B in_progress' }),
      mkItem({ id: 'c', status: 'completed', title_en: 'C completed' }),
      mkItem({ id: 'd', status: 'cancelled', title_en: 'D cancelled' }),
      mkItem({ id: 'e', status: 'review', title_en: 'E review' }),
    ]
    render(<OpenCommitmentsSection overview={mkOverview(items)} />)
    const rows = screen.getAllByTestId('dossier-drawer-commitment-row')
    expect(rows).toHaveLength(3)
    const titles = rows.map((r) => r.textContent ?? '')
    expect(titles.some((t) => t.includes('A pending'))).toBe(true)
    expect(titles.some((t) => t.includes('B in_progress'))).toBe(true)
    expect(titles.some((t) => t.includes('E review'))).toBe(true)
    expect(titles.some((t) => t.includes('C completed'))).toBe(false)
    expect(titles.some((t) => t.includes('D cancelled'))).toBe(false)
  })

  it('2. empty list renders the empty.open_commitments key', () => {
    render(<OpenCommitmentsSection overview={mkOverview([])} />)
    expect(screen.getByText('empty.open_commitments')).toBeTruthy()
    expect(screen.queryByTestId('dossier-drawer-commitments-list')).toBeNull()
  })

  it('3. priority=high → severity dot backgroundColor var(--danger)', () => {
    const items = [mkItem({ id: 'h', priority: 'high' })]
    const { container } = render(<OpenCommitmentsSection overview={mkOverview(items)} />)
    const sev = container.querySelector('.overdue-sev') as HTMLElement | null
    expect(sev).not.toBeNull()
    expect(sev!.style.backgroundColor).toBe('var(--danger)')
  })

  it('4. priority=urgent → severity dot backgroundColor var(--danger)', () => {
    const items = [mkItem({ id: 'u', priority: 'urgent' })]
    const { container } = render(<OpenCommitmentsSection overview={mkOverview(items)} />)
    const sev = container.querySelector('.overdue-sev') as HTMLElement | null
    expect(sev!.style.backgroundColor).toBe('var(--danger)')
  })

  it('5. priority=medium → severity dot backgroundColor var(--warn)', () => {
    const items = [mkItem({ id: 'm', priority: 'medium' })]
    const { container } = render(<OpenCommitmentsSection overview={mkOverview(items)} />)
    const sev = container.querySelector('.overdue-sev') as HTMLElement | null
    expect(sev!.style.backgroundColor).toBe('var(--warn)')
  })

  it('6. priority=low → severity dot backgroundColor var(--ink-faint)', () => {
    const items = [mkItem({ id: 'l', priority: 'low' })]
    const { container } = render(<OpenCommitmentsSection overview={mkOverview(items)} />)
    const sev = container.querySelector('.overdue-sev') as HTMLElement | null
    expect(sev!.style.backgroundColor).toBe('var(--ink-faint)')
  })

  it('7. row title renders title_ar under AR if present, else title_en', () => {
    i18nState.language = 'ar'
    const items = [
      mkItem({ id: 'with-ar', title_en: 'EN-A', title_ar: 'AR-A' }),
      mkItem({ id: 'no-ar', title_en: 'EN-B', title_ar: null }),
    ]
    render(<OpenCommitmentsSection overview={mkOverview(items)} />)
    expect(screen.getByText('AR-A')).toBeTruthy()
    expect(screen.queryByText('EN-A')).toBeNull()
    expect(screen.getByText('EN-B')).toBeTruthy()
  })

  it('8. days label: T-3 past, T+5 future, — when deadline missing', () => {
    // FIXED_NOW = 2026-05-02. Past = 2026-04-29 (3 days ago). Future = 2026-05-07 (5 days ahead).
    const items = [
      mkItem({ id: 'past', deadline: '2026-04-29T12:00:00.000Z' }),
      mkItem({ id: 'fut', deadline: '2026-05-07T12:00:00.000Z' }),
      mkItem({ id: 'nope', deadline: null }),
    ]
    const { container } = render(<OpenCommitmentsSection overview={mkOverview(items)} />)
    const rows = container.querySelectorAll('[data-testid="dossier-drawer-commitment-row"]')
    expect(rows).toHaveLength(3)
    const days = Array.from(rows).map((r) => {
      const el = r.querySelector('.overdue-days') as HTMLElement
      return el.textContent
    })
    expect(days[0]).toBe('T-3')
    expect(days[1]).toBe('T+5')
    expect(days[2]).toBe('—')
  })

  it('9. owner initials computed from assignee_name; — when missing', () => {
    const items = [
      mkItem({ id: 'jd', assignee_name: 'Jane Doe' }),
      mkItem({ id: 'fl', assignee_name: 'فاطمة الزهراء' }),
      mkItem({ id: 'one', assignee_name: 'Cher' }),
      mkItem({ id: 'none', assignee_name: null }),
    ]
    const { container } = render(<OpenCommitmentsSection overview={mkOverview(items)} />)
    const rows = container.querySelectorAll('[data-testid="dossier-drawer-commitment-row"]')
    const owners = Array.from(rows).map(
      (r) => (r.querySelector('.overdue-owner') as HTMLElement).textContent,
    )
    expect(owners[0]).toBe('JD')
    // Two-word non-Latin name: first char of each of the first two words, upper-cased.
    expect(owners[1]).toBe('فا')
    expect(owners[2]).toBe('C')
    expect(owners[3]).toBe('—')
  })

  it('10. row click navigates to /commitments?id=<id>', () => {
    const items = [
      mkItem({ id: 'click-me', title_en: 'Click target' }),
      mkItem({ id: 'other', title_en: 'Other row' }),
    ]
    render(<OpenCommitmentsSection overview={mkOverview(items)} />)
    const rows = screen.getAllByTestId('dossier-drawer-commitment-row')
    fireEvent.click(rows[0]!)
    expect(navigateMock).toHaveBeenCalledTimes(1)
    expect(navigateMock).toHaveBeenCalledWith({
      to: '/commitments',
      search: { id: 'click-me' },
    })
  })

  it('11. each row has min-block-size 44 (D-11 touch target)', () => {
    const items = [mkItem({ id: 'touch' })]
    const { container } = render(<OpenCommitmentsSection overview={mkOverview(items)} />)
    const row = container.querySelector(
      '[data-testid="dossier-drawer-commitment-row"]',
    ) as HTMLElement
    // jsdom returns the value verbatim (e.g. '44px' or '44'). Either is accepted.
    const min = row.style.minBlockSize || row.style.getPropertyValue('min-block-size')
    expect(min === '44px' || min === '44').toBe(true)
  })

  it('12. section heading renders section.open_commitments', () => {
    render(<OpenCommitmentsSection overview={mkOverview([])} />)
    const section = screen.getByTestId('dossier-drawer-commitments')
    expect(within(section).getByText('section.open_commitments')).toBeTruthy()
  })
})
