/**
 * relativeTime — formatRelativeTimeShort unit tests.
 * Source contract: 41-RESEARCH.md §5 / 41-01-PLAN.md Task 1 behavior.
 */
import { describe, it, expect } from 'vitest'
import { formatRelativeTimeShort } from '../relativeTime'

describe('formatRelativeTimeShort', () => {
  it('returns HH:mm for same calendar day in en', () => {
    const now = new Date('2026-05-02T15:00:00Z')
    // Compose a timestamp that is the same calendar day in local TZ as `now`.
    const sameDay = new Date(now)
    sameDay.setHours(9, 42, 0, 0)
    const got = formatRelativeTimeShort(sameDay, 'en', now)
    expect(got).toBe('09:42')
  })

  it('returns yday/أمس for 1 day ago', () => {
    const now = new Date('2026-05-02T12:00:00Z')
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    expect(formatRelativeTimeShort(yesterday, 'en', now)).toBe('yday')
    expect(formatRelativeTimeShort(yesterday, 'ar', now)).toBe('أمس')
  })

  it('returns Nd / N+ي for 2..7 days ago', () => {
    const now = new Date('2026-05-10T12:00:00Z')
    const threeDaysAgo = new Date(now)
    threeDaysAgo.setDate(now.getDate() - 3)
    expect(formatRelativeTimeShort(threeDaysAgo, 'en', now)).toBe('3d')
    expect(formatRelativeTimeShort(threeDaysAgo, 'ar', now)).toBe('٣ي')
  })

  it('returns localized "d MMM" for > 7 days ago in en', () => {
    const now = new Date('2026-05-10T12:00:00Z')
    const tenDaysAgo = new Date(now)
    tenDaysAgo.setDate(now.getDate() - 10)
    const got = formatRelativeTimeShort(tenDaysAgo, 'en', now)
    expect(got).toMatch(/^\d+ \w{3}$/)
  })

  it('returns Arabic-Indic digits for "d MMM" in ar', () => {
    const now = new Date('2026-05-10T12:00:00Z')
    const tenDaysAgo = new Date(now)
    tenDaysAgo.setDate(now.getDate() - 10)
    const got = formatRelativeTimeShort(tenDaysAgo, 'ar', now)
    // No Western digits should remain.
    expect(/[0-9]/.test(got)).toBe(false)
    // Should contain at least one Arabic-Indic digit.
    expect(/[٠-٩]/.test(got)).toBe(true)
  })

  it('returns em-dash placeholder for invalid input', () => {
    expect(formatRelativeTimeShort('not-a-date', 'en')).toBe('—')
  })
})
