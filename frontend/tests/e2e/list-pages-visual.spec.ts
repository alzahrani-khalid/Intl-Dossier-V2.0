// Phase 40 Plan 10 — list-pages-visual
// 14 baselines (7 pages × LTR+AR) at 1280×800; maxDiffPixelRatio: 0.02.
// Phase 40 Plan 17 (G7): Full determinism stack to eliminate cross-replay drift.
//   1. Clock freeze (page.clock.install) — neutralizes Date.now() / live timestamps.
//   2. Transition + animation suppression via addInitScript — kills CSS animation residue.
//   3. data-loading="false" ready-marker wait — replaces fragile networkidle heuristic.
//   4. Font-readiness wait — preserved from Phase 38 Pitfall 6.
import { test, expect, type Page } from '@playwright/test'
import { loginForListPages } from './support/list-pages-auth'

const ROUTES_WITH_NAMES = [
  ['/dossiers/countries', 'countries'],
  ['/dossiers/organizations', 'organizations'],
  ['/dossiers/persons', 'persons'],
  ['/dossiers/forums', 'forums'],
  ['/dossiers/topics', 'topics'],
  ['/dossiers/working_groups', 'working-groups'],
  ['/engagements', 'engagements'],
] as const

const LOCALES = ['en', 'ar'] as const

// Frozen clock anchor — pinned to phase date so any relative timestamp ("2h ago",
// "yesterday", date-formatted strings) renders identically across replays.
const FROZEN_TIME = new Date('2026-04-26T12:00:00Z')

const SUPPRESS_TRANSITIONS_CSS = `
  *, *::before, *::after {
    transition: none !important;
    animation: none !important;
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    scroll-behavior: auto !important;
    caret-color: transparent !important;
  }
  /* Hide skeleton pulse residue if a skeleton lingers. */
  [data-testid$="-skeleton"] { animation: none !important; opacity: 1 !important; }
`

test.use({ viewport: { width: 1280, height: 800 } })

test.beforeEach(async ({ page }) => {
  // 1. Freeze the clock BEFORE any navigation so date-formatted strings render
  //    deterministically.  Must happen before goto so app code that captures
  //    Date.now() at module-load sees the frozen value.
  await page.clock.install({ time: FROZEN_TIME })

  // 2. Suppress transitions / animations on every page load (init script runs
  //    before any document scripts on each navigation).
  await page.addInitScript((css) => {
    const apply = (): void => {
      if (!document.head) {
        setTimeout(apply, 1)
        return
      }
      const tag = document.createElement('style')
      tag.setAttribute('data-test-suppress', 'true')
      tag.textContent = css
      document.head.appendChild(tag)
    }
    apply()
  }, SUPPRESS_TRANSITIONS_CSS)

  // Login happens inside each test so the requested locale can be seeded
  // before the app initializes on the target route.
})

/**
 * Navigate to a route and wait for the deterministic ready signal emitted by
 * `ListPageShell` (Plan 40-13).  Every screenshot in this file MUST go through
 * this helper so the ready marker, font-loading, and clock tick are honored.
 */
async function gotoAndReady(page: Page, url: string): Promise<void> {
  await page.goto(url)
  // Ready marker from Plan 40-13: ListPageShell renders data-loading="false"
  // once query state has resolved (success OR error, but not loading).
  await page.waitForSelector('[data-loading="false"]', { timeout: 15_000 })
  // Some route primitives own nested loading states below ListPageShell.
  // Screenshots must capture settled content, not transient row skeletons.
  await page.waitForFunction(
    () => {
      const shell = document.querySelector('[data-loading]')
      return shell?.querySelector('[data-testid*="skeleton"]') === null
    },
    null,
    { timeout: 15_000 },
  )
  // Phase 38 Pitfall 6: ensure web fonts are loaded before snapshot.
  await page.waitForFunction(() => document.fonts.ready)
  // Tick the frozen clock once so any pending requestAnimationFrame /
  // microtask flushes deterministically.
  await page.clock.runFor(100)
}

for (const [path, name] of ROUTES_WITH_NAMES) {
  for (const locale of LOCALES) {
    test(`visual ${name} (${locale})`, async ({ page }) => {
      await loginForListPages(page, locale)
      await gotoAndReady(page, `${path}?lng=${locale}`)
      await page.waitForFunction(
        (expectedLocale) =>
          document.documentElement.getAttribute('lang') === expectedLocale &&
          document.documentElement.getAttribute('dir') ===
            (expectedLocale === 'ar' ? 'rtl' : 'ltr'),
        locale,
      )
      // Re-tick the clock so locale-driven layout and text settle before screenshot.
      await page.clock.runFor(100)
      await expect(page).toHaveScreenshot(`${name}-${locale}.png`, {
        maxDiffPixelRatio: 0.02,
        fullPage: true,
      })
    })
  }
}
