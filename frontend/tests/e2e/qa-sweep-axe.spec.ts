/**
 * Phase 43 — cross-cutting axe-core sweep (QA-02).
 *
 * One Playwright spec asserting zero serious/critical axe violations across
 * every v6.0 route in EN + AR — 15 routes × 2 locales = 30 tests.
 *
 * Per Wave 0 contract:
 *   - Routes come from `helpers/v6-routes.ts` (single source of truth).
 *   - axe filter (serious|critical) is encoded in `runAxe` from
 *     `helpers/qa-sweep.ts` — DO NOT re-implement inline.
 *   - Auth via `support/list-pages-auth.ts` (handles locale + html.dir +
 *     guided-tour dismissal).
 *
 * Scope: catches cross-phase a11y regressions that per-phase specs miss;
 * acts as a hard CI gate alongside Phase 38–42 per-route specs.
 */

import { test } from '@playwright/test'

import { V6_ROUTES } from './helpers/v6-routes'
import { runAxe, settlePage } from './helpers/qa-sweep'
import { loginForListPages } from './support/list-pages-auth'

test.describe('Phase 43 — qa-sweep-axe', () => {
  for (const route of V6_ROUTES) {
    for (const locale of route.locales) {
      test(`${route.name} [${locale}] — zero serious/critical axe violations`, async ({ page }) => {
        await loginForListPages(page, locale)
        await page.goto(route.path)
        await settlePage(page)
        await runAxe(page)
      })
    }
  }
})
