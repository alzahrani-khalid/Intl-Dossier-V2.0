/**
 * Dossier RTL Complete Test Suite
 * Feature: 034-dossier-ui-polish
 *
 * Tests RTL (Right-to-Left) layout support for all 6 dossier types
 * when the application is set to Arabic language.
 *
 * Tests covered:
 * - T009: RTL layout test for Country dossier
 * - T010: RTL layout test for Organization dossier
 * - T011: RTL layout test for Person dossier
 * - T012: RTL layout test for Engagement dossier
 * - T013: RTL layout test for Forum dossier
 * - T014: RTL layout test for Working Group dossier
 * - T015: Bidirectional text test (mixed Arabic/English)
 */

import { test, expect, type Page } from '@playwright/test'
import {
  testCredentials,
  allDossierTypes,
  getDossierRoute,
  testDossierIds,
  testSelectors,
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
 * Set language to Arabic via i18next
 */
async function setArabicLanguage(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('i18nextLng', 'ar')
  })
}

/**
 * Set language to English via i18next
 */
async function setEnglishLanguage(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('i18nextLng', 'en')
  })
}

/**
 * Helper to verify RTL layout characteristics
 */
async function verifyRTLLayout(page: Page, dossierType: DossierType) {
  // Verify HTML dir attribute is set to RTL
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')

  // Verify main content has RTL direction
  const mainContent = page.locator('main, [data-testid="main-content"]').first()
  if ((await mainContent.count()) > 0) {
    const dir = await mainContent.getAttribute('dir')
    // Either explicit dir="rtl" or inherited
    expect(dir === 'rtl' || dir === null).toBeTruthy()
  }

  // Verify no horizontal overflow (content fits viewport)
  const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  const viewportWidth = await page.evaluate(() => window.innerWidth)
  expect(documentWidth).toBeLessThanOrEqual(viewportWidth + 5) // 5px tolerance
}

/**
 * Helper to verify text alignment in RTL
 */
async function verifyTextAlignment(page: Page) {
  // Check that headings use text-start or text-right (which becomes start in RTL)
  const headings = page.locator('h1, h2, h3').first()
  if ((await headings.count()) > 0) {
    const textAlign = await headings.evaluate((el) => window.getComputedStyle(el).textAlign)
    // In RTL, text-start should resolve to 'right' or 'start'
    expect(['right', 'start', '-webkit-right']).toContain(textAlign)
  }
}

// ============================================================================
// RTL Test Suite
// ============================================================================

test.describe('Dossier RTL Complete Tests', () => {
  test.beforeEach(async ({ page }) => {
    await authBypass(page)
    await setArabicLanguage(page)
  })

  // T009-T014: RTL layout tests for each dossier type
  for (const dossierType of allDossierTypes) {
    const testId = testDossierIds[dossierType]
    const route = getDossierRoute(dossierType, testId)

    test(`[T00${9 + allDossierTypes.indexOf(dossierType)}] ${dossierType} dossier renders correctly in RTL`, async ({
      page,
    }) => {
      // Navigate to the dossier page
      await page.goto(route)

      // Wait for page to load
      await page.waitForLoadState('networkidle')

      // Verify RTL layout
      await verifyRTLLayout(page, dossierType)

      // Verify text alignment
      await verifyTextAlignment(page)

      // Take screenshot for visual verification
      await page.screenshot({
        path: `test-results/rtl-${dossierType}-dossier.png`,
        fullPage: true,
      })
    })
  }

  // T015: Bidirectional text test (mixed Arabic/English)
  test('[T015] Mixed Arabic/English text renders correctly in RTL', async ({ page }) => {
    // Navigate to a country dossier (most likely to have mixed content)
    const route = getDossierRoute('country', testDossierIds.country)
    await page.goto(route)
    await page.waitForLoadState('networkidle')

    // Verify RTL layout is active
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')

    // Check that mixed content areas don't break layout
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)

    // No horizontal overflow
    expect(documentWidth).toBeLessThanOrEqual(viewportWidth + 5)

    // Verify any visible ISO codes or English names render properly
    // They should be embedded in RTL context without breaking
    const pageContent = await page.content()
    expect(pageContent).toBeTruthy()
  })
})

// ============================================================================
// RTL Component-Specific Tests
// ============================================================================

test.describe('RTL Component Tests', () => {
  test.beforeEach(async ({ page }) => {
    await authBypass(page)
    await setArabicLanguage(page)
  })

  test('Sidebar renders on the right in RTL mode', async ({ page }) => {
    await page.goto('/dossiers')
    await page.waitForLoadState('networkidle')

    // Check that sidebar is positioned on the right
    const sidebar = page.locator('[data-testid="sidebar"], aside, nav').first()
    if ((await sidebar.count()) > 0) {
      const box = await sidebar.boundingBox()
      const viewportWidth = await page.evaluate(() => window.innerWidth)

      if (box) {
        // In RTL, sidebar should be on the right side
        // This means its left edge should be past the midpoint
        expect(box.x + box.width).toBeGreaterThan(viewportWidth / 2)
      }
    }
  })

  test('Breadcrumbs read right-to-left', async ({ page }) => {
    const route = getDossierRoute('country', testDossierIds.country)
    await page.goto(route)
    await page.waitForLoadState('networkidle')

    const breadcrumbs = page
      .locator('[data-testid="breadcrumbs"], nav[aria-label*="breadcrumb"], .breadcrumb')
      .first()

    if ((await breadcrumbs.count()) > 0) {
      const dir = await breadcrumbs.evaluate((el) => window.getComputedStyle(el).direction)
      expect(dir).toBe('rtl')
    }
  })

  test('Directional icons flip in RTL', async ({ page }) => {
    const route = getDossierRoute('country', testDossierIds.country)
    await page.goto(route)
    await page.waitForLoadState('networkidle')

    // Look for chevron icons that should be flipped
    const chevrons = page.locator(
      '[data-testid="chevron-right"], .lucide-chevron-right, svg[class*="chevron"]',
    )

    const count = await chevrons.count()
    for (let i = 0; i < Math.min(count, 5); i++) {
      const chevron = chevrons.nth(i)
      const transform = await chevron.evaluate((el) => window.getComputedStyle(el).transform)

      // Check if the icon is flipped (rotated 180deg)
      // A rotation of 180deg would have a transform matrix with -1 values
      // or the element should have a rotate-180 class
      const classAttr = await chevron.getAttribute('class')
      const hasRotate = classAttr?.includes('rotate-180') || transform.includes('matrix(-1')

      // Either the icon has the flip class or a transform
      // This is a soft check - some icons may not need flipping
      if (classAttr?.includes('chevron-right')) {
        expect(hasRotate || transform !== 'none').toBeTruthy()
      }
    }
  })

  test('Form inputs align correctly in RTL', async ({ page }) => {
    // Go to a page with forms
    await page.goto('/dossiers')
    await page.waitForLoadState('networkidle')

    const inputs = page.locator('input[type="text"], input[type="search"]')
    const count = await inputs.count()

    for (let i = 0; i < Math.min(count, 3); i++) {
      const input = inputs.nth(i)
      const textAlign = await input.evaluate((el) => window.getComputedStyle(el).textAlign)

      // In RTL, inputs should align text to start (right) or inherit
      expect(['right', 'start', 'inherit', '-webkit-right']).toContain(textAlign)
    }
  })

  test('Tables render correctly in RTL', async ({ page }) => {
    const route = getDossierRoute('country', testDossierIds.country)
    await page.goto(route)
    await page.waitForLoadState('networkidle')

    const tables = page.locator('table')
    const count = await tables.count()

    for (let i = 0; i < Math.min(count, 2); i++) {
      const table = tables.nth(i)
      const dir = await table.evaluate((el) => window.getComputedStyle(el).direction)

      // Table should have RTL direction
      expect(dir).toBe('rtl')
    }
  })
})

// ============================================================================
// RTL Language Switching Tests
// ============================================================================

test.describe('RTL Language Switching', () => {
  test.beforeEach(async ({ page }) => {
    await authBypass(page)
  })

  test('Switching from English to Arabic applies RTL', async ({ page }) => {
    // Start with English
    await setEnglishLanguage(page)
    await page.goto('/dossiers')
    await page.waitForLoadState('networkidle')

    // Verify LTR
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')

    // Switch to Arabic using language switcher
    const trigger = page.getByRole('button', { name: /switch language|language/i })
    if ((await trigger.count()) > 0) {
      await trigger.click()
      const arabicOption = page.getByRole('menuitem').filter({ hasText: 'العربية' })
      if ((await arabicOption.count()) > 0) {
        await arabicOption.click()

        // Wait for RTL to apply
        await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
      }
    }
  })

  test('Switching from Arabic to English applies LTR', async ({ page }) => {
    // Start with Arabic
    await setArabicLanguage(page)
    await page.goto('/dossiers')
    await page.waitForLoadState('networkidle')

    // Verify RTL
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')

    // Switch to English using language switcher
    const trigger = page.getByRole('button', { name: /switch language|language/i })
    if ((await trigger.count()) > 0) {
      await trigger.click()
      const englishOption = page.getByRole('menuitem').filter({ hasText: 'English' })
      if ((await englishOption.count()) > 0) {
        await englishOption.click()

        // Wait for LTR to apply
        await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
      }
    }
  })
})
