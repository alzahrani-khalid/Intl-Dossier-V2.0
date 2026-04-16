/**
 * TopicReviewStep -- Review step for the topic wizard (Plan 28-03, Task 1)
 *
 * Displays a single review section combining Basic Info and Topic Details.
 * Only 1 editable step (basic, index 0) so onEdit always navigates to step 0.
 * Uses form.watch() for live data (never stale after edits).
 */
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { UseFormReturn } from 'react-hook-form'

import { FormWizardStep } from '@/components/ui/form-wizard'
import type { TopicFormData } from '../schemas/topic.schema'
import { ReviewSection, ReviewField } from './ReviewComponents'

interface TopicReviewStepProps {
  form: UseFormReturn<TopicFormData>
  onEditStep: (step: number) => void
}

export function TopicReviewStep({ form, onEditStep }: TopicReviewStepProps): ReactElement {
  const { t } = useTranslation(['form-wizard', 'dossier'])

  // CRITICAL: use watch() not getValues() so data is always live after edits
  const values = form.watch()

  // Truncate description for review display
  const descriptionDisplay =
    values.description_en !== undefined && values.description_en !== ''
      ? values.description_en.length > 120
        ? `${values.description_en.slice(0, 120)}...`
        : values.description_en
      : undefined

  // Translate theme_category for display
  const themeCategoryDisplay =
    values.theme_category != null
      ? t(`form-wizard:topic.themes.${values.theme_category}`)
      : undefined

  return (
    <FormWizardStep stepId="review" className="space-y-4">
      {/* Basic Info + Topic Details -- single section since only 1 editable step */}
      <ReviewSection
        title={t('form-wizard:review.basic_info')}
        onEdit={() => onEditStep(0)}
      >
        <ReviewField
          label={t('dossier:form.nameEn', 'Name (English)')}
          value={values.name_en}
        />
        <ReviewField
          label={t('dossier:form.nameAr', 'Name (Arabic)')}
          value={values.name_ar}
        />
        <ReviewField
          label={t('dossier:form.abbreviation', 'Abbreviation')}
          value={values.abbreviation}
        />
        <ReviewField
          label={t('dossier:form.description', 'Description')}
          value={descriptionDisplay}
        />
        <ReviewField
          label={t('dossier:form.status', 'Status')}
          value={values.status}
        />
        <ReviewField
          label={t('dossier:form.sensitivityLevel', 'Sensitivity')}
          value={t(`dossier:sensitivityLevel.${values.sensitivity_level}`)}
        />
        <ReviewField
          label={t('form-wizard:topic.theme_category')}
          value={themeCategoryDisplay}
        />
      </ReviewSection>
    </FormWizardStep>
  )
}
