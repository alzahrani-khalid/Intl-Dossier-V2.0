/**
 * Phase 40 LIST-03 — Forums list page render-assertion tests.
 *
 * Verifies the route renders <GenericListPage> with the canonical
 * forum-row anatomy (DossierGlyph + meta + status chip + chevron),
 * and that the status tone map is applied: active→chip-ok,
 * cancelled→chip-danger.
 */
import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders as render, screen } from '@tests/utils/render'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import type { ReactElement } from 'react'

// Per-file react-i18next mock (project pattern — global mock is feature-scoped).
vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next')

  return {
    ...actual,
    useTranslation: (): {
      i18n: { language: string; changeLanguage: () => Promise<void> }
      t: (k: string, opts?: Record<string, unknown>) => string
    } => ({
      i18n: { language: 'en', changeLanguage: vi.fn().mockResolvedValue(undefined) },
      t: (k: string, opts?: Record<string, unknown>): string => {
        // Translate explicit forum keys first (they override defaultValue).
        if (k === 'forums:status.active') return 'Active'
        if (k === 'forums:status.cancelled') return 'Cancelled'
        if (k === 'forums:title') return 'Forums'
        if (k === 'forums:subtitle') return 'Multi-party conferences'
        if (k === 'forums:empty.title') return 'No forums yet'
        if (k === 'forums:empty.description') return 'Forum dossiers will appear here.'
        // Fall back to defaultValue for unknown keys.
        if (
          opts !== undefined &&
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
  }
})

// Mock useDirection — LTR for these tests.
vi.mock('@/hooks/useDirection', () => ({
  useDirection: (): { isRTL: boolean; dir: 'ltr' } => ({ isRTL: false, dir: 'ltr' }),
}))

// Mock useForums hook with two forum dossiers covering active + cancelled.
const mockForums = [
  {
    id: 'f1',
    name_en: 'G20',
    name_ar: 'مجموعة العشرين',
    status: 'active',
    updated_at: '2026-04-15T00:00:00Z',
  },
  {
    id: 'f2',
    name_en: 'OPEC',
    name_ar: 'أوبك',
    status: 'cancelled',
    updated_at: '2026-03-20T00:00:00Z',
  },
]

vi.mock('@/hooks/useForums', () => ({
  useForums: (): {
    data: {
      data: typeof mockForums
      pagination: { page: number; limit: number; total: number; totalPages: number }
    }
    isLoading: boolean
    isError: boolean
  } => ({
    data: {
      data: mockForums,
      pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
    },
    isLoading: false,
    isError: false,
  }),
}))

async function renderRoute(): Promise<ReactElement> {
  // Lazy-import the route module so the mocks above are applied first.
  const { Route } = (await import('../index')) as {
    Route: ReturnType<typeof createRoute>
  }

  // Re-parent the route under a synthetic root for isolated testing.
  const rootRoute = createRootRoute({ component: () => <Outlet /> })
  const child = createRoute({
    getParentRoute: () => rootRoute,
    path: '/_protected/dossiers/forums/',
    component: (Route.options as { component: () => ReactElement }).component,
    validateSearch: (
      Route.options as {
        validateSearch: (s: Record<string, unknown>) => unknown
      }
    ).validateSearch,
  })

  const router = createRouter({
    routeTree: rootRoute.addChildren([child]),
    history: createMemoryHistory({ initialEntries: ['/_protected/dossiers/forums/'] }),
  })

  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return (
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

describe('ForumsListPage (LIST-03)', () => {
  it('renders Forums title', async () => {
    render(await renderRoute())
    expect(await screen.findByText('Forums')).toBeTruthy()
  })

  it('renders one row per forum (2 rows total)', async () => {
    render(await renderRoute())
    await screen.findByText('Forums')
    const rows = screen.getAllByTestId('generic-list-page-row')
    expect(rows.length).toBe(2)
  })

  it('maps active → chip-ok', async () => {
    const { container } = render(await renderRoute())
    await screen.findByText('Forums')
    const chips = container.querySelectorAll('[data-testid="generic-list-page-status"]')
    // First row (G20, active) → chip-ok
    const g20Chip = Array.from(chips).find((c) => c.textContent === 'Active')
    expect(g20Chip).toBeTruthy()
    expect(g20Chip?.className.includes('chip-ok')).toBe(true)
  })

  it('maps cancelled → chip-danger', async () => {
    const { container } = render(await renderRoute())
    await screen.findByText('Forums')
    const chips = container.querySelectorAll('[data-testid="generic-list-page-status"]')
    // Second row (OPEC, cancelled) → chip-danger
    const opecChip = Array.from(chips).find((c) => c.textContent === 'Cancelled')
    expect(opecChip).toBeTruthy()
    expect(opecChip?.className.includes('chip-danger')).toBe(true)
  })
})
