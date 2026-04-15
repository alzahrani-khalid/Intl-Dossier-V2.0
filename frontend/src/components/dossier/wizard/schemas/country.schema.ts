import * as z from 'zod'
import { baseDossierSchema } from './base.schema'

const countryFields = z.object({
  iso_code_2: z.string().length(2).optional().or(z.literal('')),
  iso_code_3: z.string().length(3).optional().or(z.literal('')),
  capital_en: z.string().optional(),
  capital_ar: z.string().optional(),
  region: z.string().optional(),
})

export const countrySchema = baseDossierSchema.merge(countryFields)
export type CountryFormData = z.infer<typeof countrySchema>
