---
phase: 39-kanban-calendar
plan: 03
subsystem: frontend/pages/WorkBoard
tags: [widget, toolbar, search, filter-pills, overdue-chip, rtl, e2e-activation, wave-1]
requirements: [BOARD-01]
dependency_graph:
  requires:
    - '39-00 (placeholder BoardToolbar barrel + i18n keys + skipped E2E spec stubs)'
  provides:
    - 'BoardToolbar widget with search, filter pills, overdue chip, + New item button'
    - '.board-toolbar / .filter-pill / .overdue-chip / .board-search / .new-item-btn CSS'
    - 'Activated kanban-search.spec.ts + kanban-filters.spec.ts (skipped → assertions live)'
  affects:
    - '39-04 (WorkBoard composer): consumes BoardToolbar; owns searchQuery + onModeChange state'
    - '39-09 (Wave 2): playwright config __dirname fix unblocks the two activated specs'
tech_stack:
  added: []
  patterns:
    - 'Filter-pill pattern (PATTERNS.md SP-D06): wired pill via aria-pressed; visual stubs via aria-disabled + Coming soon title; landmine — disabled pill onClick MUST NOT call onModeChange'
    - 'Mono digits in RTL via <LtrIsolate><span className="font-mono"> + toArDigits(count, lang)'
    - 'Token-only CSS (Phase 33 SP-2): var(--surface), var(--accent-soft), var(--accent-ink), var(--ink-mute), var(--danger), var(--font-mono)'
    - 'Logical-direction CSS only (no padding-left/right, no margin-left/right, no border-left/right) per RTL Rule 1'
    - 'Controlled React input — searchQuery prop bound to value; onChange fires onSearchChange (XSS mitigation per threat T-39-03-XSS)'
key_files:
  created:
    - frontend/src/pages/WorkBoard/__tests__/BoardToolbar.test.tsx
    - .planning/phases/39-kanban-calendar/39-03-SUMMARY.md
  modified:
    - frontend/src/pages/WorkBoard/BoardToolbar.tsx
    - frontend/src/pages/WorkBoard/board.css
    - frontend/tests/e2e/kanban-search.spec.ts
    - frontend/tests/e2e/kanban-filters.spec.ts
decisions:
  - 'Visual-stub pills use a stable noop callback (`const noop = () => {}`) bound to onClick instead of omitting onClick — keeps DOM shape uniform across all three pills and lets axe/Playwright continue treating them as buttons (role=button) without throwing on aria-disabled+missing-handler edge cases'
  - 'Used fireEvent.change instead of userEvent.type in Test 5 — controlled-input behavior is identical and the change-event path matches React 19 synthetic-event semantics; userEvent.type was overkill for asserting onSearchChange wiring'
  - 'Added bilingual EN+AR regex to kanban-filters.spec.ts so the spec passes regardless of which locale the auth-fixture user lands in'
metrics:
  duration: '~14 minutes'
  tasks_completed: 3
  files_created: 1
  files_modified: 4
  commits: 3
  unit_tests_added: 8
  unit_tests_passing: 8
  completed_date: '2026-04-25'
---

# Phase 39 Plan 03: BoardToolbar Widget — Summary

BoardToolbar widget with search input, three filter pills (By status wired; By dossier/By owner aria-disabled stubs per CONTEXT D-06), mono `{n} overdue` chip wrapped in `<LtrIsolate>`, and `+ New item` action — plus appended toolbar CSS in `board.css` and activation of two previously-skipped Playwright specs (`kanban-search`, `kanban-filters`). 8 vitest tests pass; both E2E specs parse clean.

## Tasks Executed

### Task 1: Implement BoardToolbar component — commit `b4ec7acc`

- Replaced the 39-00 placeholder `export const BoardToolbar = (): null => null` with the real widget at `frontend/src/pages/WorkBoard/BoardToolbar.tsx`.
- Imports follow PATTERNS.md SP-1/SP-4/SP-5: `useTranslation('unified-kanban')`, `LtrIsolate`, `toArDigits`, `KanbanColumnMode` type-only.
- Three filter pills rendered as `<button className="filter-pill">`:
  - "By status" — `aria-pressed={mode === 'status'}` + `onClick={() => onModeChange('status')}`
  - "By dossier" / "By owner" — `aria-disabled="true"` + `title={t('filters.comingSoon')}` + stable `noop` onClick (D-06 landmine: disabled pills MUST NOT call onModeChange)
- Overdue chip: `<LtrIsolate><span className="overdue-chip font-mono">{t('overdueChip', { count: toArDigits(overdueCount, lang) })}</span></LtrIsolate>`
- Search input: controlled `<input type="search">` with `value={searchQuery}` and `onChange` calling `onSearchChange(e.target.value)`.
- `+ New item` button: text `+ ${newItemLabel}` with `aria-label={newItemLabel}` and `onClick={onNewItem}`.
- Authored 7 behaviors as 8 unit tests (Test 4 split into en + ar to cover Arabic-Indic digit rendering): all 8 pass in 481ms.

### Task 2: Append toolbar CSS rules — commit `87a8d615`

- Appended a single Phase-39-Plan-03 block to `frontend/src/pages/WorkBoard/board.css` (76 lines). All earlier `.kcard*` (39-01) and `.col*` (39-02) rules preserved verbatim.
- New rules: `.board-toolbar` (flex+wrap, surface/line tokens), `.filter-pills`, `.filter-pill` (44px min-height per touch target), `.filter-pill[aria-pressed='true']` (accent-soft), `.filter-pill[aria-disabled='true']` (opacity 0.55, cursor not-allowed), `.overdue-chip` (mono, danger), `.board-search` (44px min-height, surface/ink tokens), `.board-search::placeholder` (ink-faint), `.new-item-btn` (44px, accent background).
- Token-only colors verified: `grep -E "#[0-9a-fA-F]{3,6}|hsl\\(|rgb\\("` returns empty.
- Logical-direction discipline verified: `grep -E "border-left|border-right|padding-left|padding-right|margin-left|margin-right"` returns empty.

### Task 3: Activate kanban-search + kanban-filters E2E specs — commit `8c646e35`

- Replaced the 39-00 `test.describe.skip()` placeholders with real assertions:
  - `kanban-search.spec.ts`: `page.route('**/api/**unified-kanban**', ...)` mock counts API calls before and after `search.fill('Acme')` — asserts no additional fetches fire (D-07 client-side filter contract).
  - `kanban-filters.spec.ts`: locates pills by EN+AR bilingual regex; asserts `By status` has `aria-pressed='true'`, both other pills have `aria-disabled='true'` and `title=/Coming soon|قريبًا/` (D-06).
- Both specs validated via TypeScript compiler API (`ts.createSourceFile`) — zero parse diagnostics.

## Verification Results

| Check                                                                                                                                                                     | Result                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `cd frontend && pnpm test --run src/pages/WorkBoard/__tests__/BoardToolbar.test.tsx`                                                                                      | 8/8 passed in 481ms                                                      |
| `grep -c .filter-pill frontend/src/pages/WorkBoard/board.css`                                                                                                             | 4 (`.filter-pill`, `.filter-pills`, `[aria-pressed]`, `[aria-disabled]`) |
| Token-only / no-physical-CSS greps on board.css                                                                                                                           | empty (clean)                                                            |
| Required substrings on BoardToolbar.tsx (`filter-pill`, `overdue-chip`, `aria-pressed`, `aria-disabled="true"`, all `filters.*` + `overdueChip` + `actions.newItem` keys) | all present                                                              |
| `grep -c "danger" + check no unsafe-HTML APIs (innerHTML / setInnerHTML) on BoardToolbar.tsx`                                                                             | 0 unsafe-HTML matches                                                    |
| `npx tsc --noEmit -p tsconfig.json` (filtered to BoardToolbar)                                                                                                            | no errors related to BoardToolbar                                        |
| TypeScript parse of activated E2E specs                                                                                                                                   | 0 / 0 diagnostics                                                        |

## Deviations from Plan

### Auto-handled / accepted

**1. [Rule 3 — Blocking, accepted not fixed] Pre-existing `frontend/playwright.config.ts` ESM `__dirname` bug**

- **Found during:** Task 3 verify step (`pnpm exec playwright test --list`).
- **Issue:** `ReferenceError: __dirname is not defined in ES module scope` at `playwright.config.ts:21:36` — same pre-existing bug already documented in 39-00-SUMMARY.md (deferred to 39-09).
- **Fix:** Did NOT touch `playwright.config.ts` (out of scope per SCOPE BOUNDARY rule — not introduced by this plan and explicitly assigned to 39-09). Validated spec syntax via `ts.createSourceFile` instead — both specs return zero parse diagnostics.
- **Files modified:** none.
- **Commit:** N/A (verification-only adjustment).

**2. [Decision] Test count split: 7 behaviors → 8 tests**

- The plan specified 7 behaviors; Test 4 ("Overdue chip renders count; AR uses Indic digits") was implemented as TWO tests (en + ar) so each locale assertion has its own failure surface. Net: 8 passing tests (still ≥ 7 acceptance threshold).
- Not a deviation per spec (acceptance only requires ≥7 passing); flagged here for traceability.

**3. [Style] Linter rewrote double-quoted attribute selectors to single quotes**

- `.filter-pill[aria-pressed="..."]` → `.filter-pill[aria-pressed='...']` after stylelint hook ran. Both syntaxes are CSS-equivalent; acceptance-grep was satisfied at write time before the linter rewrote it. Re-validated post-linter with single-quote pattern — still matches structurally.

## Authentication Gates

None — Task 3 specs use `page.goto('/kanban')` and rely on the project's existing playwright auth-setup fixture (same pattern as 39-00 stubs and Phase 38 dashboard specs); no new credentials surfaced or stored.

## Threat Surface

T-39-03-XSS (mitigation): Verified — `BoardToolbar.tsx` contains no unsafe-HTML APIs; the search input is a controlled React input whose value flows back through `onSearchChange` to the parent. Downstream filter (in 39-04) operates on plain `String#includes()` over already-rendered fields. T-39-03-DOS (accept): No deviation — board scale is bounded (~50 items) and debouncing is deferred to Phase 43 polish per plan.

## Self-Check: PASSED

**Files verified to exist:**

- FOUND: frontend/src/pages/WorkBoard/BoardToolbar.tsx
- FOUND: frontend/src/pages/WorkBoard/**tests**/BoardToolbar.test.tsx
- FOUND: frontend/src/pages/WorkBoard/board.css (with `.filter-pill` rules appended)
- FOUND: frontend/tests/e2e/kanban-search.spec.ts (activated)
- FOUND: frontend/tests/e2e/kanban-filters.spec.ts (activated)
- FOUND: .planning/phases/39-kanban-calendar/39-03-SUMMARY.md

**Commits verified to exist (`git log --oneline`):**

- FOUND: b4ec7acc — feat(39-03): build BoardToolbar widget
- FOUND: 87a8d615 — feat(39-03): append BoardToolbar CSS rules to board.css
- FOUND: 8c646e35 — test(39-03): activate kanban-search + kanban-filters E2E specs
