---
phase: 65-engagement-positions-tab-legacy-reconciliation
plan: 02
subsystem: ui
tags: [react, vitest, i18n, engagement-workspace, cta-reconciliation]

# Dependency graph
requires:
  - phase: 65-engagement-positions-tab-legacy-reconciliation
    provides: 65-UI-SPEC §2 CTA Disposition matrix (approved before/after contract)
provides:
  - WorkspaceShell with no inert Transition/Advance Stage button (LifecycleStepperBar is the sole stage-transition surface)
  - ContextTab with no Link Dossier button in either empty or populated state
  - DocsTab with no Upload button; Generate Briefing untouched
  - RemovedCtas.test.tsx render-level regression pins for the three removal sites
affects: [65-01, 65-03, 65-04, engagement-workspace, ENGPOS-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Removal-assertion test: t-mock returns the raw i18n key, so queryByText(key) === null pins a removed CTA; getByText(key) pins a surviving one'
    - 'Heavy-child stubbing (LifecycleStepperBar, WorkspaceTabNav, LtrIsolate, DossierContextBadge) + router mock (useParams/useMatchRoute/Link/Outlet) to render workspace tabs in isolation'

key-files:
  created:
    - frontend/src/pages/engagements/workspace/__tests__/RemovedCtas.test.tsx
  modified:
    - frontend/src/components/workspace/WorkspaceShell.tsx
    - frontend/src/pages/engagements/workspace/ContextTab.tsx
    - frontend/src/pages/engagements/workspace/DocsTab.tsx

key-decisions:
  - 'CTA dispositions implemented exactly per the approved UI-SPEC matrix: #1 Transition Stage REMOVED (stepper is the working surface), #8 Link Dossier REMOVED ×2 (derived read-only data, no write table), #9 Upload REMOVED (tracked backend P0 gap)'
  - 'Orphaned workspace.json keys (actions.transitionStage, actions.linkDossier, empty.context.action, docs.upload) LEFT in place — UI-SPEC marks the sweep optional/harmless and workspace.json is owned by plan 65-01 this wave'

patterns-established:
  - 'Removal disposition leaves zero placeholders: sibling flex rows reflow via existing gap; orphaned imports (Plus, Button, Upload) removed in the same commit'

requirements-completed: [ENGPOS-03]

# Metrics
duration: 7min
completed: 2026-06-12
---

# Phase 65 Plan 02: Workspace Inert-CTA Reconciliation Summary

**Removed the four unwireable engagement-workspace CTAs (Transition Stage, Link Dossier ×2, Upload) per the approved UI-SPEC disposition matrix, with render-level regression pins and zero orphaned imports or placeholders.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-06-12T23:36:00+03:00
- **Completed:** 2026-06-12T23:40:19+03:00
- **Tasks:** 2
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments

- WorkspaceShell no longer renders the onClick-less Transition/Advance Stage button; the Log After-Action button and LifecycleStepperBar remain untouched and functional.
- ContextTab no longer renders a Link Dossier button in either the empty state or the populated (tiers) state; DossierContextBadge content still renders for linked dossiers.
- DocsTab no longer renders the disabled Upload button; the Generate Briefing button keeps its styling, placement, and handler byte-identical.
- Orphaned imports created by the removals (`Plus` and `Button` in ContextTab, `Upload` in DocsTab) were removed; lint clean at `--max-warnings 0` on all four files.
- Six render-level removal assertions added (RED→GREEN), decision-tagged `(ENGPOS-03)`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Write removal-assertion tests (RED)** - `5e92babf` (test)
2. **Task 2: Remove the four buttons + orphaned imports (GREEN)** - `5154a819` (feat)

_TDD: Task 1 wrote failing assertions (4 RED removal pins + 2 already-passing survivor pins); Task 2 made all six GREEN._

## Files Created/Modified

- `frontend/src/pages/engagements/workspace/__tests__/RemovedCtas.test.tsx` - Render assertions: removed CTA keys absent (`actions.transitionStage`, `actions.linkDossier`, `docs.upload`), surviving actions present (`actions.logAfterAction`, LifecycleStepperBar stub, `actions.generateBriefing`).
- `frontend/src/components/workspace/WorkspaceShell.tsx` - Deleted the Transition Stage `<Button>` from the header actions div; Log After-Action button now the sole action.
- `frontend/src/pages/engagements/workspace/ContextTab.tsx` - Deleted both disabled Link Dossier buttons + their R15-02 comments; populated branch simplified from `<>…<Button/></>` to a bare tiers map; removed orphaned `Plus` and `Button` imports.
- `frontend/src/pages/engagements/workspace/DocsTab.tsx` - Deleted the disabled Upload button + its comment; removed orphaned `Upload` import; updated the stale leading doc-comment that referenced the removed upload placeholder.

## Decisions Made

- Followed the UI-SPEC §2 disposition matrix exactly (rows 1, 8, 9). Removal is the only honest disposition for these four: the stepper already owns stage transitions, linked dossiers are derived read-only data with no write surface, and attachment upload is a tracked backend P0.
- Left the now-orphaned i18n keys in `workspace.json` in place: the UI-SPEC marks that sweep optional/harmless and `workspace.json` belongs to plan 65-01 in this wave (avoids a cross-plan write conflict).

## Deviations from Plan

None - plan executed exactly as written.

The only out-of-task-scope edit was updating DocsTab's leading doc-comment (it described an "upload placeholder" that no longer exists) — a direct cleanup of my own removal's mess (Karpathy surgical-changes), committed inside Task 2. The lint-staged pre-commit hook also collapsed the DocsTab lucide import onto one line; that is formatter-driven and inside the same commit.

## Issues Encountered

- The worktree had no `node_modules`; ran `pnpm install --frozen-lockfile` at the worktree root (existing lockfile restore only — no new packages) before running vitest. Resolved.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Four of the nine round-15 inert CTAs are now honestly gone with regression pins. The remaining ENGPOS-03 dispositions (re-enabled CTAs 3-7, copy updates, and the orphaned-key sweep) are owned by sibling plans 65-01/65-03/65-04 this wave.
- No blockers introduced. Surviving working surfaces (Log After-Action, LifecycleStepperBar, Generate Briefing) verified present by test.

## Self-Check: PASSED

All 4 plan files exist on disk and both task commits (`5e92babf`, `5154a819`) are present in git history.

---

_Phase: 65-engagement-positions-tab-legacy-reconciliation_
_Completed: 2026-06-12_
