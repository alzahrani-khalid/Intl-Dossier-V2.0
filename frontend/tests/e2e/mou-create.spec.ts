/**
 * E2E: MoU create (FEAT-01)
 *
 * Flow: /mous → Add MoU → fill bilingual titles → pick two different signatory
 * dossiers → submit → assert success toast + a list row with the unique title and
 * NON-EMPTY party names (Pitfall 2: mous_frontend renders party names from the
 * `parties` jsonb, so blank cells mean the create dropped `parties`).
 *
 * AR pass: /mous?lng=ar opens the dialog and asserts the Arabic-title input is
 * dir="rtl" and a localized mous.form.* label renders (no raw-key leak).
 *
 * PRECONDITION: a running app (dev server or E2E_BASE_URL) pointed at staging,
 * authenticated via .env.test credentials (global-setup persists storageState).
 * The signatory search must return >= 2 dossiers — set E2E_MOU_QUERY to a term
 * present in the target dataset (default: "united"). Pitfall 1: if the test
 * user's profile has no organization, the `mous` fn returns 400 and this spec
 * FAILS with the server message surfaced (no retry, no mask).
 */

import { test, expect, type Page } from '@playwright/test'

const SIGNATORY_QUERY = process.env.E2E_MOU_QUERY ?? 'united'

// Type "united" (or E2E_MOU_QUERY) into the picker at `pickerName` and click the
// result at `resultIndex`. Returns the selected dossier's display name so the
// caller can assert it renders in the list row's parties cell.
async function pickSignatory(page: Page, pickerName: RegExp, resultIndex: number): Promise<string> {
  await page.getByRole('combobox', { name: pickerName }).click()
  await page.getByPlaceholder(/search dossiers/i).fill(SIGNATORY_QUERY)

  const option = page.getByRole('option').nth(resultIndex)
  await expect(option).toBeVisible()
  const name = (await option.innerText()).split('\n')[0].trim()
  await option.click()
  return name
}

test.describe('MoU create (FEAT-01)', () => {
  test('creates a MoU and shows it in the list with party names', async ({ page }) => {
    await page.goto('/mous')

    await page.getByRole('button', { name: /add mou/i }).click()

    const uniqueTitle = `E2E MoU ${Date.now()}`
    await page.getByLabel(/title \(english\)/i).fill(uniqueTitle)
    await page.getByLabel(/title \(arabic\)/i).fill('مذكرة تفاهم اختبارية')

    // Two DIFFERENT signatories (same query, distinct result rows).
    const party1 = await pickSignatory(page, /first signatory/i, 0)
    const party2 = await pickSignatory(page, /second signatory/i, 1)
    expect(party1).not.toBe(party2)

    // Capture the create response so a 400 (Pitfall 1) surfaces its body.
    const createResponse = page.waitForResponse(
      (r) => r.url().includes('/functions/v1/mous') && r.request().method() === 'POST',
    )
    await page.getByRole('button', { name: /create mou/i }).click()
    const response = await createResponse
    if (response.status() >= 400) {
      const body = await response.text()
      expect(
        response.status(),
        `MoU create failed (${response.status()}) — Pitfall 1 profile org? Body: ${body}`,
      ).toBeLessThan(400)
    }

    // Success toast + new row with the unique title.
    await expect(page.getByText('MoU created')).toBeVisible()
    const row = page.getByRole('row').filter({ hasText: uniqueTitle })
    await expect(row).toBeVisible()

    // Parties cell must be non-empty (Pitfall 2 guard): both selected dossier
    // names render in the row.
    await expect(row).toContainText(party1)
    await expect(row).toContainText(party2)
  })

  test('renders the dialog in Arabic/RTL via ?lng=ar', async ({ page }) => {
    await page.goto('/mous?lng=ar')

    await page.getByRole('button', { name: 'إضافة مذكرة تفاهم' }).click()

    // Localized label renders (no raw mous.form.* key leak).
    await expect(page.getByText('إنشاء مذكرة تفاهم')).toBeVisible()

    // Arabic-title input is explicitly dir="rtl".
    const titleAr = page.getByLabel('العنوان (بالعربية)')
    await expect(titleAr).toHaveAttribute('dir', 'rtl')
  })
})
