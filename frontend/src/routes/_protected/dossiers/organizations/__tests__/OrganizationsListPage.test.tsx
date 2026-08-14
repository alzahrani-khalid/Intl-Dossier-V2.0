/**
 * Organizations list route test (Phase 40 LIST-01 · Phase 87 F23/F24/F26).
 *
 * Mirrors the countries route test: mocked router + useOrganizations adapter,
 * QueryClient + LanguageProvider wrappers. Asserts title, populated row, F23 peek
 * registration on row click, and the F26 rich empty state.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LanguageProvider } from '@/components/language-provider/language-provider'
import { usePeekStore } from '@/store/peekStore'

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

const useOrganizationsMock = vi.fn()
vi.mock('@/hooks/useOrganizations', () => ({
  useOrganizations: (...args: unknown[]): unknown => useOrganizationsMock(...args),
  fetchOrganizationsPage: vi.fn(),
}))

vi.mock('@/components/signature-visuals', () => ({
  DossierGlyph: ({ name }: { name: string }): ReactNode => (
    <span data-testid="dossier-glyph">{name}</span>
  ),
}))

import { Route } from '../index'

const OrganizationsRoute = (Route as unknown as { component: () => ReactElement }).component

const renderRoute = (): ReturnType<typeof render> => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <LanguageProvider initialLanguage="en">
        <OrganizationsRoute />
      </LanguageProvider>
    </QueryClientProvider>,
  )
}

const sampleRow = {
  id: 'b',
  type: 'organization',
  name_en: 'WHO',
  name_ar: 'منظمة الصحة العالمية',
  engagement_count: 17,
  updated_at: '2026-04-10T00:00:00Z',
  sensitivity_level: 2,
}

describe('Organizations list route (Phase 87 wiring)', () => {
  beforeEach(() => {
    cleanup()
    useOrganizationsMock.mockReset()
    navigateSpy.mockReset()
    currentSearch = { page: 1 }
    usePeekStore.getState().clear()
  })

  it('renders the title and a populated row with sensitivity chip', () => {
    useOrganizationsMock.mockReturnValue({
      data: { data: [sampleRow], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } },
      isLoading: false,
      isError: false,
    })

    const { container } = renderRoute()

    expect(screen.getByRole('heading', { name: 'Organizations' })).toBeTruthy()
    expect(screen.getAllByText('WHO').length).toBeGreaterThan(0)
    expect(screen.getByText('17')).toBeTruthy()
    expect(container.querySelector('.chip')).toBeTruthy()
  })

  it('registers a peek window and opens the drawer on row click (F23, no detail navigate)', () => {
    useOrganizationsMock.mockReturnValue({
      data: {
        data: [sampleRow, { ...sampleRow, id: 'c', name_en: 'UNESCO' }],
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
    })

    renderRoute()

    fireEvent.click(screen.getByRole('button', { name: 'WHO' }))

    const peek = usePeekStore.getState()
    expect(peek.ids).toEqual(['b', 'c'])
    expect(peek.type).toBe('organization')
    expect(peek.total).toBe(2)
    expect(navigateSpy).toHaveBeenCalled()
    const navArg = navigateSpy.mock.calls[0]?.[0] as { to?: string }
    expect(navArg.to).toBeUndefined()
  })

  it('renders the rich empty state when the adapter returns no rows', () => {
    useOrganizationsMock.mockReturnValue({
      data: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
      isLoading: false,
      isError: false,
    })

    renderRoute()

    expect(screen.getByTestId('list-empty-state-organization')).toBeTruthy()
  })
})
