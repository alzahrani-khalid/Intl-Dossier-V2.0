import { describe, it, expect } from 'vitest'

describe('baseDossierSchema', () => {
  it('should validate a minimal valid dossier', () => {
    // Will import from ../base.schema once Plan 01 creates it
    const { baseDossierSchema } = require('../base.schema')
    const result = baseDossierSchema.safeParse({
      name_en: 'Test',
      name_ar: 'اختبار',
    })
    expect(result.success).toBe(true)
  })

  it('should reject name_en shorter than 2 characters', () => {
    const { baseDossierSchema } = require('../base.schema')
    const result = baseDossierSchema.safeParse({
      name_en: 'X',
      name_ar: 'اختبار',
    })
    expect(result.success).toBe(false)
  })

  it('should default status to active', () => {
    const { baseDossierSchema } = require('../base.schema')
    const result = baseDossierSchema.safeParse({
      name_en: 'Test',
      name_ar: 'اختبار',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('active')
    }
  })
})

describe('countrySchema', () => {
  it('should include base fields and country-specific fields', () => {
    const { countrySchema } = require('../country.schema')
    const result = countrySchema.safeParse({
      name_en: 'Saudi Arabia',
      name_ar: 'المملكة العربية السعودية',
      iso_code_2: 'SA',
      iso_code_3: 'SAU',
    })
    expect(result.success).toBe(true)
  })
})

describe('electedOfficialSchema', () => {
  it('should extend person schema (not base)', () => {
    const { electedOfficialSchema } = require('../elected-official.schema')
    const result = electedOfficialSchema.safeParse({
      name_en: 'Minister Name',
      name_ar: 'اسم الوزير',
      person_subtype: 'elected_official',
      office_title_en: 'Minister of Foreign Affairs',
    })
    expect(result.success).toBe(true)
  })

  it('should default person_subtype to elected_official', () => {
    const { electedOfficialSchema } = require('../elected-official.schema')
    const result = electedOfficialSchema.safeParse({
      name_en: 'Minister Name',
      name_ar: 'اسم الوزير',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.person_subtype).toBe('elected_official')
    }
  })
})

describe('schemas/index', () => {
  it('should re-export all 9 schemas', () => {
    const index = require('../index')
    expect(index.baseDossierSchema).toBeDefined()
    expect(index.countrySchema).toBeDefined()
    expect(index.organizationSchema).toBeDefined()
    expect(index.topicSchema).toBeDefined()
    expect(index.personSchema).toBeDefined()
    expect(index.forumSchema).toBeDefined()
    expect(index.workingGroupSchema).toBeDefined()
    expect(index.engagementSchema).toBeDefined()
    expect(index.electedOfficialSchema).toBeDefined()
  })
})
