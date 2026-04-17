/**
 * personSchema superRefine unit tests (Phase 30 Plan 04, Task 2)
 *
 * Verifies the elected-official-specific validation rules added in Plan 30-01 D-15:
 *   - At least one of office_name_en / office_name_ar required
 *   - country_id required
 *   - term_start required
 *   - term_end >= term_start when both present
 *   - Standard persons unaffected by these rules
 */
import { describe, expect, it } from 'vitest'
import { personSchema, type PersonFormData } from '../person.schema'

// Baseline valid elected-official payload used for negative tests.
// sensitivity_level is a number (1–4) per base.schema.ts.
// Phase 32 D-25: baseline now also satisfies the identity-required rules
// (last_name_en/ar, nationality_id) since those apply to ALL person subtypes.
const validElectedOfficial: PersonFormData = {
  // base dossier fields
  name_en: 'Jane Doe',
  name_ar: 'جين دو',
  abbreviation: '',
  description_en: '',
  description_ar: '',
  status: 'active',
  sensitivity_level: 1,
  tags: [],
  // person fields
  title_en: '',
  title_ar: '',
  photo_url: '',
  biography_en: '',
  biography_ar: '',
  person_subtype: 'elected_official',
  // elected-official fields
  office_name_en: 'Minister of Foreign Affairs',
  office_name_ar: '',
  district_en: '',
  district_ar: '',
  party_en: '',
  party_ar: '',
  term_start: '2026-01-01',
  term_end: '',
  country_id: '00000000-0000-0000-0000-000000000001',
  organization_id: '',
  is_current_term: true,
  // Phase 32 D-25 identity fields (last_name_* + nationality_id required for all persons)
  honorific_selection: '',
  honorific_en: '',
  honorific_ar: '',
  first_name_en: 'Jane',
  last_name_en: 'Doe',
  first_name_ar: 'جين',
  last_name_ar: 'دو',
  known_as_en: '',
  known_as_ar: '',
  nationality_id: '00000000-0000-0000-0000-000000000099',
  date_of_birth: '',
} as PersonFormData

describe('personSchema superRefine (elected-official rules)', () => {
  it('passes with valid elected-official payload (EN office name only)', () => {
    const result = personSchema.safeParse(validElectedOfficial)
    expect(result.success).toBe(true)
  })

  it('passes with Arabic-only office_name (D-08 at-least-one rule)', () => {
    const result = personSchema.safeParse({
      ...validElectedOfficial,
      office_name_en: '',
      office_name_ar: 'وزير الخارجية',
    })
    expect(result.success).toBe(true)
  })

  it('fails when both office_name_en AND office_name_ar are empty for elected_official', () => {
    const result = personSchema.safeParse({
      ...validElectedOfficial,
      office_name_en: '',
      office_name_ar: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('office_name_en')
      expect(paths).toContain('office_name_ar')
      const messages = result.error.issues.map((i) => i.message)
      expect(messages.some((m) => m.includes('office_name_required'))).toBe(true)
    }
  })

  it('fails when country_id is empty for elected_official', () => {
    const result = personSchema.safeParse({
      ...validElectedOfficial,
      country_id: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('country_id')
      const messages = result.error.issues.map((i) => i.message)
      expect(messages.some((m) => m.includes('country_required'))).toBe(true)
    }
  })

  it('fails when term_start is empty for elected_official', () => {
    const result = personSchema.safeParse({
      ...validElectedOfficial,
      term_start: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('term_start')
      const messages = result.error.issues.map((i) => i.message)
      expect(messages.some((m) => m.includes('term_start_required'))).toBe(true)
    }
  })

  it('fails when term_end < term_start (D-11)', () => {
    const result = personSchema.safeParse({
      ...validElectedOfficial,
      term_start: '2026-06-01',
      term_end: '2026-01-01',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('term_end')
      const messages = result.error.issues.map((i) => i.message)
      expect(messages.some((m) => m.includes('term_end_after_start'))).toBe(true)
    }
  })

  it('passes when term_end is empty (ongoing term allowed)', () => {
    const result = personSchema.safeParse({
      ...validElectedOfficial,
      term_end: '',
    })
    expect(result.success).toBe(true)
  })

  it('does NOT apply elected-official rules to standard persons', () => {
    // Empty office_name, country_id, and term_start should all be fine for standard persons
    const standardPerson: PersonFormData = {
      ...validElectedOfficial,
      person_subtype: 'standard',
      office_name_en: '',
      office_name_ar: '',
      country_id: '',
      term_start: '',
    } as PersonFormData
    const result = personSchema.safeParse(standardPerson)
    expect(result.success).toBe(true)
  })

  it('passes when term_end equals term_start (same-day term boundary)', () => {
    const result = personSchema.safeParse({
      ...validElectedOfficial,
      term_start: '2026-06-01',
      term_end: '2026-06-01',
    })
    expect(result.success).toBe(true)
  })
})
