/**
 * Dossier Edit Route (A-1)
 *
 * Full-page edit surface mounted at /dossiers/edit/$type/$id. It loads the
 * dossier (+ extension) and hands it to <DossierEditWizard/>, which drives the
 * existing create wizard in edit mode (reusing each type's steps + Zod
 * validation). `$type` is the route segment (countries, persons,
 * elected-officials, …) used only for the back-link; the wizard config is
 * resolved from the loaded dossier's real type + person_subtype.
 */

import type { ReactElement } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'

import { useDossier } from '@/hooks/useDossier'
import { DossierEditWizard } from '@/components/dossier/wizard/edit/DossierEditWizard'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/_protected/dossiers/edit/$type/$id')({
  component: EditDossierPage,
})

function EditDossierPage(): ReactElement {
  const { type, id } = Route.useParams()
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  const { data: dossier, isLoading, isError } = useDossier(id)

  const backPath = `/dossiers/${type}/${id}`
  const displayName = isRTL
    ? (dossier?.name_ar ?? dossier?.name_en ?? '')
    : (dossier?.name_en ?? '')

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <Link
        to={backPath}
        className="inline-flex min-h-11 items-center text-sm text-[var(--ink-mute)] transition-colors hover:text-[var(--ink)]"
      >
        <ChevronLeft className={`me-1 h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
        {t('edit.back', { defaultValue: 'Back to dossier' })}
      </Link>

      <h1 className="text-lg font-semibold text-start">
        {isLoading ? (
          <Skeleton className="inline-block h-6 w-64" />
        ) : (
          t('edit.title', { name: displayName, defaultValue: 'Edit dossier' })
        )}
      </h1>

      {isError || (!isLoading && dossier == null) ? (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {t('edit.loadError', { defaultValue: 'Could not load this dossier for editing.' })}
        </p>
      ) : isLoading || dossier == null ? (
        <div className="mx-auto w-full max-w-2xl space-y-3 px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
        </div>
      ) : (
        <DossierEditWizard dossier={dossier} />
      )}
    </div>
  )
}
