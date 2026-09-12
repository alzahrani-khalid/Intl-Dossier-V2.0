import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { loginForListPages } from './support/list-pages-auth'
import { seedRecentDossierStore } from './support/dossier-drawer-fixture'

// P102-15 (CARRY-06, 102-CONTEXT.md D-20): both clocks follow today. The WeekAhead widget buckets
// events by the browser clock (today/tomorrow/this_week/next_week) and drops anything outside that
// window, while get_upcoming_events filters server-side by real NOW(); the two only overlap when the
// frozen clock is "today". A constant (2026-07-03 for the 77-01 capture) re-rotted the next day, so
// FROZEN_TIME is today 12:00Z computed at run time, the beforeAll below moves the seed rows to
// today-relative dates, and the week-ahead date column (`.week-date`) is masked.
const FROZEN_TIME = new Date(new Date().setUTCHours(12, 0, 0, 0))

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

// The browser zone of the two week-ahead tests: UTC-02:00 ("Etc/GMT+2" is the POSIX sign), no DST.
// Engagement b0000002-…-0001 starts at date_trunc('hour', NOW()) + 2 h, so anywhere from D 02:00Z
// to D+1 01:00Z depending on the server hour of the beforeAll. The local day D at UTC-02:00 runs
// from D 02:00Z to D+1 02:00Z, so the row sits under TODAY at every server hour. In the runner's
// zone (+03) it moved to TOMORROW from 19:00Z, and the unmasked group headers moved with it
// (P102-15 att3). The calendar rows (09:00–17:00Z) and the 12:00Z / 18:00Z clocks keep their local
// date. The other widget baselines keep the runner's zone.
const WEEK_AHEAD_TIMEZONE = 'Etc/GMT+2'

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

// The eight updates of supabase/seed/072-p102-today-relative-dashboard-fixtures.sql, on every run:
// the 060-dashboard-demo.sql offsets from date_trunc('hour', NOW()), date_trunc('day', NOW()) and
// CURRENT_DATE. NOW() is the Supabase server clock (the Date header of a service-role request), not
// this runner's clock, because get_upcoming_events filters by the server's NOW(); the truncation is
// in UTC like the database session.
test.beforeAll(async () => {
  const url = process.env.SUPABASE_URL ?? ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  if (url === '' || serviceKey === '') {
    throw new Error(
      'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing from .env.test: the week-ahead seed rows ' +
        'cannot be moved to today, so every dashboard capture would compare against stale dates',
    )
  }
  const db = createClient(url, serviceKey, { auth: { persistSession: false } })
  const probe = await fetch(`${url}/rest/v1/`, {
    method: 'HEAD',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  })
  const now = Date.parse(probe.headers.get('date') ?? '')
  if (Number.isNaN(now)) {
    throw new Error(`re-anchor: ${url}/rest/v1/ sent no Date header (HTTP ${probe.status})`)
  }
  const hour = now - (now % HOUR_MS)
  const day = now - (now % DAY_MS)
  const at = (ms: number): string => new Date(ms).toISOString()
  const on = (days: number): string => at(day + days * DAY_MS).slice(0, 10)
  const updates: Array<[string, string, Record<string, string>]> = [
    [
      'engagement_dossiers',
      'b0000002-0000-0000-0000-000000000001',
      { start_date: at(hour + 2 * HOUR_MS), end_date: at(hour + 4 * HOUR_MS) },
    ],
    [
      'engagement_dossiers',
      'b0000002-0000-0000-0000-000000000002',
      { start_date: at(day + DAY_MS + 10 * HOUR_MS), end_date: at(day + DAY_MS + 12 * HOUR_MS) },
    ],
    [
      'engagement_dossiers',
      'b0000002-0000-0000-0000-000000000003',
      {
        start_date: at(day + 2 * DAY_MS + 14 * HOUR_MS),
        end_date: at(day + 4 * DAY_MS + 16 * HOUR_MS),
      },
    ],
    ['calendar_entries', 'b0000006-0000-0000-0000-000000000001', { event_date: on(0) }],
    ['calendar_entries', 'b0000006-0000-0000-0000-000000000002', { event_date: on(1) }],
    ['calendar_entries', 'b0000006-0000-0000-0000-000000000003', { event_date: on(2) }],
    ['calendar_entries', 'b0000006-0000-0000-0000-000000000004', { event_date: on(3) }],
    ['calendar_entries', 'b0000006-0000-0000-0000-000000000005', { event_date: on(5) }],
  ]
  for (const [table, id, values] of updates) {
    const { data, error } = await db.from(table).update(values).eq('id', id).select('id')
    const rows = data?.length ?? 0
    if (error !== null || rows !== 1) {
      throw new Error(
        `re-anchor ${table} ${id}: ${error?.message ?? `${rows} rows updated, expected 1`}`,
      )
    }
  }
})

// Call after `page.clock.install` so the dashboard's first frame already sees the frozen clock.
async function openDashboard(page: Page): Promise<void> {
  // The frozen clock runs ahead of the wall clock whenever the suite runs before 12:00Z (18:00Z for
  // the second clock of the date-change test). GoTrue stamps `expires_at` from its own clock, so
  // supabase-js read each fresh 3600 s token as already expired and looped on refresh grants to 429
  // and /login (P102-15 att0). With `expires_at` dropped from the token response, auth-js derives it
  // from `expires_in` against the page clock (`_sessionResponse`), so the token lives 3600 s on
  // whichever clock is installed. GoTrue still validates the JWT itself against real time.
  await page.route(/\/auth\/v1\/token\?/, async (route) => {
    const response = await route.fetch()
    const json = (await response.json()) as Record<string, unknown>
    delete json.expires_at
    await route.fulfill({ response, json })
  })
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
}

// FIXTURE-01 (CI-04, 2026-08-13, ruling RUL120) — HONEST QUARANTINE. The seed is deliberately NOT
// restored: these baselines pin mutable staging content, so reseeding deepens the dependency rather
// than removing it (tracked separately as VISUAL-DEBT-01).
//
// The widget below renders its real empty state, so the readiness assertion on the `.first()` row
// locator fails and the test never reaches `toHaveScreenshot`. That is why `--update-snapshots`
// leaves its baseline byte-unchanged and cannot repair it — verified 2026-08-13 on the macOS
// reference machine, pinned Node v24.5.0. Its committed baseline (captured 2026-07-05 at
// `f2dc476a`, when the widget had data) is stale and unreachable. This is DATA debt, not spec debt:
// `.vip-row` still exists at `VipVisits.tsx:45`. Evidence: `.tickmarkr/overseer/CI-04-RESULT.md`.
//
// week-ahead left this list in P102-15 (CARRY-06, D-20). It was blocked by the double-clock
// divergence: the browser clock was frozen to a constant capture date while get_upcoming_events
// filters by real NOW(), so every row fell outside the frozen window. Both sides now follow today:
// FROZEN_TIME is today 12:00Z at run time, the beforeAll re-anchors the b0000002/b0000006 rows to
// today-relative dates (seed 072, the 060 offsets), the `.week-date` column is masked, and the
// browser runs at WEEK_AHEAD_TIMEZONE so no row changes group with the server hour.
const FIXTURE_BLOCKED: Partial<Record<(typeof WIDGETS)[number][1], string>> = {
  'vip-visits':
    'FIXTURE-01 — no `.vip-row` renders. The widget shows its empty state, which names its own fix ' +
    'verbatim: "No VIP visits with country data. Add VIP participant data to the dashboard seed, then ' +
    'refresh the widget." The dashboard seed carries no VIP participant rows with country data.',
}

for (const [selector, name] of WIDGETS) {
  test.describe(() => {
    if (name === 'week-ahead') test.use({ timezoneId: WEEK_AHEAD_TIMEZONE })
    test(`visual ${name}`, async ({ page }) => {
      const blockedReason = FIXTURE_BLOCKED[name]
      test.fixme(blockedReason !== undefined, blockedReason ?? '')
      await page.clock.install({ time: FROZEN_TIME })
      await openDashboard(page)
      await page.waitForSelector(`[data-testid="${selector}"]`)
      const widget = page.getByTestId(selector)
      await expect(widget).toBeVisible()
      await expect(widget.locator(READY_SELECTORS[selector]).first()).toBeVisible({
        timeout: 15_000,
      })
      await expect(widget).toHaveScreenshot(`${name}.png`, {
        animations: 'disabled',
        maxDiffPixelRatio: 0.02,
        mask: name === 'week-ahead' ? [widget.locator('.week-date')] : [],
      })
    })
  })
}

// CARRY-06: the week-ahead capture must match its baseline under two browser clocks on the SAME
// date, today 12:00Z and today 18:00Z, with only the date column masked. Not today+1 (OVERSEER
// ruling after P102-15 att0 measured it): a clock a day ahead reads the 3600 s access token as
// expired, so supabase-js looped on refresh grants until GoTrue answered 429 and the page landed on
// /login; and a shifted date re-buckets the server-anchored rows under other TODAY/TOMORROW/NEXT
// WEEK headers, which sit outside the `.week-date` mask. Day-shift invariance comes from the
// beforeAll re-anchor and is re-proven on every real day the suite runs. The three b0000002
// engagement titles are asserted on `.week-title` before each capture (a bare getByText also
// matches the `.week-meta` copy of the same name), so a match can never come from an empty or
// masked-over widget.
test.describe(() => {
  test.use({ timezoneId: WEEK_AHEAD_TIMEZONE })
  test('dashboard snapshots survive a date change', async ({ context }) => {
    test.slow() // two dashboard loads, one per clock
    for (const time of [FROZEN_TIME, new Date(FROZEN_TIME.getTime() + 6 * HOUR_MS)]) {
      const page = await context.newPage()
      await page.clock.install({ time })
      await openDashboard(page)
      const widget = page.getByTestId('dashboard-widget-week-ahead')
      await expect(widget.locator('.week-row').first()).toBeVisible({ timeout: 15_000 })
      await expect(
        widget.locator('.week-title', { hasText: 'Bilateral consultation — ESCWA' }),
      ).toBeVisible()
      await expect(
        widget.locator('.week-title', { hasText: 'Prep session — G20 Data Gaps Initiative' }),
      ).toBeVisible()
      await expect(
        widget.locator('.week-title', { hasText: 'Delegation visit — Indonesia BPS' }),
      ).toBeVisible()
      const mask = [widget.locator('.week-date')]
      await expect(widget).toHaveScreenshot('week-ahead.png', { mask })
      await page.close()
    }
  })
})
