import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('Login page accessibility', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('Dashboard accessibility', async ({ page }) => {
    // Login first
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('Countries page accessibility', async ({ page }) => {
    // Login first
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')

    // Navigate to countries
    await page.click('[data-testid="nav-countries"]')
    await page.waitForURL('/countries')

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('Country form accessibility', async ({ page }) => {
    // Login first
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')

    // Navigate to countries and open form
    await page.click('[data-testid="nav-countries"]')
    await page.click('[data-testid="add-country-button"]')

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('Organizations page accessibility', async ({ page }) => {
    // Login first
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')

    // Navigate to organizations
    await page.click('[data-testid="nav-organizations"]')
    await page.waitForURL('/organizations')

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('MoUs page accessibility', async ({ page }) => {
    // Login first
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')

    // Navigate to MoUs
    await page.click('[data-testid="nav-mous"]')
    await page.waitForURL('/mous')

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('Events page accessibility', async ({ page }) => {
    // Login first
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')

    // Navigate to events
    await page.click('[data-testid="nav-events"]')
    await page.waitForURL('/events')

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('Intelligence page accessibility', async ({ page }) => {
    // Login first
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')

    // Navigate to intelligence
    await page.click('[data-testid="nav-intelligence"]')
    await page.waitForURL('/intelligence')

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('Data Library page accessibility', async ({ page }) => {
    // Login first
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')

    // Navigate to data library
    await page.click('[data-testid="nav-data-library"]')
    await page.waitForURL('/data-library')

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('Reports page accessibility', async ({ page }) => {
    // Login first
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')

    // Navigate to reports
    await page.click('[data-testid="nav-reports"]')
    await page.waitForURL('/reports')

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('Word Assistant page accessibility', async ({ page }) => {
    // Login first
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')

    // Navigate to word assistant
    await page.click('[data-testid="nav-word-assistant"]')
    await page.waitForURL('/word-assistant')

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('Arabic RTL accessibility', async ({ page }) => {
    // Login first
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')

    // Switch to Arabic
    await page.click('[data-testid="language-toggle"]')
    await page.click('[data-testid="language-arabic"]')
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('Mobile accessibility', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Login first
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('Keyboard navigation accessibility', async ({ page }) => {
    // Login first
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')

    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()

    // Navigate through main navigation
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Press Enter on a navigation item
    await page.keyboard.press('Enter')
    await page.waitForURL('/countries')

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('Form accessibility', async ({ page }) => {
    // Login first
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')

    // Navigate to countries and open form
    await page.click('[data-testid="nav-countries"]')
    await page.click('[data-testid="add-country-button"]')

    // Test form accessibility
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="country-form"]')
      .analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('Modal accessibility', async ({ page }) => {
    // Login first
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')

    // Navigate to countries and open modal
    await page.click('[data-testid="nav-countries"]')
    await page.click('[data-testid="add-country-button"]')

    // Test modal accessibility
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="country-modal"]')
      .analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('Table accessibility', async ({ page }) => {
    // Login first
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')

    // Navigate to countries
    await page.click('[data-testid="nav-countries"]')

    // Test table accessibility
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="country-table"]')
      .analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('Search functionality accessibility', async ({ page }) => {
    // Login first
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')

    // Navigate to countries
    await page.click('[data-testid="nav-countries"]')

    // Test search accessibility
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="search-section"]')
      .analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('Pagination accessibility', async ({ page }) => {
    // Login first
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')

    // Navigate to countries
    await page.click('[data-testid="nav-countries"]')

    // Test pagination accessibility
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="pagination"]')
      .analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('Error message accessibility', async ({ page }) => {
    // Login first
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')

    // Navigate to countries and trigger validation
    await page.click('[data-testid="nav-countries"]')
    await page.click('[data-testid="add-country-button"]')
    await page.click('[data-testid="save-country"]')

    // Test error message accessibility
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="error-messages"]')
      .analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('Success message accessibility', async ({ page }) => {
    // Login first
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')

    // Navigate to countries and create a country
    await page.click('[data-testid="nav-countries"]')
    await page.click('[data-testid="add-country-button"]')
    
    await page.fill('[data-testid="iso-code-2"]', 'AE')
    await page.fill('[data-testid="iso-code-3"]', 'ARE')
    await page.fill('[data-testid="name-en"]', 'United Arab Emirates')
    await page.fill('[data-testid="name-ar"]', 'دولة الإمارات العربية المتحدة')
    await page.selectOption('[data-testid="region"]', 'asia')
    
    await page.click('[data-testid="save-country"]')

    // Test success message accessibility
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="success-message"]')
      .analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('Loading state accessibility', async ({ page }) => {
    // Login first
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')

    // Navigate to countries
    await page.click('[data-testid="nav-countries"]')

    // Test loading state accessibility
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="loading-indicator"]')
      .analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('Offline indicator accessibility', async ({ page }) => {
    // Login first
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')

    // Simulate offline mode
    await page.context().setOffline(true)
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()

    // Test offline indicator accessibility
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="offline-indicator"]')
      .analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })
})