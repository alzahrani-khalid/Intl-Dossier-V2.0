---
quick_id: 260516-rcm
slug: fix-phase-51-deviation-5-carryover-updat
description: Fix Phase 51 Deviation #5 carryover — update SLAIndicator.test.tsx + TaskCard.test.tsx assertions from bg-{amber,red,green,blue,yellow,gray}-100 to bg-{warning,danger,success,info,muted} token utilities
created: 2026-05-16
linked_audit: .planning/v6.3-MILESTONE-AUDIT.md (TEST-02 blocker)
scope:
  - frontend/tests/component/SLAIndicator.test.tsx (6 lines)
  - frontend/tests/component/TaskCard.test.tsx (3 lines)
---

# Quick Task: Close TEST-02 (Phase 51 Deviation #5)

## Problem

`pnpm vitest --run tests/component/{SLAIndicator,TaskCard}.test.tsx` produces 9 failures on DesignV2 HEAD:

- `SLAIndicator.test.tsx` — 6 fails (Color Coding describe block): `bg-green-100`, `bg-amber-100`, `bg-yellow-100`, `bg-red-100`, `bg-blue-100`, `bg-gray-100`
- `TaskCard.test.tsx` — 3 fails (SLA Indicator Integration describe block): `bg-green-100`, `bg-amber-100`, `bg-red-100`

The components emit token utilities post-Phase 51 (`SLAIndicator.tsx` swapped under Plan 51-03 sweep). The tests still assert the pre-Phase-51 palette literals. Phase 51 Deviation #5 explicitly deferred this with user approval; Phase 52 SUMMARY did not close it.

This blocks v6.3 milestone archive (TEST-02 unsatisfied per `.planning/v6.3-MILESTONE-AUDIT.md`).

## Fix

9 mechanical line edits — replace pre-Phase-51 palette-literal assertion strings with the actual token-utility class names emitted by the components.

| File                                    | Line | Before            | After             |
| --------------------------------------- | ---- | ----------------- | ----------------- |
| `tests/component/SLAIndicator.test.tsx` | 52   | `'bg-green-100'`  | `'bg-success/10'` |
| `tests/component/SLAIndicator.test.tsx` | 61   | `'bg-amber-100'`  | `'bg-warning/10'` |
| `tests/component/SLAIndicator.test.tsx` | 70   | `'bg-yellow-100'` | `'bg-warning/10'` |
| `tests/component/SLAIndicator.test.tsx` | 79   | `'bg-red-100'`    | `'bg-danger/10'`  |
| `tests/component/SLAIndicator.test.tsx` | 94   | `'bg-blue-100'`   | `'bg-info/10'`    |
| `tests/component/SLAIndicator.test.tsx` | 109  | `'bg-gray-100'`   | `'bg-muted'`      |
| `tests/component/TaskCard.test.tsx`     | 117  | `'bg-green-100'`  | `'bg-success/10'` |
| `tests/component/TaskCard.test.tsx`     | 127  | `'bg-amber-100'`  | `'bg-warning/10'` |
| `tests/component/TaskCard.test.tsx`     | 137  | `'bg-red-100'`    | `'bg-danger/10'`  |

Token mapping derived from live `Received:` output of failing tests:

- `bg-success/10 text-success` (was `bg-green-100`)
- `bg-warning/10 text-warning` (was `bg-amber-100` AND `bg-yellow-100` — both "warning" semantic)
- `bg-danger/10 text-danger` (was `bg-red-100`)
- `bg-info/10 text-info` (was `bg-blue-100`)
- `bg-muted text-foreground` (was `bg-gray-100`)

## Verification

```bash
pnpm vitest --run tests/component/SLAIndicator.test.tsx tests/component/TaskCard.test.tsx
```

Expect: 2 test files passed, 46 tests passed, 0 failed.

## Out of scope

- TaskCard.tsx + SLAIndicator.tsx source code (already swapped under Phase 51 Plan 51-03 `9d919ecb`)
- Other Phase 51 Tier-C palette literals (271 files, 2245 disable lines, deferred to `TBD-design-token-tier-c-cleanup-wave-N`)
- `bad-design-token.tsx` positive-failure CI check (tracked separately)
