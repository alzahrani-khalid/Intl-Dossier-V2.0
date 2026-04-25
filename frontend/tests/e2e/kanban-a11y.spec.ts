import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Phase 39: Kanban axe a11y', () => {
  for (const lang of ['en', 'ar'] as const) {
    test(`zero serious/critical violations in ${lang}`, async ({ page }): Promise<void> => {
      await page.addInitScript((l: string): void => {
        localStorage.setItem('i18nextLng', l)
      }, lang)
      await page.goto('/kanban')
      await page.waitForLoadState('networkidle')

      const results = await new AxeBuilder({ page }).analyze()
      const seriousOrCritical = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      )
      expect(seriousOrCritical).toEqual([])
    })
  }
})
