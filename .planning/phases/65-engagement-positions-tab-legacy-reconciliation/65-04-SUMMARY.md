---
phase: 65-engagement-positions-tab-legacy-reconciliation
plan: 04
subsystem: engagement-workspace
tags: [engagement, workspace, cta-reconciliation, task-dialog, work-item-dossiers]
requires:
  - workspace.json i18n keys (actions.createTask, empty.tasks.* updates) — OWNED by plan 65-01 (same wave)
provides:
  - Exported TaskDialog + EventDialog from AddToDossierDialogs.tsx (workspace-aware invalidations)
  - Functional Create Task CTAs in OverviewTab + TasksTab (engagement-typed context, no engagement_id)
  - Centralized AddToDossierDialogs.tsx changes (so plan 65-05 needs no edits there)
affects:
  - frontend/src/components/dossier/AddToDossierDialogs.tsx
  - frontend/src/pages/engagements/workspace/OverviewTab.tsx
  - frontend/src/pages/engagements/workspace/TasksTab.tsx
tech-stack:
  added: []
  patterns:
    - "Engagement-as-dossier: reuse shipped dossier-page dialogs with dossier_type:'engagement', inheritance_source:'direct'"
    - 'Dual-path dialog mount: lift guarded TaskDialog JSX, render in both empty-state and main return paths'
    - "Prefix-invalidation for cross-surface refresh (['engagement-kanban', id] / ['engagement-calendar-entries', id])"
key-files:
  created:
    - frontend/src/pages/engagements/workspace/__tests__/CreateTaskCtas.test.tsx
  modified:
    - frontend/src/components/dossier/AddToDossierDialogs.tsx
    - frontend/src/pages/engagements/workspace/OverviewTab.tsx
    - frontend/src/pages/engagements/workspace/TasksTab.tsx
decisions:
  - 'Dialog mounting = Option A (surgical): export module-private TaskDialog/EventDialog with unchanged ActionDialogProps; each tab mounts only what it needs'
  - 'Import casing normalized to @/components/dossier (lowercase, git-tracked) to match DossierShell and avoid TS1149 cross-casing error'
  - "Create Task CTAs re-enabled with the recorded kanban caveat (Wave-0 Q1): board reads legacy assignments plane, dialog-created tasks won't appear there"
metrics:
  duration: ~25m
  tasks: 3
  files_changed: 4
  completed: 2026-06-12
---

# Phase 65 Plan 04: Create Task CTA Reconciliation Summary

Wired the engagement workspace Create Task CTAs (UI-SPEC dispositions #3/#4/#5) through the shipped `TaskDialog` with an engagement-typed `DossierContextForAction`, removed OverviewTab's redundant Transition Stage button (#2), and centralized all phase-65 `AddToDossierDialogs.tsx` changes (exports + two workspace-scoped success invalidations) so plan 65-05 never touches that file.

## What Was Built

- **Task 1 (RED test):** `CreateTaskCtas.test.tsx` (294 lines) — 5 assertions across OverviewTab/TasksTab wiring (#2-#5) plus the `TaskDialog` submit-payload contract (no `engagement_id`, links via `work_item_dossiers`, invalidates `['engagement-kanban', engagementId]`). Tab tests stub the exported `TaskDialog` to capture props; the payload test `vi.doUnmock`s the module and renders the real dialog. Commit `15c9a12a`.
- **Task 2 (dialog exports + invalidations):** Added `export` to `TaskDialog` and `EventDialog`; `TaskDialog` success now prefix-invalidates `['engagement-kanban', dossier_id]`; `EventDialog` success now prefix-invalidates `['engagement-calendar-entries', dossier_id]` (the render-path key plan 65-05's reader consumes). `ActionDialogProps` unchanged; zero toast changes (Pitfall 6). Commit `1fca7860`.
- **Task 3 (tab wiring):** OverviewTab — deleted the disabled Transition Stage button, wired Create task to open `TaskDialog` (readiness guard `dossierContext === null || dossier === undefined`). TasksTab — enabled both buttons (empty-state + header), normalized the header button `min-h-8 → min-h-11` (44px CTA floor), rendered the guarded `TaskDialog` in both render paths via a lifted `taskDialog` element. Commit `73aac597`.

## Verification

- `pnpm exec vitest run CreateTaskCtas.test.tsx` → 5 passed (was 4 failed | 1 passed at RED).
- `pnpm type-check` → exit 0.
- `pnpm exec eslint <4 touched files> --max-warnings 0` → clean.
- Plan acceptance checks: `transitionStage` gone from OverviewTab; `TaskDialog` referenced 9× in TasksTab; no `engagement_id` in either tab; remaining `min-h-8` are only on the sort/mobile `<select>` dropdowns (out of scope — Surgical Changes).

## Dependency Note (cross-plan, same wave)

The i18n keys this plan's buttons render (`actions.createTask`, `empty.tasks.action`, `empty.tasks.body`) live in `frontend/src/i18n/{en,ar}/workspace.json`, which is **single-owned by plan 65-01** (same wave). This plan consumes the keys by name only — it does NOT edit workspace.json. The honest `empty.tasks.body` copy (pointing users to the main tasks list) is plan 65-01's responsibility and is the user-facing half of the kanban-caveat honesty fix.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Import-casing conflict (TS1149)**

- **Found during:** Task 3 type-check
- **Issue:** New imports used `@/components/Dossier/AddToDossierDialogs` (capital D), but the git-tracked directory is lowercase `dossier` and `DossierShell.tsx` imports lowercase. TypeScript flagged the same file included under two casings (`error TS1149`), failing the build.
- **Fix:** Normalized all three new imports (OverviewTab, TasksTab, the test) to `@/components/dossier/...` (lowercase, git-canonical). This also satisfies the case-sensitive CI lint/build on Linux.
- **Files modified:** OverviewTab.tsx, TasksTab.tsx, CreateTaskCtas.test.tsx
- **Commit:** `73aac597` (folded into Task 3)

Otherwise the plan executed as written.

## Out-of-Scope Follow-Up (recorded, not done)

**Kanban canonicalization (T-65-11 / Wave-0 Q1 caveat).** TasksTab's board reads the legacy `assignments` plane via `engagements-kanban-get`. A task created through the wired `TaskDialog` persists to `tasks` + `work_item_dossiers` but will **not** render on the kanban board (it appears in the main tasks list and dossier work-item surfaces instead). The three seeded engagement-dossier ids dual-exist in legacy `engagements`, so the board renders EMPTY rather than 404; new canonical engagements without a legacy twin would 404. This plan adds the `['engagement-kanban', engagementId]` invalidation anyway (so the board refreshes the moment the data planes are reconciled) and relies on plan 65-01's honest `empty.tasks.body` copy so the empty board after a successful create does not read as a failure. **Reconciling the kanban data plane onto the canonical `tasks`/`work_item_dossiers` reader is a recorded follow-up for a future phase.**

## Threat Surface

No new security-relevant surface introduced. Both wired write paths reuse existing edge-validated + RLS-protected mutations verbatim (`tasks-create`, `work-item-dossiers`); no new endpoints, no service-role usage. T-65-10 (no `engagement_id` in the create payload) is enforced and unit-asserted.

## Self-Check: PASSED
