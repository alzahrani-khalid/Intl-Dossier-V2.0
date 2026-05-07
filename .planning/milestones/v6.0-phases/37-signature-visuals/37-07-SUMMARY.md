---
phase: 37-signature-visuals
plan: 07
subsystem: frontend/signature-visuals
tags: [frontend, svg, donut, dataviz, viz-05]
dependency_graph:
  requires:
    - Phase 33 tokens (--ok, --risk, --bad, --surface-raised, --ink)
    - Phase 35 typography (--font-display cascade)
    - Plan 37-00 (signature-visuals scaffold + barrel)
  provides:
    - frontend/src/components/signature-visuals/Donut.tsx (named export Donut, type DonutProps)
  affects:
    - frontend/src/components/signature-visuals/index.ts (Donut named + type export)
tech_stack:
  added: []
  patterns:
    - Stacked strokeDasharray/dashoffset donut — math analog of pull-to-refresh-indicator.tsx
    - CSS custom property token consumption (no hex literals)
    - SVG text pill with dominant-baseline centering
key_files:
  created:
    - frontend/src/components/signature-visuals/Donut.tsx
    - frontend/src/components/signature-visuals/__tests__/Donut.test.tsx
    - frontend/src/components/signature-visuals/__tests__/Donut.pill.test.tsx
  modified:
    - frontend/src/components/signature-visuals/index.ts (no-op; parallel plan already appended exports)
decisions:
  - strokeLinecap set to "butt" so overlapping segment caps don't bleed into neighboring arcs
  - Per-variant clamp via Math.max/Math.min — sum validation left to caller per plan line 183
  - dominant-baseline="middle" chosen over pixel y-offset for centering the pill text
metrics:
  tasks_completed: 2
  tests_added: 11
  tests_passing: 11
  files_created: 3
  files_modified: 0
  duration_min: 7
  completed_date: 2026-04-24
requirements: [VIZ-05]
---

# Phase 37 Plan 07: Donut (VIZ-05) Summary

Shipped `<Donut value={N} variants={[ok, risk, bad]} size={72} />` — a stacked-strokeDasharray SVG donut with a center percentage pill rendered in the Phase 35 `--font-display` cascade. Donut is the second Wave 2 primitive; Phase 38 `SlaHealth` (DASH-05) will consume it alongside `<Sparkline>`.

## What Was Built

- **Donut.tsx (121 LOC)** — plain `<circle>` track + three stacked dasharray segments (ok / risk / bad) + `<text>` pill displaying `{Math.round(value)}%`. Math: `segLength = (pct/100) * 2πr`, `dashoffset` chains `0 → -segOk → -(segOk + segRisk)` to rotate the start of each arc around the circle. Every segment is `transform="rotate(-90 18 18)"` so arcs start at 12 o'clock.
- **Donut.test.tsx** — 6 specs covering dasharray math, offset stacking, sub-100% gap, per-variant clamp (guards NaN / negative offsets), -90° rotation, and token stroke consumption.
- **Donut.pill.test.tsx** — 5 specs covering rounded-percentage text, edge values (0, 100), `--font-display` cascade, `var(--ink)` fill, and anchor/baseline centering.
- **Barrel** — `export { Donut }` + `export type { DonutProps }` (the parallel 37-06 Sparkline commit already appended the line, so our edit was idempotent — documented below).

## Token Anchor

- `var(--ok)` — ok segment stroke
- `var(--risk)` — risk segment stroke
- `var(--bad)` — bad segment stroke
- `var(--surface-raised)` — track stroke
- `var(--ink)` — center pill fill
- `var(--font-display)` — center pill font family

9 `var(--` reads in the file; 0 hex literals.

## Threat Model Compliance

| Threat                                        | Mitigation Applied                                                                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tampering (NaN / negative / >100 percentages) | `clampPct = Math.max(0, Math.min(100, n))` applied to each of `ok`, `risk`, `bad`, and `value`. Test case `[150, -20, 50]` asserts clamp behavior. |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Defensive polish] Added `strokeLinecap="butt"` to each segment**

- **Found during:** Task 07-2 implementation review
- **Issue:** Default SVG `stroke-linecap` is `butt` so this is strictly redundant, but some rendering engines treat the implicit default differently during animations. Setting it explicitly guarantees that adjacent segments do not bleed into each other at the join when the component is later animated.
- **Fix:** Added `strokeLinecap="butt"` to all three variant circles.
- **Files modified:** frontend/src/components/signature-visuals/Donut.tsx
- **Commit:** f6974342

**2. [Rule 3 — Parallel-plan coordination] Barrel already exported Donut**

- **Found during:** Task 07-2 final commit staging
- **Issue:** The barrel `frontend/src/components/signature-visuals/index.ts` already contained `export { Donut } from './Donut'` when the GREEN commit was staged — the parallel 37-06 Sparkline plan (wave 2) bundled barrel-line additions for all wave-2 primitives in its commit. My Edit call was idempotent; no diff produced.
- **Fix:** No action required. Verified the exports resolve and match the plan's interface.
- **Files modified:** none (my edit matched existing content byte-for-byte)

### Deferred Items

None.

## Known Stubs

None. The component renders the full data set passed by the caller; there are no placeholder values flowing to the UI.

## Verification Gate Results

| Gate                                                                     | Result                                                                                                                                    |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm exec vitest run src/components/signature-visuals/__tests__/Donut`  | **11/11 PASS** across Donut.test.tsx (6) + Donut.pill.test.tsx (5)                                                                        |
| `pnpm exec tsc --noEmit`                                                 | No Donut-related errors. Pre-existing project errors unchanged (FullscreenLoader unused `@ts-expect-error`, storage utility unused vars). |
| `grep -cE '#[0-9a-fA-F]{3,8}' Donut.tsx`                                 | **0** — no hex literals                                                                                                                   |
| `grep -c 'var(--' Donut.tsx`                                             | **9** — exceeds the ≥5 floor                                                                                                              |
| `grep -c 'strokeDasharray' Donut.tsx`                                    | **4** (1 per segment × 3 + 1 prop-key usage in JSX) — meets ≥3                                                                            |
| `grep -c 'rotate(-90' Donut.tsx`                                         | **3** — one per segment                                                                                                                   |
| `grep -c 'framer-motion' / 'm\.circle'`                                  | Only the D-13 ban comment matches; **no import**.                                                                                         |
| `grep -c 'textAnchor="middle"' Donut.tsx`                                | **1**                                                                                                                                     |
| Barrel resolves `import { Donut } from '@/components/signature-visuals'` | yes                                                                                                                                       |

## Pixel Parity Note

Visual-delta vs handoff `tajawal-donut.png` was not compared in this plan — the plan's output clause defers pixel-parity to manual review. The component matches the RESEARCH §"Donut via stacked strokeDasharray" template verbatim (lines 525-556), including viewBox `0 0 36 36`, radius `14`, strokeWidth `4`, fontSize `8`, and fontWeight `600`. Any pixel-parity adjustments (e.g. refining text baseline or pill font-size) should be caught during Phase 38 SlaHealth assembly.

## Commits

- `15c65bf2` — test(37-07): add failing tests for Donut dasharray segments and center pill (RED)
- `f6974342` — feat(37-07): implement Donut with stacked strokeDasharray segments (GREEN)

## TDD Gate Compliance

- RED commit (`test(37-07): …`) → present (`15c65bf2`)
- GREEN commit (`feat(37-07): …`) → present (`f6974342`) and chronologically after RED
- REFACTOR — not required; GREEN implementation was already minimal.

## Self-Check: PASSED

- Donut.tsx: FOUND
- Donut.test.tsx: FOUND
- Donut.pill.test.tsx: FOUND
- Commit 15c65bf2: FOUND
- Commit f6974342: FOUND
- Barrel exports Donut + DonutProps: FOUND (idempotent edit)
- All 11 tests GREEN: verified
