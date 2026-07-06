---
phase: 86-feature-completion
plan: 03
subsystem: ui
tags: [positions, consistency-panel, i18n, adr, feature-retirement, cleanup]

# Dependency graph
requires:
  - phase: 86-feature-completion
    provides: 86-RESEARCH.md § FEAT-04 build-vs-delete evidence; 86-PATTERNS.md delete-scope table (items 21-26)
provides:
  - ConsistencyPanel frontend surface fully retired (component, test, i18n consistency block EN+AR, dead types, stale mount comment)
  - ADR-008 recording the retirement decision with a post-Phase-91 revisit trigger
  - Backend consistency assets retained dormant (edge fns, table, RPCs, migrations, generated schema)
affects: [phase-91-live-inference, positions, position-embeddings-backfill]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Feature retirement via auditable ADR + revisit trigger rather than silent deletion'
    - 'Frontend-only retirement: delete UI surface, retain backend substrate dormant for a future re-scope'

key-files:
  created:
    - .planning/decisions/ADR-008-consistency-panel-retirement.md
  modified:
    - frontend/src/domains/positions/types/index.ts
    - frontend/src/types/position.ts
    - frontend/src/i18n/en/positions.json
    - frontend/src/i18n/ar/positions.json
    - frontend/src/routes/_protected/positions/$id.tsx

key-decisions:
  - 'DELETE the ConsistencyPanel frontend surface; RETAIN backend assets (edge fns, position_consistency_checks table/RPCs, migrations, database.types.ts schema) dormant'
  - 'Revisit trigger: after Phase 91 LIVE-01, re-scope as LLM-backed consistency review WITH a position_embeddings backfill; never resurrect the keyword heuristic as a numeric score'
  - 'STATE.md Decisions Made entry deferred to the phase orchestrator (worktree agents do not write shared artifacts)'

patterns-established:
  - 'Retirement ADR pattern: Status/Date/Context/Decision/Revisit-Trigger/Residual-Risk, following ADR-007 house format'

requirements-completed: [FEAT-04]

# Metrics
duration: 13min
completed: 2026-07-06
---

# Phase 86 Plan 03: ConsistencyPanel Retirement Summary

**FEAT-04 DELETE path executed: the permanently-inert ConsistencyPanel frontend surface (component, 17 stub tests, 99-line EN/AR i18n block, dead `ConsistencyCheck` type + lying `SubmitPositionResponse.consistency_check` field, stale mount comment) removed; backend consistency assets retained dormant; decision recorded in ADR-008 with a post-Phase-91 revisit trigger.**

## Performance

- **Duration:** ~13 min
- **Started:** 2026-07-06T13:44:00+03:00
- **Completed:** 2026-07-06T13:54:40+03:00
- **Tasks:** 2
- **Files modified:** 8 (2 deleted, 5 modified, 1 created)

## Accomplishments

- Deleted `components/consistency-panel/ConsistencyPanel.tsx` (mounted nowhere) and its 17-test stub-contract test file.
- Removed the `consistency` i18n block from `en/positions.json` and `ar/positions.json` symmetrically (99 lines each, 0 additions — pure surgical deletion, both files valid JSON, key sets stay parallel).
- Pruned the dead `ConsistencyCheck` interface and the `SubmitPositionResponse.consistency_check` field (its sole consumer, `useSubmitPosition`, reads only `data.position` — verified) plus the stale mount comment in `positions/$id.tsx`.
- Recorded ADR-008 with the four pivotal evidence points, the retained-backend inventory, and the mandatory Phase-91/LIVE-01 revisit trigger + "never resurrect the keyword heuristic" constraint.
- Verified full frontend suite stays green: type-check exit 0, 1471 tests passed (193 files), eslint `--max-warnings 0` + all 4 lint check scripts exit 0.

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete the ConsistencyPanel surface** - `e4e937d6` (refactor)
2. **Task 2: Record the retirement decision (ADR-008)** - `98f26ebb` (docs)

_No separate plan-metadata commit: STATE.md/ROADMAP.md are owned by the phase orchestrator; this summary is committed on the worktree branch for the orchestrator to merge._

## Files Created/Modified

- `.planning/decisions/ADR-008-consistency-panel-retirement.md` - Auditable retirement decision + Phase-91 revisit trigger (created)
- `frontend/src/components/consistency-panel/ConsistencyPanel.tsx` - Deleted (component mounted nowhere)
- `frontend/src/components/__tests__/ConsistencyPanel.test.tsx` - Deleted (17 tests against the old stub contract)
- `frontend/src/i18n/en/positions.json` - Removed the `consistency` block
- `frontend/src/i18n/ar/positions.json` - Removed the `consistency` block (EN/AR symmetric)
- `frontend/src/routes/_protected/positions/$id.tsx` - Removed the stale mount comment
- `frontend/src/types/position.ts` - Removed the dead `ConsistencyCheck` interface
- `frontend/src/domains/positions/types/index.ts` - Removed the import alias, re-export, and `consistency_check` field (leaving `SubmitPositionResponse` as `{ position }`)

**Backend retained untouched (retention proof):** `frontend/src/types/database.types.ts` still carries the `position_consistency_checks` schema (grep positive); the `positions-consistency-check` / `positions-consistency-reconcile` edge functions, the `position_consistency_checks` table + `get_latest_consistency_check`/`can_auto_approve_position` RPCs, and migrations `20250101008` + `20260111100001` were not modified.

## Decisions Made

- **DELETE frontend, RETAIN backend dormant.** Rationale: the vector leg is dead (nothing writes `position_embeddings`), the LLM leg is Phase-91-gated, and the remaining keyword heuristic is a false-positive generator — wiring it would ship misleading UI. Deleting loses nothing recoverable; the backend substrate and ADR-008 are the revisit map. (Full evidence in ADR-008 / 86-RESEARCH.md § FEAT-04.)
- **Revisit trigger recorded** so this is a documented retirement, not a silent removal (closes E-8 / success criterion 4).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Hydrated the fresh worktree's node_modules to run the verification gates**

- **Found during:** Task 1 verification (type-check/test/lint)
- **Issue:** The parallel worktree had no `node_modules`, so `tsc`/`vitest`/`eslint` could not run. This plan touches no `package.json`/lockfile, so the dependency graph is identical to the main checkout.
- **Fix:** Symlinked `node_modules` (root + frontend + backend) to the fully-hydrated main repo's `node_modules`, ran all gates, then removed the symlinks to leave a clean worktree. This is NOT a package install of a new/referenced dependency (the Rule-3 exclusion) — it reuses the project's already-declared deps; `package.json` and the lockfile are unchanged.
- **Verification:** type-check exit 0; 1471 tests passed; eslint + 4 check scripts exit 0; `git status` clean after symlink removal.
- **Committed in:** n/a (no repo files changed by this fix)

### Directed deviation (per execution objective)

**2. Skipped the STATE.md "Decisions Made" edit that Task 2 / the plan frontmatter specified**

- **Reason:** The execution objective explicitly overrode the plan: worktree agents must NOT modify shared orchestrator artifacts (`STATE.md`, `ROADMAP.md`); the orchestrator records phase state centrally after the wave completes. The plan's `files_modified` list and Task 2 acceptance criterion (`rg -q "ADR-008" .planning/STATE.md`) were therefore intentionally not executed here.
- **Impact:** The decision + revisit trigger are fully captured in ADR-008 (the auditable record). The orchestrator owns appending the one-line STATE.md "Decisions Made" entry referencing ADR-008. The `must_haves` key-link (STATE.md → ADR-008) will be satisfied at the orchestrator step, not by this agent.

---

**Total deviations:** 1 auto-fixed (Rule 3 blocking, no repo change) + 1 directed (STATE.md deferred to orchestrator)
**Impact on plan:** No scope creep. The frontend retirement, backend retention, and ADR are exactly as planned; only the shared-artifact write was reassigned to the orchestrator per the objective.

## Issues Encountered

- None beyond the node_modules hydration handled above. The AR consistency block appeared much larger than EN by line number (key ordering differs between the files), but the git diff confirmed an identical 99-line surgical deletion in both with zero additions and valid JSON on both sides.

## User Setup Required

None - no external service configuration required. Deletion-only change; no migrations, no env vars, no new packages.

## Threat Flags

None - deletion-only plan introduces no new endpoints, auth paths, file access, or schema at trust boundaries. Per the plan threat register, deleting the panel removes the integrity risk of shipping a misleading keyword-derived consistency score (T-86-10 mitigated via ADR-008; T-86-11 retained-fn risk accepted, CORS hardening is Phase 90 scope).

## Next Phase Readiness

- E-8 closed: ConsistencyPanel fully deleted with the decision recorded (ROADMAP Phase 86 success criterion 4).
- **Orchestrator action required:** append the STATE.md "Decisions Made" entry referencing ADR-008 (deferred from this agent per the isolation rule).
- Phase 91 (LIVE-01) is the revisit point if position consistency is re-scoped as LLM-backed review with an embeddings backfill.

## Self-Check: PASSED

- Created files exist: `ADR-008-consistency-panel-retirement.md`, `86-03-SUMMARY.md` (FOUND)
- Deleted files gone: `ConsistencyPanel.tsx`, `ConsistencyPanel.test.tsx` (GONE)
- Task commits exist: `e4e937d6` (Task 1), `98f26ebb` (Task 2), `22351e0a` (summary) (FOUND)
- Worktree clean; no untracked files

---

_Phase: 86-feature-completion_
_Completed: 2026-07-06_
