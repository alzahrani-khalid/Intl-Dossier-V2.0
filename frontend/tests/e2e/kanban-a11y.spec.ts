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

      // Phase 57 D-21: scope axe scan to the WorkBoard region. Pre-DesignV2 this
      // spec ran on a layout that didn't render the IntelDossier shell; post
      // Phase 55 the shell is global and carries its own a11y debt (sidebar
      // icon-buttons, etc.) tracked separately in Phase 59 POLISH. The
      // WorkBoard primitive migration must not regress kanban-region a11y.
      const results = await new AxeBuilder({ page }).include('.workboard-page').analyze()
      const seriousOrCritical = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      )
      expect(seriousOrCritical).toEqual([])
    })
  }
})
