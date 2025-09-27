import { test, expect } from '@playwright/test'

test.describe('Critical User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test data and authentication
    await page.goto('/login')
  })

  test('Complete User Onboarding Journey', async ({ page }) => {
    // Step 1: User Registration
    await page.goto('/register')
    await expect(page).toHaveTitle(/GASTAT International Dossier/)
    
    // Fill registration form
    await page.fill('[data-testid="email"]', 'newuser@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'SecurePass123!')
    await page.fill('[data-testid="confirmPassword"]', 'SecurePass123!')
    await page.fill('[data-testid="fullName"]', 'Ahmed Al-Rashid')
    await page.selectOption('[data-testid="language"]', 'ar')
    await page.selectOption('[data-testid="role"]', 'editor')
    
    // Submit registration
    await page.click('[data-testid="register-button"]')
    await page.waitForURL('/login')
    
    // Step 2: Email Verification (simulated)
    await page.fill('[data-testid="email"]', 'newuser@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'SecurePass123!')
    await page.click('[data-testid="login-button"]')
    
    // Should redirect to dashboard
    await page.waitForURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Dashboard')
    
    // Step 3: Complete profile setup
    await page.click('[data-testid="profile-menu"]')
    await page.click('[data-testid="profile-settings"]')
    
    await page.fill('[data-testid="phone"]', '+966501234567')
    await page.fill('[data-testid="department"]', 'International Relations')
    await page.selectOption('[data-testid="timezone"]', 'Asia/Riyadh')
    
    await page.click('[data-testid="save-profile"]')
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    
    // Step 4: Navigate to main modules
    await page.click('[data-testid="nav-countries"]')
    await expect(page).toHaveURL('/countries')
    await expect(page.locator('h1')).toContainText('Countries')
    
    await page.click('[data-testid="nav-organizations"]')
    await expect(page).toHaveURL('/organizations')
    await expect(page.locator('h1')).toContainText('Organizations')
  })

  test('Country Management Journey', async ({ page }) => {
    // Login as admin
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    // Navigate to countries
    await page.click('[data-testid="nav-countries"]')
    await expect(page).toHaveURL('/countries')
    
    // Step 1: Search for countries
    await page.fill('[data-testid="search-input"]', 'Saudi')
    await page.click('[data-testid="search-button"]')
    await page.waitForSelector('[data-testid="country-list"]')
    
    // Step 2: Filter by region
    await page.selectOption('[data-testid="region-filter"]', 'asia')
    await page.waitForSelector('[data-testid="country-list"]')
    
    // Step 3: Add new country
    await page.click('[data-testid="add-country-button"]')
    await expect(page.locator('[data-testid="country-form"]')).toBeVisible()
    
    await page.fill('[data-testid="iso-code-2"]', 'AE')
    await page.fill('[data-testid="iso-code-3"]', 'ARE')
    await page.fill('[data-testid="name-en"]', 'United Arab Emirates')
    await page.fill('[data-testid="name-ar"]', 'دولة الإمارات العربية المتحدة')
    await page.selectOption('[data-testid="region"]', 'asia')
    await page.fill('[data-testid="capital-en"]', 'Abu Dhabi')
    await page.fill('[data-testid="capital-ar"]', 'أبو ظبي')
    await page.fill('[data-testid="population"]', '9890400')
    await page.fill('[data-testid="area"]', '83600')
    
    await page.click('[data-testid="save-country"]')
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    
    // Step 4: Edit country
    await page.click('[data-testid="country-row"]:has-text("United Arab Emirates")')
    await page.click('[data-testid="edit-country"]')
    
    await page.fill('[data-testid="population"]', '10000000')
    await page.click('[data-testid="save-country"]')
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    
    // Step 5: View country details
    await page.click('[data-testid="view-country"]')
    await expect(page.locator('[data-testid="country-details"]')).toBeVisible()
    await expect(page.locator('[data-testid="country-name"]')).toContainText('United Arab Emirates')
  })

  test('Organization Management Journey', async ({ page }) => {
    // Login
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    // Navigate to organizations
    await page.click('[data-testid="nav-organizations"]')
    await expect(page).toHaveURL('/organizations')
    
    // Step 1: Create organization
    await page.click('[data-testid="add-organization-button"]')
    await expect(page.locator('[data-testid="organization-form"]')).toBeVisible()
    
    await page.fill('[data-testid="code"]', 'UAE-STAT')
    await page.fill('[data-testid="name-en"]', 'UAE Statistics Centre')
    await page.fill('[data-testid="name-ar"]', 'مركز الإحصاء الإماراتي')
    await page.selectOption('[data-testid="type"]', 'government')
    await page.selectOption('[data-testid="country"]', 'United Arab Emirates')
    await page.fill('[data-testid="website"]', 'https://uaestat.ae')
    await page.fill('[data-testid="email"]', 'info@uaestat.ae')
    await page.fill('[data-testid="phone"]', '+97141234567')
    await page.fill('[data-testid="address-en"]', 'Abu Dhabi, UAE')
    await page.fill('[data-testid="address-ar"]', 'أبو ظبي، الإمارات')
    
    await page.click('[data-testid="save-organization"]')
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    
    // Step 2: Create child organization
    await page.click('[data-testid="add-organization-button"]')
    await page.fill('[data-testid="code"]', 'UAE-STAT-RESEARCH')
    await page.fill('[data-testid="name-en"]', 'UAE Statistics Research Department')
    await page.fill('[data-testid="name-ar"]', 'قسم البحوث الإحصائية')
    await page.selectOption('[data-testid="type"]', 'government')
    await page.selectOption('[data-testid="country"]', 'United Arab Emirates')
    await page.selectOption('[data-testid="parent-organization"]', 'UAE Statistics Centre')
    
    await page.click('[data-testid="save-organization"]')
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    
    // Step 3: View organization hierarchy
    await page.click('[data-testid="view-hierarchy"]')
    await expect(page.locator('[data-testid="hierarchy-tree"]')).toBeVisible()
    await expect(page.locator('[data-testid="hierarchy-tree"]')).toContainText('UAE Statistics Centre')
    await expect(page.locator('[data-testid="hierarchy-tree"]')).toContainText('UAE Statistics Research Department')
  })

  test('MoU Workflow Journey', async ({ page }) => {
    // Login
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    // Navigate to MoUs
    await page.click('[data-testid="nav-mous"]')
    await expect(page).toHaveURL('/mous')
    
    // Step 1: Create MoU
    await page.click('[data-testid="add-mou-button"]')
    await expect(page.locator('[data-testid="mou-form"]')).toBeVisible()
    
    await page.fill('[data-testid="title-en"]', 'Statistical Cooperation Agreement')
    await page.fill('[data-testid="title-ar"]', 'اتفاقية التعاون الإحصائي')
    await page.fill('[data-testid="description-en"]', 'Agreement for statistical data exchange and cooperation')
    await page.fill('[data-testid="description-ar"]', 'اتفاقية لتبادل البيانات الإحصائية والتعاون')
    await page.selectOption('[data-testid="primary-party"]', 'GASTAT')
    await page.selectOption('[data-testid="secondary-party"]', 'UAE Statistics Centre')
    await page.fill('[data-testid="effective-date"]', '2025-01-01')
    await page.fill('[data-testid="expiry-date"]', '2027-12-31')
    await page.check('[data-testid="auto-renewal"]')
    await page.fill('[data-testid="renewal-period"]', '24')
    
    // Upload document
    await page.setInputFiles('[data-testid="document-upload"]', 'test-files/sample-mou.pdf')
    await page.waitForSelector('[data-testid="upload-success"]')
    
    await page.click('[data-testid="save-mou"]')
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    
    // Step 2: Review MoU workflow
    const mouId = await page.locator('[data-testid="mou-id"]').textContent()
    
    // Move to internal review
    await page.click('[data-testid="transition-button"]')
    await page.selectOption('[data-testid="new-state"]', 'internal_review')
    await page.fill('[data-testid="transition-comment"]', 'Ready for internal review')
    await page.click('[data-testid="confirm-transition"]')
    await expect(page.locator('[data-testid="workflow-state"]')).toContainText('Internal Review')
    
    // Move to external review
    await page.click('[data-testid="transition-button"]')
    await page.selectOption('[data-testid="new-state"]', 'external_review')
    await page.fill('[data-testid="transition-comment"]', 'Sent to external party for review')
    await page.click('[data-testid="confirm-transition"]')
    await expect(page.locator('[data-testid="workflow-state"]')).toContainText('External Review')
    
    // Move to signed
    await page.click('[data-testid="transition-button"]')
    await page.selectOption('[data-testid="new-state"]', 'signed')
    await page.fill('[data-testid="signing-date"]', '2025-01-15')
    await page.fill('[data-testid="transition-comment"]', 'MoU signed by both parties')
    await page.click('[data-testid="confirm-transition"]')
    await expect(page.locator('[data-testid="workflow-state"]')).toContainText('Signed')
    
    // Step 3: View MoU details
    await page.click('[data-testid="view-mou"]')
    await expect(page.locator('[data-testid="mou-details"]')).toBeVisible()
    await expect(page.locator('[data-testid="workflow-timeline"]')).toBeVisible()
  })

  test('Event Management Journey', async ({ page }) => {
    // Login
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    // Navigate to events
    await page.click('[data-testid="nav-events"]')
    await expect(page).toHaveURL('/events')
    
    // Step 1: Create event
    await page.click('[data-testid="add-event-button"]')
    await expect(page.locator('[data-testid="event-form"]')).toBeVisible()
    
    await page.fill('[data-testid="title-en"]', 'Statistical Conference 2025')
    await page.fill('[data-testid="title-ar"]', 'المؤتمر الإحصائي 2025')
    await page.fill('[data-testid="description-en"]', 'Annual statistical conference')
    await page.fill('[data-testid="description-ar"]', 'المؤتمر الإحصائي السنوي')
    await page.selectOption('[data-testid="type"]', 'conference')
    await page.fill('[data-testid="start-datetime"]', '2025-03-15T09:00:00')
    await page.fill('[data-testid="end-datetime"]', '2025-03-17T17:00:00')
    await page.selectOption('[data-testid="timezone"]', 'Asia/Riyadh')
    await page.fill('[data-testid="location-en"]', 'Riyadh Convention Center')
    await page.fill('[data-testid="location-ar"]', 'مركز الرياض للمؤتمرات')
    await page.fill('[data-testid="venue-en"]', 'Main Hall')
    await page.fill('[data-testid="venue-ar"]', 'القاعة الرئيسية')
    await page.selectOption('[data-testid="country"]', 'Saudi Arabia')
    await page.selectOption('[data-testid="organizer"]', 'GASTAT')
    await page.fill('[data-testid="max-participants"]', '500')
    await page.check('[data-testid="registration-required"]')
    await page.fill('[data-testid="registration-deadline"]', '2025-03-01T23:59:59')
    
    await page.click('[data-testid="save-event"]')
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    
    // Step 2: Check for conflicts
    await page.click('[data-testid="check-conflicts"]')
    await page.waitForSelector('[data-testid="conflict-results"]')
    
    // Step 3: View event in calendar
    await page.click('[data-testid="calendar-view"]')
    await expect(page.locator('[data-testid="calendar"]')).toBeVisible()
    await expect(page.locator('[data-testid="calendar"]')).toContainText('Statistical Conference 2025')
    
    // Step 4: Create conflicting event
    await page.click('[data-testid="add-event-button"]')
    await page.fill('[data-testid="title-en"]', 'Conflicting Event')
    await page.fill('[data-testid="title-ar"]', 'حدث متضارب')
    await page.selectOption('[data-testid="type"]', 'meeting')
    await page.fill('[data-testid="start-datetime"]', '2025-03-15T10:00:00')
    await page.fill('[data-testid="end-datetime"]', '2025-03-15T12:00:00')
    await page.selectOption('[data-testid="timezone"]', 'Asia/Riyadh')
    await page.fill('[data-testid="venue-en"]', 'Main Hall')
    await page.selectOption('[data-testid="organizer"]', 'GASTAT')
    
    await page.click('[data-testid="save-event"]')
    await expect(page.locator('[data-testid="conflict-warning"]')).toBeVisible()
    await expect(page.locator('[data-testid="conflict-warning"]')).toContainText('Venue conflict detected')
  })

  test('Intelligence Report Journey', async ({ page }) => {
    // Login
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    // Navigate to intelligence
    await page.click('[data-testid="nav-intelligence"]')
    await expect(page).toHaveURL('/intelligence')
    
    // Step 1: Create intelligence report
    await page.click('[data-testid="add-report-button"]')
    await expect(page.locator('[data-testid="report-form"]')).toBeVisible()
    
    await page.fill('[data-testid="title-en"]', 'GCC Economic Trends Analysis')
    await page.fill('[data-testid="title-ar"]', 'تحليل الاتجاهات الاقتصادية لدول مجلس التعاون')
    await page.fill('[data-testid="executive-summary-en"]', 'Analysis of economic trends in GCC countries')
    await page.fill('[data-testid="executive-summary-ar"]', 'تحليل الاتجاهات الاقتصادية في دول مجلس التعاون')
    await page.fill('[data-testid="analysis-en"]', 'Detailed analysis of economic indicators')
    await page.fill('[data-testid="analysis-ar"]', 'تحليل مفصل للمؤشرات الاقتصادية')
    await page.selectOption('[data-testid="confidence-level"]', 'high')
    await page.selectOption('[data-testid="classification"]', 'internal')
    await page.check('[data-testid="analysis-type-trends"]')
    await page.check('[data-testid="analysis-type-predictions"]')
    
    // Add key findings
    await page.click('[data-testid="add-finding"]')
    await page.fill('[data-testid="finding-0"]', 'Economic growth showing positive trends')
    await page.selectOption('[data-testid="importance-0"]', 'high')
    
    // Add recommendations
    await page.click('[data-testid="add-recommendation"]')
    await page.fill('[data-testid="recommendation-0"]', 'Continue monitoring economic indicators')
    await page.selectOption('[data-testid="priority-0"]', 'medium')
    
    // Select related countries
    await page.check('[data-testid="country-saudi-arabia"]')
    await page.check('[data-testid="country-uae"]')
    await page.check('[data-testid="country-kuwait"]')
    
    await page.click('[data-testid="save-report"]')
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    
    // Step 2: Search intelligence reports
    await page.fill('[data-testid="search-input"]', 'GCC')
    await page.click('[data-testid="search-button"]')
    await page.waitForSelector('[data-testid="report-list"]')
    await expect(page.locator('[data-testid="report-list"]')).toContainText('GCC Economic Trends Analysis')
    
    // Step 3: Semantic search
    await page.fill('[data-testid="semantic-search"]', 'economic growth trends')
    await page.click('[data-testid="semantic-search-button"]')
    await page.waitForSelector('[data-testid="search-results"]')
    await expect(page.locator('[data-testid="search-results"]')).toContainText('GCC Economic Trends Analysis')
    
    // Step 4: View report details
    await page.click('[data-testid="view-report"]')
    await expect(page.locator('[data-testid="report-details"]')).toBeVisible()
    await expect(page.locator('[data-testid="confidence-level"]')).toContainText('High')
    await expect(page.locator('[data-testid="classification"]')).toContainText('Internal')
  })

  test('Data Library Management Journey', async ({ page }) => {
    // Login
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    // Navigate to data library
    await page.click('[data-testid="nav-data-library"]')
    await expect(page).toHaveURL('/data-library')
    
    // Step 1: Upload document
    await page.click('[data-testid="upload-button"]')
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible()
    
    await page.fill('[data-testid="title-en"]', 'Statistical Yearbook 2024')
    await page.fill('[data-testid="title-ar"]', 'الكتاب الإحصائي السنوي 2024')
    await page.fill('[data-testid="description-en"]', 'Annual statistical yearbook')
    await page.fill('[data-testid="description-ar"]', 'الكتاب الإحصائي السنوي')
    await page.selectOption('[data-testid="category"]', 'document')
    await page.fill('[data-testid="tags"]', 'statistics, annual, yearbook')
    await page.check('[data-testid="is-public"]')
    
    // Upload file
    await page.setInputFiles('[data-testid="file-upload"]', 'test-files/statistical-yearbook-2024.pdf')
    await page.waitForSelector('[data-testid="upload-progress"]')
    await page.waitForSelector('[data-testid="upload-complete"]')
    
    await page.click('[data-testid="confirm-upload"]')
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    
    // Step 2: Search and filter
    await page.fill('[data-testid="search-input"]', 'yearbook')
    await page.selectOption('[data-testid="category-filter"]', 'document')
    await page.check('[data-testid="public-only"]')
    await page.click('[data-testid="search-button"]')
    
    await page.waitForSelector('[data-testid="library-items"]')
    await expect(page.locator('[data-testid="library-items"]')).toContainText('Statistical Yearbook 2024')
    
    // Step 3: Download file
    await page.click('[data-testid="download-button"]')
    await page.waitForSelector('[data-testid="download-started"]')
    
    // Step 4: View file details
    await page.click('[data-testid="view-details"]')
    await expect(page.locator('[data-testid="file-details"]')).toBeVisible()
    await expect(page.locator('[data-testid="download-count"]')).toContainText('1')
  })

  test('Report Generation Journey', async ({ page }) => {
    // Login
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    // Navigate to reports
    await page.click('[data-testid="nav-reports"]')
    await expect(page).toHaveURL('/reports')
    
    // Step 1: Generate country overview report
    await page.click('[data-testid="generate-report-button"]')
    await expect(page.locator('[data-testid="report-form"]')).toBeVisible()
    
    await page.selectOption('[data-testid="report-type"]', 'country_overview')
    await page.selectOption('[data-testid="format"]', 'pdf')
    await page.selectOption('[data-testid="country-filter"]', 'Saudi Arabia')
    await page.fill('[data-testid="date-from"]', '2024-01-01')
    await page.fill('[data-testid="date-to"]', '2024-12-31')
    
    await page.click('[data-testid="generate-report"]')
    await expect(page.locator('[data-testid="generation-started"]')).toBeVisible()
    
    // Step 2: Monitor generation progress
    const jobId = await page.locator('[data-testid="job-id"]').textContent()
    await page.click('[data-testid="view-progress"]')
    await expect(page.locator('[data-testid="progress-modal"]')).toBeVisible()
    
    // Wait for completion (simulated)
    await page.waitForSelector('[data-testid="generation-complete"]', { timeout: 30000 })
    await expect(page.locator('[data-testid="download-link"]')).toBeVisible()
    
    // Step 3: Download report
    await page.click('[data-testid="download-report"]')
    await page.waitForSelector('[data-testid="download-started"]')
    
    // Step 4: Generate Excel report
    await page.click('[data-testid="generate-report-button"]')
    await page.selectOption('[data-testid="report-type"]', 'organization_summary')
    await page.selectOption('[data-testid="format"]', 'excel')
    await page.selectOption('[data-testid="organization-filter"]', 'GASTAT')
    
    await page.click('[data-testid="generate-report"]')
    await page.waitForSelector('[data-testid="generation-complete"]', { timeout: 30000 })
    await page.click('[data-testid="download-report"]')
  })

  test('Word Assistant Journey', async ({ page }) => {
    // Login
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    // Navigate to word assistant
    await page.click('[data-testid="nav-word-assistant"]')
    await expect(page).toHaveURL('/word-assistant')
    
    // Step 1: Generate document
    await page.fill('[data-testid="prompt"]', 'Create a formal letter to the UAE Statistics Centre requesting statistical data exchange')
    await page.selectOption('[data-testid="document-type"]', 'letter')
    await page.selectOption('[data-testid="language"]', 'en')
    await page.fill('[data-testid="context"]', 'GASTAT, UAE Statistics Centre, data exchange agreement')
    
    await page.click('[data-testid="generate-document"]')
    await page.waitForSelector('[data-testid="generation-progress"]')
    await page.waitForSelector('[data-testid="document-generated"]', { timeout: 30000 })
    
    // Step 2: Review generated content
    await expect(page.locator('[data-testid="generated-content"]')).toBeVisible()
    await expect(page.locator('[data-testid="generated-content"]')).toContainText('UAE Statistics Centre')
    
    // Step 3: Edit and refine
    await page.click('[data-testid="edit-document"]')
    await page.fill('[data-testid="content-editor"]', 'Dear UAE Statistics Centre,\n\nWe are writing to request statistical data exchange...')
    await page.click('[data-testid="save-document"]')
    
    // Step 4: Export document
    await page.selectOption('[data-testid="export-format"]', 'pdf')
    await page.click('[data-testid="export-document"]')
    await page.waitForSelector('[data-testid="export-complete"]')
    
    // Step 5: Generate Arabic version
    await page.selectOption('[data-testid="language"]', 'ar')
    await page.fill('[data-testid="prompt"]', 'أنشئ رسالة رسمية لمركز الإحصاء الإماراتي')
    await page.click('[data-testid="generate-document"]')
    await page.waitForSelector('[data-testid="document-generated"]', { timeout: 30000 })
    
    await expect(page.locator('[data-testid="generated-content"]')).toContainText('مركز الإحصاء الإماراتي')
  })

  test('Offline Functionality Journey', async ({ page }) => {
    // Login
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    // Step 1: Navigate to countries and load data
    await page.click('[data-testid="nav-countries"]')
    await page.waitForSelector('[data-testid="country-list"]')
    
    // Step 2: Simulate offline mode
    await page.context().setOffline(true)
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
    
    // Step 3: Try to create country (should queue)
    await page.click('[data-testid="add-country-button"]')
    await page.fill('[data-testid="iso-code-2"]', 'QA')
    await page.fill('[data-testid="iso-code-3"]', 'QAT')
    await page.fill('[data-testid="name-en"]', 'Qatar')
    await page.fill('[data-testid="name-ar"]', 'قطر')
    await page.selectOption('[data-testid="region"]', 'asia')
    
    await page.click('[data-testid="save-country"]')
    await expect(page.locator('[data-testid="queued-action"]')).toBeVisible()
    
    // Step 4: Go back online
    await page.context().setOffline(false)
    await page.waitForSelector('[data-testid="online-indicator"]')
    
    // Step 5: Process queued actions
    await page.click('[data-testid="process-queue"]')
    await page.waitForSelector('[data-testid="queue-processed"]')
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })

  test('Language Switching Journey', async ({ page }) => {
    // Start in English
    await page.goto('/login')
    await expect(page.locator('[data-testid="login-title"]')).toContainText('Sign In')
    
    // Step 1: Switch to Arabic
    await page.click('[data-testid="language-toggle"]')
    await page.click('[data-testid="language-arabic"]')
    await expect(page.locator('[data-testid="login-title"]')).toContainText('دخول')
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    
    // Step 2: Login in Arabic
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    // Step 3: Navigate through Arabic interface
    await expect(page.locator('[data-testid="dashboard-title"]')).toContainText('لوحة التحكم')
    
    await page.click('[data-testid="nav-countries"]')
    await expect(page.locator('[data-testid="countries-title"]')).toContainText('الدول')
    
    // Step 4: Switch back to English
    await page.click('[data-testid="language-toggle"]')
    await page.click('[data-testid="language-english"]')
    await expect(page.locator('[data-testid="countries-title"]')).toContainText('Countries')
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
    
    // Step 5: Test RTL content in English interface
    await page.click('[data-testid="add-country-button"]')
    await page.fill('[data-testid="name-ar"]', 'المملكة العربية السعودية')
    await expect(page.locator('[data-testid="name-ar"]')).toHaveAttribute('dir', 'rtl')
  })
})