import type { WizardConfig } from './types'
import type { PersonFormData } from '../schemas/person.schema'
import { personSchema } from '../schemas/person.schema'
import { getDefaultsForType } from '../defaults'
import { getElectedOfficialDefaults } from '../defaults'

const basicStep = {
  id: 'basic',
  title: 'form-wizard:steps.basicInfo',
  description: 'form-wizard:steps.basicInfoDesc',
}

const personDetailsStep = {
  id: 'person-details',
  title: 'form-wizard:steps.personDetails',
  description: 'form-wizard:steps.personDetailsDesc',
}

const officeTermStep = {
  id: 'office-term',
  title: 'form-wizard:steps.officeTerm',
  description: 'form-wizard:steps.officeTermDesc',
}

const reviewStep = {
  id: 'review',
  title: 'form-wizard:steps.review',
  description: 'form-wizard:steps.reviewDesc',
}

// Standard person wizard (3 steps): Basic → Person Details → Review
export const personWizardConfig: WizardConfig<PersonFormData> = {
  type: 'person',
  schema: personSchema,
  defaultValues: getDefaultsForType<PersonFormData>('person'),
  steps: [basicStep, personDetailsStep, reviewStep],
  filterExtensionData: (data: PersonFormData) => ({
    title_en: data.title_en !== '' ? data.title_en : undefined,
    title_ar: data.title_ar !== '' ? data.title_ar : undefined,
    photo_url: data.photo_url !== '' ? data.photo_url : undefined,
    biography_en: data.biography_en !== '' ? data.biography_en : undefined,
    biography_ar: data.biography_ar !== '' ? data.biography_ar : undefined,
    person_subtype: data.person_subtype,
  }),
}

// Elected Official wizard variant (4 steps): Basic → Person Details → Office/Term → Review
// Phase 30 D-01, D-16, D-17 — same shell/hook, subtype-aware step array.
export const electedOfficialWizardConfig: WizardConfig<PersonFormData> = {
  type: 'person',
  schema: personSchema,
  defaultValues: getElectedOfficialDefaults(),
  steps: [basicStep, personDetailsStep, officeTermStep, reviewStep],
  filterExtensionData: (data: PersonFormData) => ({
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
  }),
}
