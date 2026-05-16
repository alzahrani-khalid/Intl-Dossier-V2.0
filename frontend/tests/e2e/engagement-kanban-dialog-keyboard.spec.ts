import { test, expect } from '@playwright/test'

// Phase 52 KANBAN-02: EngagementKanbanDialog keyboard DnD parity.
// Same shared @/components/kanban primitive as TasksTab; the only delta is
// opening the dialog before driving the keyboard sequence.

const matrix = [
  { dir: 'ltr', viewport: { width: 1280, height: 800 } },
  { dir: 'ltr', viewport: { width: 768, height: 1024 } },
  { dir: 'rtl', viewport: { width: 1280, height: 800 } },
  { dir: 'rtl', viewport: { width: 768, height: 1024 } },
] as const

const SEEDED_ENGAGEMENT_ID =
  process.env.PHASE_52_FIXTURE_ENGAGEMENT_ID ?? '00000000-0000-0052-0000-000000000001'

test.describe('Phase 52: EngagementKanbanDialog keyboard parity', () => {
  for (const { dir, viewport } of matrix) {
    test(`dialog keyboard move persists in ${dir} @ ${viewport.width}x${viewport.height}`, async ({
      page,
    }): Promise<void> => {
      if (viewport.width < 1024) {
        test.skip(true, 'Dialog keyboard DnD targets desktop only')
      }

      await page.addInitScript((d: string): void => {
        localStorage.setItem('i18nextLng', d === 'rtl' ? 'ar' : 'en')
      }, dir)
      await page.setViewportSize(viewport)
      await page.goto(`/dossiers/engagements/${SEEDED_ENGAGEMENT_ID}`)
      await page.waitForLoadState('networkidle')

      await page
        .getByRole('button', { name: /kanban|board|اللوحة|كانبان/i })
        .first()
        .click()
      await page.waitForSelector('[data-droppable-id="todo"]', { state: 'visible' })

      const todoColumn = page.locator('[data-droppable-id="todo"]').first()
      const todoCard = todoColumn.locator('[data-card-id]').first()
      if ((await todoCard.count()) === 0) {
        test.skip(true, 'No cards seeded in the todo column for the fixture engagement')
      }
      const cardId = await todoCard.getAttribute('data-card-id')
      expect(cardId).toBeTruthy()

      await todoCard.focus()
      await page.keyboard.press('Space')
      const announcement = page.locator('[role="status"]').filter({ hasText: /Picked up|التقاط/i })
      await expect(announcement).toBeAttached({ timeout: 2000 })

      const advance = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
      await page.keyboard.press(advance)
      await page.keyboard.press(advance)
      await page.keyboard.press('Space')

      await page.waitForTimeout(800)
      await page.reload()
      await page.waitForLoadState('networkidle')
      await page
        .getByRole('button', { name: /kanban|board|اللوحة|كانبان/i })
        .first()
        .click()
      await page.waitForSelector('[data-droppable-id="in_progress"]', { state: 'visible' })
      const movedCard = page
        .locator('[data-droppable-id="in_progress"]')
        .first()
        .locator(`[data-card-id="${cardId}"]`)
      await expect(movedCard).toBeVisible()
    })
  }
})
