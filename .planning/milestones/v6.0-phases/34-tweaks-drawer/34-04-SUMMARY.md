---
phase: 34
plan: 04
plan_id: 34-04
subsystem: design-system
tags: [tweaks-drawer, heroui-v3, rtl, theme-01]
wave: 2
depends_on: [34-01, 34-02, 34-03]
requirements: [THEME-01]
dependency_graph:
  requires:
    - frontend/src/design-system/DesignProvider.tsx
    - frontend/src/design-system/directionDefaults.ts
    - frontend/src/design-system/hooks/index.ts
  provides:
    - frontend/src/components/tweaks/TweaksDrawer.tsx
    - frontend/src/components/tweaks/TweaksDisclosureProvider.tsx
    - frontend/src/components/tweaks/use-tweaks-open.ts
    - frontend/src/components/tweaks/index.ts
  affects:
    - frontend/src/App.tsx
    - frontend/src/i18n/en/common.json
    - frontend/src/i18n/ar/common.json
tech_stack:
  added: []
  patterns:
    - HeroUI v3 Drawer with useOverlayState bridge
    - Dynamic placement flip for RTL (Pitfall 1)
    - D-16 atomic reset via batched React state updates
    - Local vi.mock override to restore real react-i18next when global stub is too narrow
key_files:
  created:
    - frontend/src/components/tweaks/TweaksDrawer.tsx
    - frontend/src/components/tweaks/TweaksDisclosureProvider.tsx
    - frontend/src/components/tweaks/use-tweaks-open.ts
    - frontend/src/components/tweaks/index.ts
  modified:
    - frontend/src/App.tsx
    - frontend/src/i18n/en/common.json
    - frontend/src/i18n/ar/common.json
    - frontend/src/i18n/label-parity.test.ts
    - frontend/src/components/tweaks/TweaksDrawer.test.tsx
decisions:
  - HeroUI v3.0.3 Drawer bridges disclosure state through useOverlayState({ isOpen, onOpenChange }) rather than top-level isOpen/onOpenChange props (the API doesn't exist at that level)
  - Native <input type=range> replaces HeroUI Slider — HeroUI's Slider is a compound primitive (Track/Fill/Thumb) without the size/classNames shortcut the plan template assumed
  - Native role=switch checkbox replaces HeroUI Switch — v3.0.3 Switch uses children as visual content and doesn't accept isSelected/onChange at root
  - TweaksDisclosureProvider wraps LanguageProvider (nested inside DesignProvider) so the drawer can consume DesignProvider hooks AND live inside RTLWrapper
  - Tests use toBeTruthy rather than toBeInTheDocument because @testing-library/jest-dom isn't installed in this repo
metrics:
  duration_minutes: 35
  tasks: 3
  files_changed: 9
  tests_added: 4
  tests_passing_total: 10
  completed_date: 2026-04-21
---

# Phase 34 Plan 04: TweaksDrawer Summary

HeroUI v3 Drawer wiring for the Tweaks surface — 6 sections (Direction, Mode, Hue, Density, Classification, Locale) backed by DesignProvider hooks, with disclosure state owned by a dedicated context so the Plan 34-06 gear trigger can flip `isOpen` without prop-drilling.

## What shipped

- `TweaksDisclosureProvider` + `useTweaksOpen()` — open/close/toggle context matching the TweaksDisclosure contract.
- `TweaksDrawer` — 6 sections per UI-SPEC copywriting contract, driven by `useDesignDirection`, `useMode`, `useHue`, `useDensity`, `useClassification`, `useLocale`.
- D-16 silent reset: clicking a Direction tile applies its `DIRECTION_DEFAULTS` (direction + mode + hue) atomically in one event handler; React batches the three state updates into one commit so no flicker ever reaches the DOM.
- Dynamic RTL placement: `placement={isRTL ? 'left' : 'right'}` keeps the drawer on the inline-end physical edge in both LTR and RTL per RESEARCH.md Pitfall 1.
- `tweaks.*` i18n namespace added to both `en/common.json` and `ar/common.json` with full parity (enforced by promoted `label-parity.test.ts`).
- Provider + drawer wired into `App.tsx` inside DesignProvider.

## Tests (10 passing)

```
src/i18n/label-parity.test.ts               2/2
src/components/tweaks/TweaksDrawer.test.tsx 2/2  (EN + AR headings)
src/components/tweaks/persistence.test.tsx  6/6  (unchanged, still green)
```

## Verification

- `pnpm exec vitest run src/i18n/label-parity src/components/tweaks` — 10/10 ✅
- `pnpm exec tsc --noEmit` — exit 0 for plan-owned files ✅
  (remaining errors are pre-existing in `sla-calculator.ts` and `storage/preference-storage.ts`)
- `pnpm build` — built in 11.04s ✅
- Grep: zero physical CSS in TweaksDrawer ✅
- Grep: flat HeroUI imports (`from '@heroui/react'`) ✅
- Grep: dynamic placement ✅
- Grep: `dir="ltr"` on degree readout ✅
- Grep: `min-h-11` appears 4× (touch targets) ✅
- File size: 286 lines (> 150 min) ✅

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] HeroUI v3.0.3 Drawer API mismatch**

- **Found during:** Task 2, typecheck after first implementation
- **Issue:** The plan template used `<Drawer isOpen={} onOpenChange={} placement={}>` with `Slider` and `Switch` as flat components. In HeroUI v3.0.3 the actual API is:
  - `Drawer` accepts a `state` prop fed by `useOverlayState({ isOpen, onOpenChange })` — no top-level `isOpen`/`onOpenChange`
  - `DrawerContent` owns `placement` (not `Drawer`)
  - `Slider` is a compound primitive (Track/Fill/Thumb) — no `size`/`classNames` shortcuts
  - `Switch` uses `children` for visual content; doesn't accept `isSelected`/`onChange` on root
- **Fix:** Bridged disclosure state through `useOverlayState`, moved `placement` to `DrawerContent`, replaced `Slider` with native `<input type="range">` and `Switch` with `<input type="checkbox" role="switch">`. Both natives are accessible out of the box, RTL-safe, and TS-strict.
- **Files modified:** `frontend/src/components/tweaks/TweaksDrawer.tsx`
- **Commit:** b5c72b95

**2. [Rule 3 - Blocking] Global react-i18next test stub misses initReactI18next**

- **Found during:** Task 2, first GREEN attempt
- **Issue:** `tests/setup.ts` replaces the entire `react-i18next` module with a translation lookup stub. This stub omits `initReactI18next`, `I18nextProvider`, and `Trans`. Importing `@/i18n` from a test file blows up because i18n calls `.use(initReactI18next)`.
- **Fix:** `vi.mock('react-i18next', async () => await vi.importActual(...))` at the top of the test file restores the real surface for this one file only. Other suites keep their stubbed behavior.
- **Files modified:** `frontend/src/components/tweaks/TweaksDrawer.test.tsx`
- **Commit:** b5c72b95

**3. [Rule 3 - Blocking] `toBeInTheDocument` matcher not registered**

- **Found during:** Task 2, second GREEN attempt
- **Issue:** `@testing-library/jest-dom` isn't installed in this repo, so the custom matcher doesn't extend Chai. Tests failed with "Invalid Chai property: toBeInTheDocument".
- **Fix:** Replaced `.toBeInTheDocument()` with `.toBeTruthy()` — `getByText`/`findByText` already throw when no match, so truthy is sufficient.
- **Files modified:** `frontend/src/components/tweaks/TweaksDrawer.test.tsx`
- **Commit:** b5c72b95

### Translation-file additions

- `frontend/src/i18n/en/common.json` — added top-level `tweaks.*` namespace (17 leaf keys)
- `frontend/src/i18n/ar/common.json` — mirrored the same 17 keys with Arabic translations

### HeroUI v3 component choices

- **Drawer / DrawerContent / DrawerHeader / DrawerBody** — kept flat imports (the compound `Drawer.Content` form also exists; flat exports are re-exported from the same module, so both are valid).
- **Slider** — replaced with native `<input type="range">` (see Deviation 1).
- **Switch** — replaced with native `<input type="checkbox" role="switch">` (see Deviation 1).

## Commits

| SHA        | Type | Description                                                |
| ---------- | ---- | ---------------------------------------------------------- |
| `f0e5fc9b` | feat | Task 1 — TweaksDisclosureProvider + useTweaksOpen + barrel |
| `4f0bcdd5` | test | Task 2 RED — promote TweaksDrawer + label-parity tests     |
| `b5c72b95` | feat | Task 2 GREEN — implement TweaksDrawer with 6 sections      |
| `a71a8553` | feat | Task 3 — wire provider + drawer into App.tsx               |

## Known Stubs

None. All 6 sections are wired to real DesignProvider hooks. Hue presets use the 5 UI-SPEC canonical values (22/158/190/258/330). Direction defaults come from Plan 34-02's imported map (not duplicated).

## Follow-on plans

- **34-06**: SiteHeader gear — imports `useTweaksOpen` from this plan's barrel to drive the open trigger
- **34-05 / 34-07 / 34-08**: remaining Phase 34 waves pick up once this drawer and the gear are in place

## Self-Check

- [x] FOUND: frontend/src/components/tweaks/TweaksDrawer.tsx (286 lines)
- [x] FOUND: frontend/src/components/tweaks/TweaksDisclosureProvider.tsx
- [x] FOUND: frontend/src/components/tweaks/use-tweaks-open.ts
- [x] FOUND: frontend/src/components/tweaks/index.ts
- [x] FOUND: frontend/src/i18n/label-parity.test.ts (live, not scaffold)
- [x] FOUND: frontend/src/components/tweaks/TweaksDrawer.test.tsx (live, not scaffold)
- [x] FOUND: tweaks keys in frontend/src/i18n/en/common.json + ar/common.json
- [x] FOUND: App.tsx wrapped in TweaksDisclosureProvider with TweaksDrawer rendered
- [x] FOUND: commits f0e5fc9b, 4f0bcdd5, b5c72b95, a71a8553 in git log
- [x] Tests 10/10 passing, typecheck clean for plan-owned files, build succeeds

## Self-Check: PASSED
