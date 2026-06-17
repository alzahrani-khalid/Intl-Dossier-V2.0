---
phase: 71-analytic-graph
plan: 04
subsystem: ui
tags: [react, tanstack-query, tanstack-router, react-flow, i18next, supabase-edge-fn, graph]

# Dependency graph
requires:
  - phase: 71-03
    provides: live analytic-graph edge fn + query_graph RPC (clearance-gated, {nodes,edges,stats})
  - phase: 71-01
    provides: RED FE tests (AnalyticQueryPicker.test.tsx, AnalyticResultView.test.tsx) pinning the component contract
provides:
  - useAnalyticGraph hook (TanStack Query wrapper over the analytic-graph edge fn under the session token)
  - extended /relationships/graph route search schema (mode/query/entity2/windowDays)
  - AnalyticQueryPicker (4 query templates, typed entity inputs, window-N, dossier pre-fill, Run analysis CTA)
  - AnalyticResultView (structured result per query type, indistinguishable-empty, token-bound chrome)
  - RelationshipGraphPage Analyze mode (URL-driven, Graph/List flip, stats strip reuse, GlobeSpinner loading)
affects: [71-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Edge-fn-backed hook mirrors fetchGraphData + useQuery(['analytic-graph',…]) with 30s staleTime and enabled-on-entityId"
    - 'URL-as-state Analyze mode: query + params live in route search (deep-linkable for Cmd+K), not local state'
    - 'Indistinguishable-empty render contract: reduced-clearance == genuine-empty chrome, zero clearance-revealing copy'
    - 'Defensive {{count}} .replace() fallback so count lines render the numeral even when i18next interpolation is mocked'

key-files:
  created:
    - frontend/src/hooks/useAnalyticGraph.ts
    - frontend/src/components/relationships/AnalyticQueryPicker.tsx
    - frontend/src/components/relationships/AnalyticResultView.tsx
  modified:
    - frontend/src/routes/_protected/relationships/graph.tsx
    - frontend/src/pages/relationships/RelationshipGraphPage.tsx
    - frontend/src/i18n/en/graph.json
    - frontend/src/i18n/ar/graph.json

key-decisions:
  - 'Shipped shortest_path unconditionally (RF-4 confirmed low-cost in 71-03); all 4 templates always visible'
  - "AnalyticResultView accepts a partial result shape (stats optional) so the RED tests' stats-less fixtures render"
  - 'Analyze mode added as an additive early-return branch in RelationshipGraphPage — degrees-traversal render path untouched (zero regression)'
  - 'Analytic node clicks route through the existing type-aware handleNodeSelect, with a fallback to the mapped analytic nodes for type resolution'

patterns-established:
  - 'Pattern 1: token-bound inline styles via var(--*) (border 1px solid var(--line), var(--row-h), var(--accent-soft)) for new design-system surfaces — no raw hex, no Tailwind color literals'
  - "Pattern 2: count-bearing i18n lines use t(key, fallback, {count}).replace('{{count}}', n) so the numeral is present in both prod (interpolated) and mocked-t unit tests"

requirements-completed: [GRAPH-01, GRAPH-03]

# Metrics
duration: 75min
completed: 2026-06-17
---

# Phase 71 Plan 04: Analyze Surface Summary

**The analyst-facing Analyze experience: a `useAnalyticGraph` hook over the live edge fn, an extended route schema, a 4-template `AnalyticQueryPicker`, an `AnalyticResultView` (list/table/timeline/path with indistinguishable-empty), and the URL-driven Analyze mode wired into `RelationshipGraphPage` with the Graph/List flip — both 71-01 RED tests turned GREEN.**

## Performance

- **Duration:** ~75 min
- **Started:** 2026-06-17T08:53:00Z
- **Completed:** 2026-06-17T10:10:00Z
- **Tasks:** 3
- **Files modified:** 7 (3 created, 4 modified)

## Accomplishments

- `useAnalyticGraph` calls the live `/functions/v1/analytic-graph` edge fn under the session JWT, mirroring the graph-traversal fetch + `useQuery` 30s-cache pattern; clearance stays server-side (a reduced caller silently receives fewer/zero rows).
- Route search schema extended with `mode`/`query`/`entity2`/`windowDays` using the existing string-guard idiom; `dossierId` preserved.
- `AnalyticQueryPicker` renders the 4 query templates, 1 or 2 typed entity inputs (intersection/path need a second), a window-N control for chains, a `defaultEntityId` pre-fill (D-02), and a single primary "Run analysis" CTA.
- `AnalyticResultView` renders the structured primary result keyed to query type — membership list (rows at `var(--row-h)`), intersection table, newest-first engagement timeline (day-first dates via `formatDayFirst`), and an ordered shortest-path hop sequence — with `GlobeSpinner` loading, a `--danger` error banner, and the LOCKED indistinguishable-empty contract (zero clearance-revealing copy, verified by the test asserting `not.toMatch(/clearance|filtered|restricted|permission/i)`).
- `RelationshipGraphPage` gained a URL-driven Analyze mode (D-04): the picker pre-fills from the dossier anchor, `onRun` navigates the search params, and the result region uses a Graph/List `<Tabs>` flip — List (default, D-03) shows `AnalyticResultView`, Graph feeds `AdvancedGraphVisualization`. The stats strip + complexity badge + `performance_warning` are reused (RF-8). The degrees-traversal exploration is untouched.
- All `analyze.*` copy added to both `en/graph.json` and `ar/graph.json` (both languages per the CI guard) under the already-registered `graph` namespace.

## Task Commits

Each task was committed atomically:

1. **Task 1: useAnalyticGraph hook + extended route search schema** - `ee8cabe8` (feat)
2. **Task 2: AnalyticQueryPicker + AnalyticResultView components** - `e5c04cc6` (feat)
3. **Task 3: Wire Analyze mode into RelationshipGraphPage** - `45ebae7d` (feat)

**Plan metadata:** _(this commit)_ (docs: complete plan)

## Files Created/Modified

- `frontend/src/hooks/useAnalyticGraph.ts` (created) - TanStack Query wrapper over the analytic-graph edge fn under the session token; exports `AnalyticQueryType`, `AnalyticGraphResult`, `useAnalyticGraph`.
- `frontend/src/components/relationships/AnalyticQueryPicker.tsx` (created) - Query-template selector + typed inputs + window-N + dossier pre-fill + Run analysis CTA.
- `frontend/src/components/relationships/AnalyticResultView.tsx` (created) - Structured result per query type (list/table/timeline/path); GlobeSpinner loading; `--danger` error; indistinguishable-empty.
- `frontend/src/routes/_protected/relationships/graph.tsx` (modified) - `validateSearch` extended with mode/query/entity2/windowDays (whitelisted/bounded); `dossierId` preserved.
- `frontend/src/pages/relationships/RelationshipGraphPage.tsx` (modified) - Additive Analyze-mode branch: picker + result region + Graph/List flip + stats reuse; degrees-traversal render preserved.
- `frontend/src/i18n/en/graph.json` + `frontend/src/i18n/ar/graph.json` (modified) - `analyze.*` keys (templates, entity labels, window, count lines, empty/error copy) in both languages.

## Decisions Made

- **shortest_path shipped unconditionally** — RF-4 (confirmed low-cost in 71-03) resolved the UI-SPEC's conditional template-4 question; all 4 templates are always visible.
- **`AnalyticResultView` accepts a partial result** (stats optional) — the 71-01 RED fixtures omit `stats`, so the view must render from `{query_type, nodes, edges, path…}` alone. The page supplies the full stats strip separately from `analyticData.stats`.
- **Analyze mode is an additive early-return branch** in `RelationshipGraphPage` (not a refactor of the existing render) — guarantees the degrees-traversal exploration is byte-for-byte preserved (baseline `traverse` count unchanged at 0; existing `useQuery(['graph-traversal',…])` untouched).
- **Analytic node clicks reuse `handleNodeSelect`** with a fallback to the mapped analytic nodes for type resolution, since analytic results are not in the degrees-traversal `deduplicatedNodes` set; routing stays type-aware via `getDossierDetailPath` (the bare `/dossiers/$id` route does not exist).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Count-line `{{count}}` leaked the literal token under the test's mocked `t`**

- **Found during:** Task 2 (AnalyticResultView)
- **Issue:** The shortest-path count line used `t('analyze.count.path', 'Connected in {{count}} hops', { count })`. The repo's standard component-test mock for `react-i18next` returns the raw `defaultValue` without interpolation, so `getByText(/2 hops/i)` failed (the DOM showed literal `{{count}}`). This would also surface as a raw `{{count}}` to any consumer where interpolation is unavailable.
- **Fix:** Added a `countLine(t, key, fallback, count)` helper that applies `.replace('{{count}}', String(count))` after `t()`. In production i18next has already interpolated (no-op replace); under the mock the numeral is substituted. Keeps the LOCKED copy strings intact.
- **Files modified:** `frontend/src/components/relationships/AnalyticResultView.tsx`
- **Verification:** `AnalyticResultView.test.tsx` GREEN (6/6); the `/2 hops/i` assertion passes.
- **Committed in:** `e5c04cc6` (Task 2 commit)

**2. [Rule 2 - Missing Critical] Type-aware navigation lost the type for analytic nodes**

- **Found during:** Task 3 (page wiring)
- **Issue:** The existing `handleNodeSelect` resolved a clicked node's `type` only from `deduplicatedNodes` (the degrees-traversal set). Analytic-result nodes are not in that set, so `node?.type` was `undefined` and the route segment fell back to the generic default — a wrong/dead-end dossier link for analytic node clicks (threat T-71-04-NAV).
- **Fix:** Built `analyticGraphNodes`/`analyticGraphEdges` memos mapping the edge-fn result onto `AdvancedGraphVisualization`'s `NodeData`/`EdgeData` (this also removed two `as never` casts on the Graph-view props), and extended `handleNodeSelect` to fall back to `analyticGraphNodes` for type resolution.
- **Files modified:** `frontend/src/pages/relationships/RelationshipGraphPage.tsx`
- **Verification:** `tsc --noEmit` clean (typed mapping, no `never` casts); analytic Graph/List node clicks now resolve a type-aware `/dossiers/<segment>/$id` path.
- **Committed in:** `45ebae7d` (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing-critical)
**Impact on plan:** Both fixes were necessary for correctness — #1 to satisfy the RED contract and avoid a literal `{{count}}` leak; #2 to honor the type-aware-navigation mitigation in the plan's threat model. No scope creep; both stayed within the named files.

## Issues Encountered

- The `pnpm test -- --run <file>` filter did not narrow to a single file (it ran the full suite, with `CommandPalette.analyze.test.tsx` — plan 71-05's RED target — as the only unrelated failure). Resolved by running the two target files via explicit relative paths through `pnpm exec vitest run <path1> <path2>`, which confirmed 2 files / 10 tests GREEN in isolation.

## Known Stubs

None that block the plan goal. The picker's entity fields are free-text dossier-id `<Input>`s (the plan action specifies "typed inputs"; a typeahead dossier-picker is a future enhancement noted in the UI-SPEC "Entity pickers reuse existing dossier-selection primitives" and is not required for GRAPH-01). The empty/reduced state is the intentional indistinguishable-empty contract (GRAPH-03), not a placeholder.

## User Setup Required

None - no external service configuration required. The `analytic-graph` edge fn + `query_graph` RPC are already live on staging (applied/deployed in 71-03).

## Next Phase Readiness

- Plan 71-05 (Cmd+K "Analyze:" entry-point + compact inline result) is unblocked: this plan is the full-panel deep-link target the Cmd+K entries navigate to via `?mode=analyze&query=<type>&dossierId=<id>`. The route search schema already validates those params, and `CommandPalette.analyze.test.tsx` remains RED for 71-05 to turn GREEN.
- `useAnalyticGraph` is reusable by the Cmd+K compact result.
- No blockers.

## Threat Flags

None - no security surface introduced beyond the plan's `<threat_model>`. The hook reuses the existing live `analytic-graph` edge fn (clearance enforced server-side in the INVOKER RPC), there is no `dangerouslySetInnerHTML`, and React escapes all DB-sourced node content.

## Self-Check: PASSED

- Created files verified on disk: `useAnalyticGraph.ts`, `AnalyticQueryPicker.tsx`, `AnalyticResultView.tsx`, `71-04-SUMMARY.md`.
- Task commits verified in git log: `ee8cabe8`, `e5c04cc6`, `45ebae7d`.
- Both 71-01 RED FE tests GREEN (2 files / 10 tests); full `tsc --noEmit` clean; design-token + RTL grep gates pass.

---

_Phase: 71-analytic-graph_
_Completed: 2026-06-17_
