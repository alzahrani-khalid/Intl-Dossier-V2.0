---
phase: 57-phase-52-deviation-closure-d-19-d-23
plan: 02
subsystem: workboard
tags:
  [workboard, dnd-kit, kanban-primitive, eslint-ban, visual-baselines, host-operator, surface-swap]

# Dependency graph
requires:
  - phase: 52-heroui-v3-kanban-migration
    provides: shared @/components/kanban primitive (KanbanProvider + KanbanBoard + KanbanCards + KanbanCard) with data-droppable-id / data-card-id selectors and Phase 39 kanban-*.spec.ts contract
  - phase: 57-phase-52-deviation-closure-d-19-d-23
    plan: 03
    provides: baseline-byte-distinction.test.ts hash-comparison meta-test (asserts the regenerated PNGs are byte-distinct after this plan's baseline regen lands)
provides:
  - WorkBoard.tsx consuming KanbanProvider/KanbanCards/KanbanCard from @/components/kanban (no direct @dnd-kit/core imports)
  - BoardColumn.tsx consuming KanbanCards + KanbanCard (no direct @dnd-kit/sortable imports)
  - eslint.config.mjs no-restricted-imports pattern banning direct @dnd-kit/core outside shared primitive
  - tools/eslint-fixtures/bad-direct-dndkit-import.tsx positive-failure fixture
  - frontend/src/components/kanban/__tests__/eslint-ban-dndkit.test.ts vitest meta-test
  - Updated WorkBoard.test.tsx + BoardColumn.test.tsx mocks pointing at @/components/kanban
  - .planning/phases/57-.../57-PRE-MIGRATION-FAILURES.md triage scaffold with operator runbook
affects: [phase-52-verification-D-21-row, kanban-visual-baselines, phase-57-plan-04-live-run]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Surface-swap migration (D-57-07): consumer adopts shared primitive via render-prop while retaining its own column/card adapter components and CSS — smallest viable refactor'
    - 'Tailwind `display: contents` (via tailwind-merge `grid` → `contents` conflict resolution) to make a wrapping primitive disappear from layout so the existing flex/scroll parent (.board-columns) keeps its DOM contract'
    - 'Conditional prop spread for DnD sensor gating: `{...(mode === "status" ? {} : { sensors: [] })}` preserves D-03 (sensors active in status mode, empty otherwise) without breaking the shared primitive default sensors'
    - '3-layer ESLint guard now applied to a 3rd anti-pattern (kibo-ui in Phase 52 → addInitScript(i18nextLng) in Phase 57-03 → direct @dnd-kit/core in Phase 57-02): rule + positive-failure fixture + vitest meta-test'
    - 'Pre-migration triage scaffold with operator-paste sections (deferred runtime tasks documented in worktree, executed on host per Phase 52 Plan 05 precedent)'

key-files:
  created:
    - tools/eslint-fixtures/bad-direct-dndkit-import.tsx
    - frontend/src/components/kanban/__tests__/eslint-ban-dndkit.test.ts
    - .planning/phases/57-phase-52-deviation-closure-d-19-d-23/57-PRE-MIGRATION-FAILURES.md
    - .planning/phases/57-phase-52-deviation-closure-d-19-d-23/57-02-SUMMARY.md
  modified:
    - frontend/src/pages/WorkBoard/WorkBoard.tsx
    - frontend/src/pages/WorkBoard/BoardColumn.tsx
    - frontend/src/pages/WorkBoard/__tests__/WorkBoard.test.tsx
    - frontend/src/pages/WorkBoard/__tests__/BoardColumn.test.tsx
    - eslint.config.mjs

key-decisions:
  - "Surface-swap (D-57-07): WorkBoard keeps BoardToolbar / BoardColumn / KCard / board.css; only the DnD outer layer flips from `<DndContext sensors={..}>` to `<KanbanProvider sensors={..}>` and the column inner layer flips from `<SortableContext>` to `<KanbanCards>`. KCard renders inside KanbanCard.children with Tailwind `!`-important overrides that strip the wrapping Card primitive's chrome so the existing `.kcard` board.css styling stays canonical."
  - 'Tailwind `contents` override on KanbanProvider''s outer div: passing `className="contents"` makes tailwind-merge resolve the primitive''s default `grid size-full auto-cols-fr grid-flow-col` display family to `display: contents`. The wrapping div disappears from layout, so the existing `.board-columns` flex-with-scroll parent (kanban-responsive.spec.ts contract) keeps its DOM behavior.'
  - 'D-03 sensor gating uses conditional spread: in `status` mode we omit the `sensors` prop entirely (KanbanProvider''s `<DndContext sensors={internalSensors} {...props}>` keeps its default 3-sensor stack); when `mode !== "status"` we spread `{ sensors: [] }` which overrides via the trailing `{...props}` spread.'
  - 'ESLint carve-out for non-kanban existing @dnd-kit/core consumers (report-builder, dashboard-widgets, briefing-books, dashboard-widget.types.ts): the new ban targets the WorkBoard migration pattern but does NOT regress workspace lint on unrelated DnD consumers that are out of Phase 57 scope. Each consumer is tracked in §"Deferred Items" for a follow-up phase.'
  - "Pre-migration triage authored as a scaffold (frontmatter + per-test rows + operator runbook) rather than a fully-filled report because Playwright cannot run inside the worktree (no node_modules, no browser binaries). Host operator runs the canonical invocation and pastes the list-reporter output. Established by Phase 52 Plan 05's 'worktree honesty: defer runtime to host' precedent."
  - "BoardColumn unit test scope tightened: SortableContext-wrap assertions removed since that behavior is now KanbanCards-internal (covered by the shared primitive's own tests). Replaced with a KanbanCards id-prop assertion to keep the per-stage data-routing contract visible at the BoardColumn boundary."

patterns-established:
  - 'Surface-swap migration pattern: consumer adopts shared primitive while keeping its own adapter components + CSS. Use when the consumer has invested visual/behavior layers (BoardToolbar, KCard, board.css) that should outlive the underlying DnD library swap.'
  - 'Pre-migration triage scaffold: when migrating against a flaky/regression-bearing test suite, author a triage table FIRST capturing the failure state of the old code, then classify each failure as (a) migration-induced, (b) structural, (c) spec-bug. Clean causality for post-migration green/red attribution.'

requirements-completed: [DEVIATE-02]

# Metrics
duration: ~25min
completed: 2026-05-18
---

# Phase 57 Plan 02: D-21 WorkBoard Shared-Kanban-Primitive Migration Summary

**WorkBoard.tsx + BoardColumn.tsx now consume the shared @/components/kanban primitive instead of importing @dnd-kit/core / @dnd-kit/sortable directly. The Phase 39 kanban-\*.spec.ts contract (`section.col`, `.kcard.overdue`, `.board-columns`, BoardToolbar, cancelled-items filter) is preserved by surface-swap (D-57-07); visual baselines drift slightly and regenerate on the canonical host in Task 3.**

## Performance

- **Duration:** ~25 min in worktree (Tasks 1 + 2). Task 3 (host-operator baseline regen) handed off to operator post-merge.
- **Started:** 2026-05-18T17:48:04Z
- **Tasks-2-completed:** 2026-05-18T17:58:57Z
- **Tasks:** 3 plan-level tasks, 4 atomic commits in worktree
- **Files modified:** 9 (5 modified + 4 created including the SUMMARY)

## Accomplishments

- **WorkBoard.tsx migrated** to consume `KanbanProvider`, `DragEndEvent`, `KanbanItemProps` from `@/components/kanban`. The local sensor stack (`useSensor(MouseSensor, ...)` × 3 + `useSensors(...)`) is gone; KanbanProvider's internal MouseSensor (distance:8) / TouchSensor (delay:200, tolerance:5) / KeyboardSensor (sortableKeyboardCoordinates) take over with the same activation constraints.
- **BoardColumn.tsx migrated** to consume `KanbanCards`, `KanbanCard`, `KanbanItemProps` from `@/components/kanban`. The `<SortableContext items={ids} strategy={...}>` wrapper is gone; KanbanCards owns the SortableContext + per-card `useSortable` + `data-card-id` attribute. KCard renders inside `<KanbanCard>` children slot.
- **`.board-columns` scroll behavior preserved** via Tailwind `contents` override on KanbanProvider's outer div. The shared primitive's default `grid size-full auto-cols-fr grid-flow-col` resolves to `display: contents` (tailwind-merge dedup), so `section.col` columns become direct flex children of the existing `.board-columns` parent — `kanban-responsive.spec.ts` `scrollWidth > clientWidth` contract preserved.
- **D-03 sensor gating preserved** via conditional spread: in `status` mode no `sensors` prop is forwarded so KanbanProvider's internal sensors stay active; in non-status modes `sensors={[]}` is spread to override.
- **Cancelled-items filter (Confirmation #8) preserved** verbatim: `visibleItems = items.filter(!isCancelled)` runs before the column-stage projection.
- **3-layer ESLint guard against @dnd-kit/core direct imports** (D-57-08): rule + positive-failure fixture + vitest meta-test, mirroring Phase 52 KANBAN-03 (kibo-ui) and Phase 57-03 (addInitScript(i18nextLng)) twins.
- **WorkBoard.test.tsx + BoardColumn.test.tsx mocks updated** to point at the new @/components/kanban surface. The KanbanProvider mock captures `sensors`, `onDragEnd`, `columns`, `data` for assertion; the BoardColumn mock surface tightens scope to direct-render assertions (header, count, add button, empty placeholder, region role, KanbanCards id-prop).
- **Pre-migration failure triage scaffold** authored at `.planning/phases/57-.../57-PRE-MIGRATION-FAILURES.md` with per-test rows + operator runbook (D-57-10); operator pastes the actual Playwright list-reporter output post-host-run.

## Task Commits (atomic per D-57-19)

| #   | Task                                                                | Commit     | Type |
| --- | ------------------------------------------------------------------- | ---------- | ---- |
| 1   | Pre-migration kanban-\*.spec.ts triage scaffold (D-57-10)           | `6e4e6aca` | docs |
| 2a  | ESLint ban + fixture + meta-test for @dnd-kit/core direct (D-57-08) | `4dd97782` | feat |
| 2b  | WorkBoard.tsx + BoardColumn.tsx migration (D-57-06, D-57-07)        | `72e47c9a` | feat |
| 2c  | WorkBoard/BoardColumn test mock surface flip (D-57-07)              | `e2611906` | test |

Task 3 (visual baseline regeneration on canonical host) is handed off to the host operator per the §"Deferred to Host-Side" section below; baseline-regen + SUMMARY commit will land separately at the operator's terminal.

## Files Created/Modified

### Modified

- **`frontend/src/pages/WorkBoard/WorkBoard.tsx`** — drops L32-41 direct `@dnd-kit/core` imports + L132-141 local sensor stack; adds `import { KanbanProvider, DragEndEvent, KanbanItemProps } from '@/components/kanban'`. New `kanbanItems` memo projects `filtered` items into `{ ...it, name: title, column: workflow_stage }` shape. New `columnDescriptors` memo builds `{ id: stage, name: t('columns.<stage>') }` for KanbanProvider. New `dndExtraProps` ternary handles D-03 sensor gating via conditional `{...spread}`. Render tree replaces `<DndContext>` with `<KanbanProvider className="contents" {...dndExtraProps}>` rendered INSIDE the existing `<div className="board-columns">` wrapper; BoardColumn is rendered via the primitive's `children: (column) => ReactNode` render-prop. Cancelled-items filter, overdue-count derivation, search-filtering, kcard click routing, per-column +Add routing, and loading-skeleton tree all preserved verbatim.
- **`frontend/src/pages/WorkBoard/BoardColumn.tsx`** — drops L18 `@dnd-kit/sortable` import + L72-77 `<SortableContext>` wrapper; adds `import { KanbanCards, KanbanCard, KanbanItemProps } from '@/components/kanban'`. Render replaces the SortableContext-wrap + KCard map with `<KanbanCards id={stage} className="col-body">{(item) => <KanbanCard {...item} className="!..."><KCard .../></KanbanCard>}</KanbanCards>`. KCard renders inside KanbanCard's children slot with Tailwind `!`-important overrides that strip the Card primitive's chrome (gap-0, rounded-none, border-0, bg-transparent, p-0, hover:bg-transparent) so the `.kcard` board.css styling is the canonical visual layer. The `.col-empty` placeholder moves from inside the SortableContext to a sibling AFTER KanbanCards.
- **`frontend/src/pages/WorkBoard/__tests__/WorkBoard.test.tsx`** — drops `vi.mock('@dnd-kit/core', ...)` + `vi.mock('@dnd-kit/sortable', ...)`; adds `vi.mock('@/components/kanban', ...)` exporting KanbanProvider (captures `sensors` + `onDragEnd` + `columns` + `data` into `lastKanbanProviderProps`; emits `data-sensors-mode` attribute), KanbanBoard (`data-droppable-id` passthrough), KanbanCards (filters `data` by column and invokes children callback), KanbanCard (`data-card-id` passthrough). D-03 sensor gating assertion flipped from `expect(lastDndSensors.length).toBe(3)` to `expect(lastKanbanProviderProps.sensors).toBeUndefined()` + `expect(...).getAttribute('data-sensors-mode')).toBe('default')`. handleDragEnd test triggers via `lastKanbanProviderProps.onDragEnd!(...)`. Adds a new `it()` asserting the 4-stage columns descriptor `[todo, in_progress, review, done]`.
- **`frontend/src/pages/WorkBoard/__tests__/BoardColumn.test.tsx`** — drops `vi.mock('@dnd-kit/sortable', ...)`; adds minimal `vi.mock('@/components/kanban', ...)` (KanbanCards as a passthrough div recording the `id` prop; KanbanCard as children-passthrough). Removes the SortableContext-wrap assertions (now KanbanCards-internal). Adds a new `it()` asserting `KanbanCards` renders with `id` matching the workflow stage. Splits empty-placeholder coverage into positive (empty) + negative (non-empty) cases.
- **`eslint.config.mjs`** — extends the frontend `no-restricted-imports` patterns block (L139-) with `{ group: ['@dnd-kit/core', '@dnd-kit/core/*'], message: ... }` pointing offenders at `@/components/kanban`. Adds a carve-out block (`'no-restricted-imports': 'off'`) for `frontend/src/components/kanban/**`, `frontend/src/components/report-builder/**`, `frontend/src/components/dashboard-widgets/**`, `frontend/src/components/briefing-books/**`, `frontend/src/types/dashboard-widget.types.ts` — the shared primitive itself MUST import @dnd-kit/core, and the non-kanban consumers are out of Phase 57 scope. Adds a fixture-scoped block re-applying the ban on `tools/eslint-fixtures/bad-direct-dndkit-import.tsx`.

### Created

- **`tools/eslint-fixtures/bad-direct-dndkit-import.tsx`** — positive-failure fixture matching the bad-kibo-ui-import.tsx shape: header comment citing 57-CONTEXT.md D-57-08 + cross-link to docs/adr/0001-mobile-dnd-scope-out.md, single `import { DndContext } from '@dnd-kit/core'` line, `void DndContext`, `export {}`.
- **`frontend/src/components/kanban/__tests__/eslint-ban-dndkit.test.ts`** — vitest meta-test mirroring eslint-ban.test.ts / eslint-ban-i18n.test.ts byte-for-byte except for fixture path + describe/it titles + 60_000ms timeout. Spawns `pnpm exec eslint -c eslint.config.mjs --max-warnings 0 tools/eslint-fixtures/bad-direct-dndkit-import.tsx` via execSync from the repo root and asserts the process exits non-zero.
- **`.planning/phases/57-phase-52-deviation-closure-d-19-d-23/57-PRE-MIGRATION-FAILURES.md`** — pre-migration triage scaffold. Frontmatter (commit_sha, playwright_version, operator, canonical_invocation, specs_under_triage). Per-test table with 14 rows (8 spec files × their inner `test()` blocks) ready for operator-fills. Host-operator runbook with the canonical Playwright command + tee to `/tmp/57-pre-migration.log`. Classification key (a/b/c/PASS). Cross-references back to 52-05-SUMMARY.md §"4 observed regressions" and 57-CONTEXT.md D-57-10.

## DOM contract preserved for kanban-\*.spec.ts

The migration preserves every selector + attribute that the 8 Phase 39 specs depend on:

| Selector / attribute                                                 | Spec                                                  | Preserved by                                                                              |
| -------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `section.col` (x4)                                                   | kanban-render, kanban-responsive, kanban-rtl          | BoardColumn renders `<section className="col" role="region">` exactly as before           |
| `.kcard.overdue` with `border-inline-start: 3px solid var(--danger)` | kanban-render, kanban-rtl                             | KCard renders `<article className="kcard ... overdue">`; board.css unchanged              |
| `.board-columns` overflow-x: auto                                    | kanban-responsive (scrollWidth > clientWidth at <640) | WorkBoard wraps KanbanProvider in `<div className="board-columns">`; primitive `contents` |
| `BoardToolbar` role=toolbar + 3 filter pills + searchbox             | kanban-filters, kanban-search                         | BoardToolbar untouched                                                                    |
| Cancelled column NEVER rendered                                      | (implicit — kanban-render asserts 4 columns)          | `visibleItems` filter (Confirmation #8) drops cancelled BEFORE projection to kanbanItems  |
| `[data-droppable-id="<stage>"]`                                      | (new — kanban-dnd may use; primitive guarantee)       | KanbanBoard primitive emits `data-droppable-id={id}` (Phase 52 Plan 05 wiring)            |
| `[data-card-id="<id>"]`                                              | (new — primitive guarantee)                           | KanbanCard primitive emits `data-card-id={id}` (Phase 52 Plan 05 wiring)                  |

Visual baselines will drift because the shared primitive adds two new ancestor wrappers (`<div data-droppable-id>` around `<section.col>` was NOT in the legacy WorkBoard render; the legacy render had columns directly under `.board-columns`. **Correction: the migration retains the `<div className="board-columns">` parent and uses `display: contents` on KanbanProvider's wrapper to make `<section.col>` direct flex children — so no new ancestor between `.board-columns` and `<section.col>`. The new ancestor is around each `<article.kcard>`: `<div data-card-id> > Card div > article.kcard`**). The card-side wrapper drift is the principal reason Task 3 regenerates the 4 visual PNGs on the canonical host.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ESLint carve-out widened to non-kanban dnd-kit consumers**

- **Found during:** Task 2a (ESLint rule)
- **Issue:** The plan's `acceptance_criteria` says `grep -rE "from ['"]@dnd-kit/(core|sortable|utilities)['"]" frontend/src --include='*.tsx' --include='*.ts'` returns ONLY matches under `frontend/src/components/kanban/**`. But pre-migration grep returns 6 unrelated consumers:
  - `frontend/src/types/dashboard-widget.types.ts` (`UniqueIdentifier` type)
  - `frontend/src/components/report-builder/{FieldList,ColumnBuilder,GroupingBuilder,ReportBuilder}.tsx` (drag-and-drop for report field builder)
  - `frontend/src/components/dashboard-widgets/{WidgetContainer,WidgetGrid}.tsx` (drag-and-drop for widget grid)
  - `frontend/src/components/briefing-books/BriefingBookBuilder.tsx` (drag-and-drop for briefing-section reorder)
  Migrating ALL of them to the shared primitive is FAR out of Plan 57-02's `files_modified` frontmatter (which only lists WorkBoard files).
- **Fix:** Added an ESLint carve-out block for those paths so the new ban does not regress workspace lint. The shared primitive itself (`frontend/src/components/kanban/**`) keeps `no-restricted-imports: off` so it can import @dnd-kit/core.
- **Files modified:** `eslint.config.mjs`
- **Commit:** `4dd97782`
- **Follow-up tracked in:** §"Deferred Items" below — each non-kanban consumer needs either a migration to the shared primitive OR a per-file `eslint-disable` cleanup in a future phase.

**2. [Rule 3 - Blocking] Triage scaffold authored instead of fully-filled report**

- **Found during:** Task 1
- **Issue:** The Playwright triage run cannot execute inside the worktree (no `frontend/node_modules`, no browser binaries, no Vite dev server). The plan's `acceptance_criteria` for Task 1 requires "every failure row has a classification" — but generating that requires a runtime Playwright execution.
- **Fix:** Authored the triage SCAFFOLD with full frontmatter + per-test table + operator runbook. Host operator pastes the Playwright list-reporter output post-run and fills the classification cells.
- **Files modified:** `.planning/phases/57-.../57-PRE-MIGRATION-FAILURES.md`
- **Commit:** `6e4e6aca`
- **Precedent:** Phase 52 Plan 05 §"Deferred to Host-Side" (lines 135-244) — same pattern of authoring scaffold in worktree + handing off runtime to operator.

**3. [Rule 1 - Refinement] BoardColumn unit test scope tightened**

- **Found during:** Task 2c
- **Issue:** The original BoardColumn test asserted "wraps children in SortableContext when dndEnabled is true" and "does NOT wrap when dndEnabled is false" — but after migration BoardColumn no longer owns SortableContext (KanbanCards does). Asserting it would require keeping a SortableContext-mock that no longer corresponds to BoardColumn's responsibilities.
- **Fix:** Removed the SortableContext-wrap assertions; added a `KanbanCards id-prop` assertion (`kanban-cards-in_progress` data-testid + `data-kanban-id` attribute). Per-item card rendering moves to the shared primitive's own tests under `frontend/src/components/kanban/__tests__/`.
- **Files modified:** `frontend/src/pages/WorkBoard/__tests__/BoardColumn.test.tsx`
- **Commit:** `e2611906`

## Authentication Gates

None.

## Spec-Bug Carryover

To be filled by host operator after Task 3 runs the 8 Phase 39 specs against the migrated build. If any spec failure cannot be classified as (a) migration-induced [should flip green by migration] or (b) structural [should be folded into Task 2 scope], the operator documents it here as a (c) spec-bug carryover for Phase 58 follow-up. Plan close-out is NOT blocked by (c) classifications per D-57-10.

## Deferred to Host-Side (Task 3 — checkpoint:human-verify)

Per the plan's `<task type="checkpoint:human-verify" gate="blocking">` for Task 3, the visual baseline regeneration runs on the canonical macOS chromium host AFTER the Task 2 commits land on `main`. The operator runs:

1. **Confirm branch state:** Phase 57 working branch with Task 1 + Task 2a + Task 2b + Task 2c commits landed (commits `6e4e6aca`, `4dd97782`, `72e47c9a`, `e2611906`).
2. **Regenerate baselines:**
   ```bash
   cd frontend && pnpm exec playwright test tests/e2e/kanban-visual.spec.ts \
     --project=chromium --update-snapshots --reporter=list \
     2>&1 | tee /tmp/57-baseline-regen.log
   ```
3. **Confirm 4 PNG modifications:**
   ```bash
   git status frontend/tests/e2e/kanban-visual.spec.ts-snapshots/
   # Expected: kanban-{ltr,rtl}-{1280,768}-chromium-darwin.png modified
   ```
4. **Stability replay 3×:**
   ```bash
   for i in 1 2 3; do
     pnpm exec playwright test tests/e2e/kanban-visual.spec.ts \
       --project=chromium --reporter=list 2>&1 | tail -10
   done
   # Each iteration MUST exit 0.
   ```
5. **Plan 57-03 byte-distinction meta-test:**
   ```bash
   pnpm --filter ./frontend exec vitest run \
     tests/security/baseline-byte-distinction.test.ts
   # MUST exit 0 — asserts md5(kanban-ltr-1280) != md5(kanban-rtl-1280) and the 768 pair.
   ```
6. **Visual inspection:** confirm 4 columns visible (todo, in_progress, review, done), no cancelled column, KCard styling (border-inline-start danger for overdue, opacity 0.55 for done) preserved, LTR reads left-to-right and RTL reads right-to-left with Tajawal applied.
7. **Atomic commit (operator):**
   ```bash
   git add frontend/tests/e2e/kanban-visual.spec.ts-snapshots/kanban-{ltr,rtl}-{1280,768}-chromium-darwin.png
   git commit -m "chore(57-02): regenerate /kanban visual baselines for shared primitive migration (D-21)"
   ```

Also pending host-operator post-merge:

- **Workspace gate** (Task 2 Step 7 in PLAN.md): operator runs from project root with `node_modules` installed:
  ```bash
  pnpm --filter ./frontend typecheck   # MUST exit 0
  pnpm --filter ./frontend lint        # MUST exit 0 (new @dnd-kit/core ban active)
  pnpm --filter ./frontend exec vitest run src/pages/WorkBoard src/components/kanban
                                       # MUST exit 0 (updated mocks + new meta-test)
  cd frontend && pnpm exec playwright test \
    tests/e2e/kanban-a11y.spec.ts tests/e2e/kanban-dnd.spec.ts \
    tests/e2e/kanban-filters.spec.ts tests/e2e/kanban-render.spec.ts \
    tests/e2e/kanban-responsive.spec.ts tests/e2e/kanban-rtl.spec.ts \
    tests/e2e/kanban-search.spec.ts tests/e2e/kanban-visual.spec.ts \
    --project=chromium --reporter=list
  # The 8 Phase 39 kanban-*.spec.ts files MUST exit 0 (excluding any spec-bug
  # classifications carried over from Task 1 — those become rows in
  # §"Spec-Bug Carryover" above).
  ```

If any workspace-gate step fails, the operator captures the exact failure mode in §"Spec-Bug Carryover" above and reports back to the orchestrator before declaring Plan 57-02 complete.

## Deferred Items

Tracked for future phases — these would expand the @dnd-kit/core ban beyond Plan 57-02's scope:

- **`frontend/src/types/dashboard-widget.types.ts`** — imports `UniqueIdentifier` type only; could be inlined as `type UniqueIdentifier = string | number` to remove the runtime dependency entirely. Trivial cleanup, ~5 LoC. Owner: TBD (suggest Phase 58 quick-task).
- **`frontend/src/components/report-builder/{FieldList,ColumnBuilder,GroupingBuilder,ReportBuilder}.tsx`** — drag-and-drop for report field reordering. NOT a kanban use case; either migrate to shared primitive with a non-column-based render-prop, OR refactor to a generic dnd-kit wrapper component under `frontend/src/components/dnd/`. Significant scope. Owner: TBD.
- **`frontend/src/components/dashboard-widgets/{WidgetContainer,WidgetGrid}.tsx`** — drag-and-drop for dashboard widget grid. Same architecture question as report-builder. Owner: TBD.
- **`frontend/src/components/briefing-books/BriefingBookBuilder.tsx`** — drag-and-drop for briefing-section reorder. Same question. Owner: TBD.

A follow-up planning conversation should decide whether the shared primitive grows a non-kanban dnd surface OR whether each non-kanban consumer gets its own internal dnd wrapper that re-exports `@dnd-kit/core` with the carve-out scoped tighter.

## Threat Model verification

Per the plan's `<threat_model>`:

- **T-57-02-01 (Tampering / mitigate):** `handleDragEnd` signature unchanged: `(event: DragEndEvent) => void`. Payload to `useUnifiedKanbanStatusUpdate.mutate` still has `itemId`, `source`, `newStatus`, `newWorkflowStage` keys. **WorkBoard.test.tsx** asserts this via the `lastKanbanProviderProps.onDragEnd!(...)` invocation → `mutateMock.mock.calls[0]?.[0]` shape check. **Mitigated.**
- **T-57-02-02 (Information Disclosure / accept):** board.css is untouched. D-05 design-token rule at `error` would have fired on any raw-hex regression; the husky pre-commit ran ESLint on the changed `*.tsx` files and exited clean. **Risk accepted as documented.**
- **T-57-02-03 (Denial of Service / mitigate):** The ESLint ban is scoped to `frontend/src/pages/**` + `frontend/src/components/**` (via the frontend block's `files` filter). Carve-outs exclude `frontend/src/components/kanban/**` + 4 non-kanban consumer paths. False-positives on unrelated PRs require importing @dnd-kit/core into a NEW location not on the carve-out list — which would be the correct rule-fire under the plan's intent. **Mitigated.**
- **T-57-02-04 (Spoofing / mitigate):** `tools/eslint-fixtures/bad-direct-dndkit-import.tsx` lives outside `frontend/src` with `export {}`. ESLint fixture-scoped block at `eslint.config.mjs:341-355` re-applies the ban so the bad fixture fires the rule on demand. **Mitigated.**

## Self-Check: PASSED

Worktree-side verification (filesystem + git):

```
[FOUND] frontend/src/pages/WorkBoard/WorkBoard.tsx (no direct @dnd-kit/* imports)
[FOUND] frontend/src/pages/WorkBoard/BoardColumn.tsx (no direct @dnd-kit/* imports)
[FOUND] tools/eslint-fixtures/bad-direct-dndkit-import.tsx
[FOUND] frontend/src/components/kanban/__tests__/eslint-ban-dndkit.test.ts
[FOUND] .planning/phases/57-phase-52-deviation-closure-d-19-d-23/57-PRE-MIGRATION-FAILURES.md
[FOUND] eslint.config.mjs (new @dnd-kit/core pattern entry + carve-out + fixture rule)
[FOUND] commit 6e4e6aca (docs(57-02): scaffold pre-migration triage report)
[FOUND] commit 4dd97782 (feat(57-02): ban direct @dnd-kit/core imports)
[FOUND] commit 72e47c9a (feat(57-02): migrate WorkBoard to shared primitive)
[FOUND] commit e2611906 (test(57-02): update WorkBoard/BoardColumn mocks)
```

Host-side workspace-gate verification + visual baseline regen are deferred to the host operator and reported back via the orchestrator after Task 3 closes.
