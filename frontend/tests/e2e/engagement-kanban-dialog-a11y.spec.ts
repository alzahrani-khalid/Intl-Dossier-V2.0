import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Phase 52 KANBAN-04: EngagementKanbanDialog axe-core a11y. Asserts zero
// serious or critical violations on the dialog-hosted Kanban surface.

const matrix = [
  { dir: 'ltr', viewport: { width: 1280, height: 800 } },
  { dir: 'ltr', viewport: { width: 768, height: 1024 } },
  { dir: 'rtl', viewport: { width: 1280, height: 800 } },
  { dir: 'rtl', viewport: { width: 768, height: 1024 } },
] as const

const SEEDED_ENGAGEMENT_ID =
  process.env.PHASE_52_FIXTURE_ENGAGEMENT_ID ?? '00000000-0000-0052-0000-000000000001'

test.describe('Phase 52: EngagementKanbanDialog axe a11y', () => {
  for (const { dir, viewport } of matrix) {
    test(`dialog has zero serious or critical violations in ${dir} @ ${viewport.width}x${viewport.height}`, async ({
      page,
    }): Promise<void> => {
      await page.addInitScript((d: string): void => {
        localStorage.setItem('i18nextLng', d === 'rtl' ? 'ar' : 'en')
      }, dir)
      await page.setViewportSize(viewport)
      await page.goto(`/dossiers/engagements/${SEEDED_ENGAGEMENT_ID}`)
      await page.waitForLoadState('networkidle')

      // Open the dialog so axe scans the actual Kanban surface.
      await page
        .getByRole('button', { name: /kanban|board|اللوحة|كانبان/i })
        .first()
        .click()
      await page.waitForSelector('[data-droppable-id="todo"]', { state: 'visible' })

      const results = await new AxeBuilder({ page }).analyze()
      const seriousOrCritical = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      )
      expect(seriousOrCritical).toEqual([])
    })
  }
})
