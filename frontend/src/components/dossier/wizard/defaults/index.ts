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

const forumDefaults: ForumFormData = {
  ...baseDefaults,
  forum_type: '',
  organizing_body_id: '',
}

const workingGroupDefaults: WorkingGroupFormData = {
  ...baseDefaults,
  // Plan 29-04 tightened wg_status from z.string() to z.enum(...).optional().
  // Empty-string default no longer satisfies the type, and the user must pick
  // a value anyway. Use undefined so Select shows placeholder.
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

// NOTE: elected_official is not a DossierType. Phase 30 uses getDefaultsForType('person')
// and overrides person_subtype to 'elected_official' via the wizard config's defaultValues.

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
