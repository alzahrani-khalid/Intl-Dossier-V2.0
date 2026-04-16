import * as z from 'zod'
import { baseDossierSchema } from './base.schema'

const engagementFields = z.object({
  engagement_type: z.enum([
    'bilateral_meeting',
    'mission',
    'delegation',
    'summit',
    'working_group',
    'roundtable',
    'official_visit',
    'consultation',
    'forum_session',
    'other',
  ]),
  engagement_category: z.enum([
    'diplomatic',
    'statistical',
    'technical',
    'economic',
    'cultural',
    'educational',
    'research',
    'other',
  ]),
  location_en: z.string().optional(),
  location_ar: z.string().optional(),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  participant_country_ids: z.array(z.string().uuid()).default([]),
  participant_organization_ids: z.array(z.string().uuid()).default([]),
  participant_person_ids: z.array(z.string().uuid()).default([]),
})

export const engagementSchema = baseDossierSchema
  .merge(engagementFields)
  .refine((d) => !d.end_date || !d.start_date || d.end_date >= d.start_date, {
    message: 'form-wizard:validation.end_after_start',
    path: ['end_date'],
  })

export type EngagementFormData = z.infer<typeof engagementSchema>
