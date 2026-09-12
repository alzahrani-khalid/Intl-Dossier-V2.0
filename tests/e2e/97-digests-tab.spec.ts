// @covers NAV-03
//
// Phase 97 Wave 1 (97-02) — click-through oracle for the engagement workspace Digests tab.
//
// WHAT THIS KILLS. The route already exists — `routes/_protected/engagements/$engagementId/
// digests.tsx` lazy-loads `components/intelligence/DigestsTab.tsx` — and
// `components/workspace/WorkspaceTabNav.tsx:26-35` never lists it, so nothing in the product
// reaches the page. The failure this spec exists to prevent is the CHEAP fix: appending
// `{ key: 'digests', … }` to `WORKSPACE_TABS` and declaring criterion 3 met. A tab entry present
// in an array but never clicked is a data-structure claim, and D-10 forbids exactly that. So this
// spec clicks the REAL rendered tab and requires DigestsTab's own content on screen afterwards.
//
// It also pins the bar's selection invariant. `WorkspaceTabNav` computes `aria-selected` from
// `matchRoute({ fuzzy: true })` per entry, so a new entry whose path prefixes or is prefixed by a
// sibling's lights up two tabs at once. A tab bar with two selected tabs is a navigation lie, and
// it is the specific way appending an entry goes wrong.
//
// ENGAGEMENT ID: derived, never hardcoded. The spec clicks the first row of the TOP-LEVEL
// /engagements list — that mount navigates to /engagements/$engagementId/overview, while the
// /dossiers/engagements mount passes `onEngagementOpen` and opens a peek drawer instead, so it is
// the wrong door for this oracle. The id is read back out of the resulting URL. An empty list is
// UNABLE TO MEASURE and throws by name; it is never allowed to read as a pass.
//
// AUTHENTICATION: inline, from TEST_USER_EMAIL / TEST_USER_PASSWORD, and run with --no-deps. The
// Playwright `setup` project throws without six E2E_* keys that .env.test does not carry
// (E2ECRED-01, filed against Phase 101), so no storage-state fixture is usable here.
//
// NETWORK: natural. This is a reachability oracle against real dev-stack state, so nothing is
// blocked or stubbed — a green here means the real path resolved.
//
// EXPECTED RED until 97-08 appends the WORKSPACE_TABS entry and the `workspace:tabs.digests` key
// in BOTH locales. The red of record is "no tab named Digests", not a missing engagement.
import { test, expect, type Locator, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

// TIMING. One budget for every settle here. Generous enough to cover the digests query's retry
// ladder plus the route's lazy() chunk fetch, so a slow-but-correct mount is not read as a hang.
const SETTLE_TIMEOUT = 15_000

/**
 * The leak regex, reused UNWIDENED from `95-monitoring-mounts.spec.ts:54-55` (T-97-05). Its one
 * deliberate narrowing — leak-shaped `supabase.co` / `supabase-js` / `SupabaseClient` rather than
 * the bare vendor word — is kept as-is: widening it back would require re-checking this surface's
 * product copy first, and nothing here needs the wider arm.
 */
const INTERNAL_STRING =
  /(42501|42703|42P01|permission denied|supabase\.co|supabase-js|SupabaseClient|FunctionsHttpError|FunctionsFetchError)/i

/**
 * Tab labels are asserted as the RENDERED accessible names, not as `labelKey` strings — a key that
 * resolves to nothing renders the raw key, and that must fail. `workspace:tabs.signals` ships as
 * "Signals"; `workspace:tabs.digests` is the ONE new key 97-08 adds, spec'd as "Digests" (verbatim
 * from the shipped `intelligence-digests:tab.label`).
 */
const SIGNALS_TAB_LABEL = 'Signals'
const DIGESTS_TAB_LABEL = 'Digests'

/** `DigestsTab` ships NO data-testid, so its content is pinned by two rendered strings. */
const DIGESTS_HEADING = 'Digests'
const DIGESTS_SUBSCRIPTIONS_SUMMARY = 'Your subscriptions'

/** `common:errors.queryFailed.title` — the shared P93 query-error heading. */
const QUERY_ERROR_TITLE = 'Unable to load data'

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
 * Open the first engagement's workspace through the REAL rendered row and return its id.
 *
 * A list with no rows is a PRECONDITION failure, not a subject failure: it is thrown by name so the
 * run reads as UNABLE TO MEASURE (C2) instead of quietly passing on nothing observed. The throw also
 * names WHICH of the two causes it saw — an empty fixture, or the shared query-error state — because
 * those route to different owners.
 */
const openFirstEngagementWorkspace = async (page: Page): Promise<string> => {
  await page.goto('/engagements')

  const rows = page.locator('[data-testid="engagement-row"]')
  try {
    await expect.poll(() => rows.count(), { timeout: SETTLE_TIMEOUT }).toBeGreaterThan(0)
  } catch {
    // The two causes route to different owners, so name which one: an EMPTY list is seeding work,
    // the shared query-error state means the read path failed and seeding fixes nothing.
    const errored = await page.getByText(QUERY_ERROR_TITLE).count()
    const cause =
      errored > 0
        ? `the list rendered its shared query-error state ("${QUERY_ERROR_TITLE}"), so the READ PATH failed — NOT an empty fixture`
        : 'the list settled EMPTY with no error state — a seeding gap'
    throw new Error(
      `DATA-PRECONDITION UNMET for engagements: /engagements settled with zero rows — ${cause}. ` +
        'No engagement workspace can be opened, so the Digests tab claim is UNABLE TO MEASURE. ' +
        'This is never a pass.',
    )
  }

  await rows.first().click()
  await expect(page).toHaveURL(/\/engagements\/[^/]+\/overview/, { timeout: SETTLE_TIMEOUT })

  const id = new URL(page.url()).pathname.split('/')[2] ?? ''
  if (id === '') {
    throw new Error(`UNABLE TO MEASURE: no engagement id in ${new URL(page.url()).pathname}`)
  }
  return id
}

/** The workspace tab bar — `<nav role="tablist">` with the i18n aria-label at `:67-71`. */
const tabBar = (page: Page): Locator =>
  page.getByRole('tablist', { name: 'Engagement workspace tabs' })

test.describe('NAV-03 the engagement Digests tab is in the tab bar and reaches DigestsTab', () => {
  // The titles below name viewport 1400, so the viewport IS 1400 — the analyst-workstation width
  // from the root CLAUDE.md, not the 1280 Desktop Chrome default.
  test.use({ viewport: { width: 1400, height: 900 } })

  test('Digests tab follows Signals and mounts DigestsTab — admin user (the only session these specs have), desktop 1400', async ({
    page,
  }) => {
    await signInInline(page)
    const engagementId = await openFirstEngagementWorkspace(page)

    const bar = tabBar(page)
    await expect(bar).toBeVisible({ timeout: SETTLE_TIMEOUT })

    // POSITION, not mere presence: the UI-SPEC places the entry after `signals` (intelligence
    // grouping). Read the rendered order once and assert adjacency against it.
    const labels = await bar.getByRole('tab').allInnerTexts()
    expect(labels).toContain(DIGESTS_TAB_LABEL)
    expect(labels.indexOf(DIGESTS_TAB_LABEL)).toBe(labels.indexOf(SIGNALS_TAB_LABEL) + 1)

    // THE CLICK. Never page.goto — goto proves the route mounts and proves nothing about
    // reachability, which is the whole claim (D-10).
    const digestsTab = bar.getByRole('tab', { name: DIGESTS_TAB_LABEL })
    await expect(digestsTab).toBeVisible()
    await digestsTab.click()

    await expect(page).toHaveURL(new RegExp(`/engagements/${engagementId}/digests`), {
      timeout: SETTLE_TIMEOUT,
    })

    // THE DESTINATION SETTLES. `DigestsTab` carries no testid, so its two unconditional strings
    // are the pin: the h2 header and the subscriptions disclosure. Both survive an empty digest
    // list, so this asserts the component mounted — not that it happened to have data.
    await expect(page.getByRole('heading', { level: 2, name: DIGESTS_HEADING })).toBeVisible({
      timeout: SETTLE_TIMEOUT,
    })
    await expect(page.getByText(DIGESTS_SUBSCRIPTIONS_SUMMARY)).toBeVisible({
      timeout: SETTLE_TIMEOUT,
    })

    const bodyText = (await page.locator('body').innerText()) ?? ''
    expect(bodyText).not.toMatch(INTERNAL_STRING)
  })

  test('exactly one tab is selected on the digests route — admin user (the only session these specs have), desktop 1400', async ({
    page,
  }) => {
    await signInInline(page)
    await openFirstEngagementWorkspace(page)

    const bar = tabBar(page)
    await expect(bar).toBeVisible({ timeout: SETTLE_TIMEOUT })
    await bar.getByRole('tab', { name: DIGESTS_TAB_LABEL }).click()

    // THE INVARIANT. `aria-selected` comes from a per-entry fuzzy matchRoute, so an appended entry
    // that overlaps a sibling's path selects two tabs at once. Asserting the count as a POPULATION
    // is what catches it — asserting only that Digests is selected would pass on that bug.
    const selected = bar.getByRole('tab', { selected: true })
    await expect(selected).toHaveCount(1, { timeout: SETTLE_TIMEOUT })
    await expect(selected).toHaveText(DIGESTS_TAB_LABEL)

    const bodyText = (await page.locator('body').innerText()) ?? ''
    expect(bodyText).not.toMatch(INTERNAL_STRING)
  })
})
