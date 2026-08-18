// POSITIVE-FAILURE FIXTURE for scripts/check-date-formatting.mjs — check 6.
// Deliberately violating. See relative-time.fixture.ts for why this directory is
// invisible to every other glob in the repo.
//
// The offence: date-fns LOCALIZED SKELETON literals. They render month-first
// (`Jan 10, 2024`) with no literal MMM token, so the month-first check (check 2)
// cannot see them. Canonical shape is `Tue 28 Apr` via formatDayFirst.

declare function format(date: Date, pattern: string, options?: unknown): string

export function renderLongDate(value: Date): string {
  return format(value, 'PPP')
}

export function renderDateTime(value: Date): string {
  return format(value, 'PPpp')
}

export function renderShortDate(value: Date): string {
  return format(value, 'PP')
}
