import type { WizardConfig } from './types'
import type { PersonFormData } from '../schemas/person.schema'
import { personSchema } from '../schemas/person.schema'
import { getDefaultsForType } from '../defaults'
import { getElectedOfficialDefaults } from '../defaults'
import { HONORIFIC_OTHER, resolveCuratedHonorific } from '../steps/honorific-map'

// Phase 32 D-27: person + elected-official step-0 title switches to the
// identity key prefix (D-32). Other dossier types still use steps.basicInfo.
//
// Plan 31-02 D-13/D-14: step `guidanceKey` field differs between the two
// variants (person-wizard namespace vs elected-official-wizard namespace) —
// so build step tuples inline per wizard rather than sharing constants.
const personBasicStepBase = {
  id: 'basic',
  title: 'form-wizard:wizard.person_identity.step_title',
  description: 'form-wizard:wizard.person_identity.step_desc',
}

const personDetailsStepBase = {
  id: 'person-details',
  title: 'form-wizard:steps.personDetails',
  description: 'form-wizard:steps.personDetailsDesc',
}

const officeTermStepBase = {
  id: 'office-term',
  title: 'form-wizard:steps.officeTerm',
  description: 'form-wizard:steps.officeTermDesc',
}

const reviewStepBase = {
  id: 'review',
  title: 'form-wizard:steps.review',
  description: 'form-wizard:steps.reviewDesc',
}

/**
 * Phase 32 D-04, D-08, D-09: compose dossier-level name + resolve honorific.
 *
 * - Honorific: if selection === 'Other', use free-text EN/AR inputs;
 *   else resolve curated label via the static D-04 map. Unselected → NULL.
 * - name_en / name_ar composition: "first last" when first populated, else "last".
 *   Composed name does NOT include honorific (D-09).
 *
 * Returned value is the Phase 32 extension payload PLUS __composed_name_en /
 * __composed_name_ar keys that the submit handler peels off and writes to the
 * top-level CreateDossierRequest.name_en/name_ar.
 */
const composePersonExtension = (
  data: PersonFormData,
): {
  honorific_en: string | null
  honorific_ar: string | null
  first_name_en: string | null
  last_name_en: string | null
  first_name_ar: string | null
  last_name_ar: string | null
  known_as_en: string | null
  known_as_ar: string | null
  nationality_country_id: string | null
  date_of_birth: string | null
  gender: 'female' | 'male' | null
  __composed_name_en: string
  __composed_name_ar: string
} => {
  // ── D-04: Honorific resolution ──
  let honorific_en: string | null = null
  let honorific_ar: string | null = null
  const selection = ((data.honorific_selection as string | undefined) ?? '').trim()
  if (selection === HONORIFIC_OTHER) {
    honorific_en = ((data.honorific_en as string | undefined) ?? '').trim() || null
    honorific_ar = ((data.honorific_ar as string | undefined) ?? '').trim() || null
  } else if (selection !== '') {
    const resolved = resolveCuratedHonorific(selection)
    honorific_en = resolved?.honorific_en ?? null
    honorific_ar = resolved?.honorific_ar ?? null
  }

  // ── D-08, D-09: compose dossiers.name_en / name_ar from first + last ──
  const composeName = (first: string | undefined, last: string | undefined): string => {
    const f = (first ?? '').trim()
    const l = (last ?? '').trim()
    if (f !== '' && l !== '') return `${f} ${l}`
    return l
  }
  const __composed_name_en = composeName(
    data.first_name_en as string | undefined,
    data.last_name_en as string | undefined,
  )
  const __composed_name_ar = composeName(
    data.first_name_ar as string | undefined,
    data.last_name_ar as string | undefined,
  )

  // ── D-26: rename nationality_id → nationality_country_id at boundary ──
  const nationality_country_id =
    ((data.nationality_id as string | undefined) ?? '').trim() || null

  // Trim helper for optional string columns.
  const trimOrNull = (v: string | undefined): string | null =>
    ((v ?? '').trim() === '' ? null : (v ?? '').trim())

  return {
    honorific_en,
    honorific_ar,
    first_name_en: trimOrNull(data.first_name_en as string | undefined),
    last_name_en: trimOrNull(data.last_name_en as string | undefined),
    first_name_ar: trimOrNull(data.first_name_ar as string | undefined),
    last_name_ar: trimOrNull(data.last_name_ar as string | undefined),
    known_as_en: trimOrNull(data.known_as_en as string | undefined),
    known_as_ar: trimOrNull(data.known_as_ar as string | undefined),
    nationality_country_id,
    date_of_birth: trimOrNull(data.date_of_birth as string | undefined),
    gender: (data.gender as 'female' | 'male' | undefined) ?? null,
    __composed_name_en,
    __composed_name_ar,
  }
}

// Standard person wizard (3 steps): Basic → Person Details → Review
export const personWizardConfig: WizardConfig<PersonFormData> = {
  type: 'person',
  schema: personSchema,
  defaultValues: getDefaultsForType<PersonFormData>('person'),
  steps: [
    { ...personBasicStepBase, guidanceKey: 'person-wizard:wizard.steps.basic.guidance' },
    {
      ...personDetailsStepBase,
      guidanceKey: 'person-wizard:wizard.steps.person-details.guidance',
    },
    { ...reviewStepBase, guidanceKey: 'person-wizard:wizard.steps.review.guidance' },
  ],
  filterExtensionData: (data: PersonFormData) => {
    const identity = composePersonExtension(data)
    return {
      // Existing person fields
      title_en: data.title_en !== '' ? data.title_en : undefined,
      title_ar: data.title_ar !== '' ? data.title_ar : undefined,
      photo_url: data.photo_url !== '' ? data.photo_url : undefined,
      biography_en: data.biography_en !== '' ? data.biography_en : undefined,
      biography_ar: data.biography_ar !== '' ? data.biography_ar : undefined,
      person_subtype: data.person_subtype,
      // Phase 32 identity fields (honorific_selection is form-only and is
      // NOT included in the extension payload).
      honorific_en: identity.honorific_en,
      honorific_ar: identity.honorific_ar,
      first_name_en: identity.first_name_en,
      last_name_en: identity.last_name_en,
      first_name_ar: identity.first_name_ar,
      last_name_ar: identity.last_name_ar,
      known_as_en: identity.known_as_en,
      known_as_ar: identity.known_as_ar,
      nationality_country_id: identity.nationality_country_id,
      date_of_birth: identity.date_of_birth,
      gender: identity.gender,
    }
  },
}

// Elected Official wizard variant (4 steps): Basic → Person Details → Office/Term → Review
// Phase 30 D-01, D-16, D-17 — same shell/hook, subtype-aware step array.
export const electedOfficialWizardConfig: WizardConfig<PersonFormData> = {
  type: 'person',
  schema: personSchema,
  defaultValues: getElectedOfficialDefaults(),
  steps: [
    {
      ...personBasicStepBase,
      guidanceKey: 'elected-official-wizard:wizard.steps.basic.guidance',
    },
    {
      ...personDetailsStepBase,
      guidanceKey: 'elected-official-wizard:wizard.steps.person-details.guidance',
    },
    {
      ...officeTermStepBase,
      guidanceKey: 'elected-official-wizard:wizard.steps.office-term.guidance',
    },
    {
      ...reviewStepBase,
      guidanceKey: 'elected-official-wizard:wizard.steps.review.guidance',
    },
  ],
  filterExtensionData: (data: PersonFormData) => {
    const identity = composePersonExtension(data)
    return {
      // Person shared fields
      title_en: data.title_en !== '' ? data.title_en : undefined,
      title_ar: data.title_ar !== '' ? data.title_ar : undefined,
      photo_url: data.photo_url !== '' ? data.photo_url : undefined,
      biography_en: data.biography_en !== '' ? data.biography_en : undefined,
      biography_ar: data.biography_ar !== '' ? data.biography_ar : undefined,
      person_subtype: data.person_subtype,
      // Elected-official fields — send only populated values; empty strings become undefined
      office_name_en:
        data.office_name_en !== undefined && data.office_name_en !== ''
          ? data.office_name_en
          : undefined,
      office_name_ar:
        data.office_name_ar !== undefined && data.office_name_ar !== ''
          ? data.office_name_ar
          : undefined,
      district_en:
        data.district_en !== undefined && data.district_en !== '' ? data.district_en : undefined,
      district_ar:
        data.district_ar !== undefined && data.district_ar !== '' ? data.district_ar : undefined,
      party_en: data.party_en !== undefined && data.party_en !== '' ? data.party_en : undefined,
      party_ar: data.party_ar !== undefined && data.party_ar !== '' ? data.party_ar : undefined,
      term_start:
        data.term_start !== undefined && data.term_start !== '' ? data.term_start : undefined,
      term_end: data.term_end !== undefined && data.term_end !== '' ? data.term_end : undefined,
      country_id:
        data.country_id !== undefined && data.country_id !== '' ? data.country_id : undefined,
      organization_id:
        data.organization_id !== undefined && data.organization_id !== ''
          ? data.organization_id
          : undefined,
      // Phase 30 D-10: auto-derive is_current_term at submit time.
      // true if term_end is empty/null OR term_end >= today's ISO date (YYYY-MM-DD comparison is safe).
      is_current_term:
        data.term_end === undefined || data.term_end === ''
          ? true
          : data.term_end >= new Date().toISOString().slice(0, 10),
      // Phase 32 identity fields (mirrors personWizardConfig)
      honorific_en: identity.honorific_en,
      honorific_ar: identity.honorific_ar,
      first_name_en: identity.first_name_en,
      last_name_en: identity.last_name_en,
      first_name_ar: identity.first_name_ar,
      last_name_ar: identity.last_name_ar,
      known_as_en: identity.known_as_en,
      known_as_ar: identity.known_as_ar,
      nationality_country_id: identity.nationality_country_id,
      date_of_birth: identity.date_of_birth,
      gender: identity.gender,
    }
  },
}
