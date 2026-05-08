import { test, expect } from '@playwright/test'
import { loginForListPages } from './support/list-pages-auth'
import { seedRecentDossierStore } from './support/dossier-drawer-fixture'

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
  [data-testid$="-skeleton"] { animation: none !important; opacity: 1 !important; }
`

const WIDGETS = [
  ['dashboard-widget-kpi-strip', 'kpi-strip'],
  ['dashboard-widget-week-ahead', 'week-ahead'],
  ['dashboard-widget-overdue-commitments', 'overdue-commitments'],
  ['dashboard-widget-digest', 'digest'],
  ['dashboard-widget-sla-health', 'sla-health'],
  ['dashboard-widget-vip-visits', 'vip-visits'],
  ['dashboard-widget-my-tasks', 'my-tasks'],
  ['dashboard-widget-recent-dossiers', 'recent-dossiers'],
] as const

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: FROZEN_TIME })
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
  await page.setViewportSize({ width: 1280, height: 1000 })
  await seedRecentDossierStore(page)
  await loginForListPages(page, 'en')
  await page.goto('/dashboard')
  await page.waitForSelector('.dash-root')
  await page.waitForFunction(() => document.fonts.ready)
  await page.clock.runFor(100)
})

for (const [selector, name] of WIDGETS) {
  test(`visual ${name}`, async ({ page }) => {
    await page.waitForSelector(`[data-testid="${selector}"]`)
    await expect(page.getByTestId(selector)).toBeVisible()
    await expect(page.getByTestId(selector)).toHaveScreenshot(`${name}.png`, {
      animations: 'disabled',
      maxDiffPixelRatio: 0.02,
    })
  })
}
