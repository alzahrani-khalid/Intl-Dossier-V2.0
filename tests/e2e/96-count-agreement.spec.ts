// @covers COUNT-01 (criterion 4)
//
// Phase 96 · 96-07 — the same-clock agreement oracle for work-item counts. Criterion 4 says the
// same work yields the same number across the surfaces that claim to count it. That is a statement
// about a MOMENT, so every claim below is either one DOM snapshot, or adjacent same-clock calls
// with the seam written down. No cross-time screenshot pair is ever the evidence (D-16).
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// POPULATION DEFINITION (D-15) — what this oracle compares, and what it does not
// ─────────────────────────────────────────────────────────────────────────────────────────────
// COMPARED: the dashboard KPI strip · /my-work (badge + footer total + rendered rows) ·
//           /commitments tabs · the kanban board (/kanban) and its column counts.
// OUTSIDE:  /custom-dashboard widgets (they share the view but are stated outside the set) ·
//           the analytics populations (dossier_interactions / assignments — 96-06) ·
//           external-owner commitments (`unified_work_items` requires owner_user_id IS NOT NULL,
//           a view seam that stays) · unassigned or soft-deleted tasks (assignee_id IS NOT NULL
//           AND is_deleted = false, the same) · archived/deleted work.
//
// KANBAN RECONCILIATION RULE (the 96-02 seam, stated where it is compared). After 96-02 the
// board's TOTAL population includes completed rows (`status <> 'cancelled'`, so Done fills), which
// is structurally unequal to the active-work surfaces. The kanban leg therefore compares the
// SAME-WORK SUBSET: the board's ACTIVE population — rows in columns excluding Done (cancelled is
// never returned by the RPC) — against the /my-work active count, same-clock as ADJACENT calls,
// with the completed-rows-in-Done seam AND the identity seam stated. The kanban is IN the compared
// set and its number is MEASURED here, never claimed without measurement.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// THE SEAMS, ALL OF THEM, WRITTEN DOWN
// ─────────────────────────────────────────────────────────────────────────────────────────────
// S1 · DONE (96-02): the board's Done column holds completed work; the active-work surfaces do
//      not count it. Reconciled by comparing `column_key <> 'done'`, never the board total.
// S2 · IDENTITY: `get_unified_work_kanban` takes NO p_user_id — it reads `auth.uid()` and RAISES
//      'Not authenticated' when NULL (20251207000001_fix_kanban_intake_status_mapping.sql:51-55),
//      so it CANNOT run under a service-role client. Side a therefore runs through a supabase-js
//      client signed in as the .env.test TEST_USER (the same identity the rendered DOM used);
//      side b runs under the service-role client scoped to that same user id. Two clients, one
//      identity — stated because it is not one connection.
// S3 · SOURCE FILTER: the board passes `SOURCE_FILTER = ['commitment', 'task']`
//      (WorkBoard.tsx:73) — intake tickets are NOT on this board. Side b applies that seam
//      explicitly (`source in (commitment, task)`) so the two sides scope the same subset. Without
//      it the comparison would be 16 against 18 and an inequality would be folded into a pass.
// S4 · RESIDUAL ARM SEAMS: the kanban commitments arm requires `is_deleted = FALSE` (the view does
//      not), and the board buckets tasks by `COALESCE(workflow_stage, status)`, so an active task
//      parked in stage 'done' leaves the board's active subset while staying active in the view.
//      Side b SUBTRACTS both, and the test records each seam's size — a green with a nonzero seam
//      is still a measured green, not a lucky one.
// S5 · CROSS-PAGE: Tests 3 and 4 read two pages, so their rendered numbers are two clocks. Those
//      numbers are recorded as EVIDENCE; the assertion is made on the adjacent same-clock DB
//      capture, never on the DOM pair.
// S6 · TRANSPORT (deviation from the plan's "one-statement SQL batch", recorded in 96-07-SUMMARY):
//      the Playwright runtime has no SQL transport — supabase-js speaks PostgREST/RPC only, and
//      .env.test carries no database password for a `pg` connection. The DB captures below are
//      therefore ADJACENT calls on one client pair, sub-second apart, which is the shape this plan
//      already mandates for Test 4 and which ACCEPTANCE condition 7 admits with the seam stated.
// S7 · /commitments: its three head-counts are three round trips inside one queryFn. The RENDERED
//      agreement asserted in Test 2 is a single DOM snapshot, which is where the contemporaneous
//      claim is made.
//
// AUTHENTICATION: inline, from TEST_USER_EMAIL / TEST_USER_PASSWORD, run with --no-deps. The
// Playwright `setup` project throws without six E2E_* keys that .env.test does not carry
// (E2ECRED-01), so no storage-state fixture is usable here. Credentials and keys are read from the
// environment and NEVER echoed.
//
// Never assert emptiness as agreement (D-13): a denial presents as an empty 200, and reading that
// as "the numbers match" is the defect class this milestone kills. Every test below fails on a
// failed query, a failed sign-in, and on a zero-row surface.
import { test, expect, type Page } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''
const supabaseUrl = process.env.SUPABASE_URL ?? ''
const anonKey = process.env.SUPABASE_ANON_KEY ?? ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

/** The four-value ACTIVE exclusion — verbatim `get_dashboard_stats.open_tasks` and the predicate
 *  `useMyWorkDashboard` applies to the rendered list (96-07 Task 1 + Task 2). */
const INACTIVE_STATUSES = '(completed,cancelled,closed,converted)'

/** The board's own arguments (WorkBoard.tsx:73 + useUnifiedKanban.ts:224-230). */
const BOARD_SOURCE_FILTER = ['commitment', 'task']
/** Above any column's size; the test asserts no column reached it, and none reached the board's 50. */
const PROBE_LIMIT_PER_COLUMN = 500
const BOARD_LIMIT_PER_COLUMN = 50

const SETTLE_TIMEOUT = 20_000

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

/** Side a's client: the TEST_USER's own identity, because the kanban family reads auth.uid() (S2). */
const authedClient = async (): Promise<{ client: SupabaseClient; userId: string }> => {
  if (supabaseUrl === '' || anonKey === '') {
    throw new Error('SUPABASE_URL / SUPABASE_ANON_KEY missing from .env.test')
  }
  const client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } })
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error !== null || data.user === null) {
    throw new Error('inline supabase sign-in failed')
  }
  return { client, userId: data.user.id }
}

/** Side b's client: service role, scoped explicitly to the same user id (S2). Key never echoed. */
const serviceClient = (): SupabaseClient => {
  if (serviceKey === '') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY missing from .env.test')
  }
  return createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
}

/** A head-count that FAILS the test on error — an errored count must never read as 0. */
const countOrThrow = async (
  builder: PromiseLike<{ count: number | null; error: { message: string } | null }>,
  label: string,
): Promise<number> => {
  const { count, error } = await builder
  if (error !== null) throw new Error(`${label} count query failed`)
  if (count === null) throw new Error(`${label} count returned null`)
  return count
}

/** Trailing-digit reader for a tab whose badge sits after its label ("All18"). */
const trailingCount = (text: string): number => {
  const match = /(\d+)\s*$/.exec(text.trim())
  return match === null ? 0 : Number(match[1])
}

/** Parenthesised count reader ("Pending (10)", "Commitments (10)"). */
const parenCount = (text: string | null): number | null => {
  if (text === null) return null
  const match = /\((\d+)\)/.exec(text)
  return match === null ? null : Number(match[1])
}

test.describe('criterion 4 — one number for the same work', () => {
  test('/my-work badge, footer total and rendered rows agree in ONE DOM snapshot', async ({
    page,
  }) => {
    await signInInline(page)
    await page.goto('/my-work')

    // Settle on rendered rows, not on a timer: the virtualiser only writes data-index once the
    // list has data. A surface that never settles fails here rather than being read mid-flight.
    await expect(page.locator('[data-index]').first()).toBeVisible({ timeout: SETTLE_TIMEOUT })

    // ONE evaluate pass = one snapshot. Every number below is read from the same DOM instant.
    const snap = await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('[role="tab"]')).map((el) => ({
        text: (el.textContent ?? '').trim(),
        active: el.getAttribute('data-state') === 'active' || el.getAttribute('aria-selected') === 'true',
      }))
      const footerEl = Array.from(document.querySelectorAll('span')).find((el) =>
        /^\d+\s+items?$/.test((el.textContent ?? '').trim()),
      )
      const rows = Array.from(document.querySelectorAll('[data-index]'))
      return {
        tabs,
        footerText: footerEl === undefined ? null : (footerEl.textContent ?? '').trim(),
        renderedRows: rows.length,
        maxIndex: rows.reduce(
          (max, el) => Math.max(max, Number(el.getAttribute('data-index') ?? '-1')),
          -1,
        ),
      }
    })

    // The four source tabs, in the order WorkItemTabs declares them. Asserted so the readers below
    // cannot silently address the wrong element after a refactor.
    expect(snap.tabs).toHaveLength(4)
    expect(snap.tabs[0]?.active).toBe(true)

    // The 99+ cap would make the badge unreadable as a number; it has never engaged here, and if it
    // ever does this test says so instead of comparing a truncated string.
    for (const tab of snap.tabs) expect(tab.text).not.toContain('+')

    expect(snap.footerText, 'the list footer must render its item count').not.toBeNull()
    const footerTotal = Number(/^(\d+)/.exec(snap.footerText ?? '')?.[1] ?? NaN)
    const badgeAll = trailingCount(snap.tabs[0]?.text ?? '')
    const bySource =
      trailingCount(snap.tabs[1]?.text ?? '') +
      trailingCount(snap.tabs[2]?.text ?? '') +
      trailingCount(snap.tabs[3]?.text ?? '')

    // Not an emptiness pass: the surface must be showing work for the comparison to mean anything.
    expect(footerTotal).toBeGreaterThan(0)

    // THE CLAIM. Badge and footer are the same expression over the same response, so they cannot
    // structurally diverge — this asserts the structure actually holds in the DOM.
    expect(badgeAll).toBe(footerTotal)
    // …and the per-source badges partition that same array, which is only true while all four
    // numbers come from ONE response (before 96-07 they came from a second RPC with a different
    // population: badge 18 against footer 21).
    expect(bySource).toBe(badgeAll)

    // The rows are a VIRTUALISED window over that array (@tanstack/react-virtual, overscan 5), so
    // the stated rule is containment, not equality: every rendered row indexes into the same
    // response, and at least one is on screen.
    expect(snap.renderedRows).toBeGreaterThan(0)
    expect(snap.renderedRows).toBeLessThanOrEqual(footerTotal)
    expect(snap.maxIndex).toBeLessThan(footerTotal)

    console.log(
      `[96-07 T1] badge=${badgeAll} footer=${footerTotal} bySource=${bySource} rows=${snap.renderedRows} maxIndex=${snap.maxIndex}`,
    )
  })

  test('/commitments tab count, list total and rendered cards agree in ONE DOM snapshot', async ({
    page,
  }) => {
    await signInInline(page)
    await page.goto('/commitments')

    const readPanel = async (): Promise<{
      tabText: string | null
      headerText: string | null
      footerText: string | null
      cards: number
      tabCount: number
    }> =>
      page.evaluate(() => {
        // The VISIBLE panel, not the first one: Radix keeps every visited TabsContent mounted and
        // marks the inactive ones hidden, so `[role="tabpanel"]` alone resolves to the previous
        // tab's shell (children unmounted, no header) after a switch — observed, not assumed.
        const panel =
          document.querySelector('[role="tabpanel"][data-state="active"]') ??
          document.querySelector('[role="tabpanel"]:not([hidden])')
        const activeTab = document.querySelector('[role="tab"][data-state="active"]')
        const tabs = Array.from(document.querySelectorAll('[role="tab"]'))
        const header = panel?.querySelector('h2') ?? null
        const footerEl =
          panel === null
            ? undefined
            : Array.from(panel.querySelectorAll('span')).find((el) =>
                /^\d+\s+items?$/.test((el.textContent ?? '').trim()),
              )
        const grid = panel?.querySelector('div.grid.grid-cols-1.gap-4') ?? null
        return {
          tabText: activeTab === null ? null : (activeTab.textContent ?? '').trim(),
          headerText: header === null ? null : (header.textContent ?? '').trim(),
          footerText: footerEl === undefined ? null : (footerEl.textContent ?? '').trim(),
          cards: grid === null ? 0 : grid.children.length,
          tabCount: tabs.length,
        }
      })

    const assertPanelAgrees = (
      snap: Awaited<ReturnType<typeof readPanel>>,
      label: string,
    ): void => {
      const tabNumber = parenCount(snap.tabText)
      const listTotal = parenCount(snap.headerText)
      const footerTotal = Number(/^(\d+)/.exec(snap.footerText ?? '')?.[1] ?? NaN)

      expect(tabNumber, `${label}: the tab must render its count`).not.toBeNull()
      expect(listTotal, `${label}: the list header must render its total`).not.toBeNull()
      expect(listTotal).toBeGreaterThan(0)

      // THE CLAIM: the tab's stats query and the list's own response are two derivations rendered
      // side by side. Before 96-07 the active tab counted (pending, in_progress) while the list it
      // labelled rendered the stored-overdue rows too — 0 against 10 in the same snapshot.
      expect(tabNumber).toBe(listTotal)
      expect(footerTotal).toBe(listTotal)
      // Page size is 20 (useInfiniteCommitments); the rendered cards are the loaded page.
      expect(snap.cards).toBe(Math.min(listTotal, 20))

      console.log(`[96-07 T2] ${label}: tab=${tabNumber} listTotal=${listTotal} cards=${snap.cards}`)
    }

    // Settle on BOTH numbers being answered — the tab count and the list header — by polling the
    // SAME snapshot the oracle reads. Polling the snapshot rather than two separate locators is
    // what makes the tab switch safe: mid-switch the previous panel's header is briefly still
    // mounted, so a locator wait can pass against a stale element and hand the oracle a
    // half-loaded panel (observed: the overdue tab read a null header on the first attempt). A tab
    // whose count query is still in flight renders no number at all (96-07 Task 2: an unanswered
    // count is never painted as 0), so "both numbers present" is a real settle signal.
    const settlePanel = async (): Promise<void> => {
      await expect
        .poll(
          async () => {
            const snap = await readPanel()
            return parenCount(snap.tabText) !== null && parenCount(snap.headerText) !== null
          },
          { timeout: SETTLE_TIMEOUT },
        )
        .toBe(true)
    }

    await settlePanel()
    const activeSnap = await readPanel()
    expect(activeSnap.tabCount).toBe(3)
    assertPanelAgrees(activeSnap, 'active tab')

    // Switch to the overdue tab and re-check once. Addressed by position, not by label, so the
    // check is language-independent (the tab order is pinned by the assertion above).
    await page.locator('[role="tab"]').nth(1).click()
    await settlePanel()
    assertPanelAgrees(await readPanel(), 'overdue tab')
  })

  test('dashboard KPI and the /my-work active count share one derivation (seam: two pages, two clocks)', async ({
    page,
  }) => {
    await signInInline(page)

    // ── RENDERED EVIDENCE (recorded, NOT the assertion — S5) ──────────────────────────────────
    await page.goto('/dashboard')
    const strip = page.getByTestId('dashboard-widget-kpi-strip')
    await expect(strip).toBeVisible({ timeout: SETTLE_TIMEOUT })
    const kpiValues = await strip.locator('[data-testid="kpi-value"]').allInnerTexts()
    expect(kpiValues).toHaveLength(4)
    const renderedEngagements = Number(kpiValues[0]?.trim())
    const renderedOpenWork = Number(kpiValues[1]?.trim())
    expect(Number.isInteger(renderedEngagements)).toBe(true)
    expect(Number.isInteger(renderedOpenWork)).toBe(true)

    await page.goto('/my-work')
    await expect(page.locator('[data-index]').first()).toBeVisible({ timeout: SETTLE_TIMEOUT })
    const renderedBadge = await page.evaluate(() => {
      const tab = document.querySelector('[role="tab"]')
      const match = /(\d+)\s*$/.exec((tab?.textContent ?? '').trim())
      return match === null ? 0 : Number(match[1])
    })

    // ── THE ASSERTION: adjacent same-clock derivations (S6) ───────────────────────────────────
    const { userId } = await authedClient()
    const svc = serviceClient()

    const { data: statsRows, error: statsError } = await svc.rpc('get_dashboard_stats', {
      p_user_id: userId,
    })
    if (statsError !== null) throw new Error('get_dashboard_stats failed')
    const stats = Array.isArray(statsRows) ? statsRows[0] : statsRows
    expect(stats, 'the KPI RPC must return a row').toBeTruthy()

    const listEngagements = await countOrThrow(
      svc
        .from('dossiers')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'engagement')
        .eq('status', 'active'),
      'engagements list',
    )
    const myWorkActive = await countOrThrow(
      svc
        .from('unified_work_items')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', userId)
        .not('status', 'in', INACTIVE_STATUSES),
      '/my-work active',
    )

    // The proven 3-vs-5 seam: the KPI counted engagement_dossiers ⋈ lifecycle while the list
    // rendered dossiers of type 'engagement'. 96-07 Task 1 re-points the KPI at the list population.
    expect(stats.active_engagements).toBe(listEngagements)
    // The active-work KPI and the /my-work badge are the SAME predicate over the same relation.
    expect(stats.open_tasks).toBe(myWorkActive)
    expect(myWorkActive).toBeGreaterThan(0)

    console.log(
      `[96-07 T3] rendered: kpiEngagements=${renderedEngagements} kpiOpenWork=${renderedOpenWork} myWorkBadge=${renderedBadge} | derived: kpiEngagements=${stats.active_engagements} list=${listEngagements} kpiOpenWork=${stats.open_tasks} myWorkActive=${myWorkActive}`,
    )
  })

  test('kanban ACTIVE population equals the /my-work active count (seams: Done, identity, source filter)', async ({
    page,
  }) => {
    await signInInline(page)

    // ── RENDERED EVIDENCE, ONE evaluate pass ─────────────────────────────────────────────────
    await page.goto('/kanban')
    await expect(page.locator('section.col').first()).toBeVisible({ timeout: SETTLE_TIMEOUT })
    await expect(page.locator('.kcard').first()).toBeVisible({ timeout: SETTLE_TIMEOUT })

    const board = await page.evaluate(() => {
      const columns = Array.from(document.querySelectorAll('section.col')).map((col) => ({
        stage: col.getAttribute('data-droppable-id'),
        headerCount: Number((col.querySelector('.col-count')?.textContent ?? '').trim()),
        cards: col.querySelectorAll('.kcard').length,
      }))
      const chip = document.querySelector('.overdue-chip')
      return {
        columns,
        // The board's only always-rendered toolbar total. FilterChipsRow's "Showing N of M"
        // returns null with no active chips, so it is absent by construction on a clean board —
        // recorded here rather than silently skipped.
        overdueChip: chip === null ? null : (chip.textContent ?? '').trim(),
      }
    })

    expect(board.columns.length).toBeGreaterThan(0)
    // In-snapshot claim: each column header's number is the count of cards that column rendered.
    for (const col of board.columns) {
      expect(col.headerCount, `column ${col.stage ?? '?'} header vs cards`).toBe(col.cards)
    }
    const renderedActive = board.columns
      .filter((col) => col.stage !== 'done')
      .reduce((sum, col) => sum + col.cards, 0)
    expect(renderedActive).toBeGreaterThan(0)

    // Second page, second clock — stated (S5). Recorded as evidence only.
    await page.goto('/my-work')
    await expect(page.locator('[data-index]').first()).toBeVisible({ timeout: SETTLE_TIMEOUT })
    const renderedBadge = await page.evaluate(() => {
      const tab = document.querySelector('[role="tab"]')
      const match = /(\d+)\s*$/.exec((tab?.textContent ?? '').trim())
      return match === null ? 0 : Number(match[1])
    })

    // ── THE ASSERTION: adjacent same-clock capture, two clients, one identity (S2/S6) ─────────
    // Side a — the kanban RPC under the TEST_USER's own auth.uid(), with the board's arguments.
    const { client: authed, userId } = await authedClient()
    const { data: kanbanRows, error: kanbanError } = await authed.rpc('get_unified_work_kanban', {
      p_context_type: 'personal',
      p_context_id: null,
      p_column_mode: 'status',
      p_source_filter: BOARD_SOURCE_FILTER,
      p_search_query: null,
      p_limit_per_column: PROBE_LIMIT_PER_COLUMN,
    })
    if (kanbanError !== null) throw new Error('get_unified_work_kanban failed')
    const rows: Array<{ column_key: string; source: string; is_overdue: boolean }> = kanbanRows ?? []
    expect(rows.length).toBeGreaterThan(0)

    // CAP TRUNCATION: the RPC ranks per column and cuts at p_limit_per_column, so a truncated
    // column would make the RPC population differ from the rendered one. Neither this probe's
    // limit nor the board's own 50 may be reached.
    const perColumn = new Map<string, number>()
    for (const row of rows) perColumn.set(row.column_key, (perColumn.get(row.column_key) ?? 0) + 1)
    for (const [column, size] of perColumn) {
      expect(size, `column ${column} hit the probe cap`).toBeLessThan(PROBE_LIMIT_PER_COLUMN)
      expect(size, `column ${column} hit the board's cap`).toBeLessThan(BOARD_LIMIT_PER_COLUMN)
    }

    const a = rows.filter((row) => row.column_key !== 'done').length

    // Side b — the /my-work active derivation under service role, scoped to the SAME user id, with
    // the source seam (S3) applied so both sides scope the same subset.
    const svc = serviceClient()
    const bPlain = await countOrThrow(
      svc
        .from('unified_work_items')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', userId)
        .not('status', 'in', INACTIVE_STATUSES)
        .in('source', BOARD_SOURCE_FILTER),
      '/my-work active (board sources)',
    )

    // S4 — the two residual arm seams, MEASURED and subtracted rather than assumed away.
    const seamDeletedCommitments = await countOrThrow(
      svc
        .from('aa_commitments')
        .select('*', { count: 'exact', head: true })
        .eq('owner_user_id', userId)
        .eq('is_deleted', true)
        .not('status', 'in', '(completed,cancelled)'),
      'seam: soft-deleted active commitments',
    )
    const seamTasksParkedInDone = await countOrThrow(
      svc
        .from('unified_work_items')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', userId)
        .eq('source', 'task')
        .not('status', 'in', INACTIVE_STATUSES)
        .eq('metadata->>workflow_stage', 'done'),
      'seam: active tasks parked in stage done',
    )
    const b = bPlain - seamDeletedCommitments - seamTasksParkedInDone

    expect(b).toBeGreaterThan(0)
    expect(a).toBe(b)

    console.log(
      `[96-07 T4] rendered: columns=${JSON.stringify(board.columns)} activeCards=${renderedActive} overdueChip="${board.overdueChip ?? 'absent'}" myWorkBadge=${renderedBadge} | derived: a=${a} bPlain=${bPlain} seamDeletedCommitments=${seamDeletedCommitments} seamTasksParkedInDone=${seamTasksParkedInDone} b=${b} | identity: side a = auth.uid() of TEST_USER, side b = service-role scoped to ${userId}`,
    )
  })
})
