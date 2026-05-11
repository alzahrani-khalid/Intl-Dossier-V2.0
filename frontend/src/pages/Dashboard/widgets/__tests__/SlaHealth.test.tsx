/**
 * Phase 38 Plan 05 — SlaHealth widget unit tests.
 *
 * NOTE — deviation from original plan task spec (Rule 3, blocking):
 *  - The real `<Donut>` API uses `value: number, variants: [number,number,number]`
 *    with hardcoded `--ok / --risk / --bad` token strokes — NOT a
 *    `segments: [{value, color}]` shape. Tests assert the real surface.
 *  - The real `<Sparkline>` API uses `width` / `height` (not `w` / `h`).
 *  - `DashboardStats` exposes only `sla_at_risk`. We derive segment percentages
 *    from `(open_tasks, sla_at_risk)`.
 *
 * Truths preserved from the plan:
 *  T-A: Donut receives 3 segment values (variants tuple)
 *  T-B: Sparkline receives exactly 14 data points when trends returns 30
 *  T-C: Sparkline parent has no `scaleX(-1)` wrapper (no double-flip)
 *  T-D: Legend renders 3 rows with counts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactElement } from 'react'
import { render } from '@testing-library/react'

const donutSpy = vi.fn()
const sparkSpy = vi.fn()

vi.mock('@/components/signature-visuals', () => ({
  Donut: (p: Record<string, unknown>): ReactElement => {
    donutSpy(p)
    return <div data-testid="donut" />
  },
  Sparkline: (p: Record<string, unknown>): ReactElement => {
    sparkSpy(p)
    return <div data-testid="spark" />
  },
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: (): { user: { id: string } } => ({ user: { id: 'u1' } }),
}))

vi.mock('@/domains/operations-hub/hooks/useDashboardStats', () => ({
  useDashboardStats: vi.fn(),
}))

vi.mock('@/hooks/useDashboardTrends', () => ({
  useDashboardTrends: vi.fn(),
}))

vi.mock('react-i18next', () => ({
  useTranslation: (): { t: (k: string) => string; i18n: { language: string } } => ({
    t: (k: string): string => k,
    i18n: { language: 'en' },
  }),
}))

import { useDashboardStats } from '@/domains/operations-hub/hooks/useDashboardStats'
import { useDashboardTrends } from '@/hooks/useDashboardTrends'
import { SlaHealth } from '../SlaHealth'

const mockStats = {
  active_engagements: 5,
  open_tasks: 17,
  sla_at_risk: 4,
  upcoming_week: 8,
}

const mockTrends = Array.from(
  { length: 30 },
  (_, i): { date: string; created: number; completed: number } => ({
    date: `2026-04-${String(i + 1).padStart(2, '0')}`,
    created: i + 2,
    completed: Math.floor(i / 2),
  }),
)

const setHooksSuccess = (): void => {
  vi.mocked(useDashboardStats).mockReturnValue({
    data: mockStats,
    isLoading: false,
    isError: false,
  } as never)
  vi.mocked(useDashboardTrends).mockReturnValue({
    data: mockTrends,
    isLoading: false,
    isError: false,
  } as never)
}

describe('SlaHealth', (): void => {
  beforeEach((): void => {
    donutSpy.mockClear()
    sparkSpy.mockClear()
  })

  it('passes a 3-tuple `variants` to <Donut> (OK / Risk / Bad)', (): void => {
    setHooksSuccess()
    render(<SlaHealth />)
    expect(donutSpy).toHaveBeenCalled()
    const props = donutSpy.mock.calls[0]?.[0] as { variants: readonly number[]; value: number }
    expect(Array.isArray(props.variants)).toBe(true)
    expect(props.variants).toHaveLength(3)
    expect(typeof props.value).toBe('number')
  })

  it('passes exactly 14 data points to <Sparkline> when trends has 30', (): void => {
    setHooksSuccess()
    render(<SlaHealth />)
    expect(sparkSpy).toHaveBeenCalled()
    const props = sparkSpy.mock.calls[0]?.[0] as { data: number[] }
    expect(props.data).toHaveLength(14)
  })

  it('does NOT wrap <Sparkline> in a parent `scaleX(-1)` (no double-flip; Phase 37 37-08-04 owns the flip)', (): void => {
    setHooksSuccess()
    const { container } = render(<SlaHealth />)
    expect(container.innerHTML).not.toMatch(/scaleX\s*\(\s*-1/i)
    expect(container.innerHTML).not.toMatch(/scale-x-\[?-1/i)
  })

  it('renders a 3-row legend (on track / at risk / breached) with counts', (): void => {
    setHooksSuccess()
    const { container } = render(<SlaHealth />)
    const legendRows = container.querySelectorAll('.sla-legend li')
    expect(legendRows).toHaveLength(3)
    // Each row should contain a count node
    for (const row of legendRows) {
      expect(row.querySelector('.sla-count')).not.toBeNull()
    }
  })

  it('renders the loading skeleton while hooks are pending', (): void => {
    vi.mocked(useDashboardStats).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as never)
    vi.mocked(useDashboardTrends).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as never)
    const { container } = render(<SlaHealth />)
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
  })

  it('renders an error region when stats fails', (): void => {
    vi.mocked(useDashboardStats).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as never)
    vi.mocked(useDashboardTrends).mockReturnValue({
      data: mockTrends,
      isLoading: false,
      isError: false,
    } as never)
    const { getByText } = render(<SlaHealth />)
    expect(getByText('error.load_failed')).toBeTruthy()
  })
})
