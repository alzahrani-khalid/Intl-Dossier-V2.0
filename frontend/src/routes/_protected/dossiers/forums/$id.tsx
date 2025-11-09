/**
 * Forum Dossier Detail Route (Feature 028 - User Story 6)
 *
 * Component Library Decision:
 * - Checked: Aceternity UI > Aceternity Pro > Kibo-UI
 * - Selected: CollapsibleSection (already implemented), DossierDetailLayout (shared wrapper)
 * - Reason: Reusing shared components for consistency, type-specific layout via gridClassName
 *
 * Responsive Strategy:
 * - Base: Single column (grid-cols-1)
 * - md: 2-column grid (md:grid-cols-2)
 * - lg: 3-column bento grid (lg:grid-cols-3) for collaboration visualization
 *
 * RTL Support:
 * - Logical properties: Container uses ps-*, pe-*, text-start
 * - Icon flipping: None needed (no directional icons)
 * - Text alignment: text-start for all text content
 *
 * Accessibility:
 * - ARIA: Page title as h1, proper semantic structure
 * - Keyboard: Collapsible sections support keyboard navigation
 * - Focus: Focus management in CollapsibleSection component
 *
 * Performance:
 * - Lazy loading: Component will be code-split via React.lazy in polish phase
 * - Memoization: Type guard validation memoized via TanStack Query
 *
 * @example
 * <Route path="/dossiers/forums/:id" />
 */

import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle } from 'lucide-react';
import { useTypedDossier } from '@/hooks/useDossier';
import { ForumDossierPage } from '@/pages/dossiers/ForumDossierPage';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/dossiers/forums/$id')({
  component: ForumDossierDetailRoute,
});

function ForumDossierDetailRoute() {
  const { id } = Route.useParams();
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  // Fetch forum dossier with type validation
  const { data: dossier, isLoading, error } = useTypedDossier(id, 'forum');

  // Loading State
  if (isLoading) {
    return (
      <div
        className="flex min-h-[50vh] items-center justify-center"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
          <p className="text-sm sm:text-base text-muted-foreground">
            {t('detail.loading')}
          </p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !dossier) {
    return (
      <div
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="max-w-2xl mx-auto">
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-semibold text-destructive mb-2">
                  {t('detail.error')}
                </h2>
                <p className="text-sm sm:text-base text-destructive/90 mb-4">
                  {error?.message || t('detail.errorGeneric')}
                </p>
                <Button asChild variant="outline">
                  <Link to="/dossiers">
                    {t('action.backToHub')}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Type Mismatch Error
  if (dossier.type !== 'forum') {
    return (
      <div
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="max-w-2xl mx-auto">
          <div className="rounded-lg border border-warning/20 bg-warning/10 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-2">
              {t('detail.wrongType')}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              {t('detail.wrongTypeDescription', {
                actualType: t(`type.${dossier.type}`),
                expectedType: t('type.forum'),
              })}
            </p>
            <div className="flex gap-3">
              <Button asChild>
                <Link to={`/dossiers/${dossier.type}s/${id}`}>
                  {t('action.viewCorrectType', { type: t(`type.${dossier.type}`) })}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/dossiers">
                  {t('action.backToHub')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success - Render Forum Dossier Page
  return <ForumDossierPage dossier={dossier} />;
}
