/**
 * Forums list route test (Phase 40 LIST-03 · Phase 87 F23/F24/F26).
 *
 * Renders the wired route component with a mocked router + useForums adapter.
 * Asserts: title, populated rows + status chip tones (active→chip-ok,
 * cancelled→chip-danger), F23 peek registration on row click, and the F26 rich
 * empty state when there are no rows.
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

// useForums adapter + its extracted fetcher.
const useForumsMock = vi.fn()
vi.mock('@/hooks/useForums', () => ({
  useForums: (...args: unknown[]): unknown => useForumsMock(...args),
  fetchForumsPage: vi.fn(),
}))

// DossierGlyph pulls in heavy signature-visuals; stub for test isolation (no text
// so the row's accessible name stays the primary label).
vi.mock('@/components/signature-visuals/DossierGlyph', () => ({
  DossierGlyph: (): ReactNode => <span data-testid="dossier-glyph" aria-hidden="true" />,
}))

import { Route } from '../index'

const ForumsRoute = (Route as unknown as { component: () => ReactElement }).component

const renderRoute = (): ReturnType<typeof render> => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <LanguageProvider initialLanguage="en">
        <ForumsRoute />
      </LanguageProvider>
    </QueryClientProvider>,
  )
}

const forumRow = {
  id: 'f1',
  name_en: 'G20',
  name_ar: 'مجموعة العشرين',
  status: 'active',
  updated_at: '2026-04-15T00:00:00Z',
}
const cancelledRow = {
  id: 'f2',
  name_en: 'OPEC',
  name_ar: 'أوبك',
  status: 'cancelled',
  updated_at: '2026-03-20T00:00:00Z',
}

describe('Forums list route (Phase 87 wiring)', () => {
  beforeEach(() => {
    cleanup()
    useForumsMock.mockReset()
    navigateSpy.mockReset()
    currentSearch = { page: 1 }
    usePeekStore.getState().clear()
  })

  it('renders the title and one row per forum with status chip tones', () => {
    useForumsMock.mockReturnValue({
      data: {
        data: [forumRow, cancelledRow],
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
    })

    const { container } = renderRoute()

    expect(screen.getByRole('heading', { name: 'Forums' })).toBeTruthy()
    const rows = screen.getAllByTestId('generic-list-page-row')
    expect(rows.length).toBe(2)

    expect(container.querySelector('.chip.chip-ok')).toBeTruthy()
    expect(container.querySelector('.chip.chip-danger')).toBeTruthy()
  })

  it('registers a peek window and opens the drawer on row click (F23, no detail navigate)', () => {
    useForumsMock.mockReturnValue({
      data: {
        data: [forumRow, cancelledRow],
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
    })

    renderRoute()

    fireEvent.click(screen.getAllByTestId('generic-list-page-row')[0])

    const peek = usePeekStore.getState()
    expect(peek.ids).toEqual(['f1', 'f2'])
    expect(peek.type).toBe('forum')
    expect(peek.total).toBe(2)
    expect(navigateSpy).toHaveBeenCalled()
    const navArg = navigateSpy.mock.calls[0]?.[0] as { to?: string }
    expect(navArg.to).toBeUndefined()
  })

  it('renders the rich empty state when the adapter returns no rows', () => {
    useForumsMock.mockReturnValue({
      data: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
      isLoading: false,
      isError: false,
    })

    renderRoute()

    expect(screen.getByTestId('list-empty-state-forum')).toBeTruthy()
  })
})
