// POSITIVE-FAILURE FIXTURE for scripts/check-date-formatting.mjs — checks 9a + 9b.
// Deliberately violating. See relative-time.fixture.ts for the directory note.
//
// WITNESSED ESCAPE SHAPE #2 — THE IMPORTING-BUT-ESCAPING PARALLEL HELPER.
// `frontend/src/lib/i18n/relativeTime.ts` DID import date-fns and check 5 still did
// not catch it, because it imported `format`/`differenceInCalendarDays` rather than the
// relative-distance export check 5 names. The escape was drilled, not assumed: pointing at
// `frontend/src/lib/i18n` returned RC=0 with the named debt explicitly OFF.
//
// Two offences are planted: a parallel relative-time helper DECLARATION (9b) and an
// `Intl.RelativeTimeFormat` instance (9a) — the shape four dashboard widgets used,
// under function names (`formatDeadline`, `formatRelativeDate`, `getRelativeTime`)
// that no name-keyed enumeration would have found.

import { differenceInCalendarDays } from 'date-fns'

export function formatRelativeTimeShort(timestamp: Date, lang: string): string {
  const days = differenceInCalendarDays(new Date(), timestamp)
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' })
  return rtf.format(-days, 'day')
}
