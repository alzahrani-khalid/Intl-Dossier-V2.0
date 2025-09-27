import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5175/login')
  })

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveTitle(/GASTAT International Dossier/)
    await expect(page.locator('h1')).toContainText('GASTAT International Dossier System')
    await expect(page.locator('input[id="email"]')).toBeVisible()
    await expect(page.locator('input[id="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toContainText('Sign In')
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.locator('button[type="submit"]').click()

    // Check that validation errors appear for both fields
    await expect(page.locator('text=This field is required').first()).toBeVisible()
    await expect(page.locator('text=This field is required').nth(1)).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[id="email"]', 'invalid@example.com')
    await page.fill('input[id="password"]', 'wrongpassword')
    await page.locator('button[type="submit"]').click()

    await expect(page.locator('text=Invalid login credentials')).toBeVisible({
      timeout: 10000,
    })
  })

  test('should successfully login with valid credentials', async ({ page }) => {
    // Use test credentials
    await page.fill('input[id="email"]', 'admin@gastat.gov.sa')
    await page.fill('input[id="password"]', 'admin123')
    await page.locator('button[type="submit"]').click()

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    await expect(page.locator('h1')).toContainText('Dashboard')
  })

  test('should handle MFA if enabled', async ({ page }) => {
    await page.fill('input[id="email"]', 'mfa@gastat.gov.sa')
    await page.fill('input[id="password"]', 'TestPassword123!')
    await page.locator('button[type="submit"]').click()

    // Check if MFA prompt appears
    const mfaInput = page.locator('input[name="mfaCode"]')
    if (await mfaInput.isVisible({ timeout: 5000 })) {
      await mfaInput.fill('123456')
      await page.locator('button:has-text("Verify")').click()
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    }
  })

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.fill('input[id="email"]', 'admin@gastat.gov.sa')
    await page.fill('input[id="password"]', 'admin123')
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/\/dashboard/)

    // Then logout
    await page.locator('button[aria-label="User menu"]').click()

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('h1')).toContainText('GASTAT International Dossier System')
  })

  test('should persist session on refresh', async ({ page }) => {
    // Login
    await page.fill('input[id="email"]', 'admin@gastat.gov.sa')
    await page.fill('input[id="password"]', 'admin123')
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/\/dashboard/)

    // Refresh page
    await page.reload()

    // Should still be on dashboard
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.locator('h1')).toContainText('Dashboard')
  })

  test('should show forgot password link', async ({ page }) => {
    // Check that forgot password link is visible
    await expect(page.locator('text=Forgot password?')).toBeVisible()
    
    // Click the link (currently just a placeholder)
    await page.locator('text=Forgot password?').click()
    
    // Should still be on login page since it's just a placeholder
    await expect(page.locator('h1')).toContainText('GASTAT International Dossier System')
  })

  test('should switch language between English and Arabic', async ({ page }) => {
    // Check English - look for the "Sign In" text in the paragraph below h1
    await expect(page.locator('p').filter({ hasText: 'Sign In' })).toBeVisible()

    // Switch to Arabic - click the language toggle button
    await page.locator('button').filter({ hasText: 'العربية' }).click()

    // Check Arabic - look for Arabic "Sign In" text
    await expect(page.locator('p').filter({ hasText: 'دخول' })).toBeVisible()

    // Switch back to English - click the language toggle button
    await page.locator('button').filter({ hasText: 'English' }).click()

    // Check English again
    await expect(page.locator('p').filter({ hasText: 'Sign In' })).toBeVisible()
  })
})