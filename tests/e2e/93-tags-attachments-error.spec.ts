// @covers TRUST-02
//
// Phase 93 plan 93-10 — forced-error oracles for criterion 2's last two surfaces.
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
// THE TWO SURFACES DIFFER IN WHICH DIRECTION THEY LIED (D-25):
//   Tag Analytics rendered an ERROR OVER A SUCCESS — `useTagAnalytics` was a stub resolving a
//   shape the component could not read, so `!stats` painted "Failed to load tags" for a query
//   that never failed (indeed, never ran). 93-10 repoints it at tag-hierarchy/analytics and keys
//   the error branch on `isError`, so the copy below can only appear on a real rejection.
//   Position attachments rendered a SUCCESS OVER AN ERROR — `data: x = []` defaulted a rejected
//   query to the empty list, so a failed load claimed "No attachments yet".
// Both tests therefore assert the SAME shared inline state and the ABSENCE of the copy each
// surface used to substitute for it.
import { test, expect, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'
import { getSupabaseAdmin } from './support/helpers/supabase-admin'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

// TIMING (inherited from 92-delegations-error.spec.ts). A CDP-blocked request surfaces as
// FunctionsFetchError / a plain Error with NO numeric `status`, so query-client.ts's 4xx
// short-circuit never fires and TanStack Query runs its retry ladder with backoff. `isError`
// therefore arrives well past Playwright's default 5s expect timeout. This budget is retry
// backoff, not flakiness — a CORRECT implementation fails the default timeout.
const RETRY_BACKOFF_TIMEOUT = 15_000

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
 * Install a CDP URL block on the page's own session. Must precede the navigation it affects.
 *
 * EVERY pattern here is anchored on `/functions/v1/`, and that is load-bearing rather than
 * tidiness. Under `pnpm dev` Vite serves unbundled ES modules, so a bare substring pattern also
 * matches SOURCE FILE urls: `*tag-hierarchy*` blocked
 * `http://localhost:5173/src/types/tag-hierarchy.types.ts`, tore a hole in the module graph, and
 * took the whole /tags route down into the router error boundary — a page-level error that looks
 * exactly like the surface failing, for entirely the wrong reason. Anchoring on the edge-function
 * path cannot collide with a source path.
 */
const blockUrls = async (page: Page, urls: string[]): Promise<void> => {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.setBlockedURLs', { urls })
}

test.describe('TRUST-02 tags analytics and position attachments render failure as failure', () => {
  test('blocked tag-hierarchy renders the shared inline error in the analytics panel', async ({
    page,
  }) => {
    await signInInline(page)
    await blockUrls(page, ['*/functions/v1/tag-hierarchy*'])

    await page.goto('/tags')
    await page.getByRole('tab', { name: /tag analytics/i }).click()

    // Radix Tabs unmounts inactive content (no forceMount), so the active tabpanel IS the
    // analytics region — scoping here proves the error rendered in the analytics card and not
    // in the hierarchy manager, which renders its own bespoke copy on the sibling tab.
    const analyticsPanel = page.getByRole('tabpanel')

    // Every assertion below is on the DOM. None reads a response status.
    const inlineError = analyticsPanel.getByTestId('query-error-inline')
    await expect(inlineError).toBeVisible({ timeout: RETRY_BACKOFF_TIMEOUT })
    await expect(inlineError.getByRole('button', { name: /try again/i })).toBeVisible({
      timeout: RETRY_BACKOFF_TIMEOUT,
    })

    // The pre-93-10 bespoke copy must be gone from this panel. It was the surface's ONLY error
    // render and it fired on `!stats` — i.e. on a SUCCESS — so its absence here is what proves
    // the inverse lie was dismantled rather than merely relabelled.
    await expect(analyticsPanel.getByText(/failed to load tags/i)).toHaveCount(0, {
      timeout: RETRY_BACKOFF_TIMEOUT,
    })

    // Copy rule (D-08): the shared state renders i18n only. No transport/internal string may
    // reach the DOM on any surface of this page.
    await expect(
      page.getByText(/FunctionsFetchError|FunctionsHttpError|net::ERR_|Failed to fetch/),
    ).toHaveCount(0, { timeout: RETRY_BACKOFF_TIMEOUT })
  })

  test('blocked attachments renders the shared inline error, never "No attachments yet"', async ({
    page,
  }) => {
    // A real position id, chosen at runtime rather than pinned: `positions_authenticated_read`
    // is USING (true), so any signed-in user can read whichever row this returns.
    const { data: position, error } = await getSupabaseAdmin()
      .from('positions')
      .select('id, title_en')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error !== null) {
      throw new Error(`fixture query failed: ${error.message}`)
    }
    if (position === null) {
      throw new Error('no positions rows — this oracle needs one real position to open')
    }

    await signInInline(page)

    // SCOPED so the position detail fetch itself survives: that request is
    // `/positions-get?position_id=<id>` (positions.repository.ts:68) and carries no
    // `/attachments` segment, while the uploader's is `positions/<id>/attachments`
    // (usePositionAttachments.ts). The title assertion below is what PROVES the
    // discrimination — a pattern that over-matched would take the title down with it.
    await blockUrls(page, ['*/functions/v1/positions/*/attachments*'])

    await page.goto(`/positions/${position.id}`)

    // Discriminator: the position itself loaded, so only the attachments query was blocked.
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(position.title_en, {
      timeout: RETRY_BACKOFF_TIMEOUT,
    })

    const inlineError = page.getByTestId('query-error-inline')
    await expect(inlineError).toHaveCount(1, { timeout: RETRY_BACKOFF_TIMEOUT })
    await expect(inlineError).toBeVisible({ timeout: RETRY_BACKOFF_TIMEOUT })
    await expect(inlineError.getByRole('button', { name: /try again/i })).toBeVisible({
      timeout: RETRY_BACKOFF_TIMEOUT,
    })

    // The empty copy must NOT render. A rejected list is UNKNOWN, not empty — asserting "no
    // attachments" for a request that never returned is the confident lie this plan removes.
    await expect(page.getByText(/no attachments yet/i)).toHaveCount(0, {
      timeout: RETRY_BACKOFF_TIMEOUT,
    })

    await expect(
      page.getByText(/FunctionsFetchError|FunctionsHttpError|net::ERR_|Failed to fetch/),
    ).toHaveCount(0, { timeout: RETRY_BACKOFF_TIMEOUT })
  })
})
