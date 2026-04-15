import * as z from 'zod'
import { baseDossierSchema } from './base.schema'

const topicFields = z.object({
  theme_category: z
    .enum(['policy', 'technical', 'strategic', 'operational'])
    .optional(),
})

export const topicSchema = baseDossierSchema.merge(topicFields)
export type TopicFormData = z.infer<typeof topicSchema>
