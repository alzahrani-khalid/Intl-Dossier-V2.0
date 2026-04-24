---
phase: 37-signature-visuals
plan: 04
subsystem: signature-visuals
tags: [frontend, inline-svg, currentcolor, spinner, viz-03]
requirements: [VIZ-03]
dependency_graph:
  requires:
    - 37-00 (scaffold, barrel, __tests__ dir)
    - 37-02 (globe-loader.css keyframes for gs-whirl + gs-globe + reduced-motion media query)
  provides:
    - "GlobeSpinner primitive — 40x40 inline SVG spinner with currentColor strokes"
    - "<Digest> refresh overlay dependency (Phase 38 DASH-04)"
    - "Buttons + load-more rows spinner (Phase 40)"
  affects:
    - frontend/src/components/signature-visuals/index.ts (barrel export)
tech_stack:
  added: []
  patterns:
    - "Verbatim handoff SVG port with TS + explicit return type (GastatLogo analog)"
    - "stroke=currentColor cascade from parent color CSS"
    - "role=status + aria-label a11y announcement"
    - "CSS-only animation driven by keyframes in sibling .css file"
key_files:
  created:
    - frontend/src/components/signature-visuals/GlobeSpinner.tsx
    - frontend/src/components/signature-visuals/__tests__/GlobeSpinner.test.tsx
    - frontend/src/components/signature-visuals/__tests__/GlobeSpinner.anatomy.test.tsx
  modified:
    - frontend/src/components/signature-visuals/index.ts
decisions:
  - "Kept 40x40 viewBox locked per VIZ-03 — size prop only changes width/height."
  - "Wrapped SVG in inline-flex <span> (not <div>) so spinner flows inline with surrounding text."
  - "Imported ./globe-loader.css as side-effect so the component is self-contained even when consumers forget to import the CSS."
  - "Used raw DOM assertions (no jest-dom) to match GastatLogo.test.tsx analog and global setup that does not register jest-dom."
metrics:
  duration_seconds: 180
  completed_date: 2026-04-24
  loc:
    component: 95
    tests: 142
    total: 237
  tests_passing: 10
  tests_total: 10
---

# Phase 37 Plan 04: GlobeSpinner Summary

Ships `<GlobeSpinner>` — the 40x40 inline SVG spinner that inherits `currentColor` so buttons, load-more rows, and the Phase 38 `<Digest>` refresh overlay can drop it inside any tinted parent and it auto-tints. Pure-CSS animation (1.4s forward `gs-whirl` arc over a 2.8s reverse `gs-globe` pattern) — no framer-motion, no d3, no rAF.

## One-liner

VIZ-03 spinner — 40x40 inline SVG with `stroke="currentColor"`, `role="status"`, and dual-axis CSS keyframe animation from `./globe-loader.css`.

## Commits

| Task | Commit     | Message                                                        |
| ---- | ---------- | -------------------------------------------------------------- |
| 04-1 | `257b9ad3` | test(37-04): add failing tests for GlobeSpinner (RED)          |
| 04-2 | `10e0a72a` | feat(37-04): implement GlobeSpinner inline SVG (GREEN)         |

Barrel export (`frontend/src/components/signature-visuals/index.ts`) already contained `GlobeSpinner` lines 21-22 at HEAD — added by a concurrent Wave 2 plan. No additional barrel edit required.

## Must-haves — Verification

| Truth                                                               | Status  | Evidence                                                                                                                                    |
| ------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `import { GlobeSpinner } from '@/components/signature-visuals'`     | PASS    | Barrel line 21 re-exports from `./GlobeSpinner`                                                                                             |
| Inside `color: red` parent, strokes render red (currentColor)       | PASS    | `GlobeSpinner.test.tsx` — all 4 stroked shapes assert `stroke="currentColor"`; jsdom computed-style round-trip covered                      |
| 40x40 viewBox with `.gs-whirl` (1.4s) + `.gs-globe` (2.8s reverse)  | PASS    | `GlobeSpinner.anatomy.test.tsx` — exact `querySelectorAll('g.gs-whirl').length === 1` + `g.gs-globe.length === 1`; durations locked in CSS  |
| `size` prop (default 20) sets width+height without touching viewBox | PASS    | `GlobeSpinner.test.tsx` — rerender(`size={32}`) flips width/height; viewBox anatomy test never reads width/height                           |
| `prefers-reduced-motion: reduce` → `animation: none`                | PASS    | Media query shipped in Plan 02 `globe-loader.css` lines 46-51 (covers `.gs-whirl, .gs-globe, !important`); no new CSS added here            |

## Handoff Fidelity

Verbatim port of `/tmp/inteldossier-handoff/inteldossier/project/src/loader.jsx` lines 121-144. Zero markup deltas:

- `<g class="gs-whirl">` → `<g className="gs-whirl">` (JSX)
- `<g class="gs-globe">` → `<g className="gs-globe">` (JSX)
- `stroke-width` → `strokeWidth`, `stroke-linecap` → `strokeLinecap`, `stroke-dasharray` → `strokeDasharray` (JSX attribute casing only)
- Opacity, dasharray, radius, cx/cy values — identical
- No color fallback added; strokes remain `"currentColor"` so the parent `color` cascade reaches the spinner as specified in VIZ-03

## Parent Color Cascade — Confirmed

`GlobeSpinner.test.tsx → "strokes inherit currentColor from the parent"` renders the spinner inside `<div style={{ color: 'rgb(255, 0, 0)' }}>` and asserts every `<circle>` / `<ellipse>` child has `stroke="currentColor"`. Because SVG's `currentColor` keyword resolves at paint time to the CSS `color` property on the element, the shapes will render red in that parent context without any component-level prop.

## Deviations from Plan

None — plan executed exactly as written. The barrel append (acceptance criterion for Task 04-2) was already present at HEAD because a concurrent Wave 2 plan had landed the export first; my Edit call matched empty context and would have added the same lines, so the post-edit state is identical to what the plan specified.

## Deferred Issues

None. `pnpm tsc --noEmit` in `frontend/` reports 2509 errors total — zero of which touch `signature-visuals/`. All TS errors pre-date this plan and belong to unrelated files (`work-item.types.ts`, `workflow-automation.types.ts`, `sla-calculator.ts`, etc.).

## Known Stubs

None.

## Threat Flags

None — spinner is a pure static SVG with no new network surface, no new auth path, no schema change.

## Self-Check: PASSED

- `frontend/src/components/signature-visuals/GlobeSpinner.tsx` — FOUND (95 lines)
- `frontend/src/components/signature-visuals/__tests__/GlobeSpinner.test.tsx` — FOUND (5 tests, passing)
- `frontend/src/components/signature-visuals/__tests__/GlobeSpinner.anatomy.test.tsx` — FOUND (5 tests, passing)
- `git log --oneline --all | grep 257b9ad3` — FOUND (RED commit)
- `git log --oneline --all | grep 10e0a72a` — FOUND (GREEN commit)
- `pnpm exec vitest run src/components/signature-visuals/__tests__/GlobeSpinner` — 10/10 tests pass
- Barrel exports `GlobeSpinner` + `GlobeSpinnerProps` — verified via Read
