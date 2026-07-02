---
phase: 77-linear-token-system
plan: 08
subsystem: docs
tags: [docs, doc-01, linear, design-system, source-of-truth, md-01, lo-02, supersession]

# Dependency graph
requires:
  - phase: 77-06
    provides: 'Linear primitive recipes (flat cards/buttons, hairline borders, surface ladder, token radii) + carve-out decision table'
  - phase: 77-07
    provides: 'Collapsed single-direction engine end-state (Direction → linear, hue axis + directionDefaults/useHue deleted, 3-family fonts)'
provides:
  - 'Linear-authoritative docs: root /CLAUDE.md + frontend/CLAUDE.md + frontend/src/design-system/CLAUDE.md all describe Linear (dark-canonical, radii 6/8/12, surface-1..4 ladder, single direction, three-copy invariant + check-bootstrap-parity guard, coercion)'
  - 'frontend/DESIGN.md rewritten as the Linear spec — full dark + derived-light token tables (transcribed verbatim from directions.ts), semantic + SLA + 6-status palettes with measured AA ratios, hairline-strong mapping decision, reserved unmapped extras, Inter/JetBrains Variable type stack + Tajawal RTL cascade, radius ladder, recipe rules, engine contract'
  - 'inteldossier_handoff_design/ demoted to historical reference via a supersession banner (README.md top); no CLAUDE.md required-reading points new work at it'
  - 'Phase-76 doc drift closed: frontend/CLAUDE.md provider tree matches live App.tsx (no RTLWrapper — MD-01); useLocale.ts doc comment matches the delegated setLocale implementation (LO-02)'
affects: [phase-79-aceternity-removal, phase-80-visual-a11y-verification, future-ui-work]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Docs-from-shipped-literals: every DESIGN.md hex transcribed from tokens/directions.ts (never from memory), spot-checked (31 values matched both files); the code-side three-copy parity guard keeps the literals honest going forward'

key-files:
  created:
    - .planning/phases/77-linear-token-system/77-08-SUMMARY.md
  modified:
    - CLAUDE.md
    - frontend/CLAUDE.md
    - frontend/src/design-system/CLAUDE.md
    - frontend/src/design-system/hooks/useLocale.ts
    - frontend/DESIGN.md
    - frontend/design-system/inteldossier_handoff_design/README.md

key-decisions:
  - 'Handoff directory KEPT as historical reference with a supersession banner (planner decision) rather than deleted — deleting would touch eslint.config.mjs ignores and destroy the provenance record for near-zero gain; the banner + repointed required-reading achieves the DOC-01 goal.'
  - 'DESIGN.md carries ZERO "bureau" substring (satisfies the strict `! grep -qi bureau` automated gate cleanly) — the supersession note is phrased as "supersedes the previous IntelDossier prototype design system" without the retired direction name, so no deviation was needed on that gate.'
  - 'MD-01 fix conveys the Phase-76 provider swap WITHOUT the literal token "RTLWrapper" (the DoD grep requires zero matches) — worded as "replaced the earlier RTL-wrapper component".'

patterns-established:
  - 'Design source-of-truth doc set: frontend/DESIGN.md (the spec) → frontend/src/design-system/CLAUDE.md (the engine) → closest existing component, with the handoff prototype demoted to historical.'

requirements-completed: [DOC-01]

# Metrics
duration: ~40 min
completed: 2026-07-03
---

# Phase 77 Plan 08: Migrate the design source-of-truth to Linear (DOC-01) Summary

**Rewrote the three CLAUDE.md design sections and `frontend/DESIGN.md` off the retired Bureau/4-direction/hue model to the shipped Linear reality (dark-canonical, radii 6/8/12, surface-1..4 ladder, single direction, three byte-matched token copies + `check-bootstrap-parity` guard, coercion), transcribing every DESIGN.md value verbatim from `directions.ts`; superseded the IntelDossier handoff prototype with a banner; and closed the Phase-76 doc drift (MD-01 RTLWrapper provider prose, LO-02 useLocale comment).**

## Performance

- **Duration:** ~40 min
- **Completed:** 2026-07-03
- **Tasks:** 2 (both `type=auto`, no checkpoints)
- **Files modified:** 6 (4 in Task 1, 2 in Task 2) + 1 SUMMARY created, across 2 atomic commits + metadata

## Accomplishments

- **Task 1 — three CLAUDE.md layers + MD-01/LO-02.** Root `/CLAUDE.md` "Visual Design Source of Truth" repointed to `frontend/DESIGN.md`; the handoff dir demoted to "historical reference (superseded)"; required-reading order → DESIGN.md → `src/design-system/CLAUDE.md` → closest component; dropped "Default direction: Bureau…"; design rules updated to Linear (radii 6/8/12 via tokens, surface-1..4 ladder, `var(--line)` + `var(--line-strong)` hairlines, no card shadows) with the voice/emoji/date-format rules kept verbatim; DoD checklist updated. `frontend/CLAUDE.md` provider-tree paragraph rewritten to the ACTUAL App.tsx chain (`ErrorBoundary → QueryClientProvider → AuthProvider → ThemeErrorBoundary(fallbackDirection="linear",fallbackColorMode="dark") → DesignProvider(initialDirection="linear",initialMode="dark",...) → TweaksDisclosureProvider → LanguageProvider → LazyMotion → DirectionProvider → AppRouter`) — closes **MD-01** — plus the new surface-3/4, line-strong, accent-hover, status-1..6 mapped utilities added to the token wording. `frontend/src/design-system/CLAUDE.md` fully rewritten to "Linear is the only direction": coercion invariant (both layers), the three literal copies (directions.ts ↔ bootstrap.js ↔ index.css :root) enforced by `scripts/check-bootstrap-parity.mjs` in lint+CI, updated file inventory (no directionDefaults/useHue — 77-07 deleted them), dark default. `useLocale.ts` doc comment corrected to the delegated implementation — **LO-02** (no longer claims setLocale synchronously calls `i18n.changeLanguage` or writes `<html dir/lang>`).
- **Task 2 — DESIGN.md + supersession.** `frontend/DESIGN.md` rewritten as the Linear spec, every value transcribed from `directions.ts`: dark-canonical principle + light-derivation discipline; full dark and derived-light token tables (surfaces incl. surface-3/4, ink-tertiary, line-strong; accent incl. accent-hover; semantic danger/warn/ok/info + softs with per-role AA ratios; six status pairs with measured AA ranges); the hairline mapping decision (`#34343a` = `--line-strong`, `--line-soft` derived-softer); reserved unmapped extras (hairline-tertiary `#3e3e44`, semantic-overlay `#000000`, brand-secure `#7a7fad`); the `'Inter Variable'` / `'JetBrains Mono Variable'` registered-family type stack + Tajawal RTL cascade; radius 6/8/12; recipe rules (as shipped in 77-06); the engine contract (three copies + parity guard + coercion + dark default). Added the supersession banner to the top of `inteldossier_handoff_design/README.md` — nothing else in that directory changed.

## Task Commits

1. **Task 1: rewrite CLAUDE.md design sections to Linear + fix MD-01/LO-02 drift** — `63abab7b` (docs)
2. **Task 2: rewrite DESIGN.md as the Linear spec + supersede handoff prototype** — `9bc0f3a3` (docs)

**Plan metadata:** this SUMMARY commit (docs).

## Files Created/Modified

- `CLAUDE.md` — Visual Design Source of Truth section, design rules, and DoD checklist migrated to Linear.
- `frontend/CLAUDE.md` — provider tree fixed to live App.tsx (MD-01); Linear ladder utilities added to the Design tokens section.
- `frontend/src/design-system/CLAUDE.md` — full rewrite: Linear single direction, coercion invariant, three-copy invariant + parity guard, updated file inventory, dark default.
- `frontend/src/design-system/hooks/useLocale.ts` — doc comment fixed to the delegated setLocale (LO-02).
- `frontend/DESIGN.md` — rewritten as the Linear spec (321 lines; dark + light token tables, palettes with AA ratios, mapping decision, extras, type, radius, recipes, engine contract).
- `frontend/design-system/inteldossier_handoff_design/README.md` — supersession banner at the top (only change in that directory).

## Decisions Made

- **Handoff dir kept, not deleted** (planner decision) — banner + repointed required-reading achieves DOC-01 without touching eslint ignores or losing provenance.
- **DESIGN.md carries zero "bureau"** so the strict `! grep -qi bureau` gate passes cleanly; the supersession is noted as "supersedes the previous IntelDossier prototype design system".
- **MD-01 fix avoids the literal "RTLWrapper" token** (DoD grep requires zero matches) — phrased "replaced the earlier RTL-wrapper component".

## Deviations from Plan

None - plan executed exactly as written. (The two "conscious grep adjustments" the acceptance criteria permitted for DESIGN.md's bureau note and the RTLWrapper mention were resolved by wording around the forbidden tokens instead, so both automated gates pass literally with zero deviation.)

## Verification (all green)

| Gate                                                                                           | Result                                       |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `grep -rn "Bureau is the default\|initialDirection=\"bureau\"\|RTLWrapper"` across 3 CLAUDE.md | 0 matches (PASS)                             |
| DOC-01 phase-map grep `"Bureau is the default"` across CLAUDE.md + frontend/                   | 0 (PASS)                                     |
| `frontend/CLAUDE.md` provider prose vs live App.tsx                                            | matches (no RTLWrapper) (PASS)               |
| `useLocale.ts` no "mirrors to" / "calls i18n.changeLanguage" claim                             | 0 (PASS)                                     |
| `design-system/CLAUDE.md` names three-copy invariant + `check-bootstrap-parity`                | present (PASS)                               |
| DESIGN.md `#5e6ad2` + `Inter Variable` + dark/light tables + status ratios                     | present (PASS)                               |
| DESIGN.md `! grep -qi bureau`                                                                  | clean (PASS)                                 |
| handoff README.md `superseded` banner; dir diff = README.md only                               | PASS (9 insertions, README only)             |
| DESIGN.md hex ↔ directions.ts spot-check                                                       | 31 values match both files (need ≥10) (PASS) |
| pre-commit hook (build) on both task commits                                                   | passed (commits landed)                      |

## Issues Encountered

None. (Two rounds of lint-staged/prettier MM churn on committed markdown were reconciled by resetting the stale index entries — the committed HEAD holds the canonical prettier-formatted versions and the tree was returned to a clean fixpoint each time.)

## Next Phase Readiness

DOC-01 complete — the design source-of-truth is Linear across all five doc targets and MD-01/LO-02 are closed. Phase 77 (linear-token-system) has all eight plans summarised; ready for phase verify-work / completion. Phase 79 (Aceternity removal) and Phase 80 (visual + a11y re-verification) inherit the Linear-authoritative docs.

---

_Phase: 77-linear-token-system_
_Completed: 2026-07-03_
