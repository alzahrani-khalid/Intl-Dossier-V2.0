---
quick_id: 260516-rcm
slug: fix-phase-51-deviation-5-carryover-updat
status: complete
description: Fix Phase 51 Deviation #5 carryover — update SLAIndicator.test.tsx + TaskCard.test.tsx assertions from bg-{amber,red,green,blue,yellow,gray}-100 to bg-{warning,danger,success,info,muted} token utilities
date: 2026-05-16
completed: 2026-05-16
linked_audit: .planning/v6.3-MILESTONE-AUDIT.md
closes:
  - Phase 51 Deviation #5
  - v6.3 TEST-02 blocker
files_modified:
  - frontend/tests/component/SLAIndicator.test.tsx (6 lines)
  - frontend/tests/component/TaskCard.test.tsx (3 lines)
---

# Quick Task Summary: Close TEST-02 (Phase 51 Deviation #5)

## What changed

9 mechanical assertion-string replacements across 2 test files. Token-mapping derived from live `Received:` output of failing tests.

| File                                    | Line | Before          | After           |
| --------------------------------------- | ---- | --------------- | --------------- |
| `tests/component/SLAIndicator.test.tsx` | 52   | `bg-green-100`  | `bg-success/10` |
| `tests/component/SLAIndicator.test.tsx` | 61   | `bg-amber-100`  | `bg-warning/10` |
| `tests/component/SLAIndicator.test.tsx` | 70   | `bg-yellow-100` | `bg-warning/10` |
| `tests/component/SLAIndicator.test.tsx` | 79   | `bg-red-100`    | `bg-danger/10`  |
| `tests/component/SLAIndicator.test.tsx` | 94   | `bg-blue-100`   | `bg-info/10`    |
| `tests/component/SLAIndicator.test.tsx` | 109  | `bg-gray-100`   | `bg-muted`      |
| `tests/component/TaskCard.test.tsx`     | 117  | `bg-green-100`  | `bg-success/10` |
| `tests/component/TaskCard.test.tsx`     | 127  | `bg-amber-100`  | `bg-warning/10` |
| `tests/component/TaskCard.test.tsx`     | 137  | `bg-red-100`    | `bg-danger/10`  |

Both `bg-amber-100` AND `bg-yellow-100` collapse to the single `bg-warning/10` token utility because Phase 51 Plan 51-03's sweep converged both into the `warning` semantic — emitted classes confirm: `bg-warning/10 text-warning dark:bg-warning dark:text-warning`.

## Verification

```
$ pnpm vitest --run tests/component/SLAIndicator.test.tsx tests/component/TaskCard.test.tsx

 Test Files  2 passed (2)
      Tests  46 passed (46)
   Duration  1.71s
```

9 previously-failing tests now pass; 37 previously-passing tests remain green. Zero regressions.

## Why this matters

The v6.3 milestone audit (`.planning/v6.3-MILESTONE-AUDIT.md`) flagged TEST-02 as unsatisfied because these 9 test failures contradicted the requirement "4 wizard tests + full FE/BE green". Phase 51 Deviation #5 explicitly deferred this to a "Phase 52-prep cleanup ticket" with user approval; Phase 52 SUMMARY never closed it. This quick task closes that loop.

## What this does NOT do

- Does not touch the 271 Tier-C palette literals in component source (deferred to `TBD-design-token-tier-c-cleanup-wave-N`)
- Does not add a positive-failure CI check for `bad-design-token.tsx` (separate v6.4 carryover)
- Does not address the SLAIndicator/TaskCard component logic — only the test assertions

## Self-Check: PASSED

- [x] 9 assertion lines edited as planned
- [x] All 46 tests in both files pass
- [x] No source-component modifications (test-only change)
- [x] Token names match emitted classes verbatim
- [x] PLAN.md + SUMMARY.md committed alongside test changes
- [x] STATE.md "Quick Tasks Completed" table updated
