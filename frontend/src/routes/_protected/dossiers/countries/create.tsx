/**
 * Country Wizard Route (Plan 27-02, Task 2)
 *
 * Composes SharedBasicInfoStep, CountryDetailsStep, and CountryReviewStep
 * into a 3-step wizard via useCreateDossierWizard + CreateWizardShell.
 */
import type { ReactElement } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'

import { useCreateDossierWizard } from '@/components/dossier/wizard/hooks/useCreateDossierWizard'
import { CreateWizardShell } from '@/components/dossier/wizard/CreateWizardShell'
import { SharedBasicInfoStep } from '@/components/dossier/wizard/SharedBasicInfoStep'
import { CountryDetailsStep } from '@/components/dossier/wizard/steps/CountryDetailsStep'
import { CountryReviewStep } from '@/components/dossier/wizard/review/CountryReviewStep'
import { countryWizardConfig } from '@/components/dossier/wizard/config/country.config'
import type { CountryFormData } from '@/components/dossier/wizard/schemas/country.schema'

export const Route = createFileRoute('/_protected/dossiers/countries/create')({
  component: CreateCountryPage,
})

function CreateCountryPage(): ReactElement {
  const { t } = useTranslation('form-wizard')
  const wizard = useCreateDossierWizard<CountryFormData>(countryWizardConfig)

  return (
    <div className="space-y-4">
      <Link
        to="/dossiers/countries"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground min-h-11"
      >
        <ChevronLeft className="h-4 w-4 me-1" />
        {t('country.back_to_list', 'Back to Countries')}
      </Link>
      <h1 className="text-lg font-semibold">{t('country.page_title')}</h1>
      <CreateWizardShell wizard={wizard}>
        <SharedBasicInfoStep form={wizard.form} dossierType="country" />
        <CountryDetailsStep form={wizard.form} />
        <CountryReviewStep form={wizard.form} onEditStep={wizard.setCurrentStep} />
      </CreateWizardShell>
    </div>
  )
}
