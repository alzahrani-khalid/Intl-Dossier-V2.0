/**
 * PersonReviewStep -- Review step for the person wizard (Plan 28-04, Task 1)
 *
 * Displays grouped summary cards for Basic Info and Person Details
 * with Edit buttons that navigate back to the correct wizard step.
 * Uses form.watch() for live data (never stale after edits).
 */
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { UseFormReturn } from 'react-hook-form'

import { FormWizardStep } from '@/components/ui/form-wizard'
import type { PersonFormData } from '../schemas/person.schema'
import { ReviewSection, ReviewField } from './ReviewComponents'

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface PersonReviewStepProps {
  form: UseFormReturn<PersonFormData>
  onEditStep: (step: number) => void
}

export function PersonReviewStep({ form, onEditStep }: PersonReviewStepProps): ReactElement {
  const { t } = useTranslation(['form-wizard', 'dossier'])

  // CRITICAL: use watch() not getValues() so data is always live after edits
  const values = form.watch()

  // Truncate biography for review display
  const biographyEnDisplay =
    values.biography_en !== undefined && values.biography_en !== ''
      ? values.biography_en.length > 120
        ? `${values.biography_en.slice(0, 120)}...`
        : values.biography_en
      : undefined

  const biographyArDisplay =
    values.biography_ar !== undefined && values.biography_ar !== ''
      ? values.biography_ar.length > 120
        ? `${values.biography_ar.slice(0, 120)}...`
        : values.biography_ar
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
          value={
            values.description_en !== undefined && values.description_en !== ''
              ? values.description_en.length > 120
                ? `${values.description_en.slice(0, 120)}...`
                : values.description_en
              : undefined
          }
        />
      </ReviewSection>

      {/* Person Details section */}
      <ReviewSection
        title={t('form-wizard:review.person_details')}
        onEdit={() => onEditStep(1)}
      >
        <ReviewField
          label={t('form-wizard:person.title_en')}
          value={values.title_en}
        />
        <ReviewField
          label={t('form-wizard:person.title_ar')}
          value={values.title_ar}
        />

        {/* Photo thumbnail */}
        {values.photo_url !== undefined && values.photo_url !== '' ? (
          <div className="space-y-1">
            <dt className="text-xs text-muted-foreground">
              {t('form-wizard:person.photo')}
            </dt>
            <dd>
              <img
                src={values.photo_url}
                alt=""
                className="h-12 w-12 rounded-lg object-cover border border-border"
              />
            </dd>
          </div>
        ) : (
          <ReviewField
            label={t('form-wizard:person.photo')}
            value={undefined}
          />
        )}

        <ReviewField
          label={t('form-wizard:person.biography_en')}
          value={biographyEnDisplay}
        />
        <ReviewField
          label={t('form-wizard:person.biography_ar')}
          value={biographyArDisplay}
        />
      </ReviewSection>

      {/* Phase 30 D-07: Office & Term section — rendered ONLY for elected-official subtype */}
      {values.person_subtype === 'elected_official' && (
        <ReviewSection title={t('form-wizard:review.office_term')} onEdit={() => onEditStep(2)}>
          <ReviewField
            label={t('form-wizard:elected_official.office_name_en')}
            value={values.office_name_en}
          />
          <ReviewField
            label={t('form-wizard:elected_official.office_name_ar')}
            value={values.office_name_ar}
          />
          <ReviewField label={t('form-wizard:elected_official.country')} value={values.country_id} />
          <ReviewField
            label={t('form-wizard:elected_official.organization')}
            value={values.organization_id}
          />
          <ReviewField
            label={t('form-wizard:elected_official.district_en')}
            value={values.district_en}
          />
          <ReviewField
            label={t('form-wizard:elected_official.district_ar')}
            value={values.district_ar}
          />
          <ReviewField label={t('form-wizard:elected_official.party_en')} value={values.party_en} />
          <ReviewField label={t('form-wizard:elected_official.party_ar')} value={values.party_ar} />
          <ReviewField
            label={t('form-wizard:elected_official.term_start')}
            value={values.term_start}
          />
          <ReviewField
            label={t('form-wizard:elected_official.term_end')}
            value={
              values.term_end !== undefined && values.term_end !== ''
                ? values.term_end
                : t('form-wizard:elected_official.term_end_help')
            }
          />
        </ReviewSection>
      )}
    </FormWizardStep>
  )
}
