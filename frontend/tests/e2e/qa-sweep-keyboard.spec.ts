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

        // Plan 43-18: enumerate Tab-order-eligible interactives scoped to
        // <main>. Replaces the prior offsetParent + rect heuristic with
        // an `isTabbable` predicate that mirrors browser Tab-order
        // semantics: any inert / aria-hidden="true" / display:none /
        // visibility:hidden ancestor disqualifies the element, and the
        // element's own `tabIndex` must be ≥ 0. This eliminates
        // false-positive over-counting when an element looks tabbable
        // by tag (button, a, [role=button]) but is excluded from the
        // tab sequence by an ancestor or attribute.
        // Plan 43-18 Task 3: identify candidates by a temporary data-attribute
        // so the reached-set comparison uses element identity, not a
        // truncated outerHTML fingerprint that can collide across siblings
        // with similar markup (Gap-6 Cluster-G root cause).
        const visibleHandles = await page
          .locator('main')
          .first()
          .evaluateAll((mainNodes: Element[]) => {
            const main = mainNodes[0]
            if (!main) return []
            const isTabbable = (el: HTMLElement): boolean => {
              let cur: HTMLElement | null = el
              while (cur && cur !== document.body) {
                if (cur.hasAttribute('inert')) return false
                if (cur.getAttribute('aria-hidden') === 'true') return false
                const cs = getComputedStyle(cur)
                if (cs.display === 'none' || cs.visibility === 'hidden') return false
                cur = cur.parentElement
              }
              if (el.tabIndex < 0) return false
              if (
                (
                  el as
                    | HTMLButtonElement
                    | HTMLInputElement
                    | HTMLSelectElement
                    | HTMLTextAreaElement
                ).disabled
              ) {
                return false
              }
              if (el.getAttribute('aria-disabled') === 'true') return false
              if (el.offsetParent === null) return false
              const rect = el.getBoundingClientRect()
              if (rect.width === 0 || rect.height === 0) return false
              return true
            }
            const candidates = main.querySelectorAll<HTMLElement>(
              'button, a, input, [role="button"], [tabindex]:not([tabindex="-1"])',
            )
            // ARIA composite widgets own their internal Tab order via arrow
            // keys: a `role="tablist"` container takes one Tab stop, then
            // Left/Right walk within it. Same applies to `role="grid"`,
            // `role="listbox"`, `role="menu"`, `role="tree"`, `role="radiogroup"`.
            // Exclude the container itself; the active descendant is the
            // real Tab target.
            const isCompositeWidgetContainer = (el: HTMLElement): boolean => {
              const r = el.getAttribute('role')
              return (
                r === 'tablist' ||
                r === 'grid' ||
                r === 'listbox' ||
                r === 'menu' ||
                r === 'menubar' ||
                r === 'tree' ||
                r === 'radiogroup'
              )
            }
            const visible: string[] = []
            let idx = 0
            candidates.forEach((el) => {
              // Skip <main> itself — it carries tabIndex={0} (43-11) to
              // satisfy WCAG `scrollable-region-focusable`, but is not an
              // "interactive" in this sweep's semantics.
              if (el === main) return
              if (!isTabbable(el)) return
              if (isCompositeWidgetContainer(el)) return
              const id = `qs-${idx++}`
              el.setAttribute('data-qa-sweep-id', id)
              visible.push(`${id}|${el.outerHTML.slice(0, 200)}`)
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
          // prettier-ignore
          test.skip(true, `[${route.name}][${locale}] no visible interactives inside <main> after waitForRouteReady`)
        }
        await page.waitForTimeout(50)

        const reached = new Set<string>()
        // Seed with the pre-focused element so the first Tab press doesn't
        // count as "skipping" qs-0 — the pre-focus already reached it.
        const preFocusedId = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null
          return el?.getAttribute('data-qa-sweep-id') ?? ''
        })
        if (preFocusedId !== '') reached.add(preFocusedId)
        for (let i = 0; i < visibleCount + 1; i++) {
          await page.keyboard.press('Tab')
          const focused = await page.evaluate(() => {
            const el = document.activeElement as HTMLElement | null
            if (!el) return ''
            const id = el.getAttribute('data-qa-sweep-id')
            return id ?? ''
          })
          if (focused !== '') reached.add(focused)
        }
        // Cleanup tracker attribute so subsequent specs don't see leftover marks.
        await page.evaluate(() => {
          document
            .querySelectorAll('[data-qa-sweep-id]')
            .forEach((el) => el.removeAttribute('data-qa-sweep-id'))
        })

        const label = `[${route.name}][${locale}]`
        if (reached.size !== visibleCount) {
          const reachedIds = new Set(reached)
          const unreached = visibleHandles.filter((h) => {
            const id = h.split('|')[0]
            return id !== undefined && !reachedIds.has(id)
          })
          // eslint-disable-next-line no-console
          console.log(
            `[unreached]${label} counted=${visibleCount} reached=${reached.size}\n${unreached.map((u) => '  - ' + u).join('\n')}`,
          )
        }
        // Membership: every counted interactive was focused. Per D-09 we
        // assert STRICT equality between counted and reached sets.
        // prettier-ignore
        expect(reached.size, `${label} unreached interactives: counted=${visibleCount} reached=${reached.size}`).toBe(visibleCount)
      })
    }
  }
})
