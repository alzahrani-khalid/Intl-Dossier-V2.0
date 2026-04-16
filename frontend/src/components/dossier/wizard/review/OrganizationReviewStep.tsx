/**
 * OrganizationReviewStep -- Review step for the organization wizard (Plan 28-02, Task 1)
 *
 * Displays grouped summary cards for Basic Info and Organization Details
 * with Edit buttons that navigate back to the correct wizard step.
 * Uses form.watch() for live data (never stale after edits).
 */
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { UseFormReturn } from 'react-hook-form'

import { FormWizardStep } from '@/components/ui/form-wizard'
import type { OrganizationFormData } from '../schemas/organization.schema'
import { ReviewSection, ReviewField } from './ReviewComponents'

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface OrganizationReviewStepProps {
  form: UseFormReturn<OrganizationFormData>
  onEditStep: (step: number) => void
}

export function OrganizationReviewStep({
  form,
  onEditStep,
}: OrganizationReviewStepProps): ReactElement {
  const { t } = useTranslation(['form-wizard', 'dossier'])

  // CRITICAL: use watch() not getValues() so data is always live after edits
  const values = form.watch()

  // Translate org_type value for display
  const orgTypeDisplay =
    values.org_type !== undefined
      ? t(`form-wizard:organization.org_types.${values.org_type}`)
      : undefined

  // Truncate description for review display
  const descriptionDisplay =
    values.description_en !== undefined && values.description_en !== ''
      ? values.description_en.length > 120
        ? `${values.description_en.slice(0, 120)}...`
        : values.description_en
      : undefined

  return (
    <FormWizardStep stepId="review" className="space-y-4">
      {/* Basic Info section */}
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
      </ReviewSection>

      {/* Organization Details section */}
      <ReviewSection
        title={t('form-wizard:review.org_details')}
        onEdit={() => onEditStep(1)}
      >
        <ReviewField
          label={t('form-wizard:organization.org_type')}
          value={orgTypeDisplay}
        />
        <ReviewField
          label={t('form-wizard:organization.org_code')}
          value={values.org_code}
        />
        <ReviewField
          label={t('form-wizard:organization.website')}
          value={values.website}
        />
        <ReviewField
          label={t('form-wizard:organization.headquarters_en')}
          value={values.headquarters_en}
        />
        <ReviewField
          label={t('form-wizard:organization.headquarters_ar')}
          value={values.headquarters_ar}
        />
        <ReviewField
          label={t('form-wizard:organization.founding_date')}
          value={values.founding_date}
        />
      </ReviewSection>
    </FormWizardStep>
  )
}
