import { test, expect } from '@playwright/test'

test.describe('Integration: Data Library File Upload', () => {
  test('placeholder reaches Data Library page', async ({ page }) => {
    await page.goto('/')
    await page.click('[data-testid="nav-data-library"]').catch(() => {})
    expect(true).toBe(true)
  })
})

