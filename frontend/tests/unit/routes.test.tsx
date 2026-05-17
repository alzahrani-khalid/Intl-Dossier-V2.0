import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, renderWithProviders as render, screen, waitFor } from '@tests/utils/render'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { QueryClient } from '@tanstack/react-query'
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { routeTree } from '../../src/routeTree.gen'

const authMocks = vi.hoisted(() => {
  const authState = {
    user: {
      id: 'user-1',
      email: 'user@example.com',
      name: 'Route Tester',
      role: 'admin',
    },
    isAuthenticated: true,
    isLoading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    clearError: vi.fn(),
    handleAuthStateChange: vi.fn(),
  }

  const useAuthStore = vi.fn((selector?: (state: typeof authState) => unknown) =>
    selector ? selector(authState) : authState,
  )
  useAuthStore.getState = vi.fn(() => authState)
  useAuthStore.setState = vi.fn((nextState: Partial<typeof authState>) => {
    Object.assign(authState, nextState)
  })

  const getSession = vi.fn()
  const supabase = {
    auth: {
      getSession,
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      })),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithPassword: vi
        .fn()
        .mockResolvedValue({ data: { user: authState.user }, error: null }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  }

  return { authState, getSession, supabase, useAuthStore }
})

vi.mock('../../src/store/authStore', () => ({
  supabase: authMocks.supabase,
  useAuthStore: authMocks.useAuthStore,
  subscribeToAuthChanges: vi.fn(() => vi.fn()),
}))

vi.mock('@/store/authStore', () => ({
  supabase: authMocks.supabase,
  useAuthStore: authMocks.useAuthStore,
  subscribeToAuthChanges: vi.fn(() => vi.fn()),
}))

vi.mock('../../src/lib/supabase', () => ({
  supabase: authMocks.supabase,
}))

vi.mock('@/lib/supabase', () => ({
  supabase: authMocks.supabase,
}))

vi.mock('@/contexts/auth.context', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => authMocks.authState,
}))

vi.mock('@/components/layout/AppShell', () => ({
  AppShell: ({ children }: { children: ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
}))

vi.mock('@/contexts/ChatContext', () => ({
  ChatProvider: ({ children }: { children: ReactNode }) => children,
}))

vi.mock('@/components/work-creation', () => ({
  WorkCreationProvider: ({ children }: { children: ReactNode }) => children,
}))

vi.mock('@/components/keyboard-shortcuts', () => ({
  KeyboardShortcutProvider: ({ children }: { children: ReactNode }) => children,
  CommandPalette: () => null,
}))

vi.mock('@/contexts/dossier-context', () => ({
  DossierContextProvider: ({ children }: { children: ReactNode }) => children,
}))

vi.mock('@/components/ai/ChatDock', () => ({
  ChatDock: () => null,
}))

vi.mock('@/components/dossier/DossierDrawer', () => ({
  DossierDrawer: () => null,
}))

vi.mock('@/components/guided-tours', () => ({
  TourProvider: ({ children }: { children: ReactNode }) => children,
  TourOverlay: () => null,
  OnboardingTourTrigger: () => null,
}))

vi.mock('@/components/error-boundary', () => ({
  ErrorBoundary: ({ children }: { children: ReactNode }) => children,
}))

vi.mock('@/pages/dossiers/DossierListPage', async () => {
  const { useNavigate, useRouterState } =
    await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router')

  return {
    DossierListPage: () => {
      const navigate = useNavigate()
      const search = useRouterState({
        select: (state) => state.location.search as Record<string, unknown>,
      })

      const countryChecked = search.type === 'country'
      const activeChecked = search.status === 'active'
      const searchValue = typeof search.search === 'string' ? search.search : ''

      const updateSearch = (nextSearch: Record<string, unknown>) => {
        void navigate({
          to: '/dossiers',
          search: nextSearch,
        })
      }

      return (
        <section aria-label="Dossiers Hub Route">
          <button
            type="button"
            aria-label="Test Dossier"
            onClick={() =>
              void navigate({
                to: '/dossiers/countries/$id/overview',
                params: { id: '123' },
              })
            }
          >
            Test Dossier
          </button>
          <label>
            <input
              type="checkbox"
              checked={countryChecked}
              onChange={() =>
                updateSearch({
                  ...search,
                  type: countryChecked ? undefined : 'country',
                })
              }
            />
            Country
          </label>
          <label>
            <input
              type="checkbox"
              checked={activeChecked}
              onChange={() =>
                updateSearch({
                  ...search,
                  status: activeChecked ? undefined : 'active',
                })
              }
            />
            Active
          </label>
          <input
            type="search"
            aria-label="Search dossiers"
            value={searchValue}
            onChange={(event) =>
              updateSearch({
                ...search,
                search: event.currentTarget.value || undefined,
              })
            }
          />
          <button type="button" onClick={() => updateSearch({})}>
            Reset
          </button>
        </section>
      )
    },
  }
})

vi.mock('@/components/dossier/DossierShell', async () => {
  const { useNavigate, useRouterState } =
    await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router')

  return {
    DossierShell: ({
      dossierId,
      children: _children,
    }: {
      dossierId: string
      dossierType: string
      children: ReactNode
    }) => {
      const navigate = useNavigate()
      const pathname = useRouterState({
        select: (state) => state.location.pathname,
      })

      const navigateToTab = (tab: 'overview' | 'timeline' | 'positions') => {
        void navigate({
          to: `/dossiers/countries/$id/${tab}`,
          params: { id: dossierId },
        })
      }

      return (
        <section aria-label="Dossier Detail Route">
          <h1>Test Dossier</h1>
          <p>Test summary</p>
          <dl>
            <dt>Engagements</dt>
            <dd>5</dd>
          </dl>
          <div role="tablist" aria-label="Dossier tabs">
            <button
              type="button"
              role="tab"
              aria-selected={pathname.endsWith('/overview')}
              onClick={() => navigateToTab('overview')}
            >
              Overview
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={pathname.endsWith('/timeline')}
              onClick={() => navigateToTab('timeline')}
            >
              Timeline
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={pathname.endsWith('/positions')}
              onClick={() => navigateToTab('positions')}
            >
              Positions
            </button>
          </div>
        </section>
      )
    },
  }
})

function createTestRouter(initialEntries: string[]) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  const history = createMemoryHistory({ initialEntries })
  const router = createRouter({
    routeTree,
    history,
    context: {
      queryClient,
    },
  })

  return { queryClient, router }
}

function renderRouter(router: ReturnType<typeof createRouter>, queryClient: QueryClient) {
  return render(<RouterProvider router={router} />, { queryClient })
}

describe('Dossiers Hub Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMocks.authState.user = {
      id: 'user-1',
      email: 'user@example.com',
      name: 'Route Tester',
      role: 'admin',
    }
    authMocks.authState.isAuthenticated = true
    authMocks.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'test-token',
          user: authMocks.authState.user,
        },
      },
      error: null,
    })
  })

  it('renders the protected dossier hub route with dossier list content', async () => {
    const { queryClient, router } = createTestRouter(['/dossiers'])

    renderRouter(router, queryClient)

    await waitFor(() => {
      expect(screen.getByText('Test Dossier')).toBeInTheDocument()
    })
  })

  it('updates URL params when filters change', async () => {
    const { queryClient, router } = createTestRouter(['/dossiers'])

    renderRouter(router, queryClient)

    await waitFor(() => {
      expect(screen.getByText('Test Dossier')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('checkbox', { name: /country/i }))

    await waitFor(() => {
      expect(router.state.location.search).toMatchObject({
        type: 'country',
      })
    })
  })

  it('syncs URL params to filter state on initial load', async () => {
    const { queryClient, router } = createTestRouter(['/dossiers?type=country&status=active'])

    renderRouter(router, queryClient)

    await waitFor(() => {
      expect(screen.getByText('Test Dossier')).toBeInTheDocument()
    })

    expect(screen.getByRole('checkbox', { name: /country/i })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /active/i })).toBeChecked()
  })

  it('clears URL params when filters are reset', async () => {
    const { queryClient, router } = createTestRouter(['/dossiers?type=country&status=active'])

    renderRouter(router, queryClient)

    await waitFor(() => {
      expect(screen.getByText('Test Dossier')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /reset/i }))

    await waitFor(() => {
      expect(router.state.location.search).toEqual({})
    })
  })

  it('persists search query in URL', async () => {
    const user = userEvent.setup()
    const { queryClient, router } = createTestRouter(['/dossiers'])

    renderRouter(router, queryClient)

    await waitFor(() => {
      expect(screen.getByText('Test Dossier')).toBeInTheDocument()
    })

    await user.type(screen.getByRole('searchbox'), 'Saudi')

    await waitFor(() => {
      expect(router.state.location.search).toMatchObject({
        search: 'Saudi',
      })
    })
  })
})

describe('Dossier Detail Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMocks.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'test-token',
          user: authMocks.authState.user,
        },
      },
      error: null,
    })
  })

  it('renders a type-specific detail route with dossier data', async () => {
    const { queryClient, router } = createTestRouter(['/dossiers/countries/123/overview'])

    renderRouter(router, queryClient)

    await waitFor(() => {
      expect(screen.getByText('Test Dossier')).toBeInTheDocument()
      expect(screen.getByText(/Test summary/)).toBeInTheDocument()
    })
  })

  it('displays stats in the detail shell', async () => {
    const { queryClient, router } = createTestRouter(['/dossiers/countries/123/overview'])

    renderRouter(router, queryClient)

    await waitFor(() => {
      expect(screen.getByText(/engagements/i)).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })
  })

  it('redirects the bare type-specific detail route to the overview tab', async () => {
    const { queryClient, router } = createTestRouter(['/dossiers/countries/123'])

    renderRouter(router, queryClient)

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/dossiers/countries/123/overview')
    })

    expect(screen.getByRole('tab', { name: /overview/i })).toHaveAttribute('aria-selected', 'true')
  })

  it('switches tabs using path-based child routes', async () => {
    const { queryClient, router } = createTestRouter(['/dossiers/countries/123/overview'])

    renderRouter(router, queryClient)

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('tab', { name: /positions/i }))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/dossiers/countries/123/positions')
      expect(screen.getByRole('tab', { name: /positions/i })).toHaveAttribute(
        'aria-selected',
        'true',
      )
    })
  })

  it('syncs tab state from the URL on initial load', async () => {
    const { queryClient, router } = createTestRouter(['/dossiers/countries/123/positions'])

    renderRouter(router, queryClient)

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /positions/i })).toHaveAttribute(
        'aria-selected',
        'true',
      )
    })
  })

  it('shows the router 404 state when a dossier route does not exist', async () => {
    const { queryClient, router } = createTestRouter(['/dossiers/nonexistent'])

    renderRouter(router, queryClient)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument()
    })
  })
})

describe('Navigation Between Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMocks.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'test-token',
          user: authMocks.authState.user,
        },
      },
      error: null,
    })
  })

  it('navigates from hub to detail and maintains filter state on back', async () => {
    const { queryClient, router } = createTestRouter(['/dossiers?type=country'])

    renderRouter(router, queryClient)

    await waitFor(() => {
      expect(screen.getByText('Test Dossier')).toBeInTheDocument()
    })

    expect(screen.getByRole('checkbox', { name: /country/i })).toBeChecked()

    await userEvent.click(screen.getByRole('button', { name: /test dossier/i }))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/dossiers/countries/123/overview')
      expect(screen.getByText(/Test summary/)).toBeInTheDocument()
    })

    await act(async () => {
      await router.history.back()
    })

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/dossiers')
      expect(router.state.location.search).toMatchObject({
        type: 'country',
      })
    })
  })

  it('preserves detail tab when navigating away and back', async () => {
    const { queryClient, router } = createTestRouter(['/dossiers/countries/123/positions'])

    renderRouter(router, queryClient)

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /positions/i })).toHaveAttribute(
        'aria-selected',
        'true',
      )
    })

    await act(async () => {
      await router.navigate({ to: '/dossiers' })
    })

    await waitFor(() => {
      expect(screen.getByText('Test Dossier')).toBeInTheDocument()
    })

    await act(async () => {
      await router.history.back()
    })

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/dossiers/countries/123/positions')
    })
  })

  it('handles browser back and forward navigation correctly', async () => {
    const { queryClient, router } = createTestRouter(['/dossiers?type=country'])

    renderRouter(router, queryClient)

    await waitFor(() => {
      expect(screen.getByText('Test Dossier')).toBeInTheDocument()
    })

    await act(async () => {
      await router.navigate({
        to: '/dossiers/countries/$id/overview',
        params: { id: '123' },
      })
    })

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/dossiers/countries/123/overview')
      expect(screen.getByText(/Test summary/)).toBeInTheDocument()
    })

    await act(async () => {
      await router.history.back()
    })

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/dossiers')
    })

    await act(async () => {
      await router.history.forward()
    })

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/dossiers/countries/123/overview')
    })
  })
})
