import { test, expect } from '@playwright/test'

// Phase 52 KANBAN-01: TasksTab drag-and-drop behavior parity (pointer).
// Mirrors frontend/tests/e2e/kanban-dnd.spec.ts (the WorkBoard regression anchor)
// drag pattern. Keyboard parity is in tasks-tab-keyboard.spec.ts; this spec only
// asserts that pointer-drag from `todo` to `in_progress` persists across reload.
//
// Matrix shape kept consistent with the visual + a11y + keyboard specs (4 rows)
// so failures map row-for-row to a viewport×dir. The actual mouse-drag exercises
// the desktop branch only (TasksTab gates the dnd UI behind `md:`).

const matrix = [
  { dir: 'ltr', viewport: { width: 1280, height: 800 } },
  { dir: 'ltr', viewport: { width: 768, height: 1024 } },
  { dir: 'rtl', viewport: { width: 1280, height: 800 } },
  { dir: 'rtl', viewport: { width: 768, height: 1024 } },
] as const

const SEEDED_ENGAGEMENT_ID =
  process.env.PHASE_52_FIXTURE_ENGAGEMENT_ID ?? '00000000-0000-0052-0000-000000000001'

test.describe('Phase 52: Tasks tab Kanban drag-and-drop parity', () => {
  for (const { dir, viewport } of matrix) {
    test(`tasks tab drag persists in ${dir} @ ${viewport.width}x${viewport.height}`, async ({
      page,
    }): Promise<void> => {
      // Mobile branch is read-only — TasksTab gates the Kanban DnD UI behind
      // `md:block` (≥768) and renders the mobile-stacked accordion below it
      // (CONTEXT.md §"Responsive Design"). At exactly 768 we sit on the border
      // (md = 768 in Tailwind v4), so the desktop branch renders. We still skip
      // pointer drag at the 768 viewport to keep the assertion crisp: the dnd
      // exercise is desktop-primary, and mobile uses the "Move to" select instead.
      if (viewport.width < 1024) {
        test.skip(true, 'Pointer DnD is desktop-primary (≥1024); mobile uses the "Move to" select')
      }

      await page.addInitScript((d: string): void => {
        localStorage.setItem('i18nextLng', d === 'rtl' ? 'ar' : 'en')
      }, dir)
      await page.setViewportSize(viewport)
      await page.goto(`/engagements/${SEEDED_ENGAGEMENT_ID}`)
      await page.waitForLoadState('networkidle')

      // Locate a card in the `todo` column and its visible text. The card lives
      // under the KanbanBoard whose data-droppable-id="todo".
      const todoColumn = page.locator('[data-droppable-id="todo"]').first()
      const todoCard = todoColumn.locator('[data-card-id]').first()
      if ((await todoCard.count()) === 0) {
        test.skip(true, 'No cards seeded in the todo column for the fixture engagement')
      }
      const cardText = await todoCard.textContent()
      const cardId = await todoCard.getAttribute('data-card-id')
      expect(cardId).toBeTruthy()

      // Pointer drag from the todo card to the in_progress column. Use
      // bounding-box centerpoints so the move travels through dnd-kit's
      // MouseSensor (distance:8 activation constraint, per CONTEXT D-04).
      const targetColumn = page.locator('[data-droppable-id="in_progress"]').first()
      await expect(targetColumn).toBeVisible()
      const targetBox = await targetColumn.boundingBox()
      const sourceBox = await todoCard.boundingBox()
      expect(targetBox).not.toBeNull()
      expect(sourceBox).not.toBeNull()
      if (targetBox === null || sourceBox === null) return

      await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2)
      await page.mouse.down()
      // First small move satisfies the MouseSensor activation distance (8px).
      await page.mouse.move(
        sourceBox.x + sourceBox.width / 2 + 12,
        sourceBox.y + sourceBox.height / 2 + 12,
        { steps: 4 },
      )
      // Move to the centerpoint of the in_progress column.
      await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, {
        steps: 12,
      })
      await page.mouse.up()

      // Mutation flight + optimistic update + TanStack Query invalidation.
      await page.waitForTimeout(800)

      // Reload and assert the card is now under in_progress.
      await page.reload()
      await page.waitForLoadState('networkidle')
      const movedCard = page
        .locator('[data-droppable-id="in_progress"]')
        .first()
        .locator(`[data-card-id="${cardId}"]`)
      await expect(movedCard).toBeVisible()
      if (cardText !== null) {
        // The visible text should be preserved across the move.
        const movedText = await movedCard.textContent()
        expect(movedText).toBe(cardText)
      }
    })
  }
})
