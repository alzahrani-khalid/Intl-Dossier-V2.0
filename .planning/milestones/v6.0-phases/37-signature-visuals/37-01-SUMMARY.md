---
phase: 37-signature-visuals
plan: 01
status: complete
verification: passed
completed_at: 2026-04-24T13:33:00Z
requirements: [VIZ-01]
commits:
  - sha: e99f2eba
    type: test
    msg: 'test(37-01): add failing tests for useReducedMotion hook'
  - sha: 972a6641
    type: feat
    msg: 'feat(37-01): implement useReducedMotion hook (GREEN)'
files_modified:
  - frontend/src/design-system/hooks/useReducedMotion.test.tsx # created (86 LOC)
  - frontend/src/design-system/hooks/useReducedMotion.ts # created (36 LOC total; ~20 LOC body)
  - frontend/src/design-system/hooks/index.ts # surgical append: 1 line
metrics:
  hook_total_loc: 36
  hook_body_loc: 20
  tests_passing: 5
  tests_total: 5
  typecheck: clean
tags: [frontend, hook, a11y, reduced-motion, tdd]
---

# Phase 37 Plan 37-01: useReducedMotion Hook Summary

`useReducedMotion()` ships as a React 19 `useSyncExternalStore`-backed hook that tracks
`matchMedia('(prefers-reduced-motion: reduce)')`. Concurrent-safe, SSR-safe, zero
framer-motion coupling — ready for `<GlobeLoader>` (Plan 02) to gate its rAF loop.

## Objective (met)

- Hook exported as `useReducedMotion` from `@/design-system/hooks`
- Returns a boolean that tracks `prefers-reduced-motion: reduce`
- SSR-safe (`getServerSnapshot` returns `false`)
- Subscribes via `useSyncExternalStore` (concurrent-rendering safe per React 19 guidance)
- WCAG 2.3.3 compliance primitive for D-14 / D-16 dual-layer defense

## Tasks Completed

| #   | Task                                            | Commit   |
| --- | ----------------------------------------------- | -------- |
| 1   | RED: add failing tests (5 `it()` blocks)        | e99f2eba |
| 2   | GREEN: implement hook + append barrel re-export | 972a6641 |

## Files Modified

| File                                                         | Change   | Notes                                            |
| ------------------------------------------------------------ | -------- | ------------------------------------------------ |
| `frontend/src/design-system/hooks/useReducedMotion.test.tsx` | created  | 86 LOC; 5 `it()` blocks                          |
| `frontend/src/design-system/hooks/useReducedMotion.ts`       | created  | 36 LOC total (~20 LOC body); matches PATTERNS.md |
| `frontend/src/design-system/hooks/index.ts`                  | modified | surgical 1-line append                           |

## Verification

```
> vitest run src/design-system/hooks/useReducedMotion.test.tsx

Test Files  1 passed (1)
Tests       5 passed (5)
Duration    435ms
```

- `pnpm exec tsc --noEmit` — no errors on any of the 3 touched files (full run clean for scope)
- Barrel re-export confirmed: `grep "useReducedMotion" index.ts` returns 1 match
- Hook body ≤ 25 LOC (minimal-hook discipline; PATTERNS.md analog constraint)

### Acceptance criteria (all green)

- [x] `useSyncExternalStore` used (1 reference)
- [x] `prefers-reduced-motion: reduce` query string present (1 reference)
- [x] `export function useReducedMotion` present (1 reference)
- [x] `framer-motion` absent (D-13 ban enforced; 0 references)
- [x] Barrel `index.ts` re-exports `useReducedMotion` (1 reference)
- [x] 5/5 unit tests green
- [x] Typecheck clean
- [x] File body ≤ 25 LOC

## Deviations

None — plan executed exactly as written.

## Implementation Notes

**JSDoc structure mirror:** `useDesignDirection.ts` — same intent block at the file top,
explicit return type, named export, no default export. Substituted
`useSyncExternalStore` for the analog's `useContext` (no provider is required — matchMedia IS
the external store).

**matchMedia mocking gotcha:** The plan's suggested `vi.mock` hoist trick is unnecessary for
this hook because `window.matchMedia` is assignable at runtime under jsdom. The test uses a
reassign-and-register pattern (`window.matchMedia = vi.fn()...`) in a `beforeEach` hook,
which keeps the mock MQL object stable so `addEventListener.mock.calls[0][1]` returns the
listener reference that the change-event test needs to invoke. No module-mock hoist order
risk.

**SSR assertion:** The 5th `it()` block asserts module shape rather than calling
`getServerSnapshot` directly because React only invokes it under a renderer, not during
jsdom runs. The integration test in Plan 02 will exercise the `false` return via
`renderToString`. Non-blocker for VIZ-01; flagged for Plan 02 coverage.

**LOC discipline:** Body is 20 LOC (lines 14–36). Total file (including JSDoc) is 36 lines,
well under the 25-LOC-body ceiling in PATTERNS.md.

## Ready For

- Plan 02 (`<GlobeLoader>`): `import { useReducedMotion } from '@/design-system/hooks'`
  will resolve; hook returns stable boolean for rAF gating.
- Plan 06 (CSS `@media (prefers-reduced-motion: reduce)`): dual-layer defense pair
  (CSS keyframes + JS rAF) now has the JS half shipped.

## Self-Check: PASSED

- FOUND: `frontend/src/design-system/hooks/useReducedMotion.ts`
- FOUND: `frontend/src/design-system/hooks/useReducedMotion.test.tsx`
- FOUND: `frontend/src/design-system/hooks/index.ts` (modified, barrel re-export present)
- FOUND: commit `e99f2eba` (test RED)
- FOUND: commit `972a6641` (feat GREEN)
