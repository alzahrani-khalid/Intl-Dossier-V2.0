---
phase: 52-heroui-v3-kanban-migration
plan: 03
subsystem: frontend
tags: [kanban, consumer-migration, design-tokens, tier-c-resolution]
requires:
  - phase: 52-heroui-v3-kanban-migration
    plan: 02
    provides: shared Kanban primitive barrel export
provides:
  - TasksTab consumer migrated to @/components/kanban
  - EngagementKanbanDialog consumer migrated to @/components/kanban
  - KanbanTaskCard Tier-C palette suppressions absorbed into semantic tokens
affects: [frontend, tasks-tab, engagement-kanban-dialog, kanban-task-card]
tech-stack:
  added: []
  patterns:
    - Consumer import-path swap onto shared primitive
    - Cancelled column border-only cue via isCancelled
    - Semantic SLA chip colors with CSS variable soft fills
key-files:
  modified:
    - frontend/src/pages/engagements/workspace/TasksTab.tsx
    - frontend/src/components/assignments/EngagementKanbanDialog.tsx
    - frontend/src/components/assignments/KanbanTaskCard.tsx
key-decisions:
  - 'Used bg-[var(--*-soft)] arbitrary token utilities in KanbanTaskCard because index.css exposes --danger-soft/--warn-soft/--ok-soft but not --color-*-soft Tailwind utilities.'
  - 'Used pnpm --filter ./frontend for actual workspace gates; --filter frontend is a no-op in this repo because the package name is intake-frontend.'
patterns-established:
  - 'Plan 03 verifies no live TypeScript/TSX consumers of @/components/kibo-ui remain outside tests/docs before Plan 04 deletion.'
requirements-completed: [KANBAN-01, KANBAN-02]
duration: 34 min
completed: 2026-05-16
---

# Phase 52 Plan 03: Consumer migration and token cleanup Summary

**Migrated both Kanban consumers to the new shared primitive and reduced phase-scope Tier-C suppressions from 9 to 0.**

## Performance

- **Duration:** 34 min
- **Started:** 2026-05-16T11:16:00Z
- **Completed:** 2026-05-16T11:50:00Z
- **Tasks:** 4/4
- **Files modified:** 3

## File Deltas

| File                                                             | Insertions | Deletions | Net | Purpose                                                           |
| ---------------------------------------------------------------- | ---------: | --------: | --: | ----------------------------------------------------------------- |
| `frontend/src/pages/engagements/workspace/TasksTab.tsx`          |         15 |        21 |  -6 | Import swap, `STAGE_COLORS` deletion, mobile/desktop token wiring |
| `frontend/src/components/assignments/EngagementKanbanDialog.tsx` |          9 |         9 |   0 | Import swap, `isCancelled`, token hover state                     |
| `frontend/src/components/assignments/KanbanTaskCard.tsx`         |         22 |        18 |  +4 | Tier-C SLA chip token absorption                                  |

## Accomplishments

- `TasksTab.tsx` now imports Kanban primitives and `DragEndEvent` from `@/components/kanban`.
- `EngagementKanbanDialog.tsx` now imports Kanban primitives and `DragEndEvent` from `@/components/kanban`.
- `TasksTab.tsx` no longer contains `STAGE_COLORS` or any `eslint-disable` directives.
- Both consumers pass `isCancelled={column.id === 'cancelled'}` to `KanbanBoard`.
- Both consumers replaced `hover:shadow-md transition-shadow border-border` with `hover:bg-surface-raised hover:border-line-soft transition-all`.
- `KanbanTaskCard.tsx` replaced all four palette-literal SLA classes with semantic token classes and removed four Tier-C suppressions.

## Task Commits

1. **Task 1: TasksTab migration** — `6f20264c` (`refactor`)
2. **Task 2: EngagementKanbanDialog migration** — `c5ccc471` (`refactor`)
3. **Task 3: KanbanTaskCard token absorption** — `445c3574` (`refactor`)
4. **Task 4: Workspace gate** — verification-only; no mutation commit

## Tier-C Disable Accounting

| File                         | Before | After | Result                              |
| ---------------------------- | -----: | ----: | ----------------------------------- |
| `TasksTab.tsx`               |      5 |     0 | Resolved by deleting `STAGE_COLORS` |
| `EngagementKanbanDialog.tsx` |      0 |     0 | No suppressions existed             |
| `KanbanTaskCard.tsx`         |      4 |     0 | Resolved by semantic token swap     |
| **Total phase scope**        |  **9** | **0** | **Full absorption succeeded**       |

KanbanTaskCard absorption did not ripple beyond the file. Lint, type-check, and build stayed green.

## Token Availability and SLA Color Mapping

Token check from `frontend/src/index.css`:

- `--color-danger`, `--color-warning`, `--color-ok`, `--color-warn` exist.
- `--danger-soft`, `--warn-soft`, and `--ok-soft` exist as runtime CSS variables.
- `--color-danger-soft`, `--color-warn-soft`, and `--color-ok-soft` are not exposed as Tailwind color utilities.

Applied mapping:

| SLA state | New class                             |
| --------- | ------------------------------------- |
| `overdue` | `text-danger bg-[var(--danger-soft)]` |
| `urgent`  | `text-warn bg-[var(--warn-soft)]`     |
| `warning` | `text-warn bg-[var(--warn-soft)]`     |
| `normal`  | `text-ok bg-[var(--ok-soft)]`         |

`urgent` and `warning` intentionally consolidate to the same warn token because there is no separate warning-soft utility.

## V5 Security Gate Verification

- `grep -h "validStages.includes" TasksTab.tsx EngagementKanbanDialog.tsx | wc -l` → `2`
- Both consumer whitelist checks remain in place:
  - `const validStages: WorkflowStage[] = ['todo', 'in_progress', 'review', 'done', 'cancelled']`
  - `validStages.includes(newStage)`

## Smoke Gate Evidence

Actual workspace package filter is `./frontend` (package name: `intake-frontend`). The requested `--filter frontend` selector is a pnpm no-op in this repo.

| Command                               | Exit | Evidence                                            |
| ------------------------------------- | ---: | --------------------------------------------------- |
| `pnpm --filter ./frontend lint`       |    0 | ESLint completed with no output after script header |
| `pnpm --filter ./frontend type-check` |    0 | `tsc --noEmit` completed                            |
| `pnpm --filter ./frontend build`      |    0 | Vite built successfully in `10.96s`                 |
| Primitive vitest subset               |    0 | `3 passed (3)`, `10 passed (10)`                    |

Build emitted the existing large-chunk warning; it did not fail. Bundle-budget tightening remains Phase 53 scope.

## Grep Audit Results

| Check                                                              |                                           Result |
| ------------------------------------------------------------------ | -----------------------------------------------: |
| `STAGE_COLORS` in `TasksTab.tsx`                                   |                                                0 |
| `@/components/kibo-ui` in `TasksTab.tsx`                           |                                                0 |
| `@/components/kibo-ui` in `EngagementKanbanDialog.tsx`             |                                                0 |
| `hover:shadow-md` in both consumers                                |                                                0 |
| `validStages.includes` across both consumers                       |                                                2 |
| `eslint-disable-next-line no-restricted-syntax` across phase scope |                                                0 |
| Old SLA palette literals in `KanbanTaskCard.tsx`                   |                                                0 |
| Live TS/TSX kibo-ui consumers outside tests/docs                   |                                                0 |
| `@/components/kanban` import files                                 | 2 (`TasksTab.tsx`, `EngagementKanbanDialog.tsx`) |

## Dead Code Confirmation

The kibo-ui Kanban module is now dead code for production consumers:

- No TypeScript/TSX file outside `__tests__` imports `@/components/kibo-ui`.
- Remaining local references are non-production/test documentation fixtures, including the planned `eslint-ban.test.ts` and component registry markdown.
- Plan 04 can delete `frontend/src/components/kibo-ui/kanban/`, remove `tunnel-rat`, and widen ESLint import bans.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Blocking] `bg-*-soft` Tailwind utilities were not exported**

- **Found during:** Task 3 token availability check
- **Issue:** `index.css` exposes `--danger-soft`, `--warn-soft`, and `--ok-soft`, but not `--color-danger-soft`, `--color-warn-soft`, or `--color-ok-soft`.
- **Fix:** Used semantic text utilities plus arbitrary CSS-var backgrounds: `bg-[var(--danger-soft)]`, `bg-[var(--warn-soft)]`, `bg-[var(--ok-soft)]`.
- **Files modified:** `KanbanTaskCard.tsx`
- **Verification:** `pnpm --filter ./frontend lint` exits `0`; old palette literal grep returns `0`.
- **Committed in:** `445c3574`

---

**2. [Rule 1 - Verification] Plan command filter was a no-op**

- **Found during:** Task 4 workspace gate
- **Issue:** `pnpm --filter frontend ...` prints `No projects matched the filters` and exits `0` because the frontend package name is `intake-frontend`.
- **Fix:** Ran actual gates with `pnpm --filter ./frontend ...`.
- **Files modified:** None
- **Verification:** lint/type-check/build all exited `0` with real script output.
- **Committed in:** n/a

---

**Total deviations:** 2 documented (1 code deviation, 1 command correction).  
**Impact on plan:** No functional scope expansion; token compliance and smoke gates passed.

## User Setup Required

None.

## Next Phase Readiness

Plan 04 is unblocked: the production consumers have moved to `@/components/kanban`, the kibo-ui module has no live TS/TSX consumers, and the smoke gate is green.

## Self-Check: PASSED

- Three files modified; no new files and no deletions.
- Tier-C count dropped from 9 to 0.
- V5 whitelist gates remain present in both consumers.
- Workspace lint, type-check, build, and primitive unit contracts pass.
- kibo-ui deletion is safe for Plan 04.

---

_Phase: 52-heroui-v3-kanban-migration_
_Completed: 2026-05-16_
