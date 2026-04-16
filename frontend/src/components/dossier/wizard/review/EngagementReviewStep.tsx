/**
 * EngagementReviewStep -- Review step for the engagement wizard (Plan 29-05, Task 2)
 *
 * Displays 3 grouped summary cards: Basic Info, Engagement Details, Participants.
 * Edit buttons jump back to the correct wizard step index (0, 1, 2).
 * Uses form.watch() for live data (never stale after edits).
 */
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { UseFormReturn } from 'react-hook-form'

import { FormWizardStep } from '@/components/ui/form-wizard'
import type { EngagementFormData } from '../schemas/engagement.schema'
import { ReviewSection, ReviewField } from './ReviewComponents'

interface EngagementReviewStepProps {
  form: UseFormReturn<EngagementFormData>
  onEditStep: (step: number) => void
}

export function EngagementReviewStep({
  form,
  onEditStep,
}: EngagementReviewStepProps): ReactElement {
  const { t } = useTranslation(['form-wizard', 'dossier'])

  // CRITICAL: use watch() not getValues() so data is always live after edits
  const values = form.watch()

  // Defaults object holds an empty string cast to the enum type at draft time,
  // so we treat both '' and undefined as "not selected" for display purposes.
  const rawType = values.engagement_type as string | undefined
  const rawCategory = values.engagement_category as string | undefined
  const typeDisplay =
    rawType !== undefined && rawType !== ''
      ? t(`form-wizard:engagement.types.${rawType}`)
      : undefined
  const categoryDisplay =
    rawCategory !== undefined && rawCategory !== ''
      ? t(`form-wizard:engagement.categories.${rawCategory}`)
      : undefined

  const countries = values.participant_country_ids?.length ?? 0
  const orgs = values.participant_organization_ids?.length ?? 0
  const persons = values.participant_person_ids?.length ?? 0

  return (
    <FormWizardStep stepId="review" className="space-y-4">
      <ReviewSection title={t('form-wizard:review.basic_info')} onEdit={() => onEditStep(0)}>
        <ReviewField label={t('dossier:form.nameEn', 'Name (English)')} value={values.name_en} />
        <ReviewField label={t('dossier:form.nameAr', 'Name (Arabic)')} value={values.name_ar} />
        <ReviewField
          label={t('dossier:form.abbreviation', 'Abbreviation')}
          value={values.abbreviation}
        />
        <ReviewField
          label={t('dossier:form.description', 'Description')}
          value={values.description_en}
        />
      </ReviewSection>

      <ReviewSection
        title={t('form-wizard:review.engagement_details')}
        onEdit={() => onEditStep(1)}
      >
        <ReviewField label={t('form-wizard:engagement.type_label')} value={typeDisplay} />
        <ReviewField label={t('form-wizard:engagement.category_label')} value={categoryDisplay} />
        <ReviewField
          label={t('form-wizard:engagement.start_date_label')}
          value={values.start_date}
        />
        <ReviewField label={t('form-wizard:engagement.end_date_label')} value={values.end_date} />
        <ReviewField
          label={t('form-wizard:engagement.location_en_label')}
          value={values.location_en}
        />
        <ReviewField
          label={t('form-wizard:engagement.location_ar_label')}
          value={values.location_ar}
        />
      </ReviewSection>

      <ReviewSection
        title={t('form-wizard:review.participants_summary')}
        onEdit={() => onEditStep(2)}
      >
        <ReviewField
          label={t('form-wizard:engagement.participants.countries_label')}
          value={String(countries)}
        />
        <ReviewField
          label={t('form-wizard:engagement.participants.organizations_label')}
          value={String(orgs)}
        />
        <ReviewField
          label={t('form-wizard:engagement.participants.persons_label')}
          value={String(persons)}
        />
      </ReviewSection>
    </FormWizardStep>
  )
}
