/**
 * Shared day-first date formatting per the IntelDossier content rules
 * (`CLAUDE.md`): dates render as `Tue 28 Apr` (day-first, no comma) and times as
 * `14:30 GST`. Always formatted with the `en-GB` locale so the mono numeric /
 * short-month shape is byte-identical regardless of UI language, and always in
 * the app's canonical GST zone (`Asia/Dubai`) so date-only DB values never render
 * off-by-one in a non-GST host and `formatDateTime`'s date + time stay on the same
 * calendar day.
 *
 * Policy D (Phase 82, DESIGN §7.4): Latin digits in BOTH English and Arabic.
 * The `locale` parameter is retained (13 consumer files pass it positionally)
 * but no longer alters the output — there is deliberately no Arabic-Indic digit
 * swap. `formatDayFirst(d)` and `formatDayFirst(d, 'ar')` return the same string.
 */

const PLACEHOLDER = '—'

function toDate(value: Date | string | number): Date | null {
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Format a date as `Tue 28 Apr` (weekday, day-first, short month; no comma).
 * Returns an em-dash placeholder for nullish / invalid input. Output is Latin
 * and byte-identical for `en` and `ar` (policy D — `_locale` is unused).
 */
export function formatDayFirst(date: Date | string | number, _locale?: string): string {
  if (date === null || date === undefined || date === '') return PLACEHOLDER
  const d = toDate(date)
  if (d === null) return PLACEHOLDER
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    timeZone: 'Asia/Dubai',
  })
}

/**
 * Format a time as `14:30 GST` (24-hour, Gulf Standard Time / Asia/Dubai).
 * Returns an em-dash placeholder for nullish / invalid input. Output is Latin
 * and byte-identical for `en` and `ar` (policy D — `_locale` is unused).
 */
export function formatTime(date: Date | string | number, _locale?: string): string {
  if (date === null || date === undefined || date === '') return PLACEHOLDER
  const d = toDate(date)
  if (d === null) return PLACEHOLDER
  const formatted = d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Dubai',
  })
  return `${formatted} GST`
}

/**
 * Format a date as `28 Apr 2026` (day-first, short month, year; no weekday) for
 * archival dates (created-at, last-login, legislation, MoUs). Returns an em-dash
 * placeholder for nullish / invalid input. Latin, byte-identical across locales.
 */
export function formatDayFirstYear(date: Date | string | number, _locale?: string): string {
  if (date === null || date === undefined || date === '') return PLACEHOLDER
  const d = toDate(date)
  if (d === null) return PLACEHOLDER
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Dubai',
  })
}

/**
 * Compose `Tue 28 Apr 14:30 GST` (day-first date + GST time, single space).
 * Returns the em-dash placeholder when the date part is nullish / invalid.
 * Latin, byte-identical across locales.
 */
export function formatDateTime(date: Date | string | number, _locale?: string): string {
  const day = formatDayFirst(date)
  return day === PLACEHOLDER ? PLACEHOLDER : `${day} ${formatTime(date)}`
}
