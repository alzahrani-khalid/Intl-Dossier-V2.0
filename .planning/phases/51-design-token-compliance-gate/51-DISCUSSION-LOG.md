# Phase 51: Design-Token Compliance Gate - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `51-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-05-14
**Phase:** 51-design-token-compliance-gate
**Areas discussed:** Scope reality + violation triage, Rule mechanism + allowlists, CI gate structure + smoke PR, Dark-mode + CSS file policy

---

## Area selection

| Option                           | Description                                                                                                                                                                                                             | Selected |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Scope reality + violation triage | How big is Phase 51? Roadmap says 2 files; sweep shows ~315 files / 2950 literals. Decide: full sweep, narrow named-file fix, or triaged tiers. Charts/flags/React-Flow get explicit exemption or token-mapped palette. | ✓        |
| Rule mechanism + allowlists      | How is the rule built? no-restricted-syntax regex vs local plugin vs eslint-plugin-tailwindcss. Closed allowlist for token-mapped utilities + file allowlist for raw hex.                                               | ✓        |
| CI gate structure + smoke PR     | New "Design Tokens" GHA job/context vs fold into existing `Lint` (Phase 48 D-15). Smoke PR proof requirement.                                                                                                           | ✓        |
| Dark-mode + CSS file policy      | Does ban apply to `dark:text-red-400`? CSS-comment hex allowed? Make semantic-colors.ts the canonical migration target?                                                                                                 | ✓        |

**User's choice:** All four areas selected.

---

## Scope reality + violation triage

| Option                      | Description                                                                                                                                                          | Selected |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Triaged tiers               | Tier-A (in-phase fix: named files + mechanical status/badge swaps). Tier-B (chart/flag/React-Flow allowlist). Tier-C (audit doc + queue). Rule activates everywhere. | ✓        |
| Full sweep (Phase-48 style) | Drive frontend/src to zero literals + zero raw hex; ~315 files refactored in-phase.                                                                                  |          |
| Named-files only (minimal)  | Only fix the two roadmap-named files; broad ignore-block on the other 313 with TODOs.                                                                                |          |

**User's choice:** Triaged tiers (Recommended).
**Notes:** Establishes the phase boundary as the full gate (rule + Tier-A worklist + audit doc), not just the two roadmap-named files. Mirrors Phase 50 D-04 audit pattern shape.

---

## Triage details

| Option                              | Description                                                                                                                                                                  | Selected |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 3-tier with audit + ignore-block    | Tier-A in-phase fix, Tier-B rule-level allowlist via `'no-restricted-syntax': 'off'` per-file override, Tier-C per-file `eslint-disable-next-line` with audit row reference. | ✓        |
| Hard cutover — no per-file disables | Tier-C files must be fixed in-phase OR moved entirely into Tier-B. No `eslint-disable` in source.                                                                            |          |
| Token-map-first, audit-second       | Build canonical color-name → token map doc first, then apply tier triage. Adds discovery step.                                                                               |          |

**User's choice:** 3-tier with audit + ignore-block (Recommended).
**Notes:** Encoded as D-01 / D-13 in CONTEXT.md. Per-Literal disables (not file-top blankets) with phase-and-row annotation pointing to `51-DESIGN-AUDIT.md`.

---

## Rule mechanism

| Option                                          | Description                                                                                                  | Selected |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------- |
| `no-restricted-syntax` regex on Literal         | Mirrors existing RTL rules (lines 148–198) + Phase 50 D-15 vi-mock guard. Two new selectors; zero new deps.  | ✓        |
| Local plugin `tools/eslint-plugin-intl-dossier` | Custom AST-based rules; smarter than regex but higher build cost. Phase 50 D-15 already suggested this path. |          |
| `eslint-plugin-tailwindcss` third-party         | Upstream plugin; only covers Tailwind side. Adds a dep.                                                      |          |

**User's choice:** `no-restricted-syntax` regex on Literal (Recommended).
**Notes:** Encoded as D-05 in CONTEXT.md. Slots into existing `eslint.config.mjs` frontend override block alongside RTL and vi-mock selectors.

---

## Allowlist composition

| Option                                           | Description                                                                                                                                                            | Selected |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Token files + signature visuals + chart palettes | Raw-hex allowlist: tokens, bootstrap.js, flag SVGs, all chart/React-Flow files. Token-mapped Tailwind allowlist is implicit via the regex (banned palette names only). | ✓        |
| Tokens-only allowlist (strict)                   | Only tokens + flag SVGs allowlisted. Charts become Tier-A (must move to chart-palette tokens). Bigger Tier-A scope.                                                    |          |
| Tokens + flags only, charts queued               | Charts become Tier-C (per-file `eslint-disable`). More in-source disables.                                                                                             |          |

**User's choice:** Token files + signature visuals + chart palettes (Recommended).
**Notes:** Encoded as D-03 / D-06 / D-11 in CONTEXT.md. Chart files become a permanent Tier-B design statement; future "chart palette tokens" phase owns their cleanup separately.

---

## CI gate structure

| Option                                     | Description                                                                                                                                                                  | Selected |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Fold into existing Lint context + smoke PR | Rule lives in `eslint.config.mjs` and runs under existing `Lint` PR-blocking context from Phase 48 D-15. No new GHA job, no new required-context PUT. Smoke PR proves BLOCK. | ✓        |
| Separate `Design Tokens` GHA job           | New dedicated job + new required-context entry on `main`. Stronger PR-status signal; adds CI minutes.                                                                        |          |
| Same context, no smoke PR                  | Fold into Lint but skip the smoke-PR proof step. Weaker confidence.                                                                                                          |          |

**User's choice:** Fold into existing Lint context + smoke PR (Recommended).
**Notes:** Encoded as D-09 / D-10 in CONTEXT.md. The roadmap's "new PR-blocking branch-protection context" is interpreted semantically — rule is NEW, context is PR-blocking. Smoke PR follows Phase 48 D-16 / Phase 50 D-13 precedent.

---

## Dark-mode + CSS file policy

| Option                                                | Description                                                                                               | Selected |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------- |
| Ban `dark:` variants too + comment-hex allowed in CSS | Variant prefix chain matched via `(?:[a-z-]+:)*`; AST Literal selector doesn't fire on CSS comment nodes. | ✓        |
| Allow `dark:` + ban all CSS hex (strict)              | Light-mode literals banned only; CSS comments must drop raw hex documentation.                            |          |
| Ban both + all CSS hex                                | Maximum strict. modern-nav-tokens.css comment cleanup in-phase.                                           |          |

**User's choice:** Ban dark: variants too + comment-hex allowed in CSS (Recommended).
**Notes:** Encoded as D-07 / D-08 in CONTEXT.md. Forces dark-mode color usage through `@theme` tokens (which already declare both light + dark values). modern-nav-tokens.css comment hex stays.

---

## Claude's Discretion (recorded in CONTEXT.md)

- Plan slicing (one plan covering rule + Tier-A + audit + smoke PR vs. one plan per tier) — planner's call.
- Order of Tier-A files within executor wave — executor's call.
- Mixed Tier-B/Tier-C file boundary — planner's call per file; default heuristic recorded in CONTEXT.md D-03 / D-04.
- Exact regex grammar for palette-literal selector — published shape is a starting point; planner may simplify.
- Optional `pnpm lint:design-tokens` local fast-feedback script — planner's call; not required.
- Smoke PR style (separate PR vs. throwaway branch) — executor judgment.

## Deferred Ideas (recorded in CONTEXT.md)

- Chart palette tokens phase (future).
- Tier-C cleanup waves (estimated 200–250 files across 2–4 future phases).
- CSS-side ESLint pass via `eslint-plugin-css` / `stylelint` integration.
- Pre-commit `pnpm lint:design-tokens` script.
- `tools/eslint-plugin-intl-dossier/` plugin scaffold (still viable if 3+ project-local rules accumulate).
- Migrating `lib/semantic-colors.ts` to direct token utilities.
- Re-enabling `TODO(Phase 2+)` rules.
