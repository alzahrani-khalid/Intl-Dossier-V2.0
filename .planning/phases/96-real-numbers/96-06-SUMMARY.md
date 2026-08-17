---
phase: 96-real-numbers
plan: 06
subsystem: ui
tags: [analytics, recharts, tanstack-query, supabase-edge-functions, playwright, i18n]

# Dependency graph
requires:
  - phase: 96-02
    provides: "get_commitment_fulfillment's overdue bucket counts the STORED status ('overdue'), so this chart's overdue series survives the COUNT-04 INSERT-gap fix — verified live in prosrc before the repoint shipped"
  - phase: 93
    provides: 'QueryErrorState (page + inline variants) and the repository throw-shape (D-01) both consumed unchanged'
provides:
  - '/analytics reads the deployed analytics-dashboard edge fn — five per-endpoint queries, real table-derived payloads'
  - 'per-region error contract: a failed widget renders the shared inline error beside succeeded siblings; only an all-region failure replaces the page'
  - 'the fabrication layer (AnalyticsPreviewOverlay + generateSample*) is DELETED, not unreferenced'
  - 'the trend rule on summary cards: a delta renders only from a completed comparison'
  - 'tests/e2e/96-analytics-real.spec.ts — the branch-invariant DEAD-05 oracle'
affects: [97-nav-reachability, 98-copy, 99-arabic-coverage]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'per-endpoint query fan-out with a region-scoped error contract (five useQuery, one page)'
    - 'fail-closed trend rendering: an indistinguishable zero renders no delta at all'
    - 'settle-before-absence: wait for main to be NON-EMPTY, then zero skeletons, before asserting any absence'

key-files:
  created:
    - tests/e2e/96-analytics-real.spec.ts
  modified:
    - frontend/src/domains/analytics/repositories/analytics.repository.ts
    - frontend/src/domains/analytics/hooks/useAnalyticsDashboard.ts
    - frontend/src/pages/analytics/AnalyticsDashboardPage.tsx
    - frontend/src/components/analytics/{Engagement,RelationshipHealth,CommitmentFulfillment,WorkloadDistribution}*.tsx
    - frontend/src/components/analytics/index.ts
    - frontend/src/pages/Dashboard/components/AnalyticsWidget.tsx
    - frontend/tests/e2e/analytics-dashboard.spec.ts
  deleted:
    - frontend/src/components/analytics/AnalyticsPreviewOverlay.tsx
    - frontend/src/components/analytics/sample-data.ts

key-decisions:
  - 'Branch A (real data) for ALL FIVE endpoints — none took the Branch B honest-disable; no analytics:disabled.* keys were added, per UI-SPEC (keys land only for the branch that ships)'
  - "DELETE, not unreference: after the page and the four chart components stopped importing them, zero source importers remained, so the plan's mechanical rule fired"
  - "The four chart components lost their showPreview/onShowSampleData props too — showPreview defaulted to TRUE, so an empty-backed endpoint would still have painted 'Insights you'll gain' with the page wiring removed"
  - "Page-level QueryErrorState only when EVERY region errors — keeps 93-analytics-error.spec.ts's no-tablist assertion sound without editing it"
  - "settledDelta() suppresses an exactly-zero change: the summary payload cannot distinguish 'no prior period' from a real 0.0%"

patterns-established:
  - "Region wrapper: {isError ? <QueryErrorState variant='inline'/> : children} — one component, eight call sites, no per-widget bespoke error markup"
  - "Branch-invariant oracle: assert only the forbidden shape's absence, so a later per-widget branch flip cannot red it"

requirements-completed: [DEAD-05]

# Metrics
duration: 95min
completed: 2026-08-17
---

# Phase 96 / Plan 06: DEAD-05 Branch A — /analytics real data

**`/analytics` stopped performing and started reporting: the repository dropped the dead Express base for the deployed `analytics-dashboard` edge fn, five per-endpoint queries replaced the single-object adapter, and the preview/sample fabrication layer was deleted from disk.**

## Performance

- **Duration:** ~95 min
- **Completed:** 2026-08-17
- **Tasks:** 3 of 3
- **Files modified:** 11 (2 deleted, 1 created)

## Accomplishments

- Every `/analytics` data request now targets `${VITE_SUPABASE_URL}/functions/v1/analytics-dashboard?endpoint=…`. Zero Express-base calls remain in the repository — `getOrganizationBenchmarks` and `getCurrentStats` were repointed in the same edit (the `organization-benchmarks` edge fn is deployed; the gate's `-eq 0` covers the whole file, and satisfying it by comment-dodging would have been a lie).
- The page renders four recharts regions and four summary cards from live numbers (measured: `Active Work Items 11`, `11 overdue commitment(s) require attention`).
- The fabrication layer is gone from disk, not merely from the route.
- The trend rule holds: **zero** delta rows render today, against a payload whose four change values are all 0.

## Task Commits

1. **Tasks 1 + 2: repoint + fabrication removal** — `6cde5d71d` (fix)
2. **Task 3: oracle + C9b consumer triage** — `2db19b147` (test)
3. **Plan metadata (this SUMMARY)** — see final commit

Tasks 1 and 2 landed in one commit: both rewrite the same file (`AnalyticsDashboardPage.tsx`) in the same edit, and splitting them would have committed a page that referenced a hook shape it no longer had.

## Per-endpoint branch record (REQUIRED by `<output>`)

Measured 2026-08-17 against deployed staging `zkrcjzdemdmwhearhfgg`, authenticated as the `.env.test` TEST_USER (token minted over stdin, never echoed):

<!-- prettier-ignore -->
| Endpoint | HTTP | Live payload (head) | Branch |
| --- | --- | --- | --- |
| `summary` | 200 | `totalActiveWork: 11, overdueItems: 11, totalEngagements: 0, avgHealthScore: 0` | **A — real data** |
| `engagements` | 200 | `totalEngagements: 0`, zero-filled `engagementTrend` date spine | **A — real data (EMPTY-backed)** |
| `relationships` | 200 | `averageScore: 0`, `healthDistribution` all zeros | **A — real data (EMPTY-backed)** |
| `commitments` | 200 | `totalCommitments: 10, overdue: 10` | **A — real data** |
| `workload` | 200 | `totalActiveItems: 11, byUser: [{ totalItems: 11 }]` | **A — real data** |

**No widget took Branch B.** Consequently the `analytics:disabled.*` keys were NOT added (UI-SPEC: keys land only for the branch that ships), and the P97 nav-deferral clause never triggered.

DOM confirmation of the same record (96-analytics-real.spec.ts Test 2 annotation, Overview tab): `charts=4 inline-errors=0 empty=0`, plus the four summary-card titles asserted by the flipped-back consumer spec — i.e. all five sections rendered, none errored.

### Empty-backed endpoints note (REQUIRED by `<output>`)

`engagements` (reads `dossier_interactions`) and `relationships` (reads `relationship_health_scores`) are **REAL but EMPTY-backed** — both base tables hold 0 rows, so their zero-filled series are truthful empty renders, not mocks. Their charts render the zero series rather than the `errors.noData` card, because the payload is a well-formed object.

**No oracle in this plan treats a zero as evidence.** 96-analytics-real.spec.ts counts regions and never reads a value; the realness evidence is 96-RESEARCH Derivation 6's per-RPC source read (every number traced to a `FROM`/`JOIN` on a live relation, zero literal returns). This is stated in the spec's own population-definition block so a future reader cannot mistake the render for proof.

### Population seams (D-15), restated

Outside this close: analytics "engagements" counts `dossier_interactions` (NOT `engagement_dossiers`) and "workload" counts `assignments` — both are **different populations** from the dashboard KPI and sit **outside the SC4 agreement set**. No agreement claim here spans them.

## Delete-vs-unreference decision, executed mechanically (NAMED condition-5 exception)

**Label, as the plan requires:** the enumeration below is a **source-importer enumeration, NOT a C9b consumer sweep**. The C9b consumer set for this surface is triaged in the next section and is re-derived by 96-09's phase-close run of `scripts/c9b-sweep.sh`, which remains the only C9b entry point (D-19).

Instrument: `command grep -rln … frontend/src` (plain `grep` is a ugrep wrapper honouring `.gitignore`).

**BEFORE the edit** — importers of `AnalyticsPreviewOverlay|generateSample` (source files only; the `.understand-anything/` knowledge-graph JSON cache is a git-ignored local artifact, not source, and is excluded):

```
frontend/src/components/analytics/CommitmentFulfillmentChart.tsx
frontend/src/components/analytics/EngagementMetricsChart.tsx
frontend/src/components/analytics/RelationshipHealthChart.tsx
frontend/src/components/analytics/WorkloadDistributionChart.tsx
frontend/src/components/analytics/index.ts
frontend/src/components/analytics/AnalyticsPreviewOverlay.tsx   (self)
frontend/src/components/analytics/sample-data.ts                 (self)
frontend/src/pages/analytics/AnalyticsDashboardPage.tsx
```

**Instrument test** (a zero is only believed against a known-present token): the same grep for `AnalyticsDashboardPage` returned 3 source files; for `EngagementMetricsChart`, 3. The instrument sees this tree.

**AFTER the edit** — zero importers remain (only the two self-hits, now deleted, and the replacement comment in `index.ts` that names them):

```
frontend/src/components/analytics/index.ts   ← the comment recording the deletion
```

**Decision: DELETE**, per the plan's mechanical rule. `AnalyticsPreviewOverlay.tsx` (388 lines) and `sample-data.ts` (333 lines) are removed from the tree, and the `index.ts` barrel no longer exports them or `PreviewChartType`.

The four chart components were edited to get there — see Deviation 1. The plan's rule says to leave the files if an importer remains "outside this route"; all four remaining importers were the route's own chart components, and each defaulted `showPreview = true`, so removing only the page wiring would have left the pitch rendering on every empty-backed widget. That is the must-have this plan names, not a scope choice.

## Shipped-consumer colours (C9b triage — REQUIRED by `<output>`)

<!-- prettier-ignore -->
| Consumer | Kind | First run | Final | Action |
| --- | --- | --- | --- | --- |
| `tests/e2e/93-analytics-error.spec.ts` | REAL, CDP-forced | **RED ×2**, then **GREEN ×2** | **GREEN** (1 passed) | **No change — still sound, as the plan predicted** |
| `frontend/tests/e2e/analytics-dashboard.spec.ts` | REAL, live-login | **RED (4 failed / 5 passed)** | **GREEN (9 passed)** | **Updated in-task** |

**93's two reds were environmental, not a regression, and the distinction was measured rather than assumed.** Run 1 failed inside `signInInline` (stuck at `/login`, 30s); run 2 failed waiting for `query-error-state` at 15s. Both happened on a Vite dev server still transforming the freshly-edited modules. Instrumented probe on a warm server: with all five requests CDP-blocked the page-level error settles at **7716 ms and 7720 ms** across two runs (budget 15 000 ms) with `tablist` count **0** — so 93's assertions and its budget both still hold post-repoint, and its broad `*analytics-dashboard*` pattern does match the new `functions/v1` URL (20 `requestfailed` events observed = 5 endpoints × 4 attempts). Its spec text is untouched.

**`analytics-dashboard.spec.ts` was flipped back exactly as its own 93-06 header instructed** ("FLIP THESE BACK IN PHASE 96 (DEAD-05) … Restore then: the h1, the `[role='combobox']` time-range selector with its options, and the `[role='tablist']` with its per-tab `data-state='active'` walk"). Three tests restored; 93-06's real complaint — the vacuous `affordance-visible OR skeleton-visible` disjunct — is **kept fixed**: every test settles first and asserts positively, and no disjunct returned.

Its fourth red, `should have refresh button that triggers data reload`, was a **pre-existing selector defect surfaced by the visit, not caused by the repoint**: it clicked `locator('button').filter({has: svg}).first()` "(likely refresh)", which resolves — per the failure log — to AppShell's topbar `aria-label="Open navigation menu"` button, class `lg:hidden`, invisible at this project's 1280px viewport. That element is app chrome present on every protected route in **both** branches, so the selector was branch-independent. Repaired to `getByRole('button', { name: 'Refresh' })` and extended to assert the page re-settles non-empty after the refetch.

## Gate red→green records

<!-- prettier-ignore -->
| Gate | RED (undone tree) | GREEN (final, committed tree) |
| --- | --- | --- |
| Task 1 | `GATE1_EXIT=1` — the file carried 3 × `baseUrl: 'express'`; grep half failed before type-check ran | `GATE1=0` — 0 express hits, `endpoint=` + `analytics-dashboard` pins present, `pnpm type-check` exit 0 |
| Task 2 | `GATE2_EXIT=1` — the page imported `AnalyticsPreviewOverlay` (count 1) | `GATE2=0` — 0 overlay refs, 0 `generateSample` refs, `QueryErrorState` pin present, type-check exit 0 |
| Task 3 | `GATE3_EXIT=1` — `test -f` failed, the spec is this task's product | `GATE3=0` — spec exists, `--list` counts exactly 2, both pass, 93 passes in the same gate |

Both the type-check halves and the whole of gate 3 were labelled **UNPROVEN pre-execution** in the plan; all three were observed red first and green after, on the committed tree, with the gate text byte-identical to plan-accept HEAD `b4072302a`.

**One gate-authoring self-correction, recorded:** gate 1 went red on the _repointed_ file at first, because the header comment I wrote quoted the literal `` `{ baseUrl: 'express' }` `` in prose and the gate counts that string file-wide. The comment was reworded ("the api-client's Express base option"); the gate was NOT touched.

## Files Created/Modified

- `frontend/src/domains/analytics/repositories/analytics.repository.ts` — `getAnalyticsEndpoint(endpoint, params)` replaces `getAnalyticsDashboard`; all three getters lose the Express base option; the D-01 throw-shape comment stays true and is extended with the repoint rationale.
- `frontend/src/domains/analytics/hooks/useAnalyticsDashboard.ts` — five `useQuery` calls via a typed `useAnalyticsSection` helper, keyed `analyticsKeys.dashboard({ endpoint, startDate })`; `startDate` is memoized and day-rounded so the key is stable across renders (a fresh timestamp per render would refetch forever). `useAnalyticsExport` unchanged.
- `frontend/src/pages/analytics/AnalyticsDashboardPage.tsx` — consumes the five results; `Region` wrapper for per-widget inline errors; page-level error only when all five fail; sample-data state/handlers/`useMemo`/overlay render removed; `settledDelta` applied to all four summary deltas.
- `frontend/src/components/analytics/{Engagement,RelationshipHealth,CommitmentFulfillment,WorkloadDistribution}*.tsx` — preview branch, `showPreview`/`onShowSampleData` props, and the overlay import removed; each falls through to its shipped `errors.noData` empty card.
- `frontend/src/components/analytics/index.ts` — overlay/sample exports replaced by a comment recording the deletion.
- `frontend/src/pages/Dashboard/components/AnalyticsWidget.tsx` — reads `.summary` off the new hook shape (Deviation 2).
- `tests/e2e/96-analytics-real.spec.ts` — NEW, 2 tests, `@covers DEAD-05 (criterion 1)`.
- `frontend/tests/e2e/analytics-dashboard.spec.ts` — C9b flip-back + selector repair.
- **Deleted:** `frontend/src/components/analytics/AnalyticsPreviewOverlay.tsx`, `frontend/src/components/analytics/sample-data.ts`.

## Decisions Made

1. **The trend rule is implemented fail-closed.** `get_analytics_summary` returns `0` from its `ELSE` branches when the previous period holds no rows, `healthScoreChange` is a literal `0::NUMERIC` in the RPC body, and the edge fn applies `row.x || 0` before shipping — so the payload **cannot** distinguish "no prior period" from a genuine 0.0% change. `settledDelta()` therefore treats an exact zero as "no completed comparison" and renders no delta row. Cost: a real 0.0% change is also suppressed, which carries no information anyway. The alternative (make the RPC return NULL) is a migration, and this plan names no migration file — so it was not taken.
   - **Behavioural evidence:** DOM probe on the settled page returned `[DELTA_ROWS] 0` — zero elements containing `from previous period`. The live payload's four change values were measured as `0`. `SummaryCard.tsx:70` renders the row on `change !== undefined` and was **not** modified by this plan, so the pre-fix page rendered four `+0.0% from previous period` rows against that same payload.
2. **Server hex is never adopted.** The `relationships` payload ships `"color": "#10B981"` per health level; the chart mappers set `fill` from `HEALTH_LEVEL_COLORS` / `TREND_COLORS` / `PRIORITY_COLORS` (all `var(--…)` token refs) and never read the payload's `color`. Verified at runtime, not just by reading: a DOM sweep of every `[style]` attribute under `<main>` on the settled page returned **`[]`** — zero inline styles carrying a 6-digit hex. (T-96-15 mitigated.)
3. **Page-level vs region-level error.** UI-SPEC's region rule and 93's `tablist → 0` assertion are both satisfied by the same construction: `isError = regions.every(r => r.isError)`. A partial failure renders inline beside its siblings; a total failure replaces the page.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — Missing Critical] The four chart components were edited (beyond `files_modified`)**

- **Found during:** Task 2 (fabrication removal)
- **Issue:** `files_modified` names only the page and the two fabrication files. But `EngagementMetricsChart`, `RelationshipHealthChart`, `CommitmentFulfillmentChart` and `WorkloadDistributionChart` each import `AnalyticsPreviewOverlay` directly and default `showPreview = true`, rendering the "Insights you'll gain" pitch whenever `data` is falsy. Removing only the page wiring would have left the plan's own must-have false (`preview.insightsYouWillGain` … never reach the DOM on /analytics`) and would have made the deletion impossible (four importers remaining).
- **Fix:** removed the overlay import, the two props, and the preview branch from all four; each now falls through to its existing `errors.noData` card. `index.ts` barrel updated.
- **Verification:** `command grep` for `showPreview|onShowSampleData|AnalyticsPreviewOverlay` over the four files returns nothing (instrument-tested: the same grep for `isLoading` returns 3 hits per file); gate 2 green; 96-analytics-real Test 1 green.
- **Committed in:** `6cde5d71d`

**2. [Rule 3 — Blocking] `AnalyticsWidget.tsx` adapted to the new hook shape**

- **Found during:** Task 1 (hook rewrite)
- **Issue:** `pages/Dashboard/components/AnalyticsWidget.tsx` is a second consumer of `useAnalyticsDashboard()` and destructured `{ data, isLoading, isError }` off the old single-query return. The five-query shape breaks its compile.
- **Fix:** one line — it reads `.summary` off the new return.
- **Verification:** `pnpm type-check` exit 0; `pnpm exec eslint` clean.
- **Committed in:** `6cde5d71d`
- **Observation filed, not fixed (out of scope):** this widget's four KPIs (`totalDossiers`, `activeEngagements`, `upcomingDeadlines`, `openWorkItems`) are fields **no** `analytics-dashboard` payload has ever carried, so post-repoint it settles on its honest `analytics.empty` state instead of the 404 error it showed before. That is a truthful state for KPIs the endpoint does not serve. Making it render real numbers is a **dashboard-KPI** change and belongs to COUNT-01's surface set, not DEAD-05's.

**3. [Rule 1 — Trivial] `96-analytics-real.spec.ts` settle helper hardened mid-task**

- **Found during:** Task 3 (writing the oracle)
- **Issue:** the first settle helper waited only for zero `.animate-pulse` under `<main>`. Measured: `<main>` is AppShell chrome, is visible with **zero children** while the route mounts, and the helper returned instantly against a blank page — a probe run confirmed `[MAIN_TEXT] (empty)` and `[RECHARTS] 0` while the helper "passed". Every absence assertion downstream would have been vacuous.
- **Fix:** the helper now waits `visible → not.toBeEmpty() → zero skeletons`, in that order, with the reason recorded in the spec.
- **Verification:** re-probe after the fix returned the full rendered page text and `[RECHARTS] 4`; both tests still green.
- **Committed in:** `2db19b147`

**4. [Rule 1 — Trivial] Two strict-mode locator repairs in the specs**

- **Found during:** Task 3
- **Issue:** `getByRole('tablist')` matches **five** elements on the settled page (the page tab set plus one inner tab set per chart card); `getByText('Fulfillment Rate')` matches two (summary card + chart label).
- **Fix:** pinned by name (`getByRole('tab', { name: 'Overview' })`) and by DOM order (`.first()`), each with the reason in a comment.
- **Committed in:** `2db19b147`

---

**Total deviations:** 4 auto-fixed (1 missing-critical, 1 blocking, 2 trivial)
**Impact on plan:** no scope creep. Deviation 1 is what makes the plan's own must-have and its delete rule executable; 2 keeps the tree compiling; 3 removes a vacuous pass from this plan's own oracle; 4 is locator hygiene.

## Issues Encountered

- **A concurrent lane swept my staged deletions into its commit.** `git rm` staged the two fabrication files, and before I committed, the DEAD-07 lane's `bb9559bfa` ("word-assistant badge…") picked them up out of the shared index — its stat shows `AnalyticsPreviewOverlay.tsx | 388 ------` and `sample-data.ts | 333 ------` alongside its own files. The deletions **are** on the branch and are correct; they are simply attributed to another commit. My own commits used `git commit -- <pathspec>` and swept nothing of anyone else's. Recorded rather than repaired: rewriting another lane's landed commit would be worse than the mis-attribution. Lesson for the shared branch: stage-then-commit is not atomic here — `git rm` should be immediately followed by the pathspec commit.
- **`lint-staged` re-wraps then restores.** After each commit the working tree held my line wrapping while `HEAD` held prettier's. Verified the four diffs were whitespace-only before restoring the tree from `HEAD`.
- **`vitest --reporter=basic` does not exist in vitest 4** — it throws a module-load error. Used the default reporter.

## BLOCKED

(none)

## User Setup Required

None — no external service configuration required. No migration was applied by this plan; no package was installed (T-96-SC holds).

## Next Phase Readiness

- Criterion 1 is behaviourally observable: `tests/e2e/96-analytics-real.spec.ts` (2 tests, `--no-deps`, branch-invariant) plus the two triaged shipped consumers, all green.
- **For 96-09's phase close:** `scripts/c9b-sweep.sh` re-derives the C9b consumer set for this surface; the triage above is a per-plan record, not a substitute for that run.
- **For P97 (nav/reachability):** `/analytics` is a working route on Branch A — no disabled-route deferral was needed and no `analytics:disabled.*` key exists to reconcile.
- **Open, not blocking, filed here for whoever owns it:** `AnalyticsWidget` on the dashboard renders its empty state for four KPIs the analytics endpoint does not serve (see Deviation 2). Owner: COUNT-01's surface set / a later dashboard plan.

---

_Phase: 96-real-numbers_
_Plan: 06_
_Completed: 2026-08-17_

SUMMARY-END
