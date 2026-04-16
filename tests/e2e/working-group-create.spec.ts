// @covers WG-01, WG-02, WG-03
import { test, expect } from './support/fixtures'

test.describe('Working Group wizard — create flow', () => {
  test('creates a working group via the 3-step wizard and lands on the detail page', async ({
    adminPage,
    uniqueId,
  }): Promise<void> => {
    const page = adminPage
    const nameEn = uniqueId('e2e-wg')
    const nameAr = 'فريق عمل اختبار'

    await page.goto('/dossiers/working_groups')

    // WG-01: Create button routes to /dossiers/working_groups/create
    await page
      .getByRole('link', { name: /create working group|إنشاء فريق عمل/i })
      .first()
      .click()
    await expect(page).toHaveURL(/\/dossiers\/working_groups\/create$/)

    // Stepper: 3 step buttons rendered by CreateWizardShell
    const steps = page.getByRole('button', { name: /^(Step|الخطوة) \d+:/ })
    await expect(steps).toHaveCount(3)

    // Step 1: Basic Info — use placeholders to disambiguate from tooltip-button labels
    await page.getByPlaceholder(/Enter name in English|أدخل الاسم بالإنجليزية/i).fill(nameEn)
    await page.getByPlaceholder(/Enter name in Arabic|أدخل الاسم بالعربية/i).fill(nameAr)
    await page.getByRole('button', { name: /^next$|التالي/i }).click()

    // WG-02: Step 2 (Working Group Details)
    await expect(
      page.getByRole('heading', { name: /working group details|تفاصيل فريق العمل/i }),
    ).toBeVisible()

    // Status select — pick Active
    await page.getByLabel(/status|الحالة/i).click()
    await page.getByRole('option', { name: /^active$|^نشط$/i }).click()

    // Mandate EN (optional but good signal)
    await page.getByLabel(/mandate.*english|التفويض.*الإنجليزية/i).fill('E2E test mandate')
    // Mandate AR
    await page.getByLabel(/mandate.*arabic|التفويض.*العربية/i).fill('تفويض اختبار')

    // Leave established_date and parent_body blank (D-11 optional)
    await page.getByRole('button', { name: /^next$|التالي/i }).click()

    // WG-03: Step 3 (Review) — submit
    await expect(page.getByRole('heading', { name: /review|مراجعة/i })).toBeVisible()
    await page
      .getByRole('button', { name: /^(submit|create|finish|create dossier|create working group)$|إرسال|إنشاء|إنهاء/i })
      .click()

    await expect(page).toHaveURL(/\/dossiers\/[0-9a-f-]{36}$/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: new RegExp(nameEn, 'i') })).toBeVisible()
  })
})
