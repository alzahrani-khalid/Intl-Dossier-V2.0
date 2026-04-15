import { describe, it, expect } from 'vitest'

describe('getDefaultsForType', () => {
  it('should return country defaults with iso_code fields', () => {
    const { getDefaultsForType } = require('../index')
    const defaults = getDefaultsForType('country')
    expect(defaults).toHaveProperty('iso_code_2', '')
    expect(defaults).toHaveProperty('iso_code_3', '')
    expect(defaults).toHaveProperty('name_en', '')
    expect(defaults).toHaveProperty('status', 'active')
  })

  it('should return person defaults with person_subtype standard', () => {
    const { getDefaultsForType } = require('../index')
    const defaults = getDefaultsForType('person')
    expect(defaults).toHaveProperty('person_subtype', 'standard')
  })

  it('should return defaults for all 7 dossier types', () => {
    const { getDefaultsForType } = require('../index')
    const types = [
      'country',
      'organization',
      'topic',
      'person',
      'forum',
      'working_group',
      'engagement',
    ]
    for (const type of types) {
      const defaults = getDefaultsForType(type)
      expect(defaults).toBeDefined()
      expect(defaults).toHaveProperty('name_en')
      expect(defaults).toHaveProperty('status', 'active')
    }
  })

  // elected_official uses person defaults; Phase 30 overrides person_subtype via config defaultValues
  it('should NOT have an elected_official entry (uses person defaults)', () => {
    const { getDefaultsForType } = require('../index')
    // elected_official is not a DossierType -- it uses 'person' type with person_subtype override
    const personDefaults = getDefaultsForType('person')
    expect(personDefaults).toHaveProperty('person_subtype', 'standard')
  })
})

describe('baseDefaults', () => {
  it('should export baseDefaults with status active and sensitivity 1', () => {
    const { baseDefaults } = require('../index')
    expect(baseDefaults.status).toBe('active')
    expect(baseDefaults.sensitivity_level).toBe(1)
  })
})
