---
phase: 39-kanban-calendar
plan: 02
subsystem: WorkBoard
tags: [board, board-column, kanban, rtl, sortable, board-01]
dependency_graph:
  requires:
    - 39-00 (LtrIsolate, toArDigits, work-item.types, BoardColumn placeholder)
    - 39-01 (KCard component + board.css kcard rules)
  provides:
    - BoardColumn component (consumable by 39-04 WorkBoard composer)
    - Column CSS rules (.col, .col-head, .col-count, .col-add, .col-body, .col-empty)
    - emptyColumn i18n key (en/ar) for unified-kanban namespace
  affects:
    - frontend/src/pages/WorkBoard/* (column shell now production-ready)
tech_stack:
  added: []
  patterns:
    - 'useId() + role=region + aria-labelledby for landmark a11y per column'
    - 'Conditional SortableContext wrapping (dndEnabled toggle) — 39-04 wires DndContext'
    - 'LtrIsolate wrapper around col-count digit so RTL layout never reverses count digits'
    - 'Per-column add button with i18n-aware accessible name and 44x44 touch target'
key_files:
  created:
    - frontend/src/pages/WorkBoard/__tests__/BoardColumn.test.tsx
  modified:
    - frontend/src/pages/WorkBoard/BoardColumn.tsx
    - frontend/src/pages/WorkBoard/board.css
    - frontend/public/locales/en/unified-kanban.json
    - frontend/public/locales/ar/unified-kanban.json
decisions:
  - 'Mocked @dnd-kit/sortable in tests via vi.mock() to assert wrapper presence by data-testid sentinel — avoids requiring a real DndContext in unit scope; real DnD wiring lives in 39-04.'
  - 'Mocked KCard in BoardColumn tests so the suite is hermetic and not coupled to KCard internals — KCard owns its own 15-test suite from 39-01.'
  - 'Used default-value `defaultValue: "No items"` on t(emptyColumn) so the component renders a sensible string even if i18next is loading or the key is missing during dev.'
  - 'Replaced jest-dom .toBeInTheDocument() with .toBeTruthy() — same convention as 39-01 (jest-dom not wired into tests/setup.ts).'
metrics:
  duration_seconds: 198
  duration_minutes: 3
  tasks_total: 2
  tasks_completed: 2
  files_created: 1
  files_modified: 4
  tests_added: 8
  tests_passing: 8
  completed_date: 2026-04-25
---

# Phase 39 Plan 02: BoardColumn Widget Summary

BoardColumn is the verbatim-port kanban column shell — a `role="region"` section
containing a header (title + LtrIsolate-wrapped mono count + per-column add button)
over a body that conditionally wraps its KCard children in `SortableContext` when
`dndEnabled` is true. Production-ready for consumption by 39-04 (WorkBoard composer).

## Tasks Completed

| Task | Name                                          | Commit     | Files                                                                                                              |
| ---- | --------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| RED  | Add failing BoardColumn unit tests + i18n key | `d21ba472` | `frontend/src/pages/WorkBoard/__tests__/BoardColumn.test.tsx`, `frontend/public/locales/en+ar/unified-kanban.json` |
| 1    | Implement BoardColumn (BOARD-01) — GREEN      | `ad679f64` | `frontend/src/pages/WorkBoard/BoardColumn.tsx`                                                                     |
| 2    | Append column CSS rules to board.css          | `35a625c4` | `frontend/src/pages/WorkBoard/board.css`                                                                           |

## TDD Gate Compliance

- RED gate: commit `d21ba472` — 8/8 tests fail against placeholder BoardColumn (`Unable to find an accessible element with the role "region"`).
- GREEN gate: commit `ad679f64` — 8/8 tests pass after implementation.
- REFACTOR gate: not required (component is minimal; 78-line implementation matches plan body).

## Verification

| Check                                                                              | Result    |
| ---------------------------------------------------------------------------------- | --------- |
| `pnpm test --run src/pages/WorkBoard/__tests__/BoardColumn.test.tsx`               | 8 passed  |
| `pnpm test --run src/pages/WorkBoard/__tests__/{BoardColumn,KCard}.test.tsx`       | 23 passed |
| BoardColumn.tsx contains col-head/col-count/col-add/SortableContext/role="region"  | 8 hits    |
| BoardColumn.tsx forbidden RTL-unsafe grep (textAlign / ml-/mr-/pl-/pr- / .reverse) | empty     |
| BoardColumn.tsx `dangerously` count                                                | 0         |
| BoardColumn.tsx imports `KCard` from `'./KCard'`                                   | yes       |
| board.css contains `min-width: 300px`                                              | yes       |
| board.css contains `.col-count` rule and `.col-add` with 44×44                     | yes       |
| board.css still contains `.kcard.overdue` (39-01 preserved)                        | yes       |
| board.css forbidden physical-direction CSS grep                                    | empty     |
| board.css forbidden hex/hsl/rgb grep                                               | empty     |
| frontend type-check on BoardColumn surface                                         | 0 errors  |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] jest-dom matchers not installed**

- **Found during:** RED test scaffolding.
- **Issue:** Same as 39-01 — `@testing-library/jest-dom` is not registered in `frontend/tests/setup.ts`, so `.toBeInTheDocument()` would throw.
- **Fix:** Wrote tests against `.toBeTruthy()` from the start (matching 39-01 convention).
- **Files modified:** `frontend/src/pages/WorkBoard/__tests__/BoardColumn.test.tsx` (initial author).
- **Commit:** rolled into RED commit `d21ba472`.

### Architectural Notes (no Rule-4 stops)

- `BoardColumn` props accept `KCardItem[]` (from `./KCard`) rather than the raw `WorkItem[]` so callers can pass items with the optional server-enriched `dossier` summary that KCard renders. The plan's `BoardColumnProps.items: WorkItem[]` signature is structurally compatible because `KCardItem = WorkItem & { dossier?: ... }`.
- The plan's per-column `+` accessible name uses `t('actions.addToColumn', { column: title })`, which already existed in both `unified-kanban.json` files from 39-00 — no new key required for that string. Only `emptyColumn` had to be added.

## Authentication Gates

None.

## Threat Surface

- **T-39-02-XSS** — mitigated as planned. `<h3>{title}</h3>` and the empty-state text both rely on React JSX escaping. Acceptance grep confirms zero `dangerously` references in `BoardColumn.tsx`.
- **T-39-02-IDOR** — accepted. `onAddItem(stage)` forwards an opaque enum value (`'todo' | 'in_progress' | …`) to the TaskCreate flow; downstream RLS/auth enforcement is unchanged.

No new threat surface introduced beyond the plan's threat_model.

## Known Stubs

None. BoardColumn is feature-complete and waiting only for 39-04 to compose it into a full board with a real `DndContext`.

## Self-Check: PASSED

- FOUND: `frontend/src/pages/WorkBoard/BoardColumn.tsx`
- FOUND: `frontend/src/pages/WorkBoard/board.css` (with new `.col-*` rules + preserved `.kcard*` rules)
- FOUND: `frontend/src/pages/WorkBoard/__tests__/BoardColumn.test.tsx`
- FOUND: `frontend/public/locales/en/unified-kanban.json` (with `emptyColumn` key)
- FOUND: `frontend/public/locales/ar/unified-kanban.json` (with `emptyColumn` key)
- FOUND commit: `d21ba472` (RED)
- FOUND commit: `ad679f64` (GREEN — BoardColumn impl)
- FOUND commit: `35a625c4` (Task 2 — board.css column rules)
