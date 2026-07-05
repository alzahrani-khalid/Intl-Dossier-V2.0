---
phase: 83-token-debt-consolidation
plan: 02
subsystem: frontend
tags: [design-tokens, chart-palette, DEBT-01, three-copy-invariant, tailwind-v4, wcag]
requires: []
provides:
  - chart-palette-token-module
  - chart-1-to-8-css-vars
  - color-chart-tailwind-utilities
  - parity-guard-chart-enforcement
affects:
  - frontend/src/design-system/tokens
  - frontend/public/bootstrap.js
  - frontend/src/index.css
  - scripts/check-bootstrap-parity.mjs
tech-stack:
  added: []
  patterns:
    - 'chart var emit loop mirrors statusVars (buildTokens)'
    - 'ES5 first-paint chart loop mirrors the status paint loop (bootstrap.js)'
    - '@theme --color-chart-N: var(--chart-N) auto-generates text-/bg-/fill-/stroke-chart-N utilities'
    - 'parity-guard EXTENDED_PALETTE chart loop enforces the three-copy invariant per token'
    - 'contrast.test.ts reads PALETTES.linear (drift guard, not hardcoded duplicates)'
key-files:
  created: []
  modified:
    - frontend/src/design-system/tokens/types.ts
    - frontend/src/design-system/tokens/directions.ts
    - frontend/src/design-system/tokens/buildTokens.ts
    - frontend/public/bootstrap.js
    - frontend/src/index.css
    - scripts/check-bootstrap-parity.mjs
    - frontend/tests/unit/design-system/contrast.test.ts
    - frontend/tests/unit/design-system/buildTokens.test.ts
decisions:
  - 'chart-7 (the only new hue) = violet oklch h300, between chart-1 indigo h264 and chart-6 magenta h330; matched to the sibling status L/C band rather than max chroma for family coherence — dark #ba9cef (L0.75 C0.12, 8.24:1 min vs surface/bg), light #6b46a0 (L0.48 C0.14, 6.45:1 min)'
  - 'Governing threshold is WCAG 1.4.11 non-text >=3:1 (chart series/graph nodes are graphics, not text); 7 of 8 slots are byte-copies of AA-proven status/danger fgs and clear it comfortably'
  - 'buildTokens.test.ts extended with chart keys in REQUIRED_KEYS + an 8-var emission test (mirrors the status emission test) — turns the enumeration list into a real chart-emission guard'
  - 'No consumer migration in this plan — purely additive, zero visual change; Wave-2 slices (83-03/83-04) consume var(--chart-N) / the Tailwind utilities'
metrics:
  tasks_completed: 2
  files_created: 0
  files_modified: 8
  duration_minutes: 12
  completed: 2026-07-04
---

# Phase 83 Plan 02: Chart-Palette Token Module (DEBT-01 Keystone) Summary

Added the shared 8-slot categorical chart palette `--chart-1 … --chart-8` to all three byte-matched Linear palette holders (`directions.ts`, `bootstrap.js`, `index.css :root`), emitted it through the token engine, exposed it as Tailwind `@theme` utilities, and EXTENDED the parity guard so the three-copy invariant is now CI-enforced for chart vars — all six touch-points landed in one GREEN commit (RESEARCH Pitfall 3). 7 of 8 slots are byte-copies of already-AA-proven Linear literals (status-1..6 fg + semantic danger); only `--chart-7` (violet h300) is newly derived with culori and proven by contrast tests. Purely additive: no consumers migrated, zero visual change.

## What shipped

- **`--chart-1..8` in both modes** (`tokens/directions.ts`): dark `#87adfa #2ac4cc #6ac48c #cbaa4b #ef9179 #d991d2 #ba9cef #e86154`; light `#3458ac #00737c #007338 #7c5700 #9d381f #873a82 #6b46a0 #be241f`.
- **Token engine emit** (`buildTokens.ts`): `chartVars` loop mirroring `statusVars` → `--chart-1..8`.
- **First-paint parity** (`bootstrap.js`): `chart:[…]` in both mode palettes + an ES5 paint loop (no arrows/const/template literals — ES5 contract held).
- **`:root` fallback + Tailwind utilities** (`index.css`): dark literals in `:root`; `--color-chart-N: var(--chart-N)` in `@theme` → auto-generates `text-chart-N` / `bg-chart-N` / `fill-chart-N` / `stroke-chart-N`.
- **Guard enforcement** (`check-bootstrap-parity.mjs`): `EXTENDED_PALETTE` chart loop; guard now byte-matches 64 vars/combo (was 56) and 59 `:root` checks (was 51).
- **Tests**: 16 chart contrast cases (`contrast.test.ts`, RED→GREEN) + an 8-var emission test and 8 keys in `REQUIRED_KEYS` (`buildTokens.test.ts`).

## chart-7 derivation (the only new hue)

Derived with culori (throwaway script, not committed). Violet hue 300 sits between chart-1 indigo (h264) and chart-6 magenta (h330). Rather than maximizing chroma, matched to the sibling status L/C band for palette coherence:

| Mode  | oklch            | hex       | min contrast vs surface/bg |
| ----- | ---------------- | --------- | -------------------------- |
| dark  | L0.75 C0.12 h300 | `#ba9cef` | 8.24:1                     |
| light | L0.48 C0.14 h300 | `#6b46a0` | 6.45:1                     |

Both clear the WCAG 1.4.11 non-text threshold (>=3:1) against `--surface` AND `--bg` with wide margin (and also clear AA text 4.5:1).

## Verification

- `node scripts/check-bootstrap-parity.mjs` — exit 0, chart vars enforced across all three copies
- `pnpm --dir frontend exec vitest run tests/unit/design-system/` — 181 pass (incl. 16 chart contrast cases + chart emission test)
- `pnpm --dir frontend type-check` — exit 0
- `pnpm --dir frontend lint` — clean (eslint + i18n + duplicate-rtl + parity + date-formatting)
- `pnpm --dir frontend build` — exit 0 (bootstrap ES5 parse + bundle)
- `git diff`: `directions.ts` + `index.css` pure insertions (0 deletions); `bootstrap.js` two single-line palette objects re-emitted with `,chart:[…]` appended — every pre-existing var byte-identical (parity guard proves it). No existing palette value altered (D-83-09).

## Deviations from Plan

None — plan executed exactly as written. TDD RED→GREEN followed (RED commit `282b836f`, GREEN commit `d90cc910`). `buildTokens.test.ts` was updated per the plan's "if it enumerates emitted var lists, update the expectation" clause (it lists `REQUIRED_KEYS`); `fouc-bootstrap.test.ts` does not enumerate var counts, so it was left untouched.

## Known Stubs

None. All 8 chart tokens carry real values in both modes.

## Threat Flags

None. Additive CSS custom-property definitions only — no new inputs, dependencies, or runtime code paths (threat register T-83-02 mitigated: guard tables extended in the same commit as the token additions).

## Commits

- `282b836f` test(83-02): add failing chart-palette contrast assertions (RED)
- `d90cc910` feat(83-02): add --chart-1..8 palette to all three holders + guard + engine (GREEN)

## Self-Check: PASSED
