import { test, expect, type Page } from '@playwright/test'

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
