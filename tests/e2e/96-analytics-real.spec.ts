// @covers DEAD-05 (criterion 1)
//
// Phase 96 — the /analytics truth oracle. Cloned from the proven `95-sandbox-error.spec.ts`
// family shape: inline auth, `--no-deps`, a bounded settle budget, an internal-string regex, and
// assertions that live entirely in the DOM.
//
// THE CRITERION. "/analytics shows real data or is honestly disabled; no fabricated sparklines,
// donuts or Insights-you-will-gain over a backend endpoint that does not exist." Half of that is
// an ABSENCE in the rendered page and half is a settled render — neither is greppable, so both
// live here.
//
// BRANCH-INVARIANT BY CONSTRUCTION. The requirement names two acceptable outcomes (real data, or
// an honest disable) and one unacceptable one (fabrication). Test 1 therefore asserts only the
// forbidden shape's absence, so it holds under EITHER branch and cannot be reddened by a later
// per-widget flip to the honest-disable state. Test 2 accepts every truthful settled shape — a
// rendered chart, a per-region inline error, a "No data available" empty region, or the
// page-level error when all five regions fail — and fails only on the untruthful one: still
// loading past the budget, or a blank main region. Execution took Branch A (real data) for all
// five endpoints; both tests are written so that record is not baked into the assertions.
//
// ORACLE POPULATION DEFINITION (D-15). This spec covers what the /analytics ROUTE renders. It
// does NOT assert the correctness of the numbers, which is a separate class: two of the five
// endpoints (engagements → `dossier_interactions`, relationships → `relationship_health_scores`)
// are REAL but EMPTY-BACKED today, so their truthful zeros and a fabricated zero look identical
// in the DOM. That is exactly why no assertion below reads a value — a zero series is never taken
// as proof the path works (96-RESEARCH Derivation 6). The source-read classification of each RPC
// is the evidence for realness; this spec is the evidence for what reaches the user.
//
// WHY THE PITCH STRINGS ARE PINNED AS LITERALS. `preview.insightsYouWillGain` et al. were i18n
// keys in a component this phase deleted; a key-based assertion would pass trivially the moment
// the key is gone, proving nothing about what the page paints. The literals below are the
// resolved EN copy read from `frontend/src/i18n/en/analytics.json` at authoring time — they fail
// if that copy ever renders again from any source, deleted component or not.
//
// AUTHENTICATION: inline, from TEST_USER_EMAIL / TEST_USER_PASSWORD, run with --no-deps. The
// Playwright `setup` project throws without six E2E_* keys that .env.test does not carry
// (E2ECRED-01, filed against Phase 101), so no storage-state fixture is usable here.
import { test, expect, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

// TIMING. Five parallel queries against the edge tier, each carrying TanStack Query's retry
// ladder on a non-4xx failure (1s + 2s + 4s backoff). This budget is that ladder, not flake
// tolerance: a region still showing its skeleton at 20s IS the failure the criterion names.
const SETTLE_TIMEOUT = 20_000

/** The resolved EN copy of the deleted preview layer — `frontend/src/i18n/en/analytics.json`. */
const FABRICATION_COPY = [
  "Insights you'll gain", // preview.insightsYouWillGain
  'See example with sample data', // preview.showSampleData
  'Hide sample data', // preview.hideSampleData
  "You're viewing sample data.", // preview.sampleDataActive (prefix — the whole sentence is long)
  'Engagement Analytics Preview', // preview.engagements.title
]

/**
 * The copy rule (93-UI-SPEC §Verification Notes, D-08): no rendered text may carry a
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

/**
 * Waits for the route to RENDER and then to STOP loading. Every skeleton in this app is the shared
 * primitive, whose only stable marker is `animate-pulse` (`components/ui/heroui-skeleton.tsx:24`).
 *
 * The non-empty wait is not decoration: `<main>` is AppShell chrome and is visible with zero
 * children while the route is still mounting, so a settle helper that only counted skeletons
 * returned instantly against a blank page — measured, not assumed — and every absence assertion
 * downstream would have passed over a page that had rendered nothing at all. That is the vacuous
 * pass this milestone exists to kill, so the order is: main exists → main rendered something →
 * nothing in it is still loading.
 */
const waitForSettle = async (page: Page): Promise<void> => {
  const main = page.locator('main').first()
  await expect(main).toBeVisible({ timeout: SETTLE_TIMEOUT })
  await expect(main).not.toBeEmpty({ timeout: SETTLE_TIMEOUT })
  await expect(main.locator('.animate-pulse')).toHaveCount(0, { timeout: SETTLE_TIMEOUT })
}

test.describe('criterion 1 — /analytics reports instead of performing', () => {
  test('no fabricated preview or sample visual reaches the analytics DOM', async ({ page }) => {
    await signInInline(page)
    await page.goto('/analytics')
    await waitForSettle(page)

    const bodyText = (await page.locator('body').innerText()) ?? ''

    // The oracle. Branch-invariant: real data, an empty region, a per-region error and an honest
    // disable all satisfy it — only the pitch over a chart the app cannot back does not.
    for (const pitch of FABRICATION_COPY) {
      expect(bodyText).not.toContain(pitch)
    }

    // The generators are gone, so their last observable trace would be the affordance that turned
    // them on. Zero buttons offering sample data, asserted structurally as well as in text.
    await expect(page.getByRole('button', { name: /sample data/i })).toHaveCount(0)

    // The trend rule, same class: a delta over a comparison that never completed is a fabricated
    // visual too. Asserted per ROW so it is branch-invariant — a real "+12.5% from previous
    // period" passes, a "0.0% from previous period" (the value the summary RPC emits both for "no
    // prior period" and for its hardcoded healthScoreChange) fails.
    //
    // HONESTY NOTE: against today's staging payload all four change values are 0, so the page
    // suppresses all four delta rows and this loop runs ZERO times. It is a guard for the day a
    // real delta ships, not evidence that the rule works today. Today's evidence is recorded in
    // 96-06-SUMMARY: zero delta rows MEASURED in the DOM after the fix, against a payload whose
    // four change values were MEASURED as 0 — and `SummaryCard.tsx:70` renders the row on
    // `change !== undefined`, unchanged by this plan, so the pre-fix page rendered four of them.
    const deltaRows = page.getByText('from previous period')
    for (let i = 0; i < (await deltaRows.count()); i += 1) {
      expect(await deltaRows.nth(i).locator('..').innerText()).not.toMatch(/(^|[^\d.])0\.0%/)
    }

    // Leak-free while we are here — a fabricated visual and a leaked internal are the same class
    // of untruthful render.
    expect(bodyText).not.toMatch(INTERNAL_STRING)
  })

  test('the page settles to real regions or truthful failure, never a spinner or a blank', async ({
    page,
  }, testInfo) => {
    await signInInline(page)
    await page.goto('/analytics')
    await waitForSettle(page)

    const main = page.locator('main').first()
    // "Never a blank main region" — the half that holds in BOTH branches.
    await expect(main).not.toBeEmpty()

    const pageError = page.getByTestId('query-error-state')
    if (await pageError.isVisible()) {
      // ALL FIVE regions failed. Truthful, so it passes — but recorded, because a green here
      // means something very different from a green on the data branch.
      testInfo.annotations.push({
        type: 'branch',
        description: 'all five analytics regions failed — page-level truthful error branch',
      })
      await expect(pageError).toHaveAttribute('role', 'alert')
      await expect(pageError.getByRole('button')).toBeVisible()
    } else {
      // The data branch: the tabbed body renders, and the active panel settled into at least one
      // truthful shape. Counted, never valued — a zero-valued series is not evidence (see the
      // population-definition block above).
      // Pinned by NAME, not by role alone: each chart card carries its own inner tablist, so a
      // bare getByRole('tablist') matches five elements and resolves nothing. "Overview" is the
      // page-level tab set (`analytics:tabs.overview`); no chart's inner tabs use that label.
      await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible()
      const panel = page.getByRole('tabpanel').first()
      await expect(panel).toBeVisible()
      await expect(panel).not.toBeEmpty()

      const charts = await panel.locator('.recharts-responsive-container').count()
      const regionErrors = await panel.getByTestId('query-error-inline').count()
      const emptyRegions = await panel.getByText('No data available').count()
      testInfo.annotations.push({
        type: 'regions',
        description: `charts=${charts} inline-errors=${regionErrors} empty=${emptyRegions}`,
      })
      expect(charts + regionErrors + emptyRegions).toBeGreaterThan(0)
    }

    const bodyText = (await page.locator('body').innerText()) ?? ''
    expect(bodyText).not.toMatch(INTERNAL_STRING)
  })
})
