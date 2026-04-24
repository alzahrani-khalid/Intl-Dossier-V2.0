/**
 * Phase 38 plan 06 — VipVisits widget unit tests.
 *
 * Verifies: countdown math (T-N / T+N / T-0), LtrIsolate wrapping, RTL
 * arrow-right rotate-180, DossierGlyph wiring, row render, and skeleton/
 * empty/error states.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: (): { user: { id: string } } => ({ user: { id: 'u1' } }),
}))

vi.mock('@/hooks/useVipVisits', () => ({
  useVipVisits: vi.fn(),
}))

vi.mock('@/components/signature-visuals', () => ({
  DossierGlyph: (p: { name?: string; iso?: string; type: string }): ReactElement => (
    <span data-testid="glyph" data-name={p.name ?? ''} data-iso={p.iso ?? ''} data-type={p.type} />
  ),
}))

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next')
  return {
    ...actual,
    useTranslation: (): {
      t: (k: string) => string
      i18n: { language: string }
    } => ({
      t: (k: string): string => k,
      i18n: { language: 'ar' },
    }),
  }
})

import { useVipVisits } from '@/hooks/useVipVisits'
import { VipVisits } from '../VipVisits'

function isoDaysFromNow(days: number): string {
  // differenceInDays truncates toward zero. Shift positive offsets forward
  // and negative offsets backward by a small amount so the whole-day boundary
  // is crossed in the right direction regardless of wall-clock time.
  const d = new Date()
  d.setDate(d.getDate() + days)
  if (days >= 0) {
    d.setMinutes(d.getMinutes() + 1)
  } else {
    d.setMinutes(d.getMinutes() - 1)
  }
  return d.toISOString()
}

function makeVisit(days: number, overrides: Record<string, unknown> = {}): unknown {
  return {
    id: `v-${days}`,
    name: 'Ambassador Al-Sayed',
    role: 'G20 Bilateral',
    when: isoDaysFromNow(days),
    personFlag: 'SA',
    ...overrides,
  }
}

beforeEach((): void => {
  vi.mocked(useVipVisits).mockReset()
})

describe('VipVisits widget (RTL)', (): void => {
  it('renders T−7 countdown for visit 7 days out', (): void => {
    vi.mocked(useVipVisits).mockReturnValue({
      data: [makeVisit(7)],
      isLoading: false,
      isError: false,
    } as never)
    render(<VipVisits />)
    expect(screen.getByText(/T−7/)).toBeDefined()
  })

  it('renders T−0 for a visit today', (): void => {
    vi.mocked(useVipVisits).mockReturnValue({
      data: [makeVisit(0)],
      isLoading: false,
      isError: false,
    } as never)
    render(<VipVisits />)
    expect(screen.getByText(/T−0/)).toBeDefined()
  })

  it('renders T+N for a past visit', (): void => {
    vi.mocked(useVipVisits).mockReturnValue({
      data: [makeVisit(-3)],
      isLoading: false,
      isError: false,
    } as never)
    render(<VipVisits />)
    expect(screen.getByText(/T\+3/)).toBeDefined()
  })

  it('wraps countdown in <LtrIsolate> (dir="ltr")', (): void => {
    vi.mocked(useVipVisits).mockReturnValue({
      data: [makeVisit(2)],
      isLoading: false,
      isError: false,
    } as never)
    const { container } = render(<VipVisits />)
    const countdown = container.querySelector('.vip-countdown') as HTMLElement | null
    expect(countdown).not.toBeNull()
    const ltrAncestor = countdown?.closest('[dir="ltr"]')
    expect(ltrAncestor).not.toBeNull()
  })

  it('rotates arrow-right 180° when language is ar (RTL)', (): void => {
    vi.mocked(useVipVisits).mockReturnValue({
      data: [makeVisit(1)],
      isLoading: false,
      isError: false,
    } as never)
    const { container } = render(<VipVisits />)
    expect(container.querySelector('.rotate-180')).not.toBeNull()
  })

  it('renders DossierGlyph with type="person" + name + row content', (): void => {
    vi.mocked(useVipVisits).mockReturnValue({
      data: [
        makeVisit(1, {
          id: 'v-1',
          name: 'Amb. Fatima',
          role: 'UN Envoy',
        }),
      ],
      isLoading: false,
      isError: false,
    } as never)
    render(<VipVisits />)
    const glyphs = screen.getAllByTestId('glyph')
    expect(glyphs.length).toBe(1)
    expect(glyphs[0].getAttribute('data-type')).toBe('person')
    expect(glyphs[0].getAttribute('data-name')).toBe('Amb. Fatima')
    expect(screen.getByText('Amb. Fatima')).toBeDefined()
    expect(screen.getByText('UN Envoy')).toBeDefined()
  })

  it('renders up to 6 rows', (): void => {
    const rows = Array.from({ length: 10 }, (_, i) => makeVisit(i + 1, { id: `v-${i}` }))
    vi.mocked(useVipVisits).mockReturnValue({
      data: rows,
      isLoading: false,
      isError: false,
    } as never)
    const { container } = render(<VipVisits />)
    expect(container.querySelectorAll('.vip-row').length).toBe(6)
  })

  it('shows skeleton while loading', (): void => {
    vi.mocked(useVipVisits).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as never)
    const { container } = render(<VipVisits />)
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
  })

  it('shows empty state when visits array is empty', (): void => {
    vi.mocked(useVipVisits).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as never)
    render(<VipVisits />)
    expect(screen.getByText(/vip\.empty/)).toBeDefined()
  })

  it('shows error state on isError', (): void => {
    vi.mocked(useVipVisits).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as never)
    render(<VipVisits />)
    expect(screen.getByText(/error\.load_failed/)).toBeDefined()
  })

  it('omits role line when role is empty string', (): void => {
    vi.mocked(useVipVisits).mockReturnValue({
      data: [makeVisit(1, { name: 'VIP', role: '' })],
      isLoading: false,
      isError: false,
    } as never)
    const { container } = render(<VipVisits />)
    expect(container.querySelector('.vip-role')).toBeNull()
  })
})
