import type { BaseDossierFormData } from '../schemas/base.schema'

export const baseDefaults: BaseDossierFormData = {
  name_en: '',
  name_ar: '',
  abbreviation: '',
  description_en: '',
  description_ar: '',
  status: 'active',
  sensitivity_level: 1,
  tags: [],
}
