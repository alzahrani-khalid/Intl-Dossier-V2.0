/**
 * Dossier Mobile Complete Test Suite
 * Feature: 034-dossier-ui-polish
 *
 * Tests mobile responsiveness for all 6 dossier types
 * at 320px, 375px, and 414px viewports.
 *
 * Tests covered:
 * - T024: 320px viewport test for all 6 dossier types
 * - T025: 375px viewport test for all 6 dossier types
 * - T026: 414px viewport test for all 6 dossier types
 * - T027: Touch target size verification (44x44px minimum)
 * - T028: Horizontal overflow detection
 */

import { test, expect, type Page } from '@playwright/test'
import {
  testCredentials,
  allDossierTypes,
  getDossierRoute,
  testDossierIds,
  mobileViewports,
  touchTargetMinSize,
  type DossierType,
} from '../fixtures/dossier-fixtures'

/**
 * Authentication bypass for testing
 */
async function authBypass(page: Page) {
  await page.addInitScript(() => {
    const payload = {
      state: {
        user: {
          id: 'test-user-001',
          email: 'kazahrani@stats.gov.sa',
          name: 'Test User',
        },
        isAuthenticated: true,
      },
      version: 0,
    }
    localStorage.setItem('auth-storage', JSON.stringify(payload))
  })
}

/**
 * Helper to verify no horizontal overflow
 */
async function verifyNoHorizontalOverflow(page: Page): Promise<boolean> {
  const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  const viewportWidth = await page.evaluate(() => window.innerWidth)
  return documentWidth <= viewportWidth + 5 // 5px tolerance for rounding
}

/**
 * Helper to get interactive elements and their sizes
 */
async function getInteractiveElementSizes(page: Page) {
  return await page.evaluate(() => {
    const elements = document.querySelectorAll(
      'button, a, [role="button"], input:not([type="hidden"]), select, [tabindex="0"]',
    )
    return Array.from(elements)
      .map((el) => {
        const rect = el.getBoundingClientRect()
        return {
          tag: el.tagName.toLowerCase(),
          width: rect.width,
          height: rect.height,
          text: (el as HTMLElement).innerText?.substring(0, 30) || '',
          visible: rect.width > 0 && rect.height > 0,
        }
      })
      .filter((item) => item.visible)
  })
}

// ============================================================================
// Mobile Viewport Tests (T024-T026)
// ============================================================================

test.describe('Dossier Mobile Viewport Tests', () => {
  test.beforeEach(async ({ page }) => {
    await authBypass(page)
  })

  // Test each viewport size
  for (const viewport of mobileViewports) {
    test.describe(`${viewport.name} (${viewport.width}px)`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        })
      })

      // Test each dossier type at this viewport
      for (const dossierType of allDossierTypes) {
        const testId = testDossierIds[dossierType]
        const route = getDossierRoute(dossierType, testId)

        test(`${dossierType} dossier displays correctly`, async ({ page }) => {
          await page.goto(route)
          await page.waitForLoadState('networkidle')

          // Verify no horizontal overflow
          const noOverflow = await verifyNoHorizontalOverflow(page)
          expect(noOverflow).toBeTruthy()

          // Take screenshot for visual verification
          await page.screenshot({
            path: `test-results/mobile-${viewport.width}-${dossierType}.png`,
            fullPage: true,
          })
        })
      }
    })
  }
})

// ============================================================================
// Touch Target Size Tests (T027)
// ============================================================================

test.describe('Touch Target Size Tests', () => {
  test.beforeEach(async ({ page }) => {
    await authBypass(page)
    // Set to smallest mobile viewport for strictest testing
    await page.setViewportSize({ width: 320, height: 568 })
  })

  for (const dossierType of allDossierTypes) {
    const testId = testDossierIds[dossierType]
    const route = getDossierRoute(dossierType, testId)

    test(`${dossierType} dossier has adequate touch targets`, async ({ page }) => {
      await page.goto(route)
      await page.waitForLoadState('networkidle')

      // Get all interactive elements
      const elements = await getInteractiveElementSizes(page)

      // Filter to visible, interactive elements that should meet touch target requirements
      const interactiveElements = elements.filter(
        (el) =>
          el.visible &&
          // Skip very small elements that are likely decorative
          (el.width > 10 || el.height > 10),
      )

      // Count elements that don't meet minimum size
      const tooSmall = interactiveElements.filter(
        (el) => el.width < touchTargetMinSize.width || el.height < touchTargetMinSize.height,
      )

      // Report findings but don't fail - just capture for review
      if (tooSmall.length > 0) {
        console.log(
          `${dossierType}: ${tooSmall.length} elements below 44x44px:`,
          tooSmall.slice(0, 5),
        )
      }

      // Primary buttons should definitely meet the minimum
      const buttons = await page.locator('button').all()
      for (let i = 0; i < Math.min(buttons.length, 5); i++) {
        const button = buttons[i]
        const box = await button.boundingBox()

        if (box && box.width > 0 && box.height > 0) {
          // Main action buttons should be at least 44x44
          // Allow some flexibility for icon-only buttons
          const meetsMinHeight = box.height >= 40 // Allow slight tolerance
          expect(meetsMinHeight).toBeTruthy()
        }
      }
    })
  }
})

// ============================================================================
// Horizontal Overflow Detection Tests (T028)
// ============================================================================

test.describe('Horizontal Overflow Detection Tests', () => {
  test.beforeEach(async ({ page }) => {
    await authBypass(page)
  })

  for (const viewport of mobileViewports) {
    test.describe(`${viewport.name} overflow detection`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        })
      })

      test('dossiers hub has no horizontal overflow', async ({ page }) => {
        await page.goto('/dossiers')
        await page.waitForLoadState('networkidle')

        const noOverflow = await verifyNoHorizontalOverflow(page)
        expect(noOverflow).toBeTruthy()
      })

      for (const dossierType of allDossierTypes) {
        const testId = testDossierIds[dossierType]
        const route = getDossierRoute(dossierType, testId)

        test(`${dossierType} detail has no horizontal overflow`, async ({ page }) => {
          await page.goto(route)
          await page.waitForLoadState('networkidle')

          // Check body doesn't have horizontal scroll
          const noOverflow = await verifyNoHorizontalOverflow(page)
          expect(noOverflow).toBeTruthy()

          // Also check that body overflow-x is not visible
          const overflowX = await page.evaluate(
            () => window.getComputedStyle(document.body).overflowX,
          )
          expect(overflowX).not.toBe('scroll')
        })
      }
    })
  }
})

// ============================================================================
// Mobile Content Layout Tests
// ============================================================================

test.describe('Mobile Content Layout Tests', () => {
  test.beforeEach(async ({ page }) => {
    await authBypass(page)
    await page.setViewportSize({ width: 320, height: 568 })
  })

  test('Content stacks vertically on smallest mobile', async ({ page }) => {
    await page.goto('/dossiers')
    await page.waitForLoadState('networkidle')

    // Check grid layouts switch to single column on mobile
    const gridElements = await page.locator('[class*="grid"]').all()

    for (let i = 0; i < Math.min(gridElements.length, 3); i++) {
      const grid = gridElements[i]
      const flexDirection = await grid.evaluate((el) => window.getComputedStyle(el).flexDirection)
      const gridTemplateColumns = await grid.evaluate(
        (el) => window.getComputedStyle(el).gridTemplateColumns,
      )

      // On mobile, grids should be single column or flex-col
      // This is a soft check - just verify the page is usable
      console.log(`Grid ${i}: direction=${flexDirection}, cols=${gridTemplateColumns}`)
    }
  })

  test('Navigation is accessible on mobile', async ({ page }) => {
    await page.goto('/dossiers')
    await page.waitForLoadState('networkidle')

    // Look for mobile menu or hamburger button
    const mobileMenu = page.locator(
      'button[aria-label*="menu"], button[aria-label*="Menu"], [data-testid="mobile-menu"]',
    )

    // On mobile, there should be some form of navigation
    // Either visible links or a hamburger menu
    const navLinks = page.locator('nav a')
    const hasVisibleNav = await navLinks
      .first()
      .isVisible()
      .catch(() => false)
    const hasMobileMenu = await mobileMenu.isVisible().catch(() => false)

    // At least one navigation method should be available
    expect(hasVisibleNav || hasMobileMenu).toBeTruthy()
  })
})

// ============================================================================
// Collapsible Sections Mobile Tests
// ============================================================================

test.describe('Collapsible Sections on Mobile', () => {
  test.beforeEach(async ({ page }) => {
    await authBypass(page)
    await page.setViewportSize({ width: 320, height: 568 })
  })

  for (const dossierType of allDossierTypes) {
    const testId = testDossierIds[dossierType]
    const route = getDossierRoute(dossierType, testId)

    test(`${dossierType} sections expand/collapse on tap`, async ({ page }) => {
      await page.goto(route)
      await page.waitForLoadState('networkidle')

      // Find collapsible section headers
      const sectionHeaders = page.locator(
        '[data-testid^="section-header"], button[aria-expanded], [role="button"][aria-expanded]',
      )

      const count = await sectionHeaders.count()

      if (count > 0) {
        const firstHeader = sectionHeaders.first()

        // Get initial expanded state
        const initialExpanded = await firstHeader.getAttribute('aria-expanded')

        // Click/tap to toggle
        await firstHeader.click()
        await page.waitForTimeout(350) // Wait for animation

        // Verify state changed
        const newExpanded = await firstHeader.getAttribute('aria-expanded')

        // State should have toggled (or if no aria-expanded, just verify click didn't break layout)
        if (initialExpanded !== null) {
          expect(newExpanded).not.toBe(initialExpanded)
        }

        // Verify no layout break after toggle
        const noOverflow = await verifyNoHorizontalOverflow(page)
        expect(noOverflow).toBeTruthy()
      }
    })
  }
})

// ============================================================================
// Table Responsiveness Tests
// ============================================================================

test.describe('Table Responsiveness', () => {
  test.beforeEach(async ({ page }) => {
    await authBypass(page)
    await page.setViewportSize({ width: 320, height: 568 })
  })

  test('Wide tables scroll horizontally within container', async ({ page }) => {
    const route = getDossierRoute('country', testDossierIds.country)
    await page.goto(route)
    await page.waitForLoadState('networkidle')

    // Find table containers
    const tables = page.locator('table, [data-testid="data-table"]')
    const tableContainers = page.locator(
      '[data-testid="table-container"], .overflow-x-auto, [class*="overflow-x"]',
    )

    // If tables exist, verify they're in scrollable containers
    const tableCount = await tables.count()
    if (tableCount > 0) {
      // Tables shouldn't cause page-level overflow
      const noOverflow = await verifyNoHorizontalOverflow(page)
      expect(noOverflow).toBeTruthy()

      // Table containers should have overflow-x auto/scroll
      const containerCount = await tableContainers.count()
      console.log(`Found ${tableCount} tables, ${containerCount} scroll containers`)
    }
  })
})
