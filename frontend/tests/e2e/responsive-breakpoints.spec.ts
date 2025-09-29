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

test.describe('Responsive breakpoints', () => {
  test.beforeEach(async ({ page }) => {
    await authBypass(page)
  })

  const cases = [
    { width: 320, alias: 'xs' },
    { width: 768, alias: 'sm' },
    { width: 1024, alias: 'md' },
    { width: 1440, alias: 'lg' },
  ] as const

  for (const c of cases) {
    test(`alias ${c.alias} at width ${c.width}`, async ({ page }) => {
      await page.setViewportSize({ width: c.width, height: 900 })
      await page.goto('/responsive-demo')
      const alias = page.getByTestId('alias')
      await expect(alias).toHaveText(c.alias)

      // Table layout switches to cards on mobile (xs)
      if (c.alias === 'xs') {
        const tableRegion = page.getByTestId('responsive-table')
        // In card view there is no role=table present
        await expect(tableRegion.getByRole('table')).toHaveCount(0)
      }

      // At desktop md+, a real table should render
      if (c.alias === 'md' || c.alias === 'lg') {
        const table = page.getByTestId('responsive-table').getByRole('table')
        await expect(table).toBeVisible()
      }
    })
  }
})
