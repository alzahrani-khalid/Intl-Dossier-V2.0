import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Phase 52 KANBAN-04: TasksTab axe-core a11y. Asserts zero serious or critical
// violations on the rendered Kanban surface. Pattern mirrors
// frontend/tests/e2e/kanban-a11y.spec.ts (the Phase 39 anchor for WorkBoard).

const matrix = [
  { dir: 'ltr', viewport: { width: 1280, height: 800 } },
  { dir: 'ltr', viewport: { width: 768, height: 1024 } },
  { dir: 'rtl', viewport: { width: 1280, height: 800 } },
  { dir: 'rtl', viewport: { width: 768, height: 1024 } },
] as const

const SEEDED_ENGAGEMENT_ID =
  process.env.PHASE_52_FIXTURE_ENGAGEMENT_ID ?? '00000000-0000-0052-0000-000000000001'

test.describe('Phase 52: Tasks tab Kanban axe a11y', () => {
  for (const { dir, viewport } of matrix) {
    test(`tasks tab has zero serious or critical violations in ${dir} @ ${viewport.width}x${viewport.height}`, async ({
      page,
    }): Promise<void> => {
      await page.addInitScript((d: string): void => {
        localStorage.setItem('i18nextLng', d === 'rtl' ? 'ar' : 'en')
      }, dir)
      await page.setViewportSize(viewport)
      // Navigate directly to the Tasks tab route (engagement root lands on Overview).
      await page.goto(`/engagements/${SEEDED_ENGAGEMENT_ID}/tasks`)
      await page.waitForLoadState('networkidle')
      // Wait for the TasksTab region to hydrate before scanning.
      await page.getByTestId('tasks-tab-region').waitFor({ state: 'visible', timeout: 20_000 })

      // Phase 57 D-23: scope axe scan to the Tasks tab region. The global
      // IntelDossier shell (sidebar, topbar, FABs) carries acknowledged a11y
      // debt (4.23:1 accent-on-bg contrast — see buildTokens.ts comment;
      // tracked in Phase 59 POLISH). The kanban primitive migration must not
      // regress a11y within the tasks-tab region itself. Mirrors the
      // Phase 57-02 D-21 `.workboard-page` scope precedent in kanban-a11y.spec.ts.
      const results = await new AxeBuilder({ page })
        .include('[data-testid="tasks-tab-region"]')
        .analyze()
      const seriousOrCritical = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      )
      expect(seriousOrCritical).toEqual([])
    })
  }
})
