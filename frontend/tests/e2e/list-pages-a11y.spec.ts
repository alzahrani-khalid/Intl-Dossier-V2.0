// Phase 40 Plan 10 — list-pages-a11y
// axe-core gate: 0 WCAG 2.1 AA violations across 7 pages × 2 locales.
//
// Reconciled by 40-18:
// - Working-groups route uses underscored form (40-08 SUMMARY).
// - 40-15 SUMMARY: ListPageShell exposes `<section role="region" aria-label>`
//   because AppShell already renders the parent `<main>`. Spec asserts the
//   region landmark exists rather than expecting a nested `<main>`.
// - 40-15: `<html lang>` and `<html dir>` are kept in sync by `src/i18n/index.ts`
//   on the `languageChanged` event; the AR branch below verifies it after a
//   real route navigation (no manual flip).
// - 40-15: chip contrast tokens for `--ok / --warn / --info` were lowered
//   to meet WCAG AA 4.5:1 — axe `color-contrast` rule must pass.
import { test, expect } from '@playwright/test'
import { loginForListPages } from './support/list-pages-auth'
import AxeBuilder from '@axe-core/playwright'

const ROUTES = [
  '/dossiers/countries',
  '/dossiers/organizations',
  '/persons',
  '/dossiers/forums',
  '/dossiers/topics',
  '/dossiers/working_groups',
  '/engagements',
] as const

const LOCALES = ['en', 'ar'] as const

test.beforeEach(async ({ page }) => {
  await loginForListPages(page)
})

for (const route of ROUTES) {
  for (const locale of LOCALES) {
    test(`a11y ${route} (${locale})`, async ({ page }) => {
      await page.goto(`${route}?lng=${locale}`)
      // 40-13 ready marker before axe runs.
      await page.waitForSelector('[data-loading="false"]', { timeout: 10_000 }).catch(() => null)
      await page.waitForLoadState('networkidle')
      await page.waitForFunction(() => document.fonts.ready)

      // 40-15 contracts: the labeled region landmark is present, and the
      // <html lang>/dir attributes are synced by `src/i18n/index.ts` for the
      // active locale.
      const region = page.getByRole('region').first()
      await expect(region).toBeVisible()
      await expect(region).toHaveAttribute('aria-label', /.+/)

      const htmlLang = await page.evaluate(() => document.documentElement.lang)
      const htmlDir = await page.evaluate(() => document.documentElement.dir)
      expect(htmlLang).toBe(locale)
      expect(htmlDir).toBe(locale === 'ar' ? 'rtl' : 'ltr')

      const results = await new AxeBuilder({ page }).withTags(['wcag2aa', 'wcag21aa']).analyze()

      // Surface chip-contrast and landmark/lang violations specifically — these
      // are the three categories 40-15 closed (region, html-has-lang/valid-lang,
      // color-contrast). A regression here means a token or shell change broke
      // the gap-closure.
      const focusedRules = ['region', 'html-has-lang', 'valid-lang', 'color-contrast']
      const focused = results.violations.filter((v) => focusedRules.includes(v.id))
      expect(focused, `40-15 regression on ${route} (${locale})`).toEqual([])

      expect(results.violations).toEqual([])
    })
  }
}
