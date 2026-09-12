// @covers TRUST-01
//
// Phase 93 plan 93-07 — discriminating forced-error oracle for the /dossiers counts query.
//
// WHAT THIS PROVES (D-21). Deleting the two catch-and-return swallows in
// `domains/dossiers/hooks/useDossier.ts` is not sufficient on its own. The moment the counts
// query rejects, `DossierListPage` rendered seven confident zero-cards from
// `typeStatsMap?.[type] ?? { count: 0, … }` — the identical lie, one layer up. This spec forces
// exactly that rejection and asserts the page renders UNKNOWN (an em dash labelled
// `common:errors.countUnavailable`) plus a region-level error state, never a fabricated 0.
//
// AUTHENTICATION: inline, from TEST_USER_EMAIL / TEST_USER_PASSWORD, and run with --no-deps.
// The Playwright `setup` project throws without six E2E_* keys that .env.test does not carry
// (E2ECRED-01, filed against Phase 101), so no storage-state fixture is usable here (D-20).
//
// THE DISCRIMINATOR — DERIVED at authoring time, not assumed. The plan's authoring hint supposed
// the counts query was a supabase-js `head:true` count against the same `/rest/v1/dossiers`
// resource the list also queries, and therefore that CDP `Network.setBlockedURLs` (URL-only
// matching) would be too blunt. That hypothesis is wrong in a way that makes this easier: the two
// queries do not share a transport at all.
//
//   counts  services/dossier-api.ts:686 `getDossierCountsByType()`
//           supabase.from('dossiers').select('type, status').not('status', 'eq', 'deleted')
//           -> GET <supabase>/rest/v1/dossiers?select=type%2Cstatus&status=not.eq.deleted
//   list    services/dossier-api.ts:567 `listDossiers()` (via useDossiers)
//           -> GET <supabase>/functions/v1/dossiers-list?<filters>
//
// PostgREST table read vs. edge function: different path prefixes entirely. So a `page.route()`
// predicate pinned to the `/rest/v1/dossiers` path AND the counts query's distinguishing
// `select=type,status` aborts the counts request and structurally cannot touch the list request.
// Assertion 3 below is the self-check for that claim: a block that also killed the list query
// would fail it.
import { test, expect, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

// TIMING. `getDossierCountsByType` throws `DossierAPIError` with `status: 500`, so
// query-client.ts's 4xx short-circuit does NOT fire and TanStack Query runs its full ladder:
// 4 attempts at 1s + 2s + 4s backoff, so `isError` lands at ~7s — past Playwright's default 5s
// expect timeout. This budget is retry backoff, not flakiness; a CORRECT implementation fails the
// default timeout.
const RETRY_BACKOFF_TIMEOUT = 15_000

// The type-overview grid renders one figure per entry of the DISPLAY set.
//
// RULING-P97-19: this was hardcoded `7` and went RED when Phase 97 widened the display set to 8
// (`DOSSIER_CARD_TYPES = [...DOSSIER_TYPES, 'elected_official']`). It is DERIVED rather than
// re-hardcoded to 8 on purpose — re-hardcoding would plant a fresh copy of the parallel-truth
// class in the phase that removed six of them, and it would go red again at the ninth type.
// Importing the canonical constant means this count cannot drift from the grid it measures.
import { DOSSIER_CARD_TYPES } from '../../frontend/src/lib/dossier-type-guards'

const DOSSIER_TYPE_COUNT = DOSSIER_CARD_TYPES.length

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

test.describe('TRUST-01 dossier counts failure renders unknown, not zero', () => {
  test('blocked counts query renders em dash + inline error while the list still renders', async ({
    page,
  }) => {
    await signInInline(page)

    let countsRequestsAborted = 0
    await page.route(
      (url) =>
        url.pathname.endsWith('/rest/v1/dossiers') && url.searchParams.get('select') === 'type,status',
      async (route) => {
        countsRequestsAborted += 1
        await route.abort('failed')
      },
    )

    await page.goto('/dossiers')

    // 1. The counts chrome reads the em dash. Every assertion is on the DOM — never on a response
    //    status, because an RLS denial presents as an empty 200 and that is the defect class.
    const unknownCounts = page.getByTestId('dossier-count-unavailable')
    await expect(unknownCounts.first()).toBeVisible({ timeout: RETRY_BACKOFF_TIMEOUT })
    await expect(unknownCounts).toHaveCount(DOSSIER_TYPE_COUNT)
    await expect(unknownCounts.first()).toHaveText('—')
    // The seven zero-cards ARE the defect: on a rejection none of them may render at all, so
    // there is no digit 0 on screen fabricated from a failed request.
    await expect(page.locator('.dossier-type-stat-card')).toHaveCount(0)

    // 2. The owning region carries the shared inline error state (UI-SPEC variant B).
    await expect(page.getByTestId('query-error-inline')).toBeVisible()

    // 3. SELF-CHECK: the list is a different query over a different transport and must be
    //    untouched. If the block had been too blunt this conjunct fails and the spec is red.
    await expect(page.getByText(/showing \d+ to \d+ of \d+/i)).toBeVisible({
      timeout: RETRY_BACKOFF_TIMEOUT,
    })
    await expect(
      page.getByRole('alert').filter({ hasText: /error loading dossiers/i }),
    ).toHaveCount(0)

    expect(countsRequestsAborted).toBeGreaterThan(0)
  })
})
