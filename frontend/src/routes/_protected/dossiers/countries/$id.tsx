/**
 * Country Dossier Detail Route (Feature 028 - User Story 1 - T018)
 *
 * Type-specific detail page for country dossiers.
 * Validates dossier is actually a country type using type guard.
 * Mobile-first, RTL-compatible, WCAG AA compliant.
 *
 * Performance Optimization (T064): Uses React.lazy() for code splitting
 */

import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { useDossier } from '@/hooks/useDossier';
import { isCountryDossier } from '@/lib/dossier-type-guards';
import { CountryDossierSkeleton } from '@/components/Dossier/DossierLoadingSkeletons';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

// Lazy load the CountryDossierPage component (T064)
const CountryDossierPage = lazy(() =>
  import('@/pages/dossiers/CountryDossierPage').then((module) => ({
    default: module.CountryDossierPage,
  }))
);

// Search params for tab navigation
interface CountryDossierSearchParams {
  tab?: string;
}

export const Route = createFileRoute('/_protected/dossiers/countries/$id')({
  component: CountryDossierDetailRoute,
  validateSearch: (search: Record<string, unknown>): CountryDossierSearchParams => {
    return {
      tab: search.tab as string | undefined,
    };
  },
});

function CountryDossierDetailRoute() {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';
  const { id } = Route.useParams();
  const searchParams = Route.useSearch();

  // Fetch dossier with country-specific includes
  const { data: dossier, isLoading, error } = useDossier(id, ['stats', 'owners', 'contacts']);

  // Loading state - use country-specific skeleton
  if (isLoading) {
    return <CountryDossierSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div
          className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 sm:p-6"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-destructive mb-2">
                {t('detail.error')}
              </h3>
              <p className="text-sm sm:text-base text-destructive/90">
                {error.message || t('detail.errorGeneric')}
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <Button variant="outline" asChild>
                  <Link to="/dossiers">{t('action.backToHub')}</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/dossiers/countries">{t('action.backToList')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Type validation - ensure this is actually a country dossier
  if (!dossier || !isCountryDossier(dossier)) {
    return (
      <div
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div
          className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 sm:p-6"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-destructive mb-2">
                {t('detail.wrongType')}
              </h3>
              <p className="text-sm sm:text-base text-destructive/90">
                {t('detail.wrongTypeDescription', {
                  expectedType: t('type.country'),
                  actualType: dossier ? t(`type.${dossier.dossier_type}`) : 'unknown',
                })}
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <Button variant="outline" asChild>
                  <Link to="/dossiers">{t('action.backToHub')}</Link>
                </Button>
                {dossier && (
                  <Button variant="outline" asChild>
                    <Link to={`/dossiers/${dossier.dossier_type}s/${dossier.id}`}>
                      {t('action.viewCorrectType', { type: t(`type.${dossier.dossier_type}`) })}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render country-specific detail page with Suspense for lazy loading (T064)
  return (
    <Suspense fallback={<CountryDossierSkeleton />}>
      <CountryDossierPage dossier={dossier} initialTab={searchParams.tab} />
    </Suspense>
  );
}
