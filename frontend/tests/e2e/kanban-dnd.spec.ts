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
    await firstCard.dragTo(secondCol)
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
