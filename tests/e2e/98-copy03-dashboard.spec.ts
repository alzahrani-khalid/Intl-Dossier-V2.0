// @covers COPY-03 (criterion 3) [V]
//
// Phase 98 — criterion 3 oracle, the one `[V]` item in the phase. Cloned from
// `96-calendar-family.spec.ts`: header discipline, inline auth, `--no-deps`, narrow CDP block.
//
// THE CRITERION (ROADMAP §Phase 98, criterion 3): no user-facing string instructs the user to
// seed, stage or apply test data. The dashboard digest and VIP widgets speak truthful empty and
// error copy instead.
//
// ORACLE POPULATION DEFINITION. The population is the RENDERED TEXT of two widget regions on
// /dashboard, in FORCED states, at :5173, `chromium-en`, admin, both locale legs:
//
//   [data-testid="dashboard-widget-digest"]      — empty state AND error state
//   [data-testid="dashboard-widget-vip-visits"]  — empty state
//
// EMPTINESS IS FORCED, NEVER ASSUMED. Reading today's data shape as an empty state is the defect
// class this milestone kills: an RLS denial presents as an empty 200, and a widget that happens to
// be empty this morning proves nothing about the empty state's copy. So the empty legs FULFIL the
// data request with `[]` and the error leg BLOCKS the request at the network layer.
//
// WHY THE BLOCK PATTERNS ARE `*/rest/v1/dashboard_digest*` AND `*/rest/v1/rpc/get_upcoming_events*`
// AND NOT SOMETHING BROADER. The 95-03 lesson, recorded there as an observed failure: a pattern
// broad enough to catch the SPA's own module (`*digest*` would match the dev server's
// `/src/pages/Dashboard/widgets/Digest.tsx` module URL) blanks the page, and a spec that "passed"
// against a blank page would be measuring its own block. `useDashboardDigest` reads the
// `dashboard_digest` table through PostgREST; `useVipVisits` → `useUpcomingEvents` calls the
// `get_upcoming_events` RPC. Both patterns hit exactly one request each.
//
// THE EXPECTED VALUES ARE 98-UI-SPEC C3's PRESCRIBED TABLE. They are defaults the repair plan may
// adjust within voice law — but the `/seed|staging|test data/i` clause is not adjustable, and both
// are asserted below. A later plan that legitimately rewords one of the four must update the
// constant here in the same change; that is the point of pinning them.
//
// STATED EXCLUSIONS. This spec asserts nothing about the other dashboard widgets (KPI strip, week
// ahead, overdue, SLA health) — the derived sibling sweep found the seed/staging class confined to
// exactly these four strings, and a widget this oracle does not force is not claimed clean by it.
// Loading states are also out: `WidgetSkeleton` carries no copy.
//
// LOCALE AND ROLE: both legs (`?lng=en`, `?lng=ar`), admin (TEST_USER_EMAIL).
//
// AUTHENTICATION: inline, --no-deps (E2ECRED-01 → P101). See 96-calendar-family.spec.ts.
import { test, expect, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

const SETTLE_TIMEOUT = 20_000
/** The error state waits out three retries with exponential backoff (query-client.ts:30-44). */
const ERROR_STATE_TIMEOUT = 40_000

/** Narrow: the digest table read only — never the SPA module. See the header. */
const BLOCKED_DIGEST = '*/rest/v1/dashboard_digest*'
/** Narrow: the upcoming-events RPC only. */
const VIP_RPC_GLOB = '**/rest/v1/rpc/get_upcoming_events*'
const DIGEST_GLOB = '**/rest/v1/dashboard_digest*'

const DIGEST_REGION = '[data-testid="dashboard-widget-digest"]'
const VIP_REGION = '[data-testid="dashboard-widget-vip-visits"]'

/** The dev/internal vocabulary criterion 3 removes from user copy. */
const DEV_VOCABULARY = /seed|staging|test data/i

/** 98-UI-SPEC C3, the prescribed values. See the header for their status. */
const EXPECTED = {
  en: {
    digestEmptyHeading: 'No publications yet',
    digestEmptyBody: 'New digest publications appear here as they are issued.',
    digestError: 'The digest could not load. Try again.',
    vipEmptyBody: 'No VIP participants to show yet.',
  },
  ar: {
    digestEmptyHeading: 'لا توجد منشورات بعد',
    digestEmptyBody: 'تظهر منشورات الموجز الجديدة هنا عند صدورها.',
    digestError: 'تعذر تحميل الموجز. أعد المحاولة.',
    vipEmptyBody: 'لا يوجد مشاركون من كبار الشخصيات لعرضهم بعد.',
  },
} as const

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

const gotoDashboard = async (page: Page, lng: 'en' | 'ar'): Promise<void> => {
  await page.goto(`/dashboard?lng=${lng}`)
}

test.describe('criterion 3 — the dashboard never instructs the user to seed data', () => {
  test.use({ viewport: { width: 1400, height: 900 } })

  test('the digest EMPTY state is forced and speaks truthful copy', async ({ page }) => {
    await signInInline(page)
    for (const lng of ['en', 'ar'] as const) {
      // FORCED, not assumed: the table read is fulfilled with zero rows.
      let fulfilled = 0
      await page.route(DIGEST_GLOB, async (route) => {
        fulfilled += 1
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '[]',
        })
      })

      await gotoDashboard(page, lng)
      const region = page.locator(DIGEST_REGION)
      await expect(region).toBeVisible({ timeout: SETTLE_TIMEOUT })

      // INSTRUMENT TEST: the force actually fired. Without this a pattern that matched nothing
      // would let the spec measure whatever staging happened to hold.
      expect(fulfilled, `digest read was never intercepted under ${lng}`).toBeGreaterThan(0)

      const text = (await region.innerText()) ?? ''
      expect(text, `digest empty heading under ${lng}`).toContain(EXPECTED[lng].digestEmptyHeading)
      expect(text, `digest empty body under ${lng}`).toContain(EXPECTED[lng].digestEmptyBody)
      expect(text, `digest empty state leaks dev vocabulary under ${lng}`).not.toMatch(
        DEV_VOCABULARY,
      )
      await page.unroute(DIGEST_GLOB)
    }
  })

  test('the digest ERROR state is forced at the network layer and speaks truthful copy', async ({
    page,
  }) => {
    await signInInline(page)
    for (const lng of ['en', 'ar'] as const) {
      const cdp = await page.context().newCDPSession(page)
      await cdp.send('Network.enable')
      await cdp.send('Network.setBlockedURLs', { urls: [BLOCKED_DIGEST] })

      const blocked: string[] = []
      const onFailed = (request: { url: () => string; failure: () => { errorText: string } | null }): void => {
        if (request.url().includes('/rest/v1/dashboard_digest')) {
          blocked.push(request.failure()?.errorText ?? 'unknown')
        }
      }
      page.on('requestfailed', onFailed)

      await gotoDashboard(page, lng)
      const region = page.locator(DIGEST_REGION)
      await expect(region).toBeVisible({ timeout: SETTLE_TIMEOUT })
      await expect(region, `digest error copy under ${lng}`).toContainText(
        EXPECTED[lng].digestError,
        { timeout: ERROR_STATE_TIMEOUT },
      )

      const text = (await region.innerText()) ?? ''
      expect(text, `digest error state leaks dev vocabulary under ${lng}`).not.toMatch(
        DEV_VOCABULARY,
      )

      // The force was real: at least one request died at the NETWORK layer. A 500 is a completed
      // response and fires `requestfinished`, never `requestfailed`.
      expect(blocked.length, `digest request was never blocked under ${lng}`).toBeGreaterThan(0)
      expect(blocked[0]).toMatch(/inspector|blocked/i)

      page.off('requestfailed', onFailed)
      await cdp.send('Network.setBlockedURLs', { urls: [] })
    }
  })

  test('the VIP EMPTY state is forced and speaks truthful copy', async ({ page }) => {
    await signInInline(page)
    for (const lng of ['en', 'ar'] as const) {
      let fulfilled = 0
      await page.route(VIP_RPC_GLOB, async (route) => {
        fulfilled += 1
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '[]',
        })
      })

      await gotoDashboard(page, lng)
      const region = page.locator(VIP_REGION)
      await expect(region).toBeVisible({ timeout: SETTLE_TIMEOUT })
      expect(fulfilled, `VIP RPC was never intercepted under ${lng}`).toBeGreaterThan(0)

      const text = (await region.innerText()) ?? ''
      expect(text, `VIP empty body under ${lng}`).toContain(EXPECTED[lng].vipEmptyBody)
      expect(text, `VIP empty state leaks dev vocabulary under ${lng}`).not.toMatch(DEV_VOCABULARY)
      await page.unroute(VIP_RPC_GLOB)
    }
  })
})
