/**
 * Plan 33-06 Task 3 — Tailwind remap visual regression sweep.
 *
 * 24-snapshot matrix: 3 routes × 2 modes × 2 locales × 2 viewports.
 * Verifies the new @theme remap (bg-primary → var(--accent), etc.) renders
 * the Chancery palette intentionally across light/dark, en/ar, mobile/desktop.
 *
 * Baselines are NOT committed by this file — human verification gate (Task 5)
 * approves each delta before Task 6 commits the __screenshots__ directory.
 */
import { expect, test } from '@playwright/test'

type Mode = 'light' | 'dark'
type Locale = 'en' | 'ar'

const routes = [
  { path: '/', slug: 'root' },
  { path: '/login', slug: 'login' },
  { path: '/modern-nav-standalone', slug: 'modern-nav' },
] as const

const modes: Mode[] = ['light', 'dark']
const locales: Locale[] = ['en', 'ar']
const viewports = [
  { width: 375, height: 812, name: 'mobile' },
  { width: 1440, height: 900, name: 'desktop' },
] as const

test.describe('Plan 33-06 — @theme remap visual baselines', () => {
  for (const route of routes) {
    for (const mode of modes) {
      for (const locale of locales) {
        for (const viewport of viewports) {
          const name = `${route.slug}-${mode}-${locale}-${viewport.name}`
          test(name, async ({ page }) => {
            await page.setViewportSize({
              width: viewport.width,
              height: viewport.height,
            })

            // Seed D-16 runtime state before any bundle evaluates so the FOUC
            // bootstrap (33-03) + DesignProvider (33-02) both see the intended
            // mode + direction + locale.
            await page.addInitScript(
              ([m, l]: [Mode, Locale]) => {
                try {
                  localStorage.setItem('id.theme', m)
                  localStorage.setItem('id.dir', 'chancery')
                  localStorage.setItem('i18nextLng', l)
                } catch {
                  /* sandboxed iframe — fall back to defaults */
                }
              },
              [mode, locale] as [Mode, Locale],
            )

            await page.goto(route.path)
            await page.waitForLoadState('networkidle')
            // Wait for fonts so text rasterisation is stable (reduces flake)
            await page.evaluate(() => document.fonts?.ready ?? Promise.resolve())

            await expect(page).toHaveScreenshot(`${name}.png`, {
              fullPage: false,
              maxDiffPixelRatio: 0.02,
              animations: 'disabled',
              caret: 'hide',
            })
          })
        }
      }
    }
  }
})
