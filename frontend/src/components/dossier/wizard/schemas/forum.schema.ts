import * as z from 'zod'
import { baseDossierSchema } from './base.schema'

const forumFields = z.object({
  forum_type: z.string().optional(),
  organizing_body_id: z.string().uuid().optional().or(z.literal('')),
})

export const forumSchema = baseDossierSchema.merge(forumFields)
export type ForumFormData = z.infer<typeof forumSchema>
