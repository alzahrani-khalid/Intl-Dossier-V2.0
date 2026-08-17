// @covers DEAD-06 (criterion 2)
//
// Phase 96 — truth oracle for /custom-dashboard. Cloned from the proven Phase 95 pattern
// (`95-sandbox-error.spec.ts`): inline auth, `--no-deps`, a bounded settle budget, an
// internal-string regex, a narrowed CDP block with a `requestfailed` instrument test, and
// assertions that live entirely in the DOM.
//
// THE CRITERION. "/custom-dashboard queries columns that exist, renders its chart, and shows
// trend deltas computed from completed requests rather than 0.0% from aborted ones." The second
// half is a statement about what is RENDERED when a comparison request does not complete, so a
// grep cannot close it. The honest render of an unknown delta is an ABSENT row — no placeholder,
// no em-dash, no reserved space styled as data (96-UI-SPEC §2). "0.0%" derived from an aborted
// comparison is the confident-lie class this milestone kills.
//
// ORACLE POPULATION DEFINITION. The observable surface is the app at E2E_BASE_URL (the dev
// server at :5173 by default — single-origin CORS means only :5173 authenticates), project
// chromium-en, signed in inline as TEST_USER. The population is the DEFAULT widget layout: a
// fresh browser context has no `dashboard-widget-layout` in localStorage, so the hook seeds the
// four default KPI widgets (active-dossiers, pending-tasks, overdue-items, completed-this-week)
// plus the chart, upcoming-events, task-list and quick-actions widgets. Outside this population:
// Arabic rendering, custom saved layouts, and the numeric correctness of the chart series
// (covered by the SC4 seam statement, not here).
//
// WHY THESE BLOCK PATTERNS. Two rules combine.
//   (1) TIER (derived fix over 96-UI-SPEC's Verification Notes, which name a `functions/v1` URL):
//       these KPI reads are supabase-js PostgREST calls, so the block must target `/rest/v1/`.
//       `functions/v1` is the wrong tier for this widget and would block nothing.
//   (2) LEG: the pattern is narrowed further to the COMPARISON leg — the request carrying a
//       `<timestamp>=lt.` filter — instead of the whole table path. A table-wide
//       `*/rest/v1/unified_work_items*` block kills each widget's CURRENT count too, so the
//       widget renders the inline error contract and its trend row is absent because the whole
//       widget died. That proves nothing about the trend contract. Blocking only the comparison
//       leg leaves every primary read intact: the values still render, and the trend rows are
//       the only thing missing — which is exactly the claim under test.
//       - `*/rest/v1/unified_work_items*_at=lt.*` matches the pending-tasks comparison
//         (`created_at=lt.…`) and the completed-this-week comparison (`updated_at=lt.…`), and
//         deliberately does NOT match the overdue-items CURRENT read (`deadline=lt.…`).
//       - `*/rest/v1/dossiers*created_at=lt.*` matches the active-dossiers comparison. Without
//         it that widget's comparison would settle and its (truthful) trend row would render,
//         so a page-wide absence assertion would be false — the default layout's KPIs do not all
//         read one table.
//   Neither pattern can blank the SPA (the 95-03 lesson): both are pinned to the Supabase API
//   origin's `/rest/v1/` path, never a dev-server module URL.
//
// Forced errors are NEVER asserted by emptiness: an auth/RLS denial presents as an empty 200.
//
// AUTHENTICATION: inline, from TEST_USER_EMAIL / TEST_USER_PASSWORD, run with --no-deps. The
// Playwright `setup` project throws without six E2E_* keys that .env.test does not carry
// (E2ECRED-01, filed against Phase 101), so no storage-state fixture is usable here.
import { test, expect, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

/** Comparison legs only — never the current counts, never the SPA document. See the header. */
const BLOCKED_WORK_ITEM_COMPARISON = '*/rest/v1/unified_work_items*_at=lt.*'
const BLOCKED_DOSSIER_COMPARISON = '*/rest/v1/dossiers*created_at=lt.*'

// TIMING. Widget queries carry TanStack's default retry/backoff, so a blocked request settles
// well inside this budget while a still-spinning widget at 15s is itself a failure (a pending
// render is not a truthful render of a settled query).
const SETTLE_TIMEOUT = 15_000

/**
 * The copy rule (93-UI-SPEC §Verification Notes): no rendered text may carry a
 * Postgres/PostgREST code, a permission string, the vendor name, or a supabase-js error class.
 * `42703` is the specific one this criterion is about — the phantom `start_datetime` column.
 */
const INTERNAL_STRING =
  /(42501|42703|42P01|permission denied|supabase|FunctionsHttpError|FunctionsFetchError)/i

/** A rendered delta must be a real percentage: digits, optional decimal, then `%`. */
const REAL_PERCENTAGE = /\d+(\.\d+)?%/

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
 * Every data-driven widget has settled. On this page `animate-pulse` belongs only to the widget
 * loading BODIES (KPI, chart, events, task-list, notifications each render one while pending),
 * so zero of them means no widget body is still loading — the precondition for reading absence
 * as a verdict rather than as "not rendered yet".
 *
 * The container's header indicator (`animate-spin`) is deliberately NOT asserted, and the reason
 * is recorded rather than hidden: `WidgetGrid.tsx:215` derives `isLoading` as `!data`, while
 * `fetchWidgetData` legitimately resolves `null` for the quick-actions widget — which therefore
 * spins forever. Observed here, count 1 on both arms. That is a real defect of its own class (a
 * widget dressed as permanently pending) but it is NOT this criterion's subject; asserting it
 * away would red this spec on someone else's bug while saying nothing about trend truth.
 */
const waitForWidgetsToSettle = async (page: Page): Promise<void> => {
  await expect(page.getByText('Pending Tasks').first()).toBeVisible({ timeout: SETTLE_TIMEOUT })
  await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: SETTLE_TIMEOUT })
}

test.describe('criterion 2 — /custom-dashboard renders live columns and only measured trends', () => {
  test('blocked comparison requests leave the trend row ABSENT — never 0.0%', async ({ page }) => {
    await signInInline(page)

    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Network.enable')
    await cdp.send('Network.setBlockedURLs', {
      urls: [BLOCKED_WORK_ITEM_COMPARISON, BLOCKED_DOSSIER_COMPARISON],
    })

    // INSTRUMENT TEST, not the oracle. A pattern that matched nothing would leave every trend
    // row rendering truthfully and the absence assertion below would be measuring an empty
    // force. Record whether the block actually fired; the verdict is still taken from the DOM.
    const blockedComparisons: string[] = []
    page.on('requestfailed', (request) => {
      const url = request.url()
      if (url.includes('/rest/v1/unified_work_items') && url.includes('_at=lt.')) {
        blockedComparisons.push(request.failure()?.errorText ?? 'unknown')
      }
    })

    await page.goto('/custom-dashboard')
    await waitForWidgetsToSettle(page)

    // THE DISCRIMINATOR. No widget failed: every PRIMARY read still landed and every widget
    // rendered its value. Absence of a trend row under a page that died would prove nothing —
    // this is what makes the assertion below a statement about the trend contract.
    await expect(page.getByTestId('widget-error-region')).toHaveCount(0)

    // THE ORACLE. The delta is unknown for every KPI on the page, so no trend row exists at all.
    await expect(page.getByTestId('kpi-trend')).toHaveCount(0)

    // …and the forbidden shape never reaches the DOM by another route (a placeholder elsewhere,
    // a neutral badge, a hardcoded zero delta).
    const bodyText = (await page.locator('body').innerText()) ?? ''
    expect(bodyText).not.toContain('0.0%')
    expect(bodyText).not.toMatch(INTERNAL_STRING)

    // The force was real: at least one comparison died at the NETWORK layer. `inspector` is
    // Chrome's own label for a DevTools-initiated block; matched loosely so a Chrome rename
    // cannot red a correct implementation (95-03 SUMMARY, drill C).
    expect(blockedComparisons.length).toBeGreaterThan(0)
    expect(blockedComparisons[0]).toMatch(/inspector|blocked/i)
  })

  test('unblocked dashboard settles: events region renders and every trend is a real percentage', async ({
    page,
  }) => {
    await signInInline(page)

    await page.goto('/custom-dashboard')
    await waitForWidgetsToSettle(page)

    // THE EVENTS REGION. Before this phase its query selected `calendar_entries.start_datetime`,
    // a column that does not exist — 42703 on every render. It must now settle to one of the
    // truthful shapes: rendered rows, a truthful empty state, or the inline error contract. All
    // three pass; a spinner past the budget (asserted away above) and a leaked internal string
    // (asserted away below) are the untruthful ones.
    await expect(page.getByText('Upcoming Events').first()).toBeVisible({
      timeout: SETTLE_TIMEOUT,
    })
    const eventsError = page
      .getByTestId('widget-error-region')
      .filter({ hasText: 'Upcoming Events' })
    if ((await eventsError.count()) > 0) {
      await expect(eventsError.getByRole('alert')).toBeVisible()
      await expect(eventsError.getByRole('button')).toBeVisible()
    }

    // THE TREND SHAPE. Nothing forces a trend to exist here — a metric with no comparison
    // (overdue-items) or a prior count of zero yields a null trend, and absence is truthful. The
    // claim is about what a PRESENT row says: a real percentage computed from a settled prior
    // count. `0.0%` is legitimate here (a measured no-change); it is only a lie when the
    // comparison did not complete, which is test 1's subject.
    const trends = page.getByTestId('kpi-trend')
    const trendCount = await trends.count()
    test.info().annotations.push({ type: 'kpi-trend-rows', description: String(trendCount) })
    for (let index = 0; index < trendCount; index++) {
      await expect(trends.nth(index)).toHaveText(REAL_PERCENTAGE)
    }

    const bodyText = (await page.locator('body').innerText()) ?? ''
    expect(bodyText).not.toMatch(INTERNAL_STRING)
  })
})
