---
phase: 34
plan: 03
plan_id: 34-03
subsystem: design-system
tags: [theme, localStorage, hooks, rtl, i18n]
requires:
  - 34-01 # Wave 0 scaffolds (persistence.test.tsx skip)
  - 33-02 # DesignProvider + safe-storage helpers
provides:
  - useClassification hook
  - useLocale hook
  - DesignContext: classif + locale state
affects:
  - plan-04 (TweaksDrawer will consume all 6 hooks)
tech-stack:
  added: []
  patterns:
    - 'Pattern S-3 (safe localStorage read/write) extended to classif + locale'
    - 'Dynamic import of @/i18n in setLocale to avoid circular dep'
    - 'Sanitising initial reads (T-34-01): exact-string match, fall back on mismatch'
key-files:
  created:
    - frontend/src/design-system/hooks/useClassification.ts
    - frontend/src/design-system/hooks/useLocale.ts
    - frontend/src/design-system/hooks/index.ts
  modified:
    - frontend/src/design-system/DesignProvider.tsx
    - frontend/src/components/tweaks/persistence.test.tsx
key-decisions:
  - 'Dynamic import of @/i18n in setLocale (not static import) to break the circular dep between DesignProvider bootstrap and i18n init'
  - 'id.classif stored as literal "true"/"false" strings (not JSON) to match Phase 33 key formats'
  - 'Unknown classif values coerce to false (strict "true" check) — T-34-01 mitigation'
  - 'Locale setter updates document.documentElement.lang + dir synchronously; i18n.changeLanguage is fire-and-forget (void)'
requirements-completed: [THEME-02]
duration: '~15 min'
completed: '2026-04-21'
---

# Phase 34 Plan 03: Classification + Locale Hooks Summary

Wires `id.classif` (boolean toggle) and `id.locale` (`'en'|'ar'`) into DesignProvider and exposes them through `useClassification()` and `useLocale()` hooks that mirror the Phase 33 `useMode`/`useHue` signature shape. `useLocale`'s setter also flips `document.documentElement.lang`/`dir` and calls `i18n.changeLanguage`.

## What shipped

- **2 new hooks** (`useClassification`, `useLocale`) with the same `{ value, setValue }` contract as the Phase 33 hooks — consumers import from `@/design-system/hooks/useClassification` or the new barrel `@/design-system/hooks`.
- **Barrel export** at `frontend/src/design-system/hooks/index.ts` re-exporting all 7 hooks (5 Phase 33 + 2 new) and 3 result types (`UseModeResult`, `UseClassificationResult`, `UseLocaleResult` + `Locale`).
- **DesignProvider augmented** with `classif: boolean`, `locale: 'en'|'ar'`, their setters, cross-tab `storage` event handling for both new keys, and two new `LS_*` constants. Phase 33 API (direction/mode/hue/density) unchanged.
- **Persistence test promoted** from `describe.skip`/`it.todo` to 6 live `it(...)` covering round-trip, garbage-value sanitising (T-34-01), and SecurityError swallow (T-34-03).

## Metrics

| Metric            | Value                                                |
| ----------------- | ---------------------------------------------------- |
| Tasks completed   | 1/1 (TDD: RED → GREEN, no REFACTOR needed)           |
| Files created     | 3                                                    |
| Files modified    | 2                                                    |
| Tests added       | 6 (was: 0 live, 9 skipped todos)                     |
| Tests passing     | 6/6 persistence + 5/5 design-system (zero regression)|
| Typecheck         | Clean in plan-owned files                            |
| Duration          | ~15 min                                              |
| Start → end (UTC) | 2026-04-21T22:32:00Z → 2026-04-21T22:36:00Z          |

## Commits

| Phase  | SHA      | Message                                                              |
| ------ | -------- | -------------------------------------------------------------------- |
| RED    | 72e7d566 | test(34-03): add failing tests for useClassification + useLocale     |
| GREEN  | 06264830 | feat(34-03): add useClassification + useLocale hooks to DesignProvider |

## Must-haves verification

| Must-have truth                                                           | Status | Evidence                                                         |
| ------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------- |
| `id.classif` boolean round-trips as `'true'`/`'false'`                    | PASS   | Tests 1-2 in persistence.test.tsx                                |
| `id.locale` persists + flips `<html lang/dir>` + calls `i18n.changeLanguage` | PASS | Test 3 (round-trip), DesignProvider.setLocale implementation     |
| Garbage values fall back to defaults (T-34-01)                            | PASS   | Tests 4-5 (`'fr'` → `'en'`, `'yes'` → `false`)                   |
| SecurityError on setItem swallowed (T-34-03)                              | PASS   | Test 6; reuses existing `safeSetItem` from Phase 33              |
| Hooks follow `useMode`/`useHue` signature shape                           | PASS   | Grep: both return `{ value, setValue }` via `useContext(DesignContext)` |

## Threat register

| Threat ID | Disposition | Verification                                                                                      |
| --------- | ----------- | ------------------------------------------------------------------------------------------------- |
| T-34-01   | MITIGATED   | Initial `useState` lazy initialisers gate on exact-match strings; see `isLocale` + classif check |
| T-34-03   | MITIGATED   | All writes route through `safeSetItem` (Phase 33 helper, wraps `try/catch`)                       |
| T-34-02   | PARTIAL     | This plan respects existing `id.locale`; idempotent migrator still owned by Plan 05               |

## Deviations from Plan

### Minor additions beyond the plan text (Rule 2 — correctness)

**1. Added `initialClassif` + `initialLocale` props to `DesignProviderProps`**

- **Rationale:** Phase 33 Provider exposes `initialDirection`/`initialMode`/`initialHue`/`initialDensity` as overridable defaults. Adding the two new fields maintains API symmetry and lets tests or Storybook stories inject initial values. Zero behavioural change when omitted (defaults `false` / `'en'`).
- **Files:** `DesignProvider.tsx` (DesignProviderProps interface + destructuring).
- **Not in plan, but consistent with Phase 33 pattern.**

**2. Added cross-tab `storage` event handling for LS_CLASSIF + LS_LOCALE**

- **Rationale:** Phase 33 Provider already syncs direction/mode/hue/density across tabs via `storage` events. Omitting classif + locale would create inconsistent behaviour (switching locale in tab A wouldn't sync to tab B). One `else if` branch per new key.
- **Files:** `DesignProvider.tsx` (handleStorage).

**3. Dispatched `designChange` CustomEvent on setClassif + setLocale**

- **Rationale:** Phase 33 setters dispatch this event for non-React listeners (Storybook, Playwright hooks). Symmetry.
- **Files:** `DesignProvider.tsx`.

### None of the above change the plan contract

All 6 persistence tests pass, Phase 33 tests untouched, acceptance criteria met.

**Total deviations:** 3 auto-fixed under Rule 2 (API symmetry + correctness). Impact: zero breaking changes; purely additive.

## Authentication gates

None.

## Known stubs

None — hooks are complete and wired. Plan 04 (TweaksDrawer) will consume them as designed.

## Threat flags

None — no new trust boundaries introduced beyond those already documented in the plan's `<threat_model>`.

## TDD Gate Compliance

- RED gate: commit `72e7d566` contains only `test(34-03)` — verified failing via Vite import-resolution error (hook files did not exist).
- GREEN gate: commit `06264830` adds implementation — verified passing via `pnpm exec vitest run src/components/tweaks/persistence.test.tsx` (6/6).
- REFACTOR gate: skipped — implementation is already minimal; no duplication to extract.

## Self-Check: PASSED

- `[ -f frontend/src/design-system/hooks/useClassification.ts ]` → FOUND
- `[ -f frontend/src/design-system/hooks/useLocale.ts ]` → FOUND
- `[ -f frontend/src/design-system/hooks/index.ts ]` → FOUND
- Commit `72e7d566` in `git log` → FOUND
- Commit `06264830` in `git log` → FOUND
- Persistence tests 6/6 passing → VERIFIED
- Phase 33 design-system tests 5/5 passing → VERIFIED
- Typecheck clean in plan-owned files → VERIFIED

Ready for Plan 04 (TweaksDrawer composition).
