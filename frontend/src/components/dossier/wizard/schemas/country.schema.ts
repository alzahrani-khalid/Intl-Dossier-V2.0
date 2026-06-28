import * as z from 'zod'
import { baseDossierSchema } from './base.schema'

// A-7: flag_url/population/area_sq_km/subregion are intentionally NOT collected here —
// they are derived (flag from ISO) or seed-managed. See
// docs/adr/0002-data-entry-deferred-decisions.md before adding fields.
const countryFields = z.object({
  iso_code_2: z.string().length(2, 'validation:isoCode2'),
  iso_code_3: z.string().length(3, 'validation:isoCode3'),
  capital_en: z.string().optional(),
  capital_ar: z.string().optional(),
  region: z.string().optional(),
})

export const countrySchema = baseDossierSchema.merge(countryFields)
export type CountryFormData = z.infer<typeof countrySchema>
