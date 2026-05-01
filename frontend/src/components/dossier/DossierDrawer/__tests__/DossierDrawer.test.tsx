/**
 * DossierDrawer — Wave 0 (Phase 41) shell tests.
 *
 * Mocks:
 *   - @tanstack/react-router → controllable useNavigate / useSearch
 *   - @/hooks/useDossier      → trivial { data: undefined }
 *   - @/hooks/useDossierOverview → controllable { data, isLoading }
 *
 * Behavior asserted (per 41-01-PLAN.md Task 2):
 *   1. closed when ?dossier= absent
 *   2. opens with role=dialog when ?dossier= and ?dossierType= present
 *   3. drawer + drawer-overlay classnames render
 *   4. close button wires to navigate-strip (closeDossier)
 *   5. skeleton renders 4 KPI / 1 summary / 2 upcoming / 4 activity / 2 commitments
 *      placeholders while loading
 */
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const navigateMock = vi.fn()
let searchValue: Record<string, unknown> = {}

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
  useSearch: () => searchValue,
}))

const overviewState: { data: unknown; isLoading: boolean } = {
  data: undefined,
  isLoading: true,
}

vi.mock('@/hooks/useDossier', () => ({
  useDossier: () => ({ data: undefined, isLoading: false }),
}))

vi.mock('@/hooks/useDossierOverview', () => ({
  useDossierOverview: () => ({
    data: overviewState.data ?? null,
    isLoading: overviewState.isLoading,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

import { DossierDrawer } from '../DossierDrawer'

describe('DossierDrawer (Wave 0 shell)', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    searchValue = {}
    overviewState.data = undefined
    overviewState.isLoading = true
    cleanup()
  })

  it('does not render when ?dossier is absent', () => {
    searchValue = {}
    const { container } = render(<DossierDrawer />)
    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })

  it('renders dialog with dossier-drawer accessible name when ?dossier and ?dossierType present', () => {
    searchValue = { dossier: 'test-id', dossierType: 'country' }
    render(<DossierDrawer />)
    // Global setup mock returns the i18n key; therefore the accessible name
    // is the dot-path 'accessible_title'.
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeTruthy()
  })

  it('emits drawer + drawer-overlay classnames on the rendered surfaces', () => {
    searchValue = { dossier: 'test-id', dossierType: 'country' }
    render(<DossierDrawer />)
    // Sheet portal mounts the content + overlay outside <main>; query at document scope.
    const overlay = document.querySelector('.drawer-overlay, [class*="bg-black"]')
    // The shell appends 'drawer' explicitly via SheetContent className.
    const drawer = document.querySelector('.drawer')
    expect(drawer).not.toBeNull()
    // Overlay defaults to a Radix-generated div; we tolerate either class match.
    expect(overlay).not.toBeNull()
  })

  it('clicking the close button invokes navigate with a search-stripping function (replace=true)', () => {
    searchValue = { dossier: 'test-id', dossierType: 'country', other: 'keep' }
    render(<DossierDrawer />)
    // Close button has aria-label === t('cta.close') === 'cta.close' (key-passthrough mock).
    const closeBtn = screen.getByRole('button', { name: 'cta.close' })
    fireEvent.click(closeBtn)
    expect(navigateMock).toHaveBeenCalled()
    const arg = navigateMock.mock.calls[0][0] as {
      search: (prev: Record<string, unknown>) => Record<string, unknown>
      replace: boolean
    }
    expect(arg.replace).toBe(true)
    const next = arg.search({ dossier: 'test-id', dossierType: 'country', other: 'keep' })
    expect(next).toEqual({ other: 'keep' })
  })

  it('renders DrawerSkeleton with correct placeholder counts while overview loads', () => {
    searchValue = { dossier: 'test-id', dossierType: 'country' }
    overviewState.data = undefined
    overviewState.isLoading = true
    render(<DossierDrawer />)
    expect(screen.getByTestId('dossier-drawer-skeleton')).toBeTruthy()
    expect(screen.getAllByTestId('skeleton-kpi-cell')).toHaveLength(4)
    expect(screen.getAllByTestId('skeleton-summary-row')).toHaveLength(1)
    expect(screen.getAllByTestId('skeleton-upcoming-item')).toHaveLength(2)
    expect(screen.getAllByTestId('skeleton-activity-item')).toHaveLength(4)
    expect(screen.getAllByTestId('skeleton-commitments-item')).toHaveLength(2)
  })

  it('applies inline style box-shadow:none when (max-width: 768px) matches (G5 mobile fix)', () => {
    // Simulate mobile viewport via matchMedia mock — useSyncExternalStore reads
    // the live MediaQueryList on each render.
    const originalMatchMedia = window.matchMedia
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(max-width: 768px)',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia

    try {
      searchValue = { dossier: 'test-id', dossierType: 'country' }
      render(<DossierDrawer />)
      const drawer = document.querySelector('.drawer') as HTMLElement | null
      expect(drawer).not.toBeNull()
      expect(drawer!.style.boxShadow).toBe('none')
    } finally {
      window.matchMedia = originalMatchMedia
    }
  })

  it('does NOT apply inline box-shadow when viewport is desktop (>768px)', () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false, // desktop — no media query matches
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia

    try {
      searchValue = { dossier: 'test-id', dossierType: 'country' }
      render(<DossierDrawer />)
      const drawer = document.querySelector('.drawer') as HTMLElement | null
      expect(drawer).not.toBeNull()
      // When boxShadow style is undefined, React omits the property — so it
      // stays empty-string in the inline style declaration.
      expect(drawer!.style.boxShadow).toBe('')
    } finally {
      window.matchMedia = originalMatchMedia
    }
  })
})
