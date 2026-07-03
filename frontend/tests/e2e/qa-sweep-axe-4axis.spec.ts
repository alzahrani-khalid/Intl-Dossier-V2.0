/**
 * Phase 80 VERIFY-02 — explicit, called-out 4-axis extension of qa-sweep-axe.
 *
 * `qa-sweep-axe.spec.ts` scans 15 routes × {en, ar} but is theme-implicit — after
 * the Phase-77 default flipped to dark it scans DARK ONLY. VERIFY-02 requires all
 * four axes (dark/light × LTR/RTL), so this sibling adds the theme dimension:
 *
 *   V6_ROUTES (15) × {en, ar} × {light, dark} = 60 axe scans.
 *
 * This is an EXPLICIT coverage extension, called out per the Phase-80 CONTEXT
 * no-silent-expansion discipline (the no-expansion clause binds VERIFY-01's visual
 * baselines; VERIFY-02 mandates the 4th axis). It is a LOCAL baseline vehicle for
 * the recorded A/B comparison (`80-A11Y-BASELINE.md`) and is deliberately NOT
 * wired into the FOUC-02 CI smoke job — 60 scans exceed that job's runtime budget.
 *
 * Contract (mirrors qa-sweep-axe.spec.ts):
 *   - Routes come from `helpers/v6-routes.ts` (single source of truth).
 *   - The axe filter (serious|critical) lives in `runAxe` from
 *     `helpers/qa-sweep.ts` — DO NOT re-implement the axe scan inline (the
 *     qa-sweep-axe spec header explicitly forbids inlining the scanner).
 *   - Auth via `support/list-pages-auth.ts` (handles locale + html.dir +
 *     guided-tour dismissal).
 *   - Theme is pinned via `page.addInitScript` seeding localStorage `id.theme`
 *     BEFORE any navigation, so bootstrap.js reads it at first paint. This is the
 *     first-paint-safe pin (NOT the DEV/test-only `window.__design.setMode` hatch).
 */

import { test } from '@playwright/test'

import { V6_ROUTES } from './helpers/v6-routes'
import { runAxe, settlePage, waitForRouteReady } from './helpers/qa-sweep'
import { loginForListPages } from './support/list-pages-auth'

const THEMES = ['light', 'dark'] as const

// TRACKED APP A11Y DEBT (recorded pre-migration baseline — see 80-A11Y-BASELINE.md §10.4):
// the engagements list <main> renders a `<div role="list">` whose direct children are not
// `role="listitem"`, tripping critical aria-required-parent + aria-required-children. It fails
// in BOTH themes AND BOTH locales (theme-/locale-independent → structural, not a token issue),
// and the pre-token worktree `14191cb85` (set A) trips the identical four scans — so this
// PREDATES the Phase-77 Linear migration and is recordable, NOT a NEW-on-HEAD regression. It is
// RECORDED rather than fixed because the remedy is a structural DOM/role change on the
// engagements list, outside this plan's token-fix scope (the fix is deferred to the engagements
// list remediation). Each entry below records exactly one scan (route × locale × theme); every
// reason string carries the `80:` phase marker so the recorded-fixme count matches the ledger's
// `recorded` count exactly (anti-false-green control T-80-07). Remove an entry once that scan's
// role nesting is remediated.
const RECORDED_BASELINE: Readonly<Record<string, string>> = {
  'engagements|en|light':
    '80: recorded pre-migration baseline — engagements list aria-required-parent/children (role="list" without role="listitem" children; structural, pre-token 14191cb85 trips it too)',
  'engagements|en|dark':
    '80: recorded pre-migration baseline — engagements list aria-required-parent/children (role="list" without role="listitem" children; structural, pre-token 14191cb85 trips it too)',
  'engagements|ar|light':
    '80: recorded pre-migration baseline — engagements list aria-required-parent/children (role="list" without role="listitem" children; structural, pre-token 14191cb85 trips it too)',
  'engagements|ar|dark':
    '80: recorded pre-migration baseline — engagements list aria-required-parent/children (role="list" without role="listitem" children; structural, pre-token 14191cb85 trips it too)',
}

test.describe('Phase 80 VERIFY-02 — qa-sweep-axe-4axis', () => {
  for (const route of V6_ROUTES) {
    for (const locale of route.locales) {
      for (const theme of THEMES) {
        test(`${route.name} [${locale}] [${theme}] — zero serious/critical axe violations`, async ({
          page,
        }) => {
          // Recorded pre-migration baseline (T-80-07): skip only the specific
          // route×locale×theme scans proven pre-existing against set A. This is a
          // per-scan record, never a blanket skip — all other scans stay live.
          const recordedReason = RECORDED_BASELINE[`${route.name}|${locale}|${theme}`]
          if (recordedReason !== undefined) {
            test.fixme(true, recordedReason)
          }

          // Pin the theme axis BEFORE first paint: addInitScript runs on every
          // navigation for the page's lifetime (login → redirect → AR reload →
          // goto route), so bootstrap.js reads id.theme at first paint on the
          // target route. Do NOT use window.__design.setMode (DEV/test-only hatch).
          await page.addInitScript((t) => {
            try {
              window.localStorage.setItem('id.theme', t)
            } catch {
              /* storage may be denied in some configs */
            }
          }, theme)

          await loginForListPages(page, locale)
          await page.goto(route.path)
          await settlePage(page)
          // Plan 43-12: gate axe on <main> readiness AND scope it to <main>.
          await waitForRouteReady(page)
          await runAxe(page, { include: 'main' })
        })
      }
    }
  }
})
