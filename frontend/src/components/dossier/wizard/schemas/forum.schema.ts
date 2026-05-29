import * as z from 'zod'
import { baseDossierSchema } from './base.schema'

const forumFields = z.object({
  // forum_type intentionally omitted: the `forums` table has no forum_type column.
  // To support forum categorization, add a `forums.forum_type` column (DB checkpoint)
  // and restore the field + its filterExtensionData mapping + step UI.
  organizing_body_id: z.string().uuid().optional().or(z.literal('')),
})

export const forumSchema = baseDossierSchema.merge(forumFields)
export type ForumFormData = z.infer<typeof forumSchema>
