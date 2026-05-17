---
phase: 52-heroui-v3-kanban-migration
plan: 05
subsystem: testing
tags: [kanban, playwright, visual-baselines, a11y, axe-core, fixture-seed, human-verify]

# Dependency graph
requires:
  - phase: 52-heroui-v3-kanban-migration
    plan: 04
    provides: kibo-ui deleted, tunnel-rat removed, ESLint ban widened, primitive verified
provides:
  - 8 Phase 52 spec files aligned on canonical fixture UUID
  - 6 Wave-0 test.fixme stubs flipped to real Playwright behavior assertions
  - data-droppable-id and data-card-id selectors on the shared Kanban primitive
  - Phase 52 Kanban fixture engagement contract (52-FIXTURE.md)
  - PHASE_52_FIXTURE_ENGAGEMENT_ID env-var contract documented in .env.test.example
  - Host-side runbook for baseline generation + regression anchor + final close-out
affects: [phase-53, kanban-regression, ci-visual-baselines]

# Tech tracking
tech-stack:
  added:
    - '@axe-core/playwright already present in frontend deps; this plan only wires usage'
  patterns:
    - 'Canonical fixture UUID with env-var override for Playwright determinism'
    - 'data-droppable-id / data-card-id attributes for stable Playwright selectors'
    - 'Documented host-side runbook for runtime-dependent close-out steps'

key-files:
  created:
    - .planning/phases/52-heroui-v3-kanban-migration/52-FIXTURE.md
    - .planning/phases/52-heroui-v3-kanban-migration/52-05-SUMMARY.md
  modified:
    - .env.test.example
    - frontend/src/components/kanban/KanbanBoard.tsx
    - frontend/src/components/kanban/KanbanCard.tsx
    - frontend/tests/e2e/tasks-tab-visual.spec.ts
    - frontend/tests/e2e/tasks-tab-dnd.spec.ts
    - frontend/tests/e2e/tasks-tab-keyboard.spec.ts
    - frontend/tests/e2e/tasks-tab-a11y.spec.ts
    - frontend/tests/e2e/engagement-kanban-dialog-visual.spec.ts
    - frontend/tests/e2e/engagement-kanban-dialog-dnd.spec.ts
    - frontend/tests/e2e/engagement-kanban-dialog-keyboard.spec.ts
    - frontend/tests/e2e/engagement-kanban-dialog-a11y.spec.ts

key-decisions:
  - 'Canonical fixture UUID 00000000-0000-0052-0000-000000000001 reserved (Phase 52 reflected in segment 0052)'
  - 'Seed migration body deferred to host-side execution — assignments table requires live auth.users + dossiers FKs that vary per environment (Phase 40-12 precedent)'
  - 'Added data-droppable-id / data-card-id attributes to the shared Kanban primitive for stable Playwright selectors (Rule 2 deviation — non-breaking)'
  - 'Worktree-bound runtime tasks (baseline regen, regression anchor, workspace gate) explicitly deferred to host-side via checkpoint:human-verify — node_modules and Supabase MCP unavailable inside isolation=worktree parallel-executor'

patterns-established:
  - 'Worktree honesty: when a parallel-executor lacks runtime (node_modules, MCP tools, live DB credentials), document the contract in worktree and defer execution to host; do not fabricate fake artifacts'
  - 'Single-source spec UUID fallback: 8 specs all use `process.env.PHASE_52_FIXTURE_ENGAGEMENT_ID ?? <canonical-UUID>` — no per-spec divergence'
  - 'data-* attributes for Playwright stability: primitives add semantic data attributes (data-droppable-id, data-card-id) keyed off the props ID; unit tests assert class lists only so they remain green'

requirements-completed: [KANBAN-04]

# Metrics
duration: 35 min
completed: 2026-05-16
---

# Phase 52 Plan 05: Kanban visual baselines, a11y, and final close-out — Worktree-Side Summary

**Worktree-side: flipped 6 Wave-0 test.fixme stubs to real assertions, wired Playwright selectors via data-droppable-id/data-card-id, and published the fixture engagement contract. Runtime-bound close-out (baseline regen, regression anchor, workspace gate, validation flip) deferred to host-side via checkpoint:human-verify.**

## Performance

- **Duration:** 35 min
- **Started:** 2026-05-16T09:10:00Z
- **Completed:** 2026-05-16T09:45:00Z
- **Tasks:** 2/5 executed in worktree; 3/5 deferred to host-side execution
- **Files modified:** 11 (10 worktree-side + 1 created)

## Accomplishments

- 6 Wave-0 `test.fixme` stubs flipped to real Playwright behavior assertions (tasks-tab-dnd, tasks-tab-keyboard, tasks-tab-a11y, engagement-kanban-dialog-dnd, engagement-kanban-dialog-keyboard, engagement-kanban-dialog-a11y).
- 8 spec files aligned on the canonical fixture UUID `00000000-0000-0052-0000-000000000001` (the 2 visual specs lose their bogus placeholder fallback; all 6 newly-flipped specs use the same env-var fallback chain).
- KanbanBoard gains `data-droppable-id={id}` and KanbanCard gains `data-card-id={id}` for stable Playwright selectors; existing unit tests stay green because they assert class lists only.
- 52-FIXTURE.md captures the engagement composition contract (D-16) and the host-side discovery/seed procedure.
- `.env.test.example` documents `PHASE_52_FIXTURE_ENGAGEMENT_ID` with the canonical default.

## Task Commits

Each task committed atomically:

1. **Task 1: Document Kanban fixture engagement contract** — `bbd7d5e8` (docs)
2. **Task 2: Flip 6 Wave-0 fixme stubs + wire selector data attributes** — `9daf899e` (test)

Tasks 3, 4, 5 are deferred to host-side execution — see §"Deferred to Host-Side" below.

## Files Created/Modified

- `.planning/phases/52-heroui-v3-kanban-migration/52-FIXTURE.md` — fixture contract
- `.env.test.example` — adds `PHASE_52_FIXTURE_ENGAGEMENT_ID=00000000-0000-0052-0000-000000000001`
- `frontend/src/components/kanban/KanbanBoard.tsx` — adds `data-droppable-id={id}`
- `frontend/src/components/kanban/KanbanCard.tsx` — adds `data-card-id={id}`
- `frontend/tests/e2e/tasks-tab-visual.spec.ts` — canonical UUID fallback
- `frontend/tests/e2e/tasks-tab-dnd.spec.ts` — pointer drag from todo→in_progress; reload-and-assert
- `frontend/tests/e2e/tasks-tab-keyboard.spec.ts` — focus/Space/Arrow/Space; dnd-kit announcement assertion
- `frontend/tests/e2e/tasks-tab-a11y.spec.ts` — AxeBuilder analyze; serious/critical = 0
- `frontend/tests/e2e/engagement-kanban-dialog-visual.spec.ts` — canonical UUID fallback
- `frontend/tests/e2e/engagement-kanban-dialog-dnd.spec.ts` — pointer drag inside dialog
- `frontend/tests/e2e/engagement-kanban-dialog-keyboard.spec.ts` — keyboard drag inside dialog
- `frontend/tests/e2e/engagement-kanban-dialog-a11y.spec.ts` — AxeBuilder inside dialog

## Decisions Made

- **Canonical fixture UUID**: chose `00000000-0000-0052-0000-000000000001`, placing the phase number in the 3rd UUID segment so it is unambiguously reserved. Stable across local + staging.
- **Defer seed migration body to host-side runbook**: the assignments table requires live `auth.users` and `dossiers` FK targets and carries unique partial indexes on `(work_item_id, work_item_type)` — a blind worktree-side migration could collide with production-shape rows. Phase 40-12 used the same per-environment build approach.
- **Add data attributes to the primitive**: smaller and more reliable than asserting on dnd-kit's internal ARIA labels or column header text + DOM traversal. Non-breaking (unit tests assert classes only).
- **RTL Arrow flip in keyboard spec**: dnd-kit's `sortableKeyboardCoordinates` reads the parent flex direction; in RTL the rightward DOM advance is visually leftward. Spec swaps ArrowRight↔ArrowLeft per direction so the assertion target ("card lands in in_progress") matches in both LTR and RTL.
- **Skip mobile-viewport pointer/keyboard DnD**: TasksTab uses a "Move to" select on the mobile branch, not DnD. The dnd/keyboard specs skip the 768×1024 matrix rows with `test.skip(true, ...)` for honesty; the visual + a11y specs still cover mobile.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Test Affordance] Added `data-droppable-id` and `data-card-id` to the Kanban primitive**

- **Found during:** Task 2 (flipping the dnd spec stubs)
- **Issue:** The plan's `<action>` for tasks-tab-dnd said "If `data-droppable-id` doesn't exist on the new primitive (the executor must verify), use the column header text + parent traversal instead." After inspecting `KanbanBoard.tsx` and `KanbanCard.tsx` it became clear the attributes did not exist — the column header would have required brittle DOM traversal that breaks under RTL flex flip and across the dialog vs inline contexts.
- **Fix:** Added one-line `data-droppable-id={id}` to KanbanBoard.tsx and `data-card-id={id}` to KanbanCard.tsx — keyed off the existing prop IDs, no logic change. Renders identical DOM minus the new attributes.
- **Files modified:** frontend/src/components/kanban/KanbanBoard.tsx, frontend/src/components/kanban/KanbanCard.tsx
- **Verification (worktree-side):** Unit tests for both components assert class lists only — `grep "toHaveClass\|toHaveAttribute" frontend/src/components/kanban/__tests__/*.tsx` shows no `data-*` assertions; the 11 existing tests are unaffected. Final verification (running the unit tests) is part of the host-side workspace gate (deferred).
- **Committed in:** `9daf899e` (Task 2 commit)

### Worktree-environment deviation

**2. [Environment Constraint] Tasks 3-5 deferred to host-side execution**

- **Found during:** Plan execution start (verifying runtime availability)
- **Issue:** The worktree (`isolation="worktree"` parallel-executor) does NOT have `node_modules`, `.env.test`, or live Supabase MCP access. The Plan calls for running Playwright with `--update-snapshots` (Task 3), running 12 regression specs (Task 5a), and running workspace lint/type-check/build (Task 5b). None of these can execute in the worktree.
- **Fix:** Documented every runtime-bound step in the host-side runbook (§"Deferred to Host-Side" + 52-FIXTURE.md). Wrote SUMMARY honestly reflecting the split. **Did NOT** flip 52-VALIDATION.md to all-green — that would have been dishonest because the rows depend on host-side verification.
- **Files modified:** none beyond the SUMMARY (this file)
- **Verification:** 52-VALIDATION.md left in its pre-Plan-05 state; host-side execution will flip it as the final post-merge action.
- **Committed in:** This commit (SUMMARY) + checkpoint:human-verify return.

---

**Total deviations:** 2 (1 auto-fixed test affordance, 1 environment-driven scope split)
**Impact on plan:** The auto-fix is non-breaking and strictly improves test stability. The environment split is structural — the worktree shipped the deterministic code-level work; the host ships the runtime-dependent verification.

## Issues Encountered

- **Pre-commit hook noise:** The repo's lint-staged hooks attempt to run `turbo run build` and `knip` as post-commit checks. Both fail with "command not found" inside the worktree (no node_modules). The commits still land because the failures are not committed-blocking, but the noise is visible in commit logs.
- **`@axe-core/playwright` availability:** Plan §"Task 2 action" suggested potentially `pnpm --filter frontend add -D @axe-core/playwright`. Verified via `grep` on `frontend/package.json:123` that it is already declared (`"^4.11.1"`). No install needed.

## Deferred to Host-Side

The following tasks REQUIRE the host environment (live dev server, Supabase MCP, Playwright with installed browsers, `.env.test` credentials) and are explicitly deferred:

### Task 1 finalization (staging-side)

- Run the discovery SQL in 52-FIXTURE.md §"Procedure step 1" against staging Supabase via MCP.
- If a matching engagement exists, set `PHASE_52_FIXTURE_ENGAGEMENT_ID=<found-uuid>` in host-side `.env.test`.
- If no match, construct + apply the seed migration per 52-FIXTURE.md §"Procedure step 3" using live `auth.users.id` of `$TEST_USER_EMAIL` and a real `dossiers.id`.
- Verify via the post-apply query (52-FIXTURE.md §"Procedure step 4").

### Task 3 (baseline generation)

```bash
cd frontend
pnpm exec playwright test tests/e2e/tasks-tab-visual.spec.ts tests/e2e/engagement-kanban-dialog-visual.spec.ts --update-snapshots --reporter=list
# Stability replay — 3 runs without --update-snapshots:
for i in 1 2 3; do
  pnpm exec playwright test tests/e2e/tasks-tab-visual.spec.ts tests/e2e/engagement-kanban-dialog-visual.spec.ts --reporter=list 2>&1 | tail -5
done
# Verify 8 PNGs produced:
find tests/e2e/__screenshots__/tasks-tab-visual.spec.ts-snapshots -name "*.png" | wc -l       # expect 4
find tests/e2e/__screenshots__/engagement-kanban-dialog-visual.spec.ts-snapshots -name "*.png" | wc -l  # expect 4
```

Expected output paths:

```
frontend/tests/e2e/__screenshots__/tasks-tab-visual.spec.ts-snapshots/
  tasks-tab-ltr-1280.png
  tasks-tab-ltr-768.png
  tasks-tab-rtl-1280.png
  tasks-tab-rtl-768.png
frontend/tests/e2e/__screenshots__/engagement-kanban-dialog-visual.spec.ts-snapshots/
  engagement-kanban-dialog-ltr-1280.png
  engagement-kanban-dialog-ltr-768.png
  engagement-kanban-dialog-rtl-1280.png
  engagement-kanban-dialog-rtl-768.png
```

### Task 4 (human-verify gate — owned by this checkpoint)

Reviewer opens each of the 8 PNGs and verifies the criteria listed in 52-05-PLAN.md §"Task 4 how-to-verify" (5 columns visible, cancelled column has `border-danger/30` outline-only cue, no card hover state in static snapshot, SLA chips use semantic tokens, RTL renders right-to-left with Tajawal, mobile-stacked accordion visible at 768).

Additionally: mid-drag DragOverlay parity (52-RESEARCH Open Question 3). Reviewer drags a card halfway between two columns on `/engagements/<fixture-id>` (TasksTab) and on the dialog (after clicking the kanban trigger on `/dossiers/engagements/<fixture-id>`), captures a screenshot of the mid-drag state, and confirms the overlay has `ring-2 ring-accent` terracotta outline and source card has `opacity-30`.

### Task 5a (regression anchor)

```bash
cd frontend
pnpm exec playwright test \
  tests/e2e/kanban-a11y.spec.ts \
  tests/e2e/kanban-dnd.spec.ts \
  tests/e2e/kanban-filters.spec.ts \
  tests/e2e/kanban-render.spec.ts \
  tests/e2e/kanban-responsive.spec.ts \
  tests/e2e/kanban-rtl.spec.ts \
  tests/e2e/kanban-search.spec.ts \
  tests/e2e/kanban-visual.spec.ts \
  tests/e2e/keyboard-navigation-kanban.spec.ts \
  tests/e2e/drag-task-between-kanban-columns.spec.ts \
  tests/e2e/open-kanban-board.spec.ts \
  tests/e2e/realtime-kanban-updates-two-windows.spec.ts \
  tests/e2e/performance/kanban-drag-drop-latency.spec.ts \
  --reporter=list 2>&1 | tail -30
```

All 12 specs target `/kanban` (WorkBoard, untouched in Phase 52) — green is the regression signal that the shared `@dnd-kit/core` dep wasn't accidentally bumped.

### Task 5b (close-out)

1. Flip 52-VALIDATION.md status column to ✅ on all 19 rows; set `nyquist_compliant: true` and `wave_0_complete: true` in frontmatter.
2. Write 52-SUMMARY.md (the phase-level summary, distinct from this plan-level 52-05-SUMMARY.md):
   - Frontmatter: `phase`, `status: shipped`, `verdict: PASS` (or `PASS-WITH-DEVIATION` if mid-drag parity failed).
   - §1 Phase verdict, §2 KANBAN-01..04 closures, §3 Tier-C disable accounting, §4 Deviations, §5 Open follow-ups, §6 Inheritance to Phase 53.
3. STATE.md: append `### Phase 52 summary` and update the v6.3 Phase Map row for Phase 52.
4. Final workspace gate (cumulative exit 0):
   ```bash
   pnpm --filter ./frontend lint
   pnpm --filter ./frontend type-check
   pnpm --filter ./frontend build
   bash scripts/check-deleted-components.sh
   pnpm --filter ./frontend exec vitest run src/components/kanban/__tests__/
   ```

## User Setup Required

The fixture-seed step (Task 1 finalization above) requires a Supabase MCP-equipped operator on the host. See 52-FIXTURE.md for the full procedure.

## Next Phase Readiness

- **Worktree-side deliverable complete**: 6 specs flipped, primitive selectors wired, fixture contract published.
- **Host-side close-out pending** (4 checkpoints listed above). After host-side completion, Phase 52 ships and Phase 53 (bundle ceiling recalibration after `tunnel-rat` removal) is unblocked.
- **No regression risk introduced**: the only production-code changes are two non-breaking `data-*` attribute additions; everything else is in test files or planning docs.

## Self-Check

- [x] `52-FIXTURE.md` created and committed (`bbd7d5e8`).
- [x] `.env.test.example` updated and committed (`bbd7d5e8`).
- [x] 6 specs flipped — `grep -c "test.fixme" frontend/tests/e2e/tasks-tab-*.spec.ts frontend/tests/e2e/engagement-kanban-dialog-*.spec.ts` returns 0 across all 8 files.
- [x] 8 specs aligned on canonical UUID — `grep -c "PHASE_52_FIXTURE_ENGAGEMENT_ID" ...` returns 8 (one ref per spec).
- [x] `data-droppable-id` and `data-card-id` present in primitive files.
- [x] Two commits in worktree branch (`bbd7d5e8`, `9daf899e`) plus the SUMMARY commit (this one).
- [x] No mutation of STATE.md or ROADMAP.md (per parallel-execution rules).
- [x] 52-VALIDATION.md NOT prematurely flipped (host-side owns that step).

**Self-check verdict:** PASSED — worktree deliverables complete; runtime work clearly deferred and documented.

---

_Phase: 52-heroui-v3-kanban-migration_
_Plan: 05_
_Completed: 2026-05-16 (worktree-side); host-side close-out pending via checkpoint:human-verify_
