/**
 * Elected Official Wizard Route (Phase 30 D-03; Plan 32-02 swapped step 0 per PBI-01).
 *
 * Composes PersonBasicInfoStep, PersonDetailsStep, OfficeTermStep, and PersonReviewStep
 * into a 4-step wizard via useCreateDossierWizard + CreateWizardShell.
 *
 * Uses electedOfficialWizardConfig which pre-seeds person_subtype='elected_official'
 * in defaults and returns a 4-step array. Submits to the persons endpoint (DossierType='person'),
 * with is_current_term auto-derived at submit time by filterExtensionData.
 */
import type { ReactElement } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'

import { useCreateDossierWizard } from '@/components/dossier/wizard/hooks/useCreateDossierWizard'
import { CreateWizardShell } from '@/components/dossier/wizard/CreateWizardShell'
import { PersonBasicInfoStep } from '@/components/dossier/wizard/steps/PersonBasicInfoStep'
import { PersonDetailsStep } from '@/components/dossier/wizard/steps/PersonDetailsStep'
import { OfficeTermStep } from '@/components/dossier/wizard/steps/OfficeTermStep'
import { PersonReviewStep } from '@/components/dossier/wizard/review/PersonReviewStep'
import { electedOfficialWizardConfig } from '@/components/dossier/wizard/config/person.config'
import type { PersonFormData } from '@/components/dossier/wizard/schemas/person.schema'

export const Route = createFileRoute('/_protected/dossiers/elected-officials/create')({
  component: CreateElectedOfficialPage,
})

function CreateElectedOfficialPage(): ReactElement {
  const { t } = useTranslation('form-wizard')
  const wizard = useCreateDossierWizard<PersonFormData>(electedOfficialWizardConfig)

  return (
    <div className="space-y-4">
      <Link
        to="/dossiers/elected-officials"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground min-h-11"
      >
        <ChevronLeft className="h-4 w-4 me-1" />
        {t('elected_official.back_to_list', 'Back to Elected Officials')}
      </Link>
      <h1 className="text-lg font-semibold">{t('elected_official.page_title')}</h1>
      <CreateWizardShell wizard={wizard}>
        <PersonBasicInfoStep form={wizard.form} dossierType="person" />
        <PersonDetailsStep form={wizard.form} />
        <OfficeTermStep form={wizard.form} />
        <PersonReviewStep form={wizard.form} onEditStep={wizard.setCurrentStep} />
      </CreateWizardShell>
    </div>
  )
}
