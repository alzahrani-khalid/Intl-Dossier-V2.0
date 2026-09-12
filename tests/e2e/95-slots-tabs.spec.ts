// @covers DEAD-08
//
// Phase 95 (95-05) — behavioural oracle for success criterion 5: one owner per slot, URL-driven
// tabs, legislation detail reachable.
//
// WHAT THIS KILLS. At the pre-fix HEAD, `positions/$id.tsx` rendered its three tabs from local
// `defaultValue="editor"` state and had NO <Outlet/>, so `$id/approvals.tsx` and
// `$id/versions.tsx` were registered in the route tree but never rendered — deep-linking
// /positions/:id/approvals showed the editor with the editor tab selected. `legislation.tsx` had
// the same defect: no <Outlet/>, so /legislation/<id> silently rendered the LIST. A URL that
// shows something other than what it names is the lie all three tests assert against.
// A second dynamic slot, `positions/$positionId.tsx`, registered the same level as `$id`, making
// which file won at /positions/<uuid> rank-order-undefined; it was deleted.
//
// (a) DATA PRECONDITION. Tests 1-2 need at least one position in a status that actually RENDERS
// the approvals trigger. The trigger is conditional ($id.tsx, APPROVALS_TAB_STATUSES =
// under_review / approved / published), so a draft-only database cannot exercise this criterion
// at all. The spec derives a REAL position id by filtering the list to those statuses and
// clicking through — never a hardcoded id, which would pass for the wrong reason. If no such
// position exists the test fails with a NAMED message rather than skipping silently: a truthful
// red that says which statuses are missing.
//
// (b) DEFINED DEEP-LINK-WITHOUT-TRIGGER BEHAVIOUR. /positions/:id/approvals for a position whose
// status is OUTSIDE that set must not select a tab the strip does not offer. The approvals child
// replace-redirects to the editor index, so URL and strip can never disagree. Test 2 asserts this
// opportunistically — only when the list also yields an out-of-set position; when staging has
// none, the SUMMARY records it as defined-but-not-oracled rather than pretending it was checked.
//
// AUTHENTICATION: inline, from TEST_USER_EMAIL / TEST_USER_PASSWORD, run with --no-deps. The
// Playwright `setup` project throws without six E2E_* keys that .env.test does not carry
// (E2ECRED-01), so no storage-state fixture is usable here — same posture as
// 93-report-notfound.spec.ts.
import { test, expect, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

// One worker for this file. Each test signs in inline with the SAME fixture account, and three
// concurrent sign-ins of one account leave every page parked on /login — measured: under the
// config's `fullyParallel: true` all three tests failed at the login assertion, at one worker they
// reach the app. `default` (not `serial`) is deliberate: it drops the parallelism without adopting
// serial's skip-the-rest-on-first-failure coupling, which would let one red hide two untested
// criteria.
test.describe.configure({ mode: 'default' })

/** The statuses whose positions render the approvals trigger (mirrors APPROVALS_TAB_STATUSES). */
const TRIGGER_STATUSES = ['under_review', 'approved', 'published'] as const

const NO_IN_SET_POSITION =
  'DATA PRECONDITION: no position in under_review/approved/published on staging'

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
 * Derive a REAL position id by visiting the library filtered to `status` and opening the first
 * row. Returns null when that status has no rows, so callers can distinguish "no such position"
 * from "navigation broke".
 */
const firstPositionIdWithStatus = async (page: Page, status: string): Promise<string | null> => {
  await page.goto(`/positions?status=${status}`)
  // Scoped to the positions grid by its aria-label. A bare getByRole('listitem') also matches the
  // AppShell's nav <li>s, which appear first in the DOM — clicking one navigated to /dashboard.
  const rows = page.getByRole('list', { name: /positions list/i }).getByRole('listitem')
  await expect(rows.first().or(page.getByText(/no positions|no results/i)).first()).toBeVisible({
    timeout: 20_000,
  })
  if ((await rows.count()) === 0) return null

  // The card's own "View" affordance. The listitem wrapper is NOT clickable — PositionCard puts
  // onClick on the title and on this footer button, so clicking the wrapper did nothing.
  await rows.first().getByRole('button', { name: /^view\b/i }).first().click()
  await expect(page).toHaveURL(/\/positions\/[^/?]+/, { timeout: 20_000 })
  return new URL(page.url()).pathname.split('/')[2] ?? null
}

/** The first position id in ANY trigger-rendering status, or null if staging has none. */
const inSetPositionId = async (page: Page): Promise<string | null> => {
  for (const status of TRIGGER_STATUSES) {
    const id = await firstPositionIdWithStatus(page, status)
    if (id !== null) return id
  }
  return null
}

test.describe('DEAD-08 one owner per slot, and the URL names what the page shows', () => {
  test('deep-linked approvals opens that tab, and back moves tab state without remounting the header', async ({
    page,
  }) => {
    await signInInline(page)

    const id = await inSetPositionId(page)
    expect(id, NO_IN_SET_POSITION).not.toBeNull()

    // THE DEEP LINK. Pre-fix this rendered the editor (no <Outlet/>, tab from local state).
    await page.goto(`/positions/${id}/approvals`)

    const approvalsTab = page.getByRole('tab', { name: /approvals/i })
    const versionsTab = page.getByRole('tab', { name: /versions/i })
    await expect(approvalsTab).toHaveAttribute('aria-selected', 'true', { timeout: 20_000 })

    // Hold the live header node: if the tab strip remounts the page header, React detaches this
    // exact element and `isConnected` goes false. Same-instance is the assertion, not same-text.
    const header = await page.locator('h1').first().elementHandle()
    expect(header).not.toBeNull()

    // The path is what is asserted; the `/positions` layout's validateSearch defaults
    // (sort/order) ride along as a query string on every in-app navigation.
    await versionsTab.click()
    await expect(page).toHaveURL(/\/positions\/[^/]+\/versions(\?|$)/, { timeout: 20_000 })
    await expect(versionsTab).toHaveAttribute('aria-selected', 'true')

    // BACK MOVES TAB STATE — the tab is URL state, so history owns it.
    await page.goBack()
    await expect(page).toHaveURL(/\/positions\/[^/]+\/approvals(\?|$)/, { timeout: 20_000 })
    await expect(approvalsTab).toHaveAttribute('aria-selected', 'true')

    // THE HEADER NEVER REMOUNTED across both navigations.
    expect(await header!.evaluate((el: Element) => el.isConnected)).toBe(true)
  })

  test('selecting a tab from the editor navigates, and an out-of-set deep link redirects', async ({
    page,
  }) => {
    await signInInline(page)

    const id = await inSetPositionId(page)
    expect(id, NO_IN_SET_POSITION).not.toBeNull()

    await page.goto(`/positions/${id}`)
    const editorTab = page.getByRole('tab', { name: /editor/i })
    await expect(editorTab).toHaveAttribute('aria-selected', 'true', { timeout: 20_000 })

    const approvalsTab = page.getByRole('tab', { name: /approvals/i })
    await approvalsTab.click()
    await expect(page).toHaveURL(/\/positions\/[^/]+\/approvals(\?|$)/, { timeout: 20_000 })
    await expect(approvalsTab).toHaveAttribute('aria-selected', 'true')
    // The panel really rendered — the approvals child's own content, not just a URL change.
    await expect(page.getByText(/approval progress|approval history/i).first()).toBeVisible({
      timeout: 20_000,
    })

    // OPPORTUNISTIC (b): only when staging also has an out-of-set position. A draft hides the
    // approvals trigger, so the URL must not survive — it replace-redirects to the editor index.
    const draftId = await firstPositionIdWithStatus(page, 'draft')
    // Annotated either way, so the run itself says whether this arm was exercised — an untaken
    // branch that leaves no trace reads as "asserted" in a report and is exactly how a criterion
    // gets recorded as covered without ever being checked.
    test.info().annotations.push({
      type: 'out-of-set-deep-link',
      description:
        draftId !== null
          ? 'asserted: redirect from an out-of-set (draft) position'
          : 'defined-but-not-oracled: no out-of-set position on staging',
    })
    if (draftId !== null) {
      await page.goto(`/positions/${draftId}/approvals`)
      await expect(page).toHaveURL(new RegExp(`/positions/${draftId}(\\?|$)`), { timeout: 20_000 })
      // Settle on the strip before asserting the trigger's absence, so the count-0 check cannot
      // pass merely because the tabs had not rendered yet.
      await expect(page.getByRole('tab', { name: /editor/i })).toHaveAttribute(
        'aria-selected',
        'true',
        { timeout: 20_000 },
      )
      await expect(page.getByRole('tab', { name: /approvals/i })).toHaveCount(0)
    }
  })

  test('legislation detail renders its own surface instead of the list', async ({ page }) => {
    await signInInline(page)

    // Well-formed and (with overwhelming probability) absent. Never a hardcoded id: a seeded row
    // would make this pass for the wrong reason.
    const absentId = crypto.randomUUID()
    await page.goto(`/legislation/${absentId}`)

    // ORDER MATTERS. The positive assertion runs FIRST so the page has actually rendered before
    // the absence checks: `toHaveCount(0)` against a still-blank page passes vacuously and would
    // make this test green for the wrong reason. Measured on the pre-fix build — the list heading
    // and create button were absent when the count assertions ran and present moments later.
    await expect(page.getByText(/legislation not found/i).first()).toBeVisible({ timeout: 20_000 })

    // THE LIE UNDER TEST, checked on a settled page. Pre-fix `legislation.tsx` had no <Outlet/>,
    // so this URL rendered the LIST — its heading and create button are exactly what must not be
    // here now.
    await expect(page.getByRole('heading', { name: /legislation tracker/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /add legislation/i })).toHaveCount(0)

    // ...and the index child still serves the list, so the split did not cost the list page.
    await page.goto('/legislation')
    await expect(page.getByRole('heading', { name: /legislation tracker/i }).first()).toBeVisible({
      timeout: 20_000,
    })
  })
})
