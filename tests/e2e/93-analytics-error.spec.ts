// @covers TRUST-01
//
// Phase 93 Wave 2 — forced-error oracle for /analytics (TRUST-01 sites 1-3).
//
// 93-06 deleted the three catch-and-return-{ data: null } swallows in
// domains/analytics/repositories/analytics.repository.ts and repaired their consumer: the
// AnalyticsDashboardPage isError branch, which rendered `error?.message`, now renders the shared
// QueryErrorState. This spec is the RENDERING oracle for that pair — a grep proves the swallow is
// gone, only a browser proves a rejection reaches the user as an honest, leak-free error state.
//
// AUTHENTICATION: inline, from TEST_USER_EMAIL / TEST_USER_PASSWORD, and run with --no-deps
// (D-20). The Playwright `setup` project throws without six E2E_* keys that .env.test does not
// carry (E2ECRED-01, filed against Phase 101), so no storage-state fixture is usable here.
//
// WHY THE ERROR IS FORCED RATHER THAN OBSERVED NATURALLY: the express analytics endpoints do not
// exist yet — `GET /analytics-dashboard` returns 404 today — so a natural visit to /analytics also
// renders this error state. That is the INTENDED post-phase state, not a regression: Phase 96
// (DEAD-05) owns making the data real. An oracle keyed on the natural 404 would therefore go red
// the moment Phase 96 lands, for a correct change. Blocking the request at the network layer keeps
// this spec measuring the propagation path (repository → TanStack Query → page) rather than the
// absence of a backend.
import { test, expect, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

// TIMING. A CDP-blocked request surfaces as a plain Error with NO numeric `status`, so
// query-client.ts's 4xx short-circuit never fires and TanStack Query runs its full retry ladder:
// 4 attempts at 1s + 2s + 4s backoff. `isError` therefore arrives at ~7s, past Playwright's
// default 5s expect timeout. This budget is retry backoff, not flakiness — a CORRECT
// implementation fails the default timeout.
const RETRY_BACKOFF_TIMEOUT = 15_000

// Copy rule (93-UI-SPEC §Verification Notes, D-08/criterion 5): no internal string may reach the
// DOM. PostgREST/Postgres codes, the vendor name, a raw i18n key that leaked through, and
// stack-frame shapes are all disqualifying.
const INTERNAL_STRINGS = /(42501|42703|42P01|permission denied|supabase|networkError|stack)/i

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

test.describe('TRUST-01 analytics failure is rendered as failure', () => {
  test('blocked analytics fetch renders the shared error state, leak-free', async ({ page }) => {
    await signInInline(page)

    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Network.enable')
    await cdp.send('Network.setBlockedURLs', {
      urls: ['*analytics-dashboard*', '*organization-benchmarks*'],
    })

    await page.goto('/analytics')

    // Every assertion below is on the DOM. None reads a response status.
    const errorState = page.getByTestId('query-error-state')
    await expect(errorState).toBeVisible({ timeout: RETRY_BACKOFF_TIMEOUT })

    // The shared component announces itself as an alert, and the retry affordance lives INSIDE
    // that region — not floating elsewhere on the page.
    await expect(errorState).toHaveAttribute('role', 'alert')
    await expect(errorState.getByRole('button')).toBeVisible({ timeout: RETRY_BACKOFF_TIMEOUT })

    // The fabricated success path must be gone: no summary cards, no tabs, no charts rendered
    // from a swallowed failure. A zero here would assert a fact the app does not have.
    await expect(page.getByRole('tablist')).toHaveCount(0)

    // Copy rule: the rendered page leaks no internal string.
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toMatch(INTERNAL_STRINGS)
  })
})
