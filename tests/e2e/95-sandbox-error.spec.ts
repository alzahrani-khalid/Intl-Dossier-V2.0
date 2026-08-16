// @covers DEAD-03 (criterion 3)
//
// Phase 95 — forced-error oracle for /scenario-sandbox. Cloned from the proven Phase 93 pattern
// (`93-tasks-queue-error.spec.ts`): inline auth, `--no-deps`, a retry-backoff timeout, an
// internal-string regex, and assertions that live entirely in the DOM.
//
// THE CRITERION. "/scenario-sandbox either loads or shows an error; a backend 500 is never
// pixel-identical to still loading." That is a statement about two RENDERED states being
// distinguishable, so a grep cannot close it — only a DOM observation can. The discriminator
// asserted below is the one 93-UI-SPEC defines: the loading state is a neutral spinner with no
// `role="alert"`, the error state is `data-testid="query-error-state"` with `role="alert"`, a
// danger icon, and a retry affordance. This spec asserts the error state is present AND the
// spinner is gone — the second half is what makes "not pixel-identical to loading" observable.
//
// ORACLE POPULATION DEFINITION. The route carries `beforeLoad: devModeGuard`, which redirects to
// /dashboard in a production build that lacks VITE_DEV_MODE. The observable surface for this
// oracle is therefore the DEV SERVER (or a VITE_DEV_MODE build) — where the guard passes. A run
// against a plain production build would observe /dashboard, not this page, and would prove
// nothing about the criterion. That is a scope statement, not a weakening: the criterion is about
// what this page renders on the surface where this page exists.
//
// WHY THE BLOCK PATTERN IS `*/functions/v1/scenario-sandbox*` AND NOT `*scenario-sandbox*`. The
// SPA route, its dev-server module URL, and the edge function all carry the string
// `scenario-sandbox`, so the broad pattern also blocks
// http://localhost:5173/src/routes/_protected/scenario-sandbox.tsx — which `routeTree.gen.ts`
// imports eagerly, so the WHOLE app fails to mount and the page renders blank. Observed, not
// assumed: run with the broad pattern the failure screenshot is an empty white viewport with no
// AppShell at all (95-03 SUMMARY, drill A). A blank page is not the error state, and a spec that
// "passes" against it would be measuring its own block, not the app. The narrowed pattern hits
// only the data request (`api-client.ts:80-81` resolves edge calls to
// `${VITE_SUPABASE_URL}/functions/v1${path}`), which is the failure the criterion is about.
//
// Test 2 asserts the NATURAL state deliberately, unlike the 93 clone. Its parent's reason for
// forcing does not apply here: this function is deployed and criterion 3 does not require fixing
// its 500, so the natural state cannot be "fixed out" from under the assertion. It is written to
// accept BOTH truthful outcomes — settled content or the error state — and to fail only on the
// untruthful one, a spinner still running past the bounded retry budget.
//
// Forced errors are NEVER asserted by emptiness (D-13): an auth/RLS denial presents as an empty
// 200, and reading that empty state as the error state is the defect class this milestone kills.
//
// AUTHENTICATION: inline, from TEST_USER_EMAIL / TEST_USER_PASSWORD, run with --no-deps. The
// Playwright `setup` project throws without six E2E_* keys that .env.test does not carry
// (E2ECRED-01, filed against Phase 101), so no storage-state fixture is usable here.
import { test, expect, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

/** Blocks the edge-function data request only — never the SPA document. See the header. */
const BLOCKED_EDGE_FN = '*/functions/v1/scenario-sandbox*'

// TIMING. The scenarios query carries a bounded retry (no retry on 4xx, at most 2 otherwise), so
// a 5xx or a blocked request settles to `isError` after 1s + 2s of backoff plus request time —
// past Playwright's default 5s expect timeout, well inside this budget. The budget is retry
// backoff, not flake tolerance; it is also the ceiling the criterion cares about, since a spinner
// still running at 15s IS the "pixel-identical to loading" failure.
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

test.describe('criterion 3 — /scenario-sandbox failure is DOM-distinct from loading', () => {
  test('blocked scenarios request renders query-error-state with no spinner and no internal string', async ({
    page,
  }) => {
    await signInInline(page)

    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Network.enable')
    await cdp.send('Network.setBlockedURLs', { urls: [BLOCKED_EDGE_FN] })

    // INSTRUMENT TEST, not the oracle. The deployed function 500s today, so the error state would
    // render even if this pattern matched nothing — the force would be doing no work and nobody
    // would know until someone fixed the 500 and this spec went red for the wrong reason. Record
    // whether the block actually fired; the verdict below is still taken from the DOM alone.
    const blockedRequests: string[] = []
    page.on('requestfailed', (request) => {
      if (request.url().includes('/functions/v1/scenario-sandbox')) {
        blockedRequests.push(request.failure()?.errorText ?? 'unknown')
      }
    })

    await page.goto('/scenario-sandbox')

    // Every assertion below is on the DOM. None reads a response status.
    const panel = page.getByRole('tabpanel')
    const errorState = panel.getByTestId('query-error-state')
    await expect(errorState).toBeVisible({ timeout: RETRY_BACKOFF_TIMEOUT })

    // A retry affordance must live inside the error region, not floating elsewhere.
    await expect(errorState.getByRole('button')).toBeVisible({ timeout: RETRY_BACKOFF_TIMEOUT })

    // THE DISCRIMINATOR. The loading state is the only element in this region carrying
    // `animate-spin` (route source: `<Loader2 className="h-8 w-8 animate-spin …" />`). Zero of
    // them alongside a visible error state is what "never pixel-identical to loading" means in
    // the DOM; the error state carries role="alert", which the spinner never does.
    await expect(panel.locator('.animate-spin')).toHaveCount(0)
    await expect(errorState).toHaveAttribute('role', 'alert')

    // The copy rule, asserted over the whole rendered page — not just the error region — because
    // a leak anywhere on the surface is the same defect.
    const bodyText = (await page.locator('body').innerText()) ?? ''
    expect(bodyText).not.toMatch(INTERNAL_STRING)

    // The force was real: at least one scenarios request died at the NETWORK layer. This is the
    // half that discriminates a forced failure from the natural 500 — a 500 is a completed
    // response and fires `requestfinished`, never `requestfailed`. The reason string is Chrome's
    // own label for a DevTools-initiated block; it is `inspector`, observed, not `BLOCKED` as
    // first written (95-03 SUMMARY, drill C). Matched loosely so a Chrome rename cannot red a
    // correct implementation.
    expect(blockedRequests.length).toBeGreaterThan(0)
    expect(blockedRequests[0]).toMatch(/inspector|blocked/i)
  })

  test('unblocked scenarios request settles to content or error, never a spinner past the budget', async ({
    page,
  }) => {
    await signInInline(page)

    await page.goto('/scenario-sandbox')

    const panel = page.getByRole('tabpanel')
    await expect(panel).toBeVisible({ timeout: RETRY_BACKOFF_TIMEOUT })

    // "Either loads or shows an error" — the half that holds in BOTH branches is that the region
    // stops loading within the bounded retry budget.
    await expect(panel.locator('.animate-spin')).toHaveCount(0, { timeout: RETRY_BACKOFF_TIMEOUT })

    // …and what it settled to is one of the two truthful shapes. Both branches pass on purpose:
    // the deployed function 500s today, so the error branch is the likely one at execution, but
    // a later fix that makes the page load must not red this spec.
    const errorState = panel.getByTestId('query-error-state')
    if (await errorState.isVisible()) {
      await expect(errorState.getByRole('button')).toBeVisible()
      await expect(errorState).toHaveAttribute('role', 'alert')
    } else {
      // Settled content: the scenarios region rendered something (grid or empty state). Asserted
      // as non-empty text rather than as a row count, because zero rows is a legitimate truthful
      // outcome here and counting them would encode today's data as the expectation.
      await expect(panel).not.toBeEmpty()
    }

    const bodyText = (await page.locator('body').innerText()) ?? ''
    expect(bodyText).not.toMatch(INTERNAL_STRING)
  })
})
