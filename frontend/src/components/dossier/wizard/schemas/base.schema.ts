import * as z from 'zod'

export const baseDossierSchema = z.object({
  name_en: z.string().min(2, { message: 'English name must be at least 2 characters' }),
  name_ar: z.string().min(2, { message: 'Arabic name must be at least 2 characters' }),
  abbreviation: z
    .string()
    .max(20, { message: 'Abbreviation must be at most 20 characters' })
    .optional()
    .or(z.literal('')),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived', 'deleted']).default('active'),
  sensitivity_level: z.number().min(1).max(4).default(1),
  tags: z.array(z.string()).optional(),
})

export type BaseDossierFormData = z.infer<typeof baseDossierSchema>
