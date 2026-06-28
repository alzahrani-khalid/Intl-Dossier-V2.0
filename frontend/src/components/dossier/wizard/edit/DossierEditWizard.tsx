/**
 * DossierEditWizard (A-1) — drives the existing create wizard in EDIT mode.
 *
 * Given a loaded dossier, it picks the matching per-type WizardConfig + step
 * components (the SAME ones the create routes use) and seeds them from the
 * dossier's current values. Each branch renders a strongly-typed
 * <EditWizardRunner<FormData>> so the step components keep their exact prop
 * types with no casts; the runner owns the single useEditDossierWizard() call.
 */

import type { ReactElement, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { FieldValues } from 'react-hook-form'

import type { DossierWithExtension } from '@/services/dossier-api'

import { CreateWizardShell } from '../CreateWizardShell'
import type { CreateWizardReturn, WizardConfig } from '../config/types'
import { useEditDossierWizard } from './useEditDossierWizard'
import { buildEditInitialValues } from './build-edit-initial-values'

// Configs (reused verbatim from the create flow)
import { countryWizardConfig } from '../config/country.config'
import { organizationWizardConfig } from '../config/organization.config'
import { forumWizardConfig } from '../config/forum.config'
import { topicWizardConfig } from '../config/topic.config'
import { workingGroupWizardConfig } from '../config/working-group.config'
import { engagementWizardConfig } from '../config/engagement.config'
import { personWizardConfig, electedOfficialWizardConfig } from '../config/person.config'

// Step components
import { SharedBasicInfoStep } from '../SharedBasicInfoStep'
import { CountryDetailsStep } from '../steps/CountryDetailsStep'
import { OrgDetailsStep } from '../steps/OrgDetailsStep'
import { ForumDetailsStep } from '../steps/ForumDetailsStep'
import { WorkingGroupDetailsStep } from '../steps/WorkingGroupDetailsStep'
import { TopicBasicInfoStep } from '../steps/TopicBasicInfoStep'
import { EngagementDetailsStep } from '../steps/EngagementDetailsStep'
import { EngagementParticipantsStep } from '../steps/EngagementParticipantsStep'
import { PersonBasicInfoStep } from '../steps/PersonBasicInfoStep'
import { PersonDetailsStep } from '../steps/PersonDetailsStep'
import { OfficeTermStep } from '../steps/OfficeTermStep'

// Review steps
import { CountryReviewStep } from '../review/CountryReviewStep'
import { OrganizationReviewStep } from '../review/OrganizationReviewStep'
import { ForumReviewStep } from '../review/ForumReviewStep'
import { WorkingGroupReviewStep } from '../review/WorkingGroupReviewStep'
import { TopicReviewStep } from '../review/TopicReviewStep'
import { EngagementReviewStep } from '../review/EngagementReviewStep'
import { PersonReviewStep } from '../review/PersonReviewStep'

// Form-data types
import type { CountryFormData } from '../schemas/country.schema'
import type { OrganizationFormData } from '../schemas/organization.schema'
import type { ForumFormData } from '../schemas/forum.schema'
import type { TopicFormData } from '../schemas/topic.schema'
import type { WorkingGroupFormData } from '../schemas/working-group.schema'
import type { EngagementFormData } from '../schemas/engagement.schema'
import type { PersonFormData } from '../schemas/person.schema'

interface EditWizardRunnerProps<T extends FieldValues> {
  config: WizardConfig<T>
  dossierId: string
  initialValues: Record<string, unknown>
  completeLabel: string
  renderSteps: (wizard: CreateWizardReturn<T>) => ReactNode
}

function EditWizardRunner<T extends FieldValues>({
  config,
  dossierId,
  initialValues,
  completeLabel,
  renderSteps,
}: EditWizardRunnerProps<T>): ReactElement {
  const wizard = useEditDossierWizard<T>(config, { dossierId, initialValues })
  return (
    <CreateWizardShell wizard={wizard} completeButtonText={completeLabel}>
      {renderSteps(wizard)}
    </CreateWizardShell>
  )
}

interface DossierEditWizardProps {
  dossier: DossierWithExtension
}

export function DossierEditWizard({ dossier }: DossierEditWizardProps): ReactElement {
  const { t } = useTranslation(['dossier', 'form-wizard'])
  const completeLabel = t('dossier:form.update')
  const dossierId = dossier.id
  const { configKey, initialValues } = buildEditInitialValues(dossier)

  switch (configKey) {
    case 'country':
      return (
        <EditWizardRunner<CountryFormData>
          config={countryWizardConfig}
          dossierId={dossierId}
          initialValues={initialValues}
          completeLabel={completeLabel}
          renderSteps={(w): ReactNode => (
            <>
              <SharedBasicInfoStep form={w.form} dossierType="country" />
              <CountryDetailsStep form={w.form} />
              <CountryReviewStep form={w.form} onEditStep={w.setCurrentStep} />
            </>
          )}
        />
      )
    case 'organization':
      return (
        <EditWizardRunner<OrganizationFormData>
          config={organizationWizardConfig}
          dossierId={dossierId}
          initialValues={initialValues}
          completeLabel={completeLabel}
          renderSteps={(w): ReactNode => (
            <>
              <SharedBasicInfoStep form={w.form} dossierType="organization" />
              <OrgDetailsStep form={w.form} />
              <OrganizationReviewStep form={w.form} onEditStep={w.setCurrentStep} />
            </>
          )}
        />
      )
    case 'forum':
      return (
        <EditWizardRunner<ForumFormData>
          config={forumWizardConfig}
          dossierId={dossierId}
          initialValues={initialValues}
          completeLabel={completeLabel}
          renderSteps={(w): ReactNode => (
            <>
              <SharedBasicInfoStep form={w.form} dossierType="forum" />
              <ForumDetailsStep form={w.form} />
              <ForumReviewStep form={w.form} onEditStep={w.setCurrentStep} />
            </>
          )}
        />
      )
    case 'working_group':
      return (
        <EditWizardRunner<WorkingGroupFormData>
          config={workingGroupWizardConfig}
          dossierId={dossierId}
          initialValues={initialValues}
          completeLabel={completeLabel}
          renderSteps={(w): ReactNode => (
            <>
              <SharedBasicInfoStep form={w.form} dossierType="working_group" />
              <WorkingGroupDetailsStep form={w.form} />
              <WorkingGroupReviewStep form={w.form} onEditStep={w.setCurrentStep} />
            </>
          )}
        />
      )
    case 'topic':
      return (
        <EditWizardRunner<TopicFormData>
          config={topicWizardConfig}
          dossierId={dossierId}
          initialValues={initialValues}
          completeLabel={completeLabel}
          renderSteps={(w): ReactNode => (
            <>
              <TopicBasicInfoStep form={w.form} />
              <TopicReviewStep form={w.form} onEditStep={w.setCurrentStep} />
            </>
          )}
        />
      )
    case 'engagement':
      return (
        <EditWizardRunner<EngagementFormData>
          config={engagementWizardConfig}
          dossierId={dossierId}
          initialValues={initialValues}
          completeLabel={completeLabel}
          renderSteps={(w): ReactNode => (
            <>
              <SharedBasicInfoStep form={w.form} dossierType="engagement" />
              <EngagementDetailsStep form={w.form} />
              <EngagementParticipantsStep form={w.form} />
              <EngagementReviewStep form={w.form} onEditStep={w.setCurrentStep} />
            </>
          )}
        />
      )
    case 'person':
      return (
        <EditWizardRunner<PersonFormData>
          config={personWizardConfig}
          dossierId={dossierId}
          initialValues={initialValues}
          completeLabel={completeLabel}
          renderSteps={(w): ReactNode => (
            <>
              <PersonBasicInfoStep form={w.form} dossierType="person" />
              <PersonDetailsStep form={w.form} />
              <PersonReviewStep form={w.form} onEditStep={w.setCurrentStep} />
            </>
          )}
        />
      )
    case 'elected_official':
      return (
        <EditWizardRunner<PersonFormData>
          config={electedOfficialWizardConfig}
          dossierId={dossierId}
          initialValues={initialValues}
          completeLabel={completeLabel}
          renderSteps={(w): ReactNode => (
            <>
              <PersonBasicInfoStep form={w.form} dossierType="person" />
              <PersonDetailsStep form={w.form} />
              <OfficeTermStep form={w.form} />
              <PersonReviewStep form={w.form} onEditStep={w.setCurrentStep} />
            </>
          )}
        />
      )
    default:
      return <></>
  }
}
