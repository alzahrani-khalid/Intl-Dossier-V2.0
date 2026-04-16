import * as z from 'zod'
import { baseDossierSchema } from './base.schema'

const organizationFields = z.object({
  org_type: z
    .enum(['government', 'ngo', 'private', 'international', 'academic'])
    .optional(),
  org_code: z.string().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  headquarters_en: z.string().optional(),
  headquarters_ar: z.string().optional(),
  founding_date: z.string().optional().or(z.literal('')),
})

export const organizationSchema = baseDossierSchema.merge(organizationFields)
export type OrganizationFormData = z.infer<typeof organizationSchema>
