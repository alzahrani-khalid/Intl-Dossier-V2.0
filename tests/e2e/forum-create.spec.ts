// @covers FORUM-01, FORUM-02, FORUM-03
import { test, expect } from './support/fixtures'

test.describe('Forum wizard — create flow', () => {
  test('creates a forum via the 3-step wizard and lands on the detail page', async ({
    adminPage,
    uniqueId,
  }): Promise<void> => {
    const page = adminPage
    const nameEn = uniqueId('e2e-forum')
    const nameAr = 'منتدى اختبار'

    await page.goto('/dossiers/forums')

    // FORUM-01: Create button navigates to the wizard route
    await page.getByRole('link', { name: /create forum|إنشاء منتدى/i }).first().click()
    await expect(page).toHaveURL(/\/dossiers\/forums\/create$/)

    // Stepper should show 3 steps (Basic Info, Forum Details, Review)
    const steps = page.getByRole('list', { name: /steps|الخطوات/i }).getByRole('listitem')
    await expect(steps).toHaveCount(3)

    // Step 1: Basic Info (name EN + AR)
    await page.getByLabel(/name.*english|الاسم.*الإنجليزية/i).fill(nameEn)
    await page.getByLabel(/name.*arabic|الاسم.*العربية/i).fill(nameAr)
    await page.getByRole('button', { name: /^next$|التالي/i }).click()

    // FORUM-02: Step 2 (Forum Details) — organizing body is optional (D-10), leave blank
    await expect(
      page.getByRole('heading', { name: /forum details|تفاصيل المنتدى/i }),
    ).toBeVisible()
    await page.getByRole('button', { name: /^next$|التالي/i }).click()

    // FORUM-03: Step 3 (Review) — submit
    await expect(page.getByRole('heading', { name: /review|مراجعة/i })).toBeVisible()
    await page
      .getByRole('button', { name: /^(submit|create|finish)$|إرسال|إنشاء|إنهاء/i })
      .click()

    // Redirect to the new dossier detail page
    await expect(page).toHaveURL(/\/dossiers\/[0-9a-f-]{36}$/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: new RegExp(nameEn, 'i') })).toBeVisible()
  })
})
