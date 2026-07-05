---
phase: 85-linear-taste-refinements-f16-f21
plan: 03
subsystem: ui
tags: [settings, navigation, linear-design, tokens, rtl]

# Dependency graph
requires:
  - phase: 77-linear-migration
    provides: Linear surface ladder (--surface-raised) + ink tokens (--ink); accent reserved for primary actions
provides:
  - F17 — settings sub-nav active item is a neutral gray pill (var(--surface-raised)/var(--ink)) with the 2px accent ::before stripe kept, so accent (indigo) reads only as primary-button / on-toggle signal
affects: [settings, settings-render-signoff]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Neutral-fill nav active state = surface-ladder fill + kept accent ::before stripe (color = meaning; accent is not decorative)

key-files:
  created: []
  modified:
    - frontend/src/index.css

key-decisions:
  - 'Edited ONLY the two declarations in .settings-nav.active (background var(--accent-soft)->var(--surface-raised), color var(--accent-ink)->var(--ink)); the ::before 2px var(--accent) stripe (inset-inline-start) left byte-identical'
  - 'Left the mobile media-query block (index.css:940-945) untouched — its var(--accent-ink) bottom-border is a separate mobile tab-underline indicator, out of this plans two-declaration scope'
  - 'Sidebar.tsx left untouched per plan default — its active pill is ALREADY neutral (color-mix(sidebar-ink 10%)) with a correct accent stripe; swapping it to var(--surface-raised) would be near-invisible on the light sidebar (#f6f7f7 fill on #f5f6f6 bg). Recorded as an OPEN sign-off question, not forced.'

patterns-established:
  - 'Nav active = neutral surface-ladder fill + accent stripe (never accent fill)'

requirements-completed: [TASTE-02]

# Metrics
duration: ~8min
completed: 2026-07-05
---

# Phase 85 Plan 03: Neutralize active-nav fill (F17/TASTE-02) Summary

**`.settings-nav.active` swapped from an indigo `var(--accent-soft)` fill to a neutral `var(--surface-raised)`/`var(--ink)` gray pill, keeping the 2px `var(--accent)` inline-start stripe verbatim — so accent (indigo) now reads only as the primary-button / on-toggle signal, not as nav decoration.**

## What was built

Task 1 (auto) — one surgical two-declaration edit to `frontend/src/index.css` at the `.settings-nav.active` rule (lines 795-798):

- `background: var(--accent-soft)` → `background: var(--surface-raised)`
- `color: var(--accent-ink)` → `color: var(--ink)`

The `.settings-nav.active::before` block (2px `var(--accent)` stripe, anchored via `inset-inline-start: 0`) was left byte-identical — it is the kept accent signal per D-85-07 and is already RTL-correct (logical property, sits at the inline-start edge in both LTR and RTL).

## Decisions

- **Scope held to two declarations.** The mobile responsive media-query block (`index.css:940-945`) applies a `border-block-end: 2px solid var(--accent-ink)` tab-underline for the horizontal-scroll settings nav on narrow widths. That is a distinct mobile indicator, not the desktop pill fill, and the plan's acceptance criteria demand the diff show only the two-declaration change — so it was left untouched.
- **Sidebar.tsx left untouched (plan default).** Per the verified pattern map, the main app sidebar's active item is already neutral — `bg-[color-mix(in_srgb,var(--sidebar-ink)_10%,transparent)]` with a correct `before:bg-[var(--accent)]` 2px `before:start-0` stripe — so F17's intent is already satisfied there. The optional token-ladder cleanup (color-mix → `var(--surface-raised)`) is a judgment call with a real light-mode risk: DESIGN.md token math puts light `--surface-raised` (#f6f7f7) one rgb unit off the light sidebar bg (#f5f6f6), making the pill near-invisible. It was NOT applied; it is recorded as an open sign-off question below.

## Deviations from Plan

None — plan executed exactly as written. Task 1 is the only `type="auto"` task; the two-declaration edit landed, the `::before` stripe is intact, Sidebar.tsx is untouched (`git diff --quiet` exit 0), and no raw hex or Tailwind color literals were introduced.

## Verification

- `cd frontend && pnpm type-check` → exit 0 (tsc --noEmit clean)
- `cd frontend && pnpm build` → `✓ built in 11.23s` (the >500 kB chunk-size warning is pre-existing and unrelated to this CSS change — out of scope)
- `git diff frontend/src/index.css` → exactly the two changed declarations inside `.settings-nav.active`; `::before` block unchanged
- `git diff --quiet -- frontend/src/components/layout/Sidebar.tsx` → exit 0 (untouched)
- No touched-area unit tests exist for this CSS-only rule; visual parity is the human gate below.

## Checkpoint status (Task 2 — human render-parity sign-off)

**Deferred to the orchestrator's consolidated post-merge render sign-off.** This plan's Task 2 is a `checkpoint:human-verify` blocking gate (active-nav pills across dark/light × EN/AR, plus the sidebar discretion call). As a non-interactive sequential subagent I did not execute, block on, or self-certify it. The orchestrator owns a single consolidated human render-parity walk across all four Phase-85 plans, run on the assembled running app after merge.

## Open sign-off questions (for the consolidated walk)

1. **Light-mode legibility of the neutral settings pill.** Confirm the `var(--surface-raised)` fill still reads against the settings nav background in light mode (it sits on `--surface`/`--bg`, not the near-white sidebar, so it should be fine — verify, don't assume).
2. **Sidebar active-fill discretion.** Keep the current `color-mix(sidebar-ink 10%)` fill (recommended — visibly distinct in BOTH color modes) or swap to `var(--surface-raised)` for token-ladder purity (near-invisible in light mode). Default applied: keep as-is. If the user elects the swap at the walk, it is a single className token change at `Sidebar.tsx:167` + a light-mode re-verify.
3. **RTL stripe placement.** Confirm the accent stripe sits on the RIGHT edge of the active pill under `?lng=ar` (inset-inline-start resolves to the right in RTL).

## Self-Check: PASSED

- `frontend/src/index.css` `.settings-nav.active` → `background: var(--surface-raised); color: var(--ink);` confirmed present; `accent-soft`/`accent-ink` removed from the rule.
- `::before` block intact (`inset-inline-start: 0`, `width: 2px`, `background: var(--accent)`).
- Task commit `6702189d` present on `gsd/v8.1-linear-design-refinement`.
- `frontend/src/components/layout/Sidebar.tsx` unmodified (`git diff --quiet` exit 0).
