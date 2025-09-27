import { test, expect } from '@playwright/test'
import { runAccessibilityTest, checkFormAccessibility, checkTableAccessibility, checkModalAccessibility } from './axe-config'

test.describe('Component Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
  })

  test('Country form accessibility', async ({ page }) => {
    await page.click('[data-testid="nav-countries"]')
    await page.click('[data-testid="add-country-button"]')

    const violations = await checkFormAccessibility(page, '[data-testid="country-form"]')
    expect(violations).toEqual([])
  })

  test('Organization form accessibility', async ({ page }) => {
    await page.click('[data-testid="nav-organizations"]')
    await page.click('[data-testid="add-organization-button"]')

    const violations = await checkFormAccessibility(page, '[data-testid="organization-form"]')
    expect(violations).toEqual([])
  })

  test('MoU form accessibility', async ({ page }) => {
    await page.click('[data-testid="nav-mous"]')
    await page.click('[data-testid="add-mou-button"]')

    const violations = await checkFormAccessibility(page, '[data-testid="mou-form"]')
    expect(violations).toEqual([])
  })

  test('Event form accessibility', async ({ page }) => {
    await page.click('[data-testid="nav-events"]')
    await page.click('[data-testid="add-event-button"]')

    const violations = await checkFormAccessibility(page, '[data-testid="event-form"]')
    expect(violations).toEqual([])
  })

  test('Country table accessibility', async ({ page }) => {
    await page.click('[data-testid="nav-countries"]')

    const violations = await checkTableAccessibility(page, '[data-testid="country-table"]')
    expect(violations).toEqual([])
  })

  test('Organization table accessibility', async ({ page }) => {
    await page.click('[data-testid="nav-organizations"]')

    const violations = await checkTableAccessibility(page, '[data-testid="organization-table"]')
    expect(violations).toEqual([])
  })

  test('MoU table accessibility', async ({ page }) => {
    await page.click('[data-testid="nav-mous"]')

    const violations = await checkTableAccessibility(page, '[data-testid="mou-table"]')
    expect(violations).toEqual([])
  })

  test('Event table accessibility', async ({ page }) => {
    await page.click('[data-testid="nav-events"]')

    const violations = await checkTableAccessibility(page, '[data-testid="event-table"]')
    expect(violations).toEqual([])
  })

  test('Country modal accessibility', async ({ page }) => {
    await page.click('[data-testid="nav-countries"]')
    await page.click('[data-testid="add-country-button"]')

    const violations = await checkModalAccessibility(page, '[data-testid="country-modal"]')
    expect(violations).toEqual([])
  })

  test('Organization modal accessibility', async ({ page }) => {
    await page.click('[data-testid="nav-organizations"]')
    await page.click('[data-testid="add-organization-button"]')

    const violations = await checkModalAccessibility(page, '[data-testid="organization-modal"]')
    expect(violations).toEqual([])
  })

  test('MoU modal accessibility', async ({ page }) => {
    await page.click('[data-testid="nav-mous"]')
    await page.click('[data-testid="add-mou-button"]')

    const violations = await checkModalAccessibility(page, '[data-testid="mou-modal"]')
    expect(violations).toEqual([])
  })

  test('Event modal accessibility', async ({ page }) => {
    await page.click('[data-testid="nav-events"]')
    await page.click('[data-testid="add-event-button"]')

    const violations = await checkModalAccessibility(page, '[data-testid="event-modal"]')
    expect(violations).toEqual([])
  })

  test('Search functionality accessibility', async ({ page }) => {
    await page.click('[data-testid="nav-countries"]')

    const violations = await runAccessibilityTest(page, {
      include: ['[data-testid="search-section"]'],
      tags: ['wcag2aa']
    })
    expect(violations.violations).toEqual([])
  })

  test('Pagination accessibility', async ({ page }) => {
    await page.click('[data-testid="nav-countries"]')

    const violations = await runAccessibilityTest(page, {
      include: ['[data-testid="pagination"]'],
      tags: ['wcag2aa']
    })
    expect(violations.violations).toEqual([])
  })

  test('Navigation menu accessibility', async ({ page }) => {
    const violations = await runAccessibilityTest(page, {
      include: ['[data-testid="main-navigation"]'],
      tags: ['wcag2aa']
    })
    expect(violations.violations).toEqual([])
  })

  test('Language toggle accessibility', async ({ page }) => {
    const violations = await runAccessibilityTest(page, {
      include: ['[data-testid="language-toggle"]'],
      tags: ['wcag2aa']
    })
    expect(violations.violations).toEqual([])
  })

  test('File upload accessibility', async ({ page }) => {
    await page.click('[data-testid="nav-data-library"]')
    await page.click('[data-testid="upload-button"]')

    const violations = await runAccessibilityTest(page, {
      include: ['[data-testid="upload-modal"]'],
      tags: ['wcag2aa']
    })
    expect(violations.violations).toEqual([])
  })

  test('Offline indicator accessibility', async ({ page }) => {
    await page.context().setOffline(true)
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()

    const violations = await runAccessibilityTest(page, {
      include: ['[data-testid="offline-indicator"]'],
      tags: ['wcag2aa']
    })
    expect(violations.violations).toEqual([])
  })

  test('Error message accessibility', async ({ page }) => {
    await page.click('[data-testid="nav-countries"]')
    await page.click('[data-testid="add-country-button"]')
    await page.click('[data-testid="save-country"]')

    const violations = await runAccessibilityTest(page, {
      include: ['[data-testid="error-messages"]'],
      tags: ['wcag2aa']
    })
    expect(violations.violations).toEqual([])
  })

  test('Success message accessibility', async ({ page }) => {
    await page.click('[data-testid="nav-countries"]')
    await page.click('[data-testid="add-country-button"]')
    
    await page.fill('[data-testid="iso-code-2"]', 'AE')
    await page.fill('[data-testid="iso-code-3"]', 'ARE')
    await page.fill('[data-testid="name-en"]', 'United Arab Emirates')
    await page.fill('[data-testid="name-ar"]', 'دولة الإمارات العربية المتحدة')
    await page.selectOption('[data-testid="region"]', 'asia')
    
    await page.click('[data-testid="save-country"]')

    const violations = await runAccessibilityTest(page, {
      include: ['[data-testid="success-message"]'],
      tags: ['wcag2aa']
    })
    expect(violations.violations).toEqual([])
  })

  test('Loading indicator accessibility', async ({ page }) => {
    await page.click('[data-testid="nav-countries"]')

    const violations = await runAccessibilityTest(page, {
      include: ['[data-testid="loading-indicator"]'],
      tags: ['wcag2aa']
    })
    expect(violations.violations).toEqual([])
  })
})