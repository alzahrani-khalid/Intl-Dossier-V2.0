// POSITIVE-FAILURE FIXTURE for scripts/check-date-formatting.mjs — check 8.
// Deliberately violating. See relative-time.fixture.ts for the directory note.
//
// The offence: `.toLocaleString(` on a date receiver — host-locale formatting that
// bypasses the shared formatter. Both offender shapes the check must catch are
// planted: a snake_case `_at` property and a camelCase `…Date` identifier, the
// second of which a case-SENSITIVE token list would miss.

export function renderAssignedAt(assignment: { assigned_at: string }): string {
  return new Date(assignment.assigned_at).toLocaleString()
}

export function renderConflictStamp(clientTimestamp: string): string {
  const clientDate = new Date(clientTimestamp)
  return clientDate.toLocaleString()
}
