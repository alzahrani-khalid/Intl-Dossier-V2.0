// @covers TEST-01
import { test as base, expect } from '@playwright/test'
import { test } from './support/fixtures'
import LoginPage from './support/pages/LoginPage'

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? ''
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? ''

base.describe('TEST-01 authentication', () => {
  base('signs in with email/password and reaches dashboard', async ({ page }) => {
    base.skip(
      adminEmail === '' || adminPassword === '',
      'E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not set',
    )
    const login = new LoginPage(page)
    await login.goto()
    await login.signIn(adminEmail, adminPassword)
    await expect(page).toHaveURL(/\/(dashboard|$)/)
    await expect(login.dashboardLandmark()).toBeVisible()
  })
})

test.describe('TEST-01 session lifecycle', () => {
  test('persists session across page reload', async ({ adminPage }) => {
    await adminPage.goto('/')
    await adminPage.reload()
    await expect(adminPage).not.toHaveURL(/\/login/)
  })

  test('signs out and returns to login', async ({ adminPage }) => {
    const login = new LoginPage(adminPage)
    await adminPage.goto('/')
    // Open user menu then click sign out; fall back to direct button.
    const userMenu = adminPage.getByTestId('user-menu')
    if (await userMenu.isVisible().catch(() => false)) {
      await userMenu.click()
    }
    await login.signOut()
    await expect(adminPage).toHaveURL(/\/login/)
  })
})
