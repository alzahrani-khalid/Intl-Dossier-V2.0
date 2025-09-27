import { test, expect } from '@playwright/test'

test.describe('Integration: Country Management', () => {
  test('navigates to Countries page', async ({ page }) => {
    await page.goto('/')
    await page.click('[data-testid="nav-countries"]')
    await expect(page).toHaveURL('/countries')
    await expect(page.locator('[data-testid="countries-title"]')).toBeVisible()
  })
})

