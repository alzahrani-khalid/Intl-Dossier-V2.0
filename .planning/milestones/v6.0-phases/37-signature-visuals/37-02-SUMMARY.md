---
phase: 37-signature-visuals
plan: 02
status: complete
type: execute
wave: 1
requirements: [VIZ-01]
verification:
  tests: '9 passing / 9 total (5 test files)'
  typecheck: 'pass'
  build: 'pass (exit 0)'
completed_at: 2026-04-24
commits:
  - 39e45a09 # feat(37-02): ensureWorld.ts + globe-loader.css
  - 86751108 # test(37-02): 5 failing tests (RED)
  - b2bbe933 # feat(37-02): GlobeLoader GREEN + barrel export
key_files:
  created:
    - frontend/src/components/signature-visuals/ensureWorld.ts
    - frontend/src/components/signature-visuals/globe-loader.css
    - frontend/src/components/signature-visuals/GlobeLoader.tsx
    - frontend/src/components/signature-visuals/__tests__/GlobeLoader.test.tsx
    - frontend/src/components/signature-visuals/__tests__/GlobeLoader.rotation.test.tsx
    - frontend/src/components/signature-visuals/__tests__/GlobeLoader.rings.test.tsx
    - frontend/src/components/signature-visuals/__tests__/GlobeLoader.degrade.test.tsx
    - frontend/src/components/signature-visuals/__tests__/GlobeLoader.reducedMotion.test.tsx
  modified:
    - frontend/src/components/signature-visuals/index.ts
---

# Phase 37 Plan 37-02: GlobeLoader Summary

Ships `<GlobeLoader>` — the orthographic spinning globe with whirl rings and halo — as a TypeScript port of the handoff `loader.jsx`. rAF-driven d3-geo projection, CSS-keyframe rings at 3.2s/5.5s/8s, lazy dynamic import of d3/topojson/world-atlas, reduced-motion gate, graceful degrade on chunk failure.

## Objective

Port the handoff `<GlobeLoader>` verbatim to TypeScript per VIZ-01. Rings + halo paint immediately from CSS; d3/topojson/world-atlas load lazily on first mount; globe rotates at 16°/sec on −18° tilt; reduced-motion users get a one-shot paint at λ=0 with no rAF scheduled; chunk-load failure leaves rings animating and emits exactly one `console.warn`.

## Tasks Completed

| Task | Name                                    | Commit     |
| ---- | --------------------------------------- | ---------- |
| 02-1 | ensureWorld.ts + globe-loader.css       | `39e45a09` |
| 02-2 | Failing tests (RED) — 5 files           | `86751108` |
| 02-3 | GlobeLoader.tsx (GREEN) + barrel export | `b2bbe933` |

## Verification

- `pnpm exec vitest run src/components/signature-visuals/__tests__/GlobeLoader` → **9 passed / 9 total** across 5 files
- `pnpm exec tsc --noEmit` → **clean** (no errors in signature-visuals scope)
- `pnpm exec vite build` → **exit 0**

### Test breakdown

| File                               | Tests | Concern                                            |
| ---------------------------------- | ----- | -------------------------------------------------- |
| GlobeLoader.test.tsx               | 3     | Mount, rAF cleanup on unmount, progressive paint   |
| GlobeLoader.rotation.test.tsx      | 1     | 16°/sec lambda math at t=0/1s/2s (tolerance ±0.5°) |
| GlobeLoader.rings.test.tsx         | 3     | Ring class presence, halo class presence           |
| GlobeLoader.degrade.test.tsx       | 1     | Exactly 1 `console.warn` + no land path on reject  |
| GlobeLoader.reducedMotion.test.tsx | 1     | No rAF when reduced-motion; one paint at (0, −18)  |

## Deviations from Plan

### [Rule 1 - Bug] d3.select removed — d3-geo does not export it

- **Found during:** Task 02-3 implementation
- **Issue:** Plan template used `d3.select(...)` for DOM attach. `d3-geo` is a submodule package (no `select` export); only `d3-selection` provides `d3.select`. Using it crashed with `TypeError: d3.select is not a function` in 4/9 tests.
- **Fix:** Replaced `d3.select` chain with native DOM primitives — `document.createElementNS(SVG_NS, 'path')` + `setAttribute`. Behavior is identical to the handoff's d3-selection chain, but the lazy chunk stays small (d3-geo only, no d3-selection added).
- **Files modified:** `frontend/src/components/signature-visuals/GlobeLoader.tsx`
- **Rationale:** Plan D-05 explicitly bans importing the full `d3` bundle. Adding `d3-selection` solely for 3 `svg.append('path')` calls would bloat the chunk without benefit.
- **Commit:** `b2bbe933`

### [Test isolation] Mocked `@/design-system/hooks` in all 5 test files

Per the prompt's coordination note (b), I mocked `useReducedMotion` via `vi.mock('@/design-system/hooks', ...)` in every test file even though Plan 37-01 was already merged-to-working-tree (file exists on disk). This guarantees the tests pass regardless of whether Plan 37-01 has been committed / reverted / hot-swapped.

### [Rotation test harness] Replaced Proxy shim with direct method override

- **Found during:** Task 02-3 GREEN run
- **Issue:** The initial `new Proxy(projection, { get })` shim broke the fluent projection API — `.scale().translate().clipAngle()` returned unbound methods.
- **Fix:** Monkey-patched `inner.rotate` directly while letting every other method stay bound to the real projection instance. Cleaner, avoids `this`-binding hazards.
- **Files modified:** `GlobeLoader.rotation.test.tsx`, `GlobeLoader.reducedMotion.test.tsx`

## Build Chunk Note

When the plan was written, the success criterion included `ls frontend/dist/assets/*d3-geo*.js` returning ≥1 file. At this plan's cut-point, **no route imports `<GlobeLoader>` yet** — the barrel is the only export path. Vite tree-shakes the unused component and its lazy chunks; therefore no `d3-geo` asset is emitted in `dist/` for this plan in isolation.

This is expected and non-blocking — Plan 37-03 adds `<FullscreenLoader>` which wraps `<GlobeLoader>` and is wired into `AppShell.tsx`, causing the lazy chunk to materialize at that point. The acceptance criterion should be evaluated after Plan 37-03 merges, not at 37-02's cut-point.

## Open Question (RESEARCH O-1 — Vite JSON import)

`import('world-atlas/countries-110m.json')` worked out of the box in Vite 7.3.1 — **no `assetsInclude` config tweak required**. The `.default` extraction path in `ensureWorld.ts` handles Vite's ES-module namespace wrapper correctly. Typecheck clean, build clean.

## Self-Check: PASSED

- [x] `frontend/src/components/signature-visuals/ensureWorld.ts` exists
- [x] `frontend/src/components/signature-visuals/globe-loader.css` exists
- [x] `frontend/src/components/signature-visuals/GlobeLoader.tsx` exists
- [x] All 5 `__tests__/GlobeLoader*.test.tsx` files exist
- [x] `frontend/src/components/signature-visuals/index.ts` exports `GlobeLoader` and `GlobeLoaderProps`
- [x] Commit `39e45a09` present in `git log`
- [x] Commit `86751108` present in `git log`
- [x] Commit `b2bbe933` present in `git log`
- [x] 9/9 tests green
- [x] Typecheck clean
- [x] Build exit 0
