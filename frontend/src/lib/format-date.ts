import { toArDigits } from '@/lib/i18n/toArDigits'

/**
 * Shared day-first date formatting per the IntelDossier content rules
 * (`CLAUDE.md`): dates render as `Tue 28 Apr` (day-first, no comma) and times as
 * `14:30 GST`. Always formatted with the `en-GB` locale to keep the mono
 * numeric / short-month shape identical regardless of UI language; Arabic-Indic
 * digit swapping is applied afterwards via `toArDigits` when locale is `ar`.
 */

const PLACEHOLDER = '—'

function toDate(value: Date | string | number): Date | null {
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function normalizeLocale(locale?: string): 'ar' | 'en' {
  return locale === 'ar' ? 'ar' : 'en'
}

/**
 * Format a date as `Tue 28 Apr` (weekday, day-first, short month; no comma).
 * Returns an em-dash placeholder for nullish / invalid input. When `locale` is
 * `ar`, Western numerals are swapped for Arabic-Indic digits.
 */
export function formatDayFirst(date: Date | string | number, locale?: string): string {
  if (date === null || date === undefined || date === '') return PLACEHOLDER
  const d = toDate(date)
  if (d === null) return PLACEHOLDER
  const formatted = d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })
  return toArDigits(formatted, normalizeLocale(locale))
}

/**
 * Format a time as `14:30 GST` (24-hour, Gulf Standard Time). Returns an
 * em-dash placeholder for nullish / invalid input. When `locale` is `ar`,
 * Western numerals are swapped for Arabic-Indic digits.
 */
export function formatTime(date: Date | string | number, locale?: string): string {
  if (date === null || date === undefined || date === '') return PLACEHOLDER
  const d = toDate(date)
  if (d === null) return PLACEHOLDER
  const formatted = d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Dubai',
  })
  return `${toArDigits(formatted, normalizeLocale(locale))} GST`
}
