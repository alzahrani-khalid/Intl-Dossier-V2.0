---
phase: 81-visible-bugs
plan: 01
subsystem: ui
tags: [css, kanban, rtl, flexbox, responsive, design-tokens, work-board]

# Dependency graph
requires:
  - phase: 77-linear-design-migration
    provides: Linear token engine (--line-strong, --radius-sm) consumed by the scrollbar affordance
provides:
  - Flexible kanban column sizing so all four workflow columns fit the ~1096px content width at 1400px
  - Token-driven, logical inline-axis scroll affordance on .board-columns for narrower widths (1024)
affects: [work-board, kanban, visible-bugs, BUG-01]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Multi-column fit: flex: 1 1 <basis> + a min-width floor (grow to fill, scroll below the floor) instead of fixed widths'
    - 'Discoverable overflow: scrollbar-width/scrollbar-color + ::-webkit-scrollbar rules using --line-strong / --radius-sm tokens'

key-files:
  created:
    - .planning/phases/81-visible-bugs/81-01-SUMMARY.md
  modified:
    - frontend/src/pages/WorkBoard/board.css

key-decisions:
  - 'min-width: 260px chosen as the largest floor where 4 cols + 3×12px gaps (1076px) fit the ~1090px content available at 1400px with the 256px sidebar'
  - 'Kept overflow-x: auto as the logical inline-axis scroll (horizontal writing mode) — no physical left/right anchoring, so RTL scrolls to Done on the left and LTR to Done on the right'
  - 'Re-asserted flex: 0 0 auto in the ≤640px block so the mobile snap width (min(300px, 100vw-28px)) survives the new grow rule'

patterns-established:
  - 'Column-grid fit via flexible basis + min-width floor over rigid px widths'
  - 'Always-visible token-styled webkit scrollbar as an overflow affordance'

requirements-completed: [BUG-01]

# Metrics
duration: ~25min
completed: 2026-07-04
---

# Phase 81 Plan 01: Kanban 4-Column Overflow (BUG-01) Summary

**Replaced the rigid 300px kanban column width with a flexible `flex: 1 1 250px` / `min-width: 260px` basis so all four workflow columns (To Do / In Progress / Review / Done, incl. مكتمل) fit unclipped at 1400px, plus a token-styled logical inline-scroll affordance that makes Done reachable at 1024px in both LTR and RTL.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-07-04T~11:55Z
- **Completed:** 2026-07-04T12:20Z
- **Tasks:** 2 (1 code, 1 verification)
- **Files modified:** 1

## Accomplishments

- Four columns now fit the ~1096px content width at 1400px with zero horizontal scroll — measured 265px each, `overflowsX:false`, Done fully inside (both LTR and RTL/مكتمل).
- At 1024px the board overflows (720 → 1076) and scrolls to reach Done — right edge in LTR, left edge in RTL — with a visible scrollbar affordance styled from `--line-strong` / `--radius-sm`.
- Empty columns still render header + mono `0` count + "No items"/"لا توجد عناصر" (BoardColumn markup untouched).
- Priority accent bar (`.kcard.overdue`) and column-header composition unchanged — F16/F21 stay deferred.

## Task Commits

1. **Task 1: Flexible columns + inline-scroll affordance** - `2bea8cd0` (fix)
2. **Task 2: Live visual verification (1400/1024, LTR/RTL)** - no code change; verification only (42/42 WorkBoard tests pass; browser evidence captured)

**Plan metadata:** committed with this SUMMARY (docs).

## Files Created/Modified

- `frontend/src/pages/WorkBoard/board.css` - `.col` rigid 300px width → `flex: 1 1 250px` + `min-width: 260px`; `.board-columns` gains `scrollbar-width`/`scrollbar-color` + `::-webkit-scrollbar` rules (token-only); `@media (max-width: 640px)` `.col` re-asserts `flex: 0 0 auto` to preserve mobile snap width.

## Decisions Made

- **min-width 260px:** the largest floor at which 4×260 + 3×12 = 1076px fits the ~1090px content budget at 1400px (256px sidebar). Columns grow to fill (265px measured), so no wasted space and no forced scroll at the analyst width.
- **overflow-x kept as the logical inline scroll:** in horizontal writing mode `overflow-x: auto` is the inline axis and flips correctly under `dir=rtl` — no `left:`/`right:` rule introduced.
- **Dark canonical verified for all four combinations;** light mode is layout-identical (the fix is geometric, not color), so it was not separately re-shot.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `vitest --reporter=basic` fails to load (the `basic` reporter was removed in vitest 4) — re-ran with the default reporter: 4 files / 42 tests pass.
- `browser-harness` attached to the user's live Chrome (an Apple-account tab); opened the app in a **new tab** instead of navigating their tab, and cleared the device-metrics override afterward so their session/viewport stayed intact.

## Verification Evidence

Measured via CDP + captured screenshots (scratchpad `shots/`):

| Width | Dir | boardClient | boardScroll | overflowsX | Done reachable    | empty col count     |
| ----- | --- | ----------- | ----------- | ---------- | ----------------- | ------------------- |
| 1400  | LTR | 1096        | 1096        | false      | yes (inline)      | 0 / "No items"      |
| 1400  | RTL | 1096        | 1096        | false      | yes (مكتمل, left) | ٠ / "لا توجد عناصر" |
| 1024  | LTR | 720         | 1076        | true       | yes (scroll →)    | 0 / "No items"      |
| 1024  | RTL | 720         | 1076        | true       | yes (scroll ←)    | ٠ / "لا توجد عناصر" |

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- BUG-01 closed. Remaining phase-81 bugs (BUG-02 settings duplicate header, BUG-03 calendar duplicate button, BUG-04 raw enum pills, BUG-05 KPI wrap) are independent plans.
- Carve-outs (D-81-06: list-pages.css, design-system/tokens, index.css :root, public/bootstrap.js) left byte-untouched.

## Self-Check: PASSED

- FOUND: `.planning/phases/81-visible-bugs/81-01-SUMMARY.md`
- FOUND: task commit `2bea8cd0` (board.css)
- FOUND: `frontend/src/pages/WorkBoard/board.css` on disk

---

_Phase: 81-visible-bugs_
_Completed: 2026-07-04_
