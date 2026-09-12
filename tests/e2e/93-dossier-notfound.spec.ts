// @covers TRUST-03
//
// Phase 93 Wave 2 — the D-05 discriminator for dossier detail, made mechanical.
//
// 93-11 gave DossierShell (mounted by all seven typed dossier detail layouts) the branch it never
// had: a 404 rejection throws `notFound()` — the codebase's FIRST thrower into the root
// notFoundComponent at routes/__root.tsx:72 — and every other rejection renders the shared
// QueryErrorState. Before that edit BOTH conditions rendered the same titleless chrome, which is
// exactly the collapse criterion 3 names: "Check your connection and try again" shown for a record
// that simply is not there.
//
// A grep proves the throw exists. Only a browser proves the two states are actually DIFFERENT
// renders. So each test below asserts BOTH the expected state's presence AND the wrong state's
// absence — a build that collapses the two back into one component cannot pass either test.
//
// AUTHENTICATION: inline, from TEST_USER_EMAIL / TEST_USER_PASSWORD, and run with --no-deps (D-20).
// The Playwright `setup` project throws without six E2E_* keys that .env.test does not carry
// (E2ECRED-01, filed against Phase 101), so no storage-state fixture is usable here.
import { randomUUID } from 'node:crypto'
import { test, expect, type Locator, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''
const supabaseUrl = process.env.SUPABASE_URL ?? ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

// TIMING. Test 1's 404 arrives in ONE round-trip: lib/query-client.ts:29-40 short-circuits retries
// on a 4xx, so there is no retry ladder and no skeleton wall. Test 2's CDP-blocked request surfaces
// as a plain Error with NO numeric `status`, so that short-circuit never fires and TanStack Query
// runs its full ladder — 4 attempts at 1s + 2s + 4s backoff, so `isError` lands at ~7s, past
// Playwright's default 5s expect timeout. One shared budget covers both; for test 1 it is slack,
// for test 2 it is retry backoff rather than flakiness.
const RETRY_BACKOFF_TIMEOUT = 15_000

/**
 * The root 404 page's own marker: the oversized numeral at routes/__root.tsx:19. Exact-matched so
 * it cannot be satisfied by a "404" embedded in some other string elsewhere on the page.
 */
const notFoundNumeral = (page: Page): Locator => page.getByText('404', { exact: true })

const notFoundHeading = (page: Page): Locator =>
  page.getByRole('heading', { name: /page not found/i })

/**
 * The error state's description copy — both the shipped string (i18n `errors.queryFailed
 * .description`) and the historic "check your connection" phrasing criterion 3 quotes. Either one
 * appearing on an absent-record page is the exact defect this spec exists to catch.
 */
const ERROR_STATE_COPY = /(check your connection|the request failed)/i

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
 * One REAL country dossier id, read with the service-role key so the lookup is independent of the
 * test user's RLS grants. Test 2 must force a rejection on a record that genuinely EXISTS —
 * otherwise it would be measuring absence a second time and the discriminator would be vacuous.
 * Neither the URL nor the key is ever echoed.
 */
let realCountryDossierId = ''

test.beforeAll(async () => {
  if (supabaseUrl === '' || serviceRoleKey === '') {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing from .env.test')
  }
  const response = await fetch(
    `${supabaseUrl}/rest/v1/dossiers?select=id&type=eq.country&limit=1`,
    { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } },
  )
  if (!response.ok) {
    throw new Error(`country dossier lookup failed with status ${response.status}`)
  }
  const rows = (await response.json()) as Array<{ id: string }>
  if (rows.length === 0) {
    throw new Error(
      'no country dossier rows exist — test 2 needs a real id to force a rejection on',
    )
  }
  realCountryDossierId = rows[0].id
})

test.describe('TRUST-03 dossier detail tells absence from failure', () => {
  test('an absent dossier id renders the root 404 page, never the error state', async ({
    page,
  }) => {
    await signInInline(page)

    // Well-formed, and guaranteed to match no row. dossiers-get returns 404 NOT_FOUND for it
    // (supabase/functions/dossiers-get/index.ts:138-151).
    await page.goto(`/dossiers/countries/${randomUUID()}`)

    // Every assertion below is on the DOM. None reads a response status.
    await expect(notFoundNumeral(page)).toBeVisible({ timeout: RETRY_BACKOFF_TIMEOUT })
    await expect(notFoundHeading(page)).toBeVisible()

    // THE WRONG STATE MUST BE ABSENT. An absent record is not a failed request: no error state, no
    // "the request failed" copy, and no retry affordance offering to re-fetch a row that is simply
    // not there (D-05).
    await expect(page.getByTestId('query-error-state')).toHaveCount(0)
    await expect(page.getByText(ERROR_STATE_COPY)).toHaveCount(0)

    // And no skeleton survives into the resolved state — the 404 replaces the shell outright rather
    // than leaving titleless chrome with loading placeholders where the identity should be.
    await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0)
  })

  test('a forced rejection on a REAL dossier id renders the error state, never the 404 page', async ({
    page,
  }) => {
    await signInInline(page)

    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Network.enable')
    await cdp.send('Network.setBlockedURLs', { urls: ['*dossiers-get*'] })

    await page.goto(`/dossiers/countries/${realCountryDossierId}`)

    const errorState = page.getByTestId('query-error-state')
    await expect(errorState).toBeVisible({ timeout: RETRY_BACKOFF_TIMEOUT })

    // The shared component announces itself as an alert, and the retry affordance lives INSIDE that
    // region — a failed request IS retryable, which is precisely what not-found is not.
    await expect(errorState).toHaveAttribute('role', 'alert')
    await expect(errorState.getByRole('button')).toBeVisible()

    // THE WRONG STATE MUST BE ABSENT. This record exists; the request failed. Rendering "page not
    // found" here would tell the user the dossier is gone when it is not.
    await expect(notFoundNumeral(page)).toHaveCount(0)
    await expect(notFoundHeading(page)).toHaveCount(0)
  })
})
