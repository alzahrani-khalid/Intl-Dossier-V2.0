import { test, expect } from '@playwright/test'

const matrix = [
  { dir: 'ltr', viewport: { width: 1280, height: 800 } },
  { dir: 'ltr', viewport: { width: 768, height: 1024 } },
  { dir: 'rtl', viewport: { width: 1280, height: 800 } },
  { dir: 'rtl', viewport: { width: 768, height: 1024 } },
] as const

test.describe('Phase 39: Calendar visual regression', () => {
  for (const { dir, viewport } of matrix) {
    test(`${dir} @ ${viewport.width}x${viewport.height}`, async ({ page }): Promise<void> => {
      const lng = dir === 'rtl' ? 'ar' : 'en'
      // Phase 77-01 (VERIFY-01): pin id.theme=light + id.locale deterministically
      // (the prior i18nextLng seed is a dead key — i18next reads id.locale first,
      // then the `?lng=` querystring below wins at first paint). Keeps this
      // pre-swap baseline light after the Phase-77 default flips to dark.
      await page.addInitScript((seedLng: string): void => {
        try {
          window.localStorage.setItem('id.theme', 'light')
          window.localStorage.setItem('id.locale', seedLng)
        } catch {
          /* storage may be denied in some configs */
        }
      }, lng)
      await page.setViewportSize(viewport)
      await page.addStyleTag({
        content:
          '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }',
      })
      await page.goto(`/calendar?lng=${lng}`)
      await page.waitForLoadState('networkidle')
      await page.evaluate((): Promise<FontFaceSet> => document.fonts.ready)

      await expect(page).toHaveScreenshot(`calendar-${dir}-${viewport.width}.png`, {
        maxDiffPixelRatio: 0.01,
        fullPage: true,
      })
    })
  }
})
