/**
 * Person Wizard Route (Plan 28-04, Task 2)
 *
 * Composes SharedBasicInfoStep, PersonDetailsStep, and PersonReviewStep
 * into a 3-step wizard via useCreateDossierWizard + CreateWizardShell.
 */
import type { ReactElement } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'

import { useCreateDossierWizard } from '@/components/dossier/wizard/hooks/useCreateDossierWizard'
import { CreateWizardShell } from '@/components/dossier/wizard/CreateWizardShell'
import { SharedBasicInfoStep } from '@/components/dossier/wizard/SharedBasicInfoStep'
import { PersonDetailsStep } from '@/components/dossier/wizard/steps/PersonDetailsStep'
import { PersonReviewStep } from '@/components/dossier/wizard/review/PersonReviewStep'
import { personWizardConfig } from '@/components/dossier/wizard/config/person.config'
import type { PersonFormData } from '@/components/dossier/wizard/schemas/person.schema'

export const Route = createFileRoute('/_protected/dossiers/persons/create')({
  component: CreatePersonPage,
})

function CreatePersonPage(): ReactElement {
  const { t } = useTranslation('form-wizard')
  const wizard = useCreateDossierWizard<PersonFormData>(personWizardConfig)

  return (
    <div className="space-y-4">
      <Link
        to="/dossiers/persons"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground min-h-11"
      >
        <ChevronLeft className="h-4 w-4 me-1" />
        {t('person.back_to_list', 'Back to Persons')}
      </Link>
      <h1 className="text-lg font-semibold">{t('person.page_title')}</h1>
      <CreateWizardShell wizard={wizard}>
        <SharedBasicInfoStep form={wizard.form} dossierType="person" />
        <PersonDetailsStep form={wizard.form} />
        <PersonReviewStep form={wizard.form} onEditStep={wizard.setCurrentStep} />
      </CreateWizardShell>
    </div>
  )
}
