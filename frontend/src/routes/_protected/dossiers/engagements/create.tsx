/**
 * Engagement Wizard Route (Plan 29-05, Task 3)
 *
 * Composes SharedBasicInfoStep, EngagementDetailsStep, EngagementParticipantsStep,
 * and EngagementReviewStep into a 4-step wizard via useCreateDossierWizard +
 * CreateWizardShell.
 */
import type { ReactElement } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'

import { useCreateDossierWizard } from '@/components/dossier/wizard/hooks/useCreateDossierWizard'
import { CreateWizardShell } from '@/components/dossier/wizard/CreateWizardShell'
import { SharedBasicInfoStep } from '@/components/dossier/wizard/SharedBasicInfoStep'
import { EngagementDetailsStep } from '@/components/dossier/wizard/steps/EngagementDetailsStep'
import { EngagementParticipantsStep } from '@/components/dossier/wizard/steps/EngagementParticipantsStep'
import { EngagementReviewStep } from '@/components/dossier/wizard/review/EngagementReviewStep'
import { engagementWizardConfig } from '@/components/dossier/wizard/config/engagement.config'
import type { EngagementFormData } from '@/components/dossier/wizard/schemas/engagement.schema'

export const Route = createFileRoute('/_protected/dossiers/engagements/create')({
  component: CreateEngagementPage,
})

function CreateEngagementPage(): ReactElement {
  const { t } = useTranslation('form-wizard')
  const wizard = useCreateDossierWizard<EngagementFormData>(engagementWizardConfig)

  return (
    <div className="space-y-4">
      <Link
        to="/dossiers/engagements"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground min-h-11"
      >
        <ChevronLeft className="h-4 w-4 me-1" />
        {t('engagement.back_to_list')}
      </Link>
      <h1 className="text-lg font-semibold">{t('engagement.page_title')}</h1>
      <CreateWizardShell wizard={wizard}>
        <SharedBasicInfoStep form={wizard.form} dossierType="engagement" />
        <EngagementDetailsStep form={wizard.form} />
        <EngagementParticipantsStep form={wizard.form} />
        <EngagementReviewStep form={wizard.form} onEditStep={wizard.setCurrentStep} />
      </CreateWizardShell>
    </div>
  )
}
