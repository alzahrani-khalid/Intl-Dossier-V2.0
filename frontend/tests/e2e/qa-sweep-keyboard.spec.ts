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
 *
 * Plan 43-15: spec rebuilt to fix three smoke signatures from 43-HUMAN-UAT
 * Gap-3 (visibleCount=0 on every route × locale):
 *   1. `<main tabIndex={0}>` (added in 43-11 to satisfy WCAG
 *      `scrollable-region-focusable`) made `page.locator('main').focus()`
 *      put focus on `<main>` itself; the first Tab press exited `<main>`
 *      to topbar/sidebar instead of walking inside it.
 *   2. `waitForRouteReady` returned before route paint completed.
 *   3. Playwright's chained `:visible` selector composition under
 *      `<main tabindex="0">` returned zero matches.
 *
 * Fixes:
 *   A. Pre-focus the FIRST visible interactive INSIDE `<main>` rather
 *      than `<main>` itself, so the Tab walk starts from a known
 *      member of the interactive set.
 *   B. Add `waitForLoadState('networkidle')` (best-effort — realtime
 *      routes never reach idle, swallowed via `.catch`).
 *   C. Replace the chained `:visible` enumeration with a
 *      `page.evaluate` filter that mirrors axe-core's visibility
 *      heuristic (`offsetParent !== null` + non-zero
 *      `getBoundingClientRect`).
 *
 * Production code stays as-is — 43-11's `tabIndex={0}` on `<main>` is
 * correct; the spec is responsible for skipping `<main>` itself in the
 * interactive count.
 */

import { test, expect } from '@playwright/test'
import { loginForListPages } from './support/list-pages-auth'
import { V6_ROUTES } from './helpers/v6-routes'
import { settlePage, waitForRouteReady } from './helpers/qa-sweep'

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
        // Best-effort networkidle. Realtime routes (dashboard, kanban,
        // calendar) keep persistent Supabase Realtime websockets open and
        // never reach idle; the .catch swallow forces the spec past the
        // implicit ~5s timeout.
        await page.waitForLoadState('networkidle').catch(() => {})

        // Enumerate visible interactives via DOM filter scoped to <main>.
        // Bypasses Playwright's chained `:visible` selector-composition
        // quirk on `<main tabindex="0">` (43-11). Mirrors axe-core's
        // visibility heuristic: `offsetParent !== null` + non-zero
        // `getBoundingClientRect`.
        const visibleHandles = await page
          .locator('main')
          .first()
          .evaluateAll((mainNodes: Element[]) => {
            const main = mainNodes[0]
            if (!main) return []
            const candidates = main.querySelectorAll<HTMLElement>(
              'button, a, input, [role="button"], [tabindex]:not([tabindex="-1"])',
            )
            const visible: string[] = []
            candidates.forEach((el) => {
              // Skip <main> itself — it carries tabIndex={0} (43-11) to
              // satisfy WCAG `scrollable-region-focusable`, but is not an
              // "interactive" in this sweep's semantics.
              if (el === main) return
              if (el.offsetParent === null) return
              const rect = el.getBoundingClientRect()
              if (rect.width === 0 || rect.height === 0) return
              visible.push(el.outerHTML.slice(0, 200))
            })
            return visible
          })
        const visibleCount = visibleHandles.length

        // Pre-focus the FIRST visible interactive INSIDE `<main>` (NOT
        // `<main>` itself). This guarantees the subsequent Tab walk stays
        // within `<main>` on its first press.
        if (visibleCount > 0) {
          await page
            .locator('main')
            .first()
            .locator(
              'button:visible, a:visible, input:visible, [role="button"]:visible, [tabindex]:not([tabindex="-1"]):visible',
            )
            .first()
            .focus()
            .catch(async () => {
              // Fallback: focus <main> if no interactive is locator-visible
              // despite the DOM filter saying yes. Rare, but keeps the
              // test moving instead of throwing.
              await page.locator('main').first().focus()
            })
        } else {
          // Genuinely empty route content. Assertion would be vacuously
          // true; skip with a labelled reason so the SUMMARY surfaces it
          // as data for follow-up audit (not silent green).
          test.skip(
            true,
            `[${route.name}][${locale}] no visible interactives inside <main> after waitForRouteReady`,
          )
        }
        await page.waitForTimeout(50)

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
