---
phase: 96-real-numbers
plan: 07
subsystem: ui
tags: [postgres, rpc, tanstack-query, playwright, supabase, counts]

requires:
  - phase: 96-02
    provides: kanban Done semantics (status <> 'cancelled', completed → column_key 'done') and the stored-overdue arm, live before agreement was asserted
provides:
  - get_dashboard_stats with the engagement KPI counting the engagements LIST population (5, was 3) and every KPI's source relation + filter documented at the RPC
  - /my-work badge + footer total + rendered rows derived from ONE result set (useMyWorkDashboard.activeItems) — the 18/21/11 divergence is structurally impossible
  - /commitments active tab counting stored overdue as active work; overdue tab reading the stored status; list and count sharing one population
  - tests/e2e/96-count-agreement.spec.ts — 4 same-clock agreement oracles incl. the MEASURED kanban leg
affects: [96-09 c9b sweep, 96-11 trigger sweep, COUNT-04 close, any future work-item count surface]

tech-stack:
  added: []
  patterns:
    - 'one-result-set derivation: every number on a page reads the array that renders the rows'
    - 'seam-stated adjacent same-clock DB capture as the cross-page oracle shape'
    - 'unanswered count renders nothing or the error contract — never 0'

key-files:
  created:
    - supabase/migrations/20260817500004_p96_dashboard_stats_truth.sql
    - tests/e2e/96-count-agreement.spec.ts
  modified:
    - frontend/src/hooks/useUnifiedWork.ts
    - frontend/src/pages/my-work/MyWorkDashboard.tsx
    - frontend/src/components/commitments/PersonalCommitmentsDashboard.tsx

key-decisions:
  - 'The compared quantity across the whole surface set is ACTIVE work, so /my-work renders the active population (it was rendering 3 completed tasks under headings whose every count said active)'
  - 'The active predicate is the four-value exclusion (completed, cancelled, closed, converted) — get_dashboard_stats.open_tasks verbatim — so KPI, badge and board agree by shared derivation'
  - "user_work_summary.total_active's FIVE-value exclusion is left alone and stated as a seam; the tile keeps its own 'Total Active' label"
  - "The kanban leg compares the board's real source set (commitment + task — WorkBoard.tsx:73 excludes intake); side b applies that seam explicitly rather than asserting 16 == 18"

patterns-established:
  - 'Population table in the migration header: every KPI → source relation + filter, so the next reader compares filters instead of re-deriving them'
  - 'Settle a DOM oracle by polling the ORACLE SNAPSHOT, not separate locators — a locator wait can pass against a stale element mid-transition'

requirements-completed: [COUNT-01]

duration: 95min
completed: 2026-08-17
---

# Phase 96 Plan 07: COUNT-01 — the SC4 agreement oracle Summary

**One active-work population across the dashboard KPI, /my-work, /commitments and the kanban board — proven by 4 passing oracles, with the engagement KPI moved off its narrower population (3 → 5) and the kanban leg MEASURED at a = b = 16 under stated Done, identity and source-filter seams.**

## Performance

- **Duration:** ~95 min
- **Completed:** 2026-08-17
- **Tasks:** 3
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments

- **The 3-vs-5 seam is closed.** `get_dashboard_stats.active_engagements` now counts
  `dossiers WHERE type='engagement' AND status='active'` — the population the list renders.
  Recorded same-clock batch (ONE statement, via MCP): `a_kpi_engagements=5`,
  `b_list_engagements=5`, `old_kpi_expression=3`.
- **/my-work cannot disagree with itself.** Badge, footer total and rendered rows all read
  `useMyWorkDashboard.activeItems`. Measured after: badge 18 = footer 18 = per-source sum 18
  (10 commitments + 6 tasks + 2 intake), 9 virtualised rows with maxIndex 8 < 18.
- **/commitments counts the stored fact.** Active = `status IN (pending, in_progress, overdue)`
  (was 0 while the board showed 10); overdue tab = `status = 'overdue'` and its LIST now filters
  on the same stored status instead of a computed date comparison.
- **The kanban leg is measured, not presumed** — see the dedicated section below.
- **The forbidden shape is gone from both touched count surfaces**: a failed count renders
  `QueryErrorState`, an in-flight one renders a skeleton or nothing. The in-flight case was found
  by Test 2 going red against a real "(0)" painted beside a list already showing 10 rows.

## The A2 mechanism, PINNED (badge 18 / footer 21 / rows 11)

Read from the code and confirmed against live data before editing — three different mechanisms,
not one number being computed wrong:

| Surface       | Before                                                                                                                      | Population                 | Measured |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------- | -------- |
| badge         | `WorkItemTabs.counts.all = summary.data.total_active` → `get_user_work_summary` → `user_work_summary` view                  | ACTIVE (5-value exclusion) | 18       |
| footer        | `SyncStatusBar itemCount={items.length}` — flattened pages of `get_unified_work_items`, which filters ONLY on `assigned_to` | ALL statuses, loaded pages | 21       |
| rendered rows | `@tanstack/react-virtual` window over that same array (overscan 5)                                                          | the visible window         | 9–11     |

So badge vs footer was a POPULATION difference (3 completed tasks), and footer vs rows was
VIRTUALISATION. The fix is structural: `useMyWorkDashboard` now returns `activeItems` (the fetched
pages filtered by the four-value ACTIVE exclusion) and the page reads that one array for all three
numbers; rows remain a documented window into it, asserted by containment (`maxIndex < total`).

## The KPI seam table (each KPI → relation + filter)

Written into the migration header at the RPC; reproduced here.

| KPI                  | Relation + filter                                                                                                                     | Change                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `active_engagements` | `dossiers WHERE type='engagement' AND status='active'`                                                                                | CHANGED (was `engagement_dossiers ⋈ dossiers WHERE d.status='active' AND ed.lifecycle_stage <> 'closed'` = 3)                                           |
| `open_tasks`         | `unified_work_items WHERE status NOT IN (completed, cancelled, closed, converted) AND (p_user_id IS NULL OR assigned_to = p_user_id)` | unchanged — already the /my-work active definition, verified against live prosrc, not assumed                                                           |
| `sla_at_risk`        | `intake_tickets WHERE external_deadline ≤ NOW()+48h AND status NOT IN (closed, converted, merged) AND (…assigned_to…)`                | unchanged; its 'merged' exclusion differs from `open_tasks` — different questions, stated                                                               |
| `upcoming_week`      | `engagement_dossiers ⋈ dossiers` (start_date ≤ 7d, active) `UNION ALL` `calendar_entries.event_date` (≤ 7d, organizer)                | unchanged; the engagement arm ignores `p_user_id` while the calendar arm applies it — org-wide in one half, personal in the other, recorded not changed |

**Stated seam kept, not silently changed:** `user_work_summary.total_active` excludes FIVE values
(`completed, cancelled, resolved, closed, done`) — +resolved, +done, −converted vs the four-value
list. Both yield 18 today (zero rows carry a status in the symmetric difference, measured). The
"Total Active" tile keeps the summary population under its own label; the badge/footer/rows use the
four-value list that the KPI and the board share.

## The kanban leg — MEASURED (overseer rider fields)

`[96-07 T4]` console record from the passing run:

- **Rendered board (one evaluate pass):** `todo 14/14 · in_progress 2/2 · review 0/0 · done 3/3`
  (header count vs rendered cards asserted equal per column, in-snapshot), active cards = **16**,
  `.overdue-chip` = "16 overdue". The FilterChipsRow "Showing N of M" toolbar total returns null
  with no active chips, so it is absent by construction on a clean board — recorded, not skipped.
- **(1) IDENTITY of each side.** Side a: an inline `signInWithPassword` supabase-js client as the
  `.env.test` TEST_USER — the RPC reads `auth.uid()` and RAISES 'Not authenticated' when NULL, so
  it CANNOT run under service role. Side b: the service-role client scoped explicitly to that same
  user id, `de2734cf-f962-4e05-bf62-bc9e92efff96`. Two clients, one identity — the seam is stated
  in the spec header (S2) and printed in the test's own output line.
- **(2) RPC ARGS passed** (the board's own, from `useUnifiedKanban.ts:224-230` +
  `WorkBoard.tsx:73`): `p_context_type='personal'`, `p_context_id=null`, `p_column_mode='status'`,
  `p_source_filter=['commitment','task']`, `p_search_query=null`, `p_limit_per_column=500`.
- **(3) CAP-TRUNCATION assertion: PASSED — no column hit a cap.** Every column's size is asserted
  `< 500` (the probe limit) AND `< 50` (the board's own `limitPerColumn`, so the RPC population and
  the rendered population cannot differ by truncation). Largest column: 14.
- **Result: a = 16, b = 16.** `a` = RPC rows with `column_key <> 'done'` (19 rows returned, 3 in
  done). `b` = `unified_work_items` active for that user id restricted to the board's sources,
  minus the two measured residual seams: `seamDeletedCommitments = 0`,
  `seamTasksParkedInDone = 0`. `bPlain = 16`.
- **Seams stated in the batch comment AND here:**
  - **DONE (96-02):** the board's Done column holds completed work; the active surfaces do not
    count it, so the comparison is `column_key <> 'done'`, never the board total (19).
  - **IDENTITY:** as (1) above — two clients, one user id, adjacent calls, not one connection.
  - **SOURCE FILTER:** the board renders commitments + tasks only; intake is not on this board.
    Side b applies that seam explicitly. Without it the comparison would have been 16 against 18
    (the /my-work badge, which includes 2 intake rows) — an inequality folded into a pass, which
    is exactly what the plan forbids. The /my-work badge of 18 is recorded as evidence in the same
    line, so the 16-vs-18 difference is visible and explained rather than hidden.

## Task Commits

All three tasks landed in one atomic commit (the oracle and the surfaces it measures are not
independently valid — the spec is red until both land):

1. **Tasks 1–3** — `04a68e12` (feat)
2. **Plan metadata (this SUMMARY)** — see the docs commit that follows.

## Gate colours — every UNPROVEN half observed red → green

| Gate                                           | RED (observed)                                                                                                 | GREEN (observed)                   |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Task 1 (migration pins)                        | exit **1** on the undone tree — `test -f` fails, the subject does not exist                                    | exit **0** after apply             |
| Task 2 grep half A (`'overdue'`)               | exit **1** — instrument-tested against a known-present token (`status.overdue` → 2 matches, exit 0)            | exit **0**                         |
| Task 2 grep half B (`eq('status', 'overdue')`) | exit **1**                                                                                                     | exit **0**                         |
| Task 2 type-check half                         | exit **2**, 2 TS errors — DRILLED by deliberately passing `activeItems` where `counts` is typed, then reverted | exit **0**, 0 errors               |
| Task 3 list half (== 4)                        | exit **1** on the undone tree — spec absent                                                                    | exit **0**, exactly 4 tests listed |
| Task 3 full gate                               | exit **1** twice during execution against real defects (below)                                                 | exit **0**, **4 passed**           |

Composite final: GATE1_FINAL_EXIT=0, GATE2_FINAL_EXIT=0, GATE3_FULL_EXIT=0. Gate text is
byte-identical to plan-accept HEAD `b4072302a`.

## All four test colours + the numbers they printed

| Test                                                                   | Result   | Numbers                                                                                                                  |
| ---------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| T1 /my-work internal agreement (one DOM snapshot)                      | **PASS** | badge=18 footer=18 bySource=18 rows=9 maxIndex=8                                                                         |
| T2 /commitments internal agreement (one DOM snapshot per tab)          | **PASS** | active tab: tab=10 listTotal=10 cards=10 · overdue tab: tab=10 listTotal=10 cards=10                                     |
| T3 dashboard KPI ↔ /my-work active (adjacent same-clock, seam stated)  | **PASS** | rendered kpiEngagements=5 kpiOpenWork=18 myWorkBadge=18 · derived kpiEngagements=5 list=5 kpiOpenWork=18 myWorkActive=18 |
| T4 kanban ACTIVE ↔ /my-work active (adjacent same-clock, seams stated) | **PASS** | a=16 b=16 (bPlain=16, seams 0/0); rendered activeCards=16, board columns 14/2/0/3                                        |

Task 1's recorded same-clock batch (single statement, MCP): `a_kpi_engagements=5`,
`b_list_engagements=5`, `a_kpi_open_tasks=18`, `b_mywork_active=18`, `old_kpi_expression=3`.

## The three-tab window seam (/commitments)

The three head-counts share one `queryFn` but are three round trips, so they are same-clock only to
within that sub-second window. Stated in the component and in the spec header (S7). The
contemporaneous claim that actually closes the criterion is Test 2's single DOM snapshot, which
compares the tab's count against the list's own response total, its footer item count, and the
rendered card count — all read in one `page.evaluate`.

Second stated seam: overdue rows are counted by BOTH the active and the overdue tab. Under the
winning notion (stored overdue IS active work) the overdue tab is a subset view of active work, not
a disjoint bucket. Both read 10 today.

## Files Created/Modified

- `supabase/migrations/20260817500004_p96_dashboard_stats_truth.sql` — CREATE OR REPLACE from the
  LIVE prosrc; one expression changed; the KPI population table in the header; GRANT re-stated.
  Applied via MCP `apply_migration` on `zkrcjzdemdmwhearhfgg` (name `p96_dashboard_stats_truth`).
- `frontend/src/hooks/useUnifiedWork.ts` — `INACTIVE_WORK_STATUSES` (the four-value exclusion,
  pointed at the migration) + `activeItems` returned from `useMyWorkDashboard`.
- `frontend/src/pages/my-work/MyWorkDashboard.tsx` — tab counts derived from `activeItems`; the
  list renders `activeItems`; summary-query failure renders `QueryErrorState` instead of a strip of
  zeros.
- `frontend/src/components/commitments/PersonalCommitmentsDashboard.tsx` — stored-overdue active
  filter, stored overdue tab (count AND list), error contract + loading skeletons in place of
  fabricated zeros.
- `tests/e2e/96-count-agreement.spec.ts` — the oracle: population definition, the kanban
  reconciliation rule, seven numbered seams (S1–S7), 4 tests.

## Decisions Made

1. **/my-work renders the ACTIVE population.** The criterion compares "the same work" across a
   surface set whose every other member counts active work (KPI `open_tasks`, the summary tile, the
   board's non-Done columns). /my-work was rendering 21 rows including 3 completed tasks under
   headings whose counts all said 18. Moving the page to the active population is what makes badge
   = footer = rows = KPI = board possible; the alternative (badge = 21) would have put the KPI and
   the badge in permanent disagreement and failed Test 3 by construction.
2. **The active predicate lives client-side as a NOT-IN mirror, not as a request filter.**
   `get_unified_work_items` takes an IN list (`p_statuses`), so filtering server-side would mean
   enumerating the ACTIVE vocabulary of three lifecycles in the client — and a status added later
   would silently drop out of the list (the under-counting class this milestone kills). The NOT-IN
   mirror matches the DB predicate exactly and is pointed at the migration that owns it.
3. **Tab badges are rendered only for populations the response can answer.** On a source tab the
   response contains one source, so the other tabs' badges are not painted (WorkItemTabs draws no
   badge at 0) rather than filled from a second query with a different population.
4. **The kanban comparison uses the board's real source set.** Stated and applied to side b (S3).

## Deviations from Plan

### Auto-fixed / recorded

**1. [Transport] Test 3's "one-statement SQL batch" is adjacent same-clock calls instead**

- **Found during:** Task 3 (writing the spec)
- **Issue:** The plan specifies a ONE-STATEMENT SQL batch (`SELECT (a), (b)`) through the
  service-role client. The Playwright runtime has no SQL transport: supabase-js speaks
  PostgREST/RPC only, and `.env.test` carries no database password or URL for a `pg` connection
  (verified: `command grep -c "DB_PASSWORD\|DATABASE_URL" .env.test` → 0; `pg` exists in
  node_modules but is unusable without credentials).
- **Fix:** Test 3 uses the shape this same plan mandates for Test 4 — adjacent same-clock calls on
  one client pair, sub-second apart — with the seam stated in the spec header (S6) and here.
  ACCEPTANCE condition 7 admits this branch. Task 1's own verification batch IS a true
  single-statement batch (run through the MCP, recorded above), so the engagement equality is
  additionally proven in the one-statement form.
- **Verification:** Test 3 passes; both derivations printed.
- **Committed in:** `04a68e12`

**2. [Rule 2 — Missing critical] In-flight counts were painting "(0)"**

- **Found during:** Task 3, first gate run (Test 2 red: tab=0 while listTotal=10)
- **Issue:** `stats?.active ?? 0` rendered 0 while the count query was in flight — the same
  confident-lie shape the plan forbids for failed queries, one state earlier.
- **Fix:** `statsPending` renders a `Skeleton` in the stat cards and no `(N)` on the tabs; the
  error branch renders `QueryErrorState`. The spec settles on both numbers being ANSWERED.
- **Verification:** Test 2 passes on both tabs.
- **Committed in:** `04a68e12`

**3. [Rule 1 — Trivial] `WorkItemTabs` count semantics on source tabs**

- **Issue:** The plan says badge/footer/rows share one response; the per-source badges could not
  all be answered from a source-filtered response.
- **Fix:** counts are derived per source when the tab is 'all', and only for the active tab
  otherwise (0 → no badge). No file outside the plan's `files_modified` was touched.
- **Committed in:** `04a68e12`

---

**Total deviations:** 3 (1 transport-forced, 1 missing-critical auto-fix, 1 trivial).
**Impact on plan:** No scope creep; no plan semantics changed. The transport deviation preserves
the plan's own accepted alternative shape.

## Issues Encountered

1. **Test 2 red — the tab count read 0 against a list of 10.** Not a flake: the in-flight count
   was painted as 0. Fixed at the source (deviation 2), not by loosening the assertion.
2. **Test 2 red again — the overdue tab's header read null.** Diagnosed from the failure
   screenshot: the DOM was correct (Overdue (10), 10 cards). The READER was wrong — Radix keeps
   every visited `TabsContent` mounted and marks the inactive ones hidden, so
   `document.querySelector('[role="tabpanel"]')` resolved to the previous tab's empty shell. Fixed
   by selecting `[role="tabpanel"][data-state="active"]` and by settling on the oracle snapshot
   itself rather than on separate locators (a locator wait can pass against a stale element
   mid-transition).
3. **The kanban board excludes intake** (`SOURCE_FILTER = ['commitment','task']`). Found by
   probing the RPC with the board's real arguments before writing the assertion: 16, not 18. Had
   the spec been written to the plan's illustrative "18 = 18", it would have asserted equality
   across structurally different populations. Applied as a stated seam on side b.

## User Setup Required

None.

## Next Phase Readiness

- COUNT-01 closes with a re-runnable oracle: `pnpm exec playwright test
tests/e2e/96-count-agreement.spec.ts --project=chromium-en --no-deps` (needs the dev server on
  :5173 and `.env.test`).
- Open for later phases, recorded not fixed: `user_work_summary.total_active`'s five-value
  exclusion (a view change no decision authorises here); `upcoming_week`'s half-personal
  half-org-wide asymmetry; whether the kanban board SHOULD carry intake (a product fork, not a
  count defect).
- No shipped spec asserted the changed surfaces before this plan (C9b re-derived at execution:
  only `tests/e2e/96-count-agreement.spec.ts` references them), so nothing prior-phase went red.

## BLOCKED

None.

---

_Phase: 96-real-numbers_
_Completed: 2026-08-17_

SUMMARY-END
