---
phase: 96-real-numbers
plan: 03
subsystem: ui
tags: [react, tanstack-query, supabase, postgrest, playwright, cdp]

requires:
  - phase: 93-honest-failures
    provides: throw-on-error widget queries + the inline QueryErrorState contract the failed-widget region renders
  - phase: 95-dead-surfaces
    provides: tests/e2e/95-sandbox-error.spec.ts — the CDP forced-error spec family this oracle clones
provides:
  - /custom-dashboard events query reads live columns (calendar_entries.event_date/event_time/all_day)
  - KpiData.trend is TrendData | null — non-null only from a comparison request that settled with a real prior count
  - KpiWidget omits the trend row entirely on null (truthful absence, data-testid=kpi-trend)
  - tests/e2e/96-custom-dashboard-truth.spec.ts — comparison-leg CDP block oracle + natural settle arm
affects: [96-09, 97-reachability]

tech-stack:
  added: []
  patterns:
    - 'Comparison reads are best-effort: a failed comparison costs the derived row, never the primary value'
    - 'CDP blocks narrow to the COMPARISON LEG of a PostgREST read, not the table path'

key-files:
  created:
    - tests/e2e/96-custom-dashboard-truth.spec.ts
  modified:
    - frontend/src/hooks/useWidgetDashboard.ts
    - frontend/src/components/dashboard-widgets/KpiWidget.tsx
    - frontend/src/types/dashboard-widget.types.ts

key-decisions:
  - 'A failed comparison yields trend: null while the CURRENT count still throws — the value is known, the delta is not'
  - 'A prior count of 0 also yields null: the percentage change from zero is undefined, not 0%'
  - 'The CDP block targets the comparison leg (…_at=lt.…), so primary reads still land and absence means the row, not the widget'

patterns-established:
  - 'Truthful absence: an unmeasured derived value renders as no element at all — no placeholder, no em-dash, no reserved space'
  - 'Oracle-validity drill: re-introduce the fabrication and observe the spec go red before trusting its green'

requirements-completed: [DEAD-06]

duration: 55min
completed: 2026-08-17
---

# Phase 96 Plan 03: DEAD-06 — /custom-dashboard truth Summary

**The events widget queries columns that exist, and every KPI trend delta on the page is either a measurement or absent — a blocked comparison now renders nothing where it used to render a confident "0.0% from last week".**

## Performance

- **Duration:** ~55 min
- **Completed:** 2026-08-17
- **Tasks:** 3
- **Files modified:** 3 (+1 new spec)

## Accomplishments

- The phantom start-timestamp column is gone from `fetchEvents`; the query reads
  `event_date` + `event_time` + `all_day`, verified against live staging catalog
  (`zkrcjzdemdmwhearhfgg`: `event_date` date NOT NULL, `event_time` time NULL, `all_day` bool;
  no start-timestamp column exists). The 42703 on every EventsWidget render stops.
- Every trend-fabrication site is removed. `KpiData.trend` is `TrendData | null`; null is the
  only render of an unknown delta and `KpiWidget` omits the row entirely.
- The oracle is behavioural and validated in both directions, including a falsification drill
  that proves it measures the fix rather than the block.

## Task Commits

1. **Task 1 + Task 2: hook truth + widget absence** — `2ed6aeaa8` (fix)
2. **Task 3: CDP truth oracle** — `03b9b8010` (test)

Tasks 1 and 2 landed in one commit: the type change (`KpiData.trend`) makes producer and
consumer inseparable — splitting them would commit a tree that does not type-check.

## Fabrication sites removed (before → after)

Before-refs are against plan-accept HEAD `b4072302a`; after-refs against `2ed6aeaa8`.

<!-- prettier-ignore -->
| Site (before) | What it fabricated | After |
| --- | --- | --- |
| `:281` `trendPercentage = previousValue > 0 ? … : 0` | a 0% delta whenever no comparison existed | deleted; `deriveTrend()` at `:180-187` returns `null` for a null-or-zero prior count |
| `:195` `previousValue = previous.count \|\| value` (active-dossiers) | a failed/zero comparison became a 0% delta | `:216` `previousCount = previous.error ? null : previous.count` |
| `:213` same coalesce (pending-tasks) | same | `:233` same repair |
| `:244` same coalesce (completed-this-week) | same | `:264` same repair |
| `:273` same coalesce (intake-volume) | same | `:292` same repair |
| `:224` `previousValue = value` (overdue-items) | a permanent fabricated-neutral trend | `:243` value only; no comparison is issued, so the trend stays absent |
| `:255` `previousValue = value` (engagement-count) | same | `:274` same repair |
| `:277-278` `default: value = 0; previousValue = 0` | an unknown metric rendered 0 with a 0% trend | `:298` value only; trend absent |
| `:587-606` `fetchEvents` selecting/filtering/ordering the phantom column | 42703 on every render | `:601-630` — select/`gte`/`order` on `event_date`, secondary `order` on `event_time` (`nullsFirst: false`), mapped to `startDate` (date-only when `all_day` or no time) |

The current count still throws on error at every site (`if (current.error) throw current.error`)
— the P93 retrofit is intact. Only the COMPARISON is best-effort: its failure costs the trend
row, never the value. That asymmetry is what makes the forced-absence oracle meaningful.

**fetchTasks overdue alignment:** `:638` → `:664-666`. The formula now excludes cancelled as
well as completed (`item.status !== 'completed' && item.status !== 'cancelled'`), matching the
96-02 winning-notion record for TASKS/INTAKE on the board and /my-work (computed deadline
comparison, not completed/cancelled). A cancelled task is not overdue work.

**Widget absence render:** `KpiWidget.tsx:216` guards the row on `trend !== null`; the row root
carries `data-testid="kpi-trend"` (`:98`). No placeholder, no em-dash, no reserved space. The
sparkline colour reads `trend?.direction` (`:180-183`). Zero other visual change.

## Gate records (red → green, both observed)

Every gate was run VERBATIM from the plan; exit codes captured directly, never through a pipe.

**Gate 1 (Task 1 — hook):**

- RED: exit 1 on the undone tree — `command grep -q "event_date"` failed (the query did not
  name the column). Observed before any edit.
- Interim RED (informative): after the first edit the gate still exited 1 —
  `command grep -c 'start_datetime'` was **1**, because my explanatory comment named the token.
  The plan's C8 note forbids exactly this; the comment was rewritten to describe the column
  without naming it. This is the gate catching a real (if small) violation, not a workaround.
- GREEN: exit 0 with `pnpm type-check` clean. The type-check half was labelled UNPROVEN
  pre-execution and is now proven.

**Gate 2 (Task 2 — widget):**

- RED: exit 1 on the undone tree — `data-testid="kpi-trend"` absent.
- GREEN: exit 0, type-check clean (the UNPROVEN half proven).

**Gate 3 (Task 3 — spec):**

- RED: exit 1 on the undone tree — `test -f` failed; the spec is this task's product.
- Interim RED (real, recorded): first full run — both arms failed at the settle helper's
  page-wide `.animate-spin` assertion (expected 0, received 1, 34 polls). Cause derived from
  source, not guessed: `WidgetGrid.tsx:215` computes `isLoading = !data`, and
  `fetchWidgetData` legitimately resolves `null` for the quick-actions widget, so that
  container's header spinner never stops. See Findings below.
- GREEN: exit 0 — `--list` counts exactly 2 tests (hardcoded, never list-derived), both pass
  with `--no-deps` against the dev server at :5173.

**Both spec-arm colours at the final run:**

- Arm 1 (forced absence, `96-custom-dashboard-truth.spec.ts:106`): **GREEN** — 0 `kpi-trend`
  elements, 0 `widget-error-region` elements (every primary read landed: the values rendered),
  body carries no `0.0%` and no INTERNAL_STRING, and the requestfailed instrument test recorded
  ≥1 blocked `/rest/v1/unified_work_items…_at=lt.` request with a Chrome `inspector` reason.
- Arm 2 (natural settle, `:150`): **GREEN** — the Upcoming Events region settled to content
  (NOT the error branch: arm 1's `widget-error-region` count of 0 is independent proof the
  events query no longer fails, since `calendar_entries` is unblocked in both arms), and
  **2** `kpi-trend` rows rendered, each matching the real-percentage shape. The count is
  recorded via a `kpi-trend-rows` annotation and read back from the JSON reporter — the loop
  asserted 2 real rows, so it is not vacuous.

**Oracle-validity (falsification) drill — the one that matters.** With the fix reverted in
place (`deriveTrend` returning `{direction:'neutral', percentage:0}` instead of `null`), arm 1
went **RED**: `expect(kpi-trend).toHaveCount(0)` received **4** — all four default KPI widgets
rendering the fabricated neutral row under the block. The tree was then restored with
`git checkout --` (safe: the file was already committed, the drill edit was the only uncommitted
change to it) and all three gates re-run green. The oracle measures the fix, not its own block.

## Decisions Made

- **A failed comparison must not fail the widget.** The plan requires `trend: null` for a
  failed/aborted comparison; that is only observable if the widget still renders. So
  `current.error` throws (unchanged, P93) while `previous.error` degrades to `trend: null`.
- **A prior count of 0 yields null, not 0%.** Percentage change from zero is undefined. The old
  code's `previousValue > 0 ? … : 0` called it "no change", which is a claim about data nobody
  measured.
- **The block targets the comparison LEG, not the table.** See the derived fix below.

## DERIVED FIX (plan-check-1 info item, per plan `<output>`)

96-UI-SPEC's Verification Notes specify the DEAD-06 trend oracle's CDP block as "narrowed to the
`functions/v1` URL". That line is inherited from the 95-03 edge-function precedent and is the
**wrong tier** for this widget: these KPI reads are supabase-js PostgREST calls, so a
`functions/v1` pattern would block nothing and the spec would assert absence under a force that
never fired. This plan's oracle overrides it with the **PostgREST tier** (`/rest/v1/`), as the
plan's own `<interfaces>` block and 96-PATTERNS §1 already state. Recorded as a DERIVED FIX, not
a deviation.

Two refinements were required on top of the tier fix to make the oracle real, and both are
recorded here as part of the same derived fix:

1. **Leg, not table.** A table-wide `*/rest/v1/unified_work_items*` block kills each widget's
   CURRENT count too — the widget then renders the inline error contract and its trend row is
   absent because the whole widget died, which proves nothing about the trend contract. The
   patterns are narrowed to the comparison leg: `*/rest/v1/unified_work_items*_at=lt.*`
   (matches the pending-tasks `created_at=lt.` and completed-this-week `updated_at=lt.`
   comparisons; deliberately does NOT match the overdue-items CURRENT read `deadline=lt.`).
   The plan's literal instrument test still holds: blocked `/rest/v1/unified_work_items`
   requests are what the requestfailed handler counts.
2. **A second table pattern.** `*/rest/v1/dossiers*created_at=lt.*` covers the active-dossiers
   comparison. The default layout's four KPI widgets do not all read one table, so with only the
   unified_work_items pattern that widget's comparison would settle and its (truthful) trend row
   would render — making the plan's page-wide absence assertion false. Population definition
   stated in the spec header.

Neither pattern can blank the SPA (the 95-03 lesson): both are pinned to the Supabase API
origin's `/rest/v1/` path, never a dev-server module URL.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Mechanically necessary] A fourth file was modified: `frontend/src/types/dashboard-widget.types.ts`**

- **Found during:** Task 1
- **Issue:** The plan directs "the hook's KPI result type carries `trend: TrendData | null`".
  That type is `KpiData`, which lives in the shared types file, not in the hook. Keeping the
  type file untouched would have required either a wrong cast in `WidgetGrid.tsx:63` or a
  duplicate result type — both worse, and both also touch a file outside the plan's list.
- **Fix:** `KpiData.trend` is now `TrendData | null`; `TrendData {direction, percentage}` added;
  the orphaned `previousValue` / `trendPercentage` fields (whose only purpose was feeding the
  fabrication) removed. Grep confirmed `KpiWidget.tsx` and this hook were their only consumers.
- **Verification:** `pnpm type-check` clean; both gates 1 and 2 green.
- **Committed in:** `2ed6aeaa8`

**2. [Rule 1 - Gate compliance] Comment rewritten so it does not name the phantom column**

- **Found during:** Task 1 gate run (interim RED above)
- **Fix:** The `fetchEvents` comment describes the removed column without naming the token.
- **Committed in:** `2ed6aeaa8`

**3. [Rule 2 - Oracle correctness] The settle helper does not assert a page-wide spinner count**

- **Found during:** Task 3 first run (interim RED above)
- **Issue:** A permanent `animate-spin` from the quick-actions widget (a pre-existing defect,
  see Findings) reds any page-wide spinner assertion, regardless of this criterion.
- **Fix:** The helper asserts zero `.animate-pulse` — the loading BODY of every data-driven
  widget (KPI, chart, events, task-list, notifications), which is exactly the settle signal
  this criterion needs, including the plan's "never a spinner past the budget" clause for the
  EventsWidget region. The exclusion and its reason are written into the spec, not hidden.
- **Committed in:** `03b9b8010`

---

**Total deviations:** 3 auto-fixed (1 mechanically necessary file, 1 gate compliance, 1 oracle
correctness). **Impact:** none on plan semantics. No scope creep; no gate text edited.

## Findings (recorded, NOT fixed here — outside this plan's subject)

**F-96-03-01 — a widget with no data renders as permanently pending.**
`frontend/src/components/dashboard-widgets/WidgetGrid.tsx:215` derives `isLoading = !data`,
while `useWidgetDashboard.ts` `fetchWidgetData` resolves `null` for `quick-actions` (which needs
no data). Its container therefore shows the header spinner forever — observed live, count 1 on
both spec arms. This is the same family as the defects this milestone kills (a settled state
dressed as pending), and a user hits it on every visit to /custom-dashboard, so the fix belongs
in `src/**`. It is not this plan's subject (files not in scope, criterion not about it) and was
NOT silently fixed. Ship/no-ship: **SHIP** — recommend routing to 96-09 or a follow-up plan;
the one-line shape is to derive `isLoading` from the query state rather than from `!data`.

## Issues Encountered

- The workspace `type-check` was briefly red from another lane's in-flight edits to
  `UnifiedCalendar.tsx` / `useCalendarEvents.ts` (concurrent 96-04 work on this shared branch).
  No error referenced any file of mine; the gate was re-run once that lane's tree settled and
  passed. No workaround was applied and the gate text was not touched.

## BLOCKED

_(none)_

## User Setup Required

None.

## Next Phase Readiness

- Criterion 2 holds behaviourally: live columns queried, the events/chart region renders, and no
  trend delta exists that was not computed from a completed request.
- 96-09's consumer sweep should note this spec as a live (non-mocked) consumer of
  `data-testid="kpi-trend"` and of the `widget-error-region` contract.
- F-96-03-01 is open and unowned.

---

_Phase: 96-real-numbers_
_Completed: 2026-08-17_

SUMMARY-END
