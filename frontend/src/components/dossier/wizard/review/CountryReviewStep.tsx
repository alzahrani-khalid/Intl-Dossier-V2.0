/**
 * CountryReviewStep -- Review step for the country wizard (Plan 27-02, Task 1)
 *
 * Displays grouped summary cards for Basic Info and Country Details
 * with Edit buttons that navigate back to the correct wizard step.
 * Uses form.watch() for live data (never stale after edits).
 */
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { UseFormReturn } from 'react-hook-form'

import { FormWizardStep } from '@/components/ui/form-wizard'
import type { CountryFormData } from '../schemas/country.schema'
import { ReviewSection, ReviewField } from './ReviewComponents'

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface CountryReviewStepProps {
  form: UseFormReturn<CountryFormData>
  onEditStep: (step: number) => void
}

export function CountryReviewStep({ form, onEditStep }: CountryReviewStepProps): ReactElement {
  const { t } = useTranslation(['form-wizard', 'dossier'])

  // CRITICAL: use watch() not getValues() so data is always live after edits
  const values = form.watch()

  // Translate region value for display
  const regionDisplay =
    values.region !== undefined && values.region !== ''
      ? t(`form-wizard:regions.${values.region}`)
      : undefined

  // Truncate description for review display (show EN; AR can be added later)
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
        <ReviewField
          label={t('dossier:form.status', 'Status')}
          value={values.status}
        />
        <ReviewField
          label={t('dossier:form.sensitivityLevel', 'Sensitivity')}
          value={t(`dossier:sensitivityLevel.${values.sensitivity_level}`)}
        />
      </ReviewSection>

      {/* Country Details section */}
      <ReviewSection
        title={t('form-wizard:review.country_details')}
        onEdit={() => onEditStep(1)}
      >
        <ReviewField
          label={t('form-wizard:country.iso_code_2')}
          value={values.iso_code_2}
        />
        <ReviewField
          label={t('form-wizard:country.iso_code_3')}
          value={values.iso_code_3}
        />
        <ReviewField
          label={t('form-wizard:country.region')}
          value={regionDisplay}
        />
        <ReviewField
          label={t('form-wizard:country.capital_en')}
          value={values.capital_en}
        />
        <ReviewField
          label={t('form-wizard:country.capital_ar')}
          value={values.capital_ar}
        />
      </ReviewSection>
    </FormWizardStep>
  )
}
