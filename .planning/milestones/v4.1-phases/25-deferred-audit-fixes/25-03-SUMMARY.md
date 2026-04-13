---
phase: 25-deferred-audit-fixes
plan: 03
subsystem: api
tags: [optimistic-locking, conflict-detection, updated_at, express, react, supabase]

requires:
  - phase: 25-deferred-audit-fixes
    provides: after-action CRUD endpoints and editor routes

provides:
  - Server-side optimistic locking via updated_at WHERE clause on after-action PUT
  - 409 CONFLICT response with serverUpdatedAt for conflict resolution
  - Frontend conflict detection hook with ConflictError type
  - Destructive conflict warning banner on both after-action editor routes

affects: [after-action-editing, concurrent-editing, data-integrity]

tech-stack:
  added: []
  patterns: [optimistic-locking-via-updated_at, TOCTOU-gap-closure, 409-conflict-response]

key-files:
  created: []
  modified:
    - backend/src/api/after-action.ts
    - frontend/src/hooks/useAfterAction.ts
    - frontend/src/routes/_protected/after-actions/$afterActionId.tsx
    - frontend/src/routes/_protected/engagements/$engagementId/after-action.tsx

key-decisions:
  - 'Kept both _version and updated_at locking for backwards compatibility'
  - 'Server-side WHERE updated_at clause closes TOCTOU gap between SELECT and UPDATE'
  - 'ConflictError type exported from hook for reuse across components'

patterns-established:
  - 'Optimistic locking pattern: client sends updated_at, server validates with WHERE clause'
  - "409 CONFLICT response shape: { error: 'CONFLICT', message, serverUpdatedAt }"
  - 'Conflict banner pattern: useState<ConflictError | null> with destructive warning and reload CTA'

requirements-completed: [D-41]

duration: 8min
completed: 2026-04-12
---

# Phase 25 Plan 03: After-Action Optimistic Locking Summary

**Server-side updated_at WHERE clause prevents silent overwrites with 409 CONFLICT response and destructive warning banner on conflict**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-12T19:36:14Z
- **Completed:** 2026-04-12T19:43:59Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Backend PUT endpoint now validates updated_at timestamp and uses WHERE clause to close TOCTOU gap
- Three distinct 409 CONFLICT paths: \_version mismatch, updated_at mismatch, and TOCTOU race condition
- Frontend useUpdateAfterAction hook parses conflict errors and attaches ConflictError to thrown error
- Both after-action editor routes show destructive warning banner with reload CTA on conflict

## Task Commits

Each task was committed atomically:

1. **Task 1 + Task 2: Server-side optimistic locking + Conflict UI** - `15ed0983` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified

- `backend/src/api/after-action.ts` - Added updated_at validation, WHERE clause, 409 CONFLICT responses
- `frontend/src/hooks/useAfterAction.ts` - Added ConflictError type, updated useUpdateAfterAction to detect 409
- `frontend/src/routes/_protected/after-actions/$afterActionId.tsx` - Added conflict state and warning banner
- `frontend/src/routes/_protected/engagements/$engagementId/after-action.tsx` - Added conflict state and warning banner

## Decisions Made

- Kept both `_version` and `updated_at` locking mechanisms for backwards compatibility with existing clients
- Used Supabase `.eq('updated_at', ...)` on the update query to close the TOCTOU gap between the initial SELECT check and the actual UPDATE
- Re-fetch record after TOCTOU failure to provide accurate `serverUpdatedAt` in the 409 response

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Pre-existing typecheck errors in backend (unused types, missing columns in generated types) - not introduced by this plan, out of scope per deviation rules

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Optimistic locking foundation ready for any future concurrent editing features
- i18n keys use inline fallbacks; translation files can be updated separately
- Pattern can be reused for other entity types that need conflict detection

## Self-Check: PASSED

All 4 modified files verified present. Commit 15ed0983 verified in git log.

---

_Phase: 25-deferred-audit-fixes_
_Completed: 2026-04-12_
