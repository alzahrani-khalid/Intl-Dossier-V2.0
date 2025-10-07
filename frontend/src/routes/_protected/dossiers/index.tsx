/**
 * Dossiers Hub Page (T038)
 *
 * Displays filterable list of dossiers with infinite scroll
 * Components: FilterPanel, DossierCard list
 * URL state: Syncs filters to query params
 * Accessibility: Skip to content, keyboard navigation
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDossiers } from '../../../hooks/useDossiers';
import { DossierCard } from '../../../components/DossierCard';
import { FilterPanel } from '../../../components/FilterPanel';
import { CreateDossierDialog } from '../../../components/CreateDossierDialog';
import type { DossierFilters } from '../../../types/dossier';

// Search params validation
interface DossiersSearchParams {
  type?: string;
  status?: string;
  sensitivity?: string;
  owner_id?: string;
  tags?: string[];
  search?: string;
  cursor?: string;
  limit?: number;
}

export const Route = createFileRoute('/_protected/dossiers/')({
  component: DossiersHubPage,
  validateSearch: (search: Record<string, unknown>): DossiersSearchParams => {
    return {
      type: search.type as string | undefined,
      status: search.status as string | undefined,
      sensitivity: search.sensitivity as string | undefined,
      owner_id: search.owner_id as string | undefined,
      tags: search.tags as string[] | undefined,
      search: search.search as string | undefined,
      cursor: search.cursor as string | undefined,
      limit: search.limit as number | undefined,
    };
  },
});

function DossiersHubPage() {
  const { t } = useTranslation('dossiers');
  const navigate = useNavigate();
  const searchParams = Route.useSearch();

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Initialize filters from URL params only once
  const initialFilters: DossierFilters = {
    type: searchParams.type as any,
    status: searchParams.status as any,
    sensitivity: searchParams.sensitivity as any,
    owner_id: searchParams.owner_id,
    tags: searchParams.tags,
    search: searchParams.search,
    limit: searchParams.limit || 50,
  };

  const [filters, setFilters] = useState<DossierFilters>(initialFilters);

  // Fetch dossiers with current filters
  const { data, isLoading, error } = useDossiers(filters);

  // Update URL when filters change (but skip if filters match URL params)
  useEffect(() => {
    const params: Record<string, string | string[] | number> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Skip limit if it's the default value (50)
        if (key === 'limit' && value === 50) {
          return;
        }
        if (Array.isArray(value)) {
          if (value.length > 0) params[key] = value;
        } else {
          params[key] = value;
        }
      }
    });

    // Only navigate if params actually changed to prevent infinite loop
    const currentParams = new URLSearchParams(window.location.search);
    const newParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => newParams.append(key, String(v)));
      } else {
        newParams.set(key, String(value));
      }
    });

    if (currentParams.toString() !== newParams.toString()) {
      navigate({
        search: params as any,
        replace: true,
      });
    }
  }, [filters, navigate]);

  const handleFilterChange = (newFilters: DossierFilters) => {
    setFilters(newFilters);
  };

  // DossierCard handles navigation internally, no need for click handler

  return (
    <div className="dossiers-hub min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-blue-600"
      >
        {t('common:skip_to_content')}
      </a>

      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('hub.title')}
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {t('hub.description')}
              </p>
            </div>
            <button
              onClick={() => setCreateDialogOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t('hub.create_button')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filter Panel (Sidebar) */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-4">
              <FilterPanel filters={filters} onFilterChange={handleFilterChange} />
            </div>
          </aside>

          {/* Dossier List */}
          <div className="flex-1">
            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
                    aria-label={t('common:loading')}
                  />
                ))}
              </div>
            )}

            {/* Error State */}
            {error && (
              <div
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
                role="alert"
              >
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  {t('hub.error_title')}
                </h3>
                <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {error instanceof Error ? error.message : t('hub.error_generic')}
                </p>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && data?.data.length === 0 && (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  {t('hub.empty_title')}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t('hub.empty_description')}
                </p>
              </div>
            )}

            {/* Dossier Cards Grid */}
            {!isLoading && !error && data && data.data.length > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data.data.map((dossier) => (
                    <DossierCard key={dossier.id} dossier={dossier} />
                  ))}
                </div>

                {/* Pagination Info */}
                {data.pagination.has_more && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => {
                        setFilters((prev) => ({
                          ...prev,
                          cursor: data.pagination.next_cursor || undefined,
                        }));
                      }}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {t('hub.load_more')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Dossier Dialog */}
      <CreateDossierDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}