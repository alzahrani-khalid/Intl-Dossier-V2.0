/**
 * Commitments List Page (T030)
 * Feature: 030-health-commitment
 *
 * Displays commitments list with filtering capabilities
 * Accessed from DossierStats "Active Commitments" button
 * Supports filtering by dossierId, status, and ownerId via search params
 */

import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { CommitmentsList } from '../../components/commitments/CommitmentsList';
import { Button } from '../../components/ui/button';
import { ArrowLeft } from 'lucide-react';

// Search params for filtering commitments
interface CommitmentsSearchParams {
  dossierId?: string;
  status?: string; // Comma-separated status values
  ownerId?: string;
}

export const Route = createFileRoute('/_protected/commitments')({
  component: CommitmentsPage,
  validateSearch: (search: Record<string, unknown>): CommitmentsSearchParams => {
    return {
      dossierId: search.dossierId as string | undefined,
      status: search.status as string | undefined,
      ownerId: search.ownerId as string | undefined,
    };
  },
});

function CommitmentsPage() {
  const { t, i18n } = useTranslation('commitments');
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();
  const isRTL = i18n.language === 'ar';

  // Parse status from comma-separated string to array
  const statusArray = searchParams.status
    ? searchParams.status.split(',').filter(Boolean)
    : undefined;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Back button - show only if dossierId filter is present */}
            {searchParams.dossierId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: `/dossiers/${searchParams.dossierId}` })}
                className="self-start sm:self-center"
              >
                <ArrowLeft className={`size-4 ${isRTL ? 'ms-2 rotate-180' : 'me-2'}`} />
                {t('backToDossier', 'Back to Dossier')}
              </Button>
            )}
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-start">
                {t('page.title', 'Commitments')}
              </h1>
              {searchParams.dossierId && (
                <p className="mt-1 text-sm text-muted-foreground text-start">
                  {t('page.subtitle.filtered', 'Filtered commitments for this dossier')}
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
          ownerId={searchParams.ownerId}
          showFilters={true}
        />
      </main>
    </div>
  );
}
