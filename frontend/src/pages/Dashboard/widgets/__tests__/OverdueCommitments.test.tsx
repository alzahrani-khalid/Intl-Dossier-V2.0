import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: (): { t: (k: string) => string; i18n: { language: string } } => ({
    t: (k: string): string => k,
    i18n: { language: 'en' },
  }),
}))

vi.mock('@/hooks/usePersonalCommitments', () => ({
  usePersonalCommitments: vi.fn(),
}))

vi.mock('@/components/signature-visuals', () => ({
  DossierGlyph: (p: { iso?: string; type: string }): JSX.Element => (
    <span data-testid="glyph" data-iso={p.iso ?? ''} data-type={p.type} />
  ),
}))

const openDossierMock = vi.fn()
vi.mock('@/hooks/useDossierDrawer', () => ({
  useDossierDrawer: (): {
    openDossier: typeof openDossierMock
    closeDossier: () => void
    open: boolean
    dossierId: string | null
    dossierType: string | null
  } => ({
    openDossier: openDossierMock,
    closeDossier: vi.fn(),
    open: false,
    dossierId: null,
    dossierType: null,
  }),
}))

import { usePersonalCommitments } from '@/hooks/usePersonalCommitments'
import { OverdueCommitments } from '../OverdueCommitments'

const yellowGroup = {
  dossierId: 'd1',
  dossierName: 'Saudi Arabia',
  dossierFlag: 'SA',
  commitments: [
    {
      id: 'c1',
      title: 'Yellow item 1',
      daysOverdue: 1,
      severity: 'yellow' as const,
      ownerInitials: 'KA',
    },
    {
      id: 'c2',
      title: 'Yellow item 2',
      daysOverdue: 2,
      severity: 'yellow' as const,
      ownerInitials: 'KA',
    },
    {
      id: 'c3',
      title: 'Yellow item 3',
      daysOverdue: 2,
      severity: 'yellow' as const,
      ownerInitials: 'KA',
    },
    {
      id: 'c4',
      title: 'Yellow item 4',
      daysOverdue: 1,
      severity: 'yellow' as const,
      ownerInitials: 'KA',
    },
  ],
}

const redGroup = {
  dossierId: 'd2',
  dossierName: 'Qatar',
  dossierFlag: 'QA',
  commitments: [
    { id: 'c5', title: 'Red item', daysOverdue: 10, severity: 'red' as const, ownerInitials: 'KA' },
  ],
}

const amberGroup = {
  dossierId: 'd3',
  dossierName: 'Egypt',
  dossierFlag: 'EG',
  commitments: [
    {
      id: 'c6',
      title: 'Amber item',
      daysOverdue: 4,
      severity: 'amber' as const,
      ownerInitials: 'AB',
    },
  ],
}

describe('OverdueCommitments', () => {
  beforeEach((): void => {
    vi.mocked(usePersonalCommitments).mockReset()
    openDossierMock.mockReset()
  })

  it('renders loading skeleton when loading', (): void => {
    vi.mocked(usePersonalCommitments).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })
    const { container } = render(<OverdueCommitments />)
    expect(container.querySelector('.overdue-row')).toBeNull()
  })

  it('renders error state on failure', (): void => {
    vi.mocked(usePersonalCommitments).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })
    render(<OverdueCommitments />)
    expect(screen.getByText('error.load_failed')).toBeDefined()
  })

  it('renders empty state when no groups', (): void => {
    vi.mocked(usePersonalCommitments).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    })
    render(<OverdueCommitments />)
    expect(screen.getByText('overdue.empty')).toBeDefined()
  })

  it('renders groups sorted by highest severity (red → amber → yellow)', (): void => {
    vi.mocked(usePersonalCommitments).mockReturnValue({
      data: [yellowGroup, amberGroup, redGroup],
      isLoading: false,
      isError: false,
    })
    const { container } = render(<OverdueCommitments />)
    const groups = container.querySelectorAll('.overdue-group')
    expect(groups).toHaveLength(3)
    expect(groups[0]?.textContent).toContain('Qatar')
    expect(groups[1]?.textContent).toContain('Egypt')
    expect(groups[2]?.textContent).toContain('Saudi Arabia')
  })

  it('default shows 3 items per group; expand reveals the rest (without firing dossier-head click)', (): void => {
    vi.mocked(usePersonalCommitments).mockReturnValue({
      data: [yellowGroup],
      isLoading: false,
      isError: false,
    })
    const { container } = render(<OverdueCommitments />)
    expect(container.querySelectorAll('.overdue-row')).toHaveLength(3)
    // The expand toggle is a separate <button>; its click should NOT bubble to
    // the dossier-head trigger (stopPropagation).
    const expandToggle = screen.getByText('overdue.expand')
    fireEvent.click(expandToggle)
    expect(container.querySelectorAll('.overdue-row')).toHaveLength(4)
    expect(openDossierMock).not.toHaveBeenCalled()
  })

  it('severity dot CSS classes resolve to red/amber/yellow variants', (): void => {
    vi.mocked(usePersonalCommitments).mockReturnValue({
      data: [redGroup, amberGroup, yellowGroup],
      isLoading: false,
      isError: false,
    })
    const { container } = render(<OverdueCommitments />)
    const dots = container.querySelectorAll('.overdue-row [data-severity]')
    const seenSeverities = new Set<string>()
    dots.forEach((d): void => {
      const sev = d.getAttribute('data-severity')
      if (sev != null) {
        seenSeverities.add(sev)
      }
    })
    expect(seenSeverities.has('red')).toBe(true)
    expect(seenSeverities.has('amber')).toBe(true)
    expect(seenSeverities.has('yellow')).toBe(true)

    const redDot = container.querySelector('[data-severity="red"]')
    expect(redDot?.className).toContain('var(--sla-bad)')
    const amberDot = container.querySelector('[data-severity="amber"]')
    expect(amberDot?.className).toContain('var(--sla-risk)')
  })

  it('days-overdue chip is wrapped in LtrIsolate (dir=ltr) with mono font', (): void => {
    vi.mocked(usePersonalCommitments).mockReturnValue({
      data: [redGroup],
      isLoading: false,
      isError: false,
    })
    const { container } = render(<OverdueCommitments />)
    const chip = container.querySelector('.overdue-days')
    expect(chip).not.toBeNull()
    expect(chip?.getAttribute('dir')).toBe('ltr')
    expect(chip?.textContent).toContain('10')
  })

  it('renders DossierGlyph with iso flag for each group', (): void => {
    vi.mocked(usePersonalCommitments).mockReturnValue({
      data: [redGroup],
      isLoading: false,
      isError: false,
    })
    const glyph = render(<OverdueCommitments />).getAllByTestId('glyph')[0]
    expect(glyph?.getAttribute('data-iso')).toBe('QA')
    expect(glyph?.getAttribute('data-type')).toBe('country')
  })

  // -------------------------------------------------------------------------
  // Phase 41 plan 06 additions
  // -------------------------------------------------------------------------

  describe('drawer-trigger (Phase 41 plan 06)', (): void => {
    let warnSpy: ReturnType<typeof vi.spyOn>

    beforeEach((): void => {
      warnSpy = vi.spyOn(console, 'warn').mockImplementation((): void => undefined)
    })

    afterEach((): void => {
      warnSpy.mockRestore()
    })

    it('clicking the dossier-group head with explicit dossierType calls openDossier with that type and does NOT warn', (): void => {
      const typedGroup = {
        ...redGroup,
        dossierType: 'organization' as const,
      }
      vi.mocked(usePersonalCommitments).mockReturnValue({
        data: [typedGroup],
        isLoading: false,
        isError: false,
      } as never)
      render(<OverdueCommitments />)
      fireEvent.click(screen.getByTestId('overdue-commitments-dossier-head'))
      expect(openDossierMock).toHaveBeenCalledWith({ id: 'd2', type: 'organization' })
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it('clicking the dossier-group head WITHOUT dossierType falls back to "country" and emits one console.warn', (): void => {
      vi.mocked(usePersonalCommitments).mockReturnValue({
        data: [redGroup],
        isLoading: false,
        isError: false,
      })
      render(<OverdueCommitments />)
      fireEvent.click(screen.getByTestId('overdue-commitments-dossier-head'))
      expect(openDossierMock).toHaveBeenCalledWith({ id: 'd2', type: 'country' })
      expect(warnSpy).toHaveBeenCalledTimes(1)
      const msg = String(warnSpy.mock.calls[0]?.[0] ?? '')
      expect(msg).toContain('OverdueCommitments')
      expect(msg).toContain('deferred-items.md')
    })

    it('the dossier-group head trigger is a <button> with aria-label', (): void => {
      vi.mocked(usePersonalCommitments).mockReturnValue({
        data: [redGroup],
        isLoading: false,
        isError: false,
      })
      render(<OverdueCommitments />)
      const trigger = screen.getByTestId('overdue-commitments-dossier-head')
      expect(trigger.tagName).toBe('BUTTON')
      expect(trigger.getAttribute('type')).toBe('button')
      expect(trigger.getAttribute('aria-label')).toBe('Qatar')
    })
  })
})
