import type { WizardConfig } from './types'
import type { PersonFormData } from '../schemas/person.schema'
import { personSchema } from '../schemas/person.schema'
import { getDefaultsForType } from '../defaults'

export const personWizardConfig: WizardConfig<PersonFormData> = {
  type: 'person',
  schema: personSchema,
  defaultValues: getDefaultsForType<PersonFormData>('person'),
  steps: [
    {
      id: 'basic',
      title: 'form-wizard:steps.basicInfo',
      description: 'form-wizard:steps.basicInfoDesc',
    },
    {
      id: 'person-details',
      title: 'form-wizard:steps.personDetails',
      description: 'form-wizard:steps.personDetailsDesc',
    },
    {
      id: 'review',
      title: 'form-wizard:steps.review',
      description: 'form-wizard:steps.reviewDesc',
    },
  ],
  filterExtensionData: (data: PersonFormData) => ({
    title_en: data.title_en !== '' ? data.title_en : undefined,
    title_ar: data.title_ar !== '' ? data.title_ar : undefined,
    photo_url: data.photo_url !== '' ? data.photo_url : undefined,
    biography_en: data.biography_en !== '' ? data.biography_en : undefined,
    biography_ar: data.biography_ar !== '' ? data.biography_ar : undefined,
    person_subtype: data.person_subtype,
  }),
}
