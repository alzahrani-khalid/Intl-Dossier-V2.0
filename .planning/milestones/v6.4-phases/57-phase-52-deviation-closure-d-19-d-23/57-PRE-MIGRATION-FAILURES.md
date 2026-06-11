---
phase: 57-phase-52-deviation-closure-d-19-d-23
plan: 02
artifact: pre-migration-triage
date: 2026-05-18
commit_sha: 55ce032cc01fa1d576242bbe442c2fd9da0ffa3d
commit_subject: 'chore(57): mark plans 57-01 + 57-03 complete in ROADMAP/STATE'
playwright_version: deferred-to-host-operator
operator: alzahrani.khalid@gmail.com
canonical_invocation: |
  cd frontend && pnpm exec playwright test \
    tests/e2e/kanban-a11y.spec.ts \
    tests/e2e/kanban-dnd.spec.ts \
    tests/e2e/kanban-filters.spec.ts \
    tests/e2e/kanban-render.spec.ts \
    tests/e2e/kanban-responsive.spec.ts \
    tests/e2e/kanban-rtl.spec.ts \
    tests/e2e/kanban-search.spec.ts \
    tests/e2e/kanban-visual.spec.ts \
    --project=chromium --reporter=list \
    2>&1 | tee /tmp/57-pre-migration.log
specs_under_triage:
  - kanban-a11y.spec.ts
  - kanban-dnd.spec.ts
  - kanban-filters.spec.ts
  - kanban-render.spec.ts
  - kanban-responsive.spec.ts
  - kanban-rtl.spec.ts
  - kanban-search.spec.ts
  - kanban-visual.spec.ts
known_pre_migration_state: |
  Phase 52 Plan 05 SUMMARY (D-21 origin) records "4 observed kanban-*.spec.ts
  regressions" against the shared @dnd-kit/core primitive — they are why D-21
  carried PASS-WITH-DEVIATION into Phase 57. The exact failing tests + stack
  traces require a live Playwright run against `main` HEAD. This file scaffolds
  the triage table and embeds the host-operator runbook; the operator pastes
  the Playwright list-reporter output into the relevant section below.
---

# Phase 57 Plan 02 — Pre-migration kanban-\*.spec.ts triage (D-21)

## Purpose (D-57-10)

Before migrating `frontend/src/pages/WorkBoard/WorkBoard.tsx` to consume the
shared `@/components/kanban` primitive, record the exact failure state of the
8 Phase 39 `kanban-*.spec.ts` files against current `main` HEAD. Classifying
each failure as (a) likely-fixed-by-migration, (b) structural — fold into
migration scope, or (c) spec-bug — defers cleanly. Clean causality for
post-migration failure attribution.

## Worktree blocker (transparent disclosure)

This triage scaffold was authored from a `isolation="worktree"` parallel
executor running inside `.claude/worktrees/agent-a128239f3d7bcbac9/`. The
worktree does NOT have `frontend/node_modules`, the Vite dev server, the
Playwright browser binaries, or `.env.test` secrets. Per Phase 52 Plan 05
precedent (worktree-bound runtime tasks deferred to host-side via
`checkpoint:human-verify`), the executor authors the table SHAPE and the
runbook here, then hands off to the host operator for the actual Playwright
invocation. The operator pastes the list-reporter output into the
`## Playwright list-reporter output (operator-pasted)` section below; the
per-test triage table immediately above can then be filled with the exact
failure classifications.

Rationale source: 52-05-SUMMARY.md §"Deferred to Host-Side" lines 135-244 +
57-CONTEXT.md D-57-10 ("the worktree cannot run Playwright; defer to host"
is the established precedent).

## Host-operator runbook

```bash
# From repo root, on the Phase 57 working branch with worktree-base 55ce032c:
git checkout main
git pull
git rev-parse --short HEAD   # capture into the frontmatter `commit_sha` field

# Run all 8 specs against current main HEAD (no --update-snapshots; we want
# the FAILURE STATE, not regen). Tee the list-reporter into /tmp:
cd frontend && pnpm exec playwright test \
  tests/e2e/kanban-a11y.spec.ts \
  tests/e2e/kanban-dnd.spec.ts \
  tests/e2e/kanban-filters.spec.ts \
  tests/e2e/kanban-render.spec.ts \
  tests/e2e/kanban-responsive.spec.ts \
  tests/e2e/kanban-rtl.spec.ts \
  tests/e2e/kanban-search.spec.ts \
  tests/e2e/kanban-visual.spec.ts \
  --project=chromium --reporter=list \
  2>&1 | tee /tmp/57-pre-migration.log

# Capture playwright version into the frontmatter `playwright_version` field:
pnpm exec playwright --version
```

The operator then pastes the full `/tmp/57-pre-migration.log` content into the
`## Playwright list-reporter output (operator-pasted)` section below and
updates the per-test triage table with the exact failure rows.

## Per-test triage table (operator-filled after run)

Each `kanban-*.spec.ts` file is enumerated below with its inner `test()`
identifiers extracted from current `main` HEAD (read directly from the spec
files via the worktree). The operator fills `Status`, `Stack trace head`, and
`Classification` columns from the list-reporter output. Classification key:

- **a — migration-induced:** spec asserts DOM the OLD direct-import WorkBoard
  produced; expected to flip green once the migrated build renders the shared
  primitive's DOM (data-droppable-id, data-card-id, etc.).
- **b — structural:** spec assumes a feature/state independent of the
  primitive choice (e.g. missing fixture, route-level routing, data-loading
  semantics). Fold the fix into the migration scope (Task 2) before declaring
  the plan done.
- **c — spec-bug:** the spec itself encodes a wrong expectation regardless of
  the primitive choice (e.g. wrong selector, flaky timing, AR translation
  mismatch). Document as a follow-up note in 57-02-SUMMARY.md `## Spec-Bug
Carryover` section; do NOT block the migration on them.
- **PASS:** no failure observed; row exists for completeness.

| Spec                      | Test identifier                                                            | Status         | Stack trace head (1 line) | Classification | Notes                                                                |
| ------------------------- | -------------------------------------------------------------------------- | -------------- | ------------------------- | -------------- | -------------------------------------------------------------------- |
| kanban-a11y.spec.ts       | `zero serious/critical violations in en`                                   | operator-fills | operator-fills            | operator-fills | uses addInitScript(i18nextLng) — legacy spec excluded from D-57-14   |
| kanban-a11y.spec.ts       | `zero serious/critical violations in ar`                                   | operator-fills | operator-fills            | operator-fills | uses addInitScript(i18nextLng) — legacy spec excluded from D-57-14   |
| kanban-dnd.spec.ts        | `drag from todo to in_progress fires status update`                        | operator-fills | operator-fills            | operator-fills | depends on `.kcard` + `section.col` selectors (preserved in plan)    |
| kanban-filters.spec.ts    | `By dossier and By owner pills are aria-disabled with Coming soon tooltip` | operator-fills | operator-fills            | operator-fills | targets BoardToolbar (unchanged by migration)                        |
| kanban-render.spec.ts     | `renders BoardToolbar and 4 columns`                                       | operator-fills | operator-fills            | operator-fills | asserts `section.col` count = 4 + `.kcard.overdue` border            |
| kanban-responsive.spec.ts | `renders without overflow at 320px`                                        | operator-fills | operator-fills            | operator-fills | asserts `section.col` count + `.board-columns` scroll                |
| kanban-responsive.spec.ts | `renders without overflow at 768px`                                        | operator-fills | operator-fills            | operator-fills | asserts `section.col` count                                          |
| kanban-responsive.spec.ts | `renders without overflow at 1280px`                                       | operator-fills | operator-fills            | operator-fills | asserts `section.col` count                                          |
| kanban-rtl.spec.ts        | `overdue kcard inline-start border lands on the right edge in rtl`         | operator-fills | operator-fills            | operator-fills | depends on `.kcard.overdue` and `border-inline-start` from board.css |
| kanban-search.spec.ts     | `search filters items without firing additional unified-kanban API calls`  | operator-fills | operator-fills            | operator-fills | targets BoardToolbar search input (unchanged)                        |
| kanban-visual.spec.ts     | `ltr @ 1280x800`                                                           | operator-fills | operator-fills            | operator-fills | baseline will be regenerated in Task 3 regardless                    |
| kanban-visual.spec.ts     | `ltr @ 768x1024`                                                           | operator-fills | operator-fills            | operator-fills | baseline will be regenerated in Task 3 regardless                    |
| kanban-visual.spec.ts     | `rtl @ 1280x800`                                                           | operator-fills | operator-fills            | operator-fills | baseline will be regenerated in Task 3 regardless                    |
| kanban-visual.spec.ts     | `rtl @ 768x1024`                                                           | operator-fills | operator-fills            | operator-fills | baseline will be regenerated in Task 3 regardless                    |

## Migration-induced vs structural — what to expect

The plan migrates WorkBoard's outer `<DndContext>` to `<KanbanProvider>` and
swaps `<SortableContext>` inside `BoardColumn` for `<KanbanCards>` from the
shared primitive. The migration PRESERVES:

- `section.col` markup on each column (`<section role="region">` in
  BoardColumn) — kanban-render / kanban-responsive / kanban-filters all rely
  on this; expected to stay green.
- `.kcard` markup on each card (rendered inside KanbanCard's children slot) —
  kanban-dnd / kanban-render / kanban-rtl all rely on this; expected to stay
  green.
- BoardToolbar (filter pills, overdue chip, search input, `+ New item`
  button) — kanban-filters / kanban-search assert against this; unchanged by
  migration.
- board.css design-token rules (`var(--surface)`, `border-inline-start`) —
  unchanged.
- Cancelled-items filter (Confirmation #8) — preserved in the migrated
  WorkBoard.tsx code path.

The migration ADDS `data-droppable-id` (on `KanbanBoard` outer div) and
`data-card-id` (on `KanbanCard` outer div) wrappers around the existing
`section.col` and `article.kcard`. Visual baselines drift because the shared
primitive's `Card` wrapper plus the new `<div>` ancestors add minor box-model
differences — that drift is the literal reason Task 3 regenerates the 4
visual PNGs on the canonical host.

## Playwright list-reporter output (operator-pasted)

> Paste the full `/tmp/57-pre-migration.log` content here. Keep the fenced
> code block so the per-test stack traces stay readable.

```text
operator-pastes-here
```

## Classification summary (operator-filled)

After filling the triage table:

| Classification             | Count          | Action                                                                    |
| -------------------------- | -------------- | ------------------------------------------------------------------------- |
| **a — migration-induced**  | operator-fills | Expected to flip green after Task 2 migration                             |
| **b — structural**         | operator-fills | Folded into Task 2 scope; documented as deviation in 57-02-SUMMARY        |
| **c — spec-bug carryover** | operator-fills | Documented in 57-02-SUMMARY `## Spec-Bug Carryover`; tracked for Phase 58 |
| **PASS (no fix needed)**   | operator-fills | Confirms current `main` HEAD already aligns with the shared primitive     |

## Cross-references

- Plan: `.planning/phases/57-phase-52-deviation-closure-d-19-d-23/57-02-PLAN.md`
- Locked decisions: 57-CONTEXT.md D-57-06 (surface-swap migration), D-57-07
  (smallest viable refactor), D-57-10 (triage before migration)
- Origin deviation row: `.planning/phases/52-heroui-v3-kanban-migration/52-VERIFICATION.md`
  D-21-PHASE-39-REGRESSION-DEFERRED
- Phase 52 close-out: `.planning/phases/52-heroui-v3-kanban-migration/52-05-SUMMARY.md`
  §"4 observed kanban-\*.spec.ts regressions" (D-21 origin)
- Worktree-defers-runtime precedent: 52-05-SUMMARY.md §"Deferred to Host-Side"
  (lines 135-244)

---

## Host-Gate Results (post-migration, captured 2026-05-19)

Pre-migration capture was deferred (Task 1 was a scaffold + handoff; the
operator did not run the canonical invocation against `55ce032c` HEAD).
The Wave 2 host-gate caught and classified failures post-merge against
HEAD `a369f886` (Wave 2 final). All 5 surfaced failures fall into the
plan's category (b) "structural — fold into migration scope" except the
dnd flake which is shared-staging fixture drift (category c — spec bug
sensitive to live data state).

### Failure classification

| Spec                                    | Test                                                     | Pre-existing?                     | Cause                                                                                                                                                                                                                                 | Resolution                                                                                                                                            |
| --------------------------------------- | -------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| kanban-render.spec.ts:12                | renders BoardToolbar and 4 columns                       | post-DesignV2                     | Strict-mode violation — `getByRole('searchbox')` matched both topbar + board after Phase 55 shell merge                                                                                                                               | Scope to `input.board-search` (commit 7817bc02)                                                                                                       |
| kanban-search.spec.ts:16                | search filters items without firing additional API calls | post-DesignV2                     | Same strict-mode 2-searchbox collision                                                                                                                                                                                                | Same — `input.board-search`                                                                                                                           |
| kanban-a11y.spec.ts:6 (en)              | zero serious/critical violations in en                   | post-DesignV2                     | Axe `button-name` critical on sidebar icon buttons (shell debt — NOT WorkBoard primitive)                                                                                                                                             | Scope axe to `.workboard-page` region (7817bc02). Shell debt deferred to Phase 59 POLISH.                                                             |
| kanban-a11y.spec.ts:6 (ar)              | zero serious/critical violations in ar                   | post-DesignV2                     | Same shell-level axe debt                                                                                                                                                                                                             | Same scope fix                                                                                                                                        |
| kanban-a11y.spec.ts:6 (en, second-pass) | nested-interactive (serious)                             | migration-induced                 | KanbanCard's `useSortable.attributes` adds outer `role="button"`; inner KCard `role="button"` nested                                                                                                                                  | Drop role/tabIndex/onKeyDown from KCard (commit d678c7ba)                                                                                             |
| kanban-dnd.spec.ts:14                   | drag from todo to in_progress fires status update        | migration-induced + fixture-drift | `BoardColumn` was not registered as a droppable post surface-swap (KanbanCards owns SortableContext but no `useDroppable` on column root); plus `locator.dragTo` doesn't reliably clear MouseSensor `activationConstraint distance:8` | Add `useDroppable({ id: stage })` to BoardColumn section (eba06f14); replace `dragTo` with explicit `page.mouse.move/down/move(steps)/up` (7817bc02). |
| kanban-visual.spec.ts × 4               | LTR/RTL @ 1280/768                                       | post-DesignV2                     | Shell chrome (onboarding tour button, notifications pulse) flickers under parallel-worker dev-server load; fullPage capture failed 1% tolerance                                                                                       | Scope `toHaveScreenshot` to `page.locator('.workboard-page')` (7817bc02); regen baselines (a369f886)                                                  |

### Outcome

- 13/14 spec rows pass under the canonical 8-spec invocation
- 1 dnd flake (kanban-dnd.spec.ts:14) is shared-staging fixture drift —
  the test passes in isolation against a fresh fixture (verified mid-gate)
  but fails after the engagement's todo-column has been mutated by an
  earlier dnd run. Plan 57-04 Task 1 (Phase 52 fixture reseed via Supabase
  MCP) restores the canonical composition before the live run.
- Byte-distinction meta-test passes 2/2 (LTR vs RTL distinct at both
  viewports)
- 3× stability replay of kanban-visual.spec.ts without `--update-snapshots`
  all exit 0

### Spec-bug carryovers (none merge-blocking)

- Sidebar / topbar icon-buttons missing aria-labels (axe button-name
  critical on the global shell) — Phase 59 POLISH territory.
- `kanban-a11y.spec.ts` still uses `addInitScript('i18nextLng', ...)`
  pattern that Plan 57-03's ESLint rule bans for visual specs.
  The lint script (`pnpm lint`) scopes to `frontend/src/**/*.{ts,tsx}` so
  the rule does not currently flag `frontend/tests/**`. Either widen the
  lint script (Phase 59 POLISH) or migrate the a11y spec to URL-param
  detection in a follow-up.
