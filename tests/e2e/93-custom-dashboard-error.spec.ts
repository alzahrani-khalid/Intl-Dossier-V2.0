// @covers TRUST-01
//
// Phase 93 Wave 2 — rendering oracle for the custom dashboard's stats seam (D-02 site 6, D-21
// swallow classes 1 and 2).
//
// WHY A RENDER ORACLE AND NOT A UNIT TEST. `fetchStatsSummary` sits over supabase-js, which NEVER
// rejects: a PostgREST builder RESOLVES with { data, error, count }, so a denied count arrived as
// `count: null` and rendered as a confident 0. Deleting the `catch` alone changed nothing. The fix
// checks each sub-query's `.error` and throws FIRST, and the widgetData aggregation stops
// discarding `isError`. Only forcing the rejection and reading the DOM proves both halves landed.
//
// POPULATION — what this spec blocks, stated because a correct command about the wrong set is this
// milestone's own failure mode:
//   INSIDE:  the two REST tables `fetchStatsSummary` reads — `dossiers` and `unified_work_items`
//            (its four sub-queries are 1x dossiers + 3x unified_work_items). Requests whose path
//            is exactly /rest/v1/<table> are aborted; every other request passes through.
//   OUTSIDE: every other widget fetcher, and the page shell — the shell is asserted only as
//            not-crashing, its own data is not this spec's subject.
//
// THE ISOLATION CONTROL IS `quick-actions`, NOT `upcoming-events`, and the reason is a measured
// defect rather than a preference: `fetchEvents` selects/orders `calendar_entries.start_datetime`,
// a column that DOES NOT EXIST (the table carries `event_date` + `event_time`), so that widget
// 400s on every load and is already in error before this spec blocks anything. Using it as the
// "succeeding sibling" would have made the isolation assertion unsatisfiable for a reason having
// nothing to do with this plan. `quick-actions` issues no request and always resolves, so it is a
// clean control. The broken events query is FILED, not fixed here — this phase makes failures
// visible, it does not make failing features correct.
//
// SCOPING NOTE, measured not assumed: `stats-summary` is NOT one of the eight default widgets and
// WidgetGrid's renderWidget has no case for it, so a default visit never calls fetchStatsSummary
// at all. The layout is therefore seeded into localStorage (`dashboard-widget-layout`, the key the
// hook itself reads) so the stats query actually runs. That the widget's SUCCESS body renders
// "Unknown widget type" is a separate pre-existing gap — named so no reader infers coverage.
//
// AUTHENTICATION: inline, from TEST_USER_EMAIL / TEST_USER_PASSWORD, and run with --no-deps. The
// Playwright `setup` project needs six E2E_* keys .env.test does not carry (E2ECRED-01), and D-20
// forbids depending on it.
import { test, expect, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

// TIMING. An aborted fetch surfaces with no numeric `status`, so query-client.ts's 4xx
// short-circuit never fires and TanStack Query runs its full ladder: 4 attempts at 1s + 2s + 4s.
// `isError` therefore lands at ~7s, past Playwright's default 5s expect timeout. This budget is
// retry backoff, not flakiness — a CORRECT implementation fails the default timeout.
const RETRY_BACKOFF_TIMEOUT = 15_000

/** The tables `fetchStatsSummary` reads. Nothing else is blocked. */
const STATS_TABLES = ['dossiers', 'unified_work_items']

const STATS_WIDGET_TITLE = 'Stats summary probe'
const CONTROL_WIDGET_TITLE = 'Quick actions probe'

/** The key `useWidgetDashboard` loads its layout from (STORAGE_KEY in that hook). */
const LAYOUT_STORAGE_KEY = 'dashboard-widget-layout'

const PROBE_LAYOUT = [
  {
    id: 'p93-08-stats',
    type: 'stats-summary',
    title: STATS_WIDGET_TITLE,
    size: 'medium',
    refreshInterval: 0,
    isVisible: true,
    order: 0,
    settings: { metrics: [], layout: 'grid', showTrends: false },
  },
  {
    id: 'p93-08-actions',
    type: 'quick-actions',
    title: CONTROL_WIDGET_TITLE,
    size: 'medium',
    refreshInterval: 0,
    isVisible: true,
    order: 1,
    settings: { actions: [] },
  },
]

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

test.describe('TRUST-01 custom dashboard stats failure is rendered as failure', () => {
  test('blocked stats sub-queries render the inline error, never zeros, sibling intact', async ({
    page,
  }) => {
    await signInInline(page)

    // Seed the layout the hook reads on mount, so the stats query is actually issued.
    await page.evaluate(
      ([key, layout]) => window.localStorage.setItem(key as string, layout as string),
      [LAYOUT_STORAGE_KEY, JSON.stringify(PROBE_LAYOUT)],
    )

    // Abort ONLY the stats tables. A predicate, not a URL glob: these are
    // /rest/v1/<table>?select=id&... count queries and the table name is the whole population.
    await page.route('**/rest/v1/**', async (route) => {
      const path = new URL(route.request().url()).pathname
      if (STATS_TABLES.some((table) => path === `/rest/v1/${table}`)) {
        await route.abort()
        return
      }
      await route.continue()
    })

    await page.goto('/custom-dashboard')

    // Every assertion below is on the DOM. None reads a response status.
    const statsRegion = page
      .getByTestId('widget-error-region')
      .filter({ hasText: STATS_WIDGET_TITLE })

    await expect(statsRegion).toBeVisible({ timeout: RETRY_BACKOFF_TIMEOUT })
    await expect(statsRegion.getByTestId('query-error-inline')).toBeVisible({
      timeout: RETRY_BACKOFF_TIMEOUT,
    })
    // The retry affordance lives inside the failed region, not floating elsewhere.
    await expect(statsRegion.getByRole('button', { name: /try again/i })).toBeVisible()

    // The whole point: no digit-0 chrome anywhere in the stats region. A zero here would assert
    // four facts the app does not have — the counts are unknown, not zero.
    await expect(statsRegion.getByText(/^\s*0\s*$/)).toHaveCount(0)

    // Per-widget isolation: the control widget must render its normal card and must NOT be swept
    // into an error region by its failed sibling.
    await expect(
      page.getByTestId('widget-error-region').filter({ hasText: CONTROL_WIDGET_TITLE }),
    ).toHaveCount(0)
    await expect(
      page.locator('[data-slot="card"]').filter({ hasText: CONTROL_WIDGET_TITLE }),
    ).toBeVisible({ timeout: RETRY_BACKOFF_TIMEOUT })

    // The page shell still renders — one failed region is not a full-page crash.
    await expect(page.getByText('Custom Dashboard', { exact: true }).first()).toBeVisible()
  })
})
