/**
 * Working Group Wizard Route (Plan 29-04, Task 3)
 *
 * Composes SharedBasicInfoStep, WorkingGroupDetailsStep, and WorkingGroupReviewStep
 * into a 3-step wizard via useCreateDossierWizard + CreateWizardShell.
 */
import type { ReactElement } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'

import { useCreateDossierWizard } from '@/components/dossier/wizard/hooks/useCreateDossierWizard'
import { CreateWizardShell } from '@/components/dossier/wizard/CreateWizardShell'
import { SharedBasicInfoStep } from '@/components/dossier/wizard/SharedBasicInfoStep'
import { WorkingGroupDetailsStep } from '@/components/dossier/wizard/steps/WorkingGroupDetailsStep'
import { WorkingGroupReviewStep } from '@/components/dossier/wizard/review/WorkingGroupReviewStep'
import { workingGroupWizardConfig } from '@/components/dossier/wizard/config/working-group.config'
import type { WorkingGroupFormData } from '@/components/dossier/wizard/schemas/working-group.schema'

export const Route = createFileRoute('/_protected/dossiers/working_groups/create')({
  component: CreateWorkingGroupPage,
})

function CreateWorkingGroupPage(): ReactElement {
  const { t } = useTranslation('form-wizard')
  const wizard = useCreateDossierWizard<WorkingGroupFormData>(workingGroupWizardConfig)

  return (
    <div className="space-y-4">
      <Link
        to="/dossiers/working_groups"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground min-h-11"
      >
        <ChevronLeft className="h-4 w-4 me-1" />
        {t('workingGroup.back_to_list')}
      </Link>
      <h1 className="text-lg font-semibold">{t('workingGroup.page_title')}</h1>
      <CreateWizardShell wizard={wizard}>
        <SharedBasicInfoStep form={wizard.form} dossierType="working_group" />
        <WorkingGroupDetailsStep form={wizard.form} />
        <WorkingGroupReviewStep form={wizard.form} onEditStep={wizard.setCurrentStep} />
      </CreateWizardShell>
    </div>
  )
}
