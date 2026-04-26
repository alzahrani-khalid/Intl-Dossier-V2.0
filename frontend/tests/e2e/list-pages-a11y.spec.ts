// Phase 40 Plan 10 — list-pages-a11y
// axe-core gate: 0 WCAG 2.1 AA violations across 7 pages × 2 locales.
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const ROUTES = [
  '/dossiers/countries',
  '/dossiers/organizations',
  '/persons',
  '/dossiers/forums',
  '/dossiers/topics',
  '/dossiers/working-groups',
  '/engagements',
] as const

const LOCALES = ['en', 'ar'] as const

for (const route of ROUTES) {
  for (const locale of LOCALES) {
    test(`a11y ${route} (${locale})`, async ({ page }) => {
      await page.goto(`${route}?lng=${locale}`)
      await page.waitForLoadState('networkidle')
      if (locale === 'ar') {
        await page.evaluate(() => {
          document.documentElement.dir = 'rtl'
          document.documentElement.lang = 'ar'
        })
      }
      await page.waitForFunction(() => document.fonts.ready)
      const results = await new AxeBuilder({ page }).withTags(['wcag2aa', 'wcag21aa']).analyze()
      expect(results.violations).toEqual([])
    })
  }
}
