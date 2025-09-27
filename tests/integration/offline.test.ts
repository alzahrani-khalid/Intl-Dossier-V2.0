import { test, expect } from '@playwright/test'

test.describe('Offline Queue Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
  })

  test('Offline queue creation and storage', async ({ page }) => {
    // Navigate to countries
    await page.click('[data-testid="nav-countries"]')
    await page.waitForURL('/countries')
    
    // Simulate offline mode
    await page.context().setOffline(true)
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
    
    // Try to create a country (should be queued)
    await page.click('[data-testid="add-country-button"]')
    await page.fill('[data-testid="iso-code-2"]', 'QA')
    await page.fill('[data-testid="iso-code-3"]', 'QAT')
    await page.fill('[data-testid="name-en"]', 'Qatar')
    await page.fill('[data-testid="name-ar"]', 'قطر')
    await page.selectOption('[data-testid="region"]', 'asia')
    await page.fill('[data-testid="capital-en"]', 'Doha')
    await page.fill('[data-testid="capital-ar"]', 'الدوحة')
    await page.fill('[data-testid="population"]', '2881000')
    await page.fill('[data-testid="area"]', '11586')
    
    await page.click('[data-testid="save-country"]')
    
    // Verify action is queued
    await expect(page.locator('[data-testid="queued-action"]')).toBeVisible()
    await expect(page.locator('[data-testid="offline-indicator"]')).toContainText('1 pending')
    
    // Check localStorage for queued action
    const queuedActions = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('offlineQueue') || '[]')
    })
    
    expect(queuedActions).toHaveLength(1)
    expect(queuedActions[0]).toMatchObject({
      type: 'CREATE_COUNTRY',
      data: {
        isoCode2: 'QA',
        isoCode3: 'QAT',
        nameEn: 'Qatar',
        nameAr: 'قطر',
        region: 'asia',
        capitalEn: 'Doha',
        capitalAr: 'الدوحة',
        population: 2881000,
        area: 11586
      }
    })
  })

  test('Offline queue processing when back online', async ({ page }) => {
    // Navigate to countries
    await page.click('[data-testid="nav-countries"]')
    await page.waitForURL('/countries')
    
    // Simulate offline mode
    await page.context().setOffline(true)
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
    
    // Create multiple queued actions
    await page.click('[data-testid="add-country-button"]')
    await page.fill('[data-testid="iso-code-2"]', 'QA')
    await page.fill('[data-testid="iso-code-3"]', 'QAT')
    await page.fill('[data-testid="name-en"]', 'Qatar')
    await page.fill('[data-testid="name-ar"]', 'قطر')
    await page.selectOption('[data-testid="region"]', 'asia')
    await page.fill('[data-testid="capital-en"]', 'Doha')
    await page.fill('[data-testid="capital-ar"]', 'الدوحة')
    await page.fill('[data-testid="population"]', '2881000')
    await page.fill('[data-testid="area"]', '11586')
    
    await page.click('[data-testid="save-country"]')
    await expect(page.locator('[data-testid="queued-action"]')).toBeVisible()
    
    // Create another queued action
    await page.click('[data-testid="add-country-button"]')
    await page.fill('[data-testid="iso-code-2"]', 'KW')
    await page.fill('[data-testid="iso-code-3"]', 'KWT')
    await page.fill('[data-testid="name-en"]', 'Kuwait')
    await page.fill('[data-testid="name-ar"]', 'الكويت')
    await page.selectOption('[data-testid="region"]', 'asia')
    await page.fill('[data-testid="capital-en"]', 'Kuwait City')
    await page.fill('[data-testid="capital-ar"]', 'مدينة الكويت')
    await page.fill('[data-testid="population"]', '4270000')
    await page.fill('[data-testid="area"]', '17818')
    
    await page.click('[data-testid="save-country"]')
    await expect(page.locator('[data-testid="offline-indicator"]')).toContainText('2 pending')
    
    // Go back online
    await page.context().setOffline(false)
    await page.waitForSelector('[data-testid="online-indicator"]')
    
    // Process queued actions
    await page.click('[data-testid="process-queue"]')
    await page.waitForSelector('[data-testid="queue-processed"]')
    
    // Verify actions were processed
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="offline-indicator"]')).toContainText('0 pending')
    
    // Verify countries were created
    await expect(page.locator('[data-testid="country-list"]')).toContainText('Qatar')
    await expect(page.locator('[data-testid="country-list"]')).toContainText('Kuwait')
  })

  test('Offline queue error handling', async ({ page }) => {
    // Navigate to countries
    await page.click('[data-testid="nav-countries"]')
    await page.waitForURL('/countries')
    
    // Simulate offline mode
    await page.context().setOffline(true)
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
    
    // Create a queued action with invalid data
    await page.click('[data-testid="add-country-button"]')
    await page.fill('[data-testid="iso-code-2"]', 'INVALID')
    await page.fill('[data-testid="iso-code-3"]', 'INV')
    await page.fill('[data-testid="name-en"]', 'Invalid Country')
    await page.fill('[data-testid="name-ar"]', 'دولة غير صحيحة')
    await page.selectOption('[data-testid="region"]', 'asia')
    
    await page.click('[data-testid="save-country"]')
    await expect(page.locator('[data-testid="queued-action"]')).toBeVisible()
    
    // Go back online
    await page.context().setOffline(false)
    await page.waitForSelector('[data-testid="online-indicator"]')
    
    // Process queued actions
    await page.click('[data-testid="process-queue"]')
    await page.waitForSelector('[data-testid="queue-processed"]')
    
    // Verify error handling
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="offline-indicator"]')).toContainText('1 failed')
    
    // Verify retry functionality
    await page.click('[data-testid="retry-failed"]')
    await page.waitForSelector('[data-testid="retry-complete"]')
    
    // Verify error is still there (invalid data)
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
  })

  test('Offline queue retry functionality', async ({ page }) => {
    // Navigate to countries
    await page.click('[data-testid="nav-countries"]')
    await page.waitForURL('/countries')
    
    // Simulate offline mode
    await page.context().setOffline(true)
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
    
    // Create a queued action
    await page.click('[data-testid="add-country-button"]')
    await page.fill('[data-testid="iso-code-2"]', 'QA')
    await page.fill('[data-testid="iso-code-3"]', 'QAT')
    await page.fill('[data-testid="name-en"]', 'Qatar')
    await page.fill('[data-testid="name-ar"]', 'قطر')
    await page.selectOption('[data-testid="region"]', 'asia')
    await page.fill('[data-testid="capital-en"]', 'Doha')
    await page.fill('[data-testid="capital-ar"]', 'الدوحة')
    await page.fill('[data-testid="population"]', '2881000')
    await page.fill('[data-testid="area"]', '11586')
    
    await page.click('[data-testid="save-country"]')
    await expect(page.locator('[data-testid="queued-action"]')).toBeVisible()
    
    // Go back online
    await page.context().setOffline(false)
    await page.waitForSelector('[data-testid="online-indicator"]')
    
    // Process queued actions
    await page.click('[data-testid="process-queue"]')
    await page.waitForSelector('[data-testid="queue-processed"]')
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="offline-indicator"]')).toContainText('0 pending')
  })

  test('Offline queue clear functionality', async ({ page }) => {
    // Navigate to countries
    await page.click('[data-testid="nav-countries"]')
    await page.waitForURL('/countries')
    
    // Simulate offline mode
    await page.context().setOffline(true)
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
    
    // Create multiple queued actions
    await page.click('[data-testid="add-country-button"]')
    await page.fill('[data-testid="iso-code-2"]', 'QA')
    await page.fill('[data-testid="iso-code-3"]', 'QAT')
    await page.fill('[data-testid="name-en"]', 'Qatar')
    await page.fill('[data-testid="name-ar"]', 'قطر')
    await page.selectOption('[data-testid="region"]', 'asia')
    await page.fill('[data-testid="capital-en"]', 'Doha')
    await page.fill('[data-testid="capital-ar"]', 'الدوحة')
    await page.fill('[data-testid="population"]', '2881000')
    await page.fill('[data-testid="area"]', '11586')
    
    await page.click('[data-testid="save-country"]')
    await expect(page.locator('[data-testid="queued-action"]')).toBeVisible()
    
    // Clear queue
    await page.click('[data-testid="clear-queue"]')
    await page.waitForSelector('[data-testid="queue-cleared"]')
    
    // Verify queue is cleared
    await expect(page.locator('[data-testid="offline-indicator"]')).toContainText('0 pending')
    
    // Verify localStorage is cleared
    const queuedActions = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('offlineQueue') || '[]')
    })
    
    expect(queuedActions).toHaveLength(0)
  })

  test('Offline queue persistence across page reloads', async ({ page }) => {
    // Navigate to countries
    await page.click('[data-testid="nav-countries"]')
    await page.waitForURL('/countries')
    
    // Simulate offline mode
    await page.context().setOffline(true)
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
    
    // Create a queued action
    await page.click('[data-testid="add-country-button"]')
    await page.fill('[data-testid="iso-code-2"]', 'QA')
    await page.fill('[data-testid="iso-code-3"]', 'QAT')
    await page.fill('[data-testid="name-en"]', 'Qatar')
    await page.fill('[data-testid="name-ar"]', 'قطر')
    await page.selectOption('[data-testid="region"]', 'asia')
    await page.fill('[data-testid="capital-en"]', 'Doha')
    await page.fill('[data-testid="capital-ar"]', 'الدوحة')
    await page.fill('[data-testid="population"]', '2881000')
    await page.fill('[data-testid="area"]', '11586')
    
    await page.click('[data-testid="save-country"]')
    await expect(page.locator('[data-testid="queued-action"]')).toBeVisible()
    
    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Verify queue is still there
    await expect(page.locator('[data-testid="offline-indicator"]')).toContainText('1 pending')
    
    // Go back online
    await page.context().setOffline(false)
    await page.waitForSelector('[data-testid="online-indicator"]')
    
    // Process queued actions
    await page.click('[data-testid="process-queue"]')
    await page.waitForSelector('[data-testid="queue-processed"]')
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })

  test('Offline queue with different action types', async ({ page }) => {
    // Navigate to countries
    await page.click('[data-testid="nav-countries"]')
    await page.waitForURL('/countries')
    
    // Simulate offline mode
    await page.context().setOffline(true)
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
    
    // Create country
    await page.click('[data-testid="add-country-button"]')
    await page.fill('[data-testid="iso-code-2"]', 'QA')
    await page.fill('[data-testid="iso-code-3"]', 'QAT')
    await page.fill('[data-testid="name-en"]', 'Qatar')
    await page.fill('[data-testid="name-ar"]', 'قطر')
    await page.selectOption('[data-testid="region"]', 'asia')
    await page.fill('[data-testid="capital-en"]', 'Doha')
    await page.fill('[data-testid="capital-ar"]', 'الدوحة')
    await page.fill('[data-testid="population"]', '2881000')
    await page.fill('[data-testid="area"]', '11586')
    
    await page.click('[data-testid="save-country"]')
    await expect(page.locator('[data-testid="queued-action"]')).toBeVisible()
    
    // Navigate to organizations
    await page.click('[data-testid="nav-organizations"]')
    await page.waitForURL('/organizations')
    
    // Create organization
    await page.click('[data-testid="add-organization-button"]')
    await page.fill('[data-testid="code"]', 'QA-STAT')
    await page.fill('[data-testid="name-en"]', 'Qatar Statistics Authority')
    await page.fill('[data-testid="name-ar"]', 'هيئة الإحصاء القطرية')
    await page.selectOption('[data-testid="type"]', 'government')
    await page.selectOption('[data-testid="country"]', 'Qatar')
    await page.fill('[data-testid="website"]', 'https://qsa.gov.qa')
    await page.fill('[data-testid="email"]', 'info@qsa.gov.qa')
    await page.fill('[data-testid="phone"]', '+97440123456')
    await page.fill('[data-testid="address-en"]', 'Doha, Qatar')
    await page.fill('[data-testid="address-ar"]', 'الدوحة، قطر')
    
    await page.click('[data-testid="save-organization"]')
    await expect(page.locator('[data-testid="queued-action"]')).toBeVisible()
    
    // Navigate to MoUs
    await page.click('[data-testid="nav-mous"]')
    await page.waitForURL('/mous')
    
    // Create MoU
    await page.click('[data-testid="add-mou-button"]')
    await page.fill('[data-testid="title-en"]', 'Statistical Cooperation Agreement')
    await page.fill('[data-testid="title-ar"]', 'اتفاقية التعاون الإحصائي')
    await page.fill('[data-testid="description-en"]', 'Agreement for statistical data exchange')
    await page.fill('[data-testid="description-ar"]', 'اتفاقية لتبادل البيانات الإحصائية')
    await page.selectOption('[data-testid="primary-party"]', 'GASTAT')
    await page.selectOption('[data-testid="secondary-party"]', 'Qatar Statistics Authority')
    await page.fill('[data-testid="effective-date"]', '2025-01-01')
    await page.fill('[data-testid="expiry-date"]', '2027-12-31')
    
    await page.click('[data-testid="save-mou"]')
    await expect(page.locator('[data-testid="queued-action"]')).toBeVisible()
    
    // Verify all actions are queued
    await expect(page.locator('[data-testid="offline-indicator"]')).toContainText('3 pending')
    
    // Go back online
    await page.context().setOffline(false)
    await page.waitForSelector('[data-testid="online-indicator"]')
    
    // Process queued actions
    await page.click('[data-testid="process-queue"]')
    await page.waitForSelector('[data-testid="queue-processed"]')
    
    // Verify all actions were processed
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="offline-indicator"]')).toContainText('0 pending')
  })

  test('Offline queue with network interruptions', async ({ page }) => {
    // Navigate to countries
    await page.click('[data-testid="nav-countries"]')
    await page.waitForURL('/countries')
    
    // Simulate offline mode
    await page.context().setOffline(true)
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
    
    // Create a queued action
    await page.click('[data-testid="add-country-button"]')
    await page.fill('[data-testid="iso-code-2"]', 'QA')
    await page.fill('[data-testid="iso-code-3"]', 'QAT')
    await page.fill('[data-testid="name-en"]', 'Qatar')
    await page.fill('[data-testid="name-ar"]', 'قطر')
    await page.selectOption('[data-testid="region"]', 'asia')
    await page.fill('[data-testid="capital-en"]', 'Doha')
    await page.fill('[data-testid="capital-ar"]', 'الدوحة')
    await page.fill('[data-testid="population"]', '2881000')
    await page.fill('[data-testid="area"]', '11586')
    
    await page.click('[data-testid="save-country"]')
    await expect(page.locator('[data-testid="queued-action"]')).toBeVisible()
    
    // Go back online briefly
    await page.context().setOffline(false)
    await page.waitForSelector('[data-testid="online-indicator"]')
    
    // Start processing
    await page.click('[data-testid="process-queue"]')
    
    // Simulate network interruption during processing
    await page.context().setOffline(true)
    await page.waitForSelector('[data-testid="offline-indicator"]')
    
    // Verify action is still queued
    await expect(page.locator('[data-testid="offline-indicator"]')).toContainText('1 pending')
    
    // Go back online and complete processing
    await page.context().setOffline(false)
    await page.waitForSelector('[data-testid="online-indicator"]')
    
    await page.click('[data-testid="process-queue"]')
    await page.waitForSelector('[data-testid="queue-processed"]')
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })

  test('Offline queue with large data sets', async ({ page }) => {
    // Navigate to countries
    await page.click('[data-testid="nav-countries"]')
    await page.waitForURL('/countries')
    
    // Simulate offline mode
    await page.context().setOffline(true)
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
    
    // Create multiple queued actions
    const countries = [
      { code2: 'QA', code3: 'QAT', nameEn: 'Qatar', nameAr: 'قطر' },
      { code2: 'KW', code3: 'KWT', nameEn: 'Kuwait', nameAr: 'الكويت' },
      { code2: 'BH', code3: 'BHR', nameEn: 'Bahrain', nameAr: 'البحرين' },
      { code2: 'OM', code3: 'OMN', nameEn: 'Oman', nameAr: 'عُمان' },
      { code2: 'AE', code3: 'ARE', nameEn: 'UAE', nameAr: 'الإمارات' }
    ]
    
    for (const country of countries) {
      await page.click('[data-testid="add-country-button"]')
      await page.fill('[data-testid="iso-code-2"]', country.code2)
      await page.fill('[data-testid="iso-code-3"]', country.code3)
      await page.fill('[data-testid="name-en"]', country.nameEn)
      await page.fill('[data-testid="name-ar"]', country.nameAr)
      await page.selectOption('[data-testid="region"]', 'asia')
      await page.fill('[data-testid="capital-en"]', 'Capital')
      await page.fill('[data-testid="capital-ar"]', 'عاصمة')
      await page.fill('[data-testid="population"]', '1000000')
      await page.fill('[data-testid="area"]', '1000')
      
      await page.click('[data-testid="save-country"]')
      await expect(page.locator('[data-testid="queued-action"]')).toBeVisible()
    }
    
    // Verify all actions are queued
    await expect(page.locator('[data-testid="offline-indicator"]')).toContainText('5 pending')
    
    // Go back online
    await page.context().setOffline(false)
    await page.waitForSelector('[data-testid="online-indicator"]')
    
    // Process queued actions
    await page.click('[data-testid="process-queue"]')
    await page.waitForSelector('[data-testid="queue-processed"]')
    
    // Verify all actions were processed
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="offline-indicator"]')).toContainText('0 pending')
    
    // Verify countries were created
    for (const country of countries) {
      await expect(page.locator('[data-testid="country-list"]')).toContainText(country.nameEn)
    }
  })
})