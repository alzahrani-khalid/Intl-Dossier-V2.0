import { test, expect } from '@playwright/test'

// Phase 52 KANBAN-02: EngagementKanbanDialog drag-and-drop parity (pointer).
// The dialog is opened from EngagementDossierPage's Kanban trigger button; once
// open it renders the same shared @/components/kanban primitive as TasksTab,
// so the assertion strategy mirrors tasks-tab-dnd.spec.ts.

const matrix = [
  { dir: 'ltr', viewport: { width: 1280, height: 800 } },
  { dir: 'ltr', viewport: { width: 768, height: 1024 } },
  { dir: 'rtl', viewport: { width: 1280, height: 800 } },
  { dir: 'rtl', viewport: { width: 768, height: 1024 } },
] as const

const SEEDED_ENGAGEMENT_ID =
  process.env.PHASE_52_FIXTURE_ENGAGEMENT_ID ?? '00000000-0000-0052-0000-000000000001'

test.describe('Phase 52: EngagementKanbanDialog drag-and-drop parity', () => {
  for (const { dir, viewport } of matrix) {
    test(`dialog drag persists in ${dir} @ ${viewport.width}x${viewport.height}`, async ({
      page,
    }): Promise<void> => {
      if (viewport.width < 1024) {
        test.skip(true, 'Dialog DnD targets desktop only (min-w-[1200px] board content)')
      }

      await page.addInitScript((d: string): void => {
        localStorage.setItem('i18nextLng', d === 'rtl' ? 'ar' : 'en')
      }, dir)
      await page.setViewportSize(viewport)
      await page.goto(`/dossiers/engagements/${SEEDED_ENGAGEMENT_ID}`)
      await page.waitForLoadState('networkidle')

      // Open the Kanban dialog from the EngagementDossierPage trigger.
      await page
        .getByRole('button', { name: /kanban|board|اللوحة|كانبان/i })
        .first()
        .click()
      // Wait for the dialog to mount and for the columns to render.
      await page.waitForSelector('[data-droppable-id="todo"]', { state: 'visible' })

      const todoColumn = page.locator('[data-droppable-id="todo"]').first()
      const todoCard = todoColumn.locator('[data-card-id]').first()
      if ((await todoCard.count()) === 0) {
        test.skip(true, 'No cards seeded in the todo column for the fixture engagement')
      }
      const cardId = await todoCard.getAttribute('data-card-id')
      expect(cardId).toBeTruthy()

      const targetColumn = page.locator('[data-droppable-id="in_progress"]').first()
      const targetBox = await targetColumn.boundingBox()
      const sourceBox = await todoCard.boundingBox()
      expect(targetBox).not.toBeNull()
      expect(sourceBox).not.toBeNull()
      if (targetBox === null || sourceBox === null) return

      await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2)
      await page.mouse.down()
      await page.mouse.move(
        sourceBox.x + sourceBox.width / 2 + 12,
        sourceBox.y + sourceBox.height / 2 + 12,
        { steps: 4 },
      )
      await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, {
        steps: 12,
      })
      await page.mouse.up()
      await page.waitForTimeout(800)

      // Reload, re-open the dialog, assert the card is now under in_progress.
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
