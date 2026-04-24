---
phase: 37-signature-visuals
plan: 03
subsystem: frontend/signature-visuals
tags: [frontend, overlay, backdrop, dev-gate, security, useSyncExternalStore]
requirements: [VIZ-02]
wave: 2
depends_on: [00, 02]
dependency_graph:
  requires:
    - frontend/src/components/signature-visuals/GlobeLoader.tsx
    - frontend/src/components/signature-visuals/globe-loader.css
  provides:
    - FullscreenLoader overlay primitive
    - globeLoaderSignal module (imperative + declarative trigger bridge)
    - window.__showGlobeLoader(ms) DEV-only handle
  affects:
    - frontend/src/components/signature-visuals/index.ts (barrel)
    - frontend/src/components/signature-visuals/globe-loader.css (@supports fallback)
tech-stack:
  added: []
  patterns:
    - module-scoped signal + Set<Listener>
    - useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
    - import.meta.env.DEV compile-time gate (Vite DCE)
    - color-mix(in srgb, ...) backdrop + @supports not (backdrop-filter) fallback
    - OR-semantics between declarative prop and imperative signal
key-files:
  created:
    - frontend/src/components/signature-visuals/globeLoaderSignal.ts
    - frontend/src/components/signature-visuals/FullscreenLoader.tsx
    - frontend/src/components/signature-visuals/__tests__/FullscreenLoader.test.tsx
    - frontend/src/components/signature-visuals/__tests__/FullscreenLoader.devGate.test.tsx
    - frontend/src/components/signature-visuals/__tests__/FullscreenLoader.backdrop.test.tsx
  modified:
    - frontend/src/components/signature-visuals/index.ts
    - frontend/src/components/signature-visuals/globe-loader.css
decisions:
  - "ms prop delegates visibility to the signal — so the auto-close timer wins over a persistent propOpen={true}. Without this, `<FullscreenLoader open ms={500} />` would stay visible forever because OR(true, anything) === true."
  - "getServerSnapshot returns a fresh {open:false, expiresAt:0} object — SSR-safe and distinct from the client snapshot identity."
metrics:
  duration_minutes: 5
  tasks_completed: 3
  completed_date: 2026-04-24
  loc:
    globeLoaderSignal_ts: 67
    FullscreenLoader_tsx: 107
    tests_total: 165
---

# Phase 37 Plan 03: FullscreenLoader + globeLoaderSignal Summary

FullscreenLoader overlay composes GlobeLoader inside a `color-mix` + `backdrop-filter: blur(3px)` backdrop, driven by a module-scoped signal that bridges `window.__showGlobeLoader` (DEV) and the declarative `<FullscreenLoader open ms>` prop.

## Objective

Ship VIZ-02: the re-trigger path for the splash — needed by Phase 38 (digest refresh) and for dev ergonomics. The DEV gate (`import.meta.env.DEV`) is the T-37-02 mitigation: production bundles must NOT expose `window.__showGlobeLoader`.

## Tasks Completed

| Task  | Name                                                        | Commit     |
| ----- | ----------------------------------------------------------- | ---------- |
| 03-1  | Ship globeLoaderSignal.ts (module-scoped signal)            | `9c98e8ae` |
| 03-2  | RED: 3 failing tests for FullscreenLoader                   | `bd25f1cf` |
| 03-3  | GREEN: FullscreenLoader + CSS fallback + barrel             | `362872b9` |

## Files Modified

**Created:**
- `frontend/src/components/signature-visuals/globeLoaderSignal.ts` — 67 LOC. Exports `showGlobeLoader(ms)`, `subscribe(cb)`, `getSnapshot()`, `getServerSnapshot()`, `__resetGlobeLoaderSignalForTests()`. Single `let _state`, `Set<Listener>`, single timer with `clearTimeout` re-entrancy. Snapshot identity stable until mutation.
- `frontend/src/components/signature-visuals/FullscreenLoader.tsx` — 107 LOC. `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)`. DEV-gated `window.__showGlobeLoader`. `pointer-events: none` on root. `role="status"` + `aria-live="polite"` + `aria-label`.
- `__tests__/FullscreenLoader.test.tsx` — 5 specs: open-prop, default-closed, fake-timer 1599/1601ms boundary, prop+ms auto-close, signal-OR-prop.
- `__tests__/FullscreenLoader.devGate.test.tsx` — 2 specs using `vi.stubEnv('DEV', …)` + `vi.resetModules()` + `await import(…)` so each assertion re-evaluates the top-level DEV block.
- `__tests__/FullscreenLoader.backdrop.test.tsx` — 2 specs: inline style string contains `color-mix(in srgb, var(--bg) 82%, transparent)` + `backdrop-filter` + `blur(3px)`; css file read-check for `@supports not (backdrop-filter)` + `var(--bg) 95%`.

**Modified:**
- `frontend/src/components/signature-visuals/index.ts` — appended `FullscreenLoader`, `FullscreenLoaderProps`, and re-exported `showGlobeLoader` / `subscribeGlobeLoader` / `getGlobeLoaderSnapshot` / `getGlobeLoaderServerSnapshot` / `GlobeLoaderState` from the signal.
- `frontend/src/components/signature-visuals/globe-loader.css` — appended `@supports not (backdrop-filter: blur(3px))` block setting `background: color-mix(in srgb, var(--bg) 95%, transparent) !important` on the backdrop (D-08 fallback).

## Verification

- `pnpm --filter frontend exec vitest run src/components/signature-visuals/__tests__/FullscreenLoader` — **9/9 GREEN** across 3 files (~550ms).
- `pnpm --filter frontend exec tsc --noEmit` — zero new errors in `signature-visuals/**`. The only remaining errors in the repo are 5 pre-existing `TS6133` unused-export warnings in `utils/sla-calculator.ts` and `utils/storage/preference-storage.ts` — not touched by this plan.
- Grep checks pass:
  - `import.meta.env.DEV` count in `FullscreenLoader.tsx` = 3 (≥ 1) — DEV gate present.
  - `__showGlobeLoader` count = 3 (≥ 1).
  - `color-mix(in srgb, var(--bg) 82%, transparent)` count = 2 (≥ 1).
  - `backdrop-filter|backdropFilter` count = 3 (≥ 1).
  - `WebkitBackdropFilter` count = 1.
  - `useSyncExternalStore` count = 2 (import + call).
  - `pointerEvents: 'none'` present at line 91.
  - `role="status"` + `aria-live` present.
  - `@supports not (backdrop-filter` in CSS count = 1.
  - `FullscreenLoader` in barrel count = 3.

## Security (T-37-02)

Production bundles **do not** expose `window.__showGlobeLoader`. The registration is wrapped in `if (import.meta.env.DEV)` at module scope — Vite replaces the expression with `false` at build time, and Rollup's dead-code elimination strips the entire block. The DEV gate test (`stubEnv('DEV', false)` + `resetModules` + `await import`) asserts `typeof window.__showGlobeLoader === 'undefined'` when DEV is false. Defense-in-depth Playwright E2E on the prod build is scheduled for Plan 07.

`pointer-events: none` on the overlay root prevents the backdrop from trapping clicks on nav controls (ASVS V10 clickjacking mitigation — backdrop is strictly decorative).

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 – Bug] Prop + ms auto-close was blocked by OR-semantics**
- **Found during:** Task 03-3 (GREEN run)
- **Issue:** With the initial `isOpen = propOpen || signalState.open`, `<FullscreenLoader open ms={500} />` stayed visible forever because `propOpen` remained `true` after the signal's 500ms timer fired. The `auto-closes after ms` test case in `FullscreenLoader.test.tsx` failed.
- **Fix:** When `ms` is provided alongside `propOpen`, delegate visibility entirely to the signal (`propDrivenOpen = propOpen && !(typeof ms === 'number' && ms > 0)`). `open` still triggers the signal via the effect; the signal now exclusively owns the visibility lifecycle in the ms-driven path. The other OR-semantics cases (signal-only, prop-only-without-ms) remain unchanged.
- **Files modified:** `FullscreenLoader.tsx` (visibility expression + comment).
- **Commit:** `362872b9`.
- **Rationale:** The plan's behavior table explicitly requires `<FullscreenLoader open ms={500} />` to auto-close after 500ms — the only way to make that consistent with OR-semantics is for the ms path to route through the signal, which is the "both APIs converge" promise of D-04.

**2. [Rule 1 – Bug] Unused `@ts-expect-error` directive on WebkitBackdropFilter**
- **Found during:** Task 03-3 typecheck gate
- **Issue:** React 19's `CSSProperties` already types `WebkitBackdropFilter`, so the `@ts-expect-error` directive was unused → `TS2578: Unused '@ts-expect-error' directive`.
- **Fix:** Removed the directive; the vendor-prefixed key remains.
- **Commit:** `362872b9`.

### Additions beyond plan (Rule 2)

- Added `getServerSnapshot()` export (not in the plan's listed exports but required by the plan's SSR-safety claim) and wired it as the third argument to `useSyncExternalStore`. Without it, `useSyncExternalStore` would call `getSnapshot` during SSR and receive a mutable singleton — React 19 would warn.
- Added `__resetGlobeLoaderSignalForTests` export so specs can reset between runs without module reloading (used in `FullscreenLoader.test.tsx` + `FullscreenLoader.backdrop.test.tsx`).
- Exported signal helpers from the barrel (`showGlobeLoader`, `subscribeGlobeLoader`, etc.) so Phase 38 consumers can re-trigger the splash without reaching into the signal module directly.

## Required Report Points (from <output>)

- **globeLoaderSignal.ts LOC:** 67
- **FullscreenLoader.tsx LOC:** 107
- **vi.stubEnv caveats:** none surfaced — Vitest's `stubEnv('DEV', boolean)` + `resetModules()` + `await import(...)` works as documented. Cleanup in `afterEach` deletes the global and calls `vi.unstubAllEnvs()` so test ordering is independent. No production code touched `globalThis`.
- **`pointer-events: none` preserved on overlay root:** confirmed at `FullscreenLoader.tsx:91`.

## Self-Check: PASSED

- File `frontend/src/components/signature-visuals/globeLoaderSignal.ts` — FOUND
- File `frontend/src/components/signature-visuals/FullscreenLoader.tsx` — FOUND
- File `frontend/src/components/signature-visuals/__tests__/FullscreenLoader.test.tsx` — FOUND
- File `frontend/src/components/signature-visuals/__tests__/FullscreenLoader.devGate.test.tsx` — FOUND
- File `frontend/src/components/signature-visuals/__tests__/FullscreenLoader.backdrop.test.tsx` — FOUND
- Commit `9c98e8ae` — FOUND (feat 37-03 signal)
- Commit `bd25f1cf` — FOUND (test 37-03 RED)
- Commit `362872b9` — FOUND (feat 37-03 GREEN)
- All 9 tests GREEN across 3 files
- Typecheck clean for signature-visuals/**

## TDD Gate Compliance

- RED commit `bd25f1cf` (`test(37-03)`) — verified failing with "Cannot find module '../FullscreenLoader'".
- GREEN commit `362872b9` (`feat(37-03)`) — all 9 tests pass.
- REFACTOR: not required; no cleanup pass needed.
