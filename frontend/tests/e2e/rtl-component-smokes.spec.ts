// Phase 80 Plan 80-06 (FOUC-02) — RTL component smokes: Popover / Pagination / Sidebar.
//
// Fills the three FOUC-02 coverage gaps that direction-portals.spec.ts (Phase 76,
// proven green) does NOT cover — it verifies dropdown-menu / Sheet drawer / tooltip
// portals. This spec is the same pattern family and asserts the same way:
//
//   DOM + computed-style assertions ONLY — ZERO toHaveScreenshot.
//
// (The committed visual baselines are `-darwin`-named; this spec must run identically
// on ubuntu CI, so it reads computed `direction` / getBoundingClientRect geometry /
// the computed rotation, never pixels.)
//
// Determinism (mirrors direction-portals + the shared determinism stack):
//   - 1280x800 viewport in beforeEach
//   - loginForListPages(page, 'ar') seeds id.locale=ar and BLOCKS until the live DOM is
//     <html dir="rtl" lang="ar"> (so the Radix DirectionProvider bridge has committed)
//   - await document.fonts.ready before every geometry read
//   - deterministic waitFor({ state: 'visible' }) before interaction — never waitForTimeout
//   - describe-level retries: 1 (matches direction-portals)
import { test, expect } from '@playwright/test'
import { loginForListPages } from './support/list-pages-auth'

test.describe.configure({ retries: 1 })

test.describe('RTL component smokes — Popover / Pagination / Sidebar (FOUC-02)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
  })

  // (1) Popover — the live shell has NO ui/popover.tsx consumer (the Topbar bell is a
  // stub button; the mounted shell is Topbar.tsx, not the unmounted Header.tsx that
  // hosts NotificationPanel). The audit-logs filter bar is the reliable route-level
  // consumer: `/audit-logs` (admin-gated — the local test user is admin, CI uses
  // E2E_ADMIN_*) renders AuditLogFilters UNCONDITIONALLY (above the loading/error
  // boundary) with 4 Popover filter buttons. The first data-slot="popover-trigger" is
  // the Table filter; opening it yields data-slot="popover-content". A Radix portal
  // inherits the Phase-76 DirectionProvider bridge → the content computes direction: rtl.
  test('Popover portal content is RTL and on-viewport in AR', async ({ page }) => {
    await loginForListPages(page, 'ar')
    await page.goto('/audit-logs')

    const trigger = page.locator('[data-slot="popover-trigger"]').first()
    await trigger.waitFor({ state: 'visible', timeout: 15_000 })
    await trigger.click()

    const content = page.locator('[data-slot="popover-content"]').first()
    await expect(content).toBeVisible()
    await page.evaluate(() => document.fonts.ready)

    const vw = page.viewportSize()!.width
    const geo = await content.evaluate((el) => {
      const rect = el.getBoundingClientRect()
      return {
        dir: getComputedStyle(el as HTMLElement).direction,
        left: rect.left,
        width: rect.width,
      }
    })
    // Load-bearing: the portalled popover inherits the RTL bridge.
    expect(geo.dir).toBe('rtl')
    // Positioned sanely (a real box whose horizontal center sits on-viewport, not
    // collapsed and not pushed off-screen).
    expect(geo.width).toBeGreaterThan(0)
    const centerX = geo.left + geo.width / 2
    expect(centerX).toBeGreaterThan(0)
    expect(centerX).toBeLessThan(vw)
  })

  // (2) Pagination — `/users` (UsersListPage) is the sole live `ui/pagination.tsx`
  // consumer (76-SRTL02-VERIFICATION §2). The route is admin-gated (requireAdmin);
  // the local test user is admin and CI supplies E2E_ADMIN_*. The prev/next controls
  // render UNCONDITIONALLY (no >1-page branch), and each chevron carries the
  // `rtl:rotate-180` utility, so under AR the chevron is rotated a half-turn.
  test('Pagination chevrons are 180deg-rotated under AR on /users', async ({ page }) => {
    await loginForListPages(page, 'ar')
    await page.goto('/users')

    const prev = page.locator('a[aria-label="Go to previous page"]')
    await prev.waitFor({ state: 'visible', timeout: 15_000 })
    await page.evaluate(() => document.fonts.ready)

    // Tailwind v4 may emit `rtl:rotate-180` as the standalone CSS `rotate` property
    // rather than a composed `transform` matrix — read both so the proof is robust
    // to either representation.
    const rot = await prev
      .locator('svg')
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el as unknown as HTMLElement)
        return { transform: cs.transform, rotate: cs.rotate }
      })
    const rotatedHalfTurn =
      rot.rotate === '180deg' || rot.transform === 'matrix(-1, 0, 0, -1, 0, 0)'
    expect(rotatedHalfTurn, `prev chevron not 180deg-rotated in AR: ${JSON.stringify(rot)}`).toBe(
      true,
    )

    // The pagination nav itself resolves RTL.
    const navDir = await page
      .locator('nav[aria-label="pagination"]')
      .first()
      .evaluate((el) => getComputedStyle(el as HTMLElement).direction)
    expect(navDir).toBe('rtl')
  })

  // (3) Sidebar — the live shell rail is layout/Sidebar.tsx, wrapped by AppShell's
  // 16rem grid-column <aside class="sidebar appshell-aside hidden lg:block ...">, NOT
  // the unmounted shadcn ui/sidebar.tsx. `aside.appshell-aside` is the UNIQUE rail
  // container (plain `aside.sidebar` also matches the inner nav element). In AR the
  // rail is grid column 1 = inline-start = the physical RIGHT edge, so its right edge
  // hugs the viewport width. At 1280px (>= the lg desktop band) it is a static 256px
  // column, not the < lg drawer.
  test('Sidebar rail hugs the physical right edge in AR', async ({ page }) => {
    await loginForListPages(page, 'ar')
    await page.goto('/dashboard')

    const rail = page.locator('aside.appshell-aside')
    await rail.waitFor({ state: 'visible', timeout: 15_000 })
    await page.evaluate(() => document.fonts.ready)

    const box = await rail.boundingBox()
    expect(box).not.toBeNull()
    const vw = page.viewportSize()!.width
    // inline-start resolves to the physical RIGHT edge under RTL → the rail's right
    // edge lands on the viewport's right edge.
    expect(Math.round(box!.x + box!.width)).toBe(vw)
    // Sanity: the real ~256px (16rem) rail, not a zero-width sliver.
    expect(box!.width).toBeGreaterThan(200)
  })
})
