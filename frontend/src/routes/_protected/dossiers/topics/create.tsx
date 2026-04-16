/**
 * Topic Wizard Route (Plan 28-03, Task 2)
 *
 * Composes TopicBasicInfoStep (with inline theme_category) and TopicReviewStep
 * into a 2-step wizard via useCreateDossierWizard + CreateWizardShell.
 */
import type { ReactElement } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'

import { useCreateDossierWizard } from '@/components/dossier/wizard/hooks/useCreateDossierWizard'
import { CreateWizardShell } from '@/components/dossier/wizard/CreateWizardShell'
import { TopicBasicInfoStep } from '@/components/dossier/wizard/steps/TopicBasicInfoStep'
import { TopicReviewStep } from '@/components/dossier/wizard/review/TopicReviewStep'
import { topicWizardConfig } from '@/components/dossier/wizard/config/topic.config'
import type { TopicFormData } from '@/components/dossier/wizard/schemas/topic.schema'

export const Route = createFileRoute('/_protected/dossiers/topics/create')({
  component: CreateTopicPage,
})

function CreateTopicPage(): ReactElement {
  const { t } = useTranslation('form-wizard')
  const wizard = useCreateDossierWizard<TopicFormData>(topicWizardConfig)

  return (
    <div className="space-y-4">
      <Link
        to="/dossiers/topics"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground min-h-11"
      >
        <ChevronLeft className="h-4 w-4 me-1" />
        {t('topic.back_to_list', 'Back to Topics')}
      </Link>
      <h1 className="text-lg font-semibold">{t('topic.page_title')}</h1>
      <CreateWizardShell wizard={wizard}>
        <TopicBasicInfoStep form={wizard.form} />
        <TopicReviewStep form={wizard.form} onEditStep={wizard.setCurrentStep} />
      </CreateWizardShell>
    </div>
  )
}
