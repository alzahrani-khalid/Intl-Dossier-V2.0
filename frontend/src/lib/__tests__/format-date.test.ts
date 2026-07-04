/**
 * format-date — Wave-0 canonical formatter tests.
 * Policy D (Phase 82): Latin digits in BOTH locales; output byte-identical for
 * 'en' and 'ar'. Shapes: 'Tue 28 Apr' / '14:30 GST' / '28 Apr 2026' /
 * 'Tue 28 Apr 14:30 GST'; em-dash placeholder for nullish / invalid input.
 */
import { describe, it, expect } from 'vitest'
import { formatDayFirst, formatTime, formatDayFirstYear, formatDateTime } from '../format-date'

const AR_INDIC = /[٠-٩]/

describe('formatDayFirst', () => {
  it('formats a local time string as "Tue 28 Apr"', () => {
    // Local (no-Z) time string so the host timezone cannot shift the calendar day.
    expect(formatDayFirst('2026-04-28T12:00:00')).toBe('Tue 28 Apr')
  })

  it('is byte-identical for en and ar (Latin digits, no localized month)', () => {
    expect(formatDayFirst('2026-04-28T12:00:00', 'ar')).toBe('Tue 28 Apr')
  })

  it('returns the em-dash placeholder for nullish / invalid input', () => {
    expect(formatDayFirst(null as unknown as string)).toBe('—')
    expect(formatDayFirst(undefined as unknown as string)).toBe('—')
    expect(formatDayFirst('')).toBe('—')
    expect(formatDayFirst('not-a-date')).toBe('—')
  })
})

describe('formatTime', () => {
  it('formats a Z-instant as "14:30 GST" (24h, Asia/Dubai)', () => {
    // 10:30 UTC + 4h (Asia/Dubai) = 14:30 GST, deterministic on any host TZ.
    expect(formatTime('2026-04-28T10:30:00Z')).toBe('14:30 GST')
  })

  it('is byte-identical for ar (Latin digits)', () => {
    expect(formatTime('2026-04-28T10:30:00Z', 'ar')).toBe('14:30 GST')
  })

  it('returns the em-dash placeholder for nullish / invalid input', () => {
    expect(formatTime(null as unknown as string)).toBe('—')
    expect(formatTime(undefined as unknown as string)).toBe('—')
    expect(formatTime('')).toBe('—')
    expect(formatTime('not-a-date')).toBe('—')
  })
})

describe('formatDayFirstYear', () => {
  it('formats as "28 Apr 2026" (no weekday)', () => {
    expect(formatDayFirstYear('2026-04-28T12:00:00')).toBe('28 Apr 2026')
  })

  it('is byte-identical for ar', () => {
    expect(formatDayFirstYear('2026-04-28T12:00:00', 'ar')).toBe('28 Apr 2026')
  })

  it('returns the em-dash placeholder for nullish / invalid input', () => {
    expect(formatDayFirstYear(null as unknown as string)).toBe('—')
    expect(formatDayFirstYear(undefined as unknown as string)).toBe('—')
    expect(formatDayFirstYear('')).toBe('—')
    expect(formatDayFirstYear('not-a-date')).toBe('—')
  })
})

describe('formatDateTime', () => {
  it('composes day-first + time (TZ-robust shape)', () => {
    expect(formatDateTime('2026-04-28T10:30:00Z')).toMatch(
      /^[A-Z][a-z]{2} \d{2} [A-Z][a-z]{2} \d{2}:\d{2} GST$/,
    )
  })

  it('is byte-identical for ar', () => {
    expect(formatDateTime('2026-04-28T10:30:00Z', 'ar')).toMatch(
      /^[A-Z][a-z]{2} \d{2} [A-Z][a-z]{2} \d{2}:\d{2} GST$/,
    )
  })

  it('returns the em-dash placeholder for nullish / invalid input', () => {
    expect(formatDateTime(null as unknown as string)).toBe('—')
    expect(formatDateTime(undefined as unknown as string)).toBe('—')
    expect(formatDateTime('')).toBe('—')
    expect(formatDateTime('not-a-date')).toBe('—')
  })
})

describe('no Arabic-Indic digits in any helper (policy D)', () => {
  it.each([
    ['formatDayFirst', () => formatDayFirst('2026-04-28T12:00:00', 'ar')],
    ['formatTime', () => formatTime('2026-04-28T10:30:00Z', 'ar')],
    ['formatDayFirstYear', () => formatDayFirstYear('2026-04-28T12:00:00', 'ar')],
    ['formatDateTime', () => formatDateTime('2026-04-28T10:30:00Z', 'ar')],
  ])('%s emits no Arabic-Indic digits for locale ar', (_name, call) => {
    expect(AR_INDIC.test(call())).toBe(false)
  })
})
