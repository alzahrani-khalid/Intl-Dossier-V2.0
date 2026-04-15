import type { WizardConfig } from './types'
import type { CountryFormData } from '../schemas/country.schema'
import { countrySchema } from '../schemas/country.schema'
import { getDefaultsForType } from '../defaults'

export const countryWizardConfig: WizardConfig<CountryFormData> = {
  type: 'country',
  schema: countrySchema,
  defaultValues: getDefaultsForType<CountryFormData>('country'),
  steps: [
    {
      id: 'basic',
      title: 'form-wizard:steps.basicInfo',
      description: 'form-wizard:steps.basicInfoDesc',
    },
    {
      id: 'country-details',
      title: 'form-wizard:steps.countryDetails',
      description: 'form-wizard:steps.countryDetailsDesc',
    },
    {
      id: 'review',
      title: 'form-wizard:steps.review',
      description: 'form-wizard:steps.reviewDesc',
    },
  ],
  filterExtensionData: (data: CountryFormData) => ({
    iso_code_2: data.iso_code_2 != null && data.iso_code_2 !== '' ? data.iso_code_2.toUpperCase() : undefined,
    iso_code_3: data.iso_code_3 != null && data.iso_code_3 !== '' ? data.iso_code_3.toUpperCase() : undefined,
    capital_en: data.capital_en !== '' ? data.capital_en : undefined,
    capital_ar: data.capital_ar !== '' ? data.capital_ar : undefined,
    region: data.region !== '' ? data.region : undefined,
  }),
}
