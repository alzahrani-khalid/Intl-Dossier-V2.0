// @covers DEAD-01
//
// Phase 95 — behavioural oracle for criterion 1: `/search` returns results for a typed query and
// for each of its own four suggestion chips.
//
// WHAT THIS KILLS. The deployed `search` function answers with
// `{data, count, limit, offset, query, took_ms, warnings, metadata}` — there is no `dossiers` key —
// while `useDossierFirstSearch.ts:109` runs `searchQuery.data.dossiers.forEach(...)` inside the
// `typeCounts` memo. Every query on this page, typed or chip-clicked, threw
// `Cannot read properties of undefined (reading 'forEach')`; the router's defaultErrorComponent
// caught it and painted the whole route. 95-01 fixes the CONTRACT at the repository seam; this
// spec is what proves the render.
//
// WHY NATURAL NETWORK, NOT CDP-BLOCKED. The subject is the honest render over a LIVE response —
// the deployed `search` and `quickswitcher-search` functions are the thing under test. Blocking
// the request would assert the error path and say nothing about criterion 1.
//
// WHY THE CRASH IS DETECTED BY ABSENCE OF A TEST ID, NOT BY ITS COPY. The router's
// defaultErrorComponent (`router/index.tsx:73-90`) renders the SAME i18n copy as the shared
// QueryErrorState — `common:errors.queryFailed.title` — and carries no test id. Matching the
// heading text alone therefore cannot tell "this route crashed" from "this query failed and the
// page said so honestly". The discriminator is `data-testid="query-error-state"`: present = the
// page's own error branch; absent with that heading on screen = the crash. [VERIFIED: probe of
// /search?q=UN against HEAD, 2026-08-16 — heading visible, no test id, four `Route error:
// TypeError ... forEach` console lines.]
//
// WHY CLASSIFICATION IS GATED ON THE NETWORK RESPONSE AND ON STABILITY. Clicking a chip sets the
// query immediately but the hook debounces 300ms, so for that window the page renders its
// zero-results state with no request in flight. A classifier that reads the DOM straight after the
// click records that flash as "empty" and passes on a tree that crashes a second later — measured,
// not hypothesised: the first draft of this spec passed against the known-broken HEAD for exactly
// that reason. So: wait for the `search` response, then require two identical readings before
// believing any of them.
//
// AUTHENTICATION: inline, from TEST_USER_EMAIL / TEST_USER_PASSWORD, and run with --no-deps. The
// Playwright `setup` project throws without six E2E_* keys that .env.test does not carry
// (E2ECRED-01, filed against Phase 101), so no storage-state fixture is usable here.
import { test, expect, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

// TIMING. Two live edge round-trips to staging behind a 300ms debounce, and TanStack Query retries
// twice on rejection. This budget is that ladder, not flakiness.
const SETTLE_TIMEOUT = 20_000

/** No rendered text may carry a Postgres code, a permission string, or the vendor name (D-08). */
const INTERNAL_STRING =
  /(42501|42703|42P01|permission denied|supabase|FunctionsHttpError|FunctionsFetchError)/i

/** Hardcoded on the page at DossierSearchPage.tsx:292 — drift is caught here, in the same plan. */
const CHIPS = ['Saudi Arabia', 'UN', 'G20', 'climate'] as const

/** The three legitimate terminal states, plus the one that fails the criterion. */
type PageState = 'rows' | 'empty' | 'error' | 'crash' | 'pending'

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

/** One DOM reading. `pending` means the page is mid-flight and nothing may be concluded yet. */
const classify = async (page: Page): Promise<PageState> => {
  if ((await page.getByTestId('query-error-state').count()) > 0) return 'error'
  if ((await page.getByRole('heading', { name: 'Unable to load data' }).count()) > 0) return 'crash'
  if ((await page.getByRole('heading', { name: 'No results found' }).count()) > 0) return 'empty'
  const resultsRegion = await page.getByRole('heading', { name: 'DOSSIERS' }).count()
  const inFlight = await page.locator('svg.animate-spin').count()
  return resultsRegion > 0 && inFlight === 0 ? 'rows' : 'pending'
}

/** Two identical non-pending readings, 300ms apart, or the state never settled. */
const settle = async (page: Page, label: string): Promise<PageState> => {
  let previous: PageState = 'pending'
  const deadline = Date.now() + SETTLE_TIMEOUT
  while (Date.now() < deadline) {
    const current = await classify(page)
    if (current !== 'pending' && current === previous) return current
    previous = current
    await page.waitForTimeout(300)
  }
  throw new Error(`/search never settled for "${label}" (last reading: ${previous})`)
}

/** A response from the deployed `search` fn — never `quickswitcher-search`, never a suggestion fn. */
const searchResponse = (page: Page): Promise<unknown> =>
  page.waitForResponse((r) => r.url().includes('/functions/v1/search?'), {
    timeout: SETTLE_TIMEOUT,
  })

/** The copy rule, asserted over the whole surface — a leak anywhere is the same defect. */
const assertNoInternalString = async (page: Page): Promise<void> => {
  const bodyText = (await page.locator('body').innerText()) ?? ''
  expect(bodyText).not.toMatch(INTERNAL_STRING)
}

test.describe('DEAD-01 criterion 1 — /search renders over live responses', () => {
  test('a typed query renders the real result set', async ({ page }) => {
    await signInInline(page)
    await page.goto('/search')

    // 'UN' is the probed term: the deployed `search` fn returned count 2 for it on 2026-08-16.
    const response = searchResponse(page)
    await page.getByPlaceholder(/Search for dossiers/i).fill('UN')
    await response

    const state = await settle(page, 'typed:UN')
    console.log(`TYPED-STATE: UN -> ${state}`)

    // THE HONEST RENDER, asserted as itself — not "did not crash". A term with known staging rows
    // must produce rows; empty or error here would be a truthful state for the WRONG query.
    expect(state).toBe('rows')
    await assertNoInternalString(page)
  })

  test('every suggestion chip settles into a truthful state, never a crash', async ({ page }) => {
    await signInInline(page)

    for (const chip of CHIPS) {
      // Fresh load per chip: the chips only render while the query is empty.
      await page.goto('/search')
      const response = searchResponse(page)
      await page.getByRole('button', { name: chip, exact: true }).click()
      await response

      const state = await settle(page, chip)
      // Preserved in the runner output; transcribed into the plan SUMMARY.
      console.log(`CHIP-STATE: ${chip} -> ${state}`)

      // rows, empty and error are all truthful settles for a chip term. The crash is not.
      expect(state, `chip "${chip}" hit the route error boundary`).not.toBe('crash')
      await assertNoInternalString(page)
    }
  })
})
