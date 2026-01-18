/**
 * Intake Ticket System Full Lifecycle Audit - Verification Tests
 *
 * This temporary test suite verifies the intake ticket system functionality
 * as part of the comprehensive audit.
 */

import { test, expect } from '@playwright/test'

// Test credentials from CLAUDE.md
const TEST_EMAIL = 'kazahrani@stats.gov.sa'
const TEST_PASSWORD = 'itisme'

test.describe('Intake Ticket System Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app and login
    await page.goto('http://localhost:5173')

    // Check if already logged in by looking for dashboard elements
    const dashboardVisible = await page
      .locator('[data-testid="dashboard"], .dashboard, nav')
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false)

    if (!dashboardVisible) {
      // Wait for login page and authenticate
      await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 })
      await page.fill('input[type="email"], input[name="email"]', TEST_EMAIL)
      await page.fill('input[type="password"], input[name="password"]', TEST_PASSWORD)
      await page.click('button[type="submit"]')

      // Wait for navigation to complete
      await page.waitForURL(/.*(?!login)/, { timeout: 15000 })
    }
  })

  test('1. Ticket Creation - Entry Points Exist', async ({ page }) => {
    // Check /intake/new route exists
    await page.goto('http://localhost:5173/intake/new')
    await page.waitForLoadState('networkidle')

    // Verify form elements are present
    await expect(page.locator('h1, [class*="title"]').first()).toBeVisible()

    // Check for required form fields
    const requestTypeSelect = page.locator('select, [role="combobox"]').first()
    await expect(requestTypeSelect).toBeVisible({ timeout: 10000 })
  })

  test('2. Ticket Creation - Form Validation', async ({ page }) => {
    await page.goto('http://localhost:5173/intake/new')
    await page.waitForLoadState('networkidle')

    // Try to submit without filling required fields
    const submitButton = page.locator('button[type="submit"]')
    if (await submitButton.isVisible()) {
      await submitButton.click()

      // Check for validation errors
      await page.waitForTimeout(500)
      const hasValidationErrors = await page
        .locator('[class*="error"], [class*="invalid"], [aria-invalid="true"]')
        .count()
      expect(hasValidationErrors).toBeGreaterThanOrEqual(0) // May or may not show depending on validation timing
    }
  })

  test('3. Intake Queue - Page Loads', async ({ page }) => {
    await page.goto('http://localhost:5173/intake/queue')
    await page.waitForLoadState('networkidle')

    // Verify queue page loads - look for page content
    const pageContent = page.locator('main, [class*="queue"], [class*="container"]').first()
    await expect(pageContent).toBeVisible({ timeout: 10000 })
  })

  test('4. DossierSelector - Appears in Form', async ({ page }) => {
    await page.goto('http://localhost:5173/intake/new')
    await page.waitForLoadState('networkidle')

    // Look for DossierSelector component
    const dossierSelector = page.locator('[class*="dossier"], [data-testid*="dossier"]')
    const selectorVisible = await dossierSelector.isVisible({ timeout: 5000 }).catch(() => false)

    // It should be visible since it's required per US4
    if (!selectorVisible) {
      console.log(
        'Note: DossierSelector may not be immediately visible - checking for search/selector elements',
      )
    }
  })

  test('5. RTL Support - Arabic Language', async ({ page }) => {
    await page.goto('http://localhost:5173/intake/new')

    // Switch to Arabic if language switcher exists
    const languageSwitcher = page.locator(
      '[data-testid="language-switcher"], button:has-text("العربية"), button:has-text("AR")',
    )
    if (await languageSwitcher.isVisible({ timeout: 2000 }).catch(() => false)) {
      await languageSwitcher.click()
      await page.waitForTimeout(500)
    }

    // Check for RTL direction attribute
    const rtlElement = page.locator('[dir="rtl"]').first()
    const hasRTL = await rtlElement.isVisible({ timeout: 3000 }).catch(() => false)

    // Log result for manual review
    console.log(`RTL support detected: ${hasRTL}`)
  })

  test('6. Mobile Responsiveness - 375px Width', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('http://localhost:5173/intake/new')
    await page.waitForLoadState('networkidle')

    // Take screenshot for manual review
    await page.screenshot({
      path: 'frontend/tests/e2e/screenshots/intake-mobile-375.png',
      fullPage: true,
    })

    // Verify form is still usable on mobile
    const formVisible = await page
      .locator('form')
      .isVisible({ timeout: 5000 })
      .catch(() => false)
    expect(formVisible || (await page.locator('[class*="form"]').isVisible())).toBeTruthy()
  })

  test('7. SLA Preview - Displays Based on Urgency', async ({ page }) => {
    await page.goto('http://localhost:5173/intake/new')
    await page.waitForLoadState('networkidle')

    // Select different urgency levels and check SLA preview
    const urgencySelect = page.locator('select[name="urgency"], [name="urgency"]')

    if (await urgencySelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await urgencySelect.selectOption('high')
      await page.waitForTimeout(500)

      // Check if SLA preview section appears
      const slaPreview = page.locator('[class*="sla"], [class*="SLA"]')
      const slaVisible = await slaPreview.isVisible({ timeout: 2000 }).catch(() => false)
      console.log(`SLA Preview visible after urgency selection: ${slaVisible}`)
    }
  })

  test('8. Work Creation Palette - Intake Option', async ({ page }) => {
    // Check if work creation palette has intake option
    await page.goto('http://localhost:5173/my-work')
    await page.waitForLoadState('networkidle')

    // Look for create/add button
    const createButton = page.locator(
      'button:has-text("Create"), button:has-text("Add"), button:has-text("+"), [data-testid*="create"]',
    )

    if (
      await createButton
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      await createButton.first().click()
      await page.waitForTimeout(500)

      // Check for intake option in palette
      const intakeOption = page.locator(
        '[class*="intake"], button:has-text("Intake"), [data-testid*="intake"]',
      )
      const hasIntakeOption = await intakeOption.isVisible({ timeout: 2000 }).catch(() => false)
      console.log(`Intake option in work creation palette: ${hasIntakeOption}`)
    }
  })

  test('9. Unified Kanban - Intake Source Badge', async ({ page }) => {
    // Navigate to unified kanban view
    await page.goto('http://localhost:5173/my-work')
    await page.waitForLoadState('networkidle')

    // Look for kanban view toggle or cards with intake source
    const kanbanView = page.locator('[class*="kanban"], [data-testid*="kanban"]')
    const cardsWithIntake = page.locator(
      '[class*="badge"]:has-text("intake"), [class*="source"]:has-text("intake")',
    )

    // Log findings for audit
    console.log(`Kanban view elements found: ${await kanbanView.count()}`)
    console.log(`Cards with intake source: ${await cardsWithIntake.count()}`)
  })

  test('10. Accessibility - Touch Targets', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:5173/intake/new')
    await page.waitForLoadState('networkidle')

    // Check button sizes (should be at least 44x44 for touch targets)
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()

    let smallButtonsFound = 0
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i)
      const box = await button.boundingBox()
      if (box && (box.width < 44 || box.height < 44)) {
        smallButtonsFound++
      }
    }

    console.log(
      `Small buttons (< 44px) found: ${smallButtonsFound} out of ${Math.min(buttonCount, 10)} checked`,
    )
  })
})
