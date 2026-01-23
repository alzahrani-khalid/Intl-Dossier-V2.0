/**
 * Working Group Dossier Detail Route (Feature 028 - User Story 6)
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
 * <Route path="/dossiers/working-groups/:id" />
 */

import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle } from 'lucide-react';
import { useTypedDossier } from '@/hooks/useDossier';
import { WorkingGroupDossierPage } from '@/pages/dossiers/WorkingGroupDossierPage';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/dossiers/working_groups/$id')({
  component: WorkingGroupDossierDetailRoute,
});

function WorkingGroupDossierDetailRoute() {
  const { id } = Route.useParams();
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  // Fetch working group dossier with type validation
  const { data: dossier, isLoading, error } = useTypedDossier(id, 'working_group');

  // Loading State
  if (isLoading) {
    return (
      <div
        className="flex min-h-[50vh] items-center justify-center"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary sm:size-10" />
          <p className="text-sm text-muted-foreground sm:text-base">
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
        className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="mt-1 size-5 shrink-0 text-destructive sm:size-6" />
              <div className="flex-1">
                <h2 className="mb-2 text-lg font-semibold text-destructive sm:text-xl">
                  {t('detail.error')}
                </h2>
                <p className="mb-4 text-sm text-destructive/90 sm:text-base">
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
  if (dossier.type !== 'working_group') {
    return (
      <div
        className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="mx-auto max-w-2xl">
          <div className="border-warning/20 bg-warning/10 rounded-lg border p-6 sm:p-8">
            <h2 className="mb-2 text-lg font-semibold sm:text-xl">
              {t('detail.wrongType')}
            </h2>
            <p className="mb-4 text-sm text-muted-foreground sm:text-base">
              {t('detail.wrongTypeDescription', {
                actualType: t(`type.${dossier.type}`),
                expectedType: t('type.working_group'),
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

  // Success - Render Working Group Dossier Page
  return <WorkingGroupDossierPage dossier={dossier} />;
}
