import { describe, it, expect } from 'vitest'
import { toArDigits } from '../toArDigits'

describe('toArDigits', () => {
  it('returns the string unchanged for non-Arabic locales', () => {
    expect(toArDigits('123', 'en')).toBe('123')
  })

  it('returns the string unchanged for unknown locales', () => {
    expect(toArDigits('27', 'fr')).toBe('27')
  })

  it('transforms Western digits to Arabic-Indic digits when lang is ar', () => {
    expect(toArDigits('123', 'ar')).toBe('١٢٣')
  })

  it('handles numeric zero (number input) for ar locale', () => {
    expect(toArDigits(0, 'ar')).toBe('٠')
  })

  it('preserves non-digit characters and only transforms digits (date string)', () => {
    expect(toArDigits('25 Apr', 'ar')).toBe('٢٥ Apr')
  })

  it('preserves letters in mixed strings (overdue chip)', () => {
    expect(toArDigits('Overdue 62d', 'ar')).toBe('Overdue ٦٢d')
  })

  it('handles numeric input for ar locale', () => {
    expect(toArDigits(147, 'ar')).toBe('١٤٧')
  })

  it('handles numeric input for en locale', () => {
    expect(toArDigits(147, 'en')).toBe('147')
  })

  it('handles empty string', () => {
    expect(toArDigits('', 'ar')).toBe('')
    expect(toArDigits('', 'en')).toBe('')
  })

  it('transforms all 10 digits correctly in ar locale', () => {
    expect(toArDigits('0123456789', 'ar')).toBe('٠١٢٣٤٥٦٧٨٩')
  })
})
