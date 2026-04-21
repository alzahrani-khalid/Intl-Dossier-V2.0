import { test, expect, type Page } from '@playwright/test'

async function authBypass(page: Page): Promise<void> {
  await page.addInitScript((): void => {
    const payload = {
      state: { user: { id: 'test', email: 'test@example.com' }, isAuthenticated: true },
      version: 0,
    }
    localStorage.setItem('auth-storage', JSON.stringify(payload))
  })
}

test.describe('/themes redirect (THEME-04)', () => {
  test('navigating to /themes redirects to / without rendering legacy page', async ({ page }) => {
    await authBypass(page)
    await page.goto('/themes')
    await page.waitForURL('**/')
    expect(new URL(page.url()).pathname).toBe('/')
    // Legacy Themes.tsx would show a "Themes" heading or preset grid. Assert absent.
    await expect(page.locator('[data-testid="themes-page"]')).toHaveCount(0)
  })

  test('T-34-04: redirect target is / (no /themes loop)', async ({ page }) => {
    await authBypass(page)
    const navigations: string[] = []
    page.on('framenavigated', (frame): void => {
      if (frame === page.mainFrame()) navigations.push(new URL(frame.url()).pathname)
    })
    await page.goto('/themes')
    await page.waitForURL('**/')
    // Should have at most 1 pathname transition that matches /themes (no oscillation loop)
    expect(navigations.filter((p) => p === '/themes').length).toBeLessThanOrEqual(1)
  })
})
