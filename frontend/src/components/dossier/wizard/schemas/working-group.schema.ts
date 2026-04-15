import * as z from 'zod'
import { baseDossierSchema } from './base.schema'

const workingGroupFields = z.object({
  wg_status: z.string().optional(),
  established_date: z.string().optional().or(z.literal('')),
  mandate_en: z.string().optional(),
  mandate_ar: z.string().optional(),
  parent_body_id: z.string().uuid().optional().or(z.literal('')),
})

export const workingGroupSchema = baseDossierSchema.merge(workingGroupFields)
export type WorkingGroupFormData = z.infer<typeof workingGroupSchema>
