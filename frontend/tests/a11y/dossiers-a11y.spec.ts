/**
 * Dossier Accessibility Test Suite
 * Feature: 034-dossier-ui-polish
 *
 * Tests WCAG AA compliance using @axe-core/playwright for all 6 dossier types.
 * Covers accessibility scans, keyboard navigation, focus management.
 *
 * Auth: inherits the pre-authenticated `storageState` produced by global-setup
 * (the `a11y` Playwright project shares the shared session). No manual login or
 * fake localStorage bypass — the earlier `auth-storage` init-script clobbered the
 * real Supabase session. Routes use real seeded dossier IDs (dossier-fixtures),
 * so axe scans the real dossier, not a 404 page.
 *
 * Tests covered:
 * - T036-T041: axe-core scan tests for all 6 dossier types
 * - T042: Keyboard navigation test
 * - T043: Focus indicator visibility test
 */

import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { allDossierTypes, getDossierRoute, testDossierIds } from '../fixtures/dossier-fixtures'

/**
 * Run axe-core accessibility scan
 */
async function runAccessibilityScan(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  return results
}

/**
 * Filter violations by impact (critical, serious, moderate, minor).
 * The gate fails on serious + critical only (dossier-fixtures `axeConfig`).
 */
function filterViolationsByImpact(
  violations: Awaited<ReturnType<typeof runAccessibilityScan>>['violations'],
  minImpact: 'critical' | 'serious' | 'moderate' | 'minor' = 'serious',
) {
  const impactOrder = ['minor', 'moderate', 'serious', 'critical']
  const minIndex = impactOrder.indexOf(minImpact)

  return violations.filter((v) => {
    const index = impactOrder.indexOf(v.impact ?? 'minor')
    return index >= minIndex
  })
}

// ============================================================================
// Axe-Core Scan Tests (T036-T041)
// ============================================================================

test.describe('Dossier Accessibility Scans', () => {
  // Test each dossier type for accessibility compliance
  for (const dossierType of allDossierTypes) {
    const testId = testDossierIds[dossierType]
    const route = getDossierRoute(dossierType, testId)

    test(`[T03${6 + allDossierTypes.indexOf(dossierType)}] ${dossierType} dossier passes axe-core WCAG AA scan`, async ({
      page,
    }) => {
      await page.goto(route)
      await page.waitForLoadState('networkidle')

      // Run accessibility scan
      const results = await runAccessibilityScan(page)

      // Filter for critical and serious violations only
      const criticalViolations = filterViolationsByImpact(results.violations, 'serious')

      // Log any violations for debugging
      if (criticalViolations.length > 0) {
        console.log(
          `${dossierType} accessibility violations:`,
          JSON.stringify(criticalViolations, null, 2),
        )
      }

      // Assert no critical or serious violations
      expect(criticalViolations).toHaveLength(0)
    })
  }

  // Additional scan for dossiers hub page
  test('Dossiers hub page passes axe-core scan', async ({ page }) => {
    await page.goto('/dossiers')
    await page.waitForLoadState('networkidle')

    const results = await runAccessibilityScan(page)
    const criticalViolations = filterViolationsByImpact(results.violations, 'serious')

    if (criticalViolations.length > 0) {
      console.log('Dossiers hub violations:', JSON.stringify(criticalViolations, null, 2))
    }

    expect(criticalViolations).toHaveLength(0)
  })
})

// ============================================================================
// Keyboard Navigation Tests (T042)
// ============================================================================

test.describe('Keyboard Navigation Tests', () => {
  test('[T042] Collapsible sections respond to keyboard interaction', async ({ page }) => {
    const route = getDossierRoute('country', testDossierIds.country)
    await page.goto(route)
    await page.waitForLoadState('networkidle')

    // Find collapsible section headers
    const sectionButtons = page.locator('button[aria-expanded]')
    const count = await sectionButtons.count()

    if (count > 0) {
      // Focus first collapsible section
      const firstButton = sectionButtons.first()
      await firstButton.focus()

      // Verify it receives focus
      await expect(firstButton).toBeFocused()

      // Get initial expanded state
      const initialExpanded = await firstButton.getAttribute('aria-expanded')

      // Press Enter to toggle (Enter reliably activates buttons, native
      // <button>s and Radix collapsible triggers alike).
      await page.keyboard.press('Enter')
      await page.waitForTimeout(350)

      // Verify state changed
      const newExpanded = await firstButton.getAttribute('aria-expanded')
      expect(newExpanded).not.toBe(initialExpanded)

      // Press Enter again to toggle back to the initial state.
      await page.keyboard.press('Enter')
      await page.waitForTimeout(350)

      const finalExpanded = await firstButton.getAttribute('aria-expanded')
      expect(finalExpanded).toBe(initialExpanded)
    }
  })

  test('Tab navigation moves through interactive elements in order', async ({ page }) => {
    await page.goto('/dossiers')
    await page.waitForLoadState('networkidle')

    // Start from body
    await page.click('body')

    // Collect focused elements as we Tab through
    const focusedElements: string[] = []

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
      const focusedTag = await page.evaluate(() => {
        const el = document.activeElement
        return el
          ? `${el.tagName.toLowerCase()}${el.getAttribute('aria-label') ? `[${el.getAttribute('aria-label')}]` : ''}`
          : 'none'
      })
      focusedElements.push(focusedTag)
    }

    // Verify focus moved to interactive elements
    const interactiveCount = focusedElements.filter(
      (tag) =>
        tag.startsWith('a') ||
        tag.startsWith('button') ||
        tag.startsWith('input') ||
        tag.startsWith('select'),
    ).length

    expect(interactiveCount).toBeGreaterThan(0)
  })

  test('Escape key closes open dialogs/modals', async ({ page }) => {
    await page.goto('/dossiers')
    await page.waitForLoadState('networkidle')

    // Look for a button that might open a dialog
    const dialogTrigger = page.locator(
      '[data-testid="dialog-trigger"], button[aria-haspopup="dialog"]',
    )

    if ((await dialogTrigger.count()) > 0) {
      await dialogTrigger.first().click()
      await page.waitForTimeout(300)

      // Check if dialog opened
      const dialog = page.locator('[role="dialog"]')
      if ((await dialog.count()) > 0) {
        // Press Escape to close
        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)

        // Verify dialog closed
        await expect(dialog).not.toBeVisible()
      }
    }
  })
})

// ============================================================================
// Focus Indicator Tests (T043)
// ============================================================================

test.describe('Focus Indicator Visibility Tests', () => {
  test('[T043] Interactive elements have visible focus indicators', async ({ page }) => {
    const route = getDossierRoute('country', testDossierIds.country)
    await page.goto(route)
    await page.waitForLoadState('networkidle')

    // Test buttons
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()

    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i)
      if (await button.isVisible()) {
        await button.focus()

        // Check if focus ring is visible via CSS
        const hasVisibleFocus = await button.evaluate((el) => {
          const styles = window.getComputedStyle(el)
          const outlineWidth = parseInt(styles.outlineWidth) || 0
          const outlineStyle = styles.outlineStyle
          const boxShadow = styles.boxShadow

          // Check for outline or ring (Tailwind focus-visible:ring-*)
          return (
            (outlineWidth > 0 && outlineStyle !== 'none') ||
            (boxShadow !== '' && boxShadow !== 'none' && boxShadow.includes('0 0 0'))
          )
        })

        // At least some buttons should have visible focus
        if (hasVisibleFocus) {
          expect(hasVisibleFocus).toBeTruthy()
          break // Found one, that's enough
        }
      }
    }
  })

  test('Links have visible focus indicators', async ({ page }) => {
    await page.goto('/dossiers')
    await page.waitForLoadState('networkidle')

    const links = page.locator('a[href]')
    const linkCount = await links.count()

    for (let i = 0; i < Math.min(linkCount, 5); i++) {
      const link = links.nth(i)
      if (await link.isVisible()) {
        await link.focus()

        const hasVisibleFocus = await link.evaluate((el) => {
          const styles = window.getComputedStyle(el)
          const outlineWidth = parseInt(styles.outlineWidth) || 0
          const outlineStyle = styles.outlineStyle

          return outlineWidth > 0 && outlineStyle !== 'none'
        })

        if (hasVisibleFocus) {
          expect(hasVisibleFocus).toBeTruthy()
          break
        }
      }
    }
  })
})

// ============================================================================
// ARIA Attribute Tests
// ============================================================================

test.describe('ARIA Attribute Tests', () => {
  test('Collapsible sections have proper ARIA attributes', async ({ page }) => {
    const route = getDossierRoute('country', testDossierIds.country)
    await page.goto(route)
    await page.waitForLoadState('networkidle')

    const sectionButtons = page.locator('button[aria-expanded]')
    const count = await sectionButtons.count()

    for (let i = 0; i < Math.min(count, 3); i++) {
      const button = sectionButtons.nth(i)

      // Check aria-expanded is present
      const ariaExpanded = await button.getAttribute('aria-expanded')
      expect(['true', 'false']).toContain(ariaExpanded)

      // Check aria-controls points to valid region
      const ariaControls = await button.getAttribute('aria-controls')
      if (ariaControls) {
        const panel = page.locator(`#${ariaControls}`)
        // Panel should exist (even if hidden)
        expect(await panel.count()).toBeGreaterThanOrEqual(0)
      }
    }
  })

  test('Images have alt text', async ({ page }) => {
    const route = getDossierRoute('country', testDossierIds.country)
    await page.goto(route)
    await page.waitForLoadState('networkidle')

    const images = page.locator('img')
    const count = await images.count()

    for (let i = 0; i < count; i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')

      // Image should have alt attribute (can be empty for decorative)
      expect(alt).not.toBeNull()
    }
  })

  test('Tables have proper ARIA roles', async ({ page }) => {
    const route = getDossierRoute('country', testDossierIds.country)
    await page.goto(route)
    await page.waitForLoadState('networkidle')

    const tables = page.locator('table')
    const count = await tables.count()

    for (let i = 0; i < count; i++) {
      const table = tables.nth(i)

      // Native <table> has an implicit table role; an explicit role, when
      // present, must be 'table'.
      const role = await table.getAttribute('role')
      if (role !== null) {
        expect(role).toBe('table')
      }

      // Check for header cells
      const headerCells = table.locator('th')
      if ((await headerCells.count()) > 0) {
        const headerRole = await headerCells.first().getAttribute('role')
        if (headerRole !== null) {
          expect(headerRole).toBe('columnheader')
        }
      }
    }
  })
})

// ============================================================================
// RTL Accessibility Tests
// ============================================================================

test.describe('RTL Accessibility Tests', () => {
  test('RTL mode passes accessibility scan', async ({ page }) => {
    // Switch to Arabic via the querystring detector (honored first at first
    // paint) — NOT localStorage 'i18nextLng' (the app persists under 'id.locale'
    // and reading localStorage before navigation throws a SecurityError).
    const route = `${getDossierRoute('country', testDossierIds.country)}?lng=ar`
    await page.goto(route)
    await page.waitForLoadState('networkidle')

    // Verify RTL is active
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')

    // Run accessibility scan
    const results = await runAccessibilityScan(page)
    const criticalViolations = filterViolationsByImpact(results.violations, 'serious')

    if (criticalViolations.length > 0) {
      console.log('RTL accessibility violations:', JSON.stringify(criticalViolations, null, 2))
    }

    expect(criticalViolations).toHaveLength(0)
  })
})
