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
  wg_status: '',
  established_date: '',
  mandate_en: '',
  mandate_ar: '',
  parent_body_id: '',
}

const engagementDefaults: EngagementFormData = {
  ...baseDefaults,
  engagement_type: '',
  engagement_category: '',
  location_en: '',
  location_ar: '',
  start_date: '',
  end_date: '',
  participant_ids: [],
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
