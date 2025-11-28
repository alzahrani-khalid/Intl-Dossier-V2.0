/**
 * Commitments Page v1.1
 * Feature: 031-commitments-management
 * Tasks: T030, T039, T040
 *
 * Main commitments page with:
 * - URL-synced filtering (T039, T040)
 * - Dossier context support
 * - Personal dashboard view
 * - Mobile-first, RTL-compatible
 */

import { useCallback } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { CommitmentsList } from '@/components/commitments/CommitmentsList';
import { CommitmentDetailDrawer } from '@/components/commitments/CommitmentDetailDrawer';
import { PersonalCommitmentsDashboard } from '@/components/commitments/PersonalCommitmentsDashboard';
import { useDossier } from '@/hooks/useDossier';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import type { CommitmentStatus, CommitmentPriority, CommitmentFilters } from '@/types/commitment.types';

// Type-specific route mapping for dossier navigation
const DOSSIER_TYPE_TO_ROUTE: Record<string, string> = {
  country: 'countries',
  organization: 'organizations',
  person: 'persons',
  engagement: 'engagements',
  forum: 'forums',
  working_group: 'working_groups',
  topic: 'topics',
};

// T039: Search params schema for URL filter synchronization
interface CommitmentsSearchParams {
  dossierId?: string;
  status?: string; // Comma-separated status values
  priority?: string; // Comma-separated priority values (T039)
  ownerId?: string;
  overdue?: boolean;
  dueDateFrom?: string;
  dueDateTo?: string;
  search?: string;
  id?: string; // For deep-linking to specific commitment
  view?: 'list' | 'dashboard';
}

export const Route = createFileRoute('/_protected/commitments')({
  component: CommitmentsPage,
  validateSearch: (search: Record<string, unknown>): CommitmentsSearchParams => {
    return {
      dossierId: search.dossierId as string | undefined,
      status: search.status as string | undefined,
      priority: search.priority as string | undefined,
      ownerId: search.ownerId as string | undefined,
      overdue: search.overdue === 'true' || search.overdue === true,
      dueDateFrom: search.dueDateFrom as string | undefined,
      dueDateTo: search.dueDateTo as string | undefined,
      search: search.search as string | undefined,
      id: search.id as string | undefined,
      view: (search.view as 'list' | 'dashboard') || 'dashboard',
    };
  },
});

function CommitmentsPage() {
  const { t, i18n } = useTranslation('commitments');
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();
  const isRTL = i18n.language === 'ar';

  // Fetch dossier details when dossierId is present (for type-specific navigation)
  const { data: dossier } = useDossier(
    searchParams.dossierId ?? '',
    undefined,
    { enabled: !!searchParams.dossierId }
  );

  // Parse status from comma-separated string to typed array
  const statusArray: CommitmentStatus[] | undefined = searchParams.status
    ? (searchParams.status.split(',').filter(Boolean) as CommitmentStatus[])
    : undefined;

  // Parse priority from comma-separated string to typed array (T039)
  const priorityArray: CommitmentPriority[] | undefined = searchParams.priority
    ? (searchParams.priority.split(',').filter(Boolean) as CommitmentPriority[])
    : undefined;

  // T040: Handler to sync filter changes with URL query parameters
  const handleFiltersChange = useCallback(
    (filters: CommitmentFilters) => {
      navigate({
        search: (prev) => ({
          ...prev,
          // Convert arrays to comma-separated strings for URL
          status: filters.status?.length ? filters.status.join(',') : undefined,
          priority: filters.priority?.length ? filters.priority.join(',') : undefined,
          ownerId: filters.ownerId || undefined,
          overdue: filters.overdue || undefined,
          dueDateFrom: filters.dueDateFrom || undefined,
          dueDateTo: filters.dueDateTo || undefined,
          // Preserve dossierId from current params
          dossierId: filters.dossierId || prev.dossierId,
        }),
        replace: true, // Replace history entry instead of pushing new
      });
    },
    [navigate]
  );

  // T061: Handler to close detail drawer (remove id from URL)
  const handleDetailDrawerClose = useCallback(
    (open: boolean) => {
      if (!open) {
        navigate({
          search: (prev) => ({
            ...prev,
            id: undefined,
          }),
          replace: true,
        });
      }
    },
    [navigate]
  );

  // Determine view mode: dashboard (default) or list (when dossier context)
  const showDashboard = searchParams.view === 'dashboard' && !searchParams.dossierId;

  // If showing dashboard, render personal commitments view with detail drawer
  if (showDashboard) {
    return (
      <>
        <PersonalCommitmentsDashboard />
        {/* Detail Drawer - opens when id is in URL */}
        <CommitmentDetailDrawer
          commitmentId={searchParams.id ?? null}
          open={!!searchParams.id}
          onOpenChange={handleDetailDrawerClose}
        />
      </>
    );
  }

  // List view with optional dossier context
  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              {searchParams.dossierId ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-11"
                  onClick={() => {
                    // Navigate to type-specific dossier route
                    const routeSegment = dossier?.type
                      ? DOSSIER_TYPE_TO_ROUTE[dossier.type] || 'countries'
                      : 'countries';
                    navigate({
                      to: `/dossiers/${routeSegment}/$id`,
                      params: { id: searchParams.dossierId! },
                    });
                  }}
                >
                  <ArrowLeft
                    className={`size-4 ${isRTL ? 'ms-2 rotate-180' : 'me-2'}`}
                  />
                  {t('detail.dossier')}
                </Button>
              ) : (
                <Link to="/commitments" search={{ view: 'dashboard' }}>
                  <Button variant="ghost" size="sm" className="min-h-11">
                    <Home className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                    {t('pageTitle')}
                  </Button>
                </Link>
              )}
            </div>

            {/* Title */}
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-start">
                {t('title')}
              </h1>
              {searchParams.dossierId && (
                <p className="mt-1 text-sm text-muted-foreground text-start">
                  {t('subtitle')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <CommitmentsList
          dossierId={searchParams.dossierId}
          status={statusArray}
          priority={priorityArray}
          ownerId={searchParams.ownerId}
          overdue={searchParams.overdue}
          dueDateFrom={searchParams.dueDateFrom}
          dueDateTo={searchParams.dueDateTo}
          showFilters={true}
          showCreateButton={!!searchParams.dossierId}
          onFiltersChange={handleFiltersChange}
        />
      </main>

      {/* T061: Detail Drawer - opens when id is in URL */}
      <CommitmentDetailDrawer
        commitmentId={searchParams.id ?? null}
        open={!!searchParams.id}
        onOpenChange={handleDetailDrawerClose}
      />
    </div>
  );
}
