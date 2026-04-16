// @covers ENGM-01, ENGM-02, ENGM-03, ENGM-04, ENGM-05
import { test, expect } from './support/fixtures'

const isoToday = (): string => new Date().toISOString().slice(0, 10)
const isoOffset = (days: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

test.describe('Engagement wizard — create flow', () => {
  test('creates an engagement via the 4-step wizard and lands on the detail page', async ({
    adminPage,
    uniqueId,
  }): Promise<void> => {
    const page = adminPage
    const nameEn = uniqueId('e2e-engagement')
    const nameAr = 'ارتباط اختبار'
    const startDate = isoToday()
    const endDate = isoOffset(1)

    await page.goto('/dossiers/engagements')

    // ENGM-01: Create button routes to /dossiers/engagements/create
    await page
      .getByRole('link', { name: /create engagement|إنشاء ارتباط/i })
      .first()
      .click()
    await expect(page).toHaveURL(/\/dossiers\/engagements\/create$/)

    // ENGM-05: Stepper — 4 steps (Basic Info, Details, Participants, Review)
    const steps = page.getByRole('list', { name: /steps|الخطوات/i }).getByRole('listitem')
    await expect(steps).toHaveCount(4)

    // Step 1 — Basic Info
    await page.getByLabel(/name.*english|الاسم.*الإنجليزية/i).fill(nameEn)
    await page.getByLabel(/name.*arabic|الاسم.*العربية/i).fill(nameAr)
    await page.getByRole('button', { name: /^next$|التالي/i }).click()

    // Step 2 — Engagement Details
    await expect(
      page.getByRole('heading', { name: /engagement details|تفاصيل الارتباط/i }),
    ).toBeVisible()

    // Type select — bilateral_meeting
    await page.getByLabel(/engagement type|نوع الارتباط/i).click()
    await page.getByRole('option', { name: /bilateral meeting|اجتماع ثنائي/i }).click()

    // Category select — diplomatic
    await page.getByLabel(/^category$|الفئة/i).click()
    await page.getByRole('option', { name: /^diplomatic$|^دبلوماسي$/i }).click()

    // Dates
    await page.getByLabel(/start date|تاريخ البدء/i).fill(startDate)
    await page.getByLabel(/end date|تاريخ الانتهاء/i).fill(endDate)

    await page.getByRole('button', { name: /^next$|التالي/i }).click()

    // Step 3 — Participants (ENGM-03, ENGM-04) — leave blank (optional per section hint)
    await expect(
      page.getByRole('heading', { name: /participants|المشاركون/i }),
    ).toBeVisible()
    await page.getByRole('button', { name: /^next$|التالي/i }).click()

    // Step 4 — Review + submit
    await expect(page.getByRole('heading', { name: /review|مراجعة/i })).toBeVisible()
    await page
      .getByRole('button', { name: /^(submit|create|finish)$|إرسال|إنشاء|إنهاء/i })
      .click()

    // Redirect to detail page
    await expect(page).toHaveURL(/\/dossiers\/[0-9a-f-]{36}$/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: new RegExp(nameEn, 'i') })).toBeVisible()
  })

  test('ENGM-02: blocks submission when end_date is before start_date', async ({
    adminPage,
    uniqueId,
  }): Promise<void> => {
    const page = adminPage
    const nameEn = uniqueId('e2e-engagement-bad-dates')
    const startDate = isoToday()
    const endDate = isoOffset(-1)

    await page.goto('/dossiers/engagements/create')

    // Basic Info
    await page.getByLabel(/name.*english|الاسم.*الإنجليزية/i).fill(nameEn)
    await page.getByLabel(/name.*arabic|الاسم.*العربية/i).fill('ارتباط تواريخ سيئة')
    await page.getByRole('button', { name: /^next$|التالي/i }).click()

    // Details — type + category + inverted dates
    await page.getByLabel(/engagement type|نوع الارتباط/i).click()
    await page.getByRole('option', { name: /bilateral meeting|اجتماع ثنائي/i }).click()
    await page.getByLabel(/^category$|الفئة/i).click()
    await page.getByRole('option', { name: /^diplomatic$|^دبلوماسي$/i }).click()
    await page.getByLabel(/start date|تاريخ البدء/i).fill(startDate)
    await page.getByLabel(/end date|تاريخ الانتهاء/i).fill(endDate)

    // Attempt to advance — should stay on the details step and surface the refinement error
    await page.getByRole('button', { name: /^next$|التالي/i }).click()

    // URL must remain on /create
    await expect(page).toHaveURL(/\/dossiers\/engagements\/create$/)
    // Error message — either the Zod end_after_start key output in EN or Arabic
    await expect(
      page.getByText(
        /end date must be on or after start date|يجب أن يكون تاريخ الانتهاء بعد تاريخ البدء أو مساوياً له/i,
      ),
    ).toBeVisible()
  })

  test('ENGM-04: multi-select participants chip UX — add + remove', async ({
    adminPage,
    uniqueId,
  }): Promise<void> => {
    const page = adminPage
    const nameEn = uniqueId('e2e-engagement-chips')

    await page.goto('/dossiers/engagements/create')

    // Basic Info
    await page.getByLabel(/name.*english|الاسم.*الإنجليزية/i).fill(nameEn)
    await page.getByLabel(/name.*arabic|الاسم.*العربية/i).fill('ارتباط شرائح')
    await page.getByRole('button', { name: /^next$|التالي/i }).click()

    // Details — fill required fields to allow progression
    await page.getByLabel(/engagement type|نوع الارتباط/i).click()
    await page.getByRole('option', { name: /bilateral meeting|اجتماع ثنائي/i }).click()
    await page.getByLabel(/^category$|الفئة/i).click()
    await page.getByRole('option', { name: /^diplomatic$|^دبلوماسي$/i }).click()
    await page.getByLabel(/start date|تاريخ البدء/i).fill(isoToday())
    await page.getByLabel(/end date|تاريخ الانتهاء/i).fill(isoOffset(1))
    await page.getByRole('button', { name: /^next$|التالي/i }).click()

    // Participants step — ENGM-03 three sections, ENGM-04 chip UX
    await expect(
      page.getByRole('heading', { name: /participants|المشاركون/i }),
    ).toBeVisible()

    const countryPicker = page
      .getByLabel(/participating countries|البلدان المشاركة/i)
      .first()
    await countryPicker.fill('Sa')

    // Wait for at least one result and click it — resilient to varying search results
    const firstResult = page
      .getByRole('option', { name: /./ })
      .or(page.getByRole('button', { name: /Saudi Arabia|United States|Italy|Spain/i }))
      .first()
    await firstResult.click()

    // A chip/badge should render beneath the combobox with a remove affordance
    const chip = page.getByRole('button', { name: /remove|إزالة|✕/i }).first()
    await expect(chip).toBeVisible()

    // Remove chip — it disappears
    await chip.click()
    await expect(chip).toBeHidden()
  })
})
