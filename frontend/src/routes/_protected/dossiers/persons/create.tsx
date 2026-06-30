/**
 * Person Wizard Route (Plan 28-04, Task 2; Plan 32-02 swapped step 0 per PBI-01).
 *
 * Composes PersonBasicInfoStep, PersonDetailsStep, and PersonReviewStep
 * into a 3-step wizard via useCreateDossierWizard + CreateWizardShell.
 */
import { useEffect, type ReactElement } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'

import { useCreateDossierWizard } from '@/components/dossier/wizard/hooks/useCreateDossierWizard'
import { CreateWizardShell } from '@/components/dossier/wizard/CreateWizardShell'
import { PersonBasicInfoStep } from '@/components/dossier/wizard/steps/PersonBasicInfoStep'
import { PersonDetailsStep } from '@/components/dossier/wizard/steps/PersonDetailsStep'
import { PersonReviewStep } from '@/components/dossier/wizard/review/PersonReviewStep'
import { personWizardConfig } from '@/components/dossier/wizard/config/person.config'
import type { PersonFormData } from '@/components/dossier/wizard/schemas/person.schema'

export const Route = createFileRoute('/_protected/dossiers/persons/create')({
  component: CreatePersonPage,
  // Callers (e.g. an organization dossier's Key Representatives / Key Contacts
  // card) may arrive with ?organization_id=<id> to pre-link the new person.
  validateSearch: (search: Record<string, unknown>): { organization_id?: string } => ({
    organization_id:
      typeof search.organization_id === 'string' ? search.organization_id : undefined,
  }),
})

function CreatePersonPage(): ReactElement {
  const { t } = useTranslation('form-wizard')
  const { organization_id } = Route.useSearch()
  const wizard = useCreateDossierWizard<PersonFormData>(personWizardConfig)

  // Pre-fill the organization when launched from an org dossier.
  useEffect(() => {
    if (organization_id !== undefined && organization_id !== '') {
      wizard.form.setValue('organization_id', organization_id)
    }
  }, [organization_id, wizard.form])

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
        <PersonBasicInfoStep form={wizard.form} dossierType="person" />
        <PersonDetailsStep form={wizard.form} />
        <PersonReviewStep form={wizard.form} onEditStep={wizard.setCurrentStep} />
      </CreateWizardShell>
    </div>
  )
}
