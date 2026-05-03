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
import { tabWalkAllInteractives, settlePage } from './helpers/qa-sweep'

test.describe('Phase 43 — qa-sweep-keyboard', () => {
  for (const route of V6_ROUTES) {
    for (const locale of route.locales) {
      test(`${route.name} [${locale}] — Tab reaches every visible interactive (membership)`, async ({
        page,
      }) => {
        await loginForListPages(page, locale)
        await page.goto(route.path)
        await settlePage(page)

        // Click on body to ensure focus starts at document root.
        await page.locator('body').click({ position: { x: 1, y: 1 } })
        await page.waitForTimeout(50)

        const { count, reached } = await tabWalkAllInteractives(page)
        const label = `[${route.name}][${locale}]`

        // Membership: every counted interactive was focused. Per D-09 we
        // assert STRICT equality between counted and reached sets.
        expect(
          reached.size,
          `${label} unreached interactives: counted=${count} reached=${reached.size}`,
        ).toBe(count)
      })
    }
  }
})
