import { test, expect } from '@playwright/test'

const matrix = [
  { dir: 'ltr', viewport: { width: 1280, height: 800 } },
  { dir: 'ltr', viewport: { width: 768, height: 1024 } },
  { dir: 'rtl', viewport: { width: 1280, height: 800 } },
  { dir: 'rtl', viewport: { width: 768, height: 1024 } },
] as const

const SEEDED_ENGAGEMENT_ID =
  process.env.PHASE_52_FIXTURE_ENGAGEMENT_ID ?? '00000000-0000-0052-0000-000000000001'

test.describe('Phase 52: Tasks tab Kanban visual regression', () => {
  for (const { dir, viewport } of matrix) {
    test(`tasks-tab ${dir} @ ${viewport.width}x${viewport.height}`, async ({
      page,
    }): Promise<void> => {
      await page.addInitScript((d: string): void => {
        localStorage.setItem('i18nextLng', d === 'rtl' ? 'ar' : 'en')
      }, dir)
      await page.setViewportSize(viewport)
      await page.addStyleTag({
        content:
          '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }',
      })
      await page.goto(`/engagements/${SEEDED_ENGAGEMENT_ID}`)
      await page.waitForLoadState('networkidle')

      // Engagement workspace defaults to Overview tab; click Tasks tab to surface the kanban.
      const tasksTab = page.getByRole('tab', { name: /tasks|مهام/i }).first()
      await tasksTab.waitFor({ state: 'visible', timeout: 15_000 })
      await tasksTab.click()

      // Wait for the "8 tasks" / "8 مهام" header to hydrate (TasksTab top bar).
      await page
        .getByText(/\d+\s*(tasks|مهام)/i)
        .first()
        .waitFor({ state: 'visible', timeout: 20_000 })
      await page.waitForTimeout(500)
      await page.evaluate((): Promise<FontFaceSet> => document.fonts.ready)

      await expect(page).toHaveScreenshot(`tasks-tab-${dir}-${viewport.width}.png`, {
        maxDiffPixelRatio: 0.01,
        fullPage: true,
      })
    })
  }
})
