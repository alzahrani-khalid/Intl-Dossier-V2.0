// Phase 42-04 / 42-07 — Tasks ("My desk") functional E2E.
//
// Scaffolded in Wave 0 (plan 42-04) as a skipped placeholder; activated by
// Wave 1 plan 42-07 once MyTasksPage was reskinned to the handoff
// `.tasks-list` anatomy. Covers:
//   - .tasks-list renders
//   - done-toggle flips visual state without navigation
//   - Assigned/Contributed tabs swap
import { test, expect } from '@playwright/test'
import { setupPhase42Test, gotoPhase42Page, PHASE_42_ROUTES } from './support/phase-42-fixtures'

test.describe('Phase 42 — Tasks page', () => {
  test.beforeEach(async ({ page }) => {
    await setupPhase42Test({ page })
    await page.setViewportSize({ width: 1280, height: 800 })
  })

  test('renders .tasks-list', async ({ page }) => {
    await gotoPhase42Page(page, PHASE_42_ROUTES.tasks)
    await expect(page.locator('ul.tasks-list')).toBeVisible()
  })

  test('done-toggle flips visual state without nav', async ({ page }) => {
    await gotoPhase42Page(page, PHASE_42_ROUTES.tasks)
    const initialUrl = page.url()
    await page.locator('button.task-box').first().click()
    expect(page.url()).toBe(initialUrl)
    await expect(page.locator('li.task-row').first()).toHaveCSS('opacity', /0\.4[0-9]+/)
  })

  test('tabs swap between Assigned and Contributed', async ({ page }) => {
    await gotoPhase42Page(page, PHASE_42_ROUTES.tasks)
    await page.getByRole('tab', { name: /contributed|مساهمات/i }).click()
    await expect(page.getByRole('tab', { name: /contributed|مساهمات/i })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })
})
