import { test, expect } from '@playwright/test'

const matrix = [
  { dir: 'ltr', viewport: { width: 1280, height: 800 } },
  { dir: 'ltr', viewport: { width: 768, height: 1024 } },
  { dir: 'rtl', viewport: { width: 1280, height: 800 } },
  { dir: 'rtl', viewport: { width: 768, height: 1024 } },
] as const

const SEEDED_ENGAGEMENT_ID =
  process.env.PHASE_52_FIXTURE_ENGAGEMENT_ID ?? 'phase-52-fixture-engagement'

test.describe('Phase 52: EngagementKanbanDialog keyboard parity', () => {
  for (const { dir, viewport } of matrix) {
    test(`dialog keyboard move persists in ${dir} @ ${viewport.width}x${viewport.height}`, async ({
      page,
    }): Promise<void> => {
      test.fixme(true, 'TODO: implement after Plan 03 lands; see 52-VALIDATION.md row 52-XX-08')
      await page.addInitScript((d: string): void => {
        localStorage.setItem('i18nextLng', d === 'rtl' ? 'ar' : 'en')
      }, dir)
      await page.setViewportSize(viewport)
      await page.goto(`/dossiers/engagements/${SEEDED_ENGAGEMENT_ID}`)
      await expect(page).toHaveURL(/dossiers\/engagements/)
    })
  }
})
