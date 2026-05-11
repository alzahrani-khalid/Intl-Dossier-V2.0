/**
 * Phase 38 dashboard — E2E skeleton.
 *
 * Plan 38-00 (Wave 0) ships only the boot/mount assertion. Wave 2 plan 38-09
 * extends this spec with full render/wiring/a11y/visual-regression blocks.
 *
 * The exported `loginAndWaitForDashboard` helper is reused by Wave 1 widget
 * specs so each one shares the same login + locale fixture.
 */

import { test, expect, type Page } from '@playwright/test'

const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? ''
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? ''

export async function loginAndWaitForDashboard(
  page: Page,
  locale: 'en' | 'ar' = 'en',
): Promise<void> {
  await page.goto('/login')
  await page.fill('[name="email"]', TEST_EMAIL)
  await page.fill('[name="password"]', TEST_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard', { timeout: 10_000 })
  if (locale === 'ar') {
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl')
      window.localStorage.setItem('i18nextLng', 'ar')
    })
    await page.reload()
  }
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
}

test.describe('Phase 38 dashboard — skeleton', () => {
  test('dashboard route mounts', async ({ page }) => {
    await loginAndWaitForDashboard(page)
    await expect(page.locator('.dash-root')).toBeVisible()
  })
})
