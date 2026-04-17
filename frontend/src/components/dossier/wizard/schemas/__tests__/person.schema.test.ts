/**
 * personSchema — Phase 32 identity rules (Plan 32-02, Task 8)
 *
 * Verifies the D-25 superRefine rules added for PBI-01..PBI-03:
 *   - empty nationality_id → issue at path ['nationality_id'] / message 'nationality_required'
 *   - empty last_name_en / last_name_ar → 'last_name_required'
 *   - gender NOT in ['female','male'] → zod enum parse failure (or custom 'gender_invalid')
 *   - honorific_selection = 'Other' with empty honorific_en/ar → 'honorific_other_required'
 *   - omitted DOB / gender / first_name / known_as_* → valid
 *   - curated honorific ('Dr.') → no honorific issue
 */
import { describe, expect, it } from 'vitest'
import { personSchema, type PersonFormData } from '../person.schema'

// Baseline valid standard-person identity payload used for negative tests.
const baseValid: PersonFormData = {
  name_en: 'Jane Doe',
  name_ar: 'جين دو',
  abbreviation: '',
  description_en: '',
  description_ar: '',
  status: 'active',
  sensitivity_level: 1,
  tags: [],
  title_en: '',
  title_ar: '',
  photo_url: '',
  biography_en: '',
  biography_ar: '',
  person_subtype: 'standard',
  honorific_selection: '',
  honorific_en: '',
  honorific_ar: '',
  first_name_en: 'Jane',
  last_name_en: 'Doe',
  first_name_ar: 'جين',
  last_name_ar: 'دو',
  known_as_en: '',
  known_as_ar: '',
  nationality_id: '00000000-0000-0000-0000-000000000001',
  date_of_birth: '',
} as PersonFormData

describe('personSchema — Phase 32 identity rules (D-25)', () => {
  it('accepts a valid standard-person payload with required identity fields', () => {
    const result = personSchema.safeParse(baseValid)
    expect(result.success).toBe(true)
  })

  it('fails with empty nationality_id — path + message match', () => {
    const result = personSchema.safeParse({ ...baseValid, nationality_id: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.join('.') === 'nationality_id')
      expect(issue).toBeDefined()
      expect(issue?.message).toBe('nationality_required')
    }
  })

  it('fails when last_name_en is empty — message is last_name_required', () => {
    const result = personSchema.safeParse({ ...baseValid, last_name_en: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.join('.') === 'last_name_en')
      expect(issue).toBeDefined()
      expect(issue?.message).toBe('last_name_required')
    }
  })

  it('fails when last_name_ar is empty — message is last_name_required', () => {
    const result = personSchema.safeParse({ ...baseValid, last_name_ar: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.join('.') === 'last_name_ar')
      expect(issue).toBeDefined()
      expect(issue?.message).toBe('last_name_required')
    }
  })

  it("rejects gender='other' (enum only permits female|male)", () => {
    const result = personSchema.safeParse({
      ...baseValid,
      gender: 'other' as unknown as 'female' | 'male',
    })
    expect(result.success).toBe(false)
  })

  it('accepts omitted DOB (optional)', () => {
    const { date_of_birth: _dob, ...rest } = baseValid
    const result = personSchema.safeParse(rest as PersonFormData)
    expect(result.success).toBe(true)
  })

  it('accepts omitted gender (optional)', () => {
    const result = personSchema.safeParse(baseValid)
    expect(result.success).toBe(true)
  })

  it('accepts gender=female', () => {
    const result = personSchema.safeParse({ ...baseValid, gender: 'female' })
    expect(result.success).toBe(true)
  })

  it('accepts gender=male', () => {
    const result = personSchema.safeParse({ ...baseValid, gender: 'male' })
    expect(result.success).toBe(true)
  })

  it('accepts omitted first_name_en / first_name_ar / known_as_* (all optional)', () => {
    const result = personSchema.safeParse({
      ...baseValid,
      first_name_en: '',
      first_name_ar: '',
      known_as_en: '',
      known_as_ar: '',
    })
    expect(result.success).toBe(true)
  })

  it('fails when honorific_selection="Other" with empty honorific_en', () => {
    const result = personSchema.safeParse({
      ...baseValid,
      honorific_selection: 'Other',
      honorific_en: '',
      honorific_ar: 'سعادة',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.join('.') === 'honorific_en')
      expect(issue).toBeDefined()
      expect(issue?.message).toBe('honorific_other_required')
    }
  })

  it('fails when honorific_selection="Other" with empty honorific_ar', () => {
    const result = personSchema.safeParse({
      ...baseValid,
      honorific_selection: 'Other',
      honorific_en: 'Eminence',
      honorific_ar: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.join('.') === 'honorific_ar')
      expect(issue).toBeDefined()
      expect(issue?.message).toBe('honorific_other_required')
    }
  })

  it('accepts curated honorific selection "Dr." without free-text inputs', () => {
    const result = personSchema.safeParse({
      ...baseValid,
      honorific_selection: 'Dr.',
      honorific_en: '',
      honorific_ar: '',
    })
    expect(result.success).toBe(true)
  })

  it('accepts whitespace-only values as empty for required identity fields (trim then require)', () => {
    const result = personSchema.safeParse({
      ...baseValid,
      last_name_en: '   ',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.join('.') === 'last_name_en')
      expect(issue?.message).toBe('last_name_required')
    }
  })
})
