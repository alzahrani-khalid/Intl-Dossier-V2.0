/**
 * Phase 39 Plan 04 — Kanban render activation (BOARD-01, BOARD-02).
 *
 * Asserts the WorkBoard renders the BoardToolbar + 4 BoardColumn sections.
 * Phase 85 D-85-01: the old 3px inline-start edge bar is gone — an overdue
 * card now keeps the plain 1px .kcard hairline AND carries a red semibold
 * mono due chip (span.kdue.is-overdue). The legacy kanban-drag-drop.spec.ts
 * is preserved until 39-09.
 */

import { test, expect } from '@playwright/test'

test.describe('Phase 39: Kanban render', () => {
  test('renders BoardToolbar and 4 columns', async ({ page }) => {
    await page.goto('/kanban')
    await page.waitForLoadState('networkidle')

    // Phase 57 D-21: scope to the board-local searchbox. The global IntelDossier
    // topbar (rendered by _protected layout post-DesignV2 / Phase 55) also
    // contributes a searchbox; both must be addressable, so we scope by class.
    await expect(page.locator('input.board-search')).toBeVisible()

    const columns = page.locator('section.col')
    await expect(columns).toHaveCount(4)

    // D-85-01: any overdue card keeps the plain 1px .kcard hairline (the old 3px
    // inline-start bar is gone) and carries a red semibold mono due chip.
    const overdueCard = page.locator('.kcard.overdue').first()
    if ((await overdueCard.count()) > 0) {
      const result = await overdueCard.evaluate((el) => {
        // Resolve var(--danger) deterministically via an in-page probe.
        const probe = document.createElement('div')
        probe.style.color = 'var(--danger)'
        document.body.appendChild(probe)
        const dangerColor = getComputedStyle(probe).color
        probe.remove()

        const due = el.querySelector('span.kdue.is-overdue')
        const dueStyle = due ? getComputedStyle(due) : null
        return {
          borderInlineStartWidth: getComputedStyle(el).borderInlineStartWidth,
          hasDueChip: due !== null,
          dueFontWeight: dueStyle?.fontWeight ?? null,
          dueColor: dueStyle?.color ?? null,
          dangerColor,
        }
      })
      // (a) 3px bar removed — back to the base .kcard 1px hairline
      expect(result.borderInlineStartWidth).toBe('1px')
      // (b) red semibold mono due chip present
      expect(result.hasDueChip).toBe(true)
      expect(result.dueFontWeight).toBe('600')
      // (c) chip color resolves to the --danger token
      expect(result.dueColor).toBe(result.dangerColor)
    }
  })
})
