/**
 * Phase 32 D-11 + D-15: unit tests for person-display helpers.
 */

import { describe, it, expect } from 'vitest'
import { formatPersonLabel, isoToFlagEmoji, nationalityBadgeText } from './person-display'

describe('formatPersonLabel', () => {
  it('returns "first last" with no honorific (en)', () => {
    expect(formatPersonLabel({ first_name_en: 'Test', last_name_en: 'Person' }, 'en')).toBe(
      'Test Person',
    )
  })

  it('prepends honorific when provided (en)', () => {
    expect(
      formatPersonLabel(
        { honorific_en: 'H.E.', first_name_en: 'Test', last_name_en: 'Person' },
        'en',
      ),
    ).toBe('H.E. Test Person')
  })

  it('returns only last name when first name is missing (D-07 single-word row)', () => {
    expect(formatPersonLabel({ last_name_en: 'Madonna' }, 'en')).toBe('Madonna')
  })

  it('returns "honorific last" when only honorific + last are populated', () => {
    expect(formatPersonLabel({ honorific_en: 'Dr.', last_name_en: 'Madonna' }, 'en')).toBe(
      'Dr. Madonna',
    )
  })

  it('falls back to dossiers.name_en for legacy rows (D-15)', () => {
    expect(formatPersonLabel({ name_en: 'Legacy Row Name' }, 'en')).toBe('Legacy Row Name')
  })

  it('falls back to dossiers.name_ar for legacy rows (D-15, ar locale)', () => {
    expect(formatPersonLabel({ name_ar: 'اسم قديم' }, 'ar')).toBe('اسم قديم')
  })

  it('composes Arabic label with honorific + first + last', () => {
    expect(
      formatPersonLabel(
        { first_name_ar: 'محمد', last_name_ar: 'الفيصل', honorific_ar: 'سعادة' },
        'ar',
      ),
    ).toBe('سعادة محمد الفيصل')
  })

  it('returns empty string when nothing is populated', () => {
    expect(formatPersonLabel({}, 'en')).toBe('')
    expect(formatPersonLabel({}, 'ar')).toBe('')
  })

  it('ignores whitespace-only fields (treats them as empty)', () => {
    expect(
      formatPersonLabel({ honorific_en: '   ', first_name_en: 'A', last_name_en: 'B' }, 'en'),
    ).toBe('A B')
  })

  it('only reads EN fields when locale is en', () => {
    expect(
      formatPersonLabel(
        {
          first_name_en: 'Test',
          last_name_en: 'Person',
          first_name_ar: 'تيست',
          last_name_ar: 'شخص',
        },
        'en',
      ),
    ).toBe('Test Person')
  })
})

describe('isoToFlagEmoji', () => {
  it('maps "SA" → Saudi Arabia flag', () => {
    expect(isoToFlagEmoji('SA')).toBe('🇸🇦')
  })

  it('maps "US" → United States flag', () => {
    expect(isoToFlagEmoji('US')).toBe('🇺🇸')
  })

  it('uppercases lowercase input', () => {
    expect(isoToFlagEmoji('sa')).toBe('🇸🇦')
  })

  it('returns "" for null / undefined / empty', () => {
    expect(isoToFlagEmoji(null)).toBe('')
    expect(isoToFlagEmoji(undefined)).toBe('')
    expect(isoToFlagEmoji('')).toBe('')
  })

  it('returns "" for non-2-letter inputs', () => {
    expect(isoToFlagEmoji('SAU')).toBe('')
    expect(isoToFlagEmoji('S')).toBe('')
    expect(isoToFlagEmoji('12')).toBe('')
    expect(isoToFlagEmoji('S1')).toBe('')
  })
})

describe('nationalityBadgeText', () => {
  it('returns "flag ISO2" for valid ISO-2', () => {
    expect(nationalityBadgeText('SA')).toBe('🇸🇦 SA')
  })

  it('returns "" for null / empty / invalid', () => {
    expect(nationalityBadgeText(null)).toBe('')
    expect(nationalityBadgeText(undefined)).toBe('')
    expect(nationalityBadgeText('')).toBe('')
    expect(nationalityBadgeText('SAU')).toBe('')
  })
})
