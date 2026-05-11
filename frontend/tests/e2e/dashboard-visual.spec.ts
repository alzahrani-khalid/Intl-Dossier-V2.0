/**
 * Phase 38 dashboard — 8-snapshot visual regression.
 *
 * Matrix: [ltr, rtl] × [light, dark] × [768, 1280]  =  8 baselines.
 *
 * Flake controls (T-38-06):
 *   • `await document.fonts.ready` gates font-paint completion
 *   • `addStyleTag` injects reduced-motion CSS disabling all animations
 *   • `expect(page).toHaveScreenshot` inherits `maxDiffPixelRatio: 0.01`
 *     from frontend/playwright.config.ts (D-12)
 *
 * Baselines must be seeded with `--update-snapshots` and reviewed by a human
 * against reference/dashboard.png per VALIDATION.md "Manual-Only" row before
 * commit — see 38-09-SUMMARY.md "Known Stubs / Deferred" for status.
 */

import { test, expect, type Page } from '@playwright/test'
import { loginAndWaitForDashboard } from './dashboard.spec'

const VIEWPORTS = [
  { width: 768, height: 1024, tag: '768' },
  { width: 1280, height: 800, tag: '1280' },
] as const

const DIRECTIONS = ['ltr', 'rtl'] as const
const THEMES = ['light', 'dark'] as const

async function setTheme(page: Page, theme: 'light' | 'dark'): Promise<void> {
  await page.evaluate((t) => {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(t)
    try {
      localStorage.setItem('theme', t)
    } catch {
      /* ignore — storage may be denied in some configs */
    }
  }, theme)
}

async function freezeForSnapshot(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation: none !important;
          transition: none !important;
        }
      }
    `,
  })
  await page.evaluate(() => document.fonts.ready)
  // 250ms idle buffer for any post-fonts-ready layout re-flow (sparkline paths,
  // globe spinner frame snap).
  await page.waitForTimeout(250)
}

for (const direction of DIRECTIONS) {
  for (const theme of THEMES) {
    for (const vp of VIEWPORTS) {
      test(`dashboard visual — ${direction}-${theme}-${vp.tag}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height })
        await loginAndWaitForDashboard(page, direction === 'rtl' ? 'ar' : 'en')
        await setTheme(page, theme)
        await freezeForSnapshot(page)
        await expect(page).toHaveScreenshot(`dashboard-${direction}-${theme}-${vp.tag}.png`, {
          fullPage: true,
          maxDiffPixelRatio: 0.01,
          animations: 'disabled',
        })
      })
    }
  }
}
