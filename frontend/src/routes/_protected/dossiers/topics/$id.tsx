/**
 * Topic Detail Route (Feature 028 - Type-Specific Detail Pages)
 *
 * Route: /dossiers/topics/$id
 * Validates topic type and renders detail page.
 * Error handling for loading, errors, not found, and wrong types.
 */

import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useDossier } from '@/hooks/useDossier';
import { isTopicDossier } from '@/lib/dossier-type-guards';
import { TopicDossierPage } from '@/pages/dossiers/TopicDossierPage';

export const Route = createFileRoute('/_protected/dossiers/topics/$id')({
  component: TopicDossierDetailRoute,
});

function TopicDossierDetailRoute() {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';
  const { id } = Route.useParams();

  const { data: dossier, isLoading, error } = useDossier(id, ['stats', 'owners', 'contacts']);

  // Loading state
  if (isLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[50vh] space-y-4"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm sm:text-base text-muted-foreground">
          {t('detail.loading')}
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('detail.error')}</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : t('detail.errorGeneric')}
          </AlertDescription>
        </Alert>
        <div className="mt-4 sm:mt-6">
          <Link to="/dossiers">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
              {t('action.backToHub')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Not found state
  if (!dossier) {
    return (
      <div
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('detail.notFound')}</AlertTitle>
          <AlertDescription>
            {t('detail.errorGeneric')}
          </AlertDescription>
        </Alert>
        <div className="mt-4 sm:mt-6">
          <Link to="/dossiers">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
              {t('action.backToHub')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Wrong type validation
  if (!isTopicDossier(dossier)) {
    const actualType = t(`type.${dossier.dossier_type}`);
    const expectedType = t('type.topic');

    return (
      <div
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('detail.wrongType')}</AlertTitle>
          <AlertDescription>
            {t('detail.wrongTypeDescription', { actualType, expectedType })}
          </AlertDescription>
        </Alert>
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3">
          <Link to={`/dossiers/${dossier.dossier_type}s/$id`} params={{ id: dossier.id }}>
            <Button className="gap-2 w-full sm:w-auto">
              {t('action.viewCorrectType', { type: actualType })}
            </Button>
          </Link>
          <Link to="/dossiers/topics">
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
              {t('action.backToList')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <TopicDossierPage dossier={dossier} />;
}
