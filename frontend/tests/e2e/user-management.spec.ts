/**
 * E2E: User Management — the full D-10 loop (FEAT-02 + FEAT-03).
 *
 * Proves, live and end-to-end, as the pre-authenticated admin:
 *   1. FEAT-02  create a user (create-user fn) → it appears on the list under the
 *      DEFAULT "all" filter (created users are is_active:false — 86-RESEARCH Pitfall 7).
 *   2. FEAT-03  open /users/:id → read the profile → change role (immediate) →
 *      attempt an admin grant and confirm the dual-approval response is SURFACED
 *      (not masked) and NOT applied → deactivate → reactivate.
 *   3. T-86-12  IDOR smoke: an anon supabase-js client with no session cannot read
 *      an arbitrary public.users row (RLS denial = empty 200, not an error).
 *   4. AR pass: the create and detail pages render Arabic strings under dir="rtl".
 *
 * PRECONDITION (running app): this spec drives a live app. Run against a dev
 * server (`pnpm --dir frontend dev`, baseURL http://localhost:5173) or a deployed
 * env via `E2E_BASE_URL`. The default Playwright project is pre-authenticated by
 * global-setup (TEST_USER_EMAIL/TEST_USER_PASSWORD from .env.test), and the admin
 * gate on /users requires that account to hold an admin role. The IDOR block
 * additionally needs VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in the env.
 *
 * A non-admin-JWT variant of the IDOR check (research T-86-12) is a documented
 * follow-up: it requires a seeded non-admin fixture account, which is not part of
 * the current .env.test fixtures.
 */

import { test, expect } from '@playwright/test'

test.describe('User Management — D-10 loop', () => {
  test('create → list → detail → role/status, plus IDOR smoke and AR pass', async ({ page }) => {
    const epoch = Date.now()
    const email = `e2e-${epoch}@example.test`
    const username = `e2e_${epoch}`
    const fullName = 'E2E Test User'

    // ---- 1. FEAT-02: create a user -----------------------------------------
    await page.goto('/users')
    await page.getByRole('link', { name: 'Create User' }).click()
    await page.waitForURL(/\/users\/create$/)

    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Username').fill(username)
    await page.getByLabel('Full Name').fill(fullName)
    // Role picker (Radix Select) — pick Editor.
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Editor' }).click()
    await page.getByLabel('Clearance level').fill('2')

    await page.getByRole('button', { name: 'Create user' }).click()

    // On success the page navigates back to the list.
    await page.waitForURL(/\/users\/?$/)

    // Created users are is_active:false; the DEFAULT filter is "all", so the row
    // is visible. Search by the unique email (row-1-by-created_at is unreliable —
    // assumption A5) to make the assertion deterministic.
    await page.getByPlaceholder(/search users/i).fill(email)
    await expect(page.getByText(email).first()).toBeVisible()

    // ---- 2. FEAT-03: open the detail page ----------------------------------
    await page.getByText(email).first().click()
    await page.waitForURL(/\/users\/[0-9a-fA-F-]{36}$/)
    const detailUrl = page.url()
    const createdId = detailUrl.split('/users/')[1]

    // Profile renders.
    await expect(page.getByText(email).first()).toBeVisible()
    await expect(page.getByText(username).first()).toBeVisible()

    // Change role editor → viewer (immediate response).
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Viewer' }).click()
    await page.getByRole('button', { name: 'Assign Role' }).click()
    await expect(page.getByText('Role assigned successfully')).toBeVisible()
    await expect(page.getByText('Viewer').first()).toBeVisible()

    // Attempt an admin grant → dual-approval response must be surfaced, not applied.
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Admin' }).click()
    await page.getByRole('button', { name: 'Assign Role' }).click()
    await expect(page.getByText('Admin role assignment requires dual approval')).toBeVisible()
    // Role was NOT applied — the overview badge still reads Viewer.
    await expect(page.getByText('Viewer').first()).toBeVisible()

    // Deactivate (with confirm) → status flips to Inactive.
    await page.getByRole('button', { name: 'Deactivate User' }).click()
    await page.getByRole('button', { name: 'Deactivate', exact: true }).click()
    await expect(page.getByText('Inactive')).toBeVisible()

    // Reactivate → status restored to Active.
    await page.getByRole('button', { name: 'Reactivate User' }).click()
    await expect(page.getByText('Active')).toBeVisible()

    // ---- 3. IDOR smoke (T-86-12) -------------------------------------------
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY
    if (supabaseUrl !== undefined && anonKey !== undefined) {
      const { createClient } = await import('@supabase/supabase-js')
      // No session → RLS must deny arbitrary reads of public.users.
      const anon = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      const { data, error } = await anon.from('users').select('id').eq('id', createdId)
      // House fact: RLS denial returns an empty 200, not an error.
      expect(error).toBeNull()
      expect(data ?? []).toHaveLength(0)
    } else {
      test.info().annotations.push({
        type: 'skipped-idor',
        description:
          'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — anon IDOR read not exercised.',
      })
    }

    // ---- 4. AR pass ---------------------------------------------------------
    // Create page in Arabic: RTL layout + localized submit label, no raw-key leak.
    await page.goto('/users/create?lng=ar')
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.getByRole('button', { name: 'إنشاء مستخدم' })).toBeVisible()
    await expect(page.getByText('user-management:')).toHaveCount(0)

    // Detail page in Arabic: RTL layout + a localized field label (Department = القسم).
    await page.goto(`/users/${createdId}?lng=ar`)
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.getByText('القسم')).toBeVisible()
  })
})
