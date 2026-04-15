import * as z from 'zod'
import { personSchema } from './person.schema'

const electedOfficialFields = z.object({
  office_title_en: z.string().optional(),
  office_title_ar: z.string().optional(),
  term_start: z.string().optional().or(z.literal('')),
  term_end: z.string().optional().or(z.literal('')),
  constituency_en: z.string().optional(),
  constituency_ar: z.string().optional(),
  political_party: z.string().optional(),
})

export const electedOfficialSchema = personSchema
  .merge(electedOfficialFields)
  .extend({
    person_subtype: z
      .enum(['standard', 'elected_official'])
      .default('elected_official'),
  })

export type ElectedOfficialFormData = z.infer<typeof electedOfficialSchema>
