---
phase: 39-kanban-calendar
plan: 04
subsystem: kanban-page
tags: [kanban, workboard, dnd, dnd-kit, route, e2e, rtl]
requirements: [BOARD-01, BOARD-02]
dependency_graph:
  requires:
    - phase: 39-kanban-calendar
      plan: 00
      reason: scaffolding + spec stubs + i18n keys
    - phase: 39-kanban-calendar
      plan: 01
      reason: KCard widget consumed by BoardColumn
    - phase: 39-kanban-calendar
      plan: 02
      reason: BoardColumn widget composed in WorkBoard
    - phase: 39-kanban-calendar
      plan: 03
      reason: BoardToolbar widget composed in WorkBoard
  provides:
    - WorkBoard page composer (Wave 1 terminal node)
    - /kanban route mounting WorkBoard via lazy + Suspense
    - 3 active E2E specs (render, RTL, DnD)
  affects:
    - frontend/src/routes/_protected/kanban.tsx
    - frontend/src/pages/WorkBoard/WorkBoard.tsx
tech-stack:
  added: []
  patterns:
    - thin-route + lazy + Suspense (mirrors /dashboard)
    - DndContext + sensors conditional on columnMode === 'status' (D-03)
    - client-side filtering over already-loaded items (D-07)
key-files:
  created:
    - frontend/src/pages/WorkBoard/__tests__/WorkBoard.test.tsx
    - .planning/phases/39-kanban-calendar/39-04-SUMMARY.md
  modified:
    - frontend/src/pages/WorkBoard/WorkBoard.tsx
    - frontend/src/pages/WorkBoard/board.css
    - frontend/src/routes/_protected/kanban.tsx
    - frontend/tests/e2e/kanban-render.spec.ts
    - frontend/tests/e2e/kanban-rtl.spec.ts
    - frontend/tests/e2e/kanban-dnd.spec.ts
decisions:
  - WorkBoard wires REAL useUnifiedKanban signature `{contextType, columnMode, sourceFilter}` (per RESEARCH Confirmation #2 — overrides CONTEXT.md wording)
  - Cancelled items filtered out client-side (workflow_stage OR status === 'cancelled')
  - Drag-end maps target stage → status via STAGE_TO_STATUS table (newStatus required by mutation)
  - kcard click routes by source (task → /tasks/{id}; commitment → /commitments; intake → /intake/tickets/{id}) — reuses today's existing detail surfaces per D-09 + open-question 3
  - +Add per column passes defaultWorkflowStage as a query param to /tasks (TaskCreate prefill verified in 39-09)
  - Skeleton 4×3 shape-match matches column shell + 3 kcard rows during isLoading
metrics:
  duration: ~25min
  completed: 2026-04-25
---

# Phase 39 Plan 04: WorkBoard page composition + DnD + route replacement Summary

WorkBoard.tsx page composer wires the real `useUnifiedKanban` signature, conditional `@dnd-kit/core` DnD, client-side cancelled+search filters, and per-source navigation; `/kanban` route reduced to a thin Suspense + lazy mount; 3 E2E specs activated for render, RTL, and DnD.

## Files

### Created

- `frontend/src/pages/WorkBoard/__tests__/WorkBoard.test.tsx` — 10 unit tests covering render, cancelled filter (both `workflow_stage` and `status` paths), EN + AR search, overdue chip count, conditional sensors, drag-end mutation, source routing, +Add stage prefill, isLoading skeleton.

### Modified

- `frontend/src/pages/WorkBoard/WorkBoard.tsx` — replaces 39-00 placeholder. Composes BoardToolbar + 4 BoardColumns inside `DndContext`. Sensors empty unless `columnMode === 'status'`. Drag-end resolves target stage from `over.data.current.stage` (set by 39-09 for SortableContext) with `col-{stage}` id fallback, then calls `useUnifiedKanbanStatusUpdate.mutate({ itemId, source, newStatus, newWorkflowStage })`. Skeleton path renders 4 columns × 3 placeholder cards.
- `frontend/src/pages/WorkBoard/board.css` — added `.workboard-page`, `.board-columns` (horizontal-scroll, logical-direction only), `.workboard-skeleton-head`, `.workboard-skeleton-card`.
- `frontend/src/routes/_protected/kanban.tsx` — full rewrite. Removed Zod URL search schema, `useUnifiedKanban` / `useUnifiedKanbanRealtime` / `useUnifiedKanbanStatusUpdate` direct calls, `EnhancedKanbanBoard` import, list-view button, swimlane/WIP wiring. Now 27 lines: `createFileRoute` + `Suspense` + `lazy(() => import('@/pages/WorkBoard'))`.
- `frontend/tests/e2e/kanban-render.spec.ts` — replaced skip stub with active assertions: `getByRole('searchbox')` visible, `section.col` toHaveCount(4), conditional 3px `border-inline-start-width` check on overdue cards.
- `frontend/tests/e2e/kanban-rtl.spec.ts` — replaced skip stub. Forces `document.documentElement.dir = 'rtl'`, asserts `borderRightWidth > 0` on `.kcard.overdue` (logical inline-start = physical right in RTL).
- `frontend/tests/e2e/kanban-dnd.spec.ts` — replaced skip stub. Drags first kcard from column 1 onto column 2, waits 800ms for mutation, asserts the column-1 first-card text changed.

## Commits

| Task | Hash       | Message                                                               |
| ---- | ---------- | --------------------------------------------------------------------- |
| 1    | `e5acf3b4` | feat(39-04): WorkBoard page composer with conditional DnD             |
| 2    | `c63be997` | feat(39-04): rewrite /kanban as thin Suspense+lazy WorkBoard mount    |
| 3    | `de56307e` | test(39-04): activate kanban-render, kanban-rtl, kanban-dnd E2E specs |

## Verification

### Unit

```
pnpm --filter frontend test --run src/pages/WorkBoard/__tests__/WorkBoard.test.tsx
→ Test Files 1 passed | Tests 10 passed (10/10) — 475ms
```

### TypeScript

- `pnpm exec tsc --noEmit` shows zero errors in `src/pages/WorkBoard/**` and `src/routes/_protected/kanban.tsx` after fixing `StatusUpdateParams.newStatus` (required field — added STAGE_TO_STATUS map: todo→pending, in_progress→in_progress, review→in_progress, done→completed).
- Pre-existing repo-wide TS warnings (backend, unrelated frontend files) remain untouched.

### Acceptance greps

- `grep -E "textAlign|\bml-|\bmr-|\bpl-|\bpr-|\.reverse\(" WorkBoard.tsx` → only matches inside doc comment text describing what is forbidden.
- `grep -c "dangerously" WorkBoard.tsx` → 0
- `grep -c "contextType: 'personal'" WorkBoard.tsx` → 2 (constant + hook call)
- `grep -c "useUnifiedKanbanStatusUpdate" WorkBoard.tsx` → 2 (import + call)
- `grep -c "import './board.css'" WorkBoard.tsx` → 1
- Route file: zero `EnhancedKanbanBoard` / `UnifiedKanbanBoard` / `@/components/unified-kanban` / `useUnifiedKanban` references.
- All 3 E2E specs: zero `test.describe.skip` directives.

### E2E `--list`

- Blocked by **pre-existing** `playwright.config.ts` ESM `__dirname` bug (`ReferenceError: __dirname is not defined in ES module scope`). Documented in plan as wave_state — explicit 39-09 fix. Spec syntax independently verified via `tsc --noEmit` on the three spec files (clean exit).

## Deviations from Plan

### Rule 1 — Bug: StatusUpdateParams.newStatus required

- **Found during:** Task 1 typecheck (after initial green tests on mocked mutation).
- **Issue:** Plan template `update.mutate({ itemId, source, newWorkflowStage })` omits `newStatus`, but the live `StatusUpdateParams` interface in `useUnifiedKanban.ts:329` declares `newStatus: string` as required.
- **Fix:** Added `STAGE_TO_STATUS` map and pass `newStatus` derived from target stage in the drag-end handler. No tests modified — mock continues to receive the same shape including the new `newStatus` key (test asserts only `itemId` and `newWorkflowStage`).
- **Files:** `frontend/src/pages/WorkBoard/WorkBoard.tsx`
- **Commit:** `e5acf3b4`

### Cosmetic — comment rephrase to avoid CI false-positive

- **Found during:** Task 2 acceptance grep.
- **Issue:** Initial route docstring named the deleted `EnhancedKanbanBoard` and hook names — this would fail the `check-deleted-components.sh` 39-09 gate as a string-match.
- **Fix:** Rephrased the comment to use generic "data-hook calls" / "legacy widgets" wording.
- **Files:** `frontend/src/routes/_protected/kanban.tsx`
- **Commit:** `c63be997`

### Auth gates

None encountered.

## Known Stubs

None introduced. The "Coming soon" pills (D-06) and the deferred TaskCreate `defaultWorkflowStage` consumer (D-12) were already documented in plans 39-03 and the plan brief, respectively, and are tracked for 39-09.

## Threat Flags

None — surface stays inside the existing `useUnifiedKanban` + Supabase RLS trust boundary documented in the plan's `<threat_model>`. No new endpoints, no new auth paths, no new file access patterns.

## TDD Gate Compliance

Plan was `type: execute` (not `type: tdd`), but Task 1 followed TDD per `tdd="true"`: `WorkBoard.test.tsx` written first asserting all 10 behaviors with full mocks → ran (failed: placeholder returns null) → implementation written → re-ran (10/10 pass).

## Self-Check: PASSED

Commits exist:

- `git log --oneline | grep e5acf3b4` → FOUND
- `git log --oneline | grep c63be997` → FOUND
- `git log --oneline | grep de56307e` → FOUND

Files exist:

- `frontend/src/pages/WorkBoard/WorkBoard.tsx` → FOUND (224 lines)
- `frontend/src/pages/WorkBoard/__tests__/WorkBoard.test.tsx` → FOUND (10 tests)
- `frontend/src/routes/_protected/kanban.tsx` → FOUND (27 lines, thin)
- `frontend/tests/e2e/kanban-render.spec.ts` → FOUND (no .skip)
- `frontend/tests/e2e/kanban-rtl.spec.ts` → FOUND (no .skip)
- `frontend/tests/e2e/kanban-dnd.spec.ts` → FOUND (no .skip)
