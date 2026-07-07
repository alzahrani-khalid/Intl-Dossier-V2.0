/**
 * Working Groups list route test (Phase 40 LIST-03 · Phase 87 F23/F24/F26).
 *
 * Renders the wired route component with a mocked router + useWorkingGroups adapter.
 * Asserts: title, populated rows + status chip tones (active→chip-ok,
 * suspended→chip-warn), F23 peek registration on row click, and the F26 empty state
 * (the `working-groups-empty` testid contract is preserved).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LanguageProvider } from '@/components/language-provider/language-provider'
import { usePeekStore } from '@/store/peekStore'

// --- Router mock (createFileRoute + useNavigate/useSearch for useDossierDrawer) ---

let currentSearch: Record<string, unknown> = { page: 1 }
const navigateSpy = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (_path: string) => (config: Record<string, unknown>) => ({
    ...config,
    useSearch: (): Record<string, unknown> => currentSearch,
    useNavigate: (): typeof navigateSpy => navigateSpy,
  }),
  useNavigate: (): typeof navigateSpy => navigateSpy,
  useSearch: (): Record<string, unknown> => ({}),
}))

// useWorkingGroups adapter + its extracted fetcher.
const useWorkingGroupsMock = vi.fn()
vi.mock('@/hooks/useWorkingGroups', () => ({
  useWorkingGroups: (...args: unknown[]): unknown => useWorkingGroupsMock(...args),
  fetchWorkingGroupsPage: vi.fn(),
}))

// DossierGlyph pulls in heavy signature-visuals; stub for test isolation (no text
// so the row's accessible name stays the primary label).
vi.mock('@/components/signature-visuals', () => ({
  DossierGlyph: (): ReactNode => <span data-testid="dossier-glyph" aria-hidden="true" />,
}))

import { Route } from '../index'

const WorkingGroupsRoute = (Route as unknown as { component: () => ReactElement }).component

const renderRoute = (): ReturnType<typeof render> => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <LanguageProvider initialLanguage="en">
        <WorkingGroupsRoute />
      </LanguageProvider>
    </QueryClientProvider>,
  )
}

const activeRow = {
  id: 'wg1',
  name_en: 'AI Ethics WG',
  name_ar: 'فريق أخلاقيات الذكاء الاصطناعي',
  status: 'active',
  updated_at: '2026-04-15T00:00:00Z',
}
const suspendedRow = {
  id: 'wg2',
  name_en: 'Trade Sanctions WG',
  name_ar: 'فريق العقوبات التجارية',
  status: 'suspended',
  updated_at: '2026-03-01T00:00:00Z',
}

describe('Working Groups list route (Phase 87 wiring)', () => {
  beforeEach(() => {
    cleanup()
    useWorkingGroupsMock.mockReset()
    navigateSpy.mockReset()
    currentSearch = { page: 1 }
    usePeekStore.getState().clear()
  })

  it('renders the title and one row per working group with status chip tones', () => {
    useWorkingGroupsMock.mockReturnValue({
      data: {
        data: [activeRow, suspendedRow],
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
    })

    const { container } = renderRoute()

    expect(screen.getByRole('heading', { name: 'Working Groups' })).toBeTruthy()
    const rows = screen.getAllByTestId('generic-list-page-row')
    expect(rows.length).toBe(2)

    const activeChip = screen
      .getByText('AI Ethics WG')
      .closest('[data-testid="generic-list-page-row"]')
      ?.querySelector('[data-testid="generic-list-page-status"]')
    expect(activeChip?.className).toContain('chip-ok')
    expect(container.querySelector('.chip.chip-warn')).toBeTruthy()
  })

  it('registers a peek window and opens the drawer on row click (F23, no detail navigate)', () => {
    useWorkingGroupsMock.mockReturnValue({
      data: {
        data: [activeRow, suspendedRow],
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
    })

    renderRoute()

    fireEvent.click(screen.getAllByTestId('generic-list-page-row')[0])

    const peek = usePeekStore.getState()
    expect(peek.ids).toEqual(['wg1', 'wg2'])
    expect(peek.type).toBe('working_group')
    expect(peek.total).toBe(2)
    expect(navigateSpy).toHaveBeenCalled()
    const navArg = navigateSpy.mock.calls[0]?.[0] as { to?: string }
    expect(navArg.to).toBeUndefined()
  })

  it('renders the empty state and preserves the working-groups-empty testid', () => {
    useWorkingGroupsMock.mockReturnValue({
      data: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
      isLoading: false,
      isError: false,
    })

    renderRoute()

    expect(screen.getByTestId('working-groups-empty')).toBeTruthy()
    expect(screen.getByTestId('list-empty-state-working_group')).toBeTruthy()
  })
})
