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
import { createClient } from '@supabase/supabase-js'

const SIGNATORY_QUERY = process.env.E2E_MOU_QUERY ?? 'united'

// TEARDOWN RECORD (DATA-01, 102-07 / D-07). The create test titles its MoU from an epoch
// assigned ONLY inside that test; the afterAll deletes exactly that title. The assignment lives
// inside the creating test — NOT at module scope — because fullyParallel can run this file's AR
// dialog test in its own worker, and workers spawned in the same millisecond each evaluate this
// module and draw the SAME Date.now() (the 2026-09-12T01:01Z run recorded the mou-create and
// user-management workers sharing one epoch). A worker that never ran the create test leaves this
// null and its afterAll deletes nothing — a module-scope epoch here could delete the create
// test's in-flight MoU while that test is still asserting.
let uniqueTitle: string | null = null

// Type "united" (or E2E_MOU_QUERY) into the picker at `pickerName` and click the
// result at `resultIndex`. Returns the selected dossier's display name so the
// caller can assert it renders in the list row's parties cell.
async function pickSignatory(page: Page, pickerName: RegExp, resultIndex: number): Promise<string> {
  await page.getByRole('button', { name: pickerName }).click()
  const picker = page.getByRole('dialog').last()
  await picker.getByPlaceholder(/^search dossiers\.\.\.$/i).fill(SIGNATORY_QUERY)

  const option = picker.getByRole('option').nth(resultIndex)
  await expect(option).toBeVisible()
  const name = (await option.innerText()).split('\n')[0].trim()
  await option.click()
  return name
}

test.describe('MoU create (FEAT-01)', () => {
  // TEARDOWN (DATA-01 clause 2). Deletes the MoU this run created, through a service-role client
  // built from SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (.env.test, loaded by
  // frontend/playwright.config.ts). A missing key THROWS: the teardown is never silently skipped.
  // The notification-queue rows the create enqueued go first, then the MoU (its other children
  test.afterAll(async () => {
    const title = uniqueTitle
    if (title === null) {
      // This worker never ran the create test (fullyParallel gives every worker its own module
      // instance); it created nothing, so there is nothing of ITS OWN to delete.
      return
    }
    const url = process.env.SUPABASE_URL ?? ''
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
    if (url === '' || serviceRoleKey === '') {
      throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing from .env.test')
    }
    const admin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data, error } = await admin.from('mous').select('id').eq('title', title)
    if (error !== null) {
      throw new Error(`mou-create teardown: MoU lookup failed: ${error.message}`)
    }
    const ids = ((data ?? []) as { id: string }[]).map((row) => row.id)
    if (ids.length === 0) {
      return
    }
    const queue = await admin
      .from('mou_notification_queue')
      .delete({ count: 'exact' })
      .in('mou_id', ids)
    if (queue.error !== null) {
      throw new Error(`mou-create teardown: queue delete failed: ${queue.error.message}`)
    }
    const mous = await admin.from('mous').delete({ count: 'exact' }).in('id', ids)
    if (mous.error !== null) {
      throw new Error(`mou-create teardown: MoU delete failed: ${mous.error.message}`)
    }
    // The staging trigger audit_mous (AFTER INSERT/UPDATE/DELETE on mous, running
    // public.audit_trigger_function) writes a public.audit_log row (entity_type='mous',
    // entity_id=<mou id>) when the MoU is created AND ANOTHER when the delete above runs, so
    // this MUST come after the mous delete — ordering it first would leave the DELETE-trigger
    // row behind. audit_log is a different table from user-management's audit_logs and has no
    // FK/cascade to mous, so nothing else removes either row.
    const audit = await admin
      .from('audit_log')
      .delete({ count: 'exact' })
      .eq('entity_type', 'mous')
      .in('entity_id', ids)
    if (audit.error !== null) {
      throw new Error(`mou-create teardown: audit_log delete failed: ${audit.error.message}`)
    }
    console.warn(
      `[mou-create teardown] title=${title} ` +
        `queue_deleted=${queue.count} mous_deleted=${mous.count} ` +
        `audit_log_deleted=${audit.count}`,
    )
  })

  test('creates a MoU and shows it in the list with party names', async ({ page }) => {
    await page.goto('/mous')

    await page.getByRole('button', { name: /add mou/i }).click()

    uniqueTitle = `E2E MoU ${Date.now()}`
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
    await page.getByRole('button', { name: /create an mou/i }).click()
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
