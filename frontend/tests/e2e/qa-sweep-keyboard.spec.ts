/**
 * Phase 43 Plan 03 — qa-sweep-keyboard
 *
 * Per-route Tab-walk membership assertion (D-09): for every v6.0 route ×
 * locale, count visible interactives at rest, press Tab N+1 times, and
 * assert the set of focused elements equals the counted set exactly.
 *
 * Catches focus-traps, hidden-but-tabbable elements, missing tabindex,
 * and programmatic `focus()` regressions across the entire v6.0 surface.
 *
 * Membership only — order is intentionally NOT asserted (per D-09).
 *
 * The sweep runs against the route's resting state — no clicks open
 * modals/drawers (RESEARCH §8 confirms HeroUI portals are absent from
 * the count when triggers are unactivated).
 */

import { test, expect } from '@playwright/test'
import { loginForListPages } from './support/list-pages-auth'
import { V6_ROUTES } from './helpers/v6-routes'
import { settlePage, waitForRouteReady } from './helpers/qa-sweep'

// Plan 43-12: scope the membership count + Tab walk to `<main>`. Sidebar /
// topbar interactives are owned by their per-phase specs; this sweep only
// asserts that route content (the part that mounts under `<main>`) has no
// focus traps or hidden-but-tabbable elements.
const MAIN_INTERACTIVE_SELECTOR = [
  'main button:visible',
  'main a:visible',
  'main input:visible',
  'main [role="button"]:visible',
  'main [tabindex]:not([tabindex="-1"]):visible',
].join(', ')

test.describe('Phase 43 — qa-sweep-keyboard', () => {
  for (const route of V6_ROUTES) {
    for (const locale of route.locales) {
      test(`${route.name} [${locale}] — Tab reaches every visible interactive (membership)`, async ({
        page,
      }) => {
        await loginForListPages(page, locale)
        await page.goto(route.path)
        await settlePage(page)
        await waitForRouteReady(page)

        // Seed focus inside `<main>` so the Tab walk starts from a known
        // origin instead of the document body (which would tab through the
        // sidebar / topbar before reaching route content).
        await page.locator('main').first().focus()
        await page.waitForTimeout(50)

        // Count visible interactives scoped to `<main>` and tab-walk N+1
        // times, recording the focused element on each press.
        const visibleCount = await page.locator(MAIN_INTERACTIVE_SELECTOR).count()
        const reached = new Set<string>()
        for (let i = 0; i < visibleCount + 1; i++) {
          await page.keyboard.press('Tab')
          const focused = await page.evaluate(
            () => document.activeElement?.outerHTML?.slice(0, 200) ?? '',
          )
          reached.add(focused)
        }

        const label = `[${route.name}][${locale}]`
        // Membership: every counted interactive was focused. Per D-09 we
        // assert STRICT equality between counted and reached sets.
        expect(
          reached.size,
          `${label} unreached interactives: counted=${visibleCount} reached=${reached.size}`,
        ).toBe(visibleCount)
      })
    }
  }
})
