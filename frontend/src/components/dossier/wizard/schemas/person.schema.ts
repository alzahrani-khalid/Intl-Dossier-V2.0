import * as z from 'zod'
import { baseDossierSchema } from './base.schema'

const personFields = z.object({
  title_en: z.string().optional(),
  title_ar: z.string().optional(),
  photo_url: z.string().url().optional().or(z.literal('')),
  biography_en: z.string().optional(),
  biography_ar: z.string().optional(),
  person_subtype: z.enum(['standard', 'elected_official']).default('standard'),
  // Elected-official fields (Phase 30 D-15) — all optional at the column level;
  // required-ness for person_subtype='elected_official' is enforced via superRefine below.
  office_name_en: z.string().optional(),
  office_name_ar: z.string().optional(),
  district_en: z.string().optional(),
  district_ar: z.string().optional(),
  party_en: z.string().optional(),
  party_ar: z.string().optional(),
  term_start: z.string().optional(),
  term_end: z.string().optional(),
  country_id: z.string().optional(),
  organization_id: z.string().optional(),
  is_current_term: z.boolean().optional(),
})

export const personSchema = baseDossierSchema.merge(personFields).superRefine((data, ctx) => {
  // Phase 30 D-08, D-10, D-12: elected-official-specific required-ness
  if (data.person_subtype !== 'elected_official') return

  // At least one of office_name_en / office_name_ar
  const officeEn = (data.office_name_en ?? '').trim()
  const officeAr = (data.office_name_ar ?? '').trim()
  if (officeEn === '' && officeAr === '') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['office_name_en'],
      message: 'form-wizard:elected_official.validation.office_name_required',
    })
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['office_name_ar'],
      message: 'form-wizard:elected_official.validation.office_name_required',
    })
  }

  // country_id required
  if ((data.country_id ?? '').trim() === '') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['country_id'],
      message: 'form-wizard:elected_official.validation.country_required',
    })
  }

  // term_start required
  if ((data.term_start ?? '').trim() === '') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['term_start'],
      message: 'form-wizard:elected_official.validation.term_start_required',
    })
  }

  // term_end >= term_start when both present (D-11 — DB also enforces this)
  const termStart = data.term_start ?? ''
  const termEnd = data.term_end ?? ''
  if (termStart !== '' && termEnd !== '' && termEnd < termStart) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['term_end'],
      message: 'form-wizard:elected_official.validation.term_end_after_start',
    })
  }
})

export type PersonFormData = z.infer<typeof personSchema>
