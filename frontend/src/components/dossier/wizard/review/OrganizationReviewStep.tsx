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

  // 260629-jkn: translated enum values for the engagement-profile review.
  const membershipDisplay =
    values.membership_type !== undefined && values.membership_type !== ''
      ? t(`form-wizard:organization.membership_types.${values.membership_type}`)
      : undefined
  const importanceDisplay =
    values.importance !== undefined && values.importance !== ''
      ? t(`form-wizard:organization.importances.${values.importance}`)
      : undefined
  const representationDisplay =
    values.representation_level !== undefined && values.representation_level !== ''
      ? t(`form-wizard:organization.representation_levels.${values.representation_level}`)
      : undefined

  // Show both names when present, otherwise whichever is set (AR preferred order).
  const officerDisplay = (en?: string, ar?: string): string | undefined => {
    const parts = [ar, en].filter((v): v is string => v !== undefined && v !== '')
    return parts.length > 0 ? parts.join(' / ') : undefined
  }

  return (
    <FormWizardStep stepId="review" className="space-y-4">
      {/* Basic Info section */}
      <ReviewSection title={t('form-wizard:review.basic_info')} onEdit={() => onEditStep(0)}>
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

      {/* Organization Details section */}
      <ReviewSection title={t('form-wizard:review.org_details')} onEdit={() => onEditStep(1)}>
        <ReviewField label={t('form-wizard:organization.org_type')} value={orgTypeDisplay} />
        <ReviewField label={t('form-wizard:organization.org_code')} value={values.org_code} />
        <ReviewField label={t('form-wizard:organization.website')} value={values.website} />
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

      {/* Engagement profile section (260629-jkn) */}
      <ReviewSection
        title={t('form-wizard:organization.engagement_profile')}
        onEdit={() => onEditStep(1)}
      >
        <ReviewField
          label={t('form-wizard:organization.membership_type')}
          value={membershipDisplay}
        />
        <ReviewField label={t('form-wizard:organization.importance')} value={importanceDisplay} />
        <ReviewField
          label={t('form-wizard:organization.representation_level')}
          value={representationDisplay}
        />
        <ReviewField
          label={t('form-wizard:organization.focal_responsible')}
          value={officerDisplay(values.responsible_name_en, values.responsible_name_ar)}
        />
        <ReviewField
          label={t('form-wizard:organization.focal_alternate')}
          value={officerDisplay(values.alternate_name_en, values.alternate_name_ar)}
        />
        <ReviewField
          label={t('form-wizard:organization.focal_support')}
          value={officerDisplay(values.support_name_en, values.support_name_ar)}
        />
      </ReviewSection>
    </FormWizardStep>
  )
}
