/**
 * Phase 38 dashboard — responsive breakpoint sweep (DASH-07).
 *
 * Proves zero horizontal overflow at 320 / 768 / 1280 and verifies the
 * `.dash-grid` collapses to the expected column count at each width.
 */

import { test, expect } from '@playwright/test'
import { loginAndWaitForDashboard } from './dashboard.spec'

const BREAKPOINTS = [
  { width: 320, height: 640, cols: 1, tag: 'mobile' },
  { width: 768, height: 1024, cols: 2, tag: 'tablet' },
  { width: 1280, height: 800, cols: 2, tag: 'desktop' }, // 2fr/1fr → 2 columns
] as const

for (const bp of BREAKPOINTS) {
  test(`dashboard renders at ${bp.tag} (${bp.width}px) without horizontal overflow`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: bp.width, height: bp.height })
    await loginAndWaitForDashboard(page, 'en')

    // Horizontal overflow = documentElement.scrollWidth > clientWidth.
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth - document.documentElement.clientWidth
    })
    expect(overflow, `horizontal overflow at ${bp.width}px: +${overflow}px`).toBeLessThanOrEqual(0)

    // Grid column count: cheap proxy for "did the grid collapse correctly".
    const gridCols = await page
      .locator('.dash-grid')
      .first()
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length)
    expect(gridCols, `.dash-grid columns at ${bp.width}px`).toBe(bp.cols)
  })
}
