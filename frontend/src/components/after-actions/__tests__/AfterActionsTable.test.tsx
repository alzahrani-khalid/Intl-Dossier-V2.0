/**
 * Phase 42-06 — AfterActionsTable vitest suite (TDD RED).
 *
 * Covers PAGE-02 of the UI-SPEC: 6-column `.tbl` rendering, row keyboard
 * focus, bilingual title selection, day-first mono date, dossier chip,
 * count rendering from joined arrays, RTL-flipping chevron, empty state.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AfterActionsTable } from '../AfterActionsTable'
import type { AfterActionRecordWithJoins } from '@/hooks/useAfterAction'

// Mock TanStack Router useNavigate so row clicks don't blow up under jsdom.
const navigateMock = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: (): typeof navigateMock => navigateMock,
}))

// Per-file i18n mock (PATTERNS Pattern I).
let mockLanguage = 'en'
vi.mock('react-i18next', () => ({
  useTranslation: (): {
    i18n: { language: string }
    t: (k: string, opts?: Record<string, unknown>) => string
  } => ({
    i18n: { language: mockLanguage },
    t: (k: string, opts?: Record<string, unknown>): string => {
      if (
        opts != null &&
        typeof opts === 'object' &&
        'defaultValue' in opts &&
        typeof opts.defaultValue === 'string'
      ) {
        return opts.defaultValue
      }
      return k
    },
  }),
  Trans: ({ children }: { children: React.ReactNode }): React.ReactNode => children,
}))

const baseRow: AfterActionRecordWithJoins = {
  id: 'r1',
  engagement_id: 'eng1',
  dossier_id: 'dos1',
  publication_status: 'published',
  is_confidential: false,
  decisions: [
    {
      id: 'd1',
      after_action_id: 'r1',
      description: 'D1',
      decision_maker: 'u1',
      decision_date: '2026-04-28',
      created_at: '2026-04-28T10:00:00Z',
    },
    {
      id: 'd2',
      after_action_id: 'r1',
      description: 'D2',
      decision_maker: 'u1',
      decision_date: '2026-04-28',
      created_at: '2026-04-28T10:00:00Z',
    },
  ],
  commitments: [
    {
      id: 'c1',
      after_action_id: 'r1',
      dossier_id: 'dos1',
      description: 'C1',
      priority: 'medium',
      status: 'pending',
      owner_type: 'internal',
      tracking_mode: 'manual',
      due_date: '2026-05-15',
    },
    {
      id: 'c2',
      after_action_id: 'r1',
      dossier_id: 'dos1',
      description: 'C2',
      priority: 'medium',
      status: 'pending',
      owner_type: 'internal',
      tracking_mode: 'manual',
      due_date: '2026-05-15',
    },
    {
      id: 'c3',
      after_action_id: 'r1',
      dossier_id: 'dos1',
      description: 'C3',
      priority: 'medium',
      status: 'pending',
      owner_type: 'internal',
      tracking_mode: 'manual',
      due_date: '2026-05-15',
    },
  ],
  created_by: 'u1',
  created_at: '2026-04-28T10:00:00Z',
  updated_at: '2026-04-28T10:00:00Z',
  version: 1,
  engagement: {
    id: 'eng1',
    title_en: 'Quarterly review',
    title_ar: 'المراجعة الربعية',
    engagement_date: '2026-04-28',
  },
  dossier: {
    id: 'dos1',
    name_en: 'Saudi Arabia',
    name_ar: 'المملكة العربية السعودية',
  },
}

describe('AfterActionsTable', () => {
  beforeEach(() => {
    mockLanguage = 'en'
    navigateMock.mockReset()
  })

  it('renders a <table class="tbl"> with exactly 6 <th> cells', () => {
    const { container } = render(
      <AfterActionsTable rows={[baseRow]} isLoading={false} error={null} />,
    )
    const table = container.querySelector('table.tbl')
    expect(table).toBeTruthy()
    const ths = container.querySelectorAll('table.tbl thead th')
    expect(ths.length).toBe(6)
  })

  it('rows are keyboard-focusable (tabIndex=0, role=button)', () => {
    render(<AfterActionsTable rows={[baseRow]} isLoading={false} error={null} />)
    const row = screen.getByTestId('after-action-row')
    expect(row.getAttribute('tabindex')).toBe('0')
    expect(row.getAttribute('role')).toBe('button')
  })

  it('engagement column shows title_en in EN and title_ar in AR', () => {
    const { unmount } = render(
      <AfterActionsTable rows={[baseRow]} isLoading={false} error={null} />,
    )
    expect(screen.getByText('Quarterly review')).toBeTruthy()
    unmount()
    mockLanguage = 'ar'
    render(<AfterActionsTable rows={[baseRow]} isLoading={false} error={null} />)
    expect(screen.getByText('المراجعة الربعية')).toBeTruthy()
  })

  it('date column renders day-first format from engagement_date in mono with dir=ltr', () => {
    const { container } = render(
      <AfterActionsTable rows={[baseRow]} isLoading={false} error={null} />,
    )
    // Day-first format: "Tue 28 Apr"
    const dateCell = container.querySelector('td[dir="ltr"]')
    expect(dateCell).toBeTruthy()
    expect(dateCell?.textContent ?? '').toMatch(/28/)
    expect(dateCell?.textContent ?? '').toMatch(/Apr/)
    // Mono font is set inline via var(--font-mono)
    expect((dateCell as HTMLElement | null)?.style.fontFamily ?? '').toContain('--font-mono')
  })

  it('dossier chip uses --accent-soft / --accent-ink and counts come from .length', () => {
    const { container } = render(
      <AfterActionsTable rows={[baseRow]} isLoading={false} error={null} />,
    )
    const chip = container.querySelector('span.chip') as HTMLElement | null
    expect(chip).toBeTruthy()
    expect(chip?.style.background ?? '').toContain('--accent-soft')
    expect(chip?.style.color ?? '').toContain('--accent-ink')
    expect(chip?.textContent).toBe('Saudi Arabia')
    // decisions=2, commitments=3 (from the row arrays above)
    const endCells = container.querySelectorAll('td.text-end')
    expect(endCells[0]?.textContent).toBe('2')
    expect(endCells[1]?.textContent).toBe('3')
  })

  it('chevron uses Icon name=chevron-right with icon-flip class', () => {
    const { container } = render(
      <AfterActionsTable rows={[baseRow]} isLoading={false} error={null} />,
    )
    const icon = container.querySelector('[data-testid="icon-chevron-right"]')
    expect(icon).toBeTruthy()
    expect(icon?.getAttribute('class') ?? '').toContain('icon-flip')
  })

  it('empty state heading renders when rows.length === 0', () => {
    render(<AfterActionsTable rows={[]} isLoading={false} error={null} />)
    expect(screen.getByText('empty.heading')).toBeTruthy()
  })

  it('row click calls navigate with /after-actions/$afterActionId', async () => {
    const user = userEvent.setup()
    render(<AfterActionsTable rows={[baseRow]} isLoading={false} error={null} />)
    await user.click(screen.getByTestId('after-action-row'))
    expect(navigateMock).toHaveBeenCalledWith({
      to: '/after-actions/$afterActionId',
      params: { afterActionId: 'r1' },
    })
  })
})
