// @covers DEAD-04
//
// Phase 95 Wave 1 (95-04) — mount + caller-resolution oracle for /monitoring.
//
// WHAT THIS KILLS. `/monitoring` had a real SPA route mounting a real built page, and the browser
// never saw it: `vite.config.ts` proxied the WHOLE `/monitoring` prefix to the Express backend, so
// the document request for `/monitoring` was answered by the backend (raw JSON / a 404 body), not
// by the SPA. The route existed and did not render — the DEAD-04 class.
//
// The fix, ruled in RULING-P95-01-PARK-MONITORING.md (branch a: KEEP the route), moved the API
// under `/api/monitoring` and deleted the proxy entry. That mechanism was chosen against the
// ruling's mechanical caller enumeration: the Dashboard's caller population is exactly 2, and BOTH
// had to keep resolving. A moved prefix with one missed caller turns a rendering page into a
// silently-empty one, which is the same confident lie in a new costume — so this spec asserts the
// mount and the two callers TOGETHER, not the mount alone.
//
// Test 2 also pins the second half of that fix: the page shipped with NO error branch at all
// (`{!health && <p>Loading health...</p>}`), so a backend-absent response rendered "Loading
// health..." forever. Each widget now settles to data or to its own inline QueryErrorState. The
// loading text being gone is exactly that settle — if a widget hangs, the text stays and this
// fails.
//
// AUTHENTICATION: inline, from TEST_USER_EMAIL / TEST_USER_PASSWORD, and run with --no-deps. The
// Playwright `setup` project throws without six E2E_* keys that .env.test does not carry
// (E2ECRED-01, filed against Phase 101), so no storage-state fixture is usable here.
//
// NETWORK: natural. This is a renders-oracle against real dev-stack state, so nothing is blocked
// or stubbed — a green here means the real path resolved.
import { test, expect, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

// TIMING. One budget for both tests. Generous enough to cover the queries' retry ladder
// (query-client.ts retries non-4xx 3x with exponential backoff) so a slow-but-correct settle is
// not read as a hang; still short enough that a widget stuck loading fails rather than waits.
const SETTLE_TIMEOUT = 15_000

/**
 * The copy rule (D-08): no rendered error text may carry a Postgres/PostgREST code, a permission
 * string, a vendor URL/class, or a supabase-js error class. The inline error state renders i18n
 * copy only — a raw server body reaching JSX would trip this.
 *
 * ONE DELIBERATE NARROWING vs the 93-tasks-queue-error regex this is derived from: that spec's
 * bare `supabase` arm cannot be used HERE. This page's health widget lists the monitored services
 * by name and one of them IS named `supabase` (the backend returns database/api/redis/supabase),
 * so the bare vendor name is intended product data on this surface, not a leak — it fired on
 * `supabase: healthy (29 ms)` on the first run. The arm is therefore leak-shaped
 * (`supabase.co` / `supabase-js` / `SupabaseClient`) rather than the bare word. Every other arm is
 * unchanged, and the shapes that actually indicate a leaked server body here — PG codes, a
 * permission string, a supabase-js error class — all still match.
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

test.describe('DEAD-04 /monitoring resolves to the SPA route, and its two callers resolve with it', () => {
  test('the /monitoring document request reaches the SPA, never raw backend JSON', async ({
    page,
  }) => {
    await signInInline(page)

    const response = await page.goto('/monitoring')

    // THE LIE UNDER TEST. While the proxy claimed the prefix this header was the backend's
    // (application/json when the backend answered, text/plain on its 404) — never the SPA's HTML.
    expect(response).not.toBeNull()
    expect(response!.headers()['content-type'] ?? '').toMatch(/^text\/html/)

    // THE CONJUNCT. An HTML document alone proves only that something served a page; the route
    // must actually mount MonitoringDashboard, whose h1 is this heading.
    await expect(page.getByRole('heading', { level: 1, name: 'Monitoring Dashboard' })).toBeVisible({
      timeout: SETTLE_TIMEOUT,
    })
  })

  test('both enumerated API callers resolve in-app and every widget settles', async ({ page }) => {
    await signInInline(page)

    // Attached BEFORE the navigation: the two queries fire on mount, and a listener attached after
    // goto() would miss them and then pass for the wrong reason (nothing observed, nothing failed).
    const health: number[] = []
    const alerts: number[] = []
    page.on('response', (res) => {
      const url = res.url()
      if (url.includes('/api/monitoring/health')) health.push(res.status())
      if (url.includes('/api/monitoring/alerts')) alerts.push(res.status())
    })

    await page.goto('/monitoring')

    // BOTH callers — the ruling's enumerated population of 2, asserted as a population. The alerts
    // call is the one that never worked: it requires an Authorization header the old bare fetch
    // never sent, so a 401 here would mean the move landed but the auth half did not.
    await expect
      .poll(() => health.length > 0 && alerts.length > 0, { timeout: SETTLE_TIMEOUT })
      .toBe(true)
    expect(health[0]).toBe(200)
    expect(alerts[0]).toBe(200)

    // THE SETTLE. Data or inline error — never a widget still claiming to load. This is the
    // perpetual-loading lie the page shipped with.
    await expect(page.getByText('Loading health...')).toHaveCount(0, { timeout: SETTLE_TIMEOUT })
    await expect(page.getByText('Loading alerts...')).toHaveCount(0, { timeout: SETTLE_TIMEOUT })

    const bodyText = (await page.locator('body').innerText()) ?? ''
    expect(bodyText).not.toMatch(INTERNAL_STRING)
  })
})
