import { test, expect } from '@playwright/test'

async function authBypass(page: any) {
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

test('RTL/LTR switching via language dropdown', async ({ page }) => {
  await authBypass(page)
  await page.goto('/responsive-demo')

  // The language switcher trigger has an accessible label
  const trigger = page.getByRole('button', { name: /switch language/i })
  await trigger.click()
  await page.getByRole('menuitem').filter({ hasText: 'العربية' }).click()

  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')

  // Switch back to English to verify LTR
  await trigger.click()
  await page.getByRole('menuitem').filter({ hasText: 'English' }).click()
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
})
