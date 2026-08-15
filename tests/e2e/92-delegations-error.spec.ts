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
// EXPECTED RED until plan 92-03 lands (delegations.tsx has no isError branch today).
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

  test('unblocked load renders without the error alert', async ({ page }) => {
    // The happy half of AUTH-04 criterion 4 ("renders real delegations when they are not
    // rejected"), which otherwise has no oracle anywhere. No CDP blocking here.
    //
    // KNOWN FALSE GREEN UNTIL 92-03 LANDS — measured 2026-08-15, do not read a pass here as
    // evidence of a working load. The live app currently receives HTTP 401 from
    // `/functions/v1/my-delegations` (8 requests observed, all 401 — same result as
    // scripts/probe-edge-auth.sh) and renders: 0 elements with role="alert", the empty-state
    // heading, and a granted stat of "0". Every assertion below is satisfied by that failure,
    // because today the failure and the empty state are DOM-indistinguishable — which is
    // precisely the defect AUTH-04 exists to kill. Once 92-03 adds the isError branch this
    // test becomes a real oracle: the 401 will then render role="alert" + "—" and this test
    // will correctly go RED until the AUTH-02 fix is migrated and redeployed.
    await signInInline(page)
    await page.goto('/delegations')

    await expect(page.getByRole('alert')).toHaveCount(0, { timeout: RETRY_BACKOFF_TIMEOUT })

    // Data-dependent on staging: either real delegation cards or the legitimate empty state.
    // Both are honest non-error renders; the error state is neither.
    const panel = page.getByRole('tabpanel').first()
    const emptyState = panel.getByRole('heading', {
      name: /you haven['’]t granted any delegations/i,
    })
    const delegationRows = panel.locator('[data-slot="card"]').first()
    await expect(emptyState.or(delegationRows)).toBeVisible({ timeout: RETRY_BACKOFF_TIMEOUT })

    // And the stat reads a real integer (0 for the legitimate empty state, N otherwise) —
    // never the em-dash that only the error state shows.
    await expect(statValue(page, /permissions i granted/i)).toHaveText(/^\d+$/, {
      timeout: RETRY_BACKOFF_TIMEOUT,
    })
  })
})
