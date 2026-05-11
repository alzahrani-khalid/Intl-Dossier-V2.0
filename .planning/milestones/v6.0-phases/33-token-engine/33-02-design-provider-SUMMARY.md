---
phase: 33-token-engine
plan: 02
subsystem: design-system
tags: [design-provider, react-context, hooks, localStorage, runtime-wiring]
requires:
  - 33-01 (token module)
provides:
  - frontend/src/design-system/DesignProvider.tsx
  - frontend/src/design-system/hooks/useDesignDirection.ts
  - frontend/src/design-system/hooks/useMode.ts
  - frontend/src/design-system/hooks/useHue.ts
  - frontend/src/design-system/hooks/useDensity.ts
  - frontend/src/design-system/hooks/useDesignTokens.ts
  - frontend/src/hooks/useDomDirection.ts
affects:
  - frontend/src/App.tsx (provider wrap)
  - frontend/src/components/ui/heroui-modal.tsx (import swap)
tech-stack:
  added: []
  patterns:
    [
      react-context,
      lazy-usestate,
      usememo-derived-state,
      useeffect-dom-writer,
      custom-event-dispatch,
      storage-event-sync,
    ]
key-files:
  created:
    - frontend/src/design-system/DesignProvider.tsx
    - frontend/src/design-system/hooks/useDesignDirection.ts
    - frontend/src/design-system/hooks/useMode.ts
    - frontend/src/design-system/hooks/useHue.ts
    - frontend/src/design-system/hooks/useDensity.ts
    - frontend/src/design-system/hooks/useDesignTokens.ts
    - frontend/src/hooks/useDomDirection.ts
    - frontend/tests/unit/design-system/DesignProvider.test.tsx
  modified:
    - frontend/src/App.tsx
    - frontend/src/components/ui/heroui-modal.tsx
decisions:
  - useDirection.ts kept as-is (not renamed) to avoid breaking 20+ downstream imports mid-wave; plan 33-07 performs the sweep-and-delete
  - DesignProvider nested inside legacy ThemeProvider rather than replacing it, so existing useTheme consumers continue working until 33-07
metrics:
  duration: ~30m
  completed: 2026-04-20
  tasks: 4
  files: 10
  tests_passing: 114/114 (design-system suite)
verdict: PASS
---

# Phase 33 Plan 02: DesignProvider + Hooks Summary

React runtime wiring for the pure token engine — a four-primitive (direction × mode × hue × density) context provider with localStorage persistence, cross-tab sync, and five consumer hooks.

## What Shipped

- **`DesignProvider`** (`frontend/src/design-system/DesignProvider.tsx`, 238 lines after lint): holds state for the four design primitives, persists each to `localStorage` under `id.dir / id.theme / id.hue / id.density`, derives the `TokenSet` via memoised `buildTokens`, flushes it to `:root` via `applyTokens`, toggles `.dark` on `<html>` for HeroUI v3, and exposes `data-direction` + `data-density` attributes for CSS selectors.
- **Five consumer hooks**: `useDesignDirection`, `useMode`, `useHue`, `useDensity`, `useDesignTokens`. Each throws with a descriptive error when used outside the provider.
- **`useDomDirection`** (`frontend/src/hooks/useDomDirection.ts`): the DOM writing-direction hook, namespaced away from the new design-system direction hook. `heroui-modal.tsx` migrated to use it.
- **App.tsx wiring**: `DesignProvider` wrapped below `ThemeProvider` with `chancery / light / hue=22 / comfortable` defaults.
- **18 new unit tests** (114 total in design-system suite) covering render, setters, cross-tab storage sync, and hook guards.

## Commits

| Commit     | Type     | Summary                                             |
| ---------- | -------- | --------------------------------------------------- |
| `1bba8f2e` | feat     | add DesignProvider + five design-system hooks       |
| `21a66427` | refactor | add useDomDirection hook, migrate heroui-modal      |
| `bcabb640` | feat     | wrap App with DesignProvider above LanguageProvider |
| `e1bff2d2` | test     | DesignProvider unit coverage (18 tests)             |

## Definition of Done

- [x] `DesignProvider` mounts without throwing; `App.tsx` renders with it
- [x] All 5 hooks return correct values and each throws outside provider
- [x] `pnpm --filter frontend test design-system/DesignProvider` passes all assertions (18/18 new; 114/114 total)
- [x] Scope files typecheck clean (design-system/\*\*, hooks/useDomDirection.ts, heroui-modal.tsx, App.tsx)
- [ ] `pnpm --filter frontend lint` — not run (pre-commit hooks applied prettier successfully; full lint pass deferred to 33-07 sweep)
- [ ] Manual `pnpm --filter frontend dev` verification — deferred to 33-09 E2E smoke
- [x] `heroui-modal.tsx` imports `useDomDirection`; legacy `@/hooks/useDirection` call-sites documented as 33-07 sweep targets
- [ ] RTL dev-server check — deferred to 33-09

## Deviations from Plan

### [Rule 3 - Blocker] Kept `useDirection.ts` in place instead of renaming

- **Found during:** Task 3 (rename step)
- **Issue:** Plan step 3 specified `git mv frontend/src/hooks/useDirection.ts → useDomDirection.ts`. A grep of the tree showed **20+ downstream call-sites** (PDFGeneratorButton, ForumDetailsDialog, VersionComparison, bottom-sheet, content-skeletons, etc.) that would break the frontend build immediately. The plan itself states call-site updates "live in Plan 33-07"; executing a physical rename here would strand them.
- **Fix:** Created `useDomDirection.ts` as a new file with the renamed export. Left `useDirection.ts` in place so downstream callers keep compiling. `heroui-modal.tsx` was migrated to `useDomDirection` per the plan. The legacy file + remaining 20+ call-sites become 33-07's sweep target.
- **Files modified:** `frontend/src/hooks/useDomDirection.ts` (new), `frontend/src/components/ui/heroui-modal.tsx` (import swap)
- **Impact:** DoD check `grep "from '@/hooks/useDirection'"` still shows 20+ hits. That's now an explicit 33-07 hand-off, not a 33-02 regression.

### Pre-existing `applyTokens.ts` type error (NOT fixed — out of scope)

- `frontend/src/design-system/tokens/applyTokens.ts:29` reports `TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string | null'` under `noUncheckedIndexedAccess`. This file is 33-01 territory and the plan guardrail explicitly forbids editing it. Logged for the 33-01 owner / 33-07 cleanup to pick up.

## Verification Evidence

- `pnpm exec vitest run tests/unit/design-system/DesignProvider.test.tsx` → **18/18 pass** (672ms).
- `pnpm exec vitest run tests/unit/design-system/` → **114/114 pass** (530ms, 3 files).
- `pnpm type-check` filtered for 33-02 scope files → clean. Pre-existing 33-01 error in `applyTokens.ts` noted above. All other reported errors are pre-existing TS6133/TS6196 unused-identifier warnings in unrelated files (`work-item.types.ts`, `sla-calculator.ts`, etc.) — not introduced by 33-02.

## Follow-ups for Downstream Plans

- **33-03 (FOUC bootstrap)**: read the same localStorage keys — `id.dir`, `id.theme`, `id.hue`, `id.density`. DesignProvider's `safeGetItem` fallback order (localStorage → prop default) is the contract to mirror in the inline `<script>`.
- **33-05 (HeroUI wrappers)**: can consume `useMode` / `useHue` to drive accent-aware wrappers. `.dark` class on `<html>` is already toggled; HeroUI v3 colour-scheme switching works without additional props.
- **33-06 (Tailwind remap)**: can key off `data-direction` and `data-density` attributes on `<html>` if direction-specific utilities are needed.
- **33-07 (legacy cut)**:
  1. Sweep the remaining 20+ `@/hooks/useDirection` imports → `@/hooks/useDomDirection` (grep list captured during execution).
  2. Delete `frontend/src/hooks/useDirection.ts`.
  3. Remove `ThemeProvider` wrap from `App.tsx` and install `useTheme` shim that reads from DesignProvider.
  4. Fix the pre-existing `applyTokens.ts:29` TS2345 (33-01 bleed-through).
- **33-08 (Storybook)**: wrap stories in `<DesignProvider>` directly (no need for a custom decorator — `useDesignTokens` gives docs-site live token tables for free).
- **33-09 (E2E verification)**: smoke the manual DoD items skipped here — reload persistence, Arabic RTL density round-trip, and the `window.dispatchEvent(new StorageEvent(...))` cross-tab scenario.

## Key Decisions

- **Context shape frozen**: 9 members — 4 primitives + `tokens` + 4 setters. No `toggle*` sugar (consumers can derive `setMode(mode === 'dark' ? 'light' : 'dark')` themselves).
- **`designChange` CustomEvent on every setter**: enables non-React listeners (Storybook docs, debug overlays) without polling.
- **`storage` listener validates with the same type guards used for lazy init**: malformed values from other tabs are silently ignored rather than crashing.
- **`useDesignTokens` has no setter**: tokens are derived; consumers mutate primitives instead. Prevents "someone set tokens but not hue, now they're inconsistent" bugs.

## Self-Check: PASSED

- [x] `frontend/src/design-system/DesignProvider.tsx` — exists
- [x] `frontend/src/design-system/hooks/useDesignDirection.ts` — exists
- [x] `frontend/src/design-system/hooks/useMode.ts` — exists
- [x] `frontend/src/design-system/hooks/useHue.ts` — exists
- [x] `frontend/src/design-system/hooks/useDensity.ts` — exists
- [x] `frontend/src/design-system/hooks/useDesignTokens.ts` — exists
- [x] `frontend/src/hooks/useDomDirection.ts` — exists
- [x] `frontend/tests/unit/design-system/DesignProvider.test.tsx` — exists
- [x] commit `1bba8f2e` — in git log
- [x] commit `21a66427` — in git log
- [x] commit `bcabb640` — in git log
- [x] commit `e1bff2d2` — in git log
