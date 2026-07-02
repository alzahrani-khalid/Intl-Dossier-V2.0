---
phase: 77-linear-token-system
plan: 02
subsystem: infra
tags: [ci, vm, fouc, design-tokens, bootstrap, node-type-stripping, byte-match]

# Dependency graph
requires:
  - phase: 33-design-system
    provides: frontend/public/bootstrap.js FOUC first-paint script + tokens/directions.ts (PALETTES/FONTS)
  - phase: 33-design-system
    provides: tokens/densities.ts (DENSITIES padInline/padBlock/gap/rowH)
provides:
  - scripts/check-bootstrap-parity.mjs — dependency-free vm-sandbox byte-match guard proving bootstrap.js painted values === exported token data across all 24 direction×mode×density combos
  - tools/bootstrap-fixtures/bad-bootstrap.js — positive-failure fixture (one diverged palette literal) proving the guard's exit-1 path
  - pnpm lint chain entry + CI Lint-job wiring (run step + negated fixture step)
affects: [77-03, 77-04, linear-token-swap, fouc-byte-match]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'vm-sandbox parity guard: execute the real ES5 bootstrap in node:vm with hand-stubbed localStorage/document, collect style.setProperty into a Map, compare painted values (not file bytes) against natively-imported TS token data'
    - "native TS import of import-type-only data modules (Node >=22.18 type-stripping) as the guard's truth side — immune to formatting/key-name differences"

key-files:
  created:
    - scripts/check-bootstrap-parity.mjs
    - tools/bootstrap-fixtures/bad-bootstrap.js
  modified:
    - frontend/package.json
    - .github/workflows/ci.yml

key-decisions:
  - "Iterate the ACTUAL exported direction keys (chancery/situation/ministerial/bureau) × [light,dark] × density keys = 24 combos — the guard lands BEFORE any Linear literal move (ROADMAP hard-sequencing), so it validates today's Bureau values"
  - 'Data-driven COMPARISONS table at the top of the script so plan 77-04 can add tier/accent/semantic vars + coercion probes without restructuring the run/compare machinery'
  - "Explicit painted.size===0 guard fails loudly if a vm stub is ever missing (bootstrap's outer try/catch would otherwise swallow the ReferenceError and paint nothing)"

patterns-established:
  - 'Byte-match CI guard mirrors the check-duplicate-rtl.mjs precedent: dependency-free scripts/*.mjs + pnpm lint chain entry + ci.yml Lint-job run step + shell:bash set -e negated positive-failure fixture step'

requirements-completed: [FOUC-01, TOKEN-02]

# Metrics
duration: ~13 min
completed: 2026-07-02
---

# Phase 77 Plan 02: Linear Token System — FOUC byte-match CI guard Summary

**A dependency-free node:vm parity guard that executes the real bootstrap.js across all 24 direction×mode×density combinations and fails the build (local + CI) when any painted CSS custom property drifts from the exported tokens/directions.ts + densities.ts values.**

## Performance

- **Duration:** ~13 min
- **Started:** ~2026-07-02T18:24Z
- **Completed:** 2026-07-02T18:37Z
- **Tasks:** 2
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments

- **FOUC-01 mechanism live and proven BEFORE any Linear literal lands** (ROADMAP hard-sequencing satisfied): the guard is green against today's Bureau values and red against a single-byte-diverged fixture.
- Replaced the doc-only "bootstrap.js MUST byte-match directions.ts" discipline (which had already drifted historically) with a build-breaking gate.
- Guard imports the TS token data natively (Node ≥22.18 `import type`-erasure) and compares PAINTED values against EXPORTED values — immune to the two files' different key names (`rSm/r/rLg` vs `radius.sm/base/lg`).
- Wired as a hard local + CI gate; TOKEN-02 enforcement path now exists and plan 77-04 extends the same script rather than building a second gate.

## Task Commits

Each task was committed atomically:

1. **Task 1: Write the parity guard script + positive-failure fixture** — `fcac42766` (feat)
2. **Task 2: Wire the guard into pnpm lint and the CI Lint job** — `6f124aabf` (feat)

## Files Created/Modified

- `scripts/check-bootstrap-parity.mjs` (created) — vm-sandbox byte-match guard. Truth side: native `import()` of PALETTES/FONTS (directions.ts) + DENSITIES (densities.ts). Bootstrap side: runs `frontend/public/bootstrap.js` (or a CLI-arg fixture) in a fresh `node:vm` context per combination with hand-stubbed localStorage + document.documentElement (style/classList/dataset/setAttribute/lang/dir) + parseInt/isNaN, collecting `style.setProperty` into a Map. Compares 21 vars/combo across 24 combos; exits 1 naming direction/mode/density + var + expected/actual on any mismatch.
- `tools/bootstrap-fixtures/bad-bootstrap.js` (created) — exact copy of bootstrap.js with exactly one palette literal diverged (bureau.light.bg `#f7f6f4` → `#f7f6f5`) plus a header comment marking it a deliberately-diverged positive-failure fixture never loaded by the app.
- `frontend/package.json` (modified) — appended `&& node scripts/check-bootstrap-parity.mjs` to the `lint` script (after check-duplicate-rtl; the chain already `cd ..`'s to repo root).
- `.github/workflows/ci.yml` (modified) — added two Lint-job steps mirroring the check-duplicate-rtl shape: "Check bootstrap token parity" (run) + "Assert bootstrap parity check fails on bad fixture (positive-failure)" (`shell: bash`, `set -e`, negated fixture invocation).

## Decisions Made

- **Compare painted vs exported, never bytes/ASTs** — the two files are structurally different; string `===` on the painted output IS the byte-match (RESEARCH anti-pattern avoided).
- **Do NOT import buildTokens.ts** — its extensionless `'./densities'` specifier fails native resolution; only directions.ts + densities.ts (import-type-only) are natively importable.
- **`--pad` and `--pad-inline` both map to `DENSITIES.padInline`, `--pad-block` to `padBlock`** — mirrors the live bootstrap mapping (bootstrap's local `D.pad` === densities.ts `padInline`).
- **Iterate exported keys, not a hard-coded 'linear'** — this plan runs pre-swap, so the guard covers the current 4 directions; the count (24) is derived from `Object.keys` and updates automatically when the token data changes.
- **No coercion probe yet** — the RESEARCH `id.dir='bureau'→linear` regression probe is explicitly 77-04 scope (there is no coercion in bootstrap yet); left out to stay in plan scope.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. (One self-inflicted CLI slip: the first Task-1 commit put `-m` after `--`, so git read the message as a pathspec; re-ran with `-m` before `--`. No repo state affected.)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- FOUC-01 gate is live and proven both polarities; safe for 77-03 to move Linear literals into directions.ts + bootstrap.js in the same commit — the guard will byte-match-enforce it.
- 77-04 extends the COMPARISONS table (tier/accent/semantic vars + coercion probes) — the data-driven structure is in place for that.

## Self-Check: PASSED

- `[ -f scripts/check-bootstrap-parity.mjs ]` ✓ and `[ -f tools/bootstrap-fixtures/bad-bootstrap.js ]` ✓ (key-files.created exist on disk)
- `git log --oneline --grep="77-02"` returns 2 feat commits (`fcac42766`, `6f124aabf`) ✓
- `node scripts/check-bootstrap-parity.mjs` → exit 0, prints "24 combinations (4 directions × 2 modes × 3 densities)" ✓
- `node scripts/check-bootstrap-parity.mjs tools/bootstrap-fixtures/bad-bootstrap.js` → exit 1, names `--bg` + bureau/light ✓
- `cd frontend && pnpm run lint` → exit 0, output includes the parity summary line ✓
- `grep -c check-bootstrap-parity .github/workflows/ci.yml` == 2 ✓ ; `grep -c check-bootstrap-parity frontend/package.json` == 1 ✓
- guard imports only `node:` builtins (grep `from '` shows 4 node: specifiers) ✓

---

_Phase: 77-linear-token-system_
_Completed: 2026-07-02_
