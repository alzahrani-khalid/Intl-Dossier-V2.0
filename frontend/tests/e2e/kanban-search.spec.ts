/**
 * Phase 39 Plan 03 — Activated by 39-03 (was scaffolded as a skipped stub in 39-00).
 *
 * Asserts that the BoardToolbar search input filters work items CLIENT-SIDE
 * (D-07): typing into the search box must NOT trigger any additional
 * unified-kanban API calls beyond the initial page load.
 *
 * NOTE: A pre-existing ESM `__dirname` bug in `frontend/playwright.config.ts`
 * may block `playwright test --list` until fixed in 39-09. Assertions are
 * authored regardless so the spec runs the moment the runner unblocks.
 */

import { test, expect } from '@playwright/test'

test.describe('Phase 39: Kanban client-side search', () => {
  test('search filters items without firing additional unified-kanban API calls', async ({
    page,
  }) => {
    let unifiedKanbanCalls = 0
    await page.route('**/api/**unified-kanban**', (route) => {
      unifiedKanbanCalls++
      return route.continue()
    })

    await page.goto('/kanban')
    await page.waitForLoadState('networkidle')
    const baselineCalls = unifiedKanbanCalls

    const search = page.getByRole('searchbox')
    await search.fill('Acme')
    // Allow any (incorrect) debounced fetch to settle before counting.
    await page.waitForTimeout(500)

    expect(unifiedKanbanCalls).toBe(baselineCalls)
  })
})
