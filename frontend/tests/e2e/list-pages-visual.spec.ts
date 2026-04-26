// Phase 40 Plan 10 — list-pages-visual
// 14 baselines (7 pages × LTR+AR) at 1280×800; maxDiffPixelRatio: 0.02.
// Phase 38 Pitfall 6: wait for fonts then 200ms before screenshot.
// Baselines are captured here; human PNG-parity approval is gated by plan 11.
import { test, expect } from '@playwright/test'

const ROUTES_WITH_NAMES = [
  ['/dossiers/countries', 'countries'],
  ['/dossiers/organizations', 'organizations'],
  ['/persons', 'persons'],
  ['/dossiers/forums', 'forums'],
  ['/dossiers/topics', 'topics'],
  ['/dossiers/working-groups', 'working-groups'],
  ['/engagements', 'engagements'],
] as const

const LOCALES = ['en', 'ar'] as const

test.use({ viewport: { width: 1280, height: 800 } })

for (const [path, name] of ROUTES_WITH_NAMES) {
  for (const locale of LOCALES) {
    test(`visual ${name} (${locale})`, async ({ page }) => {
      await page.goto(`${path}?lng=${locale}`)
      await page.waitForLoadState('networkidle')
      if (locale === 'ar') {
        await page.evaluate(() => {
          document.documentElement.dir = 'rtl'
          document.documentElement.lang = 'ar'
        })
      }
      // Phase 38 Pitfall 6: wait for fonts before screenshot
      await page.waitForFunction(() => document.fonts.ready)
      await page.waitForTimeout(200)
      await expect(page).toHaveScreenshot(`${name}-${locale}.png`, {
        maxDiffPixelRatio: 0.02,
        fullPage: true,
      })
    })
  }
}
