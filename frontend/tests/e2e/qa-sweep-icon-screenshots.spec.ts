/**
 * Phase 43-05 — Opt-in icon screenshot generator (advisory, NOT a CI gate).
 *
 * Purpose: Regenerable LTR + RTL screenshot pairs for every documented
 * directional icon. Output lives at `docs/rtl-icons/{name}-{ltr|rtl}.png`
 * and is reviewed as PR diffs by the audit-table maintainer (Plan 43-06).
 *
 * Per CONTEXT D-06 + D-10: invoked ONLY via `pnpm -C frontend docs:rtl-icons`,
 * never inside `test:qa-sweep` and never in CI.
 *
 * Per RESEARCH §6.F: 11 fixtures × 2 directions = 22 generated tests. The
 * `.icon-flip` selectors assume Plan 43-07 has migrated the 5 `rotate-180`
 * users to the canonical mechanism — when run before that lands, those
 * fixtures will not find a target and the operator will refresh after the fix.
 */

import { test } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { loginForListPages } from './support/list-pages-auth'

// `frontend/package.json` is `"type": "module"`, so `__dirname` is undefined here.
// Resolve relative to this file's URL to stay CWD-independent.
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const OUT_DIR = path.resolve(__dirname, '..', '..', '..', 'docs', 'rtl-icons')

interface IconFixture {
  name: string
  route: string
  // CSS selector targeting the icon (or its tightest wrapper) to crop.
  selector: string
}

// Minimum viable seed per RESEARCH §6.F. Plan 43-06 may add more if rtl-icons.md grows.
const iconFixtures: IconFixture[] = [
  {
    name: 'chevron-right-table',
    route: '/dossiers/countries',
    selector: 'tbody tr:first-child .icon-flip',
  },
  {
    name: 'chevron-right-list',
    route: '/dossiers/forums',
    selector: 'main [role="list"] li:first-child .icon-flip, main ul li:first-child .icon-flip',
  },
  {
    name: 'arrow-right-vip',
    route: '/dashboard',
    selector: '[data-testid="vip-visits-card"] .icon-flip, .vip-card .icon-flip',
  },
  {
    name: 'arrow-up-right-overdue',
    route: '/dashboard',
    selector: '[data-testid="overdue-commitments"] .icon-flip, .overdue-list .icon-flip',
  },
  {
    name: 'chevron-calendar-nav',
    route: '/calendar',
    selector: '[aria-label*="prev" i] .icon-flip, [aria-label*="next" i] .icon-flip',
  },
  {
    name: 'chevron-right-persons',
    route: '/persons',
    selector:
      '[data-testid="person-card"]:first-child .icon-flip, .person-card:first-child .icon-flip',
  },
  { name: 'sparkline-polyline', route: '/dashboard', selector: 'svg polyline' },
  // Iter-2 additions for full audit-table coverage (W-43-03 closure).
  // Selectors are best-guess; executor may refine if a route's DOM differs.
  {
    name: 'chevron-after-actions',
    route: '/after-actions',
    selector:
      'tbody tr:first-child .icon-flip, [data-testid="after-actions-table"] tr:first-child .icon-flip',
  },
  {
    name: 'chevron-engagement-stage',
    route: '/dashboard',
    selector:
      '[data-testid="engagement-stage-group"] .icon-flip, .engagement-stage .icon-flip, [aria-label*="engagement" i] .icon-flip',
  },
  {
    name: 'chevron-breadcrumb-dossier',
    route: '/dossiers/countries',
    // Targets DossierShell breadcrumb on the listing route (covers both chevrons in §6.A).
    // If the listing route lacks the shell breadcrumb, operator opens a known dossier
    // detail and updates the route here before re-running `pnpm docs:rtl-icons`.
    selector:
      'nav[aria-label*="breadcrumb" i] .icon-flip, [data-testid="dossier-breadcrumb"] .icon-flip',
  },
  {
    name: 'chevron-drawer-cta',
    route: '/dossiers/countries',
    // DrawerCtaRow renders inside an opened drawer; if the selector waits-out
    // untriggered, operator adds a pre-screenshot click step
    // (e.g., `await page.locator('tbody tr').first().click()`).
    selector: '[data-testid="drawer-cta-row"] .icon-flip, .drawer-cta .icon-flip, aside .icon-flip',
  },
]

test.describe('Phase 43 — qa-sweep-icon-screenshots (advisory, opt-in)', () => {
  test.beforeAll(() => {
    fs.mkdirSync(OUT_DIR, { recursive: true })
  })

  for (const icon of iconFixtures) {
    for (const locale of ['en', 'ar'] as const) {
      const direction = locale === 'ar' ? 'rtl' : 'ltr'
      test(`${icon.name} [${direction}]`, async ({ page }) => {
        await loginForListPages(page, locale)
        await page.goto(icon.route)
        await page.waitForLoadState('domcontentloaded')
        await page.waitForTimeout(300) // allow paint + skeleton clear

        const target = page.locator(icon.selector).first()
        await target.waitFor({ state: 'visible', timeout: 5000 })
        await target.screenshot({
          path: path.join(OUT_DIR, `${icon.name}-${direction}.png`),
          animations: 'disabled',
          caret: 'hide',
        })
      })
    }
  }
})
