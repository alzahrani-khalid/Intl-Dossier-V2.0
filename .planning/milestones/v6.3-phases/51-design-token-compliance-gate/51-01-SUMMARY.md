---
phase: 51-design-token-compliance-gate
plan: 01
subsystem: lint-config
tags: [eslint, design-tokens, no-restricted-syntax, tier-b, fixture]
requires:
  - phase: 50-test-infrastructure-repair
    provides: 'Phase 50 smoke PR #11 closed and test gates finalized'
provides:
  - 'D-05 design-token selectors for raw hex, Tailwind palette literals, and template literals'
  - 'D-03 Tier-B no-restricted-syntax carve-outs for token source, bootstrap, flags, chart, and graph files'
  - 'phase-51-base tag pushed to origin for later diff audits'
  - 'bad-design-token regression fixture that surfaces all three D-05 warnings'
affects: [phase-51, lint, design-token-gate]
tech-stack:
  added: []
  patterns:
    - 'D-05 selector objects are defined once and reused by frontend and fixture-specific lint scopes'
    - 'Tier-B is expressed as config-level no-restricted-syntax off, not inline eslint-disable'
key-files:
  created:
    - tools/eslint-fixtures/bad-design-token.tsx
    - .planning/phases/51-design-token-compliance-gate/51-01-SUMMARY.md
  modified:
    - eslint.config.mjs
key-decisions:
  - 'Kept the repo lint scripts unchanged; --max-warnings 0 remains the enforcement behavior.'
  - 'Used a fixture-specific override for bad-design-token because tools/eslint-fixtures is outside the frontend D-05 rule scope and has a separate vi-mock no-restricted-syntax block.'
requirements-completed: [DESIGN-01, DESIGN-02]
duration: 42 min
completed: 2026-05-15
---

# Phase 51 Plan 01: Rule Activation and Tier-B Carve-Out Summary

**Design-token lint policy structure is in place: ESLint now detects raw hex, Tailwind palette literals, and palette template literals, with explicit Tier-B exemptions and a dedicated regression fixture.**

## Performance

- **Duration:** 42 min
- **Started:** 2026-05-15T17:55:00Z
- **Completed:** 2026-05-15T18:37:36Z
- **Tasks:** 6
- **Files modified:** 3

## Accomplishments

- Confirmed Phase 50 smoke PR #11 is `CLOSED` before Phase 51 source edits.
- Created and pushed `phase-51-base` at `e0aa391f5e1cc88725d358f3e2b1e16fe27344c8`.
- Added D-05 selector coverage for raw hex, palette literals, and template literals in `eslint.config.mjs`.
- Added the D-03 Tier-B carve-out block for permanent design-token exceptions.
- Added `tools/eslint-fixtures/bad-design-token.tsx` and verified it emits all three D-05 warnings.

## Task Commits

1. **Task 2: Add D-05 selectors** - `2e27bdc5`
2. **Task 3: Add Tier-B carve-outs** - `72b0cdca`
3. **Task 4: Add bad design-token fixture** - `18c5bd69`

Task 0 and Task 1 were read-only / tag operations and did not create source commits.

## Verification

- `gh pr view 11 --json state -q .state | grep -q CLOSED` -> pass.
- `git rev-parse --verify phase-51-base^{commit}` -> `e0aa391f5e1cc88725d358f3e2b1e16fe27344c8`.
- `git ls-remote --tags origin refs/tags/phase-51-base` lists the tag.
- `node --input-type=module -e "import('./eslint.config.mjs').then(()=>console.log('OK'))"` -> `OK`.
- `pnpm exec eslint -c eslint.config.mjs --print-config frontend/src/App.tsx | jq '.rules["no-restricted-syntax"] | {severity: .[0], count: (length - 1)}'` -> severity `1`, count `15`.
- `pnpm exec eslint -c eslint.config.mjs --print-config tools/eslint-fixtures/bad-design-token.tsx | jq '.rules["no-restricted-syntax"] | {severity: .[0], count: (length - 1)}'` -> severity `1`, count `3`.
- `pnpm exec eslint -c eslint.config.mjs tools/eslint-fixtures/bad-design-token.tsx` -> exit `0`, `3` D-05 warning matches.
- `pnpm exec eslint -c eslint.config.mjs frontend/src/components/position-editor/PositionEditor.tsx` -> exit `0`, `19` D-05 warning matches.
- `pnpm lint` -> exit `1`, `3062` design-token warning matches, blocked by `--max-warnings 0`.
- `git diff --name-only phase-51-base..HEAD -- frontend/src` -> empty.

## Deviations from Plan

**1. [Rule 3 - Blocking] Warn-first conflicts with current lint scripts**

- **Found during:** Task 5
- **Issue:** The plan expected `pnpm lint` to exit 0 while D-05 runs at `warn`. The actual frontend and backend lint scripts use `--max-warnings 0`, so the newly exposed warnings correctly fail lint until Tier-A fixes and Tier-C dispositions land.
- **Fix:** Kept `--max-warnings 0` unchanged and recorded the temporary red lint state as an execution deviation. The rest of Phase 51 must close the warning inventory before the final severity flip.
- **Files modified:** None beyond planned files.
- **Verification:** `/tmp/51-01-pnpm-lint.txt` captured exit `1`, `3062` design-token matches, and the max-warnings failure.
- **Committed in:** This summary.

**2. [Rule 3 - Blocking] Fixture did not inherit frontend D-05 selectors**

- **Found during:** Task 4
- **Issue:** `tools/eslint-fixtures/**/*` is outside `frontend/**/*.{ts,tsx}` and already has a separate `no-restricted-syntax` vi-mock rule, so the new fixture initially emitted zero D-05 messages.
- **Fix:** Factored D-05 selector objects into `designTokenSyntaxRestrictions` and reused them in a fixture-specific override for `tools/eslint-fixtures/bad-design-token.tsx`.
- **Files modified:** `eslint.config.mjs`
- **Verification:** Fixture lint now emits 3 D-05 warnings.
- **Committed in:** `18c5bd69`

**Total deviations:** 2 auto-fixed / documented.
**Impact on plan:** The policy structure is usable by downstream plans. Workspace lint remains red until the planned fix/disable waves clear the D-05 warnings.

## Issues Encountered

- The plan text said "11 RTL selectors"; the live config has 12 RTL selectors. The resolved rule now contains 15 selectors total: 12 RTL plus 3 D-05 selectors.
- Commit hooks ran `pnpm build` successfully on each task commit. Known warnings persisted: backend PDFDocument namespace import, frontend CSS import ordering, Sentry mixed import, Vite chunk-size warnings, and non-blocking knip output.

## User Setup Required

None.

## Next Phase Readiness

Ready for Plan 51-02 and 51-03. The warning inventory is visible, the Tier-B carve-outs are in place, and `phase-51-base` is available for Plan 51-04 diff audits.

## Self-Check: PASSED WITH DEVIATION

Plan outputs exist and are committed. The only failed planned verification is the expected `pnpm lint` red state caused by the plan's warn-first assumption conflicting with `--max-warnings 0`.

---

_Phase: 51-design-token-compliance-gate_
_Completed: 2026-05-15_
