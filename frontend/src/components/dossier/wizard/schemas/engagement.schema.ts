import * as z from 'zod'
import { baseDossierSchema } from './base.schema'

const engagementFields = z.object({
  engagement_type: z.string().optional(),
  engagement_category: z.string().optional(),
  location_en: z.string().optional(),
  location_ar: z.string().optional(),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
  participant_ids: z.array(z.string()).optional(),
})

export const engagementSchema = baseDossierSchema.merge(engagementFields)
export type EngagementFormData = z.infer<typeof engagementSchema>
