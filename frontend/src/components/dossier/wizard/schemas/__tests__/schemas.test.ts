import { describe, it, expect } from 'vitest'
import { baseDossierSchema } from '../base.schema'
import { countrySchema } from '../country.schema'
import { electedOfficialSchema } from '../elected-official.schema'
import * as schemaIndex from '../index'

describe('baseDossierSchema', () => {
  it('should validate a minimal valid dossier', () => {
    const result = baseDossierSchema.safeParse({
      name_en: 'Test',
      name_ar: 'اختبار',
    })
    expect(result.success).toBe(true)
  })

  it('should reject name_en shorter than 2 characters', () => {
    const result = baseDossierSchema.safeParse({
      name_en: 'X',
      name_ar: 'اختبار',
    })
    expect(result.success).toBe(false)
  })

  it('should default status to active', () => {
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
    const result = electedOfficialSchema.safeParse({
      name_en: 'Minister Name',
      name_ar: 'اسم الوزير',
      person_subtype: 'elected_official',
      office_title_en: 'Minister of Foreign Affairs',
    })
    expect(result.success).toBe(true)
  })

  it('should default person_subtype to elected_official', () => {
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
    expect(schemaIndex.baseDossierSchema).toBeDefined()
    expect(schemaIndex.countrySchema).toBeDefined()
    expect(schemaIndex.organizationSchema).toBeDefined()
    expect(schemaIndex.topicSchema).toBeDefined()
    expect(schemaIndex.personSchema).toBeDefined()
    expect(schemaIndex.forumSchema).toBeDefined()
    expect(schemaIndex.workingGroupSchema).toBeDefined()
    expect(schemaIndex.engagementSchema).toBeDefined()
    expect(schemaIndex.electedOfficialSchema).toBeDefined()
  })
})
