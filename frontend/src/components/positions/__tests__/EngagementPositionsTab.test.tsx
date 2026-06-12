/**
 * EngagementPositionsTab — Wave-0 unit pins (ENGPOS-01 / ENGPOS-02)
 *
 * Pins the engagement workspace Positions tab onto the canonical data plane:
 *  - WorkspaceTabNav exposes a `positions` link between context and tasks (ENGPOS-01)
 *  - i18n key parity for the phase's new workspace keys in EN + AR (ENGPOS-01)
 *  - DossierPositionsTab, mounted with dossierId = an engagement uuid, reads
 *    position_dossier_links via that id and the onAttach handler persists each
 *    selection, invalidates the dossier-scoped reader, and toasts honestly (ENGPOS-02)
 *
 * Mirrors the NewPositionDialog.test.tsx pattern: module mocks with mutable state,
 * colon-form `t` mock, decision-tagged test names.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement, ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import enWorkspace from '@/i18n/en/workspace.json'
import arWorkspace from '@/i18n/ar/workspace.json'

// =============================================================================
// A fixed engagement-shaped uuid. engagementId IS a dossiers.id (ENGPOS-01).
// =============================================================================
const ENGAGEMENT_ID = '11111111-2222-4333-8444-555555555555'

// =============================================================================
// Mutable test state
// =============================================================================
let mockLanguage = 'en'

vi.mock('react-i18next', () => ({
  useTranslation: (): {
    t: (k: string, opts?: { defaultValue?: string }) => string
    i18n: { language: string }
  } => ({
    // Pass-through key resolver: returns the key (or defaultValue) so assertions
    // can target the resolved label / namespace key directly.
    t: (k: string, opts?: { defaultValue?: string }): string => {
      if (opts?.defaultValue !== undefined) return opts.defaultValue
      return k
    },
    i18n: { language: mockLanguage },
  }),
  Trans: ({ children }: { children: ReactNode }): ReactNode => children,
}))

vi.mock('@/hooks/useDirection', () => ({
  useDirection: (): { direction: 'ltr' | 'rtl'; isRTL: boolean } => ({
    direction: mockLanguage === 'ar' ? 'rtl' : 'ltr',
    isRTL: mockLanguage === 'ar',
  }),
}))

// Router mock: Link → anchor exposing its `to`; useMatchRoute → () => false.
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    ...rest
  }: {
    to: string
    children: ReactNode
    [key: string]: unknown
  }): ReactElement => (
    <a href={to} data-to={to} {...rest}>
      {children}
    </a>
  ),
  useMatchRoute: (): (() => boolean) => (): boolean => false,
}))

// Dossier reader — mocked so we can capture the id it is called with.
const useDossierPositionLinksMock = vi.fn()
vi.mock('@/hooks/useDossierPositionLinks', () => ({
  useDossierPositionLinks: (...args: unknown[]): unknown => useDossierPositionLinksMock(...args),
}))

// Minimal engagement dossier row so the WR-03 create guard resolves.
vi.mock('@/domains/dossiers/hooks/useDossier', () => ({
  useDossier: (): { data: unknown } => ({
    data: {
      id: ENGAGEMENT_ID,
      type: 'engagement',
      name_en: 'Bilateral Consultation',
      name_ar: 'مشاورة ثنائية',
    },
  }),
}))

// Capture the onAttach prop the tab hands the dialog. Rendered only when open.
const { attachOnAttachRef } = vi.hoisted(() => ({
  attachOnAttachRef: { current: null as ((ids: string[]) => Promise<void>) | null },
}))
vi.mock('@/components/positions/AttachPositionDialog', () => ({
  AttachPositionDialog: (props: { onAttach: (ids: string[]) => Promise<void> }): ReactElement => {
    attachOnAttachRef.current = props.onAttach
    return <div data-testid="attach-dialog" />
  },
}))

vi.mock('@/components/positions/NewPositionDialog', () => ({
  NewPositionDialog: (): null => null,
}))

vi.mock('@/components/positions/PositionList', () => ({
  PositionList: (): ReactElement => <div data-testid="position-list" />,
}))

const createPositionDossierLinkMock = vi.fn()
vi.mock('@/domains/positions/repositories/positions.repository', () => ({
  createPositionDossierLink: (...args: unknown[]): unknown =>
    createPositionDossierLinkMock(...args),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))

import { WorkspaceTabNav } from '@/components/workspace/WorkspaceTabNav'
import { DossierPositionsTab } from '../DossierPositionsTab'
import { toast } from 'sonner'

function renderWithClient(ui: ReactElement): { queryClient: QueryClient } {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
  return { queryClient }
}

beforeEach(() => {
  mockLanguage = 'en'
  attachOnAttachRef.current = null
  useDossierPositionLinksMock.mockReset()
  useDossierPositionLinksMock.mockReturnValue({
    positions: [],
    totalCount: 0,
    isLoading: false,
    error: null,
  })
  createPositionDossierLinkMock.mockReset()
  vi.mocked(toast.success).mockReset()
  vi.mocked(toast.error).mockReset()
})

describe('WorkspaceTabNav — engagement Positions tab nav entry (ENGPOS-01)', () => {
  it('renders a positions tab link targeting /engagements/$engagementId/positions, between context and tasks', () => {
    renderWithClient(<WorkspaceTabNav engagementId={ENGAGEMENT_ID} />)

    const links = screen.getAllByRole('tab')
    const tos = links.map((el) => el.getAttribute('data-to'))

    const positionsTo = '/engagements/$engagementId/positions'
    const contextTo = '/engagements/$engagementId/context'
    const tasksTo = '/engagements/$engagementId/tasks'

    expect(tos).toContain(positionsTo)
    const positionsIdx = tos.indexOf(positionsTo)
    const contextIdx = tos.indexOf(contextTo)
    const tasksIdx = tos.indexOf(tasksTo)

    // Placement: after context, before tasks (UI-SPEC A-1).
    expect(contextIdx).toBeGreaterThanOrEqual(0)
    expect(tasksIdx).toBeGreaterThanOrEqual(0)
    expect(positionsIdx).toBeGreaterThan(contextIdx)
    expect(positionsIdx).toBeLessThan(tasksIdx)
  })
})

describe('workspace i18n key parity (ENGPOS-01)', () => {
  const requiredKeys: Array<[string, string]> = [
    ['tabs', 'positions'],
    ['calendar', 'scheduledEvents'],
    ['calendar', 'entriesEmpty'],
    ['calendar', 'entriesError'],
  ]

  it('EN and AR workspace bundles both carry every new phase key with non-empty values', () => {
    for (const [group, key] of requiredKeys) {
      const en = (enWorkspace as Record<string, Record<string, string>>)[group]?.[key]
      const ar = (arWorkspace as Record<string, Record<string, string>>)[group]?.[key]
      expect(typeof en, `en.${group}.${key}`).toBe('string')
      expect((en ?? '').length, `en.${group}.${key} non-empty`).toBeGreaterThan(0)
      expect(typeof ar, `ar.${group}.${key}`).toBe('string')
      expect((ar ?? '').length, `ar.${group}.${key} non-empty`).toBeGreaterThan(0)
    }
  })

  it('AR tabs.positions resolves to المواقف (no silent English fallback — Pitfall 7)', () => {
    const arPositions = (arWorkspace as { tabs: { positions?: string } }).tabs.positions
    expect(arPositions).toBe('المواقف')
  })
})

describe('DossierPositionsTab mounted with an engagement id (ENGPOS-02)', () => {
  it('reads position_dossier_links via the engagement id', () => {
    renderWithClient(<DossierPositionsTab dossierId={ENGAGEMENT_ID} />)
    expect(useDossierPositionLinksMock).toHaveBeenCalled()
    expect(useDossierPositionLinksMock.mock.calls[0][0]).toBe(ENGAGEMENT_ID)
  })

  it('onAttach persists each position with { dossier_id: engagementId }, invalidates the reader, and toasts success', async () => {
    const user = userEvent.setup()
    createPositionDossierLinkMock.mockResolvedValue({ id: 'link-1' })
    const { queryClient } = renderWithClient(<DossierPositionsTab dossierId={ENGAGEMENT_ID} />)
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    // Open the attach dialog so the mocked dialog captures onAttach.
    await user.click(screen.getByRole('button', { name: 'positions:dossier_tab.attach_existing' }))
    await waitFor(() => expect(attachOnAttachRef.current).not.toBeNull())
    await attachOnAttachRef.current?.(['pos-a', 'pos-b'])

    expect(createPositionDossierLinkMock).toHaveBeenCalledTimes(2)
    expect(createPositionDossierLinkMock).toHaveBeenCalledWith('pos-a', {
      dossier_id: ENGAGEMENT_ID,
    })
    expect(createPositionDossierLinkMock).toHaveBeenCalledWith('pos-b', {
      dossier_id: ENGAGEMENT_ID,
    })
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['dossier-position-links', ENGAGEMENT_ID] }),
    )
    expect(toast.success).toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('onAttach fires an honest partial-failure toast when one link write rejects', async () => {
    const user = userEvent.setup()
    createPositionDossierLinkMock
      .mockResolvedValueOnce({ id: 'link-a' })
      .mockRejectedValueOnce(new Error('clearance denied'))
    const { queryClient } = renderWithClient(<DossierPositionsTab dossierId={ENGAGEMENT_ID} />)
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    await user.click(screen.getByRole('button', { name: 'positions:dossier_tab.attach_existing' }))
    await waitFor(() => expect(attachOnAttachRef.current).not.toBeNull())
    await attachOnAttachRef.current?.(['pos-a', 'pos-b'])

    expect(createPositionDossierLinkMock).toHaveBeenCalledTimes(2)
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['dossier-position-links', ENGAGEMENT_ID] }),
    )
    expect(toast.error).toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
  })
})
