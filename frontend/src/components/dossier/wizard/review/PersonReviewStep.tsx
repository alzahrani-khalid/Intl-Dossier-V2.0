/**
 * PersonReviewStep -- Review step for the person wizard.
 *
 * Phase 32 (Plan 32-03, Task 1) — replaces the generic Basic-Info
 * card with an Identity card for persons (D-17..D-21):
 *   • Identity sub-section: honorific, first/last EN+AR, known-as EN+AR,
 *     nationality (resolved name + ISO-2), DOB, gender, photo preview.
 *   • Biographical summary sub-section: description_en, description_ar, tags.
 *   • Edit affordance wired to onEditStep(0) (D-20).
 *   • Card order: Identity → PersonDetails → OfficeTerm (elected_official only).
 *   • Missing values render as '—' (D-21).
 *
 * RTL-safe (logical Tailwind classes only; writingDirection via dir="rtl").
 * Mobile-first grid (base 1-col → sm 2-col).
 */
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { UseFormReturn } from 'react-hook-form'
import { Pencil } from 'lucide-react'

import { FormWizardStep } from '@/components/ui/form-wizard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useDossier } from '@/hooks/useDossier'
import type { PersonFormData } from '../schemas/person.schema'
import { ReviewSection, ReviewField } from './ReviewComponents'

const DASH = '—'

/** D-21: show `—` when the value is missing/empty after trim. */
function fallback(v: string | null | undefined): string {
  if (v === undefined || v === null) return DASH
  return v.trim() === '' ? DASH : v
}

// ---------------------------------------------------------------------------
// IdentityCard — Phase 32 D-17..D-21
// ---------------------------------------------------------------------------

interface IdentityCardProps {
  values: PersonFormData
  onEditStep: (step: number) => void
}

function IdentityCard({ values, onEditStep }: IdentityCardProps): ReactElement {
  const { t, i18n } = useTranslation(['form-wizard', 'dossier'])
  const isRTL = i18n.language === 'ar'

  // Resolve nationality dossier → name + ISO-2.
  // Guarded by enabled flag so we only hit the network when a nationality_id exists.
  const nationalityId = values.nationality_id
  const hasNationality =
    nationalityId !== undefined && nationalityId !== null && nationalityId.trim() !== ''
  const nationalityQuery = useDossier(hasNationality ? (nationalityId as string) : '', ['extension'], {
    enabled: hasNationality,
  })
  const nationalityDossier = nationalityQuery.data
  const nationalityIso2 =
    (nationalityDossier?.extension as { iso_code_2?: string | null } | undefined)?.iso_code_2 ??
    null
  const nationalityLabel = nationalityDossier
    ? `${isRTL ? nationalityDossier.name_ar : nationalityDossier.name_en}${
        nationalityIso2 !== null && nationalityIso2 !== '' ? ` (${nationalityIso2})` : ''
      }`
    : DASH

  const genderLabel =
    values.gender === 'female'
      ? t('form-wizard:wizard.person_identity.gender.female')
      : values.gender === 'male'
        ? t('form-wizard:wizard.person_identity.gender.male')
        : DASH

  const tags = Array.isArray(values.tags) ? values.tags : []

  return (
    <div
      className="rounded-lg border border-border bg-card p-4 space-y-3"
      data-testid="identity-card"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {t('form-wizard:wizard.person_identity.review.card_title')}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEditStep(0)}
          className="min-h-11 min-w-11 text-accent-foreground"
          aria-label={t('form-wizard:review.edit')}
          data-testid="identity-card-edit"
        >
          <Pencil className="h-4 w-4 me-1" />
          {t('form-wizard:review.edit')}
        </Button>
      </div>

      {/* Identity sub-section (D-18) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <ReviewField
          label={t('form-wizard:wizard.person_identity.honorific.label')}
          value={fallback(values.honorific_en)}
        />
        <ReviewField
          label={t('form-wizard:wizard.person_identity.first_name.label_en')}
          value={fallback(values.first_name_en)}
        />
        <ReviewField
          label={t('form-wizard:wizard.person_identity.last_name.label_en')}
          value={fallback(values.last_name_en)}
        />
        <div dir={isRTL ? 'rtl' : 'ltr'}>
          <ReviewField
            label={t('form-wizard:wizard.person_identity.first_name.label_ar')}
            value={fallback(values.first_name_ar)}
          />
        </div>
        <div dir={isRTL ? 'rtl' : 'ltr'}>
          <ReviewField
            label={t('form-wizard:wizard.person_identity.last_name.label_ar')}
            value={fallback(values.last_name_ar)}
          />
        </div>
        <ReviewField
          label={t('form-wizard:wizard.person_identity.known_as.label_en')}
          value={fallback(values.known_as_en)}
        />
        <div dir={isRTL ? 'rtl' : 'ltr'}>
          <ReviewField
            label={t('form-wizard:wizard.person_identity.known_as.label_ar')}
            value={fallback(values.known_as_ar)}
          />
        </div>
        <ReviewField
          label={t('form-wizard:wizard.person_identity.nationality.label')}
          value={nationalityLabel}
        />
        <ReviewField
          label={t('form-wizard:wizard.person_identity.dob.label')}
          value={fallback(values.date_of_birth)}
        />
        <ReviewField
          label={t('form-wizard:wizard.person_identity.gender.label')}
          value={genderLabel}
        />

        {/* Photo preview — renders thumbnail if present, '—' otherwise (D-21). */}
        <div className="space-y-1 sm:col-span-2">
          <dt className="text-xs text-muted-foreground">
            {t('form-wizard:wizard.person_identity.photo_url.label')}
          </dt>
          <dd>
            {values.photo_url !== undefined && values.photo_url !== '' ? (
              <img
                src={values.photo_url}
                alt=""
                loading="lazy"
                className="h-16 w-16 rounded-md object-cover border border-border"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              <span className="text-muted-foreground italic">{DASH}</span>
            )}
          </dd>
        </div>
      </div>

      {/* D-18 divider between Identity and Biographical summary */}
      <hr className="border-t border-border" />

      {/* Biographical summary sub-section (D-18) */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">
          {t('form-wizard:wizard.person_identity.review.biographical_summary_heading')}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <ReviewField
            label={t('dossier:form.descriptionEn', 'Description (English)')}
            value={fallback(values.description_en)}
          />
          <div dir={isRTL ? 'rtl' : 'ltr'}>
            <ReviewField
              label={t('dossier:form.descriptionAr', 'Description (Arabic)')}
              value={fallback(values.description_ar)}
            />
          </div>
        </div>
        <div className="space-y-1">
          <dt className="text-xs text-muted-foreground">
            {t('dossier:form.tags', 'Tags')}
          </dt>
          <dd className="flex flex-wrap gap-2" data-testid="identity-tags">
            {tags.length === 0 ? (
              <span className="text-muted-foreground italic">{DASH}</span>
            ) : (
              tags.map((tag: string) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))
            )}
          </dd>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface PersonReviewStepProps {
  form: UseFormReturn<PersonFormData>
  onEditStep: (step: number) => void
}

export function PersonReviewStep({ form, onEditStep }: PersonReviewStepProps): ReactElement {
  const { t } = useTranslation(['form-wizard', 'dossier'])

  // CRITICAL: use watch() not getValues() so data is always live after edits.
  const values = form.watch()

  // Truncate biography for review display.
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
      {/* Phase 32 D-17: Identity card replaces the former Basic-Info card for persons.
          Card order per D-19: Identity → PersonDetails → OfficeTerm → submit. */}
      <IdentityCard values={values} onEditStep={onEditStep} />

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

        {/* Photo thumbnail (person-details context-specific photo; retained per scope) */}
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
