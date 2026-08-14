import { test, expect } from '@playwright/test'
import { loginForListPages } from './support/list-pages-auth'
import { seedRecentDossierStore } from './support/dossier-drawer-fixture'

// Phase 77-01 (VERIFY-01): the frozen clock MUST align with the today-anchored
// staging seed (b0000002-* engagement_dossiers refreshed to today-relative). The
// WeekAhead widget buckets events by the browser clock (today/tomorrow/this_week/
// next_week) and drops anything outside that window; get_upcoming_events filters
// server-side by real NOW(). Both only overlap when the frozen clock is "today",
// so this constant tracks the capture date (was 2026-05-08 for the 46-01 capture).
const FROZEN_TIME = new Date('2026-07-03T12:00:00Z')

const SUPPRESS_TRANSITIONS_CSS = `
  *, *::before, *::after {
    transition: none !important;
    animation: none !important;
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    scroll-behavior: auto !important;
    caret-color: transparent !important;
  }
  [data-testid$="-skeleton"] { animation: none !important; opacity: 1 !important; }
`

const WIDGETS = [
  ['dashboard-widget-kpi-strip', 'kpi-strip'],
  ['dashboard-widget-week-ahead', 'week-ahead'],
  ['dashboard-widget-overdue-commitments', 'overdue-commitments'],
  ['dashboard-widget-digest', 'digest'],
  ['dashboard-widget-sla-health', 'sla-health'],
  ['dashboard-widget-vip-visits', 'vip-visits'],
  ['dashboard-widget-my-tasks', 'my-tasks'],
  ['dashboard-widget-recent-dossiers', 'recent-dossiers'],
] as const

const READY_SELECTORS: Record<(typeof WIDGETS)[number][0], string> = {
  'dashboard-widget-kpi-strip': '.kpi-value',
  'dashboard-widget-week-ahead': '.week-row',
  'dashboard-widget-overdue-commitments': '.overdue-group',
  'dashboard-widget-digest': '.digest-row',
  'dashboard-widget-sla-health': '.sla-row',
  'dashboard-widget-vip-visits': '.vip-row',
  'dashboard-widget-my-tasks': '.task-row',
  'dashboard-widget-recent-dossiers': '.recent-row',
}

test.beforeEach(async ({ page }) => {
  // Phase 77-01 (VERIFY-01): pin id.theme=light so this pre-swap baseline stays
  // light after the Phase-77 default flips to dark; Phase 80 re-compares
  // like-for-like. Runs before every navigation, before bootstrap.js reads
  // id.theme. Locale is pinned to EN via loginForListPages(page, 'en') below.
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('id.theme', 'light')
    } catch {
      /* storage may be denied in some configs */
    }
  })
  await page.clock.install({ time: FROZEN_TIME })
  await page.addInitScript((css) => {
    const apply = (): void => {
      if (!document.head) {
        setTimeout(apply, 1)
        return
      }
      const tag = document.createElement('style')
      tag.setAttribute('data-test-suppress', 'true')
      tag.textContent = css
      document.head.appendChild(tag)
    }
    apply()
  }, SUPPRESS_TRANSITIONS_CSS)
  await page.setViewportSize({ width: 1280, height: 1000 })
  await seedRecentDossierStore(page)
  await loginForListPages(page, 'en')
  await page.goto('/dashboard')
  await page.waitForSelector('.dash-root')
  await page.waitForFunction(() => document.fonts.ready)
  await page.clock.runFor(100)
})

// FIXTURE-01 (CI-04, 2026-08-13, ruling RUL120) — HONEST QUARANTINE. The seed is deliberately NOT
// restored: these baselines pin mutable staging content, so reseeding deepens the dependency rather
// than removing it (tracked separately as VISUAL-DEBT-01).
//
// Both widgets below render their real empty state, so the readiness assertion on the `.first()`
// row locator fails and the test never reaches `toHaveScreenshot`. That is why `--update-snapshots`
// leaves their baselines byte-unchanged and cannot repair them — verified 2026-08-13 on the macOS
// reference machine, pinned Node v24.5.0. Their committed baselines (captured 2026-07-05 at
// `f2dc476a`, when both widgets had data) are stale and unreachable.
//
// These are DATA/CLOCK debt, not spec debt: `.week-row` still exists at
// `src/pages/Dashboard/widgets/WeekAhead.tsx:65` and `.vip-row` at `VipVisits.tsx:45`. Nothing was
// renamed. Evidence: `.tickmarkr/overseer/CI-04-RESULT.md`.
const FIXTURE_BLOCKED: Partial<Record<(typeof WIDGETS)[number][1], string>> = {
  'week-ahead':
    'FIXTURE-01 — no `.week-row` renders. The widget shows its empty state "No upcoming events" and ' +
    'the KPI strip reads WEEK AHEAD 0. Cause is the double-clock divergence documented at the top of ' +
    'this file: the browser clock is frozen to FROZEN_TIME (2026-07-03) while get_upcoming_events ' +
    'filters SERVER-side by real NOW(), so the rows the server returns fall outside the window the ' +
    'frozen browser clock buckets on, and every one is dropped. The two only overlap when FROZEN_TIME ' +
    'is "today". Reseeding therefore does NOT fix this — re-pinning FROZEN_TIME to the capture date ' +
    'does, and it re-rots the next day. Tracked as VISUAL-DEBT-01.',
  'vip-visits':
    'FIXTURE-01 — no `.vip-row` renders. The widget shows its empty state, which names its own fix ' +
    'verbatim: "No VIP visits with country data. Add VIP participant data to the dashboard seed, then ' +
    'refresh the widget." The dashboard seed carries no VIP participant rows with country data.',
}

for (const [selector, name] of WIDGETS) {
  test(`visual ${name}`, async ({ page }) => {
    const blockedReason = FIXTURE_BLOCKED[name]
    test.fixme(blockedReason !== undefined, blockedReason ?? '')
    await page.waitForSelector(`[data-testid="${selector}"]`)
    const widget = page.getByTestId(selector)
    await expect(widget).toBeVisible()
    await expect(widget.locator(READY_SELECTORS[selector]).first()).toBeVisible({ timeout: 15_000 })
    await expect(widget).toHaveScreenshot(`${name}.png`, {
      animations: 'disabled',
      maxDiffPixelRatio: 0.02,
    })
  })
}
