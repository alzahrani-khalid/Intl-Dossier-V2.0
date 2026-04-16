/**
 * Forum Wizard Route (Plan 29-03, Task 3)
 *
 * Composes SharedBasicInfoStep, ForumDetailsStep, and ForumReviewStep
 * into a 3-step wizard via useCreateDossierWizard + CreateWizardShell.
 */
import type { ReactElement } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'

import { useCreateDossierWizard } from '@/components/dossier/wizard/hooks/useCreateDossierWizard'
import { CreateWizardShell } from '@/components/dossier/wizard/CreateWizardShell'
import { SharedBasicInfoStep } from '@/components/dossier/wizard/SharedBasicInfoStep'
import { ForumDetailsStep } from '@/components/dossier/wizard/steps/ForumDetailsStep'
import { ForumReviewStep } from '@/components/dossier/wizard/review/ForumReviewStep'
import { forumWizardConfig } from '@/components/dossier/wizard/config/forum.config'
import type { ForumFormData } from '@/components/dossier/wizard/schemas/forum.schema'

export const Route = createFileRoute('/_protected/dossiers/forums/create')({
  component: CreateForumPage,
})

function CreateForumPage(): ReactElement {
  const { t } = useTranslation('form-wizard')
  const wizard = useCreateDossierWizard<ForumFormData>(forumWizardConfig)

  return (
    <div className="space-y-4">
      <Link
        to="/dossiers/forums"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground min-h-11"
      >
        <ChevronLeft className="h-4 w-4 me-1" />
        {t('forum.back_to_list')}
      </Link>
      <h1 className="text-lg font-semibold">{t('forum.page_title')}</h1>
      <CreateWizardShell wizard={wizard}>
        <SharedBasicInfoStep form={wizard.form} dossierType="forum" />
        <ForumDetailsStep form={wizard.form} />
        <ForumReviewStep form={wizard.form} onEditStep={wizard.setCurrentStep} />
      </CreateWizardShell>
    </div>
  )
}
