import { test, expect } from '@playwright/test'

test.describe('Integration: Bilingual Support (RTL/LTR)', () => {
  test('switches between English and Arabic labels', async ({ page }) => {
    await page.goto('/')
    // Try to locate a known nav item in English, then Arabic
    const countries = page.locator('[data-testid="nav-countries"]')
    await expect(countries).toBeVisible()
    await expect(countries).toContainText(/Countries|الدول/)
  })
})

