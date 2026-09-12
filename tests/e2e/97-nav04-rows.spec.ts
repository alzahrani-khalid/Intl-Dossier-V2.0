// @covers NAV-04
//
// Phase 97 Wave 4 (97-10) — the click-through oracle for every row `97-NAV04-DECISIONS.md` ruled
// `NAV ENTRY`: `/admin/ai-usage`, `/admin/approvals`, `/monitoring`.
//
// WHAT THIS KILLS. An entry present in `navigation-config.ts` that renders nowhere, or renders
// somewhere blank. A `NavigationItem` in a config object is a data-structure claim: the app has a
// second nav data source whose tree is mounted by exactly one standalone demo route, so an entry
// added to the wrong file passes a grep and reaches no user. That is why `/monitoring` counted as
// having NO live inbound link despite being linked in that other tree. Nothing here asserts a
// config object; every claim is a click on a rendered affordance.
//
// SCOPE — this file proves a SCOPED claim and its titles say so, per RULING-P97-03 §3. The
// administration group is emitted by `createNavigationGroups` only when `isAdmin` is true, so
// every green below is reachable-for-an-administrator-at-1400 and NOT the general claim. The role
// is proven IN-RUN rather than inferred from a username: `assertAdminGroupRendered` asserts a
// pre-existing administration row is in the live aside, which can only be there when the group was
// emitted. The viewport is set explicitly in each test, so "desktop 1400" is measured, not assumed
// from a config default.
//
// EXACTLY ONE ROW PER PATH. Four of the nine NAV-04 candidates already had a live sidebar row
// before this phase (`ALREADY-REACHABLE`), and the failure mode of adding entries from a table is a
// DUPLICATE row for one of those. Each test therefore pins its href count at 1, not at ">= 1".
//
// DELETE rows are deliberately NOT asserted here — 97-11 owns proving those paths are gone.
// Splitting one claim across two files would leave each half looking complete.
//
// AUTHENTICATION: inline, from TEST_USER_EMAIL / TEST_USER_PASSWORD, and run with --no-deps. The
// Playwright `setup` project throws without six E2E_* keys that .env.test does not carry
// (E2ECRED-01, filed against Phase 101), so no storage-state fixture is usable here.
//
// NETWORK: natural. These are renders-oracles against real dev-stack state — nothing is blocked or
// stubbed, so a green means the real path resolved.
import { test, expect, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

// TIMING. One budget for every settle. Generous enough to cover the queries' retry ladder
// (query-client.ts retries non-4xx 3x with exponential backoff) so a slow-but-correct settle is not
// read as a hang; still short enough that a widget stuck loading fails rather than waits.
const SETTLE_TIMEOUT = 15_000

/**
 * The copy rule (D-08): no rendered error text may carry a Postgres/PostgREST code, a permission
 * string, a vendor URL/class, or a supabase-js error class.
 *
 * Taken verbatim from `95-monitoring-mounts.spec.ts:54-55`, INCLUDING its one deliberate narrowing:
 * the bare vendor name is not an arm, because the monitoring health widget lists the monitored
 * services by name and one of them IS called `supabase` — intended product data on that surface,
 * not a leak. The arm is leak-shaped (`supabase.co` / `supabase-js` / `SupabaseClient`) instead.
 * Every shape that actually indicates a leaked server body still matches.
 */
const INTERNAL_STRING =
  /(42501|42703|42P01|permission denied|supabase\.co|supabase-js|SupabaseClient|FunctionsHttpError|FunctionsFetchError)/i

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

/** THE VIEWPORT, set before anything renders — 1400x900 is the desktop aside, not the drawer. */
const openDesktopShell = async (page: Page): Promise<void> => {
  await page.setViewportSize({ width: 1400, height: 900 })
  await signInInline(page)
  await page.goto('/dashboard')
  await expect(page.locator('aside[role="navigation"]')).toBeVisible({ timeout: SETTLE_TIMEOUT })
}

/**
 * THE ROLE, proven in-run. `/admin/ai-settings` is a row that shipped long before this phase and
 * lives in the same admin-gated group as the three rows under test. Its presence in the live aside
 * proves the group was emitted, i.e. the signed-in session resolved to an administrator. Asserting
 * this BEFORE each click is what stops a green here from being read as a general claim.
 */
const assertAdminGroupRendered = async (page: Page): Promise<void> => {
  const aside = page.locator('aside[role="navigation"]')
  await expect(aside.locator('a[href="/admin/ai-settings"]')).toHaveCount(1)
}

/**
 * Click the row by its ACCESSIBLE NAME inside the live aside — which also proves the i18n label
 * resolved in both bundles rather than leaking a raw key — after pinning the href count at exactly
 * one so a duplicate row fails instead of passing twice. `exact: true` keeps "Monitoring" from
 * matching a longer sibling label.
 */
const clickNavRow = async (page: Page, href: string, label: string): Promise<void> => {
  const aside = page.locator('aside[role="navigation"]')
  await expect(aside.locator(`a[href="${href}"]`)).toHaveCount(1)
  await aside.getByRole('link', { name: label, exact: true }).click()
}

const assertNoLeak = async (page: Page): Promise<void> => {
  const bodyText = (await page.locator('body').innerText()) ?? ''
  expect(bodyText).not.toMatch(INTERNAL_STRING)
}

test.describe('NAV-04 — every KEEP row reaches a rendering page from a real affordance', () => {
  test('/admin/ai-usage row — adminOnly user, desktop 1400', async ({ page }) => {
    await openDesktopShell(page)
    await assertAdminGroupRendered(page)
    await clickNavRow(page, '/admin/ai-usage', 'AI Usage')

    // The path is asserted exactly; the absence of a query string is NOT asserted, because a
    // route that normalizes its own search params would make that unsatisfiable (97-05 B1).
    await expect(page).toHaveURL(/\/admin\/ai-usage(\?|$)/, { timeout: SETTLE_TIMEOUT })
    await expect(page.getByRole('heading', { level: 1, name: 'AI Usage Dashboard' })).toBeVisible({
      timeout: SETTLE_TIMEOUT,
    })

    // THE SETTLE. The page's own content, and no tile still claiming to load. With no seeded
    // telemetry its honest state is a zero — asserted as "settles to data OR to its own empty
    // copy", never as a number this spec invented.
    await expect(page.getByText('Total Runs')).toBeVisible({ timeout: SETTLE_TIMEOUT })
    await expect(page.getByRole('main').locator('[data-slot="skeleton"]')).toHaveCount(0, {
      timeout: SETTLE_TIMEOUT,
    })
    await expect(
      page.getByText('No usage data available').first().or(page.getByRole('progressbar').first()),
    ).toBeVisible({ timeout: SETTLE_TIMEOUT })

    await assertNoLeak(page)
  })

  test('/admin/approvals row — adminOnly user, desktop 1400', async ({ page }) => {
    await openDesktopShell(page)
    await assertAdminGroupRendered(page)

    // This row is NOT the `/approvals` row directly above it in the same group. That one is the
    // top-level surface with a different component, guard, namespace and copy; the admin panel is
    // the only surface in the tree that can reassign a stuck approval, which is why deleting it
    // was refused and a nav entry ruled instead (RULING-P97-14). Both rows must exist, and the
    // href pin inside clickNavRow is what proves this click landed on the admin one.
    await clickNavRow(page, '/admin/approvals', 'Approval Management')

    await expect(page).toHaveURL(/\/admin\/approvals(\?|$)/, { timeout: SETTLE_TIMEOUT })
    await expect(
      page.getByRole('heading', { level: 1, name: 'Admin: Approval Management' }),
    ).toBeVisible({ timeout: SETTLE_TIMEOUT })

    // THE SETTLE — data or the page's own empty copy, never a skeleton left standing. The table
    // renders in both terminal states, so the settle is asserted on what DISTINGUISHES them: a
    // per-row Reassign action, or the empty cell. `.first()` is required, not cosmetic — the empty
    // copy lives INSIDE the table, so a bare `.or()` over table-and-copy matched two elements and
    // failed strict mode on the first run rather than measuring anything.
    await expect(page.getByRole('table')).toBeVisible({ timeout: SETTLE_TIMEOUT })
    await expect(page.getByRole('main').locator('[data-slot="skeleton"]')).toHaveCount(0, {
      timeout: SETTLE_TIMEOUT,
    })
    await expect(
      page
        .getByRole('cell', { name: 'No positions under review' })
        .or(page.getByRole('button', { name: /reassign/i }))
        .first(),
    ).toBeVisible({ timeout: SETTLE_TIMEOUT })

    await assertNoLeak(page)
  })

  test('/monitoring row — adminOnly user, desktop 1400', async ({ page }) => {
    await openDesktopShell(page)
    await assertAdminGroupRendered(page)
    await clickNavRow(page, '/monitoring', 'Monitoring')

    await expect(page).toHaveURL(/\/monitoring(\?|$)/, { timeout: SETTLE_TIMEOUT })
    await expect(page.getByRole('heading', { level: 1, name: 'Monitoring Dashboard' })).toBeVisible(
      {
        timeout: SETTLE_TIMEOUT,
      },
    )

    // THE HONEST SETTLE, and the reason it is an `.or()` rather than a data assertion. This page's
    // API sits under the backend's dev/test guard, so in a production build both widgets settle to
    // their own inline QueryErrorState instead of to data. A spec demanding data would be asserting
    // something the product does not promise. What the product DOES promise is that neither widget
    // hangs: each resolves to data or to its named error testid, and the loading text is gone.
    await expect(page.getByText('Loading health...')).toHaveCount(0, { timeout: SETTLE_TIMEOUT })
    await expect(page.getByText('Loading alerts...')).toHaveCount(0, { timeout: SETTLE_TIMEOUT })
    await expect(
      page
        .getByText(/^Overall:/)
        .or(page.getByTestId('monitoring-health-error'))
        .first(),
    ).toBeVisible({ timeout: SETTLE_TIMEOUT })
    await expect(
      page
        .getByText('No alerts configured')
        .or(page.getByRole('table'))
        .or(page.getByTestId('monitoring-alerts-error'))
        .first(),
    ).toBeVisible({ timeout: SETTLE_TIMEOUT })

    await assertNoLeak(page)
  })

  // UNABLE TO MEASURE — fixme'd deliberately, and NOT counted as a proven negative anywhere.
  //
  // This is the other half of the scope: the three greens above prove the rows are reachable for an
  // administrator, and only a run as a NON-administrator can prove they are hidden from everyone
  // else. That run needs a second account, and there is none to sign in with:
  //
  //   - `.env.test` carries exactly TEST_USER_EMAIL / TEST_USER_PASSWORD, one administrator. The
  //     six role-scoped E2E_* keys the root `setup` project wants are absent (E2ECRED-01, owned by
  //     Phase 101, and no plan waits on it).
  //   - The three committed storage states are NOT a substitute, and this was MEASURED rather than
  //     assumed: `tests/e2e/support/storage/analyst.json` carries an access token that expired
  //     2026-06-04. Loaded against the live stack on 2026-08-17 it lands on `/login` with
  //     `aside[role="navigation"]` count 0. A negative built on it would assert the administration
  //     group is absent and pass — for the trivial reason that NO sidebar renders at all. That is a
  //     vacuous green wearing a negative's clothes, which is worse than this fixme.
  //
  // Un-fixme when a non-administrator credential exists. The body below is the real test, not a
  // placeholder: it proves the session authenticated FIRST (the control that the analyst state
  // failed), and only then that the administration rows are absent from the aside AND from the
  // command palette, which derives the same flag off the same store since 97-10 Task 2.
  test.fixme('hidden from an ordinary non-admin user, desktop 1400', async ({ page }) => {
    const otherEmail = process.env.E2E_ANALYST_EMAIL ?? ''
    const otherPassword = process.env.E2E_ANALYST_PASSWORD ?? ''
    if (otherEmail === '' || otherPassword === '') {
      throw new Error('E2E_ANALYST_EMAIL / E2E_ANALYST_PASSWORD missing (E2ECRED-01, Phase 101)')
    }

    await page.setViewportSize({ width: 1400, height: 900 })
    const login = new LoginPage(page)
    await login.goto()
    await login.signIn(otherEmail, otherPassword)
    await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 })
    await page.goto('/dashboard')

    // THE CONTROL, first: the shell must actually render for this session. Without it, every
    // absence below is the absence of a logged-in app rather than of an admin affordance.
    const aside = page.locator('aside[role="navigation"]')
    await expect(aside).toBeVisible({ timeout: SETTLE_TIMEOUT })
    await expect(aside.locator('a[href="/dashboard"]')).toHaveCount(1)

    // The group, and each of this plan's three rows, absent from the sidebar.
    await expect(aside.locator('a[href="/admin/ai-settings"]')).toHaveCount(0)
    await expect(aside.locator('a[href="/admin/ai-usage"]')).toHaveCount(0)
    await expect(aside.locator('a[href="/admin/approvals"]')).toHaveCount(0)
    await expect(aside.locator('a[href="/monitoring"]')).toHaveCount(0)

    // And absent from the command palette, which consumed a hardcoded `true` until 97-10 Task 2.
    await page.keyboard.press('ControlOrMeta+k')
    const palette = page.getByRole('dialog')
    await expect(palette).toBeVisible({ timeout: SETTLE_TIMEOUT })
    await palette.getByRole('combobox').or(palette.getByRole('textbox')).first().fill('ai-usage')
    await expect(palette.getByText('AI Usage')).toHaveCount(0)
  })
})
