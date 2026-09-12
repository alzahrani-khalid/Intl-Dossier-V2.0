// @covers COUNT-02 (criterion 5)
//
// Phase 96 — the SC5 fixture oracle. A dossier with NO extension row must appear in its type
// list AND be included in the hub count. Cloned from the proven Phase 95 family shape
// (`95-sandbox-error.spec.ts`): inline auth, `--no-deps`, assertions that live in the DOM, and
// the `probe-report-rls.mjs` fixture posture — namespaced ids, printed, cleaned in a finally.
//
// THE CRITERION. "A dossier without an extension row appears in both its type list and the hub
// count." That is a statement about a RENDERED list agreeing with a COUNTED table, so it can
// only be closed by inserting such a dossier and looking. Classification (96-10-CLASSIFICATION.md)
// proves *which* surfaces can drop one; this spec proves the persons surface, live.
//
// POPULATION DEFINITION. The observed population is the `person` type-list surface
// (`/dossiers/persons`) and the `dossiers` rows of `type='person'` that the hub counts. ONE
// synthetic dossier is added to that population for the duration of the run and removed after.
// What falls OUTSIDE: the other six type lists (classified in 96-10-CLASSIFICATION.md, not
// re-measured here); extension-by-design readers (detail views, relationship tabs) whose
// population IS extension rows; the mv's steady-state refresh cadence beyond the forced refresh
// this spec performs.
//
// WHY PERSON. The plan pins it, and the live gap makes it the sharpest instrument: staging holds
// 16 `person` dossiers against 15 `persons` extension rows, so the surface is already one row
// short of its own hub before this spec adds anything. `person` is also in `dossiers_type_check`
// (re-verified below, behaviourally, before any insert).
//
// THE MV FRESHNESS TRAP (96-RESEARCH Pitfall 6). `dossier_list_mv` is refreshed by eight
// statement-level triggers (`trg_dossiers_refresh_mv` + one per extension table), all calling
// `queue_dossier_list_mv_refresh()` — a synchronous `REFRESH MATERIALIZED VIEW CONCURRENTLY`.
// There is no pg_cron job. So the insert below already refreshes it; this spec calls
// `refresh_dossier_list_mv_force()` anyway. The mechanism is now known rather than trusted, and
// a forced refresh costs one statement — an oracle that passed on staleness luck would prove
// nothing.
//
// CHECK VERIFICATION IS BEHAVIOURAL, NOT CATALOG-READ. The house rule is "verify CHECK
// constraints before ANY seed insert". `pg_constraint` lives in `pg_catalog`, which PostgREST
// does not expose and no RPC on this project surfaces (checked: zero catalog-reading functions
// in `pg_proc`). So the constraint is verified the stronger way — by probing it in both
// directions: a type OUTSIDE the seven-value set must be REJECTED (proving the constraint is
// live and still exclusive), and the fixture's own `person` must be ACCEPTED. That proves the
// constraint is ENFORCED, which reading its definition would not. The definition itself was
// re-derived from `pg_constraint` at execution time and is recorded in 96-10-CLASSIFICATION.md.
//
// NEVER ASSERT EMPTINESS AS SUCCESS. A failed insert fails loudly with the printed reason; an
// empty list is a failure here, never a pass.
//
// SECURITY: the service-role key is read from the environment through the existing
// `support/helpers/supabase-admin` helper and is never echoed. Only ids and names are printed.
//
// AUTHENTICATION: inline, from TEST_USER_EMAIL / TEST_USER_PASSWORD, run with --no-deps. The
// Playwright `setup` project throws without six E2E_* keys that .env.test does not carry
// (E2ECRED-01), so no storage-state fixture is usable here (D-18).
import { test, expect, type Locator, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'
import { getSupabaseAdmin } from './support/helpers/supabase-admin'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

/** Namespaced so the row is identifiable on sight and never collides with real data. */
const FIXTURE_NAME_EN = 'P96 COUNT02 FIXTURE'
const FIXTURE_NAME_AR = 'تثبيت P96'

/** A value deliberately OUTSIDE `dossiers_type_check`'s seven values — it is a person subtype. */
const NON_TYPE = 'elected_official'

/** The list settles through TanStack Query + an edge-function round trip. */
const LIST_TIMEOUT = 20_000

/**
 * The persons grid, scoped to the page landmark. A bare `getByRole('list')` is a strict-mode
 * violation on this shell — AppShell's sidebar renders three `<ul>` navigation lists outside
 * `<main>` (observed, not assumed: the unscoped locator resolved to 3 elements). `PersonsGrid`
 * renders the only `role="list"` inside `<main>`.
 */
const personsGrid = (page: Page): Locator => page.getByRole('main').getByRole('list')

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

/** Set by the fixture insert and printed; the finally deletes exactly this id. */
let fixtureId = ''

/** Captured with the fixture present, adjacent to the insert. See the seam note in Test 1. */
let hubCount = 0
let mvCount = 0

// Serial: both tests share ONE fixture row. Under the config's `fullyParallel`, parallel tests in
// this file would each run `beforeAll` in their own worker and insert a second fixture.
test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  const admin = getSupabaseAdmin()

  // --- CHECK verification, negative direction: the constraint is live AND still exclusive. ---
  const probe = await admin
    .from('dossiers')
    .insert({ type: NON_TYPE, name_en: `${FIXTURE_NAME_EN} PROBE`, name_ar: FIXTURE_NAME_AR })
    .select('id')
    .maybeSingle()

  if (probe.error === null) {
    // The constraint changed under us. Remove the row we just made, then fail loudly — the
    // house rule is to verify before inserting, not to insert and hope.
    const strayId = (probe.data as { id?: string } | null)?.id ?? ''
    if (strayId !== '') await admin.from('dossiers').delete().eq('id', strayId)
    throw new Error(
      `CHECK VERIFICATION FAILED: dossiers accepted type='${NON_TYPE}', which dossiers_type_check ` +
        `excluded when this spec was written (7 values: country, organization, forum, engagement, ` +
        `topic, working_group, person). The constraint changed — re-derive it from pg_constraint ` +
        `and update 96-10-CLASSIFICATION.md before trusting any fixture here.`,
    )
  }
  console.warn(`[96-10] CHECK verified live: type='${NON_TYPE}' rejected (${probe.error.code})`)

  // --- The fixture: ONE dossier, minimal insert, NO extension row. ---
  // NOT-NULL-without-default columns are exactly (type, name_en, name_ar); the validate_*_type
  // triggers live on the EXTENSION tables and fire nothing for a dossier that has no extension
  // row. Nothing else is written.
  const inserted = await admin
    .from('dossiers')
    .insert({ type: 'person', name_en: FIXTURE_NAME_EN, name_ar: FIXTURE_NAME_AR })
    .select('id')
    .single()

  if (inserted.error !== null) {
    throw new Error(`FIXTURE INSERT FAILED: ${inserted.error.message} (${inserted.error.code})`)
  }
  fixtureId = (inserted.data as { id: string }).id
  console.warn(`[96-10] fixture dossier inserted: id=${fixtureId} name_en="${FIXTURE_NAME_EN}"`)

  // Pitfall 6: force the refresh rather than trusting staleness luck.
  const refreshed = await admin.rpc('refresh_dossier_list_mv_force')
  if (refreshed.error !== null) {
    throw new Error(`MV FORCE-REFRESH FAILED: ${refreshed.error.message}`)
  }

  // --- The hub-vs-list capture, WITH the fixture present. ---
  // SEAM, stated (condition 7): these are two adjacent service-role reads, not one SQL statement.
  // A `SELECT (…) AS hub, (…) AS list` batch needs a raw-SQL channel, and none is reachable from
  // a Playwright spec on this project — PostgREST cannot express a two-relation scalar batch,
  // `.env.test` carries no connection string, and no exec-SQL RPC exists (checked in pg_proc).
  // The seam is bounded: the two reads are issued back-to-back with no writer in between, and
  // both relations are only written by this spec during the run.
  const hub = await admin
    .from('dossiers')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'person')
  const list = await admin
    .from('dossier_list_mv')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'person')

  if (hub.error !== null) throw new Error(`HUB COUNT FAILED: ${hub.error.message}`)
  if (list.error !== null) throw new Error(`MV COUNT FAILED: ${list.error.message}`)

  hubCount = hub.count ?? -1
  mvCount = list.count ?? -1
  console.warn(`[96-10] with fixture present — hub(dossiers)=${hubCount} list(mv)=${mvCount}`)
})

test.afterAll(async () => {
  // The finally. Runs whatever the tests did; leaves staging as it was found.
  if (fixtureId === '') {
    console.warn('[96-10] no fixture id recorded — nothing to clean')
    return
  }
  const admin = getSupabaseAdmin()
  const { error } = await admin.from('dossiers').delete().eq('id', fixtureId)
  console.warn(
    error === null
      ? `[96-10] fixture cleaned: id=${fixtureId}`
      : `[96-10] CLEANUP FAILED for id=${fixtureId}: ${error.message}`,
  )
  const refreshed = await admin.rpc('refresh_dossier_list_mv_force')
  if (refreshed.error !== null) {
    console.warn(`[96-10] post-cleanup mv refresh failed: ${refreshed.error.message}`)
  }
})

test.describe('criterion 5 — a dossier with no extension row is listed and counted', () => {
  test('the persons list renders the extension-less fixture and agrees with the hub count', async ({
    page,
  }) => {
    // The DB half, from the capture taken adjacent to the insert. The mv is the canonical list's
    // source; if it dropped the fixture, every downstream list would be entitled to.
    expect(hubCount).toBeGreaterThan(0)
    expect(mvCount).toBe(hubCount)

    await signInInline(page)
    await page.goto('/dossiers/persons')

    const grid = personsGrid(page)
    await expect(grid).toBeVisible({ timeout: LIST_TIMEOUT })

    // ONE DOM snapshot holds both halves: the fixture row is present, and the number of rendered
    // rows equals the number of person dossiers the hub counts. Asserting the row count against
    // the hub is the count half — this surface renders no separate total chrome, so the rendered
    // rows ARE its count, and comparing them to `dossiers` is exactly what criterion 5 claims.
    // 17 person dossiers fit inside PERSONS_PAGE_SIZE (20), so page 1 is the whole population.
    const rows = grid.getByRole('listitem')
    await expect(rows.filter({ hasText: FIXTURE_NAME_EN })).toHaveCount(1, {
      timeout: LIST_TIMEOUT,
    })
    await expect(rows).toHaveCount(hubCount, { timeout: LIST_TIMEOUT })
  })

  test('the fixture row renders its absent extension fields as absent, never fabricated', async ({
    page,
  }) => {
    await signInInline(page)
    await page.goto('/dossiers/persons')

    const grid = personsGrid(page)
    await expect(grid).toBeVisible({ timeout: LIST_TIMEOUT })

    const fixtureRow = grid.getByRole('listitem').filter({ hasText: FIXTURE_NAME_EN })
    await expect(fixtureRow).toHaveCount(1, { timeout: LIST_TIMEOUT })

    // Present with its REAL name — the row is not asserted by emptiness, and its identity comes
    // from the dossier row that does exist.
    const rowText = (await fixtureRow.innerText()) ?? ''
    expect(rowText).toContain(FIXTURE_NAME_EN)

    // The forbidden shape (T-96-26): a missing title / organization / importance renders as
    // NOTHING, never as a stringified placeholder. `undefined`/`null`/`NaN` in a cell is the
    // confident-lie class this milestone kills.
    expect(rowText).not.toMatch(/\b(undefined|NaN|null)\b/)
  })
})
