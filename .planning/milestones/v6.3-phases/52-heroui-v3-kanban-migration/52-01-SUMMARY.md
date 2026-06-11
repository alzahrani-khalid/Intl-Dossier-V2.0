---
phase: 52-heroui-v3-kanban-migration
plan: 01
subsystem: testing
tags: [kanban, dnd-kit, vitest, playwright, eslint]
requires:
  - phase: 51-design-token-compliance-gate
    provides: token-compliance enforcement and Tier-C audit traceability
provides:
  - Wave-0 RED unit contracts for the shared kanban primitive
  - Playwright spec inventory for both migrated Kanban surfaces
  - ESLint regression fixture for the local kibo-ui import ban
affects: [phase-52, kanban, e2e, lint]
tech-stack:
  added: []
  patterns:
    - Vitest boundary mocks for dnd-kit sensors and lifecycle handlers
    - Playwright locale and viewport matrix for EN/AR visual baselines
key-files:
  created:
    - frontend/src/components/kanban/__tests__/KanbanProvider.test.tsx
    - frontend/src/components/kanban/__tests__/KanbanBoard.test.tsx
    - frontend/src/components/kanban/__tests__/KanbanCard.test.tsx
    - frontend/src/components/kanban/__tests__/eslint-ban.test.ts
    - frontend/tests/e2e/tasks-tab-visual.spec.ts
    - frontend/tests/e2e/engagement-kanban-dialog-visual.spec.ts
    - frontend/tests/e2e/tasks-tab-dnd.spec.ts
    - frontend/tests/e2e/tasks-tab-keyboard.spec.ts
    - frontend/tests/e2e/tasks-tab-a11y.spec.ts
    - frontend/tests/e2e/engagement-kanban-dialog-dnd.spec.ts
    - frontend/tests/e2e/engagement-kanban-dialog-keyboard.spec.ts
    - frontend/tests/e2e/engagement-kanban-dialog-a11y.spec.ts
    - tools/eslint-fixtures/bad-kibo-ui-import.tsx
  modified: []
key-decisions:
  - 'Aligned the KanbanCard unit contract with the provider-level DragOverlay strategy from 52-RESEARCH rather than the stale per-card overlay sketch.'
patterns-established:
  - 'Plan-01 RED tests are allowed to fail until the primitive and ESLint widening land.'
requirements-completed: [KANBAN-01, KANBAN-02, KANBAN-03, KANBAN-04]
duration: 32 min
completed: 2026-05-16
---

# Phase 52 Plan 01: Wave-0 Kanban test scaffold Summary

**RED test contracts for the shared Kanban primitive, migrated surface Playwright coverage, and local kibo-ui import-ban regression fixture.**

## Performance

- **Duration:** 32 min
- **Started:** 2026-05-16T11:05:00Z
- **Completed:** 2026-05-16T11:37:00Z
- **Tasks:** 3/3
- **Files modified:** 13 created, 0 modified

## Accomplishments

- Added three Vitest unit contracts for `KanbanProvider`, `KanbanBoard`, and `KanbanCard`.
- Added eight Playwright spec files for TasksTab and EngagementKanbanDialog visual, dnd, keyboard, and a11y slots.
- Added `tools/eslint-fixtures/bad-kibo-ui-import.tsx` and a companion Vitest assertion that will turn green after Plan 04 widens the ban.

## Task Commits

1. **Task 1: Vitest unit-test scaffolds** — `234ae34f` (`test`)
2. **Task 2: Playwright e2e spec scaffolds** — `695cda70` (`test`)
3. **Task 3: ESLint regression fixture** — `0418cfed` (`test`)

## Files Created/Modified

- `frontend/src/components/kanban/__tests__/KanbanProvider.test.tsx` — RED sensor, drag-end, and announcement contract.
- `frontend/src/components/kanban/__tests__/KanbanBoard.test.tsx` — RED drop-target ring, cancelled-border, default token, and no-shadow contract.
- `frontend/src/components/kanban/__tests__/KanbanCard.test.tsx` — RED hover token, no-shadow, and dragging-state contract.
- `frontend/src/components/kanban/__tests__/eslint-ban.test.ts` — RED fixture assertion until `@/components/kibo-ui/*` is banned.
- `frontend/tests/e2e/tasks-tab-visual.spec.ts` — real four-case visual matrix for TasksTab.
- `frontend/tests/e2e/engagement-kanban-dialog-visual.spec.ts` — real four-case visual matrix through EngagementDossierPage dialog trigger.
- `frontend/tests/e2e/tasks-tab-dnd.spec.ts` — `test.fixme` dnd parity slot.
- `frontend/tests/e2e/tasks-tab-keyboard.spec.ts` — `test.fixme` keyboard parity slot.
- `frontend/tests/e2e/tasks-tab-a11y.spec.ts` — `test.fixme` a11y slot.
- `frontend/tests/e2e/engagement-kanban-dialog-dnd.spec.ts` — `test.fixme` dnd parity slot.
- `frontend/tests/e2e/engagement-kanban-dialog-keyboard.spec.ts` — `test.fixme` keyboard parity slot.
- `frontend/tests/e2e/engagement-kanban-dialog-a11y.spec.ts` — `test.fixme` a11y slot.
- `tools/eslint-fixtures/bad-kibo-ui-import.tsx` — deliberate local kibo-ui import fixture.

## Verification Evidence

- `cd frontend && pnpm exec vitest run src/components/kanban/__tests__/ --reporter=verbose` exits `1` as intended for Wave 0 RED.
  - `KanbanProvider.test.tsx` fails with module-not-found for `../KanbanProvider`.
  - `KanbanCard.test.tsx` fails with module-not-found for `../KanbanCard`.
  - `KanbanBoard.test.tsx` fails against the pre-existing unused legacy `frontend/src/components/kanban/KanbanBoard.tsx` shape rather than module-not-found; Plan 02 overwrites that unused file with the intended primitive.
  - `eslint-ban.test.ts` fails because Plan 04 has not widened the import ban yet.
- `cd frontend && pnpm exec playwright test --list tests/e2e/tasks-tab-* tests/e2e/engagement-kanban-dialog-*` exits `0` and lists `32` test cases across `8` files.
- `grep -h "test.fixme" ...` returns `6` across the dnd/keyboard/a11y files.
- `grep -h "toHaveScreenshot" ...` returns `2` total, one visual assertion per visual spec file.
- `@axe-core/playwright` is already installed in `frontend/package.json`; the a11y specs remain `test.fixme` until Plan 05 flips them.

## Decisions Made

- The KanbanCard RED contract does not assert an inline per-card overlay clone. Plan 02 selected the provider-level single `<DragOverlay>` strategy from 52-RESEARCH Pattern 1, so the RED card contract focuses on hover/no-shadow/dragging source-card behavior.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Existing unused KanbanBoard file changed the expected RED shape**

- **Found during:** Task 1 verification
- **Issue:** `frontend/src/components/kanban/KanbanBoard.tsx` already existed as an unused legacy component, so `KanbanBoard.test.tsx` failed against wrong exports instead of module-not-found.
- **Fix:** No code fix in Plan 01; documented the RED-mode discrepancy. Plan 02 is already scoped to replace that file with the shared primitive.
- **Files modified:** None
- **Verification:** `rg "from ['\"]@/components/kanban" frontend/src` showed no live imports of the legacy file.
- **Committed in:** n/a

---

**Total deviations:** 1 documented (0 code auto-fixes).  
**Impact on plan:** No production behavior changed. The Wave-0 contract remains RED and actionable for Plan 02.

## Issues Encountered

- Playwright initially rejected duplicate a11y test titles for repeated LTR/RTL entries at different viewports. The title now includes viewport dimensions.

## User Setup Required

None — no external service configuration required in this plan.

## Next Phase Readiness

Plan 02 can build the shared primitive and use the RED unit tests as its green target. Plan 04 will later flip `eslint-ban.test.ts` from RED to GREEN by widening `no-restricted-imports`.

## Self-Check: PASSED

- Created files listed above exist on disk.
- Task commits exist: `234ae34f`, `695cda70`, `0418cfed`.
- RED verification state is intentional and documented.

---

_Phase: 52-heroui-v3-kanban-migration_
_Completed: 2026-05-16_
