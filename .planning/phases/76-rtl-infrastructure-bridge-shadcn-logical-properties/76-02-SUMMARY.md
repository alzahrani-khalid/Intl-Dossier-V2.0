---
phase: 76-rtl-infrastructure-bridge-shadcn-logical-properties
plan: 02
subsystem: testing
tags: [rtl, ci, lint, guard, node-script, shadcn, i18n]

# Dependency graph
requires:
  - phase: 76-rtl-infrastructure-bridge-shadcn-logical-properties
    provides: Plan 76-01 single direction owner (the RTL infrastructure this guard protects)
provides:
  - scripts/check-duplicate-rtl.mjs — per-string-literal detector that fails the build on an EXACT-duplicate rtl: utility token (shadcn migrate rtl #9891 signature)
  - tools/rtl-fixtures/duplicate-rtl-bad.tsx — positive-failure fixture the guard MUST reject (proves it fires)
  - duplicate-rtl guard wired into the frontend lint chain (local) + the CI lint job (live-tree step + positive-failure step)
affects: [76-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'CI guard: root scripts/check-*.mjs (zero-dep node, node: builtins only) appended to the frontend lint chain + a positive-failure fixture step in ci.yml — mirrors check-i18n-namespaces.mjs / check-edge-fn-schema-refs.mjs'
    - 'Exact-duplicate-token detection over string LITERALS (not a line regex) so legitimate multi-distinct-rtl: strings (sheet.tsx paired variants) pass'

key-files:
  created:
    - scripts/check-duplicate-rtl.mjs
    - tools/rtl-fixtures/duplicate-rtl-bad.tsx
  modified:
    - frontend/package.json
    - .github/workflows/ci.yml

key-decisions:
  - 'Detection is per string literal via the RESEARCH Pattern 6 tokenizer (STRING_RE + split on whitespace + per-literal Set) — flags only a token seen 2+ times within ONE literal, so two DIFFERENT rtl: tokens in one string stay legal'
  - 'Scan surface is all of frontend/src (RESEARCH Open Q3 resolution) — duplicates can leak anywhere; the exact-token rule has zero false positives on the current tree'
  - 'Script has no execution surface beyond file reads (no subprocess spawning, no dynamic code execution) — T-76-03 mitigation, asserted by an acceptance grep'

patterns-established:
  - 'Positive-failure fixture in tools/ (outside every lint/tsc/build glob) + a bash-negation CI step (! node ... fixture) proves the guard fires — guard-theater impossible (T-76-04)'

requirements-completed: [SRTL-03]

# Metrics
duration: 12min
completed: 2026-07-02
---

# Phase 76 Plan 02: Duplicate-`rtl:` CI Guard (SRTL-03) Summary

**A zero-dependency node guard (`scripts/check-duplicate-rtl.mjs`) now fails every local and CI lint run when any single `className` literal contains an exact-duplicate `rtl:*` utility (the non-idempotent shadcn `migrate rtl` #9891 signature), proven live by a positive-failure fixture — while legitimate multi-distinct-`rtl:` strings (`ui/sheet.tsx` paired variants) pass.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-02T14:03:00Z
- **Completed:** 2026-07-02T14:15:10Z
- **Tasks:** 2 (Task 1 TDD: fixture RED → detector GREEN; Task 2 lint-chain + CI wiring)
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments

- Authored `scripts/check-duplicate-rtl.mjs`: walks a root, extracts every string literal with the RESEARCH Pattern 6 tokenizer (`STRING_RE` honoring single/double/backtick quotes + escapes), splits each literal on whitespace, and flags only a token seen 2+ times within that one literal. Reports `<file>:<line>: duplicated rtl token "<token>"` and exits 1; else prints a files-scanned summary and exits 0. Zero dependencies (node: builtins only), read-only file walk, no exec surface.
- Created `tools/rtl-fixtures/duplicate-rtl-bad.tsx` carrying the `rtl:space-x-reverse rtl:space-x-reverse` #9891 signature in one `className` — the positive-failure input the guard must reject. It lives outside `frontend/src` (and every lint/tsc/build glob), so the real-tree run stays green.
- Wired the guard into the frontend `lint` script (after `check-i18n-namespaces.mjs`) so every local + CI lint fails on a duplicated `rtl:` utility.
- Added two CI steps to the `ci.yml` lint job (mirroring the edge-fn precedent): a live-tree `Check duplicate rtl utilities` step and an `Assert duplicate-rtl check fails on bad fixture (positive-failure)` bash-negation step — the guard is proven to fire on a known-bad input on every CI run (T-76-04).

## Task Commits

1. **Task 1 (RED — fixture):** `6d82f2e8` — test(76-02): add duplicate-rtl positive-failure fixture
2. **Task 1 (GREEN — detector):** `0b3a7603` — feat(76-02): add check-duplicate-rtl detector (SRTL-03)
3. **Task 2 (wiring):** `e0a328e0` — feat(76-02): wire duplicate-rtl guard into lint chain + CI (SRTL-03)

**Plan metadata:** `docs(76-02)` commit (SUMMARY + STATE + ROADMAP).

## Files Created/Modified

- `scripts/check-duplicate-rtl.mjs` — exact-duplicate `rtl:` token detector over string literals (created)
- `tools/rtl-fixtures/duplicate-rtl-bad.tsx` — positive-failure fixture, the `#9891` signature the guard rejects (created)
- `frontend/package.json` — `lint` script chain gains `&& node scripts/check-duplicate-rtl.mjs frontend/src`
- `.github/workflows/ci.yml` — lint job gains a live-tree step + a positive-failure fixture step

## Decisions Made

- Per-literal exact-duplicate detection (not `rtl:.*rtl:`) — the naive line regex would false-positive on `ui/sheet.tsx`'s legitimate paired `rtl:` slide variants the day it lands (RESEARCH Pitfall 6). Verified: `frontend/src/components/ui` scans clean (76 files, exit 0).
- Scan all of `frontend/src` (RESEARCH Open Q3) rather than `components/ui` only — duplicates can be introduced anywhere by future codemods/copy-paste; 1706 files scan clean today.
- No execution surface beyond file reads (T-76-03): the file contains neither a subprocess-spawn nor a dynamic-code path, asserted by `grep -c` in the acceptance criteria (returns 0).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Verification Results

- `node scripts/check-duplicate-rtl.mjs tools/rtl-fixtures` → exit 1, prints `tools/rtl-fixtures/duplicate-rtl-bad.tsx:15: duplicated rtl token "rtl:space-x-reverse"` (guard fires on the #9891 signature)
- `node scripts/check-duplicate-rtl.mjs frontend/src` → exit 0 (1706 files, no duplicated rtl: tokens)
- `node scripts/check-duplicate-rtl.mjs frontend/src/components/ui` → exit 0 (sheet.tsx paired distinct rtl: variants pass — no false positive)
- `grep -c "child_process\|eval(" scripts/check-duplicate-rtl.mjs` → 0 (no exec surface, T-76-03)
- `cd frontend && pnpm run lint` → exit 0 end-to-end (eslint --max-warnings 0 + i18n namespace check + duplicate-rtl check)
- `grep -c "check-duplicate-rtl" .github/workflows/ci.yml` → 2 (live-tree step + positive-failure step, both in the lint job, lines 76 & 82)
- `bash -c 'set -e; ! node scripts/check-duplicate-rtl.mjs tools/rtl-fixtures'` → exit 0 (the CI positive-failure step semantics work locally)

## Next Phase Readiness

- SRTL-03 satisfied: a duplicated `rtl:*` utility anywhere in `frontend/src` fails lint locally and in CI, with a positive-failure fixture proving the guard fires. Zero false positives on the live tree.
- This is also the SRTL-01 recurrence guard: a second `shadcn migrate rtl` run (Plan 76-04's transform) would now trip the build. **76-04 must run `migrate rtl` exactly once and land it as an isolated commit; this guard makes any re-run build-breaking.**
- No blockers.

## Self-Check: PASSED

- Created files verified on disk: `scripts/check-duplicate-rtl.mjs`, `tools/rtl-fixtures/duplicate-rtl-bad.tsx`, `76-02-SUMMARY.md`.
- Task commits verified in git log: `6d82f2e8`, `0b3a7603`, `e0a328e0`.
- All plan verification gates re-run green.

---

_Phase: 76-rtl-infrastructure-bridge-shadcn-logical-properties_
_Completed: 2026-07-02_
