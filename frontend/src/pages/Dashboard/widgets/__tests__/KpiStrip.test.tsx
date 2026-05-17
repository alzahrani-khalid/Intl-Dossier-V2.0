import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import type { DashboardStats } from '@/domains/operations-hub/types/operations-hub.types'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: (): { user: { id: string } } => ({ user: { id: 'user-1' } }),
}))

vi.mock('@/domains/operations-hub/hooks/useDashboardStats', () => ({
  useDashboardStats: vi.fn(),
}))

import { useDashboardStats } from '@/domains/operations-hub/hooks/useDashboardStats'
import { KpiStrip } from '../KpiStrip'

const mockStats: DashboardStats = {
  active_engagements: 12,
  open_tasks: 8,
  sla_at_risk: 3,
  upcoming_week: 5,
}
const MINUS_SIGN = '\u2212'

function asResult(
  over: Partial<UseQueryResult<DashboardStats, Error>>,
): UseQueryResult<DashboardStats, Error> {
  return over as UseQueryResult<DashboardStats, Error>
}

function renderKpi(): ReturnType<typeof render> {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <KpiStrip />
    </QueryClientProvider>,
  )
}

describe('KpiStrip', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks()
  })

  it('renders 4 .kpi cards with values from useDashboardStats', (): void => {
    vi.mocked(useDashboardStats).mockReturnValue(
      asResult({ data: mockStats, isLoading: false, isError: false }),
    )
    const { container } = renderKpi()
    expect(container.querySelectorAll('.kpi')).toHaveLength(4)
    const values = screen.getAllByTestId('kpi-value').map((n): string | null => n.textContent)
    expect(values).toEqual(['12+2', `8${MINUS_SIGN}4`, '3+2', '5+1'])
  })

  it('third card carries kpi-accent class (var(--accent) top-bar)', (): void => {
    vi.mocked(useDashboardStats).mockReturnValue(
      asResult({ data: mockStats, isLoading: false, isError: false }),
    )
    const { container } = renderKpi()
    const cards = container.querySelectorAll('.kpi')
    expect(cards[2].classList.contains('kpi-accent')).toBe(true)
    // sanity: only card 3 has the accent
    expect(cards[0].classList.contains('kpi-accent')).toBe(false)
    expect(cards[1].classList.contains('kpi-accent')).toBe(false)
    expect(cards[3].classList.contains('kpi-accent')).toBe(false)
  })

  it('renders skeleton when loading', (): void => {
    vi.mocked(useDashboardStats).mockReturnValue(
      asResult({ data: undefined, isLoading: true, isError: false }),
    )
    const { container } = renderKpi()
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull()
    // skeleton renders 4 placeholder cards too
    expect(container.querySelectorAll('.kpi')).toHaveLength(4)
  })

  it('wraps all 4 numerals in <LtrIsolate> (dir="ltr")', (): void => {
    vi.mocked(useDashboardStats).mockReturnValue(
      asResult({ data: mockStats, isLoading: false, isError: false }),
    )
    const { container } = renderKpi()
    const values = container.querySelectorAll('[data-testid="kpi-value"]')
    expect(values).toHaveLength(4)
    values.forEach((node): void => {
      expect(node.firstElementChild?.getAttribute('dir')).toBe('ltr')
    })
  })

  it('emits zero hardcoded color literals (token-only painting)', (): void => {
    vi.mocked(useDashboardStats).mockReturnValue(
      asResult({ data: mockStats, isLoading: false, isError: false }),
    )
    const { container } = renderKpi()
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{6}/i)
    expect(container.innerHTML).not.toMatch(/rgb\(/i)
  })
})

// Sentinel: ensures imports stay used and matches existing test conventions.
export const __KpiStripTestRoot = (): ReactElement => <KpiStrip />
