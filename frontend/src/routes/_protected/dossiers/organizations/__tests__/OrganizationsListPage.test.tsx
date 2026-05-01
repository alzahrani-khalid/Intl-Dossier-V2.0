/**
 * Phase 40 / Plan 04 — OrganizationsListPage render-assertion test (LIST-01).
 *
 * Mocks `useOrganizations`, the route helpers, and `useNavigate` so the page
 * can be rendered standalone (no router/QueryClient wrapping required).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { sensitivityChipClass } from '@/components/list-page'

// Project test pattern — per-file react-i18next mock (jest-dom is NOT registered).
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

// Mock the hook — its return shape mirrors useQuery output.
const mockUseOrganizations = vi.fn()
vi.mock('@/hooks/useOrganizations', () => ({
  useOrganizations: (filters: unknown): unknown => mockUseOrganizations(filters),
}))

// Mock TanStack Router — Route.useSearch / useNavigate / useNavigate root.
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (_path: string) => (config: Record<string, unknown>) => ({
    ...config,
    useSearch: (): { page: number; search?: string } => ({ page: 1, search: undefined }),
    useNavigate: (): (() => void) => vi.fn(),
  }),
  useNavigate: (): (() => void) => vi.fn(),
}))

// Import AFTER mocks are registered so Route.useSearch resolves to the mock factory.
import { Route } from '../index'

const Component = (Route as unknown as { component: () => JSX.Element }).component

const buildResponse = (
  rows: Array<Record<string, unknown>>,
): {
  data: { data: Array<Record<string, unknown>>; pagination: Record<string, unknown> }
  isLoading: boolean
  isError: boolean
} => ({
  data: {
    data: rows,
    pagination: { page: 1, limit: 20, total: rows.length, totalPages: 1 },
  },
  isLoading: false,
  isError: false,
})

describe('OrganizationsListPage (Phase 40 / Plan 04)', () => {
  beforeEach(() => {
    cleanup()
    mockUseOrganizations.mockReset()
  })

  it('renders Organizations title + WHO row + engagement count + level-2 sensitivity chip', () => {
    mockUseOrganizations.mockReturnValue(
      buildResponse([
        {
          id: 'b',
          name_en: 'WHO',
          name_ar: 'منظمة الصحة العالمية',
          engagement_count: 17,
          updated_at: '2026-04-10T00:00:00Z',
          sensitivity_level: 2,
        },
      ]),
    )

    render(<Component />)

    expect(screen.getByText('Organizations')).toBeTruthy()

    // Row contents.
    expect(screen.getByText('WHO')).toBeTruthy()
    expect(screen.getByText('17')).toBeTruthy()

    // Sensitivity chip uses sensitivityChipClass(2) === 'chip-default'.
    const chip = document.querySelector(`.${sensitivityChipClass(2)}`)
    expect(chip).not.toBeNull()
  })

  it('renders empty hint when there are no organizations', () => {
    mockUseOrganizations.mockReturnValue(buildResponse([]))

    render(<Component />)

    expect(screen.getByText('No organizations yet')).toBeTruthy()
    expect(screen.getByText('Organization dossiers will appear here.')).toBeTruthy()
  })
})
