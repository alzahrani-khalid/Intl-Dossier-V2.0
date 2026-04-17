import * as z from 'zod'
import { baseDossierSchema } from './base.schema'

// Phase 32 D-25: gender enum. SPEC out-of-scope excludes 'prefer not to say';
// DB CHECK constraint mirrors this ('female' | 'male' | NULL).
export const genderEnum = z.enum(['female', 'male'])

/**
 * Phase 32 D-25: 11 new identity fields (column-level optional — required-ness
 * is enforced via superRefine so DB columns can stay nullable per D-10).
 *
 * - `honorific_selection` is a form-only helper (NOT a DB column). It holds
 *   either a curated label ('Dr.', 'H.E.', …) or the 'Other' sentinel, and
 *   is resolved in filterExtensionData into honorific_en + honorific_ar.
 * - `nationality_id` is the form-field name per D-26. The rename to the
 *   DB column name `nationality_country_id` happens at submit boundary
 *   inside filterExtensionData (person.config.ts).
 * - `photo_url` is declared on the base person schema below; not re-declared here.
 */
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
  // Phase 32 D-25: 11 new identity fields.
  honorific_selection: z.string().optional(),
  honorific_en: z.string().optional(),
  honorific_ar: z.string().optional(),
  first_name_en: z.string().optional(),
  last_name_en: z.string().optional(),
  first_name_ar: z.string().optional(),
  last_name_ar: z.string().optional(),
  known_as_en: z.string().optional(),
  known_as_ar: z.string().optional(),
  nationality_id: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: genderEnum.optional(),
})

export const personSchema = baseDossierSchema.merge(personFields).superRefine((data, ctx) => {
  // ── Phase 32 D-25: person identity rules (apply to ALL person subtypes) ──

  // last_name_en required
  if (((data.last_name_en as string | undefined) ?? '').trim() === '') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['last_name_en'],
      message: 'last_name_required',
    })
  }
  // last_name_ar required
  if (((data.last_name_ar as string | undefined) ?? '').trim() === '') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['last_name_ar'],
      message: 'last_name_required',
    })
  }
  // nationality_id required (form-field name; rename to nationality_country_id at boundary — D-26)
  if (((data.nationality_id as string | undefined) ?? '').trim() === '') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['nationality_id'],
      message: 'nationality_required',
    })
  }
  // "Other" reveal — both EN + AR free-text must be populated when user picks Other
  if ((data.honorific_selection as string | undefined) === 'Other') {
    if (((data.honorific_en as string | undefined) ?? '').trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['honorific_en'],
        message: 'honorific_other_required',
      })
    }
    if (((data.honorific_ar as string | undefined) ?? '').trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['honorific_ar'],
        message: 'honorific_other_required',
      })
    }
  }

  // ── Phase 30 D-08, D-10, D-12: elected-official-specific required-ness ──
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
