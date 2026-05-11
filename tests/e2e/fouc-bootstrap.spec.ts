// @covers TOKEN-02 / SC-4 (Plan 33-03)
/**
 * FOUC-safe bootstrap E2E — Plan 33-03.
 *
 * Verifies that `/bootstrap.js` (loaded via `<script blocking="render">`) applies
 * first-paint CSS custom properties from localStorage BEFORE any stylesheet or
 * module runs. Two cases:
 *   A. Cold load with empty localStorage → Chancery-light palette on <html>
 *   B. Cold load with persisted `id.theme=dark` + `id.dir=chancery` → dark class
 *      and dark-mode --bg set before React hydration
 *
 * Uses `base` (no storageState) so no login is required — the app's public entry
 * point serves the bootstrap for any visitor. EN+AR visual coverage is 33-06.
 *
 * NOTE: Plan spec location was `frontend/tests/e2e/`, but playwright.config.ts's
 * `testDir` is `./tests/e2e` (repo root) — so this file lives at the active
 * test location. Recorded as a deviation (Rule 3 — blocking fix).
 */
import { test as base, expect } from '@playwright/test'

// Chancery-light palette (byte-matches directions.ts PALETTES.chancery.light)
const CHANCERY_LIGHT_BG = '#f7f3ec'
const CHANCERY_DARK_BG = '#14120f'

base.describe('TOKEN-02 FOUC-safe bootstrap', () => {
  base.use({ storageState: { cookies: [], origins: [] } })

  base('cold load (empty localStorage) applies Chancery-light palette at first paint', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      try {
        localStorage.clear()
      } catch {
        /* blocked */
      }
    })

    // 'domcontentloaded' fires after the bootstrap <script src="/bootstrap.js" blocking="render">
    // has executed (classic sync script in <head> blocks DCL). This is EARLIER than React
    // hydration, which only runs when the /src/main.tsx module finishes loading + executing.
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    // Read the inline-bootstrap's effect on <html> BEFORE React modules run.
    const { bg, surface, ink, direction, hasDarkClass } = await page.evaluate(() => {
      const r = document.documentElement
      return {
        bg: r.style.getPropertyValue('--bg').trim(),
        surface: r.style.getPropertyValue('--surface').trim(),
        ink: r.style.getPropertyValue('--ink').trim(),
        direction: r.getAttribute('data-direction'),
        hasDarkClass: r.classList.contains('dark'),
      }
    })

    expect(bg).toBe(CHANCERY_LIGHT_BG)
    expect(surface).toBe('#fdfaf3')
    expect(ink).toBe('#1a1814')
    expect(direction).toBe('chancery')
    expect(hasDarkClass).toBe(false)

    // Must NOT be a white flash — bg is warm paper, not #fff.
    expect(bg).not.toBe('#ffffff')
    expect(bg).not.toBe('')
  })

  base('persisted dark mode applied before hydration (no light flash)', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.clear()
        localStorage.setItem('id.theme', 'dark')
        localStorage.setItem('id.dir', 'chancery')
      } catch {
        /* blocked */
      }
    })

    // 'domcontentloaded' fires after the bootstrap <script src="/bootstrap.js" blocking="render">
    // has executed (classic sync script in <head> blocks DCL). This is EARLIER than React
    // hydration, which only runs when the /src/main.tsx module finishes loading + executing.
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const { bg, hasDarkClass, direction } = await page.evaluate(() => {
      const r = document.documentElement
      return {
        bg: r.style.getPropertyValue('--bg').trim(),
        hasDarkClass: r.classList.contains('dark'),
        direction: r.getAttribute('data-direction'),
      }
    })

    expect(hasDarkClass).toBe(true)
    expect(direction).toBe('chancery')
    expect(bg).toBe(CHANCERY_DARK_BG)
    expect(bg).not.toBe(CHANCERY_LIGHT_BG)
  })
})
