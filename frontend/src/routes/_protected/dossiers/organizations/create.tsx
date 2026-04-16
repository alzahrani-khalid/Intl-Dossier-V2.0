/**
 * Organization Wizard Route (Plan 28-02, Task 2)
 *
 * Composes SharedBasicInfoStep, OrgDetailsStep, and OrganizationReviewStep
 * into a 3-step wizard via useCreateDossierWizard + CreateWizardShell.
 */
import type { ReactElement } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'

import { useCreateDossierWizard } from '@/components/dossier/wizard/hooks/useCreateDossierWizard'
import { CreateWizardShell } from '@/components/dossier/wizard/CreateWizardShell'
import { SharedBasicInfoStep } from '@/components/dossier/wizard/SharedBasicInfoStep'
import { OrgDetailsStep } from '@/components/dossier/wizard/steps/OrgDetailsStep'
import { OrganizationReviewStep } from '@/components/dossier/wizard/review/OrganizationReviewStep'
import { organizationWizardConfig } from '@/components/dossier/wizard/config/organization.config'
import type { OrganizationFormData } from '@/components/dossier/wizard/schemas/organization.schema'

export const Route = createFileRoute('/_protected/dossiers/organizations/create')({
  component: CreateOrganizationPage,
})

function CreateOrganizationPage(): ReactElement {
  const { t } = useTranslation('form-wizard')
  const wizard = useCreateDossierWizard<OrganizationFormData>(organizationWizardConfig)

  return (
    <div className="space-y-4">
      <Link
        to="/dossiers/organizations"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground min-h-11"
      >
        <ChevronLeft className="h-4 w-4 me-1" />
        {t('organization.back_to_list', 'Back to Organizations')}
      </Link>
      <h1 className="text-lg font-semibold">{t('organization.page_title')}</h1>
      <CreateWizardShell wizard={wizard}>
        <SharedBasicInfoStep form={wizard.form} dossierType="organization" />
        <OrgDetailsStep form={wizard.form} />
        <OrganizationReviewStep form={wizard.form} onEditStep={wizard.setCurrentStep} />
      </CreateWizardShell>
    </div>
  )
}
