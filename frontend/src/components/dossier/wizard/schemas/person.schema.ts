import * as z from 'zod'
import { baseDossierSchema } from './base.schema'

const personFields = z.object({
  title_en: z.string().optional(),
  title_ar: z.string().optional(),
  photo_url: z.string().url().optional().or(z.literal('')),
  biography_en: z.string().optional(),
  biography_ar: z.string().optional(),
  person_subtype: z
    .enum(['standard', 'elected_official'])
    .default('standard'),
})

export const personSchema = baseDossierSchema.merge(personFields)
export type PersonFormData = z.infer<typeof personSchema>
