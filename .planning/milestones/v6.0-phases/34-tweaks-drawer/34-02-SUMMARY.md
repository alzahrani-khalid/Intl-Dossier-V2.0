---
phase: 34
plan: 02
plan_id: 34-02
subsystem: design-system
tags: [theme, direction-defaults, pure-data, tdd]
requires:
  - frontend/src/design-system/tokens/types.ts
provides:
  - frontend/src/design-system/directionDefaults.ts
  - DIRECTION_DEFAULTS (const record)
  - getDirectionDefaults(dir) (typed accessor)
affects:
  - Plan 34-04 (TweaksDrawer will consume this map on direction-button click)
tech-stack:
  added: []
  patterns:
    - 'as const satisfies Record<K, V> — compile-time type lock + runtime immutability'
    - 'Wave-0 test-scaffold promotion (describe.skip/it.todo → live it())'
key-files:
  created:
    - frontend/src/design-system/directionDefaults.ts
  modified:
    - frontend/src/design-system/directionDefaults.test.ts
key-decisions:
  - 'Bureau hue=32° confirmed per CONTEXT.md §D-16 (NOT 22° — per handoff themes.jsx)'
  - 'Hue type IS exported from tokens/types.ts — no fallback to plain number needed'
  - 'No REFACTOR step — 16-line module already minimal (Karpathy: no speculative code)'
requirements-completed:
  - THEME-03
duration: '3 min'
completed: 2026-04-21
---

# Phase 34 Plan 02: DIRECTION_DEFAULTS Summary

Codified THEME-03 / D-16 direction-defaults map as a pure TypeScript const record + typed accessor (`DIRECTION_DEFAULTS` + `getDirectionDefaults`), the single source of truth that Plan 34-04's TweaksDrawer will call on every direction-button click to perform silent mode+hue reset per direction.

## Metrics

- **Duration:** 3 min (start 22:27 UTC → end ~22:30 UTC, 2026-04-21)
- **Tasks:** 1/1 complete
- **Files:** 1 created, 1 modified
- **Commits:** 2 (RED + GREEN)
- **Tests:** 5 passing, 0 skipped, 0 failing

## Commits

| Phase | Hash       | Message                                               |
| ----- | ---------- | ----------------------------------------------------- |
| RED   | `8b61ae15` | test(34-02): add failing tests for DIRECTION_DEFAULTS |
| GREEN | `419bd9af` | feat(34-02): implement DIRECTION_DEFAULTS per D-16    |

## Files

### Created

- **`frontend/src/design-system/directionDefaults.ts`** (16 lines)
  - Exports `DIRECTION_DEFAULTS` — `as const satisfies Record<Direction, { mode: Mode; hue: Hue }>`
  - Exports `getDirectionDefaults(dir: Direction): { mode: Mode; hue: Hue }`
  - Values per D-16: Chancery=light/22°, Situation=dark/190°, Ministerial=light/158°, Bureau=light/32°
  - Zero DOM/runtime references — pure data module, SSR-safe, test-safe

### Modified

- **`frontend/src/design-system/directionDefaults.test.ts`**
  - Promoted from Wave-0 scaffold (`describe.skip` + 6×`it.todo`) to live suite
  - 5 concrete `it()` blocks covering all 4 direction rows + the accessor helper
  - 1 Wave-0 `it.todo` intentionally dropped: "applying direction defaults writes id.theme + id.hue atomically" — this is out-of-scope for the pure-data module (belongs to Plan 34-04 TweaksDrawer integration)

## Verification Results

### Task 1 Acceptance Criteria (all PASS)

| Criterion                                                                    | Result |
| ---------------------------------------------------------------------------- | ------ |
| `directionDefaults.ts` exports `DIRECTION_DEFAULTS` + `getDirectionDefaults` | PASS ✓ |
| Bureau hue = 32                                                              | PASS ✓ |
| Chancery hue = 22                                                            | PASS ✓ |
| Situation hue = 190                                                          | PASS ✓ |
| Ministerial hue = 158                                                        | PASS ✓ |
| Exactly 4 direction keys (`grep -cE` = 4)                                    | PASS ✓ |
| Vitest exits 0 with 5 passing, 0 skipped                                     | PASS ✓ |
| Type-check: zero errors in plan-owned files                                  | PASS ✓ |
| Zero DOM refs (`document`/`localStorage`/`window`)                           | PASS ✓ |

### Plan-level `<verification>` Commands

```
# 5/5 tests pass
pnpm exec vitest run src/design-system/directionDefaults.test.ts
  → Test Files 1 passed (1), Tests 5 passed (5), Duration 394ms

# 4 direction keys
grep -cE "^\s*(chancery|situation|ministerial|bureau):" directionDefaults.ts
  → 4

# Bureau=32 confirmed
grep "bureau:" directionDefaults.ts | grep "hue: 32"
  → bureau: { mode: 'light' as const, hue: 32 as Hue },
```

## Deviations from Plan

### [Rule 3 - Blocker] Test-runner invocation syntax

- **Found during:** RED verification
- **Issue:** User-prescribed command `pnpm --filter frontend test --run src/design-system/directionDefaults.test.ts` failed — the repo is not a pnpm workspace with a `frontend` filter (no `pnpm-workspace.yaml` at root). The plan's own command `cd frontend && pnpm test -- design-system/directionDefaults --run` did NOT respect the path filter and ran the entire 494-test suite.
- **Fix:** Invoked vitest directly via `cd frontend && pnpm exec vitest run src/design-system/directionDefaults.test.ts`. This is the idiomatic file-scoped invocation and is equivalent semantically.
- **Files modified:** None (invocation only)
- **Verification:** 5/5 tests pass, 0 unrelated tests executed
- **Commit:** N/A (runtime invocation, not code change)

### [Rule 3 - Blocker] Typecheck script name

- **Found during:** Type-check verification
- **Issue:** User-prescribed command `pnpm --filter frontend typecheck` failed — filter mismatch (same as above). `pnpm typecheck` also failed: "Command 'typecheck' not found. Did you mean 'pnpm type-check'?"
- **Fix:** Used `pnpm type-check` (the actual package.json script name).
- **Pre-existing errors:** 14 TS6133/TS6196 errors in unrelated files (`workflow-automation.types.ts`, `working-group.types.ts`, `preference-broadcast.ts`, `local-storage.ts`, `sla-calculator.ts`, `preference-storage.ts`) + 1 TS2345 in `tokens/applyTokens.ts` (Phase 33 legacy). Per scope-boundary rule, these are NOT caused by this plan's changes and were logged to `deferred-items.md` candidates (no action taken).
- **Plan-owned files:** Zero type errors in `directionDefaults.ts` / `directionDefaults.test.ts`.
- **Commit:** N/A

### Dropped Wave-0 scaffold: "applying direction defaults writes id.theme + id.hue atomically"

- **Found during:** Test file promotion (Task 1 RED phase)
- **Issue:** Wave-0 scaffold included an `it.todo` for DOM/localStorage atomicity. Plan 34-02's `files_modified` list is strictly `directionDefaults.ts` + `directionDefaults.test.ts`, and the `<behavior>` block explicitly specifies "No mutation — record is `as const`" with zero DOM references. This test belongs to Plan 34-04 (TweaksDrawer, where DOM writes happen).
- **Fix:** Replaced the 6 `it.todo` blocks with the 5 `it()` blocks from the plan's `<action>` verbatim, dropping the atomicity todo. All 5 plan-specified tests pass.
- **Tracking:** Plan 34-04 must own the atomicity test (recommend reviewer flag if 34-04 PLAN doesn't include it).
- **Commit:** `8b61ae15`

**Total deviations:** 2 runtime/invocation adjustments + 1 scope-clarification (scaffold trim). **Impact:** Zero code-behavior change; all 5 plan-specified tests green; all acceptance criteria met.

## Authentication Gates

None.

## Deferred Issues

Pre-existing type errors in unrelated files (out-of-scope per Rule boundary):

| File                                                  | Error  | Type                        |
| ----------------------------------------------------- | ------ | --------------------------- |
| `src/types/workflow-automation.types.ts:499`          | TS6196 | unused type                 |
| `src/types/working-group.types.ts:85,93,104,113`      | TS6133 | unused const                |
| `src/utils/broadcast/preference-broadcast.ts:149`     | TS6133 | unused hook                 |
| `src/utils/local-storage.ts:254`                      | TS6133 | unused fn                   |
| `src/utils/sla-calculator.ts:183,203,227,263`         | TS6133 | unused fn                   |
| `src/utils/storage/preference-storage.ts:107,116,126` | TS6133 | unused fn                   |
| `src/design-system/tokens/applyTokens.ts:29`          | TS2345 | Phase 33 legacy nullability |

All pre-existing; none touched by this plan.

## Threat Flags

None. D-16 defaults map is pure compile-time data; threat register T-34-08 (tampering) is mitigated by `as const satisfies` (immutable + type-locked) as planned; T-34-09 (information disclosure) accepted — values are design intent, not secrets. No new trust boundaries introduced.

## Known Stubs

None. Module is complete; Plan 34-04 consumes it.

## TDD Gate Compliance

- **RED gate:** `test(34-02)` commit `8b61ae15` — import resolution failure as expected ✓
- **GREEN gate:** `feat(34-02)` commit `419bd9af` — 5/5 tests pass ✓
- **REFACTOR gate:** Skipped — 16-line module already minimal (Karpathy rule 2).

Gate sequence compliant.

## Self-Check: PASSED

- `frontend/src/design-system/directionDefaults.ts` exists on disk ✓
- `frontend/src/design-system/directionDefaults.test.ts` exists on disk ✓
- Commit `8b61ae15` exists in git log ✓
- Commit `419bd9af` exists in git log ✓
- All `<acceptance_criteria>` verified PASS (see table above) ✓
- All `<success_criteria>` verified PASS ✓

## Next

Ready for Plan 34-03 (next Wave 1 plan) or Plan 34-04 (TweaksDrawer, which imports this module).
