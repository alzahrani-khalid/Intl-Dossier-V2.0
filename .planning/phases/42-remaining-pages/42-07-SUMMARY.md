---
phase: 42-remaining-pages
plan: 07
subsystem: tasks-page
tags:
  - phase-42
  - tasks
  - page-reskin
  - wave-1
dependency-graph:
  requires:
    - 42-00 (signature visuals — Icon, DossierGlyph)
    - 42-02 (i18n — tasks-page namespace)
    - 42-03 (CSS — .tasks-list / .task-row / .task-box / .task-title / .task-due ports)
    - 42-04 (Playwright scaffold — tasks-page.spec.ts skipped stubs)
  provides:
    - MyTasksPage rendered with handoff `.tasks-list` anatomy
    - Done-toggle + tab-swap + row navigation wired into the new chrome
    - 6 vitest cases covering anatomy, priority mapping, done-state, propagation, tabs, empty
    - 3 active Playwright functional cases (visual baselines stay deferred to plan 42-10)
  affects:
    - frontend/src/pages/MyTasks.tsx
    - frontend/src/pages/__tests__/MyTasksPage.test.tsx
    - frontend/tests/e2e/tasks-page.spec.ts
tech-stack:
  added: []
  patterns:
    - Pitfall 8 — checkbox `e.stopPropagation()` to prevent row navigation
    - Pitfall 3 — defensive priority-chip mapping (covers DB-only `critical` / `normal`)
    - 44×44 hit-area overlay around the 14×14 visual `.task-box` (CSS sets fixed size)
    - `dir="ltr"` on `.task-due` keeps mono dates LTR inside RTL containers (TYPO-04)
    - `data-loading` attribute on the section root for Playwright determinism
key-files:
  created:
    - frontend/src/pages/__tests__/MyTasksPage.test.tsx
  modified:
    - frontend/src/pages/MyTasks.tsx
    - frontend/tests/e2e/tasks-page.spec.ts
decisions:
  - D-15 honored — Assigned/Contributed tabs preserved; FAB stripped; CTA in PageHeader
  - D-17 honored — only logical properties (`ms-*`, `text-start`)
  - D-20 honored — `toArDigits` on the due-date numeric block
metrics:
  duration_seconds: 420
  completed: 2026-05-02
  loc_before: 329
  loc_after: 306
  loc_delta: -23
  task_count: 2
  file_count: 3
  test_count: 6 vitest + 3 playwright
---

# Phase 42 Plan 07: Tasks ("My desk") page reskin Summary

Reskinned `MyTasks.tsx` to the IntelDossier handoff `.tasks-list` anatomy
(`<ul class="tasks-list">` of `<li class="task-row">` rows with checkbox +
DossierGlyph + title/subtitle + priority chip + mono `.task-due`). Strips
the floating creation FAB, the `Card`/`CardHeader` summary stat blocks,
and five lucide imports; preserves the Assigned/Contributed tabs (D-15)
and the optimistic `useUpdateTask` done-toggle. Section root emits
`data-loading` for Playwright determinism.

## Files

| File                                              | Δ                                                | Notes                                                   |
| ------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------- |
| frontend/src/pages/MyTasks.tsx                    | rewritten (329 → 306 LOC; +261 / −284)           | Handoff `.tasks-list` anatomy + done-toggle + tabs      |
| frontend/src/pages/__tests__/MyTasksPage.test.tsx | new (332 LOC)                                    | Vitest unit suite — 6/6 PASS                            |
| frontend/tests/e2e/tasks-page.spec.ts             | un-skipped (3 of 4 cases activated; +7 / −6 LOC) | `.tasks-list`, done-toggle, tab swap. Visual baselines stay deferred to plan 42-10. |

## Commits

| Task | Type | Hash       | Message                                                |
| ---- | ---- | ---------- | ------------------------------------------------------ |
| 1    | RED  | `84c1105a` | test(42-07): add failing tests for MyTasks page reskin |
| 1    | GREEN | `ff6b0fd9` | feat(42-07): rewrite MyTasks page with handoff .tasks-list anatomy |
| 2    | -    | `4f883709` | test(42-07): un-skip Tasks-page functional E2E spec    |

## Verification

| Check                                                              | Result |
| ------------------------------------------------------------------ | ------ |
| `grep -c "tasks-list" frontend/src/pages/MyTasks.tsx`              | 3 (≥1) |
| `grep -c "DossierGlyph" frontend/src/pages/MyTasks.tsx`            | 3 (≥1) |
| `grep -c "stopPropagation" frontend/src/pages/MyTasks.tsx`         | 3 (≥1) |
| `grep -c "task-box" frontend/src/pages/MyTasks.tsx`                | 4 (≥1) |
| `grep -c "useUpdateTask" frontend/src/pages/MyTasks.tsx`           | 4 (≥1) |
| `grep -c "data-loading" frontend/src/pages/MyTasks.tsx`            | 1 (≥1) |
| `grep -cE "FloatingActionButton\|FAB" frontend/src/pages/MyTasks.tsx` | 0      |
| `grep -c "test.skip" frontend/tests/e2e/tasks-page.spec.ts`        | 0      |
| `vitest run MyTasksPage`                                           | 6/6 PASS |
| `playwright test tasks-page.spec --list`                           | 3 tests enumerated |
| `tsc --noEmit` (MyTasks.tsx + MyTasksPage.test.tsx)                | clean (no plan-introduced errors) |

## Behaviors Verified (vitest)

1. Renders `<ul class="tasks-list">` with one `<li class="task-row">` per task in the active tab
2. Priority chip mapping handles all 6 enum values defensively
   - `low` → `chip`
   - `medium` / `normal` → `chip chip-warn`
   - `high` / `urgent` / `critical` → `chip chip-danger`
3. Done-state row has `opacity: 0.45` + line-through; checkbox `aria-checked="true"` + checkmark SVG
4. Checkbox click triggers `useUpdateTask().mutate({ taskId, data: { status: 'completed' }})` and does NOT bubble to row navigation (Pitfall 8)
5. Switching to "Contributed" tab swaps the rendered task data
6. Empty state renders the i18n `empty.heading` when both feeds return zero rows

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking issue] Plan body assumed `task.dossier` was embedded on each row**

- **Found during:** Task 1 implementation
- **Issue:** The plan's verbatim handoff anatomy reads `task.dossier.name`, `task.dossier.iso`, etc. The real `tasks` row (`backend/src/types/database.types.ts:25334`) ships no embedded `dossier` shape and no `title_ar`. The page hook (`useMyTasks → tasksAPI.getTasks`) returns `Task[]` rows verbatim — no JOIN.
- **Fix:** Derive a `DossierGlyph` ISO hint from `work_item_type === 'dossier'` + `work_item_id.toLowerCase()` (matches the existing dashboard widget pattern from Phase 38 Plan 07). Subtitle composes from `work_item_type · task.type`.
- **Files modified:** frontend/src/pages/MyTasks.tsx
- **Commit:** ff6b0fd9

**2. [Rule 3 — Blocking issue] `useUpdateTask` mutation signature is `{ taskId, data }`, not `{ id, updates }`**

- **Found during:** Task 1 implementation
- **Issue:** Plan body called `updateTask.mutate({ id: task.id, updates: { status: nextStatus } })`. The real hook signature in `frontend/src/hooks/useTasks.ts:217` is `mutate({ taskId, data })`.
- **Fix:** Adopted the real signature verbatim. The vitest suite asserts the same shape (`expect.objectContaining({ taskId: 't-low', data: ... })`).
- **Files modified:** frontend/src/pages/MyTasks.tsx, frontend/src/pages/__tests__/MyTasksPage.test.tsx
- **Commit:** 84c1105a, ff6b0fd9

**3. [Rule 3 — Blocking issue] Existing route imports `MyTasksPage` as a named export**

- **Found during:** Task 1 implementation
- **Issue:** The plan body uses `export default function MyTasksPage`. The route `frontend/src/routes/_protected/tasks/index.tsx:2` imports `{ MyTasksPage }` (named).
- **Fix:** Kept the named export AND added a `export default MyTasksPage` so the file satisfies both the plan-spec wording and the existing route registration.
- **Files modified:** frontend/src/pages/MyTasks.tsx
- **Commit:** ff6b0fd9

**4. [Rule 3 — Blocking issue] `task.type` is a non-nullable enum, not a free string**

- **Found during:** Task 1 typecheck pass
- **Issue:** Initial subtitle composition guarded with `task.type !== ''` triggered TS2367 because `task.type` is the `task_type` enum (`other | analysis | follow_up | action_item | preparation`) — never an empty string.
- **Fix:** Drop the `!== ''` guard; rely on `typeof task.type === 'string'` only.
- **Files modified:** frontend/src/pages/MyTasks.tsx
- **Commit:** ff6b0fd9

### Auto-added critical functionality

**5. [Rule 2 — Accessibility / hit-area] 44×44 button wrap around the 14×14 visual `.task-box`**

- **Found during:** Task 1 implementation
- **Issue:** The Wave-0-ported CSS sets `.task-box { width: 14px; height: 14px }`. Putting `min-width: 44; min-height: 44` on the button isn't enough — the explicit `width:14px` rule wins, and the resulting hit-area is the 14×14 visual.
- **Fix:** The `<button>` element gets explicit `width: 44; height: 44; padding: 0; border: 0; background: transparent` inline so the 44×44 hit-area is non-negotiable. The `.task-box` styling (border, fill, hover, `done` background) is preserved by keeping the class on the button itself; the embedded checkmark SVG is centered via `display: inline-flex` on the button.
- **Files modified:** frontend/src/pages/MyTasks.tsx
- **Commit:** ff6b0fd9

**6. [Rule 2 — Accessibility / keyboard] Row supports Enter and Space to navigate**

- **Found during:** Task 1 implementation
- **Issue:** Plan body has `onKeyDown` handling `Enter` only. The row uses `role="button" tabIndex={0}` — ARIA spec expects both Enter and Space to activate buttons.
- **Fix:** Treat Space and Enter identically; `preventDefault()` on Space so the page doesn't scroll. Checkbox button `onKeyDown` also `stopPropagation()` so its own keyboard handling doesn't bubble to the row.
- **Files modified:** frontend/src/pages/MyTasks.tsx
- **Commit:** ff6b0fd9

## Threat Model Coverage

| Threat ID       | Disposition | Implementation |
| --------------- | ----------- | -------------- |
| T-42-07-XSS-1   | mitigate    | All task titles flow through React text nodes; no `dangerouslySetInnerHTML`, no string interpolation into HTML attributes |
| T-42-07-AUTHZ-1 | mitigate    | `useUpdateTask` is preserved verbatim — RLS + `assignee_id` enforcement happens server-side in the existing edge function |
| T-42-07-CSRF-1  | accept      | Existing Supabase session cookie + JWT — no new CSRF surface introduced |

No new threat surface was introduced (page emits no new network endpoints, no new auth paths, no new file access patterns).

## Self-Check: PASSED

- File `frontend/src/pages/MyTasks.tsx` — FOUND
- File `frontend/src/pages/__tests__/MyTasksPage.test.tsx` — FOUND
- File `frontend/tests/e2e/tasks-page.spec.ts` — FOUND (modified)
- Commit `84c1105a` — FOUND
- Commit `ff6b0fd9` — FOUND
- Commit `4f883709` — FOUND
- Vitest `MyTasksPage` — 6/6 PASS
- Playwright `tasks-page.spec` — 3 active tests enumerate cleanly

## TDD Gate Compliance

- RED commit (`84c1105a` — `test(42-07): add failing tests`) precedes
- GREEN commit (`ff6b0fd9` — `feat(42-07): rewrite MyTasks page`)

REFACTOR step skipped — code is already at target shape; no cleanup pass needed.
