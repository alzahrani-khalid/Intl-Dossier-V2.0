/**
 * Phase 94 Plan 09 (RULING-P94-06 B4) — the entry mapping's behaviour, pinned.
 *
 * The grep-only form of this plan's gate could not express the property that
 * matters: a rename plus a stray key reference anywhere in the page would pass
 * it while `status: 'completed'` stayed unconditional — PARK-94-06's forbidden
 * shape surviving its own guard. These assertions fail if an absent url ever
 * yields a completed entry again.
 */

import { describe, it, expect } from 'vitest'

import { buildGeneratedReportEntry } from '../generate-entry'

const meta = {
  id: 'entry-1',
  name: 'Country overview',
  format: 'pdf',
  createdAt: new Date('2026-08-16T09:30:00Z'),
}

describe('buildGeneratedReportEntry', () => {
  it('maps the mock response (no url) to the unavailable state, never completed', () => {
    const entry = buildGeneratedReportEntry({}, meta)

    expect(entry.status).toBe('unavailable')
    expect(entry.status).not.toBe('completed')
    expect(entry.url).toBeNull()
  })

  it('maps the real 202 mock payload to the unavailable state', () => {
    const entry = buildGeneratedReportEntry(
      { job_id: 'e2f1b0c4-0000-4000-8000-000000000000', status: 'pending' },
      meta,
    )

    expect(entry.status).toBe('unavailable')
    expect(entry.url).toBeNull()
  })

  it('maps a returned url to a completed entry carrying that url', () => {
    const entry = buildGeneratedReportEntry({ url: 'https://example.test/report.pdf' }, meta)

    expect(entry.status).toBe('completed')
    expect(entry.url).toBe('https://example.test/report.pdf')
  })

  it('refuses to fabricate a completed entry from an empty or non-string url', () => {
    expect(buildGeneratedReportEntry({ url: '' }, meta).status).toBe('unavailable')
    expect(buildGeneratedReportEntry({ url: null }, meta).status).toBe('unavailable')
    expect(buildGeneratedReportEntry(undefined, meta).status).toBe('unavailable')
  })

  it('carries the entry metadata through unchanged', () => {
    const entry = buildGeneratedReportEntry({}, meta)

    expect(entry.id).toBe('entry-1')
    expect(entry.name).toBe('Country overview')
    expect(entry.format).toBe('pdf')
    expect(entry.createdAt).toEqual(new Date('2026-08-16T09:30:00Z'))
  })
})
