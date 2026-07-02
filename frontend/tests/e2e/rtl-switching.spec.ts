import { test, expect, type Page } from '@playwright/test'
import { loginForListPages } from './support/list-pages-auth'

test.describe.configure({ retries: 1 })

async function authBypass(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const payload = {
      state: {
        user: { id: 'test-user', email: 'test@example.com', name: 'Test' },
        isAuthenticated: true,
      },
      version: 0,
    }
    localStorage.setItem('auth-storage', JSON.stringify(payload))
  })
}

async function seedLocale(page: Page, locale: 'en' | 'ar'): Promise<void> {
  await page.addInitScript((l: 'en' | 'ar'): void => {
    localStorage.setItem('id.locale', l)
  }, locale)
}

test('RTL layout applies when id.locale=ar is seeded', async ({ page }) => {
  await authBypass(page)
  await seedLocale(page, 'ar')
  await page.goto('/responsive-demo')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
})

test('LTR layout applies when id.locale=en is seeded', async ({ page }) => {
  await authBypass(page)
  await seedLocale(page, 'en')
  await page.goto('/responsive-demo')
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
})

test('live topbar toggle flips html dir and persists id.locale (both directions)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await loginForListPages(page)

  // EN → AR: html flips to rtl and i18next caches the choice under id.locale.
  await page.locator('[data-lang="ar"]').click()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect.poll(() => page.evaluate(() => localStorage.getItem('id.locale'))).toBe('ar')

  // AR → EN: both revert.
  await page.locator('[data-lang="en"]').click()
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
  await expect.poll(() => page.evaluate(() => localStorage.getItem('id.locale'))).toBe('en')
})
