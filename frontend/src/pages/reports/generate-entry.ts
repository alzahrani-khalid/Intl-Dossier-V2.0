/**
 * Phase 94 Plan 09 (RULING-P94-04 §PARK-94-06) — the generated-report entry mapping.
 *
 * The `reports` edge function's POST handler is a MOCK: it answers 202 with
 * `{ job_id, status: 'pending' }` and never returns a `url` (filed as DEAD-09,
 * owner Phase 95). The page used to push `status: 'completed', url: data.url`
 * unconditionally, so an absent url rendered as a finished report with a dead
 * download link — a fabricated success.
 *
 * This mapping is the pairing half of the `template` → `type` rename: absent a
 * real url the entry can only be `unavailable`. Kept as a pure function so the
 * behaviour is testable without a browser, a server, or the mock.
 */

interface GeneratedReportBase {
  id: string
  name: string
  format: string
  createdAt: Date
}

export interface CompletedReportEntry extends GeneratedReportBase {
  status: 'completed'
  url: string
}

export interface UnavailableReportEntry extends GeneratedReportBase {
  status: 'unavailable'
  url: null
}

export type GeneratedReportEntry = CompletedReportEntry | UnavailableReportEntry

/**
 * Map a `reports` function response onto a list entry.
 *
 * A completed entry is only reachable when the response carries a non-empty
 * string `url`. Every other response — including the mock's `{ job_id, status }`
 * — maps to the unavailable terminal state.
 */
export function buildGeneratedReportEntry(
  response: { url?: unknown } | null | undefined,
  meta: GeneratedReportBase,
): GeneratedReportEntry {
  const url = response?.url

  if (typeof url === 'string' && url.length > 0) {
    return { ...meta, status: 'completed', url }
  }

  return { ...meta, status: 'unavailable', url: null }
}
