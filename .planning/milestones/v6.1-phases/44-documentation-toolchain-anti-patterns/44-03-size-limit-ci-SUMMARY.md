---
phase: 44-documentation-toolchain-anti-patterns
plan: 03
subsystem: frontend-tooling
tags: [frontend, ci, vite, size-limit, bundle-budget]

requires:
  - phase: 44-documentation-toolchain-anti-patterns
    provides: Phase 44 documentation and anti-pattern context for truthful toolchain gates
provides:
  - Stable Vite chunk names for signature visuals and geospatial dependencies
  - Current-output size-limit budgets with deterministic zero-match protection
  - CI bundle-size job using the same build, match, and size-limit commands as local verification
affects: [frontend-build, ci, documentation-toolchain, bundle-size-regressions]

tech-stack:
  added: []
  patterns:
    - Node standard-library glob match guard for generated Vite assets
    - Size-limit budgets pinned to stable chunk-name globs instead of hashed filenames

key-files:
  created:
    - frontend/scripts/assert-size-limit-matches.mjs
    - .planning/phases/44-documentation-toolchain-anti-patterns/44-size-limit-regression-proof.md
  modified:
    - frontend/vite.config.ts
    - frontend/.size-limit.json
    - .github/workflows/ci.yml

key-decisions:
  - 'Use current measured bundle output plus narrow headroom as the enforced Phase 44 size-limit gate.'
  - 'Keep the historic 815 KB total JS target out of the merge gate because current output does not fit it.'
  - 'Run a zero-match guard before size-limit locally and in CI so stale globs cannot silently measure nothing.'

patterns-established:
  - 'Stable chunk-name budget pattern: Vite manualChunks names must match .size-limit.json globs.'
  - 'Regression proof pattern: document both a passing baseline and an intentional failing perturbation.'

requirements-completed: [TOOL-01, TOOL-02, TOOL-03]

duration: 12min observed
completed: 2026-05-07
---

# Phase 44 Plan 03: Size Limit CI Summary

**Truthful size-limit enforcement with stable Vite chunk globs, zero-match detection, and CI parity for local bundle checks**

## Performance

- **Duration:** 12 min observed from first task commit to summary creation
- **Started:** 2026-05-07T18:52:23Z
- **Completed:** 2026-05-07T19:03:45Z
- **Tasks:** 3
- **Files modified:** 5 owned implementation files plus this summary

## Accomplishments

- Added stable Vite manual chunks for signature visuals source and d3/topojson/world-atlas geospatial dependencies.
- Replaced stale size-limit paths with current Vite output globs and concrete gzip limits with small headroom.
- Added `frontend/scripts/assert-size-limit-matches.mjs` so every size-limit entry must match real `frontend/dist` output before budgets run.
- Updated the `bundle-size-check` CI job to run `pnpm -C frontend build`, the match guard, and `pnpm -C frontend size-limit`.
- Proved the gate fails on an intentional measured entry chunk increase, then restored and reverified the passing baseline.

## Task Commits

1. **Task 1: Add stable chunk names for signature visuals and d3 assets** - `a288e113`
   - Commit message is from a concurrent docs/archive operation, but the commit content for this plan is only `frontend/vite.config.ts`.
2. **Task 2: Replace stale size-limit globs with measured current-output budgets** - `d2cd16fa`
   - Contains the intended `.size-limit.json` and match-guard script changes.
   - Also contains unrelated milestone verification docs that were staged concurrently; see Deviations.
3. **Task 3: Wire CI to the repaired signal and prove regression failure** - `dfd4f1a5`
   - Contains only `.github/workflows/ci.yml` and the regression proof artifact.

## Files Created/Modified

- `frontend/vite.config.ts` - Adds `signature-visuals-d3` and `signature-visuals` manual chunk names while preserving existing vendor chunks.
- `frontend/.size-limit.json` - Uses current Vite output globs and current gzip budgets with narrow headroom.
- `frontend/scripts/assert-size-limit-matches.mjs` - Reads `.size-limit.json`, checks each path against `frontend/dist`, prints match counts, and exits non-zero on zero matches.
- `.github/workflows/ci.yml` - Runs the same frontend build, match assertion, and size-limit commands in `bundle-size-check`.
- `.planning/phases/44-documentation-toolchain-anti-patterns/44-size-limit-regression-proof.md` - Records passing baseline and intentional failure evidence.

## Verification

- `pnpm -C frontend build` - Passed with known pre-existing Vite warnings.
- `node frontend/scripts/assert-size-limit-matches.mjs` - Passed and reported non-zero matches for all six configured entries.
- `pnpm -C frontend size-limit` - Passed after repair.
- Temporary 4 KiB high-entropy payload in `frontend/src/main.tsx` - `pnpm -C frontend size-limit` failed as expected with initial JS at `521.21 kB` against the `517 kB` cap.
- Temporary payload was removed and `git diff -- frontend/src/main.tsx` was empty before final verification.

## Decisions Made

- Enforced current output rather than the aspirational `815 KB` total target because the current measured total JS is approximately `2.42 MB`.
- Used Node standard library only for the match guard to avoid adding dependencies for a CI/tooling assertion.
- Kept CI command parity with local verification by running repo-root `pnpm -C frontend ...` commands.

## Deviations from Plan

### Process Deviations

**1. Concurrent staged files entered Task 2 commit**

- **Found during:** Task 2 commit verification
- **Issue:** Commit `d2cd16fa` includes unrelated `.planning/milestones/v6.0-phases/*/VERIFICATION.md` files that were staged concurrently by other agents.
- **Resolution:** Did not revert or path-reset those files because they were outside the owned write scope and already had active uncommitted follow-up edits. All later commits were staged with explicit owned paths only.
- **Files affected by this plan:** `frontend/.size-limit.json`, `frontend/scripts/assert-size-limit-matches.mjs`
- **Non-owned files in commit:** milestone verification docs for phases 33, 34, 36, 37, 39, and 40.

**2. Task 1 code landed under a concurrent docs commit message**

- **Found during:** Resume verification
- **Issue:** `a288e113` is labeled `docs(44-01): archive v6.0 planning artifacts`, but `git show` confirms the commit content is only `frontend/vite.config.ts`.
- **Resolution:** Tracked `a288e113` as the Task 1 implementation commit without rewriting shared history.

**Total deviations:** 2 process deviations caused by concurrent worktree/index activity.
**Impact on plan:** Implementation and verification goals are complete. Commit history is not perfectly atomic for Task 2 because of unrelated concurrently staged docs.

## Issues Encountered

- Pre-commit hooks reran full build and `knip`; build passed with known non-blocking warnings and `knip` reported existing unused exports under the repository's current non-blocking hook behavior.
- A shell quoting mistake during an artifact grep caused `pnpm -C frontend size-limit` to run once via command substitution; it passed and caused no file changes. The grep was rerun with proper quoting.

## Known Stubs

None. Stub-pattern scan across created and modified plan files found no `TODO`, `FIXME`, placeholder copy, or hardcoded empty data stubs.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Future bundle-size changes can rely on stable chunk-name globs and the zero-match guard to catch stale budget paths.
- The current budget gate is intentionally strict with narrow headroom; meaningful bundle growth now requires either reducing code size or consciously updating `.size-limit.json`.

## Self-Check: PASSED

- Confirmed all owned implementation files and the summary file exist.
- Confirmed task commits exist: `a288e113`, `d2cd16fa`, `dfd4f1a5`.
- Confirmed `frontend/vite.config.ts` retains `signature-visuals-d3`, `/src/components/signature-visuals/`, `react-vendor`, and `tanstack-vendor`.
- Confirmed `frontend/.size-limit.json` contains stable output globs and no stale `*d3-geo*` glob.

---

_Phase: 44-documentation-toolchain-anti-patterns_
_Completed: 2026-05-07_
