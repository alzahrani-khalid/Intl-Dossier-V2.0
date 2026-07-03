---
phase: 77-linear-token-system
plan: 03
subsystem: design-tokens
tags: [linear, tokens, palette, wcag, culori, bootstrap, byte-match, token-03, directions]

# Dependency graph
requires:
  - phase: 77-linear-token-system
    provides: 77-01 pre-swap visual baseline (Bureau/light PNGs) — regression net for visual inertness
  - phase: 77-linear-token-system
    provides: 77-02 scripts/check-bootstrap-parity.mjs byte-match guard (was 24 combos)
  - phase: 33-design-system
    provides: token engine (tokens/{types,directions,buildTokens}.ts + public/bootstrap.js)
provides:
  - PALETTES.linear (verbatim Linear dark set + fully-derived light set + TOKEN-03 gap palettes) + FONTS.linear (registered 'Inter Variable' / 'JetBrains Mono Variable')
  - byte-matched linear P/F entries in bootstrap.js (parity guard now 30 combos)
  - buildTokens palette-literal preference (accent/semantic/sla/status/new-tier emission) with legacy hue-math preserved byte-identical
  - tests/unit/design-system/contrast.test.ts — committed culori WCAG-AA proof (dark + light)
affects: [77-04, 77-06, 77-07, 77-08, linear-activation, linear-reskin]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Palette-literal preference in buildTokens: optional DirectionModePalette fields (accent/semantic/sla/status/surface3/surface4/inkTertiary/lineStrong) win when present; the four legacy directions omit them and keep the exact hue-math / mode-branched OKLCH output (byte-identical — existing 100-case suite is the net)'
    - 'TOKEN-03 derivation-with-proof: derive error/warning + 6 status-tag pairs (+ derived light set) with culori oklch()/formatHex() in the Linear surface band, store final hex as literals, and commit a wcagContrast() unit test so no value can drift below AA silently'
    - 'Three-copy widen discipline: directions.ts data + bootstrap.js ES5 mirror move in ONE commit so the parity guard stays green throughout'

key-files:
  created:
    - frontend/tests/unit/design-system/contrast.test.ts
  modified:
    - frontend/src/design-system/tokens/types.ts
    - frontend/src/design-system/tokens/directions.ts
    - frontend/public/bootstrap.js
    - frontend/src/design-system/tokens/buildTokens.ts
    - frontend/src/design-system/directionDefaults.ts
    - frontend/src/components/theme-error-boundary/ThemeErrorBoundary.tsx
    - frontend/src/types/settings.types.ts
    - frontend/src/pages/settings/SettingsPage.tsx
    - frontend/tests/unit/design-system/buildTokens.test.ts
    - frontend/src/components/layout/Topbar.tsx
    - frontend/src/components/layout/ClassificationBar.tsx

key-decisions:
  - "Widen-only, visually inert: 'linear' added as a 5th Direction across the union + every exhaustive Record<Direction>/switch/z.enum, but App.tsx defaults (initialDirection=bureau/light) and bootstrap default lines 9/10 are UNTOUCHED — activation (coercion + dark default) is Plan 77-04. All four legacy directions render byte-identically (216→235 design-system tests, existing 100 buildTokens assertions unchanged)."
  - 'Accent family = palette LITERALS (Q1): verbatim #5e6ad2 is unreproducible by oklch(58% 0.14 h); buildTokens emits it hue-independently, adds new --accent-hover #828fff. BuildInput.hue kept as the legacy-direction fallback (removal is 77-07).'
  - "--shadow-card = 'none' for linear (Q2), token kept for legacy directions to avoid unset-var fallout at consumers."
  - 'Hairline mapping deviation from STACK.md (see Deviations): --line=hairline #23252a; --line-soft=DERIVED softer; verbatim hairline-strong #34343a lands as the NEW lineStrong tier (NOT --line-soft, which STACK.md inverted).'

patterns-established:
  - 'Optional-field palette extension: DirectionModePalette gained optional surface3/surface4/inkTertiary/lineStrong/accent/semantic/sla/status so legacy entries stay valid while linear carries the full Linear ladder.'

requirements-completed: [TOKEN-01, TOKEN-03, TOKEN-02]

# Metrics
duration: ~25 min
completed: 2026-07-02
---

# Phase 77 Plan 03: Linear Token System — Widen (data layer) Summary

**Added `'linear'` as a fifth direction carrying the verbatim Linear dark palette, a fully-derived light set, and the TOKEN-03 gap palettes (form error/warning + 6 status tags) as palette literals — byte-mirrored into `bootstrap.js` in the same commit (parity 24→30 combos) — and taught `buildTokens` to prefer palette literals over the legacy hue-math while every legacy direction still renders byte-identically. Visually inert: defaults stay bureau/light (activation is 77-04).**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-07-02
- **Tasks:** 2 (both `type=auto`, no checkpoints)
- **Files:** 11 (1 created, 10 modified) across 2 atomic commits
- **Commits:** `0ba9c904` (Task 1 — widen + data + contrast proof), `53591495` (Task 2 — buildTokens engine + coverage)

## Verification (Definition of Done — all green)

| Gate                                      | Result                                                                                   |
| ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| `node scripts/check-bootstrap-parity.mjs` | OK — **30 combinations** (5 dirs × 2 modes × 3 densities), 21 vars each                  |
| `contrast.test.ts`                        | 50 tests pass — **52 wcagContrast AA assertions**, dark AND light                        |
| `buildTokens.test.ts`                     | 118 tests pass (100 legacy untouched + 18 new linear/no-leakage)                         |
| full `tests/unit/design-system`           | 235 tests, 8 files pass                                                                  |
| `pnpm type-check`                         | clean                                                                                    |
| `pnpm run lint`                           | clean (ESLint + i18n + duplicate-rtl + parity)                                           |
| App defaults                              | `initialDirection="bureau"` intact; bootstrap line 9 `'bureau'`, line 10 `'light'`       |
| Anchors                                   | `PALETTES.linear.dark.bg === '#010102'`; `FONTS.linear.body` contains `'Inter Variable'` |

## The derived light set (dark-canonical discipline)

Only 4 Linear light values exist verbatim (`inverse-canvas #ffffff`, `inverse-surface-1 #f5f6f6`, `inverse-surface-2 #f6f7f7`, `inverse-ink #000000`). Everything else was derived from the dark design intent and AA-verified:

| Field                         | Value                                                     | Notes                                                                  |
| ----------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------- |
| inkMute                       | `#4f5359`                                                 | 7.15:1 on surface, AA on bg + surface                                  |
| inkFaint                      | `#656970`                                                 | 5.09:1 on surface                                                      |
| line                          | `#dddee1`                                                 | hairline (not AA-gated)                                                |
| lineSoft                      | `#eaebed`                                                 | softer than `--line`                                                   |
| sidebar / sidebarInk          | `#f5f6f6` / `#14161a`                                     |                                                                        |
| surface3 / surface4           | `#eff0f2` / `#e6e8eb`                                     | Linear ladder tiers                                                    |
| inkTertiary / lineStrong      | `#83868e` / `#ccced1`                                     | verbatim-analog, NOT AA-gated                                          |
| accent.base/hover/fg/soft/ink | `#5e6ad2` / `#828fff` / `#ffffff` / `#e8edff` / `#4d57b7` | base+hover+fg brand-invariant across modes; soft/ink derived for light |

## Derived TOKEN-03 values + measured AA ratios (culori wcagContrast)

All text-role values clear WCAG AA (≥4.5:1) on **surface AND on their own soft wash**, both modes. `ok` dark is the verbatim `semantic-success #27a644`; everything else is derived (no error/warning hex exists in the Linear reference — a real derivation gap). Status hues: indigo 264 / cyan 200 / green 155 / amber 90 / orange 35 / magenta 330.

**Dark (surface `#0f1011`):**

| Role       | fg                                                          | on surface | on soft   |
| ---------- | ----------------------------------------------------------- | ---------- | --------- |
| danger     | `#e86154` (soft `#3c1713`)                                  | 5.69       | 4.73      |
| warn       | `#e1af4a` (soft `#302103`)                                  | 9.46       | 7.76      |
| ok         | `#27a644` (soft `#102b17`)                                  | 6.01       | 4.80      |
| info       | `#66a0ee` (soft `#0f2440`)                                  | 7.10       | 5.81      |
| status 1–6 | `#87adfa`/`#2ac4cc`/`#6ac48c`/`#cbaa4b`/`#ef9179`/`#d991d2` | 8.10–8.97  | 6.74–7.15 |

**Light (surface `#f5f6f6`):**

| Role       | fg                                                          | on surface | on soft   |
| ---------- | ----------------------------------------------------------- | ---------- | --------- |
| danger     | `#be241f` (soft `#ffeae6`)                                  | 5.60       | 5.25      |
| warn       | `#8c5500` (soft `#fceed6`)                                  | 5.68       | 5.37      |
| ok         | `#137738` (soft `#e4f6e6`)                                  | 5.21       | 5.00      |
| info       | `#1664bf` (soft `#e4f1ff`)                                  | 5.37       | 5.08      |
| status 1–6 | `#3458ac`/`#00737c`/`#007338`/`#7c5700`/`#9d381f`/`#873a82` | 5.18–6.56  | 4.98–6.14 |

SLA family (derived in the accent band, not gated by the contrast test but emitted from `palette.sla`): dark `ok #8998e9` / `risk #e1af4a` / `bad #e86154`; light `ok #4d57b7` / `risk #8c5500` / `bad #be241f`, each with a soft. `accent.fg #ffffff` on `accent.base #5e6ad2` = **4.70:1** (the verbatim Linear on-primary anchor — tightest AA pair in the whole set).

## Hairline-mapping deviation from STACK.md (for 77-08 → DESIGN.md)

STACK.md maps `--line-soft: #34343a` (Linear hairline-strong), which **inverts** the engine semantic — `--line-soft` is consumed everywhere as the _softer_ divider. Resolution (planner decision, honored here):

- `--line` = hairline `#23252a` (verbatim).
- `--line-soft` = a **DERIVED** value perceptibly softer than `--line` against surface-1 (`#1d1e21` dark / `#eaebed` light).
- The verbatim hairline-strong `#34343a` lands as a **NEW `lineStrong` tier** (emitted as `--line-strong`), used by the 77-06 re-skin recipes — NOT `--line-soft`.

All verbatim reference values still land; only the _name_ they map to changed.

## Unmapped verbatim extras (reserved — record for 77-08 DESIGN.md)

Present in the Linear reference but NOT emitted as tokens this phase (no consumer yet):

- `hairline-tertiary #3e3e44`
- `semantic-overlay #000000` (scrim)
- `brand-secure #7a7fad`

## Deviations from Plan

- **[Rule 2 — Missing critical] `Record<Direction>` / switch exhaustiveness beyond the plan's file list** — Found during: Task 1 type-check. Widening the `Direction` union broke two exhaustive consumers not enumerated in `files_modified`: `components/layout/Topbar.tsx` (`DIRECTION_SHORT_LABELS: Record<Direction, …>` — added a `linear` label `L`/`ل`, never rendered since linear is not in the switcher list) and `components/layout/ClassificationBar.tsx` (a `switch (direction)` with no default — added `linear` to the neutral-chip branch). Both are inert this plan. Fix verified: `pnpm type-check` clean. A follow-up lint fix (moving the ClassificationBar comment out from between stacked `case` labels to satisfy `no-fallthrough`) landed in the Task 2 commit. Commits: `0ba9c904`, `53591495`.

**Total deviations:** 1 auto-fixed (Rule 2, exhaustiveness). **Impact:** none on rendering — the two touched files gain inert `linear` branches only; all four legacy directions render byte-identically.

## Issues Encountered

None.

## Next Phase Readiness

Ready for **77-04** (activation: `id.dir` coercion + dark default). 77-04 flips activation without touching any palette value — the data layer, byte-match mirror, and AA proof are all in place. The parity guard's `COMPARISONS` table (77-02) can now be extended with the new tier/accent/semantic vars.

## Self-Check: PASSED
