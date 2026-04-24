/**
 * Phase 38 dashboard — axe-core a11y sweep.
 *
 * DASH-06 contract: zero serious/critical violations on `/` in both LTR + RTL.
 * Scope narrowed to `.dash-root` so unrelated app chrome (top bar, sidebar)
 * can't fail our dashboard gate.
 */

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { loginAndWaitForDashboard } from './dashboard.spec'

test.describe('Phase 38 dashboard — a11y', () => {
  for (const locale of ['en', 'ar'] as const) {
    test(`zero serious/critical axe violations (${locale})`, async ({ page }) => {
      await loginAndWaitForDashboard(page, locale)
      const results = await new AxeBuilder({ page })
        .include('.dash-root')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
      const blocking = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      )
      expect(
        blocking,
        `serious/critical a11y violations (${locale}):\n${JSON.stringify(blocking, null, 2)}`,
      ).toEqual([])
    })
  }
})
