import { describe, it, expect, beforeEach } from 'vitest'
import { migrateLegacyDraft } from '../useDraftMigration'

describe('migrateLegacyDraft', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should migrate old draft to per-type key when type field exists', () => {
    localStorage.setItem(
      'dossier-create-draft',
      JSON.stringify({
        type: 'country',
        name_en: 'Test Country',
        name_ar: 'دولة اختبار',
      }),
    )
    migrateLegacyDraft()
    expect(localStorage.getItem('dossier-create-country')).not.toBeNull()
    expect(localStorage.getItem('dossier-create-draft')).toBeNull()
  })

  it('should NOT migrate when type field is missing', () => {
    localStorage.setItem(
      'dossier-create-draft',
      JSON.stringify({
        name_en: 'No Type',
      }),
    )
    migrateLegacyDraft()
    // Old key should remain (not deleted)
    expect(localStorage.getItem('dossier-create-draft')).not.toBeNull()
  })

  it('should NOT overwrite existing per-type draft', () => {
    localStorage.setItem('dossier-create-country', JSON.stringify({ name_en: 'Existing' }))
    localStorage.setItem(
      'dossier-create-draft',
      JSON.stringify({
        type: 'country',
        name_en: 'Old Draft',
      }),
    )
    migrateLegacyDraft()
    const existing = JSON.parse(localStorage.getItem('dossier-create-country') ?? '{}')
    expect(existing.name_en).toBe('Existing')
  })

  it('should remove type field from migrated data', () => {
    localStorage.setItem(
      'dossier-create-draft',
      JSON.stringify({
        type: 'organization',
        name_en: 'Test Org',
      }),
    )
    migrateLegacyDraft()
    const migrated = JSON.parse(localStorage.getItem('dossier-create-organization') ?? '{}')
    expect(migrated).not.toHaveProperty('type')
    expect(migrated.name_en).toBe('Test Org')
  })

  it('should silently handle invalid JSON', () => {
    localStorage.setItem('dossier-create-draft', 'not-json')
    expect(() => migrateLegacyDraft()).not.toThrow()
  })
})
