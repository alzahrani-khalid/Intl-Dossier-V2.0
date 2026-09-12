// @covers TRUST-04 (criterion 5)
//
// Phase 93 — forced-error oracle for /tasks/queue, criterion 5's named exemplar.
//
// The criterion's own sentence is "/tasks/queue no longer prints the raw supabase-js message". A
// grep alone cannot close that: it proves the operand is gone from the source, not that the
// RENDERED state is the shared error state carrying i18n copy. So this asserts both halves in the
// DOM — the state is present, and the visible text carries no internal string.
//
// WHY THE FAILURE IS CDP-FORCED RATHER THAN NATURAL. `assignments-queue` is NOT DEPLOYED
// (DEAD-02, filed against Phase 95), so a natural visit to /tasks/queue errors today for that
// reason and will STOP erroring the moment Phase 95 deploys the function. Asserting the natural
// state would therefore encode a defect as an expectation and go red on the fix. Blocking the
// request at the network layer keeps this spec deterministic before AND after that deploy, which
// is why the natural state is deliberately not asserted here.
//
// The forced-error protocol is the project's documented one: block via CDP
// `Network.setBlockedURLs`, then assert the FAILURE STATE IN THE DOM. Never infer failure from a
// response status — an auth/RLS denial can present as an EMPTY 200, and mistaking that empty
// state for the error state is the defect class this milestone exists to kill.
//
// AUTHENTICATION: inline, from TEST_USER_EMAIL / TEST_USER_PASSWORD, and run with --no-deps. The
// Playwright `setup` project throws without six E2E_* keys that .env.test does not carry
// (E2ECRED-01, filed against Phase 101), so no storage-state fixture is usable here.
import { test, expect, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

// TIMING. A CDP-blocked invoke surfaces as a FunctionsFetchError with NO numeric `status`, so
// query-client.ts's 4xx short-circuit never fires and TanStack Query runs its full retry ladder:
// 4 attempts at 1s + 2s + 4s backoff. `isError` therefore arrives at ~7s, past Playwright's
// default 5s expect timeout. This budget is retry backoff, not flakiness — a CORRECT
// implementation fails the default timeout.
const RETRY_BACKOFF_TIMEOUT = 15_000

/**
 * The copy rule (93-UI-SPEC §Verification Notes, D-08): no rendered error text may carry a
 * Postgres/PostgREST code, a permission string, the vendor name, or a supabase-js error class.
 */
const INTERNAL_STRING =
  /(42501|42703|42P01|permission denied|supabase|FunctionsHttpError|FunctionsFetchError)/i

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

test.describe('criterion 5 — /tasks/queue renders the shared error state, not the raw message', () => {
  test('blocked assignments-queue renders query-error-state with no internal string', async ({
    page,
  }) => {
    await signInInline(page)

    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Network.enable')
    await cdp.send('Network.setBlockedURLs', { urls: ['*assignments-queue*'] })

    await page.goto('/tasks/queue')

    // Every assertion below is on the DOM. None reads a response status.
    const errorState = page.getByTestId('query-error-state')
    await expect(errorState).toBeVisible({ timeout: RETRY_BACKOFF_TIMEOUT })

    // A retry affordance must live inside the error region, not floating elsewhere.
    await expect(errorState.getByRole('button')).toBeVisible({ timeout: RETRY_BACKOFF_TIMEOUT })

    // The copy rule, asserted over the whole rendered page — not just the error region — because
    // a leak anywhere on the surface is the same defect.
    const bodyText = (await page.locator('body').innerText()) ?? ''
    expect(bodyText).not.toMatch(INTERNAL_STRING)
  })
})
