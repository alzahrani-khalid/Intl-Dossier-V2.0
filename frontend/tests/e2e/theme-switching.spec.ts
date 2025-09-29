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

test('Theme and color mode switching', async ({ page }) => {
  await authBypass(page)
  await page.goto('/responsive-demo')

  // Initial attributes
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-theme', /gastat|blue-sky/)
  await expect(html).toHaveAttribute('data-color-mode', /light|dark/)

  // Open theme dropdown via ThemeSelector button (has aria-haspopup and Palette icon label)
  const themeTrigger = page.getByRole('button', { name: /select theme|السمة/i })
  await themeTrigger.click()

  // Choose Blue Sky theme
  await page.getByRole('menuitem').filter({ hasText: /blue sky|السماء الزرقاء/i }).click()
  await expect(html).toHaveAttribute('data-theme', 'blue-sky')

  // Toggle color mode button (Moon/Sun icon) has descriptive aria-label
  const modeToggle = page.getByRole('button', { name: /switch to (dark|light) mode/i })
  const before = await html.getAttribute('data-color-mode')
  await modeToggle.click()
  const after = await html.getAttribute('data-color-mode')
  expect(before).not.toBe(after)
})
