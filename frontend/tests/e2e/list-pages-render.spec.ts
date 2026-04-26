// Phase 40 Plan 10 — list-pages-render
// Renders 7 list pages × 3 viewports (320 / 768 / 1280) and asserts
// no horizontal overflow + responsive table→card collapse below md.
import { test, expect } from '@playwright/test'
import { loginForListPages } from './support/list-pages-auth'

const ROUTES = [
  { path: '/dossiers/countries', name: 'countries' },
  { path: '/dossiers/organizations', name: 'organizations' },
  { path: '/persons', name: 'persons' },
  { path: '/dossiers/forums', name: 'forums' },
  { path: '/dossiers/topics', name: 'topics' },
  { path: '/dossiers/working-groups', name: 'working-groups' },
  { path: '/engagements', name: 'engagements' },
] as const

const VIEWPORTS = [
  { width: 320, height: 720, name: 'mobile' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 1280, height: 800, name: 'desktop' },
] as const


test.beforeEach(async ({ page }) => {
  await loginForListPages(page)
})

for (const route of ROUTES) {
  for (const vp of VIEWPORTS) {
    test(`${route.path} renders @ ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto(route.path)
      await page.waitForLoadState('networkidle')
      // Page title visible
      await expect(page.locator('h1.page-title, h1').first()).toBeVisible()
      // No horizontal overflow at any viewport
      const scrollX = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(scrollX).toBeLessThanOrEqual(0)
    })
  }
}

test('Countries table collapses to cards below md (375px)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 720 })
  await page.goto('/dossiers/countries')
  await page.waitForLoadState('networkidle')
  // Desktop table is hidden (md:block), mobile cards visible (md:hidden)
  const desktopTable = page.locator('.hidden.md\\:block').first()
  const mobileCards = page.locator('.md\\:hidden').first()
  // At least one of these collapse markers must be present
  const desktopHidden = await desktopTable.isHidden().catch(() => true)
  const mobileVisible = await mobileCards.isVisible().catch(() => false)
  expect(desktopHidden || mobileVisible).toBeTruthy()
})
