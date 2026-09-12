// @covers TRUST-03 TRUST-04
//
// Phase 93 plan 12 — the three-way discrimination on engagement detail, proven live.
//
// Until 93-12, `engagement-dossiers` returned the SAME 404 for an engagement dossier whose
// `engagement_dossiers` extension row is missing and for an id that does not exist at all, and
// `WorkspaceShell` rendered the same titleless chrome for both. Criterion 3 (not-found) and
// criterion 4 (degraded) were therefore indistinguishable at the client, which collapses D-05's
// error/not-found/degraded distinction on this route.
//
// This spec is the behavioural close. Each test asserts its own state PRESENT and the other two
// ABSENT — a state that merely renders is not proof; a state that renders *instead of* the other
// two is. Every assertion is on the DOM. None reads a response status (an RLS denial presents as
// an EMPTY 200, and mistaking that for a rendered state is the defect this milestone kills).
//
// AUTHENTICATION: inline, from TEST_USER_EMAIL / TEST_USER_PASSWORD, run with --no-deps. The
// Playwright `setup` project throws without six E2E_* keys that .env.test does not carry
// (E2ECRED-01, filed against Phase 101), so no storage-state fixture is usable here (D-20).
//
// FIXTURE: constructed, not borrowed. Staging happens to hold two degraded rows today, but a spec
// that depends on a defect in the seed data goes green for the wrong reason the day someone repairs
// it. `beforeAll` inserts a `dossiers` row (type='engagement') with NO `engagement_dossiers` row
// via service-role REST; `afterAll` deletes it and asserts the delete response, so staging is
// count-identical afterwards. The service-role key is read from env, never echoed, never in argv.
//
// SCHEMA (derived from the live staging schema on 2026-08-15, not guessed —
// `.claude/skills/supabase-migration-safety` §Verify CHECK/enum constraints):
//   dossiers NOT NULL with no default: type, name_en, name_ar
//   CHECK dossiers_type_check:             country|organization|forum|engagement|topic|working_group|person
//   CHECK dossiers_status_check:           active|inactive|archived|deleted     (default 'active')
//   CHECK dossiers_sensitivity_level_check: 1..4                                (default 1)
//   CHECK dossiers_name_{en,ar}_check:     non-empty
// `id` defaults to gen_random_uuid(); it is READ BACK rather than supplied, so the fixture can
// never carry a non-RFC UUID.
import { test, expect, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''
const supabaseUrl = process.env.SUPABASE_URL ?? ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

// TIMING. Test 3 blocks the request at the network layer, which surfaces as a plain Error with NO
// numeric `status`, so query-client.ts's 4xx short-circuit never fires and TanStack Query runs its
// full retry ladder (4 attempts at 1s + 2s + 4s backoff) — `isError` lands at ~7s, past Playwright's
// default 5s expect timeout. This budget is retry backoff, not flakiness: a CORRECT implementation
// fails the default timeout. Tests 1 and 2 settle in one round-trip and inherit the same budget.
const RETRY_BACKOFF_TIMEOUT = 15_000

/** Unique per run so a crashed worker's leftover row can never be mistaken for this run's. */
const FIXTURE_NAME_EN = `P93-12 degraded engagement fixture ${Date.now()}`
const FIXTURE_NAME_AR = 'مشاركة اختبارية بدون صف امتداد'

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

const serviceHeaders = (): Record<string, string> => ({
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  'Content-Type': 'application/json',
})

/** The degraded callout, located by its ARIA role — warn + role="status", never role="alert". */
const degradedCallout = (page: Page) => page.getByRole('status')

/** The shared query-error state, located by its cross-plan test id (93-01). */
const errorState = (page: Page) => page.getByTestId('query-error-state')

/** The root not-found page's oversized numeral (routes/__root.tsx NotFoundPage). */
const notFoundNumeral = (page: Page) => page.getByText('404', { exact: true })

// Serial: one fixture lifecycle for the whole file. The root config sets `fullyParallel: true`,
// which would otherwise split these three tests across workers and run beforeAll once per worker —
// three inserts, and a teardown racing tests that still need the row.
test.describe.configure({ mode: 'serial' })

test.describe('TRUST-03/TRUST-04 engagement detail discriminates degraded, absent, and failed', () => {
  let fixtureId = ''

  test.beforeAll(async () => {
    if (supabaseUrl === '' || serviceRoleKey === '') {
      throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing from .env.test')
    }
    const res = await fetch(`${supabaseUrl}/rest/v1/dossiers`, {
      method: 'POST',
      headers: { ...serviceHeaders(), Prefer: 'return=representation' },
      body: JSON.stringify({
        type: 'engagement',
        name_en: FIXTURE_NAME_EN,
        name_ar: FIXTURE_NAME_AR,
        status: 'active',
        sensitivity_level: 1,
      }),
    })
    if (!res.ok) {
      // Status + PostgREST message only. The key is never part of this string.
      throw new Error(`fixture insert failed: ${res.status} ${await res.text()}`)
    }
    const rows = (await res.json()) as Array<{ id: string }>
    fixtureId = rows[0]?.id ?? ''
    expect(fixtureId, 'fixture dossier id was read back from the insert').not.toBe('')

    // The fixture is only a fixture if the extension row is genuinely absent. Assert it rather
    // than assume it: a stray extension row would make test 1 green for the wrong reason.
    const ext = await fetch(
      `${supabaseUrl}/rest/v1/engagement_dossiers?id=eq.${fixtureId}&select=id`,
      { headers: serviceHeaders() },
    )
    expect(ext.ok, 'extension probe reached PostgREST').toBe(true)
    expect(
      (await ext.json()) as unknown[],
      'fixture has NO engagement_dossiers row — this is the degraded condition',
    ).toHaveLength(0)
  })

  test.afterAll(async () => {
    if (fixtureId === '') return
    const res = await fetch(`${supabaseUrl}/rest/v1/dossiers?id=eq.${fixtureId}`, {
      method: 'DELETE',
      headers: { ...serviceHeaders(), Prefer: 'return=representation' },
    })
    // Assert the teardown, do not hope for it: staging must be count-identical after this run.
    expect(res.ok, `fixture teardown DELETE returned ${res.status}`).toBe(true)
    expect((await res.json()) as unknown[], 'exactly one fixture row deleted').toHaveLength(1)
  })

  test('degraded: an engagement missing its extension row is NAMED, with its identity', async ({
    page,
  }) => {
    await signInInline(page)
    await page.goto(`/engagements/${fixtureId}`)

    // Identity first — the base row's name, not a chrome shell with an empty title.
    await expect(page.getByRole('heading', { name: FIXTURE_NAME_EN, level: 1 })).toBeVisible({
      timeout: RETRY_BACKOFF_TIMEOUT,
    })

    // The callout: role="status" (persistent informational state, not an interruption).
    await expect(degradedCallout(page)).toBeVisible({ timeout: RETRY_BACKOFF_TIMEOUT })
    await expect(degradedCallout(page)).toContainText(/incomplete record/i)

    // No <h1> may render with an empty title on ANY path — the titleless chrome is the defect.
    const headings = await page.locator('h1').allTextContents()
    expect(headings.filter((h) => h.trim() === '')).toHaveLength(0)

    // The other two states must be ABSENT. Degraded is not a failure and not an absence.
    await expect(errorState(page)).toHaveCount(0)
    await expect(notFoundNumeral(page)).toHaveCount(0)
  })

  test('absent: a well-formed id that resolves to no row renders the not-found page', async ({
    page,
  }) => {
    await signInInline(page)
    await page.goto(`/engagements/${crypto.randomUUID()}`)

    await expect(notFoundNumeral(page)).toBeVisible({ timeout: RETRY_BACKOFF_TIMEOUT })
    await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible({
      timeout: RETRY_BACKOFF_TIMEOUT,
    })

    // Absence is not incompleteness and not failure — no callout, no error state, no retry.
    await expect(degradedCallout(page)).toHaveCount(0)
    await expect(errorState(page)).toHaveCount(0)
  })

  test('failed: a blocked request renders the error state, never not-found or degraded', async ({
    page,
  }) => {
    await signInInline(page)

    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Network.enable')
    await cdp.send('Network.setBlockedURLs', { urls: ['*engagement-dossiers*'] })

    // Same id as test 1: only the transport differs, so the discrimination is attributable to the
    // failure and not to the record.
    await page.goto(`/engagements/${fixtureId}`)

    await expect(errorState(page)).toBeVisible({ timeout: RETRY_BACKOFF_TIMEOUT })
    await expect(errorState(page).getByRole('button', { name: /try again/i })).toBeVisible({
      timeout: RETRY_BACKOFF_TIMEOUT,
    })

    // A failure is not an absence and not an incomplete record.
    await expect(notFoundNumeral(page)).toHaveCount(0)
    await expect(degradedCallout(page)).toHaveCount(0)
  })
})
