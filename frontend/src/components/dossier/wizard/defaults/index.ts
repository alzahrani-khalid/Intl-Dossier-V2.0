import type { DossierType } from '@/services/dossier-api'
import type { CountryFormData } from '../schemas/country.schema'
import type { OrganizationFormData } from '../schemas/organization.schema'
import type { TopicFormData } from '../schemas/topic.schema'
import type { PersonFormData } from '../schemas/person.schema'
import type { ForumFormData } from '../schemas/forum.schema'
import type { WorkingGroupFormData } from '../schemas/working-group.schema'
import type { EngagementFormData } from '../schemas/engagement.schema'
import { baseDefaults } from './base.defaults'

export { baseDefaults } from './base.defaults'

const countryDefaults: CountryFormData = {
  ...baseDefaults,
  iso_code_2: '',
  iso_code_3: '',
  capital_en: '',
  capital_ar: '',
  region: '',
}

const organizationDefaults: OrganizationFormData = {
  ...baseDefaults,
  org_type: undefined,
  org_code: '',
  website: '',
  headquarters_en: '',
  headquarters_ar: '',
  founding_date: '',
}

const topicDefaults: TopicFormData = {
  ...baseDefaults,
  theme_category: undefined,
}

const personDefaults: PersonFormData = {
  ...baseDefaults,
  title_en: '',
  title_ar: '',
  photo_url: '',
  biography_en: '',
  biography_ar: '',
  person_subtype: 'standard' as const,
}

const electedOfficialDefaults: PersonFormData = {
  ...baseDefaults,
  title_en: '',
  title_ar: '',
  photo_url: '',
  biography_en: '',
  biography_ar: '',
  person_subtype: 'elected_official' as const,
  // Phase 30 D-15, D-17: elected-official defaults
  office_name_en: '',
  office_name_ar: '',
  district_en: '',
  district_ar: '',
  party_en: '',
  party_ar: '',
  term_start: '',
  term_end: '',
  country_id: '',
  organization_id: '',
  is_current_term: true,
}

const forumDefaults: ForumFormData = {
  ...baseDefaults,
  forum_type: '',
  organizing_body_id: '',
}

const workingGroupDefaults: WorkingGroupFormData = {
  ...baseDefaults,
  // wg_status is z.enum(...).optional(); empty string no longer satisfies the type.
  // undefined lets the Select show its placeholder until the user picks a value.
  wg_status: undefined,
  established_date: '',
  mandate_en: '',
  mandate_ar: '',
  parent_body_id: '',
}

const engagementDefaults: EngagementFormData = {
  ...baseDefaults,
  // engagement_type and engagement_category are required enums in the schema, but
  // we provide '' at draft/default-time because the user must pick a value before
  // submission. The empty string is cast to the enum type so react-hook-form's
  // defaultValues satisfies the EngagementFormData contract without losing the
  // runtime validation that engagementSchema enforces on submit.
  engagement_type: '' as EngagementFormData['engagement_type'],
  engagement_category: '' as EngagementFormData['engagement_category'],
  location_en: '',
  location_ar: '',
  start_date: '',
  end_date: '',
  participant_country_ids: [],
  participant_organization_ids: [],
  participant_person_ids: [],
}

// Phase 30 D-17: elected_official defaults are exported via getElectedOfficialDefaults().
// They share the 'person' DossierType but override person_subtype + seed ELOF-02 fields.

export function getDefaultsForType<T = Record<string, unknown>>(type: DossierType): T {
  const map: Record<DossierType, unknown> = {
    country: countryDefaults,
    organization: organizationDefaults,
    topic: topicDefaults,
    person: personDefaults,
    forum: forumDefaults,
    working_group: workingGroupDefaults,
    engagement: engagementDefaults,
  }
  return map[type] as T
}

/**
 * Phase 30 D-17: Defaults for the Elected Official wizard.
 * This is a Person variant (person_subtype='elected_official'), not a separate DossierType,
 * so it is fetched via a dedicated getter rather than the type-keyed map.
 */
export function getElectedOfficialDefaults(): PersonFormData {
  return electedOfficialDefaults
}
