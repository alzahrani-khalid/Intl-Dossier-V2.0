// @covers AUTH-04
//
// Phase 92 Wave 0 — forced-error oracle for /delegations.
//
// The project's documented forced-error protocol: block the request at the network layer via CDP
// `Network.setBlockedURLs`, then assert the FAILURE STATE IN THE DOM. Never infer failure from a
// network response — an auth/RLS denial can present as an EMPTY 200, and mistaking that empty
// state for the error state is the exact defect this milestone exists to kill.
//
// AUTHENTICATION: inline, from TEST_USER_EMAIL / TEST_USER_PASSWORD, and run with --no-deps. The
// Playwright `setup` project throws without six E2E_* keys that .env.test does not carry
// (E2ECRED-01, filed against Phase 101), so no storage-state fixture is usable here.
//
// STATUS: 92-03 landed the isError branch, so both tests below assert the error state. The second
// one was INVERTED by 93-02 and flips back in Phase 102 — its own comment carries the reason.
import { test, expect, type Locator, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

// TIMING (checker B-2). A CDP-blocked request surfaces as FunctionsFetchError / a plain Error with
// NO numeric `status`, so query-client.ts's 4xx short-circuit never fires and TanStack Query runs
// its full retry ladder: 4 attempts at 1s + 2s + 4s backoff. `isError` therefore arrives at ~7s,
// past Playwright's default 5s expect timeout. This budget is retry backoff, not flakiness — a
// CORRECT implementation fails the default timeout.
const RETRY_BACKOFF_TIMEOUT = 15_000

/** Matches the error heading 92-03 must render inside the alert region (i18n-backed). */
const ERROR_HEADING = /couldn['’]t load delegations/i

/** Sign in inline; never echo either credential value. */
const signInInline = async (page: Page): Promise<void> => {
  if (email === '' || password === '') {
    throw new Error('TEST_USER_EMAIL / TEST_USER_PASSWORD missing from .env.test')
  }
  const login = new LoginPage(page)
  await login.goto()
  await login.signIn(email, password)
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 })
}

/**
 * The value cell of a stat card, located by its own description text.
 * Grounded at DelegationManagementPage.tsx:123-137 (Card → CardContent → <p>{stats.granted}</p>)
 * and heroui-card.tsx (`data-slot="card"` / `data-slot="card-content"`). "Permissions I Granted"
 * is unique to the stat card — the tab trigger reads just "Granted".
 */
const statValue = (page: Page, label: RegExp): Locator =>
  page.locator('[data-slot="card"]').filter({ hasText: label }).locator('[data-slot="card-content"]')

test.describe('AUTH-04 delegations failure is rendered as failure', () => {
  test('blocked my-delegations renders the error alert, never an empty state', async ({ page }) => {
    await signInInline(page)

    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Network.enable')
    await cdp.send('Network.setBlockedURLs', { urls: ['*my-delegations*'] })

    await page.goto('/delegations')

    // Every assertion below is on the DOM. None reads a response status.
    const errorAlert = page.getByRole('alert').filter({ hasText: ERROR_HEADING })
    await expect(errorAlert).toBeVisible({ timeout: RETRY_BACKOFF_TIMEOUT })

    // A retry affordance must live inside the alert region, not floating elsewhere.
    await expect(errorAlert.getByRole('button', { name: /try again/i })).toBeVisible({
      timeout: RETRY_BACKOFF_TIMEOUT,
    })

    // The empty state must NOT be rendered — a failed load is not "no delegations".
    await expect(page.getByText(/you haven['’]t granted any delegations/i)).toHaveCount(0, {
      timeout: RETRY_BACKOFF_TIMEOUT,
    })

    // Stat cards must read the em-dash, not 0. A zero here would assert a fact the app does
    // not have: the count is unknown, not zero.
    await expect(statValue(page, /permissions i granted/i)).toHaveText('—', {
      timeout: RETRY_BACKOFF_TIMEOUT,
    })
    await expect(statValue(page, /permissions i received/i)).toHaveText('—', {
      timeout: RETRY_BACKOFF_TIMEOUT,
    })
  })

  // INVERTED 2026-08-15 by plan 93-02 (DELEG-01, closed as VISIBILITY ONLY). Read this before
  // "fixing" it back — the red it now guards is the INTENDED product state, not a regression.
  //
  // This test previously asserted `unblocked ⇒ no error alert`. That invariant was NEVER true.
  // `my-delegations` queries `public.delegations`, a relation that does not exist (42P01), and
  // the handler swallowed the PostgREST error into `200 {"granted":[],"received":[],"total":0}`.
  // The old green measured the LIE, not a working load: the failure and the empty state were
  // DOM-indistinguishable, which is the exact defect this milestone exists to kill. 93-02 makes
  // the handler return a real 500 with a bilingual body, so the natural visit now renders the
  // same honest error state the CDP-forced test above asserts. Both tests now assert the error
  // state and differ ONLY in how the failure is induced — CDP block above, the real 42P01 here.
  //
  // FLIP THIS BACK IN PHASE 102, where both halves land together:
  //   DELEG-02      — decide which relation `my-delegations` should read. `permission_delegations`
  //                   (14 cols) and `position_delegations` (8 cols) model different concepts and
  //                   neither carries the handler's `is_active` or `source` columns, so the choice
  //                   is a product call, not a rename.
  //   SEED-DELEG-01 — seed rows. Both candidate tables hold 0 today, so a repoint alone buys an
  //                   identical empty screen; the phase that seeds is the phase that decides.
  // When those land, restore the happy-path assertions: no alert, empty-state-or-rows visible,
  // and a real integer stat.
  test('natural visit renders the error state — the 42P01 is honest until Phase 102', async ({
    page,
  }) => {
    // No CDP blocking here: the failure is the real one the deployed function returns.
    await signInInline(page)
    await page.goto('/delegations')

    // The alert renders on the UNBLOCKED visit now that the function fails loudly.
    const errorAlert = page.getByRole('alert').filter({ hasText: ERROR_HEADING })
    await expect(errorAlert).toBeVisible({ timeout: RETRY_BACKOFF_TIMEOUT })

    // The empty state must NOT be rendered — the delegation set is unknown, not empty.
    const panel = page.getByRole('tabpanel').first()
    const emptyState = panel.getByRole('heading', {
      name: /you haven['’]t granted any delegations/i,
    })
    await expect(emptyState).toHaveCount(0, { timeout: RETRY_BACKOFF_TIMEOUT })

    // And the stat reads the em-dash, exactly as the CDP-forced test asserts above. A real
    // integer here would assert a fact the app does not have.
    await expect(statValue(page, /permissions i granted/i)).toHaveText('—', {
      timeout: RETRY_BACKOFF_TIMEOUT,
    })
  })
})
