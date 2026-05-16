# Phase 52 Plan 05 — Session Handoff

**Status:** Mid-execution. User approved Card v6 responsive fix. 13-spec regression anchor reveals 21 failures requiring investigation.

**Last branch HEAD:** DesignV2

## What landed this session (committed in worktree merge `7c52b4b9`)

1. **Fixture seed (Supabase staging `zkrcjzdemdmwhearhfgg`):**
   - Migration `phase_52_kanban_fixture_seed` applied (dossier + engagement + 8 assignments)
   - Follow-up migration `phase_52_kanban_fixture_workflow_stage_overrides` (review + cancelled stages set post-trigger)
   - Composition verified: todo:2 / in_progress:2 / review:1 / done:2 / cancelled:1
   - Canonical UUID: `00000000-0000-0052-0000-000000000001`
   - `.env.test` updated: `PHASE_52_FIXTURE_ENGAGEMENT_ID`
2. **8 visual baselines regenerated** under `frontend/tests/e2e/{tasks-tab,engagement-kanban-dialog}-visual.spec.ts-snapshots/`
3. **TasksTab mid-drag PNG captured** at `frontend/tests/e2e/__phase52-mid-drag__/tasks-tab-mid-drag.png`

## Uncommitted in main DesignV2 (this session's fixes — need commit)

| File                                                             | Change                                                                                                                                                     |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/components/kanban/KanbanCards.tsx`                 | Removed Radix ScrollArea (was `display: table` + `min-width: 100%` — caused horizontal card overflow). Plain div with `overflow-y-auto overflow-x-hidden`. |
| `frontend/src/components/kanban/KanbanCard.tsx`                  | Added `w-full min-w-0 overflow-hidden` to sortable wrapper + Card primitive                                                                                |
| `frontend/src/components/assignments/KanbanTaskCard.tsx`         | 3-row stacked layout (title, priority+SLA, assignee). Short UUID id (last 6 chars). `text-ellipsis whitespace-nowrap` on all text.                         |
| `frontend/src/components/assignments/EngagementKanbanDialog.tsx` | Same grid-cols-5 + min-w-0 fix                                                                                                                             |
| `frontend/src/components/ui/heroui-chip.tsx`                     | Badge `secondary` variant: empty → `chip-default`                                                                                                          |
| `frontend/src/pages/engagements/workspace/TasksTab.tsx`          | Breakpoint `md:`→`lg:` (mobile-stack covers <1024). Removed `min-w-[1000px]` + `overflow-x-auto`. Added grid-cols-5 + min-w-0. `data-mobile-stage` attr.   |
| `frontend/src/i18n/{en,ar}/assignments.json`                     | Added `kanban.columns.cancelled` key                                                                                                                       |
| `frontend/tests/e2e/tasks-tab-visual.spec.ts`                    | Spec now clicks Tasks tab before screenshot. Waits for `\\d+ tasks` text.                                                                                  |
| `frontend/tests/e2e/engagement-kanban-dialog-visual.spec.ts`     | Tour dismissal + waitFor data-droppable-id                                                                                                                 |
| `frontend/tests/e2e/_phase52-mid-drag-capture.spec.ts`           | One-off mid-drag capture (TasksTab ok, dialog fails)                                                                                                       |

## Critical findings carry over

1. **EngagementKanbanDialog dead code.** Route `/dossiers/engagements/$id` is redirect-only → workspace. EngagementDossierPage (only consumer) not mounted. KANBAN-02 satisfied by TasksTab. **Decision pending: delete or skip dialog specs.**
2. **i18n RTL flip not applied at render time.** LTR/RTL PNG pairs byte-identical because `addInitScript` setting `localStorage.i18nextLng` doesn't trigger language change before initial render. Needs proper `?lng=ar` URL param or render-after-language-load gate.
3. **Mid-drag dialog capture fails** — dialog trigger flow not reproducible in Playwright. TasksTab mid-drag captured cleanly.
4. **13-spec regression anchor has 21 failures** (most likely targeting Phase 39 WorkBoard primitive, different fixtures, different routes). Needs spec-by-spec triage. Failures categorized:
   - Phase 39 specs target `WorkBoard` component / `/my-work` route (different from Phase 52 TasksTab `/engagements/<id>` route)
   - `kanban-visual.spec.ts` (4 viewport iterations) — different baselines from Phase 52
   - `realtime-kanban-updates-two-windows.spec.ts` — requires 2-window orchestration
   - `open-kanban-board.spec.ts` (5 tests) — targets dialog flow (potentially dead code)
   - `drag-task-between-kanban-columns.spec.ts` (3 tests) — different drag spec
   - `keyboard-navigation-kanban.spec.ts` (3 tests) — modal-based keyboard
   - 5 passed: priority columns / unified-kanban filters / rtl render / responsive / search

## Remaining tasks for new session

1. **Commit current uncommitted changes** as `fix(52-05): kanban responsive overflow + i18n + spec fixes`
2. **Triage 21 regression failures** — categorize: (a) failures because TasksTab differs from Phase 39 WorkBoard expectations (re-baseline or scope-out), (b) genuine regressions from our changes (fix).
3. **Decide dialog dead-code cleanup** — delete or skip the 4 `engagement-kanban-dialog-*.spec.ts` files + source.
4. **Workspace gate**: `pnpm --filter ./frontend lint && type-check && build && bash scripts/check-deleted-components.sh`
5. **Close-out**: flip `52-VALIDATION.md` to ✅, write phase `52-SUMMARY.md` §1-6 + verdict, append STATE.md `### Phase 52 summary`.
6. **Stop dev server** (background id `b0oo9ons4`).

## Environment

- Dev server running at `localhost:5173` (Bash bg id `b0oo9ons4`)
- Chrome DevTools MCP connected at engagements/00000000-0000-0052-0000-000000000001
- TEST_USER: `kazahrani@stats.gov.sa` / `itisme`

## Key DOM probe data (from chrome-devtools MCP)

After ScrollArea swap, at viewport 1076px:

- Board: 133px wide
- Card: 107px wide
- Card overflow vs board: **-13px (inside boundary)**
