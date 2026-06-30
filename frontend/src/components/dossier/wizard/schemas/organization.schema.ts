import * as z from 'zod'
import { baseDossierSchema } from './base.schema'

const organizationFields = z.object({
  org_type: z.enum(['government', 'ngo', 'private', 'international', 'academic'], {
    message: 'validation:required',
  }),
  org_code: z.string().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  headquarters_en: z.string().optional(),
  headquarters_ar: z.string().optional(),
  founding_date: z.string().optional().or(z.literal('')),
  // 260629-jkn: membership & representation profile. Enums stay OPTIONAL and also
  // accept '' so the controlled Selects can render an empty placeholder state.
  membership_type: z
    .enum(['board_of_directors', 'member', 'participant', 'counterpart_agency'])
    .optional()
    .or(z.literal('')),
  importance: z.enum(['high', 'medium', 'low']).optional().or(z.literal('')),
  representation_level: z.enum(['president', 'specialist']).optional().or(z.literal('')),
  // GASTAT focal points — flat officer fields, composed into jsonb at submit.
  responsible_name_en: z.string().optional(),
  responsible_name_ar: z.string().optional(),
  responsible_user_id: z.string().optional(),
  alternate_name_en: z.string().optional(),
  alternate_name_ar: z.string().optional(),
  alternate_user_id: z.string().optional(),
  support_name_en: z.string().optional(),
  support_name_ar: z.string().optional(),
  support_user_id: z.string().optional(),
})

export const organizationSchema = baseDossierSchema.merge(organizationFields)
export type OrganizationFormData = z.infer<typeof organizationSchema>
