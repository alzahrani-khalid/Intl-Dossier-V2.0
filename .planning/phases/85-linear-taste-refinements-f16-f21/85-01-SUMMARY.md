---
phase: 85-linear-taste-refinements-f16-f21
plan: 01
subsystem: ui
tags: [kanban, workboard, css, svg, rtl, linear-design]

# Dependency graph
requires:
  - phase: 77-linear-migration
    provides: Linear token ladder (--danger, --warn, --ok, --ink-faint) + logical-property CSS conventions
provides:
  - F16/TASTE-01 — kanban overdue reframed from the 3px inline-start edge bar onto a red semibold mono due chip
  - F21/TASTE-06 — stage status glyphs (todo/in_progress/review/done) rendered before each column name
  - Updated kanban-render/kanban-rtl e2e specs asserting the new overdue contract
affects: [phase-85 remaining plans, workboard, kanban, orchestrator-consolidated-render-signoff]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Overdue state carried on the due-chip text (.kdue.is-overdue) instead of a card edge accent'
    - 'Stage-keyed decorative inline-SVG glyph map (Record<WorkflowStage, ReactElement>), aria-hidden, tokens-only'

key-files:
  created: []
  modified:
    - frontend/src/pages/WorkBoard/board.css
    - frontend/src/pages/WorkBoard/KCard.tsx
    - frontend/src/pages/WorkBoard/BoardColumn.tsx
    - frontend/tests/e2e/kanban-render.spec.ts
    - frontend/tests/e2e/kanban-rtl.spec.ts

key-decisions:
  - 'Kept the .kcard.overdue class on the article (Playwright + KCard.test.tsx depend on it); only the CSS border declaration was removed (D-85-07 carve-out)'
  - 'STAGE_GLYPHS written as a full Record<WorkflowStage,ReactElement> with literal aria-hidden="true" on each SVG (not a spread), so the glyphs are greppable and the type stays total; cancelled reuses the todo ring since the board filters it out'
  - 'Optional F16 priority-bars glyph DEFERRED — CONTEXT marked it optional and delegated ship/defer; the red due chip alone carries overdue, priority already renders as the High/Medium chip'

patterns-established:
  - 'Modifier-on-base CSS for card state: .kcard-foot .kdue.is-overdue mirrors index.css .task-due.today/.high'
  - 'Decorative column-header glyph technique borrowed from signature-visuals/Donut.tsx (plain circle/path, strokeDasharray, no motion lib)'

requirements-completed: [TASTE-01, TASTE-06]

# Metrics
duration: 6min
completed: 2026-07-05
---

# Phase 85 Plan 01: Kanban overdue reframing + column status glyphs Summary

**F16 moves kanban overdue off the wall-of-red 3px edge bar onto a red semibold mono due chip, and F21 adds token-colored stage status glyphs (empty ring / amber dot / dashed ring / green check) before each WorkBoard column name.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-07-05T07:53:12Z
- **Completed:** 2026-07-05T07:59:33Z
- **Tasks:** 2 of 3 executed (Task 3 is an orchestrator-owned human checkpoint — see below)
- **Files modified:** 5

## Accomplishments

- Removed the `.kcard.overdue { border-inline-start: 3px solid var(--danger) }` rule so an all-overdue board no longer reads as a wall of red edge bars.
- Overdue is now carried on the due-date text: `.kcard-foot .kdue.is-overdue { color: var(--danger); font-weight: 600 }`, gated on `item.is_overdue` in KCard.
- Kept the `.kcard.overdue` article class intact (D-85-07) — Playwright selectors and `KCard.test.tsx` still resolve.
- Added four stage status glyphs before each column header, keyed off the existing `stage` prop with no new plumbing: `todo` empty ring, `in_progress` amber dot, `review` dashed ring, `done` green check.
- Rewrote the two coupled e2e specs (`kanban-render`, `kanban-rtl`) from asserting the removed 3px bar to asserting the new contract (1px hairline + red semibold due chip; symmetric borders + chip present under RTL).

## Task Commits

Each task was committed atomically:

1. **Task 1: F16 — overdue edge bar → red due chip (+ 2 coupled e2e specs)** - `d872d12a` (fix)
2. **Task 2: F21 — stage status glyph on BoardColumn header** - `7d73ac39` (fix)
3. **Task 3: Human render-parity sign-off (WorkBoard EN/AR × dark/light)** - NOT executed by this executor — see Deviations.

**Plan metadata:** committed with this SUMMARY (docs: complete plan).

## Files Created/Modified

- `frontend/src/pages/WorkBoard/board.css` - Removed `.kcard.overdue` border rule + updated header comment; added `.kcard-foot .kdue.is-overdue` (red/semibold) and `.col-glyph { flex-shrink: 0 }`.
- `frontend/src/pages/WorkBoard/KCard.tsx` - Due span → `cn('font-mono kdue', item.is_overdue && 'is-overdue')`; updated the stale RTL header comment. Article `overdue` class untouched.
- `frontend/src/pages/WorkBoard/BoardColumn.tsx` - `STAGE_GLYPHS` Record + glyph rendered as the first child of `.col-head` before `<h3>`.
- `frontend/tests/e2e/kanban-render.spec.ts` - BOARD-02 assertion rewritten: 1px inline-start hairline + `span.kdue.is-overdue` with fontWeight 600 and color matching an in-page `var(--danger)` probe.
- `frontend/tests/e2e/kanban-rtl.spec.ts` - Now asserts symmetric left/right borders under `dir=rtl` and that the overdue card's `.kdue.is-overdue` chip renders (logical-property parity without a directional border to check).

## Automated Verification

Reported honestly, all run on the main working tree after the edits:

- `pnpm test --run src/pages/WorkBoard` → **4 files / 42 tests passed** (KCard, BoardColumn, WorkBoard, BoardToolbar) — unit suites unchanged and green.
- `pnpm type-check` (`tsc --noEmit`) → **exit 0**.
- `pnpm build` → **succeeded** (`✓ built in 11.22s`; the >500 kB chunk-size warning is pre-existing and out of scope).
- Acceptance greps all at target: `border-inline-start: 3px` count 0; `.kdue.is-overdue` rule count 1; `aria-hidden="true"` on glyph SVGs count 5; `.col-glyph` count 1; no raw hex / Tailwind color literals introduced; glyph colors resolve only to `var(--ink-faint)` / `var(--warn)` / `var(--ok)`.

Note: the two e2e specs are Playwright specs (not part of the vitest run); they were updated to the new contract and grep-verified but not executed here — they run against the deployed/assembled app in CI, and the WorkBoard render sign-off is the orchestrator's consolidated post-merge step.

## Decisions Made

See frontmatter `key-decisions`. Summary: preserve the `.kcard.overdue` article class (selector contract), write greppable literal-attribute SVGs, defer the optional priority-bars glyph.

## Deviations from Plan

Task 3 (`checkpoint:human-verify`, gate="blocking") was **NOT executed** by this executor. Per the spawn instructions, this executor is a subagent that cannot take interactive user input; the WorkBoard render-parity sign-off (EN/AR × dark/light, 1024/1400) is **deferred to the orchestrator's single consolidated human render sign-off, run post-merge on the assembled running app** across all four Phase-85 plans. No `## CHECKPOINT REACHED` was emitted; this is expected flow, not a blocker.

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Grep-collision on the `.kdue.is-overdue` acceptance criterion**

- **Found during:** Task 1 (board.css edit)
- **Issue:** My new file-header comment named the literal selector `.kdue.is-overdue`, so `grep -c '\.kdue\.is-overdue' board.css` returned 2 instead of the required 1 (the CSS rule count was correct; the comment double-counted).
- **Fix:** Reworded the comment to reference "the is-overdue due rule below" without the literal selector; grep now returns exactly 1.
- **Files modified:** frontend/src/pages/WorkBoard/board.css
- **Verification:** `grep -c '\.kdue\.is-overdue'` → 1.
- **Committed in:** `d872d12a` (Task 1 commit)

Also updated two stale doc comments made inaccurate by the change (KCard.tsx RTL header referencing `border-inline-start on .kcard.overdue`; board.css file header) — cosmetic, in-scope with the edits.

---

**Total deviations:** 1 auto-fixed (1 blocking/grep-collision) + 1 planned deferral (Task 3 → orchestrator) + 1 planned deferral (optional F16 priority-bars glyph).
**Impact on plan:** No scope creep. Both auto tasks landed exactly as specified; the only mechanical fix kept an acceptance grep honest.

## Issues Encountered

None. Prettier (pre-commit) reformatted the glyph SVG attributes onto separate lines after the Task 2 commit — cosmetic, `aria-hidden="true"` literals intact.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- F16 + F21 shipped on WorkBoard; the remaining Phase-85 plans (F17-F20, settings surfaces) are independent (this plan's `depends_on: []`).
- **Pending:** the orchestrator's consolidated WorkBoard render-parity sign-off (Task 3) — visuals are NOT self-certified. Verify: overdue cards show a red "Overdue Nd" chip with no red edge bar; the four column headers show empty ring / amber dot / dashed ring / green check; both light/dark and EN/AR (glyphs at the right edge in RTL, LTR digits in the due chip) at 1024px and 1400px.

## Self-Check: PASSED

- `85-01-SUMMARY.md` exists on disk.
- Task 1 commit `d872d12a` present (board.css, KCard.tsx, kanban-render.spec.ts, kanban-rtl.spec.ts).
- Task 2 commit `7d73ac39` present (BoardColumn.tsx, board.css).

---

_Phase: 85-linear-taste-refinements-f16-f21_
_Completed: 2026-07-05_
