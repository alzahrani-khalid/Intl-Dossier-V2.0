// @covers TEST-01 (ar-smoke)
import { test as base, expect } from '@playwright/test'
import LoginPage from '../support/pages/LoginPage'

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? ''
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? ''

base.describe('TEST-01 login (ar-smoke)', () => {
  base.skip(
    ADMIN_EMAIL.length === 0 || ADMIN_PASSWORD.length === 0,
    'E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD required for Arabic login smoke',
  )

  base('logs in with Arabic UI and asserts dir=rtl', async ({ page }) => {
    await page.goto('/login?lang=ar')
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')

    const login = new LoginPage(page)
    // Bilingual selectors in LoginPage already match the Arabic submit label.
    await expect(login.submitButton).toBeVisible()
    await login.signIn(ADMIN_EMAIL, ADMIN_PASSWORD)

    await expect(page).not.toHaveURL(/\/login/)
    // dir=rtl must survive the navigation to dashboard.
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  })
})
