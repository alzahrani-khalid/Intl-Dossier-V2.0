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

test('Progressive disclosure: collapsible card on mobile', async ({ page }) => {
  await authBypass(page)
  await page.setViewportSize({ width: 375, height: 900 })
  await page.goto('/responsive-demo')

  // Content visible initially
  const content = page.getByTestId('collapsible-card-content')
  await expect(content).toBeVisible()

  // Header has a toggle button with aria-label Collapse/Expand
  const toggle = page.getByRole('button', { name: /collapse|expand/i })
  await toggle.click()
  await expect(content).toBeHidden()

  await toggle.click()
  await expect(content).toBeVisible()
})
