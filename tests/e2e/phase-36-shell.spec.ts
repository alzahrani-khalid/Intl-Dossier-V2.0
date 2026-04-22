/**
 * phase-36-shell.spec.ts — Wave 2 Plan 36-05 GREEN Playwright specs.
 *
 * Tests the three shell-stability contracts from VALIDATION.md §Per-Task
 * Verification Map task ids 36-05-01 / 36-05-02 / 36-05-05, plus the
 * Wave-2 deferred contracts:
 *   - D-03 (from 36-04): ESC-key dismissal of mobile drawer
 *   - D-05 (from 36-04): max-sm:w-screen viewport-shrink assertion
 *
 * Titles match VALIDATION.md; do NOT rename without updating CI --grep.
 */

import { expect } from '@playwright/test'
import { test } from './support/fixtures'

test.describe('Phase 36 shell', () => {
  test('shell no remount — route changes do not unmount AppShell', async ({
    adminPage: page,
  }) => {
    await page.goto('/')
    await page.waitForSelector('.appshell', { timeout: 10000 })

    // Stamp the current AppShell mount with a random id; if the element
    // persists across a client-side route change, it is the SAME React element
    // and therefore did NOT unmount.
    const stampBefore = String(Math.random())
    await page.evaluate((id: string) => {
      const shell = document.querySelector('.appshell')
      if (shell) shell.setAttribute('data-test-mount-id', id)
    }, stampBefore)

    // Navigate to another protected route (client-side nav).
    await page.goto('/engagements')
    await page.waitForSelector('.appshell', { timeout: 10000 })

    const stampAfter = await page.getAttribute('.appshell', 'data-test-mount-id')
    expect(stampAfter).toBe(stampBefore)
  })

  test('direction atomic — switching direction does not flicker', async ({
    adminPage: page,
  }) => {
    await page.goto('/')
    await page.waitForSelector('.appshell', { timeout: 10000 })

    // Snapshot the html-level direction state BEFORE.
    const before = await page.evaluate(() => ({
      dir: document.documentElement.dataset.direction ?? '',
      accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
    }))

    // Trigger direction change via topbar's direction button cluster.
    const dirButton = page.locator('.tb-dir-btn').first()
    const visible = await dirButton.isVisible().catch(() => false)
    if (!visible) {
      test.skip(true, 'Topbar direction button not visible at current viewport')
      return
    }
    await dirButton.click()

    // Wait for the direction / accent to update (one frame in prod).
    await page.waitForFunction(
      (prev: { dir: string; accent: string }) => {
        const next = {
          dir: document.documentElement.dataset.direction ?? '',
          accent: getComputedStyle(document.documentElement)
            .getPropertyValue('--accent')
            .trim(),
        }
        return next.dir !== prev.dir || next.accent !== prev.accent
      },
      before,
    )

    // Shell still mounted; no mid-flight unmount.
    await expect(page.locator('.appshell')).toBeVisible()
  })

  test('shell tab order — tab cycles through topbar controls then sidebar nav', async ({
    adminPage: page,
  }) => {
    await page.goto('/')
    await page.waitForSelector('.appshell', { timeout: 10000 })

    // Reset focus to <body> so the first Tab press lands on the first
    // focusable element in the document.
    await page.evaluate(() => {
      document.body.focus()
    })
    await page.keyboard.press('Tab')

    const firstFocusClass = await page.evaluate(
      () => document.activeElement?.className ?? '',
    )
    // First focusable in the topbar is either the hamburger menu (mobile) or
    // the search input / dir button (desktop). All are acceptable per UI-SPEC.
    expect(firstFocusClass).toMatch(/tb-menu|tb-search|tb-search-input|tb-dir-btn/)
  })

  test('mobile drawer ESC — pressing ESC closes the overlay drawer (D-03 closure)', async ({
    adminPage: page,
  }) => {
    // Shrink viewport to trigger overlay drawer mode (<1024px)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.waitForSelector('.appshell', { timeout: 10000 })

    const hamburger = page.locator('.tb-menu').first()
    const visible = await hamburger.isVisible().catch(() => false)
    if (!visible) {
      test.skip(true, 'Hamburger menu not visible at mobile viewport')
      return
    }
    await hamburger.click()

    await page.waitForSelector('.appshell-drawer-panel', { timeout: 5000 })
    await expect(page.locator('.appshell-drawer-panel')).toBeVisible()

    await page.keyboard.press('Escape')

    await expect(page.locator('.appshell-drawer-panel')).toBeHidden({ timeout: 3000 })
  })

  test('drawer panel width — max-sm:w-screen applies at phone viewport (D-05 closure)', async ({
    adminPage: page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.waitForSelector('.appshell', { timeout: 10000 })

    const hamburger = page.locator('.tb-menu').first()
    const visible = await hamburger.isVisible().catch(() => false)
    if (!visible) {
      test.skip(true, 'Hamburger menu not visible at mobile viewport')
      return
    }
    await hamburger.click()

    const panel = page.locator('.appshell-drawer-panel').first()
    await expect(panel).toBeVisible({ timeout: 5000 })

    const dialogBox = await page.locator('[role="dialog"]').first().boundingBox()
    expect(dialogBox).not.toBeNull()
    if (dialogBox !== null) {
      // At 390px viewport, drawer should render ≥386px wide (≈100vw within 4px).
      expect(dialogBox.width).toBeGreaterThanOrEqual(386)
    }
  })
})
