// @covers ELOF-01, ELOF-02, ELOF-03, ELOF-04
/**
 * Elected Official Wizard E2E (Phase 30 Plan 04, Task 3)
 *
 * Happy-path cases:
 *   1. English-only office_name submit — ELOF-02 + ELOF-03 + ELOF-04 coverage
 *   2. Arabic-only office_name submit  — D-08 + D-19 coverage (relaxed CHECK constraint)
 *   3. Created dossier appears in BOTH Persons and Elected Officials lists — ELOF-03
 */
import { test, expect } from './support/fixtures'

test.describe('Elected Official Wizard — happy path', () => {
  test('ELOF-01/02/04: creates elected official with English-only office_name', async ({
    adminPage,
    uniqueId,
  }): Promise<void> => {
    const page = adminPage
    const nameEn = uniqueId('e2e-elected-official-en')
    const nameAr = 'مسؤول منتخب'

    // ELOF-04: list page renders a Create/Add link routing to /create
    await page.goto('/dossiers/elected-officials')
    await expect(page).toHaveURL(/\/dossiers\/elected-officials/)

    // ELOF-01: Create button routes to /dossiers/elected-officials/create
    await page
      .getByRole('link', { name: /create|add|إنشاء|إضافة/i })
      .first()
      .click()
    await expect(page).toHaveURL(/\/dossiers\/elected-officials\/create$/)

    // Step 1 — Basic Info
    await page.getByPlaceholder(/Enter name in English|أدخل الاسم بالإنجليزية/i).fill(nameEn)
    await page.getByPlaceholder(/Enter name in Arabic|أدخل الاسم بالعربية/i).fill(nameAr)
    await page.getByRole('button', { name: /^next$|التالي/i }).click()

    // Step 2 — Person Details (all optional — skip)
    await page.getByRole('button', { name: /^next$|التالي/i }).click()

    // Step 3 — Office & Term (ELOF-02)
    // English-only office name
    await page
      .getByLabel(/office name.*english|الاسم الوظيفي.*إنجليزي/i)
      .fill('Senator')

    // Country picker — inside the "Office" region, first combobox
    const officeRegion = page.getByRole('region', { name: /^office$|^المنصب/i })
    const countryCombobox = officeRegion.getByRole('combobox').first()
    await countryCombobox.click()
    const countryDialog = page.getByRole('dialog')
    await countryDialog.getByRole('combobox').fill('sa')
    const firstCountryOption = countryDialog.getByRole('option').first()
    await expect(firstCountryOption).toBeVisible({ timeout: 10_000 })
    await firstCountryOption.click()

    // Term start (required)
    await page.getByLabel(/term start|بداية الفترة/i).fill('2026-01-01')
    // Term end (optional)
    await page.getByLabel(/term end|نهاية الفترة/i).fill('2030-01-01')

    await page.getByRole('button', { name: /^next$|التالي/i }).click()

    // Step 4 — Review + submit
    await expect(
      page.getByRole('heading', { name: /office.*term|المنصب|مراجعة/i }),
    ).toBeVisible()
    await page
      .getByRole('button', {
        name: /^(submit|create|finish|create dossier|create elected official)$|إرسال|إنشاء|إنهاء/i,
      })
      .click()

    // ELOF-03 partial: redirect to detail page after creation
    await expect(page).toHaveURL(/\/dossiers\/(elected-officials\/|persons\/)?[0-9a-f-]{36}$/, {
      timeout: 15_000,
    })
    await expect(page.getByRole('heading', { name: new RegExp(nameEn, 'i') })).toBeVisible()
  })

  test('D-08/D-19: creates elected official with Arabic-only office_name', async ({
    adminPage,
    uniqueId,
  }): Promise<void> => {
    const page = adminPage
    const nameEn = uniqueId('e2e-elected-official-ar')
    const nameAr = `تجربة المسؤول ${Date.now()}`

    await page.goto('/dossiers/elected-officials/create')

    // Step 1 — Basic Info
    await page.getByPlaceholder(/Enter name in English|أدخل الاسم بالإنجليزية/i).fill(nameEn)
    await page.getByPlaceholder(/Enter name in Arabic|أدخل الاسم بالعربية/i).fill(nameAr)
    await page.getByRole('button', { name: /^next$|التالي/i }).click()

    // Step 2 — Person Details (skip)
    await page.getByRole('button', { name: /^next$|التالي/i }).click()

    // Step 3 — Office & Term: leave office_name_en EMPTY, fill office_name_ar only (D-08)
    await page
      .getByLabel(/office name.*arabic|الاسم الوظيفي.*عربي/i)
      .fill('وزير الخارجية')

    // Country picker
    const officeRegionCC = page.getByRole('region', { name: /^office$|^المنصب/i })
    const countryCombobox = officeRegionCC.getByRole('combobox').first()
    await countryCombobox.click()
    const countryDialogX = page.getByRole('dialog')
    await countryDialogX.getByRole('combobox').fill('sa')
    const firstCountryOptX = countryDialogX.getByRole('option').first()
    await expect(firstCountryOptX).toBeVisible({ timeout: 10_000 })
    await firstCountryOptX.click()

    // Term start (required)
    await page.getByLabel(/term start|بداية الفترة/i).fill('2026-01-01')

    await page.getByRole('button', { name: /^next$|التالي/i }).click()

    // Step 4 — Submit
    await page
      .getByRole('button', {
        name: /^(submit|create|finish|create dossier|create elected official)$|إرسال|إنشاء|إنهاء/i,
      })
      .click()

    // D-19: Arabic-only constraint accepted — redirects to detail page
    await expect(page).toHaveURL(/\/dossiers\/(elected-officials\/|persons\/)?[0-9a-f-]{36}$/, {
      timeout: 15_000,
    })
  })

  test('ELOF-03: created elected official appears in both Persons and Elected Officials lists', async ({
    adminPage,
    uniqueId,
  }): Promise<void> => {
    const page = adminPage
    const nameEn = uniqueId('e2e-elected-official-both-lists')
    const nameAr = 'كلا القائمتين'

    // Create the elected official
    await page.goto('/dossiers/elected-officials/create')
    await page.getByPlaceholder(/Enter name in English|أدخل الاسم بالإنجليزية/i).fill(nameEn)
    await page.getByPlaceholder(/Enter name in Arabic|أدخل الاسم بالعربية/i).fill(nameAr)
    await page.getByRole('button', { name: /^next$|التالي/i }).click()
    await page.getByRole('button', { name: /^next$|التالي/i }).click() // skip person details

    await page.getByLabel(/office name.*english|الاسم الوظيفي.*إنجليزي/i).fill('Representative')

    const officeRegionCC = page.getByRole('region', { name: /^office$|^المنصب/i })
    const countryCombobox = officeRegionCC.getByRole('combobox').first()
    await countryCombobox.click()
    const countryDialogX = page.getByRole('dialog')
    await countryDialogX.getByRole('combobox').fill('sa')
    const firstCountryOptX = countryDialogX.getByRole('option').first()
    await expect(firstCountryOptX).toBeVisible({ timeout: 10_000 })
    await firstCountryOptX.click()

    await page.getByLabel(/term start|بداية الفترة/i).fill('2026-01-01')
    await page.getByRole('button', { name: /^next$|التالي/i }).click()
    await page
      .getByRole('button', {
        name: /^(submit|create|finish|create dossier|create elected official)$|إرسال|إنشاء|إنهاء/i,
      })
      .click()
    await page.waitForURL(/\/dossiers\/(elected-officials\/|persons\/)?[0-9a-f-]{36}$/, {
      timeout: 15_000,
    })

    // Visit Elected Officials list — name must appear
    await page.goto('/dossiers/elected-officials')
    await expect(page.getByText(nameEn)).toBeVisible({ timeout: 10_000 })

    // Visit Persons list — same record must appear (ELOF-03: person_subtype dual-view)
    await page.goto('/dossiers/persons')
    await expect(page.getByText(nameEn)).toBeVisible({ timeout: 10_000 })
  })
})
