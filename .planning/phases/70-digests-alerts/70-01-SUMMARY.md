---
phase: 70-digests-alerts
plan: 01
subsystem: testing
tags: [vitest, playwright, nodemailer, pg, intelligence-digests, alerting]

requires:
  - phase: 69-signals
    provides: intelligence_event signal data surface used by digest and alert tests
provides:
  - Phase 70 Wave 0 backend intelligence test scaffold
  - Phase 70 DIGEST-03 E2E placeholder
  - Backend nodemailer and pg dependency availability for SMTP and LISTEN/NOTIFY work
affects: [phase-70-digests-alerts, backend-tests, e2e-tests]

tech-stack:
  added: [nodemailer, pg, '@types/nodemailer', '@types/pg']
  patterns:
    - Wave 0 REQ-ID mapped pending tests under backend/tests/intelligence
    - Backend Vitest include pattern for intelligence tests

key-files:
  created:
    - backend/tests/intelligence/subscriptions.test.ts
    - backend/tests/intelligence/digest-cron.integration.test.ts
    - backend/tests/intelligence/generate-digest.integration.test.ts
    - backend/tests/intelligence/alert-rules.test.ts
    - backend/tests/intelligence/alert-fanout.integration.test.ts
    - backend/tests/intelligence/channel-adapter.test.ts
    - backend/tests/intelligence/webhook-payload-contract.test.ts
    - e2e/intelligence-digests.spec.ts
  modified:
    - backend/package.json
    - backend/vitest.config.ts
    - pnpm-lock.yaml

key-decisions:
  - 'Verified nodemailer, pg, and their DefinitelyTyped packages with npm registry metadata and a clean temporary npm audit before project install.'
  - 'Added tests/intelligence/**/*.test.ts to backend Vitest includes so the required Phase 70 test command discovers the Wave 0 stubs.'
  - 'Used Playwright test.skip for the DIGEST-03 E2E placeholder because Playwright Test does not expose a runtime test.todo API.'

patterns-established:
  - 'Each Phase 70 backend REQ-ID has a dedicated pending Vitest file before implementation begins.'
  - 'Backend intelligence tests are discoverable through the standard intake-backend test command.'

requirements-completed:
  - DIGEST-01
  - DIGEST-02
  - DIGEST-03
  - DIGEST-04
  - ALERT-01
  - ALERT-02
  - ALERT-03
  - ALERT-04

duration: 15 min
completed: 2026-06-15
---

# Phase 70 Plan 01: Wave 0 Test Scaffold and Dependency Gate Summary

**REQ-ID mapped pending test scaffold plus backend nodemailer/pg dependency availability for Phase 70 digest and alert implementation.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-06-15T09:05:00Z
- **Completed:** 2026-06-15T09:20:00Z
- **Tasks:** 2 completed
- **Files modified:** 12

## Accomplishments

- Verified the package legitimacy checkpoint for `nodemailer`, `@types/nodemailer`, `pg`, and `@types/pg` using npm registry metadata, last-week download counts, and a temporary `npm audit` with 0 vulnerabilities.
- Installed backend runtime dependencies `nodemailer` and `pg`, plus dev types `@types/nodemailer` and `@types/pg`.
- Created seven backend Wave 0 Vitest stub files under `backend/tests/intelligence/`, each mapped to a Phase 70 requirement ID.
- Created the DIGEST-03 Playwright E2E placeholder at `e2e/intelligence-digests.spec.ts`.
- Updated `backend/vitest.config.ts` so `pnpm --filter intake-backend test -- --run tests/intelligence/` discovers the new scaffold.

## Task Commits

Each task was committed atomically:

1. **Task 1: Verify nodemailer + pg package legitimacy before install** - no code commit; checkpoint evidence captured in this summary.
2. **Task 2: Install nodemailer + pg backend deps and create test stubs** - `10f9b707` (chore)

**Plan metadata:** committed separately by the docs metadata commit.

## Files Created/Modified

- `backend/tests/intelligence/subscriptions.test.ts` - DIGEST-01 pending subscription CRUD coverage.
- `backend/tests/intelligence/digest-cron.integration.test.ts` - DIGEST-02 pending clearance-gated cron coverage.
- `backend/tests/intelligence/generate-digest.integration.test.ts` - DIGEST-04 pending generate/publish RPC coverage.
- `backend/tests/intelligence/alert-rules.test.ts` - ALERT-01 pending alert rule CRUD coverage.
- `backend/tests/intelligence/alert-fanout.integration.test.ts` - ALERT-02 pending alert fan-out coverage.
- `backend/tests/intelligence/channel-adapter.test.ts` - ALERT-03 pending channel adapter isolation coverage.
- `backend/tests/intelligence/webhook-payload-contract.test.ts` - ALERT-04 pending webhook zero-leak contract coverage.
- `e2e/intelligence-digests.spec.ts` - DIGEST-03 skipped Playwright placeholder.
- `backend/package.json` - added `nodemailer`, `pg`, `@types/nodemailer`, and `@types/pg`.
- `backend/vitest.config.ts` - added `tests/intelligence/**/*.test.ts` include.
- `pnpm-lock.yaml` - locked the new backend dependencies.

## Decisions Made

- Verified package legitimacy before install rather than relying on the research file's `[ASSUMED]` labels.
- Added the missing Vitest include pattern because the plan's required command would not otherwise exercise the new `backend/tests/intelligence/` files.
- Used Playwright `test.skip` for the E2E stub to keep the file executable in this project; `test.todo` is not available in Playwright Test.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added backend Vitest include for intelligence tests**

- **Found during:** Task 2 (test scaffold creation)
- **Issue:** `backend/vitest.config.ts` did not include `tests/intelligence/**/*.test.ts`, so the plan's verification command could miss the Wave 0 stubs.
- **Fix:** Added the include pattern.
- **Files modified:** `backend/vitest.config.ts`
- **Verification:** `pnpm --filter intake-backend test -- --run tests/intelligence/` exited 0 and reported 7 todo tests.
- **Committed in:** `10f9b707`

**2. [Rule 1 - Runtime Compatibility] Used Playwright skip instead of unavailable test.todo**

- **Found during:** Task 2 (E2E stub creation)
- **Issue:** The plan asked for `test.todo()`, but Playwright Test does not expose that runtime API; using it would make the placeholder fail if loaded.
- **Fix:** Created the placeholder with `test.skip(...)` and a Wave 0 header comment.
- **Files modified:** `e2e/intelligence-digests.spec.ts`
- **Verification:** File exists and imports `@playwright/test` without introducing backend type-check errors.
- **Committed in:** `10f9b707`

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 runtime compatibility).
**Impact on plan:** Both preserve the Wave 0 scaffold intent and prevent false-positive verification.

## Issues Encountered

- The first concurrent dependency install attempt raced on `backend/package.json`; reran the runtime dependency install sequentially so all four package entries are present.
- Existing peer dependency warning remains from `@mastra/core` expecting `zod@^3.23.8` while the backend has `zod@4.3.6`; this was pre-existing and not changed by Plan 70-01.

## User Setup Required

None - no external service configuration required.

## Verification

- `pnpm --filter intake-backend list nodemailer pg @types/nodemailer @types/pg --depth 0` - passed.
- `cd backend && pnpm exec node -e "require('nodemailer');require('pg');console.log('deps ok')"` - passed.
- `pnpm --filter intake-backend test -- --run tests/intelligence/` - passed; 15 files passed, 7 files skipped, 7 todo tests reported.
- `pnpm --filter intake-backend type-check` - passed.

## Self-Check: PASSED

- Key files created and modified as planned.
- Dependency entries verified in backend package manifest.
- Backend intelligence test command exits 0.
- Backend type-check exits 0.

## Next Phase Readiness

Ready for 70-02 to author the Phase 70 database migration against the committed Wave 0 test scaffold.

---

_Phase: 70-digests-alerts_
_Completed: 2026-06-15_
