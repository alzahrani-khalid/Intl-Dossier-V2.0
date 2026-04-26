/**
 * CountriesListPage render-assertion test (Phase 40 LIST-01)
 *
 * Asserts:
 * - Page renders Countries title
 * - Table renders France row with engagement count 42
 * - Sensitivity level=3 chip carries `chip-warn` class
 * - Empty state ("No countries yet") shows when adapter returns no rows
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import type { ReactNode } from 'react'

// --- Mocks (must be declared before importing the component under test) ---

vi.mock('react-i18next', () => ({
  useTranslation: (): {
    i18n: { language: string }
    t: (k: string, opts?: Record<string, unknown>) => string
  } => ({
    i18n: { language: 'en' },
    t: (k: string, opts?: Record<string, unknown>): string => {
      if (
        opts !== undefined &&
        opts !== null &&
        typeof opts === 'object' &&
        'defaultValue' in opts &&
        typeof opts.defaultValue === 'string'
      ) {
        return opts.defaultValue
      }
      // Map a handful of keys to user-visible strings for assertions.
      const map: Record<string, string> = {
        'countries:title': 'Countries',
        'countries:subtitle': 'All country dossiers',
        'countries:empty.title': 'No countries yet',
        'countries:empty.description': 'Country dossiers will appear here.',
        'countries.table.name': 'Country',
        'countries.table.engagements': 'Engagements',
        'countries.table.lastTouch': 'Last updated',
        'countries.table.sensitivity': 'Sensitivity',
        'countries.table.aria': 'Dossiers',
        'sensitivity.restricted': 'Restricted',
        'sensitivity.public': 'Public',
        'sensitivity.internal': 'Internal',
        'sensitivity.confidential': 'Confidential',
        'list-pages:search.placeholder': 'Search…',
      }
      return map[k] ?? k
    },
  }),
  Trans: ({ children }: { children: ReactNode }): ReactNode => children,
}))

const useCountriesMock = vi.fn()
vi.mock('@/hooks/useCountries', () => ({
  useCountries: (...args: unknown[]): unknown => useCountriesMock(...args),
}))

// DossierGlyph pulls in heavy signature-visuals; stub for test isolation.
vi.mock('@/components/signature-visuals', () => ({
  DossierGlyph: ({ name }: { name: string }): ReactNode => (
    <span data-testid="dossier-glyph">{name}</span>
  ),
}))

// useDebouncedValue → return value immediately so search behaves synchronously.
vi.mock('@/hooks/useDebouncedValue', () => ({
  useDebouncedValue: <T,>(v: T): T => v,
}))

import { CountriesListPage } from '../index'

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

describe('CountriesListPage', () => {
  beforeEach(() => {
    cleanup()
    useCountriesMock.mockReset()
  })

  it('renders the title and a populated row with sensitivity chip', () => {
    useCountriesMock.mockReturnValue({
      data: {
        data: [sampleRow],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
    })

    const { container } = render(
      <CountriesListPage page={1} search={undefined} onSearchChange={(): void => {}} />,
    )

    // Title
    expect(screen.getByRole('heading', { name: 'Countries' })).toBeTruthy()

    // Row content
    expect(screen.getByText('France')).toBeTruthy()
    expect(screen.getByText('42')).toBeTruthy()

    // Sensitivity chip — level 3 must carry the `chip-warn` class.
    const chip = container.querySelector('.chip.chip-warn')
    expect(chip).toBeTruthy()
    expect(chip?.textContent).toContain('Restricted')
  })

  it('renders empty state when adapter returns no rows', () => {
    useCountriesMock.mockReturnValue({
      data: {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      },
      isLoading: false,
      isError: false,
    })

    render(<CountriesListPage page={1} search={undefined} onSearchChange={(): void => {}} />)

    expect(screen.getByText('No countries yet')).toBeTruthy()
    expect(screen.getByText('Country dossiers will appear here.')).toBeTruthy()
  })

  it('renders skeleton (no row content) while loading', () => {
    useCountriesMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })

    render(<CountriesListPage page={1} search={undefined} onSearchChange={(): void => {}} />)

    // While loading, ListPageShell renders its DefaultSkeleton (data-testid="list-page-skeleton").
    expect(screen.getByTestId('list-page-skeleton')).toBeTruthy()
    // And France row is NOT in the DOM.
    expect(screen.queryByText('France')).toBeNull()
  })
})
