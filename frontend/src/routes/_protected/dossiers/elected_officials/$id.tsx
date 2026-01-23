/**
 * Elected Official Detail Route
 *
 * Route: /dossiers/elected_officials/$id
 * Validates elected_official type and renders detail page.
 * Error handling for loading, errors, not found, and wrong types.
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useDossier } from '@/hooks/useDossier'
import { isElectedOfficialDossier } from '@/lib/dossier-type-guards'
import { ElectedOfficialDossierPage } from '@/pages/dossiers/ElectedOfficialDossierPage'

export const Route = createFileRoute('/_protected/dossiers/elected_officials/$id')({
  component: ElectedOfficialDossierDetailRoute,
})

function ElectedOfficialDossierDetailRoute() {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'
  const { id } = Route.useParams()

  const { data: dossier, isLoading, error } = useDossier(id, ['stats', 'owners', 'contacts'])

  // Loading state
  if (isLoading) {
    return (
      <div
        className="flex min-h-[50vh] flex-col items-center justify-center space-y-4"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="size-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground sm:text-base">{t('detail.loading')}</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div
        className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>{t('detail.error')}</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : t('detail.errorGeneric')}
          </AlertDescription>
        </Alert>
        <div className="mt-4 sm:mt-6">
          <Link to="/dossiers">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className={`size-4 ${isRTL ? 'rotate-180' : ''}`} />
              {t('action.backToHub')}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Not found state
  if (!dossier) {
    return (
      <div
        className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <Alert>
          <AlertCircle className="size-4" />
          <AlertTitle>{t('detail.notFound')}</AlertTitle>
          <AlertDescription>{t('detail.errorGeneric')}</AlertDescription>
        </Alert>
        <div className="mt-4 sm:mt-6">
          <Link to="/dossiers">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className={`size-4 ${isRTL ? 'rotate-180' : ''}`} />
              {t('action.backToHub')}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Wrong type validation
  if (!isElectedOfficialDossier(dossier)) {
    const actualType = t(`type.${dossier.type}`)
    const expectedType = t('type.elected_official')

    return (
      <div
        className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <Alert>
          <AlertCircle className="size-4" />
          <AlertTitle>{t('detail.wrongType')}</AlertTitle>
          <AlertDescription>
            {t('detail.wrongTypeDescription', { actualType, expectedType })}
          </AlertDescription>
        </Alert>
        <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:flex-row">
          <Link to={`/dossiers/${dossier.type}s/$id`} params={{ id: dossier.id }}>
            <Button className="w-full gap-2 sm:w-auto">
              {t('action.viewCorrectType', { type: actualType })}
            </Button>
          </Link>
          <Link to="/dossiers/elected_officials">
            <Button variant="outline" className="w-full gap-2 sm:w-auto">
              <ArrowLeft className={`size-4 ${isRTL ? 'rotate-180' : ''}`} />
              {t('action.backToList')}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return <ElectedOfficialDossierPage dossier={dossier} />
}
