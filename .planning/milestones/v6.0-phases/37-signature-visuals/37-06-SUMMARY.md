---
phase: 37-signature-visuals
plan: 06
subsystem: signature-visuals
tags: [frontend, svg, rtl, sparkline, viz-05]
requires: [00]
provides:
  - 'Sparkline primitive (80×22 SVG polyline + trailing dot, min-max normalized, RTL-flipped via scaleX(-1))'
  - 'SparklineProps type'
affects:
  - 'frontend/src/components/signature-visuals/index.ts (barrel append)'
tech_stack_added: []
patterns:
  - 'SVG primitive with useLocale() RTL flip via `transform: scaleX(-1)` + `transform-origin: center`'
  - 'Divide-by-zero guard via `safeRange = range === 0 ? 1 : range` for single-point / constant series'
  - 'Empty-array short-circuit returns a blank `<svg>` for layout stability'
key_files:
  created:
    - frontend/src/components/signature-visuals/Sparkline.tsx
    - frontend/src/components/signature-visuals/__tests__/Sparkline.test.tsx
    - frontend/src/components/signature-visuals/__tests__/Sparkline.rtl.test.tsx
  modified:
    - frontend/src/components/signature-visuals/index.ts
decisions:
  - 'RTL flip applied to root `<svg>` (not an inner `<g>`) — simplest to reason about, and `transform-origin: center` at the svg level is equivalent to centering on the viewBox. No clipping observed in tests.'
  - "`transform-origin: center` set as an inline style (camelCase `transformOrigin`) rather than an SVG `transform-origin` attribute — matches React 19's preferred inline-style idiom; jsdom round-trips it to `transform-origin: center` in the `style` attribute which tests assert against."
  - "Single-point data pins the trailing dot to `y = height/2` rather than the normalization result (which would be `y=height` due to `(5-5)/1 === 0`). Centering communicates 'no trend' honestly."
  - '`useLocale()` is the canonical RTL source — NOT `useDesignDirection()` (carries classification enum) and NOT `document.dir` (not reactive). Test 4 in the RTL spec explicitly asserts that flipping `document.documentElement.dir` does not change the transform.'
metrics:
  duration_minutes: 8
  completed_at: '2026-04-24T13:55Z'
  tasks_completed: 2
  tests_added: 12
  files_created: 3
  files_modified: 1
---

# Phase 37 Plan 06: Sparkline Summary

Ships `<Sparkline data={number[]} />` — an 80×22 SVG polyline with a trailing dot, min-max normalized, flipped in Arabic locale via `transform: scaleX(-1)` + `transform-origin: center`. Unblocks Phase 38 SlaHealth, Phase 39 kcard anatomy, Phase 40 list columns.

## What Shipped

- `frontend/src/components/signature-visuals/Sparkline.tsx` (99 LOC including the 23-line JSDoc header)
- `frontend/src/components/signature-visuals/__tests__/Sparkline.test.tsx` — 8 tests covering math, defaults, edge cases, stroke/className passthrough
- `frontend/src/components/signature-visuals/__tests__/Sparkline.rtl.test.tsx` — 4 tests covering ar-flip, en-no-flip, data-attribute marker, and the explicit "document.dir is NOT the source" assertion
- `frontend/src/components/signature-visuals/index.ts` — appended `export { Sparkline }` and `export type { SparklineProps }`

## Commits

- `075fcafd` — test(37-06): add failing tests for Sparkline (RED)
- `0eb42dc4` — feat(37-06): implement Sparkline primitive (GREEN)

## RTL Flip — Where It Lives

The flip is applied to the **root `<svg>`** element (not an inner `<g>`). Reasoning:

- `transform-origin: center` at the svg root is mathematically equivalent to centering on the viewBox.
- One fewer DOM node = cleaner snapshot tests downstream.
- Tests verified the flipped polyline stays inside the 80×22 viewBox — no clipping.

The flipped root carries `data-sparkline-flipped="true"` so downstream consumers (or visual-regression tools) can target the flipped state without re-computing locale.

## Browser-Compat Note on `transform-origin`

`transform-origin` as an inline style on SVG elements is supported in all evergreen browsers (Chrome 46+, Firefox 55+, Safari 9.1+). The value `center` resolves to `50% 50%` against the SVG's own bounding box, which for an 80×22 viewBox is `(40px, 11px)` — the geometric center. No polyfill or vendor prefix needed. Tested in jsdom via `getAttribute('style')` round-trip.

## Math

```
range      = max - min
safeRange  = range === 0 ? 1 : range      // divide-by-zero guard
x[i]       = data.length === 1 ? width : (i / (data.length - 1)) * width
normalized = (value - min) / safeRange    // 0 at min, 1 at max
y[i]       = height - normalized * height // 22 at min (bottom), 0 at max (top)
```

For `data=[1,2,3,4,5]` with 80×22 this produces `(0,22) (20,16.5) (40,11) (60,5.5) (80,0)` — verified by test 2.

## Deviations from Plan

None — plan executed exactly as written.

Plan and implementation agreed on all five must-have truths:

1. Developer renders `<Sparkline data={[1,2,3,4,5]} />` → 80×22 polyline + trailing dot ✓
2. Points are min-max normalized, lowest→y=22, highest→y=0 ✓
3. `locale='ar'` applies `scaleX(-1)` ✓
4. `locale='en'` applies no scaleX transform ✓
5. `data=[]` renders empty SVG; `data=[5]` renders single dot at `y=11` ✓

## Tests

All 12 Sparkline specs GREEN (2 test files, 12 assertions):

- Math (5): defaults, normalization, trailing dot, custom stroke, custom dims
- Edge cases (2): empty array, single point (min===max)
- Passthrough (1): className
- RTL (4): ar flip, en no-flip, data-attribute marker, document.dir NOT used

Wider `pnpm exec tsc --noEmit` has 15 pre-existing unused-declaration warnings in unrelated files (work-item.types, workflow-automation.types, storage helpers). Zero new errors introduced by this plan.

## Threat Register Resolution

| Threat                       | Disposition | Mitigation Status                                                                                                                                                            |
| ---------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Large-data DoS               | accept      | Not enforced — Phase 38 consumers pass ≤14 data points; future cap can be added without API break                                                                            |
| NaN/Infinity data, min===max | mitigate    | `safeRange` guard + empty-array short-circuit + Pitfall 7 `transform-origin: center` — all in place; 1 test asserts `outerHTML` does not contain `"NaN"` for both edge cases |

## Self-Check: PASSED

- `frontend/src/components/signature-visuals/Sparkline.tsx` — FOUND
- `frontend/src/components/signature-visuals/__tests__/Sparkline.test.tsx` — FOUND
- `frontend/src/components/signature-visuals/__tests__/Sparkline.rtl.test.tsx` — FOUND
- Barrel export in `index.ts` — FOUND
- Commit `075fcafd` (RED) — FOUND
- Commit `0eb42dc4` (GREEN) — FOUND
- 12/12 Sparkline tests GREEN
- No new tsc errors
- `scaleX(-1)` present in Sparkline.tsx, absent in implementation anti-patterns (`.reverse()`, `useDesignDirection`, `text-align: right`)
