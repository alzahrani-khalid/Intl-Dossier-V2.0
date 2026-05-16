import { test, expect } from '@playwright/test'

const matrix = [
  { dir: 'ltr', viewport: { width: 1280, height: 800 } },
  { dir: 'ltr', viewport: { width: 768, height: 1024 } },
  { dir: 'rtl', viewport: { width: 1280, height: 800 } },
  { dir: 'rtl', viewport: { width: 768, height: 1024 } },
] as const

const SEEDED_ENGAGEMENT_ID =
  process.env.PHASE_52_FIXTURE_ENGAGEMENT_ID ?? '00000000-0000-0052-0000-000000000001'

test.describe('Phase 52: EngagementKanbanDialog visual regression', () => {
  for (const { dir, viewport } of matrix) {
    test(`engagement-kanban-dialog ${dir} @ ${viewport.width}x${viewport.height}`, async ({
      page,
    }): Promise<void> => {
      await page.addInitScript((d: string): void => {
        localStorage.setItem('i18nextLng', d === 'rtl' ? 'ar' : 'en')
        // Belt-and-braces tour dismissal beyond global-setup (which doesn't cover
        // the engagement-dossier tour triggered by /dossiers/engagements/<id>).
        localStorage.setItem('intl-dossier-onboarding-seen', 'true')
        localStorage.setItem('intl-dossier-onboarding-completed', 'true')
        localStorage.setItem('intl-dossier-tours-enabled', 'false')
        localStorage.setItem(
          'intl-dossier-tours-dismissed',
          JSON.stringify([
            'onboarding',
            'dossier-hub',
            'engagement-wizard',
            'engagement-dossier',
            'engagement-workspace',
          ]),
        )
      }, dir)
      await page.setViewportSize(viewport)
      await page.addStyleTag({
        content:
          '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }',
      })
      await page.goto(`/dossiers/engagements/${SEEDED_ENGAGEMENT_ID}`)
      await page.waitForLoadState('networkidle')

      const trigger = page.getByRole('button', { name: /kanban|board|اللوحة|كانبان/i }).first()
      await trigger.waitFor({ state: 'visible', timeout: 15_000 })
      await trigger.click()

      // Wait for the dialog's kanban columns to render.
      await page
        .locator('[data-droppable-id]')
        .first()
        .waitFor({ state: 'visible', timeout: 15_000 })
      await page.evaluate((): Promise<FontFaceSet> => document.fonts.ready)

      await expect(page).toHaveScreenshot(`engagement-kanban-dialog-${dir}-${viewport.width}.png`, {
        maxDiffPixelRatio: 0.01,
        fullPage: true,
      })
    })
  }
})

// EngagementDossierPage trigger coverage: this spec opens the dialog through the dossier page.
