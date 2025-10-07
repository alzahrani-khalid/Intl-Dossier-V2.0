import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/i18n';
import { routeTree } from '../../src/routeTree.gen';
import type { DossierFilters } from '../../src/types/dossier';

// Mock hooks
const mockDossiers = {
  data: [
    {
      id: '123',
      name_en: 'Test Dossier',
      name_ar: 'ملف اختبار',
      type: 'country',
      status: 'active',
      sensitivity_level: 'low',
      version: 1,
      tags: [],
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      archived: false,
    },
  ],
  pagination: {
    next_cursor: null,
    has_more: false,
  },
};

const mockDossier = {
  id: '123',
  name_en: 'Test Dossier',
  name_ar: 'ملف اختبار',
  type: 'country' as const,
  status: 'active' as const,
  sensitivity_level: 'low' as const,
  summary_en: 'Test summary',
  summary_ar: 'ملخص اختبار',
  version: 1,
  tags: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  archived: false,
  review_cadence: null,
  last_review_date: null,
  stats: {
    total_engagements: 5,
    total_positions: 3,
    total_mous: 2,
    active_commitments: 1,
    overdue_commitments: 0,
    total_documents: 10,
    recent_activity_count: 8,
    relationship_health_score: 85,
  },
  owners: [],
  contacts: [],
  recent_briefs: [],
};

vi.mock('../../src/hooks/useDossiers', () => ({
  useDossiers: (filters: DossierFilters) => ({
    data: mockDossiers,
    isLoading: false,
    error: null,
  }),
}));

vi.mock('../../src/hooks/useDossier', () => ({
  useDossier: (id: string, includes: string[]) => ({
    data: mockDossier,
    isLoading: false,
    error: null,
  }),
}));

vi.mock('../../src/hooks/useArchiveDossier', () => ({
  useArchiveDossier: (id: string) => ({
    mutateAsync: vi.fn(),
    isLoading: false,
  }),
}));

describe('Dossiers Hub Route', () => {
  let queryClient: QueryClient;
  let router: ReturnType<typeof createRouter>;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const history = createMemoryHistory({
      initialEntries: ['/dossiers'],
    });

    router = createRouter({
      routeTree,
      history,
      context: {
        queryClient,
      },
    });
  });

  it('should render hub route with dossier list', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <RouterProvider router={router} />
        </I18nextProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Dossier')).toBeInTheDocument();
    });
  });

  it('should update URL params when filters change', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <RouterProvider router={router} />
        </I18nextProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Dossier')).toBeInTheDocument();
    });

    // Apply filter
    const countryCheckbox = screen.getByRole('checkbox', { name: /country/i });
    await userEvent.click(countryCheckbox);

    // Check URL updated
    await waitFor(() => {
      const currentLocation = router.state.location;
      expect(currentLocation.search).toMatchObject({
        type: 'country',
      });
    });
  });

  it('should sync URL params to filter state on initial load', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/dossiers?type=country&status=active'],
    });

    const router = createRouter({
      routeTree,
      history,
      context: {
        queryClient,
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <RouterProvider router={router} />
        </I18nextProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Dossier')).toBeInTheDocument();
    });

    // Verify filters are applied from URL
    const countryCheckbox = screen.getByRole('checkbox', { name: /country/i });
    const activeCheckbox = screen.getByRole('checkbox', { name: /active/i });

    expect(countryCheckbox).toBeChecked();
    expect(activeCheckbox).toBeChecked();
  });

  it('should clear URL params when filters are reset', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/dossiers?type=country&status=active'],
    });

    const router = createRouter({
      routeTree,
      history,
      context: {
        queryClient,
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <RouterProvider router={router} />
        </I18nextProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Dossier')).toBeInTheDocument();
    });

    // Click reset button
    const resetButton = screen.getByRole('button', { name: /reset|clear/i });
    await userEvent.click(resetButton);

    // Check URL cleared
    await waitFor(() => {
      const currentLocation = router.state.location;
      expect(currentLocation.search).toEqual({});
    });
  });

  it('should persist search query in URL', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <RouterProvider router={router} />
        </I18nextProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Dossier')).toBeInTheDocument();
    });

    // Type in search
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'Saudi');

    // Check URL updated with search
    await waitFor(() => {
      const currentLocation = router.state.location;
      expect(currentLocation.search).toMatchObject({
        search: 'Saudi',
      });
    });
  });
});

describe('Dossier Detail Route', () => {
  let queryClient: QueryClient;
  let router: ReturnType<typeof createRouter>;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const history = createMemoryHistory({
      initialEntries: ['/dossiers/123'],
    });

    router = createRouter({
      routeTree,
      history,
      context: {
        queryClient,
      },
    });
  });

  it('should render detail route with dossier data', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <RouterProvider router={router} />
        </I18nextProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Dossier')).toBeInTheDocument();
      expect(screen.getByText(/Test summary/)).toBeInTheDocument();
    });
  });

  it('should display stats when included', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <RouterProvider router={router} />
        </I18nextProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/engagements/i)).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // total_engagements
    });
  });

  it('should default to timeline tab', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <RouterProvider router={router} />
        </I18nextProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      const timelineTab = screen.getByRole('tab', { name: /timeline/i });
      expect(timelineTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  it('should switch tabs correctly', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <RouterProvider router={router} />
        </I18nextProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /timeline/i })).toBeInTheDocument();
    });

    // Click positions tab
    const positionsTab = screen.getByRole('tab', { name: /positions/i });
    await userEvent.click(positionsTab);

    // Check tab is active
    await waitFor(() => {
      expect(positionsTab).toHaveAttribute('aria-selected', 'true');
    });

    // Check URL updated
    await waitFor(() => {
      const currentLocation = router.state.location;
      expect(currentLocation.search).toMatchObject({
        tab: 'positions',
      });
    });
  });

  it('should sync tab state from URL on initial load', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/dossiers/123?tab=positions'],
    });

    const router = createRouter({
      routeTree,
      history,
      context: {
        queryClient,
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <RouterProvider router={router} />
        </I18nextProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      const positionsTab = screen.getByRole('tab', { name: /positions/i });
      expect(positionsTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  it('should show 404 error when dossier not found', async () => {
    vi.mock('../../src/hooks/useDossier', () => ({
      useDossier: () => ({
        data: null,
        isLoading: false,
        error: {
          status: 404,
          message: 'Dossier not found',
        },
      }),
    }));

    const history = createMemoryHistory({
      initialEntries: ['/dossiers/nonexistent'],
    });

    const router = createRouter({
      routeTree,
      history,
      context: {
        queryClient,
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <RouterProvider router={router} />
        </I18nextProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/not found|404/i)).toBeInTheDocument();
    });
  });
});

describe('Navigation Between Routes', () => {
  let queryClient: QueryClient;
  let router: ReturnType<typeof createRouter>;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const history = createMemoryHistory({
      initialEntries: ['/dossiers?type=country'],
    });

    router = createRouter({
      routeTree,
      history,
      context: {
        queryClient,
      },
    });
  });

  it('should navigate from hub to detail and maintain filter state on back', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <RouterProvider router={router} />
        </I18nextProvider>
      </QueryClientProvider>
    );

    // Wait for hub to load
    await waitFor(() => {
      expect(screen.getByText('Test Dossier')).toBeInTheDocument();
    });

    // Verify filter is applied
    const countryCheckbox = screen.getByRole('checkbox', { name: /country/i });
    expect(countryCheckbox).toBeChecked();

    // Click dossier card to navigate to detail
    const dossierCard = screen.getByRole('button', { name: /test dossier/i });
    await userEvent.click(dossierCard);

    // Wait for detail page
    await waitFor(() => {
      expect(screen.getByText(/Test summary/)).toBeInTheDocument();
    });

    // Navigate back
    await router.history.back();

    // Verify we're back on hub with filters maintained
    await waitFor(() => {
      const currentLocation = router.state.location;
      expect(currentLocation.pathname).toBe('/dossiers');
      expect(currentLocation.search).toMatchObject({
        type: 'country',
      });
    });
  });

  it('should preserve detail tab when navigating away and back', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/dossiers/123?tab=positions'],
    });

    const router = createRouter({
      routeTree,
      history,
      context: {
        queryClient,
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <RouterProvider router={router} />
        </I18nextProvider>
      </QueryClientProvider>
    );

    // Wait for detail page with positions tab
    await waitFor(() => {
      const positionsTab = screen.getByRole('tab', { name: /positions/i });
      expect(positionsTab).toHaveAttribute('aria-selected', 'true');
    });

    // Navigate to hub
    router.navigate({ to: '/dossiers' });

    await waitFor(() => {
      expect(screen.getByText('Test Dossier')).toBeInTheDocument();
    });

    // Navigate back
    await router.history.back();

    // Verify positions tab is still active
    await waitFor(() => {
      const currentLocation = router.state.location;
      expect(currentLocation.search).toMatchObject({
        tab: 'positions',
      });
    });
  });

  it('should handle browser back/forward navigation correctly', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <RouterProvider router={router} />
        </I18nextProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Dossier')).toBeInTheDocument();
    });

    // Navigate to detail
    router.navigate({ to: '/dossiers/123' });

    await waitFor(() => {
      expect(screen.getByText(/Test summary/)).toBeInTheDocument();
    });

    // Browser back
    await router.history.back();

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/dossiers');
    });

    // Browser forward
    await router.history.forward();

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/dossiers/123');
    });
  });
});