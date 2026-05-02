/**
 * Phase 42 — Playwright fixtures shared across the 5 Wave-1 page reskins.
 *
 * Re-uses the existing `loginForListPages` helper from list-pages-auth.ts so
 * the auth flow stays in lockstep with the Phase 40 list-page suite.  Adds a
 * canonical page-ready helper (`gotoPhase42Page`) and the determinism setup
 * (`setupPhase42Test`) so each Wave-1 / Wave-2 spec only needs a one-line
 * beforeEach.
 *
 * Determinism stack (Phase 40-17 G7 precedent):
 *   1. Clock freeze        → eliminates Date.now() / "2h ago" drift.
 *   2. Transition + animation suppression → kills CSS animation residue.
 *   3. data-loading="false" ready marker → replaces flaky networkidle wait.
 *   4. document.fonts.ready → typography settles before screenshot.
 */

import type { Page } from '@playwright/test'
import { loginForListPages } from './list-pages-auth'

export const PHASE_42_ROUTES = {
  briefs: '/briefs',
  afterActions: '/after-actions',
  tasks: '/tasks',
  activity: '/activity',
  settings: '/settings',
} as const

export type Phase42Route = (typeof PHASE_42_ROUTES)[keyof typeof PHASE_42_ROUTES]

export const FROZEN_TIME = new Date('2026-04-26T12:00:00Z')

export const SUPPRESS_TRANSITIONS_CSS = `
*, *::before, *::after {
  transition: none !important;
  animation: none !important;
  animation-duration: 0s !important;
  animation-delay: 0s !important;
  scroll-behavior: auto !important;
}
* { caret-color: transparent !important; }
[data-testid$="-skeleton"] { animation: none !important; opacity: 1 !important; }
`

/**
 * Phase 42 canonical page-ready helper.
 *
 *   1. Navigates to the route.
 *   2. Waits for `[data-loading="false"]` (every Wave 1 page emits this on
 *      the root <section>).
 *   3. Awaits `document.fonts.ready` so typography stops shifting.
 *   4. Runs the frozen clock 100 ms forward to drain pending rAF / settle
 *      timers.
 */
export async function gotoPhase42Page(page: Page, route: Phase42Route): Promise<void> {
  await page.goto(route)
  await page.waitForSelector('[data-loading="false"]', { timeout: 15_000 })
  await page.waitForFunction(
    () => (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready,
  )
  await page.clock.runFor(100)
}

/**
 * Phase 42 canonical beforeEach setup. Use inside `test.beforeEach()`:
 *
 *   await setupPhase42Test({ page })
 *
 * Order of operations matters:
 *   - Clock install BEFORE goto so module-load Date.now() captures see the
 *     frozen value.
 *   - addInitScript registers the CSS suppression on every navigation.
 *   - loginForListPages then runs (it navigates to /login).
 */
export async function setupPhase42Test({ page }: { page: Page }): Promise<void> {
  await page.clock.install({ time: FROZEN_TIME })
  await page.addInitScript((css: string) => {
    const apply = (): void => {
      if (!document.head) {
        setTimeout(apply, 1)
        return
      }
      const style = document.createElement('style')
      style.setAttribute('data-test-suppress', 'true')
      style.textContent = css
      document.head.appendChild(style)
    }
    apply()
  }, SUPPRESS_TRANSITIONS_CSS)
  await loginForListPages(page)
}

/**
 * Locale toggle helper — switches HTML dir + i18next language by writing
 * localStorage and waiting for the live DOM to reflect the change.  Mirrors
 * the AR branch in `loginForListPages` so tests can switch *after* login.
 */
export async function switchToArabic(page: Page): Promise<void> {
  await page.evaluate(() => {
    // i18next reads `id.locale` (see frontend/src/i18n/index.ts:462).
    // Writing `i18nextLng` is silently cleared by the bootstrap migration when
    // `id.locale` already exists from login.
    window.localStorage.setItem('id.locale', 'ar')
    window.localStorage.setItem('i18nextLng', 'ar')
    document.documentElement.setAttribute('dir', 'rtl')
    document.documentElement.setAttribute('lang', 'ar')
  })
  await page.reload()
  await page.waitForFunction(
    () =>
      document.documentElement.getAttribute('dir') === 'rtl' &&
      document.documentElement.getAttribute('lang') === 'ar',
    null,
    { timeout: 10_000 },
  )
}

export { loginForListPages } from './list-pages-auth'
