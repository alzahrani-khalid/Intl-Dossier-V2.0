/**
 * Shared day-first date formatting per the IntelDossier content rules
 * (`CLAUDE.md`): dates render as `Tue 28 Apr` (day-first, no comma) and times as
 * `14:30 GST`. English keeps the established byte shapes; Arabic localizes the
 * weekday/month name tokens while retaining Latin digits. All absolute values
 * use the app's canonical GST zone (`Asia/Dubai`) so date-only DB values never
 * render off-by-one in a non-GST host and `formatDateTime`'s date + time stay on
 * the same calendar day.
 *
 * Policy D (Phase 82, DESIGN §7.4): Latin digits in BOTH English and Arabic.
 * AR-02 (Phase 99) supersedes Policy D's name-token half: Arabic now receives
 * Arabic names, while Policy D's Latin-digit half survives. The legacy `locale`
 * parameter is retained for positional consumers but does not select output;
 * the active i18n language is read at call time so a mid-session flip re-renders.
 */

import { format as formatDateFns, formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import i18n from 'i18next'
import { toFormatLocale } from '@/lib/format-locale'

// Read the package singleton initialized by `@/i18n` without importing the app
// bootstrap here. Formatter consumers can then load in isolation (including in
// tests with suite-local react-i18next mocks) while observing the same language.

const PLACEHOLDER = '—'
const GST_TIME_ZONE = 'Asia/Dubai'

// The legacy date-fns English-name literals are centralized here as the positive
// control for the AR-02 raw-site census. Callers choose a named helper, never a
// token string; Intl supplies Arabic names under ar and preserves these en shapes.
type AbsoluteDatePattern =
  | 'EEE dd MMM'
  | 'EEE d MMM'
  | 'dd MMM yyyy'
  | 'd MMM yyyy'
  | 'dd MMM'
  | 'd MMM'
  | 'EEE'
  | 'MMMM yyyy'

const DATE_OPTIONS: Readonly<Record<AbsoluteDatePattern, Intl.DateTimeFormatOptions>> = {
  'EEE dd MMM': { weekday: 'short', day: '2-digit', month: 'short' },
  'EEE d MMM': { weekday: 'short', day: 'numeric', month: 'short' },
  'dd MMM yyyy': { day: '2-digit', month: 'short', year: 'numeric' },
  'd MMM yyyy': { day: 'numeric', month: 'short', year: 'numeric' },
  'dd MMM': { day: '2-digit', month: 'short' },
  'd MMM': { day: 'numeric', month: 'short' },
  EEE: { weekday: 'short' },
  'MMMM yyyy': { month: 'long', year: 'numeric' },
}

function toDate(value: Date | string | number): Date | null {
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Arabic names with explicitly Latin digits; stable en-GB output otherwise. */
function activeFormatLocale(): string {
  const language = i18n.language ?? 'en'
  return language.startsWith('ar') ? toFormatLocale(language) : 'en-GB'
}

function formatAbsolute(date: Date | string | number, pattern: AbsoluteDatePattern): string {
  if (date === null || date === undefined || date === '') return PLACEHOLDER
  const d = toDate(date)
  if (d === null) return PLACEHOLDER
  return d.toLocaleDateString(activeFormatLocale(), {
    ...DATE_OPTIONS[pattern],
    timeZone: GST_TIME_ZONE,
  })
}

/**
 * Format a date as `Tue 28 Apr` (weekday, day-first, short month; no comma).
 * Returns an em-dash placeholder for nullish / invalid input. Arabic localizes
 * weekday/month names with Latin digits (AR-02, Phase 99); English is unchanged.
 */
export function formatDayFirst(date: Date | string | number, _locale?: string): string {
  return formatAbsolute(date, 'EEE dd MMM')
}

/**
 * Format a time as `14:30 GST` (24-hour, Gulf Standard Time / Asia/Dubai).
 * Returns an em-dash placeholder for nullish / invalid input. The active
 * language is read at call time; the GST suffix and Latin digits are unchanged.
 */
export function formatTime(date: Date | string | number, _locale?: string): string {
  if (date === null || date === undefined || date === '') return PLACEHOLDER
  const d = toDate(date)
  if (d === null) return PLACEHOLDER
  const formatted = d.toLocaleTimeString(activeFormatLocale(), {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: GST_TIME_ZONE,
  })
  return `${formatted} GST`
}

/**
 * Format a date as `28 Apr 2026` (day-first, short month, year; no weekday) for
 * archival dates (created-at, last-login, legislation, MoUs). Returns an em-dash
 * placeholder for nullish / invalid input. Arabic localizes its month name with
 * Latin digits (AR-02, Phase 99); English is byte-identical to the prior output.
 */
export function formatDayFirstYear(date: Date | string | number, _locale?: string): string {
  return formatAbsolute(date, 'dd MMM yyyy')
}

/**
 * Compose `Tue 28 Apr 14:30 GST` (day-first date + GST time, single space).
 * Returns the em-dash placeholder when the date part is nullish / invalid.
 * Arabic localizes weekday/month names with Latin digits; English is unchanged.
 */
export function formatDateTime(date: Date | string | number, _locale?: string): string {
  const day = formatDayFirst(date)
  return day === PLACEHOLDER ? PLACEHOLDER : `${day} ${formatTime(date)}`
}

/** Format `28 Apr` / its active-language equivalent (no leading day zero). */
export function formatDayMonth(date: Date | string | number): string {
  return formatAbsolute(date, 'd MMM')
}

/** Format `28 Apr 2026` / its active-language equivalent (no leading day zero). */
export function formatDayMonthYear(date: Date | string | number): string {
  return formatAbsolute(date, 'd MMM yyyy')
}

/** Format `Tue 28 Apr` with a non-padded day for the compact upcoming lane. */
export function formatWeekdayDayMonth(
  date: Date | string | number,
  language: string = i18n.language ?? 'en',
): string {
  if (date === null || date === undefined || date === '') return PLACEHOLDER
  const d = toDate(date)
  if (d === null) return PLACEHOLDER
  return formatDateFns(d, 'EEE d MMM', { locale: language.startsWith('ar') ? ar : undefined })
}

/** Format the localized short weekday name. */
export function formatWeekday(date: Date | string | number): string {
  return formatAbsolute(date, 'EEE')
}

/** Format `April 2026` / its active-language month-header equivalent. */
export function formatMonthYear(date: Date | string | number): string {
  return formatAbsolute(date, 'MMMM yyyy')
}

/** Format the reports-table shape `28 Apr 14:30`, localized at call time. */
export function formatDayMonthTime(date: Date | string | number): string {
  const day = formatAbsolute(date, 'dd MMM')
  if (day === PLACEHOLDER) return PLACEHOLDER
  const d = toDate(date)
  if (d === null) return PLACEHOLDER
  const time = d.toLocaleTimeString(activeFormatLocale(), {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: GST_TIME_ZONE,
  })
  return `${day} ${time}`
}

/**
 * Format a recency phrase (`3 days ago` / `قبل ٣ أيام`-shaped, Latin digits) in the
 * session language. Returns the em-dash placeholder for nullish / invalid input.
 *
 * D-25 SANCTION: relative time is allowed on **feed / timeline recency surfaces
 * only**, and only through this helper. Every other surface renders `formatDayFirst`
 * / `formatTime`. This is the single place in `frontend/src` where date-fns
 * `formatDistanceToNow` may be called — `scripts/check-date-formatting.mjs` fails
 * the build on any other call site.
 *
 * The language is read at CALL time from the i18n singleton so a mid-session
 * language flip re-renders in the new locale. Digits stay Latin (policy D) because
 * date-fns interpolates counts with plain `String()`; Arabic goes through the
 * date-fns `ar` locale OBJECT — never an Indic-producing locale-tag string, which
 * the guard bans outright.
 */
export function formatRelativeTime(value: string | Date | null | undefined): string {
  if (value === null || value === undefined || value === '') return PLACEHOLDER
  const d = toDate(value)
  if (d === null) return PLACEHOLDER
  const isArabic = i18n.language?.startsWith('ar') === true
  return formatDistanceToNow(d, { addSuffix: true, locale: isArabic ? ar : undefined })
}
