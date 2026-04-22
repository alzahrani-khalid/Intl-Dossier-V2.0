/**
 * phase-36-shell.spec.ts — Wave 0 RED Playwright scaffold (Phase 36).
 *
 * Wave 2 Plan 05 fills these tests. Titles match VALIDATION.md §Per-Task
 * Verification Map task ids 36-05-01 / 36-05-02 / 36-05-05. Do NOT rename
 * without updating the --grep commands in CI.
 */

import { test } from '@playwright/test'

test.describe('Phase 36 shell', () => {
  test('shell no remount — route changes do not unmount AppShell', async ({ page: _page }) => {
    // RED: Wave 2 will navigate between routes and assert Sidebar identity stays.
    test.skip()
  })

  test('direction atomic — switching direction does not flicker', async ({ page: _page }) => {
    // RED: Wave 2 will toggle direction via Tweaks drawer and assert no FOUC.
    test.skip()
  })

  test('shell tab order — tab cycles through topbar controls then sidebar nav', async ({
    page: _page,
  }) => {
    // RED: Wave 2 will press Tab repeatedly and log document.activeElement path.
    test.skip()
  })
})
