---
phase: 67-per-type-engagement-contracts-legacy-detail-cleanup
plan: 02
subsystem: api
tags: [supabase, rls, engagement, wizard, vitest, tdd]

# Dependency graph
requires:
  - phase: 67-01
    provides: honest engagement participation contract (read half) that this write half fills
provides:
  - engagementWizardConfig.postCreate now stamps created_by from the session on every engagement_participants row
  - wizard-created engagements satisfy the engagement_participants WITH CHECK (created_by = auth.uid()) RLS gate
  - RED-first unit pin for the participant insert payload (67-VALIDATION Wave-0 wizard-payload row)
affects: [67-06, engagement-participants, per-type-engagement-contracts]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "vi.hoisted mock state for '@/lib/supabase' (auth.getUser + from().insert spy) to pin postCreate payloads without a live client"
    - 'Resolve auth user id before building insert rows; warn-and-return on absent session (no RLS policy change)'

key-files:
  created:
    - frontend/src/components/dossier/wizard/__tests__/engagement-participants-payload.test.ts
  modified:
    - frontend/src/components/dossier/wizard/config/engagement.config.ts

key-decisions:
  - 'Fixed the PAYLOAD, never the policy: postCreate maps created_by (from supabase.auth.getUser()) onto every row so it satisfies the existing WITH CHECK — the RLS policy is untouched (threat T-67-04 mitigate)'
  - "No authenticated user id resolvable -> warn-and-return without inserting (explicit skip; same observable result as today's silent RLS drop, but no error). Wizard error UI is out of scope per UI-SPEC (payload-only)"
  - 'Kept the existing insert-error console.warn; with the payload fixed the warn path is now the exception, not the rule'

patterns-established:
  - 'Pattern 1: wizard postCreate inserts derive created_by from the live session so client INSERTs cross RLS WITH CHECK gates by construction'
  - 'Pattern 2: payload-pin unit tests capture the exact insert argument via a hoisted spy, asserting per-row column presence (created_by/engagement_id/role/participant_*)'

requirements-completed: [PERENG-02]

# Metrics
duration: 8min
completed: 2026-06-13
---

# Phase 67 Plan 02: Wizard engagement_participants created_by payload fix Summary

**engagementWizardConfig.postCreate now resolves the auth user id and stamps created_by on every engagement_participants row, so wizard-created engagements satisfy the WITH CHECK (created_by = auth.uid()) RLS gate instead of silently losing their participants — pinned by a RED-first vitest payload test.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-06-13T04:15:00Z
- **Completed:** 2026-06-13T04:23:00Z
- **Tasks:** 2
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments

- Closed RESEARCH Pitfall 1 / PERENG-02 write half: the wizard's participant insert was rejected by RLS for a missing `created_by` (column has no default) and the error was console.warn-swallowed, so every wizard-created engagement silently lost its participants. Now every row carries `created_by` from `supabase.auth.getUser()`.
- Added a RED-first payload-pin unit test that captures the exact insert argument: asserts 2 rows for 2 participant ids, each with `created_by === 'user-1'`, `engagement_id`, `role: 'delegate'`, and the correct `participant_type`/`participant_dossier_id` pairing; plus the empty-participants no-insert and no-authenticated-user skip paths.
- RLS policy left untouched — the fix brings the wizard to parity with the existing edge writer (`addParticipant`), which already sets `created_by`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Payload-pin test — RED first** - `6285efa6` (test)
2. **Task 2: Add created_by to the postCreate payload — GREEN** - `2c6b867d` (fix)

_TDD: Task 1 committed the failing test (RED), Task 2 committed the implementation (GREEN)._

## Files Created/Modified

- `frontend/src/components/dossier/wizard/__tests__/engagement-participants-payload.test.ts` - RED-first payload pin: hoisted `@/lib/supabase` mock (auth.getUser + from('engagement*participants').insert spy); asserts per-row `created_by`/`engagement_id`/`role`/`participant*\*` and the two skip paths.
- `frontend/src/components/dossier/wizard/config/engagement.config.ts` - `postCreate` resolves `userId` via `supabase.auth.getUser()` before building rows, warns-and-returns when absent, and maps `created_by: userId` immutably onto every participant row.

## Decisions Made

- Fixed the payload, not the policy (threat register T-67-04 `mitigate`) — never weaken WITH CHECK.
- Warn-and-return on absent session instead of throwing — explicit no-op preserving today's observable behavior without an unhandled error; wizard error UI is out of scope per UI-SPEC.
- Kept `buildParticipantRows`, `filterExtensionData`, the schema, and the insert-error `console.warn` untouched — surgical change scoped to the `created_by` gap.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The worktree base lacked `node_modules`; ran `pnpm install --frozen-lockfile` at the worktree root (per parallel_execution instruction) before running vitest/type-check. Expected setup step, not a code issue.
- Prettier (pre-commit) reformatted the test file (collapsed the `callPostCreate` signature to one line); the committed version is canonical and unaffected.

## Threat Flags

None — no new network endpoint, auth path, file-access pattern, or schema change introduced. The change brings an existing client INSERT into compliance with the existing RLS WITH CHECK gate.

## Self-Check: PASSED

- FOUND: frontend/src/components/dossier/wizard/**tests**/engagement-participants-payload.test.ts
- FOUND commit: 6285efa6 (Task 1 RED)
- FOUND commit: 2c6b867d (Task 2 GREEN)
- All 3 payload tests GREEN; `pnpm type-check` exit 0; `created_by` present in engagement.config.ts.

## Verification

- 67-VALIDATION Wave-0 wizard-payload row realized RED -> GREEN (RED_CONFIRMED on Task 1, all 3 GREEN after Task 2).
- Per-task gate: `pnpm exec vitest run` on the payload file + `pnpm type-check` (exit 0) + `grep created_by` on the config.

## Next Phase Readiness

- PERENG-02 write half done: wizard-created engagements now accrue participation rows. The live create->row proof runs in 67-06.
- No blockers introduced. RLS policy and edge writer parity preserved.

---

_Phase: 67-per-type-engagement-contracts-legacy-detail-cleanup_
_Completed: 2026-06-13_
