// @covers TRUST-02
//
// Phase 93 Wave 3 (93-09) — the two admin surfaces of criterion 2, proven in BOTH directions.
//
// WHAT THIS KILLS. Both routes destructured every query as `data: x = []` with no `isError`
// anywhere in the file. `/admin/field-permissions` therefore rendered "0 Permissions" over a
// database holding 19 live rules whenever its query rejected — the audit's exemplar confident lie —
// and `/admin/data-retention` rendered six separate claims of emptiness ("No Policies", "No Legal
// Holds", "No pending actions", …) for six separate failures.
//
// READ THIS BEFORE "FIXING" A SURPRISING ASSERTION — test 3 asserts something BROKEN on purpose:
//
//   /admin/data-retention's legal-holds region MUST still render the inline error state. Two
//   independent causes stack there, measured against deployed staging on 2026-08-16:
//     (1) proximate — `GET /functions/v1/data-retention/legal-holds` answers 404
//         {"code":"NOT_FOUND","message_en":"Policy not found"}: the edge function derives its
//         resource from the second-to-last path segment, so every `/data-retention/<sub>` route
//         except `policies` is misread as a policy id. Filed in 93-09-SUMMARY.md, owner TBD.
//     (2) underlying — public.legal_holds still carries a SELECT policy over auth.users
//         (raw_user_meta_data->>'role'). It is one of the residual 11 of RLS-AUTHUSERS-01, owned
//         by Phase 100, and deliberately NOT covered by 93-04's four-policy migration.
//   A change that makes this region green is a REJECT, not a fix. When Phase 100 lands
//   RLS-AUTHUSERS-01 (and whoever owns the routing bug lands that), FLIP test 3's legal-holds
//   assertion to the healthy render — do not delete it.
//
// So a criterion-2 close here does NOT mean the whole data-retention page went green. The oracle
// itself names what is still broken, which is the only way that claim stays honest.
//
// AUTHENTICATION: inline, from TEST_USER_EMAIL / TEST_USER_PASSWORD, and run with --no-deps. The
// Playwright `setup` project throws without six E2E_* keys that .env.test does not carry
// (E2ECRED-01, filed against Phase 101), so no storage-state fixture is usable here.
import { test, expect, type Locator, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

// TIMING. A CDP-blocked request surfaces as a plain fetch TypeError with NO numeric `status`, so
// query-client.ts's 4xx short-circuit never fires and TanStack Query runs its full retry ladder:
// 4 attempts at 1s + 2s + 4s backoff. `isError` therefore arrives at ~7s, past Playwright's
// default 5s expect timeout. This budget is retry backoff, not flakiness — a CORRECT
// implementation fails the default timeout.
const RETRY_BACKOFF_TIMEOUT = 15_000

// Copy rule (D-08): no server/database internals may reach the DOM. Postgres SQLSTATEs, the raw
// "permission denied for table ..." string, and the transport's own name are all disqualifying.
const INTERNALS = /(42501|42703|42P01|42P17|permission denied|supabase)/i

// The BLOCK PATTERNS ARE DELIBERATELY EDGE-SCOPED, and the obvious shorter form is a trap.
// `*field-permissions*` would also match the SPA route document (`/admin/field-permissions`) and
// the Vite dev-server module URL for the route file itself, so the page would never boot and the
// test would "pass" against a blank screen instead of against the error state.
const BLOCK_FIELD_PERMISSIONS = '*/functions/v1/field-permissions*'
const BLOCK_DATA_RETENTION = '*/functions/v1/data-retention*'

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

/** Block one URL pattern at the network layer before the page ever loads. */
const blockAtNetworkLayer = async (page: Page, pattern: string): Promise<void> => {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.setBlockedURLs', { urls: [pattern] })
}

/**
 * The FIGURE of a summary stat card, located by the card's own label text.
 *
 * Grounded at heroui-card.tsx (`data-slot="card"` / `data-slot="card-content"`). Note the card
 * body is `<p>{figure}</p><p>{label}</p>` and BOTH live inside `card-content`, so the content
 * slot's text is "19Permissions" — the first `<p>` is the figure and the slot itself is not.
 */
const statValue = (page: Page, label: RegExp): Locator =>
  page
    .locator('[data-slot="card"]')
    .filter({ hasText: label })
    .locator('[data-slot="card-content"] p')
    .first()

test.describe('TRUST-02 /admin/field-permissions', () => {
  test('natural visit renders the rules the database actually holds', async ({ page }) => {
    await signInInline(page)
    await page.goto('/admin/field-permissions')

    // The permissions tab is the default tab; its table body is the rule list.
    const rows = page.locator('table tbody tr')
    await expect(rows.first()).toBeVisible({ timeout: RETRY_BACKOFF_TIMEOUT })

    const rowCount = await rows.count()
    const statText = ((await statValue(page, /Permissions$/).innerText()) || '').trim()
    // Record the live numbers rather than leaving "it rendered something" to inference.
    console.log(`[93-09] field-permissions rows=${rowCount} stat="${statText}" (19 expected)`)
    test.info().annotations.push({
      type: '93-09-field-permissions-observed',
      description: `rows=${rowCount} stat=${statText}`,
    })

    expect(rowCount).toBeGreaterThan(0)
    // The exemplar lie, asserted dead: neither a zero nor the unknown-count em dash.
    expect(statText).not.toBe('0')
    expect(statText).not.toBe('—')
    // And no error state on a healthy load.
    await expect(page.getByTestId('query-error-state')).toHaveCount(0)
  })

  test('a blocked field-permissions request renders the error state, never "0 Permissions"', async ({
    page,
  }) => {
    await signInInline(page)
    await blockAtNetworkLayer(page, BLOCK_FIELD_PERMISSIONS)
    await page.goto('/admin/field-permissions')

    // Every assertion below is on the DOM. None reads a response status.
    await expect(page.getByTestId('query-error-state')).toBeVisible({
      timeout: RETRY_BACKOFF_TIMEOUT,
    })

    // The stat reads the em dash, not 0. A zero here would assert a fact the app does not have.
    await expect(statValue(page, /Permissions$/)).toHaveText('—', {
      timeout: RETRY_BACKOFF_TIMEOUT,
    })

    // The empty state must NOT be rendered — a failed load is not "no rules configured".
    await expect(page.getByText(/no permission rules configured/i)).toHaveCount(0)

    // No server/database internals in the rendered copy.
    expect(await page.locator('body').innerText()).not.toMatch(INTERNALS)
  })
})

test.describe('TRUST-02 /admin/data-retention', () => {
  test('natural visit is honest PER REGION — policies load, legal-holds errors by design', async ({
    page,
  }) => {
    // A render crash on this route is a FAILURE, not a passing "no rows" — the route's error
    // boundary swallows it into copy that reads a lot like an honest query-error state. See the
    // envelope note in data-retention.tsx (`asRows`) for the instance that made this necessary.
    const crashes: string[] = []
    page.on('pageerror', (e) => crashes.push(String(e)))
    // React error boundaries swallow the throw, so `pageerror` alone misses a route crash;
    // TanStack Router logs it as `Route error:` on the console. Watch both.
    page.on('console', (m) => {
      if (m.type() === 'error' && /Route error|is not a function|Cannot read/.test(m.text())) {
        crashes.push(m.text())
      }
    })

    await signInInline(page)
    await page.goto('/admin/data-retention')

    // Assert this FIRST: a swallowed render crash renders copy that reads like an honest
    // query-error state, so every assertion below it would otherwise fail for the wrong reason.
    await expect(page.getByRole('tab', { name: 'Policies' })).toBeVisible({
      timeout: RETRY_BACKOFF_TIMEOUT,
    })
    expect(
      crashes,
      `uncaught render errors on /admin/data-retention: ${crashes.join(' | ')}`,
    ).toHaveLength(0)

    // --- Region 1: policies. 93-04 rewrote data_retention_policies' RLS to
    // is_platform_admin(auth.uid()), so this region answers 200 where it used to 42501. Asserting
    // rows (not merely "no error") means a silent regression to an empty 200 also fails here.
    await page.getByRole('tab', { name: 'Policies' }).click()
    const policyRows = page.locator('table tbody tr')
    await expect(policyRows.first()).toBeVisible({ timeout: RETRY_BACKOFF_TIMEOUT })
    const policyCount = await policyRows.count()
    console.log(`[93-09] data-retention policy rows=${policyCount}`)
    expect(policyCount).toBeGreaterThan(0)

    // The page did NOT collapse: the page-level state is reserved for a failed primary query.
    await expect(page.getByTestId('query-error-state')).toHaveCount(0)

    // --- Region 2: legal holds. THE RESIDUAL, ASSERTED. See the file header before changing this.
    await page.getByRole('tab', { name: 'Legal Holds' }).click()
    await expect(page.getByTestId('query-error-inline')).toBeVisible({
      timeout: RETRY_BACKOFF_TIMEOUT,
    })
    // And it is an error, not an emptiness claim.
    await expect(page.getByText(/no legal holds/i)).toHaveCount(0)

    // The residual never leaks its cause into the DOM either.
    expect(await page.locator('body').innerText()).not.toMatch(INTERNALS)

    // Nothing above may have been reached via a swallowed render crash.
    expect(
      crashes,
      `uncaught render errors on /admin/data-retention: ${crashes.join(' | ')}`,
    ).toHaveLength(0)
  })

  test('a blocked data-retention request collapses to the error state, never six empty regions', async ({
    page,
  }) => {
    await signInInline(page)
    await blockAtNetworkLayer(page, BLOCK_DATA_RETENTION)
    await page.goto('/admin/data-retention')

    // Blocking the whole function fails the primary (policies) query, so the page collapses.
    await expect(page.getByTestId('query-error-state')).toBeVisible({
      timeout: RETRY_BACKOFF_TIMEOUT,
    })

    // Every summary figure reads the em dash — five unknown counts, zero fabricated zeroes.
    for (const label of [
      /Active Policies$/,
      /Legal Holds$/,
      /Pending Actions$/,
      /Expiring Soon$/,
      /Under Hold$/,
    ]) {
      await expect(statValue(page, label)).toHaveText('—', { timeout: RETRY_BACKOFF_TIMEOUT })
    }

    // None of the six confident-empty renders may appear.
    for (const empty of [
      /no policies/i,
      /no legal holds/i,
      /no pending actions/i,
      /no entities expiring soon/i,
      /no processor executions yet/i,
      /no retention tracking data yet/i,
    ]) {
      await expect(page.getByText(empty)).toHaveCount(0)
    }

    expect(await page.locator('body').innerText()).not.toMatch(INTERNALS)
  })
})
