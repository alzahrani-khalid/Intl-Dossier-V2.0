/**
 * ForumReviewStep -- Review step for the Forum wizard (Plan 29-03, Task 2).
 *
 * Displays grouped summary cards for Basic Info and Forum Details
 * with Edit buttons that navigate back to the correct wizard step.
 * Uses form.watch() for live data (never stale after edits).
 */
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { UseFormReturn } from 'react-hook-form'

import { FormWizardStep } from '@/components/ui/form-wizard'
import type { ForumFormData } from '../schemas/forum.schema'
import { ReviewSection, ReviewField } from './ReviewComponents'

interface ForumReviewStepProps {
  form: UseFormReturn<ForumFormData>
  onEditStep: (step: number) => void
}

export function ForumReviewStep({ form, onEditStep }: ForumReviewStepProps): ReactElement {
  const { t } = useTranslation(['form-wizard', 'dossier'])

  // CRITICAL: use watch() not getValues() so data is always live after edits
  const values = form.watch()

  const forumTypeDisplay =
    values.forum_type !== undefined && values.forum_type !== ''
      ? t(`form-wizard:forum.forum_types.${values.forum_type}`)
      : undefined

  // Truncate description for review display (mirrors OrganizationReviewStep)
  const descriptionDisplay =
    values.description_en !== undefined && values.description_en !== ''
      ? values.description_en.length > 120
        ? `${values.description_en.slice(0, 120)}...`
        : values.description_en
      : undefined

  // Organizing body — currently displays the raw dossier id. Wiring a name lookup
  // (useDossier by id) is tracked as tech debt per PATTERNS.md §8.
  // TODO(29-follow-up): resolve organizing_body_id to organization name via useDossier hook.
  const organizingBodyDisplay =
    values.organizing_body_id !== undefined && values.organizing_body_id !== ''
      ? values.organizing_body_id
      : undefined

  return (
    <FormWizardStep stepId="review" className="space-y-4">
      {/* Basic Info section */}
      <ReviewSection
        title={t('form-wizard:review.basic_info')}
        onEdit={(): void => onEditStep(0)}
      >
        <ReviewField label={t('dossier:form.nameEn', 'Name (English)')} value={values.name_en} />
        <ReviewField label={t('dossier:form.nameAr', 'Name (Arabic)')} value={values.name_ar} />
        <ReviewField
          label={t('dossier:form.abbreviation', 'Abbreviation')}
          value={values.abbreviation}
        />
        <ReviewField
          label={t('dossier:form.description', 'Description')}
          value={descriptionDisplay}
        />
      </ReviewSection>

      {/* Forum Details section */}
      <ReviewSection
        title={t('form-wizard:review.forum_details')}
        onEdit={(): void => onEditStep(1)}
      >
        <ReviewField
          label={t('form-wizard:forum.forum_type_label')}
          value={forumTypeDisplay}
        />
        <ReviewField
          label={t('form-wizard:forum.organizing_body_label')}
          value={organizingBodyDisplay}
        />
      </ReviewSection>
    </FormWizardStep>
  )
}
