// @covers PBI-02, PBI-03, PBI-05, PBI-06, PBI-07
/**
 * Phase 32 — Person-Native Basic Info E2E (Plan 32-04, Task 6)
 *
 * Exercises the 11 typed person identity fields end-to-end:
 *   1. Elected-official wizard happy path:
 *      - Step 1 PersonBasicInfoStep fills honorific / first+last EN+AR / nationality / DOB / gender
 *      - Submits through OfficeTermStep + ReviewStep
 *      - Asserts detail-page label and list-row nationality badge (PBI-05 + PBI-06 + PBI-07)
 *   2. Person (non-elected) wizard happy path:
 *      - Same identity fields minus the OfficeTermStep
 *      - Asserts persons-list row renders via formatPersonLabel (PBI-06)
 *
 * The spec piggybacks on the shared fixtures (`adminPage`, `uniqueId`) so rows
 * seeded with the `e2e-` prefix are purged by the per-test afterEach hook.
 */
import { test, expect } from './support/fixtures'

test.describe('Phase 32 person identity fields @phase32', () => {
  test('PBI-05 + PBI-06 + PBI-07: elected-official wizard end-to-end with identity fields', async ({
    adminPage,
    uniqueId,
  }): Promise<void> => {
    const page = adminPage
    const lastNameEn = uniqueId('phase32-eo')
    const firstNameEn = 'Test'
    const firstNameAr = 'تجربة'
    const lastNameAr = 'المرحلة32'
    const honorific = 'H.E.'

    await page.goto('/dossiers/elected-officials/create')
    await expect(page).toHaveURL(/\/dossiers\/elected-officials\/create$/)

    // ---- Step 1: PersonBasicInfoStep ----
    // PBI-02: bilingual identity fields present
    await expect(page.getByLabel(/honorific|اللقب/i)).toHaveCount(1)
    await expect(page.getByLabel(/first name.*english|الاسم الأول.*الإنجليزي/i)).toHaveCount(1)
    await expect(page.getByLabel(/last name.*english|الاسم الأخير.*الإنجليزي/i)).toHaveCount(1)
    await expect(page.getByLabel(/nationality|الجنسية/i)).toHaveCount(1)

    // Honorific (Radix Select)
    await page.getByLabel(/honorific|اللقب/i).click()
    await page.getByRole('option', { name: honorific }).click()

    // Name fields (EN + AR)
    await page.getByLabel(/first name.*english|الاسم الأول.*الإنجليزي/i).fill(firstNameEn)
    await page.getByLabel(/last name.*english|الاسم الأخير.*الإنجليزي/i).fill(lastNameEn)
    await page.getByLabel(/first name.*arabic|الاسم الأول.*العربي/i).fill(firstNameAr)
    await page.getByLabel(/last name.*arabic|الاسم الأخير.*العربي/i).fill(lastNameAr)

    // PBI-03: nationality (required). DossierPicker → dialog → search "sa" → first result.
    const nationalityTrigger = page.getByLabel(/nationality|الجنسية/i)
    await nationalityTrigger.click()
    const nationalityDialog = page.getByRole('dialog')
    await nationalityDialog.getByRole('combobox').fill('sa')
    const firstNationalityOpt = nationalityDialog.getByRole('option').first()
    await expect(firstNationalityOpt).toBeVisible({ timeout: 10_000 })
    await firstNationalityOpt.click()

    // Optional: DOB + gender
    await page.getByLabel(/date of birth|تاريخ الميلاد/i).fill('1970-01-01')
    await page.getByLabel(/^gender$|^الجنس$/i).click()
    await page.getByRole('option', { name: /^male$|^ذكر$/i }).click()

    await page.getByRole('button', { name: /^next$|التالي/i }).click()

    // ---- Step 2: PersonDetailsStep (all optional — skip) ----
    await page.getByRole('button', { name: /^next$|التالي/i }).click()

    // ---- Step 3: OfficeTermStep (elected-official only) ----
    await page.getByLabel(/office name.*english|الاسم الوظيفي.*إنجليزي/i).fill('Senator')
    const officeRegion = page.getByRole('region', { name: /^office$|^المنصب/i })
    const officeCountry = officeRegion.getByRole('combobox').first()
    await officeCountry.click()
    const officeDialog = page.getByRole('dialog')
    await officeDialog.getByRole('combobox').fill('sa')
    const firstOfficeCountry = officeDialog.getByRole('option').first()
    await expect(firstOfficeCountry).toBeVisible({ timeout: 10_000 })
    await firstOfficeCountry.click()
    await page.getByLabel(/term start|بداية الفترة/i).fill('2026-01-01')
    await page.getByRole('button', { name: /^next$|التالي/i }).click()

    // ---- Step 4: ReviewStep — PBI-07 Identity card ----
    await expect(page.getByText(/^identity$|^الهوية$/i).first()).toBeVisible()
    await expect(page.getByText(new RegExp(`${honorific.replace(/\./g, '\\.')}.*${firstNameEn}.*${lastNameEn}`, 'i'))).toBeVisible()

    // Submit
    await page
      .getByRole('button', {
        name: /^(submit|create|finish|create dossier|create elected official)$|إرسال|إنشاء|إنهاء/i,
      })
      .click()

    // PBI-05: redirect to detail page after creation
    await expect(page).toHaveURL(/\/dossiers\/(elected-officials\/|persons\/)?[0-9a-f-]{36}$/, {
      timeout: 15_000,
    })

    // Detail page shows the composed label "H.E. Test <lastNameEn>"
    const composedLabel = new RegExp(
      `${honorific.replace(/\./g, '\\.')}\\s+${firstNameEn}\\s+${lastNameEn}`,
      'i',
    )
    await expect(page.getByText(composedLabel).first()).toBeVisible({ timeout: 10_000 })

    // ---- PBI-06: elected-officials list row shows composed label + nationality badge ----
    await page.goto('/dossiers/elected-officials')
    const listRow = page.locator('tr, [role="row"]', { hasText: composedLabel }).first()
    await expect(listRow).toBeVisible({ timeout: 10_000 })
    // Nationality badge: flag emoji (🇸🇦) + ISO-2 "SA" inline
    await expect(listRow.getByText(/\bSA\b/)).toBeVisible()

    // Persons list (dual-view: elected officials also appear in /dossiers/persons)
    await page.goto('/dossiers/persons')
    const personsListRow = page.locator('tr, [role="row"]', { hasText: composedLabel }).first()
    await expect(personsListRow).toBeVisible({ timeout: 10_000 })
  })

  test('PBI-06: non-elected person wizard surfaces identity label + nationality badge in persons list', async ({
    adminPage,
    uniqueId,
  }): Promise<void> => {
    const page = adminPage
    const lastNameEn = uniqueId('phase32-person')
    const firstNameEn = 'Test'
    const firstNameAr = 'تجربة'
    const lastNameAr = 'شخص32'

    await page.goto('/dossiers/persons/create')
    await expect(page).toHaveURL(/\/dossiers\/persons\/create$/)

    // ---- Step 1: PersonBasicInfoStep ----
    await page.getByLabel(/honorific|اللقب/i).click()
    await page.getByRole('option', { name: 'Dr.' }).click()
    await page.getByLabel(/first name.*english|الاسم الأول.*الإنجليزي/i).fill(firstNameEn)
    await page.getByLabel(/last name.*english|الاسم الأخير.*الإنجليزي/i).fill(lastNameEn)
    await page.getByLabel(/first name.*arabic|الاسم الأول.*العربي/i).fill(firstNameAr)
    await page.getByLabel(/last name.*arabic|الاسم الأخير.*العربي/i).fill(lastNameAr)

    // Nationality (required)
    const nationalityTrigger = page.getByLabel(/nationality|الجنسية/i)
    await nationalityTrigger.click()
    const nationalityDialog = page.getByRole('dialog')
    await nationalityDialog.getByRole('combobox').fill('sa')
    const firstNationalityOpt = nationalityDialog.getByRole('option').first()
    await expect(firstNationalityOpt).toBeVisible({ timeout: 10_000 })
    await firstNationalityOpt.click()

    await page.getByRole('button', { name: /^next$|التالي/i }).click()

    // ---- Remaining steps: skip through person wizard (all optional after Identity) ----
    // The person wizard has PersonDetailsStep then ReviewStep; no OfficeTerm.
    // Click Next until we hit the submit button — guard against infinite loop.
    for (let i = 0; i < 4; i += 1) {
      const nextBtn = page.getByRole('button', { name: /^next$|التالي/i })
      if ((await nextBtn.count()) === 0) break
      await nextBtn.first().click()
      await page.waitForTimeout(250)
    }

    await page
      .getByRole('button', {
        name: /^(submit|create|finish|create dossier|create person)$|إرسال|إنشاء|إنهاء/i,
      })
      .click()

    await expect(page).toHaveURL(/\/dossiers\/(persons\/)?[0-9a-f-]{36}$/, { timeout: 15_000 })

    // PBI-06: persons list row renders "Dr. Test <lastNameEn>" + nationality badge "SA"
    const composedLabel = new RegExp(`Dr\\.\\s+${firstNameEn}\\s+${lastNameEn}`, 'i')
    await page.goto('/dossiers/persons')
    const row = page.locator('tr, [role="row"]', { hasText: composedLabel }).first()
    await expect(row).toBeVisible({ timeout: 10_000 })
    await expect(row.getByText(/\bSA\b/)).toBeVisible()
  })
})
