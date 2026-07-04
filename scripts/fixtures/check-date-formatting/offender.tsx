// Positive-failure fixture for scripts/check-date-formatting.mjs (FMT-03 / D-82-03).
//
// This file is INTENTIONALLY non-compliant. It lives under scripts/fixtures/ so it is
// OUTSIDE frontend/src — never linted, type-checked, bundled, or scanned by the guard's
// default run. The guard's self-test retargets its scan root here via a CLI dir arg and
// MUST exit 1, naming each offending line below. If this file ever stops tripping the
// guard, the guard has regressed (a detection pattern broke) — do NOT "fix" this file.

import { format } from 'date-fns'

export function Offender({ date }: { date: Date }): string {
  // Check 1 — raw toLocaleDateString (must route through lib/format-date.ts instead).
  const dateStr = date.toLocaleDateString('en-US')

  // Check 2 — month-first date-fns literal (must be day-first: 'd MMM' / 'dd MMM yyyy').
  const dfns = format(date, 'MMM d, yyyy')

  // Check 3 — bare Indic-producing 'ar-SA' locale literal (must use toFormatLocale()).
  const indic = new Intl.NumberFormat('ar-SA').format(230)

  // Time check — raw toLocaleTimeString with a bare locale (must use toFormatLocale()).
  const timeStr = date.toLocaleTimeString('ar-SA')

  return `${dateStr} ${dfns} ${indic} ${timeStr}`
}
