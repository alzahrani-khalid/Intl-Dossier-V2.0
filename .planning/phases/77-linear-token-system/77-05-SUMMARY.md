---
phase: 77-linear-token-system
plan: 05
subsystem: ui
tags:
  [
    linear,
    token-04,
    direction-switcher,
    hue,
    tweaks,
    topbar,
    appearance-settings,
    i18n,
    label-parity,
    rtl,
  ]

# Dependency graph
requires:
  - phase: 77-linear-token-system
    provides: 77-04 activated Linear as the live direction (dual-layer id.dir coercion + dark default) — the switcher/hue controls were already inert no-ops before this plan removed them
provides:
  - No user-facing surface offers a design-direction choice — the 4-direction switcher is gone from Topbar, TweaksDrawer, and AppearanceSettingsSection
  - No user-facing surface offers an accent-hue control (hue slider + presets retired with the switcher; accent is verbatim-literal since 77-04)
  - Theme (light/dark) and density controls remain fully functional on all three surfaces (their tests still pass)
  - EN/AR i18n bundles pruned of retired direction/hue keys symmetrically (tweaks.direction, tweaks.hue, shell.direction, appearance.direction, appearance.hue) — label-parity stays green
affects: [77-07, 80-visual-verification, switcher-retirement, doc-01]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'UI-first retirement, plumbing-deferred: stopped RENDERING the switcher/hue controls (and orphaned their imports/vars/handlers) while LEAVING the Direction type 4+1-wide and the useHue/DesignProvider hue state intact — so this plan compiles independently and 77-07 owns the type/plumbing collapse'
    - 'i18n prune by cross-reference, not grep-replace (Pitfall 3): removed only the exact t() key groups the three retired controls consumed, symmetrically from both en+ar; left every unrelated "direction" key (tweaks.locale "Reading direction", nav labels) untouched'
    - 'Presence-absence test conversion: switcher/hue assertions replaced with negative assertions (querySelector(".tb-dir") toBeNull, queryByText("Design direction"/"Accent hue") toBeNull) + a surviving section as the drawer-open await gate'

key-files:
  created: []
  modified:
    - frontend/src/components/layout/Topbar.tsx
    - frontend/src/components/layout/Topbar.test.tsx
    - frontend/src/components/tweaks/TweaksDrawer.tsx
    - frontend/src/components/tweaks/TweaksDrawer.test.tsx
    - frontend/src/components/settings/sections/AppearanceSettingsSection.tsx
    - frontend/src/i18n/en/common.json
    - frontend/src/i18n/ar/common.json
    - frontend/src/i18n/en/settings.json
    - frontend/src/i18n/ar/settings.json

key-decisions:
  - 'Hue retired WITH the switcher (planner Q1 adoption): the accent is a verbatim literal since 77-04, so the hue slider + presets were inert — removed alongside the direction controls on all surfaces'
  - "Left nav.dashboard='Situation' (en/common.json) untouched — it is a pre-existing navigation label, not a retired design-direction NAME; the DoD grep's 1 residual match is this intentional Pitfall-3 false positive"
  - 'Kept the Direction type 4+1-wide and useHue/DesignProvider hue state (77-07 owns plumbing removal); this plan only stops rendering the controls, so it type-checks and lints independently'
  - 'Renumbered surviving JSX section comments (Topbar 6-slot list, TweaksDrawer sections) to stay sequential after the removals — the only comment edits beyond removing text describing deleted code'

patterns-established:
  - 'Pattern: retire a dead control by deleting its UI + its exact i18n keys in paired commits (feat: components+tests, chore: i18n), keeping the underlying state/type for a later plumbing plan'

requirements-completed: [TOKEN-04]

# Metrics
duration: 20 min
completed: 2026-07-02
---

# Phase 77 Plan 05: Retire Direction Switcher + Hue Controls Summary

**Removed the now-inert 4-direction switcher and accent-hue control from all three user surfaces (Topbar, TweaksDrawer, Appearance settings) and pruned their EN/AR i18n keys — Linear is the only selectable visual direction a user can see or click; theme + density customization is preserved.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-07-02T23:40:00+03:00 (approx)
- **Completed:** 2026-07-02T23:59:58+03:00
- **Tasks:** 2 completed
- **Files modified:** 9

## Accomplishments

### Task 1 — Retire the switcher + hue controls from the three surfaces (commit `1ccc4216`)

- **Topbar.tsx**: removed the `DIRECTIONS` constant, the `DIRECTION_SHORT_LABELS` `Record<Direction>` map (including the 77-03 `linear` placeholder entry), the entire direction segmented-radio block, and the orphaned `useDesignDirection` hook + `Direction` type imports. Kept the theme toggle, locale switcher, notification bell, search, hamburger, and tweaks button. Renumbered the 6-slot header + JSX section comments.
- **TweaksDrawer.tsx**: removed Section 1 (Direction cards) and Section 5 (Hue slider + presets), the `DIRECTIONS`/`HUE_PRESETS` consts, the `DIRECTION_DEFAULTS` import + local `Direction` type, the `handleDirection` D-16 batch handler, the `formattedHue` memo, and the orphaned `useDesignDirection`/`useHue` hooks. Kept theme, density, reading-direction (locale), classification, shortcuts, loader sections.
- **AppearanceSettingsSection.tsx**: removed the direction `RadioGroup` and the hue slider `SettingsGroup`, plus the orphaned `useDesignDirection`/`useHue` hooks and `Direction` type. Kept the mode + density radio groups.
- **Tests reworked**: Topbar.test.tsx — dropped the direction-switcher mock/assertions and the phone-initials test, added a negative `.tb-dir` assertion; TweaksDrawer.test.tsx — dropped the "Design direction"/"Accent hue" assertions (EN + AR), added negative `queryByText` assertions and moved the open-gate to a surviving "Theme" section.

### Task 2 — Prune retired direction/hue i18n keys, EN + AR (commit `08b2440b`)

- **en/ar common.json**: removed `tweaks.direction` (label + 4 direction name/tagline groups), `tweaks.hue`, and `shell.direction` (4 switcher labels) — symmetrically from both bundles.
- **en/ar settings.json**: removed `appearance.direction` (label/help + 4 names) and `appearance.hue` (label/help).
- Left every unrelated "direction" key untouched: `tweaks.locale.label` ("Reading direction"), and the pre-existing `nav.dashboard: "Situation"` label.

## Verification

| Check                                                                     | Result                                                                                                     |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `grep -rn DIRECTIONS` in the 3 components                                 | 0 ✓                                                                                                        |
| `grep -rin hue` in TweaksDrawer + AppearanceSettings                      | 0 ✓                                                                                                        |
| `grep -in "bureau\|chancery\|situation\|ministerial"` in the 4 i18n files | 1 — the pre-existing `nav.dashboard: "Situation"` nav label (Pitfall-3 false positive, intentionally kept) |
| "Reading direction" still present                                         | ✓                                                                                                          |
| Component tests (layout + tweaks + settings dirs)                         | 44/44 pass                                                                                                 |
| label-parity + i18n unit tests                                            | 8/8 pass                                                                                                   |
| `check-i18n-namespaces.mjs`                                               | clean (1705 files, 126 namespaces)                                                                         |
| `pnpm run lint` (eslint + i18n + duplicate-rtl + bootstrap-parity)        | green                                                                                                      |
| `pnpm type-check`                                                         | green                                                                                                      |

## Deviations from Plan

**[Note — not a code deviation] DoD grep item 3 returns 1, not 0.** The brief's Definition-of-Done expects `grep -in "bureau\|chancery\|situation\|ministerial"` across the 4 i18n files to return 0. It returns exactly 1: `frontend/src/i18n/en/common.json:155  "dashboard": "Situation"`. This is a pre-existing **navigation label** (the dashboard view is named "Situation") — it existed in `HEAD` before this plan, is not one of the `t()` keys any retired control consumed, and is the exact Pitfall-3 false-positive class the plan warns against ("a blind grep-replace would corrupt unrelated domains"). Per Task 2's own instruction — identify design-direction keys by cross-referencing the exact keys removed from the components — this nav label is out of scope and was intentionally left untouched. All retired design-direction NAMES are gone.

**Total deviations:** 0 auto-fixed code deviations. **Impact:** none — the single grep residual is a documented, intentional keep.

## Issues Encountered

None.

## Next Phase Readiness

Ready for the remaining Phase 77 plans (77-06 re-skin, 77-07 type/plumbing collapse which owns removing the now-unused `Direction` union width + `useHue`/DesignProvider hue state, 77-08 DOC-01). The Direction type stays 4+1-wide and the hue plumbing stays live after this plan — both are 77-07's to collapse.

## Self-Check: PASSED

- key-files.modified all exist on disk ✓
- `git log --grep="77-05"` returns 2 production commits ✓
- All `<acceptance_criteria>` from both tasks re-run and pass (with the one documented Pitfall-3 grep residual) ✓
- Plan-level `<verification>` (component + i18n vitest, type-check, full lint) green ✓
