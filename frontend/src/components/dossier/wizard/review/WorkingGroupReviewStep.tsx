import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { UseFormReturn } from 'react-hook-form'

import { FormWizardStep } from '@/components/ui/form-wizard'
import type { WorkingGroupFormData } from '../schemas/working-group.schema'
import { ReviewSection, ReviewField } from './ReviewComponents'

interface WorkingGroupReviewStepProps {
  form: UseFormReturn<WorkingGroupFormData>
  onEditStep: (step: number) => void
}

const truncate = (s: string | undefined, n = 80): string =>
  s === undefined || s === '' ? '—' : s.length <= n ? s : `${s.slice(0, n)}…`

export function WorkingGroupReviewStep({
  form,
  onEditStep,
}: WorkingGroupReviewStepProps): ReactElement {
  const { t } = useTranslation(['form-wizard', 'dossier'])
  const values = form.watch()

  const statusDisplay =
    values.wg_status !== undefined
      ? t(`form-wizard:workingGroup.statuses.${values.wg_status}`)
      : '—'

  const establishedDateDisplay =
    values.established_date !== undefined && values.established_date !== ''
      ? values.established_date
      : '—'

  const parentBodyDisplay =
    values.parent_body_id !== undefined && values.parent_body_id !== ''
      ? values.parent_body_id
      : '—'

  return (
    <FormWizardStep stepId="review" className="space-y-4">
      <ReviewSection title={t('form-wizard:review.basic_info')} onEdit={() => onEditStep(0)}>
        <ReviewField label={t('dossier:form.nameEn')} value={values.name_en} />
        <ReviewField label={t('dossier:form.nameAr')} value={values.name_ar} />
        <ReviewField label={t('dossier:form.abbreviation')} value={values.abbreviation} />
        <ReviewField label={t('dossier:form.description')} value={values.description_en} />
      </ReviewSection>
      <ReviewSection
        title={t('form-wizard:review.working_group_details')}
        onEdit={() => onEditStep(1)}
      >
        <ReviewField label={t('form-wizard:workingGroup.status_label')} value={statusDisplay} />
        <ReviewField
          label={t('form-wizard:workingGroup.established_date_label')}
          value={establishedDateDisplay}
        />
        <ReviewField
          label={t('form-wizard:workingGroup.mandate_en_label')}
          value={truncate(values.mandate_en)}
        />
        <ReviewField
          label={t('form-wizard:workingGroup.mandate_ar_label')}
          value={truncate(values.mandate_ar)}
        />
        <ReviewField
          label={t('form-wizard:workingGroup.parent_body_label')}
          value={parentBodyDisplay}
        />
      </ReviewSection>
    </FormWizardStep>
  )
}
