import { test, expect } from '@playwright/test'

// Phase 52 KANBAN-01: TasksTab keyboard DnD parity.
// dnd-kit's KeyboardSensor (CONTEXT.md D-04: coordinateGetter:
// sortableKeyboardCoordinates) lifts a card with Space, moves with Arrow keys,
// drops with Space. Direction flip in RTL is handled by sortableKeyboardCoordinates
// (it reads the parent flex direction), so the same key sequence works in both
// dirs — we only swap the ArrowRight/ArrowLeft semantic for the assertion
// description.

const matrix = [
  { dir: 'ltr', viewport: { width: 1280, height: 800 } },
  { dir: 'ltr', viewport: { width: 768, height: 1024 } },
  { dir: 'rtl', viewport: { width: 1280, height: 800 } },
  { dir: 'rtl', viewport: { width: 768, height: 1024 } },
] as const

const SEEDED_ENGAGEMENT_ID =
  process.env.PHASE_52_FIXTURE_ENGAGEMENT_ID ?? '00000000-0000-0052-0000-000000000001'

test.describe('Phase 52: Tasks tab Kanban keyboard parity', () => {
  for (const { dir, viewport } of matrix) {
    test(`tasks tab keyboard move persists in ${dir} @ ${viewport.width}x${viewport.height}`, async ({
      page,
    }): Promise<void> => {
      if (viewport.width < 1024) {
        test.skip(true, 'Keyboard DnD targets desktop only; mobile uses the "Move to" select')
      }

      await page.addInitScript((d: string): void => {
        localStorage.setItem('i18nextLng', d === 'rtl' ? 'ar' : 'en')
      }, dir)
      await page.setViewportSize(viewport)
      await page.goto(`/engagements/${SEEDED_ENGAGEMENT_ID}`)
      await page.waitForLoadState('networkidle')

      const todoColumn = page.locator('[data-droppable-id="todo"]').first()
      const todoCard = todoColumn.locator('[data-card-id]').first()
      if ((await todoCard.count()) === 0) {
        test.skip(true, 'No cards seeded in the todo column for the fixture engagement')
      }
      const cardId = await todoCard.getAttribute('data-card-id')
      expect(cardId).toBeTruthy()

      // Focus the card. dnd-kit's KeyboardSensor binds to `tabIndex={0}` on
      // sortable items so Tab reaches them. We focus directly to avoid having
      // to traverse the entire page's tab order.
      await todoCard.focus()

      // Pick up the card.
      await page.keyboard.press('Space')

      // dnd-kit emits screen-reader announcements via the accessibility API.
      // The announcement region is a visually hidden role="status" injected by
      // dnd-kit; assert it appears with "Picked up" copy.
      const announcement = page.locator('[role="status"]').filter({ hasText: /Picked up|التقاط/i })
      await expect(announcement).toBeAttached({ timeout: 2000 })

      // Move toward the next column. In LTR Arrow flow is left→right; in RTL
      // sortableKeyboardCoordinates already inverts. The flexbox reading order
      // means ArrowRight always advances toward in_progress in LTR. For RTL we
      // swap to ArrowLeft so the visual move is toward in_progress (rightward
      // in DOM order = leftward visually in RTL).
      const advance = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
      // Two presses: first lands in/over the next column's drop zone.
      await page.keyboard.press(advance)
      await page.keyboard.press(advance)

      // Drop.
      await page.keyboard.press('Space')

      // Mutation flight.
      await page.waitForTimeout(800)

      // Reload and assert position.
      await page.reload()
      await page.waitForLoadState('networkidle')
      const movedCard = page
        .locator('[data-droppable-id="in_progress"]')
        .first()
        .locator(`[data-card-id="${cardId}"]`)
      await expect(movedCard).toBeVisible()
    })
  }
})
