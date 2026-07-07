/**
 * Countries list route test (Phase 40 LIST-01 · Phase 87 F23/F24/F26).
 *
 * Renders the wired route component with a mocked router + useCountries adapter.
 * Asserts: title, populated row + engagement count + sensitivity chip, F23 peek
 * registration on row click, and the F26 rich empty state when there are no rows.
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

// useCountries adapter + its extracted fetcher.
const useCountriesMock = vi.fn()
vi.mock('@/hooks/useCountries', () => ({
  useCountries: (...args: unknown[]): unknown => useCountriesMock(...args),
  fetchCountriesPage: vi.fn(),
}))

// DossierGlyph pulls in heavy signature-visuals; stub for test isolation.
vi.mock('@/components/signature-visuals', () => ({
  DossierGlyph: ({ name }: { name: string }): ReactNode => (
    <span data-testid="dossier-glyph">{name}</span>
  ),
}))

import { Route } from '../index'

const CountriesRoute = (Route as unknown as { component: () => ReactElement }).component

const renderRoute = (): ReturnType<typeof render> => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <LanguageProvider initialLanguage="en">
        <CountriesRoute />
      </LanguageProvider>
    </QueryClientProvider>,
  )
}

const sampleRow = {
  id: 'a',
  type: 'country',
  name_en: 'France',
  name_ar: 'فرنسا',
  iso_code: 'FR',
  engagement_count: 42,
  updated_at: '2026-04-01T00:00:00Z',
  sensitivity_level: 3,
}

describe('Countries list route (Phase 87 wiring)', () => {
  beforeEach(() => {
    cleanup()
    useCountriesMock.mockReset()
    navigateSpy.mockReset()
    currentSearch = { page: 1 }
    usePeekStore.getState().clear()
  })

  it('renders the title and a populated row with sensitivity chip', () => {
    useCountriesMock.mockReturnValue({
      data: { data: [sampleRow], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } },
      isLoading: false,
      isError: false,
    })

    const { container } = renderRoute()

    expect(screen.getByRole('heading', { name: 'Countries' })).toBeTruthy()
    expect(screen.getAllByText('France').length).toBeGreaterThan(0)
    expect(screen.getByText('42')).toBeTruthy()

    const chip = container.querySelector('.chip.chip-warn')
    expect(chip).toBeTruthy()
  })

  it('registers a peek window and opens the drawer on row click (F23, no detail navigate)', () => {
    useCountriesMock.mockReturnValue({
      data: {
        data: [sampleRow, { ...sampleRow, id: 'b', name_en: 'Egypt' }],
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
    })

    renderRoute()

    fireEvent.click(screen.getByRole('button', { name: 'France' }))

    // Peek registry now holds the loaded id window for cross-page paging.
    const peek = usePeekStore.getState()
    expect(peek.ids).toEqual(['a', 'b'])
    expect(peek.type).toBe('country')
    expect(peek.total).toBe(2)
    // Drawer opened via ?dossier= search write — no navigate to a detail route.
    expect(navigateSpy).toHaveBeenCalled()
    const navArg = navigateSpy.mock.calls[0]?.[0] as { to?: string }
    expect(navArg.to).toBeUndefined()
  })

  it('renders the rich empty state when the adapter returns no rows', () => {
    useCountriesMock.mockReturnValue({
      data: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
      isLoading: false,
      isError: false,
    })

    renderRoute()

    expect(screen.getByTestId('list-empty-state-country')).toBeTruthy()
  })
})
