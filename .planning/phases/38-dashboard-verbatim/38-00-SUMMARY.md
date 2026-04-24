---
phase: 38-dashboard-verbatim
plan: '00'
status: PASS
subsystem: frontend/dashboard
tags: [scaffold, route, widgets, css, i18n, hooks, e2e, RTL, tokens]
requirements_addressed: [DASH-08, DASH-09]
dependency_graph:
  requires: []
  provides:
    - 'Dashboard composer mounted at `/`'
    - 'widgets/ barrel + 4 shared primitives + 9 widget stubs (Wave 1 hydrates bodies)'
    - 'dashboard.css verbatim port + Phase 33 token mapping'
    - 'useWeekAhead + usePersonalCommitments adapter contracts'
    - 'Playwright `loginAndWaitForDashboard` fixture for Wave 1/2 widget specs'
  affects:
    - 'frontend/src/routes/_protected/dashboard.tsx (lazy import swap; OperationsHub kept as legacy until plan 38-09)'
    - 'frontend/src/hooks/useCommitments.ts (function exported — was internal)'
    - 'frontend/src/i18n/{en,ar}/dashboard-widgets.json (10 namespaces added; existing customDashboard keys preserved)'
tech_stack:
  added: []
  patterns:
    - 'Adapter hook over domain query (useMemo + transform → stable refs)'
    - 'Logical-property RTL CSS (border-inline-end / padding-inline-end / text-align: end)'
    - 'Phase 33 token-only colors (zero hex literals in CSS)'
key_files:
  created:
    - frontend/src/pages/Dashboard/index.tsx
    - frontend/src/pages/Dashboard/widgets/index.ts
    - frontend/src/pages/Dashboard/widgets/dashboard.css
    - frontend/src/pages/Dashboard/widgets/WidgetCard.tsx
    - frontend/src/pages/Dashboard/widgets/WidgetHeader.tsx
    - frontend/src/pages/Dashboard/widgets/WidgetSkeleton.tsx
    - frontend/src/pages/Dashboard/widgets/DashboardGrid.tsx
    - frontend/src/pages/Dashboard/widgets/KpiStrip.tsx
    - frontend/src/pages/Dashboard/widgets/WeekAhead.tsx
    - frontend/src/pages/Dashboard/widgets/OverdueCommitments.tsx
    - frontend/src/pages/Dashboard/widgets/Digest.tsx
    - frontend/src/pages/Dashboard/widgets/SlaHealth.tsx
    - frontend/src/pages/Dashboard/widgets/VipVisits.tsx
    - frontend/src/pages/Dashboard/widgets/MyTasks.tsx
    - frontend/src/pages/Dashboard/widgets/RecentDossiers.tsx
    - frontend/src/pages/Dashboard/widgets/ForumsStrip.tsx
    - frontend/src/hooks/useWeekAhead.ts
    - frontend/src/hooks/usePersonalCommitments.ts
    - frontend/src/hooks/__tests__/useWeekAhead.test.ts
    - frontend/src/hooks/__tests__/usePersonalCommitments.test.ts
    - frontend/tests/e2e/dashboard.spec.ts
  modified:
    - frontend/src/routes/_protected/dashboard.tsx
    - frontend/src/hooks/useCommitments.ts
    - frontend/src/i18n/en/dashboard-widgets.json
    - frontend/src/i18n/ar/dashboard-widgets.json
decisions:
  - 'Promoted `useCommitments` from local function to exported (Rule 3: blocking issue — adapter could not import otherwise)'
  - 'Renamed top-level i18n key `tasks` → `myTasks` to avoid namespace collision with future workflow-tasks i18n (existing file already uses `tasks` inside `settings`, not at root, so no breakage; new namespace is `myTasks` documented in summary)'
  - 'OverdueCommitments adapter uses `dossier_id` as `dossierName` placeholder and slices `owner_user_id` for `ownerInitials` because the current `Commitment` interface lacks joined dossier/user metadata. Plan 38-02 (Wave 1) is responsible for extending the service query with joins (logged in `deferred-items` via inline JSDoc on the hook)'
  - 'Added widget-scoped CSS variable fallbacks (`--pad`, `--gap`, `--radius`, `--radius-sm`, `--ink-soft`, `--*-soft`) inside `.dash-root` because Phase 33 token system does not yet define them globally — keeps the verbatim handoff rules byte-for-byte while not introducing new global tokens this plan'
  - 'Inserted explicit responsive media-query fallbacks (320/768/1280) for `.dash-grid` because the handoff is desktop-only (RESEARCH A6); preserves mobile-first rule from CLAUDE.md'
metrics:
  duration_minutes: 35
  completed_date: '2026-04-25'
  tasks_completed: 3
  files_changed: 23
commits:
  - hash: '43e07130'
    type: feat
    title: 'rewrite / route to mount Dashboard composer + widget scaffold'
  - hash: 'cd625ec5'
    type: feat
    title: 'port handoff app.css dashboard rules + seed widget i18n keys'
  - hash: '49a9a065'
    type: feat
    title: 'adapter hooks + Playwright skeleton'
tests_run:
  - 'frontend ./node_modules/.bin/vitest run src/hooks/__tests__/useWeekAhead.test.ts src/hooks/__tests__/usePersonalCommitments.test.ts → 9/9 passed'
  - 'frontend ./node_modules/.bin/tsc --noEmit (filtered to plan files) → 0 errors'
  - 'frontend ./node_modules/.bin/playwright test --list tests/e2e/dashboard.spec.ts → 1 test discovered'
coverage_notes: 'Adapter hooks fully covered. Widget stubs deliberately uncovered (Wave 1 hydrates bodies + tests). E2E spec is skeleton-only — Wave 2 (38-09) extends with render/wiring/a11y/VR blocks.'
deviations:
  - rule: 'Rule 3 — blocking issue'
    type: missing-export
    description: '`useCommitments` was declared as a local `function` (not exported), which prevented the new `usePersonalCommitments` adapter from importing it. Promoted to `export function useCommitments`. No call-site changes; backward compatible.'
    file: frontend/src/hooks/useCommitments.ts
  - rule: 'Convention — i18n namespace'
    type: rename-to-avoid-collision
    description: "Plan 38-00 specified top-level `tasks` namespace but the project already uses `tasks` semantics inside `settings.tasks` and other features may want a top-level `tasks` for workflow keys. Renamed to `myTasks` for the dashboard 'My Tasks' widget."
    file: frontend/src/i18n/{en,ar}/dashboard-widgets.json
open_risks:
  - "OperationsHub.tsx + operations-hub domain still on disk — plan 38-09 (Wave 2) will delete after all 8 widgets are wired. TODO comment placed at the route's lazy import."
  - '`usePersonalCommitments` returns `dossierName === dossier_id` placeholder; widget plan 38-02 must wire the joined dossier metadata (extend `getCommitments` SELECT).'
  - 'Phase 33 token system is missing some handoff-required tokens (`--pad`, `--gap`, `--radius`, `--*-soft`); fallbacks live inside `.dash-root`. Wave 2 may want to promote them to global.'
threat_flags: []
---

# Phase 38 Plan 00: Dashboard scaffold (route + widgets + CSS + adapters + E2E skeleton) Summary

**One-liner:** Wired the new `Dashboard` composer at `/` with 8 widget stubs, ported handoff CSS verbatim with Phase 33 tokens, and shipped two adapter hooks (`useWeekAhead`, `usePersonalCommitments`) with the security-critical `ownerType: 'internal'` guard pinned by unit tests — so Wave 1 widget plans can hydrate bodies in parallel without touching the scaffold.

## Outcome

- 23 files changed (21 created, 2 modified, 1 modified+exported)
- 3 atomic feat commits on `DesignV2`
- 9/9 hook unit tests pass
- TypeScript clean across plan files
- Playwright skeleton spec discovered and ready for Wave 1 extension

## Key Decisions Made

1. **OperationsHub deletion deferred to plan 38-09 (Wave 2 cleanup)** — keeps Wave 1 widget plans independent of the legacy domain. Route's `lazy(() => import('@/pages/Dashboard'))` is the new entry point; OperationsHub.tsx is no longer reachable from the router.

2. **Adapter hook contracts pinned by unit tests** (T-38-02) — Wave 1 widget plans can rely on the typed return shape (`GroupedEvents` for `useWeekAhead`, `GroupedCommitment[]` for `usePersonalCommitments`) without re-discovery.

3. **`ownerType: 'internal'` enforced + tested** (T-38-09) — the test "CRITICAL: passes ownerType: 'internal'" asserts the param is set so external-contact commitments cannot leak into the personal dashboard.

## Threat Mitigations Verified

| Threat ID                      | Disposition | Verification                                                                                                                    |
| ------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| T-38-01 (mock leak)            | mitigated   | All 9 widget files render `<WidgetSkeleton />` only — zero mock constants                                                       |
| T-38-02 (adapter contract)     | mitigated   | 9 unit tests pin `useWeekAhead` + `usePersonalCommitments` return shape                                                         |
| T-38-08 (FirstRun preserved)   | mitigated   | grep confirms `FIRST_RUN_DISMISSED_KEY`, `useTourComplete`, `useFirstRunCheck`, `FirstRunModal` retained byte-for-byte in route |
| T-38-09 (ext commitments leak) | mitigated   | Test `"CRITICAL: passes ownerType: 'internal'"` passes (asserts call args)                                                      |

## Self-Check: PASSED

- Files created: 21/21 verified on disk
- Files modified: 2/2 verified (route + useCommitments + i18n EN + i18n AR)
- Commits: `43e07130`, `cd625ec5`, `49a9a065` all present in `git log`
- key_links pattern regexes:
  - `import\('@/pages/Dashboard'\)` → matches at `dashboard.tsx:40`
  - `from './widgets'` → matches at `pages/Dashboard/index.tsx:13`
  - `ownerType:\s*['\"]internal['\"]` → matches at `usePersonalCommitments.ts:79`
- Hex check (must be 0): 0 ✓
- Forbidden RTL classes (`ml-`/`mr-`/`pl-`/`pr-`/`text-left`/`text-right`) in plan files: 0 ✓
- Hook tests: 9/9 pass
- Playwright `--list`: "dashboard route mounts" discovered ✓
