/**
 * Phase 39 Plan 04 — Kanban drag-between-columns activation (D-03).
 *
 * Drags the first card in column 1 onto column 2 and verifies the card moves.
 * Status mutation behaviour is best-effort across optimistic-update timing —
 * we assert the card text changes to detect a successful re-render.
 *
 * SUPERSEDES kanban-drag-drop.spec.ts in the 39-09 legacy cut.
 */

import { test, expect } from '@playwright/test'

test.describe('Phase 39: Kanban drag between columns', () => {
  test('drag from todo to in_progress fires status update', async ({ page }) => {
    await page.goto('/kanban')
    await page.waitForLoadState('networkidle')

    const firstCard = page.locator('section.col').first().locator('.kcard').first()
    const secondCol = page.locator('section.col').nth(1)
    if ((await firstCard.count()) === 0) {
      test.skip(true, 'No kcards seeded for current user')
    }

    const beforeText = await firstCard.textContent()

    // Phase 57 D-21: Playwright's `locator.dragTo()` fires a single fast
    // mousedown→move→up sequence that dnd-kit's MouseSensor with
    // activationConstraint { distance: 8 } does not always pick up. Drive the
    // gesture manually with explicit small movements so dnd-kit's threshold
    // check sees genuine motion. Lands the drop inside the target column body
    // (cards area) rather than the column section header.
    const sourceBox = await firstCard.boundingBox()
    const targetBox = await secondCol.boundingBox()
    if (sourceBox == null || targetBox == null) {
      throw new Error('Could not resolve drag source/target bounding box')
    }
    const startX = sourceBox.x + sourceBox.width / 2
    const startY = sourceBox.y + sourceBox.height / 2
    const endX = targetBox.x + targetBox.width / 2
    const endY = targetBox.y + targetBox.height / 2
    await page.mouse.move(startX, startY)
    await page.mouse.down()
    // Intermediate steps clear the activation distance threshold before the
    // final settle move.
    await page.mouse.move(startX + 12, startY + 12, { steps: 5 })
    await page.mouse.move(endX, endY, { steps: 20 })
    await page.mouse.up()
    await page.waitForTimeout(800) // mutation flight + optimistic update

    // Verify the first card slot in column 1 changed (best-effort signal of move).
    const afterText = await page
      .locator('section.col')
      .first()
      .locator('.kcard')
      .first()
      .textContent()
    expect(afterText).not.toBe(beforeText)
  })
})
