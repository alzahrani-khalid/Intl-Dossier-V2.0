import { test, expect } from '@playwright/test'

test.describe('Integration: User Authentication Flow', () => {
  test('renders login page and validates fields', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })
})

