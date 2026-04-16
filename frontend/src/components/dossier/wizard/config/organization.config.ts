import type { WizardConfig } from './types'
import type { OrganizationFormData } from '../schemas/organization.schema'
import { organizationSchema } from '../schemas/organization.schema'
import { getDefaultsForType } from '../defaults'

export const organizationWizardConfig: WizardConfig<OrganizationFormData> = {
  type: 'organization',
  schema: organizationSchema,
  defaultValues: getDefaultsForType<OrganizationFormData>('organization'),
  steps: [
    {
      id: 'basic',
      title: 'form-wizard:steps.basicInfo',
      description: 'form-wizard:steps.basicInfoDesc',
    },
    {
      id: 'org-details',
      title: 'form-wizard:steps.orgDetails',
      description: 'form-wizard:steps.orgDetailsDesc',
    },
    {
      id: 'review',
      title: 'form-wizard:steps.review',
      description: 'form-wizard:steps.reviewDesc',
    },
  ],
  filterExtensionData: (data: OrganizationFormData) => ({
    org_type: data.org_type,
    org_code: data.org_code !== '' ? data.org_code : undefined,
    website: data.website !== '' ? data.website : undefined,
    address_en: data.headquarters_en !== '' ? data.headquarters_en : undefined,
    address_ar: data.headquarters_ar !== '' ? data.headquarters_ar : undefined,
    established_date: data.founding_date !== '' ? data.founding_date : undefined,
  }),
}
