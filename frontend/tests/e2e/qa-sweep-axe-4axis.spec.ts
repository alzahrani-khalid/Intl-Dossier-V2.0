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

test.describe('Phase 80 VERIFY-02 — qa-sweep-axe-4axis', () => {
  for (const route of V6_ROUTES) {
    for (const locale of route.locales) {
      for (const theme of THEMES) {
        test(`${route.name} [${locale}] [${theme}] — zero serious/critical axe violations`, async ({
          page,
        }) => {
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
