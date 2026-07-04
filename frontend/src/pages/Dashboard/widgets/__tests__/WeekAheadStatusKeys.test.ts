/**
 * Phase 81 Plan 03 — BUG-04 regression guard.
 *
 * WeekAhead.tsx localizes each event's `lifecycle_stage` via
 *   t('weekAhead.status.' + stage, { defaultValue: stage })
 * so a MISSING key silently leaks the raw snake_case DB enum (e.g. `follow_up`)
 * as a user-visible pill. The lesson (project memory): a mocked `t` masks this
 * gap. This test imports the REAL JSON bundles — no react-i18next, no render —
 * so it fails the moment any LifecycleStage key is absent or left as its raw key.
 */

import { describe, expect, it } from 'vitest'
import { LIFECYCLE_STAGES } from '@/types/lifecycle.types'
import enBundle from '@/i18n/en/dashboard-widgets.json'
import arBundle from '@/i18n/ar/dashboard-widgets.json'

const bundles = [
  { lang: 'en', status: enBundle.weekAhead.status as Record<string, string> },
  { lang: 'ar', status: arBundle.weekAhead.status as Record<string, string> },
]

describe('WeekAhead status labels — LifecycleStage coverage (real JSON)', () => {
  for (const { lang, status } of bundles) {
    for (const stage of LIFECYCLE_STAGES) {
      it(`${lang}: weekAhead.status.${stage} exists and is not the raw enum`, () => {
        const label = status[stage]
        // Key must exist and be a non-empty string...
        expect(typeof label).toBe('string')
        expect(label.length).toBeGreaterThan(0)
        // ...and must not equal the raw snake_case key (guards 'Follow-up' vs 'follow_up').
        expect(label).not.toBe(stage)
      })
    }
  }
})
