/**
 * ISO 8601 week-of-year + week-year. Used by `<EngagementsList>` to group
 * engagements by week (Mon–Sun). Implementation follows the canonical algorithm
 * (Thursday-anchored) so dates near year boundaries land in the correct week.
 *
 * Returns `{ year, week }` where `week` is 1..53 and `year` is the ISO week-year
 * (which can differ from the calendar year for early-January / late-December dates).
 *
 * Also returns a stable `key` of the form `YYYY-Www` (e.g. `2026-W17`) for use
 * as a Map key / React `key` / data-testid suffix.
 */

export type ISOWeek = {
  year: number
  week: number
  /** Stable string key suitable for Map / React key, e.g. "2026-W17". */
  key: string
}

export function getISOWeek(input: Date | string): ISOWeek {
  const d = typeof input === 'string' ? new Date(input) : new Date(input.getTime())
  // Use UTC to avoid DST drift around year boundaries.
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  // Shift to Thursday of current week (ISO anchor): day 0 = Sunday.
  const dayNum = utc.getUTCDay() === 0 ? 7 : utc.getUTCDay()
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum)
  const year = utc.getUTCFullYear()
  const yearStart = new Date(Date.UTC(year, 0, 1))
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
  const key = `${year}-W${String(week).padStart(2, '0')}`
  return { year, week, key }
}
