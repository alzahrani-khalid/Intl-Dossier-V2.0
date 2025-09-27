import { test, expect } from '@playwright/test'

test.describe('Bilingual Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('Complete Bilingual User Registration Flow', async ({ page }) => {
    // Start in English
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
    await expect(page.locator('[data-testid="login-title"]')).toContainText('Sign In')
    
    // Switch to Arabic
    await page.click('[data-testid="language-toggle"]')
    await page.click('[data-testid="language-arabic"]')
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('[data-testid="login-title"]')).toContainText('دخول')
    
    // Navigate to registration in Arabic
    await page.click('[data-testid="register-link"]')
    await expect(page).toHaveURL('/register')
    await expect(page.locator('[data-testid="register-title"]')).toContainText('إنشاء حساب')
    
    // Fill registration form in Arabic context
    await page.fill('[data-testid="email"]', 'ahmed@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'SecurePass123!')
    await page.fill('[data-testid="confirmPassword"]', 'SecurePass123!')
    await page.fill('[data-testid="fullName"]', 'أحمد الراشد')
    await page.selectOption('[data-testid="language"]', 'ar')
    await page.selectOption('[data-testid="role"]', 'editor')
    
    // Submit registration
    await page.click('[data-testid="register-button"]')
    await page.waitForURL('/login')
    await expect(page.locator('[data-testid="success-message"]')).toContainText('تم إنشاء الحساب بنجاح')
    
    // Login in Arabic
    await page.fill('[data-testid="email"]', 'ahmed@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'SecurePass123!')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    // Verify Arabic dashboard
    await expect(page.locator('[data-testid="dashboard-title"]')).toContainText('لوحة التحكم')
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText('مرحباً، أحمد الراشد')
  })

  test('Bilingual Country Management Flow', async ({ page }) => {
    // Login in English
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    // Navigate to countries in English
    await page.click('[data-testid="nav-countries"]')
    await expect(page.locator('[data-testid="countries-title"]')).toContainText('Countries')
    
    // Create country with both languages
    await page.click('[data-testid="add-country-button"]')
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
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Country created successfully')
    
    // Switch to Arabic interface
    await page.click('[data-testid="language-toggle"]')
    await page.click('[data-testid="language-arabic"]')
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('[data-testid="countries-title"]')).toContainText('الدول')
    
    // Verify country appears in Arabic
    await expect(page.locator('[data-testid="country-list"]')).toContainText('دولة الإمارات العربية المتحدة')
    await expect(page.locator('[data-testid="country-list"]')).toContainText('أبو ظبي')
    
    // Edit country in Arabic interface
    await page.click('[data-testid="country-row"]:has-text("دولة الإمارات العربية المتحدة")')
    await page.click('[data-testid="edit-country"]')
    
    // Verify form is in Arabic
    await expect(page.locator('[data-testid="form-title"]')).toContainText('تعديل الدولة')
    await expect(page.locator('[data-testid="name-ar-label"]')).toContainText('الاسم بالعربية')
    await expect(page.locator('[data-testid="name-en-label"]')).toContainText('الاسم بالإنجليزية')
    
    // Update Arabic name
    await page.fill('[data-testid="name-ar"]', 'دولة الإمارات العربية المتحدة - محدث')
    await page.click('[data-testid="save-country"]')
    await expect(page.locator('[data-testid="success-message"]')).toContainText('تم تحديث الدولة بنجاح')
    
    // Switch back to English
    await page.click('[data-testid="language-toggle"]')
    await page.click('[data-testid="language-english"]')
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
    
    // Verify changes in English
    await expect(page.locator('[data-testid="country-list"]')).toContainText('United Arab Emirates')
    await expect(page.locator('[data-testid="country-list"]')).toContainText('Abu Dhabi')
  })

  test('Bilingual Organization Management Flow', async ({ page }) => {
    // Login
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    // Start in Arabic
    await page.click('[data-testid="language-toggle"]')
    await page.click('[data-testid="language-arabic"]')
    
    // Navigate to organizations
    await page.click('[data-testid="nav-organizations"]')
    await expect(page.locator('[data-testid="organizations-title"]')).toContainText('المنظمات')
    
    // Create organization in Arabic
    await page.click('[data-testid="add-organization-button"]')
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
    await expect(page.locator('[data-testid="success-message"]')).toContainText('تم إنشاء المنظمة بنجاح')
    
    // Switch to English
    await page.click('[data-testid="language-toggle"]')
    await page.click('[data-testid="language-english"]')
    await expect(page.locator('[data-testid="organizations-title"]')).toContainText('Organizations')
    
    // Verify organization in English
    await expect(page.locator('[data-testid="organization-list"]')).toContainText('UAE Statistics Centre')
    await expect(page.locator('[data-testid="organization-list"]')).toContainText('Abu Dhabi, UAE')
    
    // View organization details
    await page.click('[data-testid="organization-row"]:has-text("UAE Statistics Centre")')
    await page.click('[data-testid="view-organization"]')
    
    // Verify details page is in English
    await expect(page.locator('[data-testid="organization-details"]')).toContainText('UAE Statistics Centre')
    await expect(page.locator('[data-testid="organization-details"]')).toContainText('Government')
    await expect(page.locator('[data-testid="organization-details"]')).toContainText('Abu Dhabi, UAE')
  })

  test('Bilingual MoU Workflow Flow', async ({ page }) => {
    // Login
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    // Start in English
    await page.click('[data-testid="nav-mous"]')
    await expect(page.locator('[data-testid="mous-title"]')).toContainText('Memorandums of Understanding')
    
    // Create MoU in English
    await page.click('[data-testid="add-mou-button"]')
    await page.fill('[data-testid="title-en"]', 'Statistical Cooperation Agreement')
    await page.fill('[data-testid="title-ar"]', 'اتفاقية التعاون الإحصائي')
    await page.fill('[data-testid="description-en"]', 'Agreement for statistical data exchange and cooperation')
    await page.fill('[data-testid="description-ar"]', 'اتفاقية لتبادل البيانات الإحصائية والتعاون')
    await page.selectOption('[data-testid="primary-party"]', 'GASTAT')
    await page.selectOption('[data-testid="secondary-party"]', 'UAE Statistics Centre')
    await page.fill('[data-testid="effective-date"]', '2025-01-01')
    await page.fill('[data-testid="expiry-date"]', '2027-12-31')
    
    await page.click('[data-testid="save-mou"]')
    await expect(page.locator('[data-testid="success-message"]')).toContainText('MoU created successfully')
    
    // Switch to Arabic
    await page.click('[data-testid="language-toggle"]')
    await page.click('[data-testid="language-arabic"]')
    await expect(page.locator('[data-testid="mous-title"]')).toContainText('مذكرات التفاهم')
    
    // Verify MoU in Arabic
    await expect(page.locator('[data-testid="mou-list"]')).toContainText('اتفاقية التعاون الإحصائي')
    await expect(page.locator('[data-testid="mou-list"]')).toContainText('اتفاقية لتبادل البيانات الإحصائية والتعاون')
    
    // View MoU details in Arabic
    await page.click('[data-testid="mou-row"]:has-text("اتفاقية التعاون الإحصائي")')
    await page.click('[data-testid="view-mou"]')
    
    // Verify details page is in Arabic
    await expect(page.locator('[data-testid="mou-details"]')).toContainText('اتفاقية التعاون الإحصائي')
    await expect(page.locator('[data-testid="mou-details"]')).toContainText('اتفاقية لتبادل البيانات الإحصائية والتعاون')
    await expect(page.locator('[data-testid="workflow-state"]')).toContainText('مسودة')
    
    // Switch back to English
    await page.click('[data-testid="language-toggle"]')
    await page.click('[data-testid="language-english"]')
    
    // Verify details page is in English
    await expect(page.locator('[data-testid="mou-details"]')).toContainText('Statistical Cooperation Agreement')
    await expect(page.locator('[data-testid="mou-details"]')).toContainText('Agreement for statistical data exchange and cooperation')
    await expect(page.locator('[data-testid="workflow-state"]')).toContainText('Draft')
  })

  test('Bilingual Event Management Flow', async ({ page }) => {
    // Login
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    // Start in Arabic
    await page.click('[data-testid="language-toggle"]')
    await page.click('[data-testid="language-arabic"]')
    
    // Navigate to events
    await page.click('[data-testid="nav-events"]')
    await expect(page.locator('[data-testid="events-title"]')).toContainText('الأحداث')
    
    // Create event in Arabic
    await page.click('[data-testid="add-event-button"]')
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
    
    await page.click('[data-testid="save-event"]')
    await expect(page.locator('[data-testid="success-message"]')).toContainText('تم إنشاء الحدث بنجاح')
    
    // Switch to English
    await page.click('[data-testid="language-toggle"]')
    await page.click('[data-testid="language-english"]')
    await expect(page.locator('[data-testid="events-title"]')).toContainText('Events')
    
    // Verify event in English
    await expect(page.locator('[data-testid="event-list"]')).toContainText('Statistical Conference 2025')
    await expect(page.locator('[data-testid="event-list"]')).toContainText('Annual statistical conference')
    await expect(page.locator('[data-testid="event-list"]')).toContainText('Riyadh Convention Center')
    
    // View calendar in English
    await page.click('[data-testid="calendar-view"]')
    await expect(page.locator('[data-testid="calendar"]')).toContainText('Statistical Conference 2025')
    
    // Switch back to Arabic
    await page.click('[data-testid="language-toggle"]')
    await page.click('[data-testid="language-arabic"]')
    
    // Verify calendar in Arabic
    await expect(page.locator('[data-testid="calendar"]')).toContainText('المؤتمر الإحصائي 2025')
    await expect(page.locator('[data-testid="calendar"]')).toContainText('مركز الرياض للمؤتمرات')
  })

  test('Bilingual Intelligence Report Flow', async ({ page }) => {
    // Login
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    // Start in English
    await page.click('[data-testid="nav-intelligence"]')
    await expect(page.locator('[data-testid="intelligence-title"]')).toContainText('Intelligence Reports')
    
    // Create report in English
    await page.click('[data-testid="add-report-button"]')
    await page.fill('[data-testid="title-en"]', 'GCC Economic Trends Analysis')
    await page.fill('[data-testid="title-ar"]', 'تحليل الاتجاهات الاقتصادية لدول مجلس التعاون')
    await page.fill('[data-testid="executive-summary-en"]', 'Analysis of economic trends in GCC countries')
    await page.fill('[data-testid="executive-summary-ar"]', 'تحليل الاتجاهات الاقتصادية في دول مجلس التعاون')
    await page.fill('[data-testid="analysis-en"]', 'Detailed analysis of economic indicators')
    await page.fill('[data-testid="analysis-ar"]', 'تحليل مفصل للمؤشرات الاقتصادية')
    await page.selectOption('[data-testid="confidence-level"]', 'high')
    await page.selectOption('[data-testid="classification"]', 'internal')
    
    await page.click('[data-testid="save-report"]')
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Report created successfully')
    
    // Switch to Arabic
    await page.click('[data-testid="language-toggle"]')
    await page.click('[data-testid="language-arabic"]')
    await expect(page.locator('[data-testid="intelligence-title"]')).toContainText('التقارير الاستخبارية')
    
    // Verify report in Arabic
    await expect(page.locator('[data-testid="report-list"]')).toContainText('تحليل الاتجاهات الاقتصادية لدول مجلس التعاون')
    await expect(page.locator('[data-testid="report-list"]')).toContainText('تحليل الاتجاهات الاقتصادية في دول مجلس التعاون')
    
    // Search in Arabic
    await page.fill('[data-testid="search-input"]', 'اقتصادي')
    await page.click('[data-testid="search-button"]')
    await expect(page.locator('[data-testid="search-results"]')).toContainText('تحليل الاتجاهات الاقتصادية لدول مجلس التعاون')
    
    // Switch back to English
    await page.click('[data-testid="language-toggle"]')
    await page.click('[data-testid="language-english"]')
    
    // Search in English
    await page.fill('[data-testid="search-input"]', 'economic')
    await page.click('[data-testid="search-button"]')
    await expect(page.locator('[data-testid="search-results"]')).toContainText('GCC Economic Trends Analysis')
  })

  test('Bilingual Data Library Flow', async ({ page }) => {
    // Login
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    // Start in Arabic
    await page.click('[data-testid="language-toggle"]')
    await page.click('[data-testid="language-arabic"]')
    
    // Navigate to data library
    await page.click('[data-testid="nav-data-library"]')
    await expect(page.locator('[data-testid="data-library-title"]')).toContainText('مكتبة البيانات')
    
    // Upload document in Arabic
    await page.click('[data-testid="upload-button"]')
    await page.fill('[data-testid="title-en"]', 'Statistical Yearbook 2024')
    await page.fill('[data-testid="title-ar"]', 'الكتاب الإحصائي السنوي 2024')
    await page.fill('[data-testid="description-en"]', 'Annual statistical yearbook')
    await page.fill('[data-testid="description-ar"]', 'الكتاب الإحصائي السنوي')
    await page.selectOption('[data-testid="category"]', 'document')
    await page.fill('[data-testid="tags"]', 'إحصاءات, سنوي, كتاب')
    
    // Upload file
    await page.setInputFiles('[data-testid="file-upload"]', 'test-files/statistical-yearbook-2024.pdf')
    await page.waitForSelector('[data-testid="upload-complete"]')
    
    await page.click('[data-testid="confirm-upload"]')
    await expect(page.locator('[data-testid="success-message"]')).toContainText('تم رفع الملف بنجاح')
    
    // Switch to English
    await page.click('[data-testid="language-toggle"]')
    await page.click('[data-testid="language-english"]')
    await expect(page.locator('[data-testid="data-library-title"]')).toContainText('Data Library')
    
    // Verify document in English
    await expect(page.locator('[data-testid="library-items"]')).toContainText('Statistical Yearbook 2024')
    await expect(page.locator('[data-testid="library-items"]')).toContainText('Annual statistical yearbook')
    
    // Search in English
    await page.fill('[data-testid="search-input"]', 'yearbook')
    await page.click('[data-testid="search-button"]')
    await expect(page.locator('[data-testid="search-results"]')).toContainText('Statistical Yearbook 2024')
    
    // Switch back to Arabic
    await page.click('[data-testid="language-toggle"]')
    await page.click('[data-testid="language-arabic"]')
    
    // Search in Arabic
    await page.fill('[data-testid="search-input"]', 'كتاب')
    await page.click('[data-testid="search-button"]')
    await expect(page.locator('[data-testid="search-results"]')).toContainText('الكتاب الإحصائي السنوي 2024')
  })

  test('Bilingual Word Assistant Flow', async ({ page }) => {
    // Login
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    // Start in English
    await page.click('[data-testid="nav-word-assistant"]')
    await expect(page.locator('[data-testid="word-assistant-title"]')).toContainText('Word Assistant')
    
    // Generate document in English
    await page.fill('[data-testid="prompt"]', 'Create a formal letter to the UAE Statistics Centre requesting statistical data exchange')
    await page.selectOption('[data-testid="document-type"]', 'letter')
    await page.selectOption('[data-testid="language"]', 'en')
    await page.fill('[data-testid="context"]', 'GASTAT, UAE Statistics Centre, data exchange agreement')
    
    await page.click('[data-testid="generate-document"]')
    await page.waitForSelector('[data-testid="document-generated"]', { timeout: 30000 })
    
    // Verify English content
    await expect(page.locator('[data-testid="generated-content"]')).toContainText('UAE Statistics Centre')
    await expect(page.locator('[data-testid="generated-content"]')).toContainText('data exchange')
    
    // Switch to Arabic
    await page.click('[data-testid="language-toggle"]')
    await page.click('[data-testid="language-arabic"]')
    await expect(page.locator('[data-testid="word-assistant-title"]')).toContainText('مساعد الكلمات')
    
    // Generate document in Arabic
    await page.fill('[data-testid="prompt"]', 'أنشئ رسالة رسمية لمركز الإحصاء الإماراتي')
    await page.selectOption('[data-testid="document-type"]', 'letter')
    await page.selectOption('[data-testid="language"]', 'ar')
    await page.fill('[data-testid="context"]', 'الهيئة العامة للإحصاء، مركز الإحصاء الإماراتي، اتفاقية تبادل البيانات')
    
    await page.click('[data-testid="generate-document"]')
    await page.waitForSelector('[data-testid="document-generated"]', { timeout: 30000 })
    
    // Verify Arabic content
    await expect(page.locator('[data-testid="generated-content"]')).toContainText('مركز الإحصاء الإماراتي')
    await expect(page.locator('[data-testid="generated-content"]')).toContainText('تبادل البيانات')
    
    // Switch back to English
    await page.click('[data-testid="language-toggle"]')
    await page.click('[data-testid="language-english"]')
    
    // Verify interface is in English
    await expect(page.locator('[data-testid="word-assistant-title"]')).toContainText('Word Assistant')
    await expect(page.locator('[data-testid="prompt-label"]')).toContainText('Prompt')
    await expect(page.locator('[data-testid="document-type-label"]')).toContainText('Document Type')
  })

  test('Bilingual Navigation and UI Elements', async ({ page }) => {
    // Login
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    // Test navigation in English
    await expect(page.locator('[data-testid="nav-dashboard"]')).toContainText('Dashboard')
    await expect(page.locator('[data-testid="nav-countries"]')).toContainText('Countries')
    await expect(page.locator('[data-testid="nav-organizations"]')).toContainText('Organizations')
    await expect(page.locator('[data-testid="nav-mous"]')).toContainText('MoUs')
    await expect(page.locator('[data-testid="nav-events"]')).toContainText('Events')
    await expect(page.locator('[data-testid="nav-intelligence"]')).toContainText('Intelligence')
    await expect(page.locator('[data-testid="nav-data-library"]')).toContainText('Data Library')
    await expect(page.locator('[data-testid="nav-reports"]')).toContainText('Reports')
    await expect(page.locator('[data-testid="nav-word-assistant"]')).toContainText('Word Assistant')
    
    // Switch to Arabic
    await page.click('[data-testid="language-toggle"]')
    await page.click('[data-testid="language-arabic"]')
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    
    // Test navigation in Arabic
    await expect(page.locator('[data-testid="nav-dashboard"]')).toContainText('لوحة التحكم')
    await expect(page.locator('[data-testid="nav-countries"]')).toContainText('الدول')
    await expect(page.locator('[data-testid="nav-organizations"]')).toContainText('المنظمات')
    await expect(page.locator('[data-testid="nav-mous"]')).toContainText('مذكرات التفاهم')
    await expect(page.locator('[data-testid="nav-events"]')).toContainText('الأحداث')
    await expect(page.locator('[data-testid="nav-intelligence"]')).toContainText('الاستخبارات')
    await expect(page.locator('[data-testid="nav-data-library"]')).toContainText('مكتبة البيانات')
    await expect(page.locator('[data-testid="nav-reports"]')).toContainText('التقارير')
    await expect(page.locator('[data-testid="nav-word-assistant"]')).toContainText('مساعد الكلمات')
    
    // Test form elements in Arabic
    await page.click('[data-testid="nav-countries"]')
    await page.click('[data-testid="add-country-button"]')
    
    await expect(page.locator('[data-testid="form-title"]')).toContainText('إضافة دولة جديدة')
    await expect(page.locator('[data-testid="iso-code-2-label"]')).toContainText('رمز ISO 2')
    await expect(page.locator('[data-testid="iso-code-3-label"]')).toContainText('رمز ISO 3')
    await expect(page.locator('[data-testid="name-en-label"]')).toContainText('الاسم بالإنجليزية')
    await expect(page.locator('[data-testid="name-ar-label"]')).toContainText('الاسم بالعربية')
    await expect(page.locator('[data-testid="region-label"]')).toContainText('المنطقة')
    await expect(page.locator('[data-testid="capital-en-label"]')).toContainText('العاصمة بالإنجليزية')
    await expect(page.locator('[data-testid="capital-ar-label"]')).toContainText('العاصمة بالعربية')
    await expect(page.locator('[data-testid="population-label"]')).toContainText('عدد السكان')
    await expect(page.locator('[data-testid="area-label"]')).toContainText('المساحة')
    
    // Test buttons in Arabic
    await expect(page.locator('[data-testid="save-country"]')).toContainText('حفظ')
    await expect(page.locator('[data-testid="cancel-country"]')).toContainText('إلغاء')
    
    // Switch back to English
    await page.click('[data-testid="language-toggle"]')
    await page.click('[data-testid="language-english"]')
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
    
    // Test form elements in English
    await expect(page.locator('[data-testid="form-title"]')).toContainText('Add New Country')
    await expect(page.locator('[data-testid="iso-code-2-label"]')).toContainText('ISO 2 Code')
    await expect(page.locator('[data-testid="iso-code-3-label"]')).toContainText('ISO 3 Code')
    await expect(page.locator('[data-testid="name-en-label"]')).toContainText('Name (English)')
    await expect(page.locator('[data-testid="name-ar-label"]')).toContainText('Name (Arabic)')
    await expect(page.locator('[data-testid="region-label"]')).toContainText('Region')
    await expect(page.locator('[data-testid="capital-en-label"]')).toContainText('Capital (English)')
    await expect(page.locator('[data-testid="capital-ar-label"]')).toContainText('Capital (Arabic)')
    await expect(page.locator('[data-testid="population-label"]')).toContainText('Population')
    await expect(page.locator('[data-testid="area-label"]')).toContainText('Area')
    
    // Test buttons in English
    await expect(page.locator('[data-testid="save-country"]')).toContainText('Save')
    await expect(page.locator('[data-testid="cancel-country"]')).toContainText('Cancel')
  })

  test('Bilingual Error Messages and Validation', async ({ page }) => {
    // Login
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    // Start in English
    await page.click('[data-testid="nav-countries"]')
    await page.click('[data-testid="add-country-button"]')
    
    // Test validation in English
    await page.click('[data-testid="save-country"]')
    await expect(page.locator('[data-testid="error-iso-code-2"]')).toContainText('ISO 2 code is required')
    await expect(page.locator('[data-testid="error-iso-code-3"]')).toContainText('ISO 3 code is required')
    await expect(page.locator('[data-testid="error-name-en"]')).toContainText('English name is required')
    await expect(page.locator('[data-testid="error-name-ar"]')).toContainText('Arabic name is required')
    
    // Switch to Arabic
    await page.click('[data-testid="language-toggle"]')
    await page.click('[data-testid="language-arabic"]')
    
    // Test validation in Arabic
    await page.click('[data-testid="save-country"]')
    await expect(page.locator('[data-testid="error-iso-code-2"]')).toContainText('رمز ISO 2 مطلوب')
    await expect(page.locator('[data-testid="error-iso-code-3"]')).toContainText('رمز ISO 3 مطلوب')
    await expect(page.locator('[data-testid="error-name-en"]')).toContainText('الاسم بالإنجليزية مطلوب')
    await expect(page.locator('[data-testid="error-name-ar"]')).toContainText('الاسم بالعربية مطلوب')
    
    // Test invalid data validation in Arabic
    await page.fill('[data-testid="iso-code-2"]', 'INVALID')
    await page.fill('[data-testid="iso-code-3"]', 'INV')
    await page.fill('[data-testid="name-en"]', 'Test Country')
    await page.fill('[data-testid="name-ar"]', 'دولة تجريبية')
    await page.selectOption('[data-testid="region"]', 'asia')
    
    await page.click('[data-testid="save-country"]')
    await expect(page.locator('[data-testid="error-iso-code-2"]')).toContainText('رمز ISO 2 يجب أن يكون حرفين')
    await expect(page.locator('[data-testid="error-iso-code-3"]')).toContainText('رمز ISO 3 يجب أن يكون ثلاثة أحرف')
    
    // Switch back to English
    await page.click('[data-testid="language-toggle"]')
    await page.click('[data-testid="language-english"]')
    
    // Test invalid data validation in English
    await page.click('[data-testid="save-country"]')
    await expect(page.locator('[data-testid="error-iso-code-2"]')).toContainText('ISO 2 code must be 2 characters')
    await expect(page.locator('[data-testid="error-iso-code-3"]')).toContainText('ISO 3 code must be 3 characters')
  })
})