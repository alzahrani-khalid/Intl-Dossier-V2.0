// POSITIVE-FAILURE FIXTURE for scripts/check-date-formatting.mjs — check 5.
// Deliberately violating. Scanned ONLY when the guard is pointed at this directory
// (`node scripts/check-date-formatting.mjs scripts/date-format-fixtures`); it is
// outside frontend/src, so no lint, type-check or build glob reaches it.
//
// The offence: date-fns relative time outside frontend/src/lib/format-date.ts.
// D-25 sanctions relative time on feed/timeline surfaces only, via formatRelativeTime.

declare function formatDistanceToNow(date: Date, options?: unknown): string

export function renderRecency(createdAt: Date): string {
  return formatDistanceToNow(createdAt, { addSuffix: true })
}
