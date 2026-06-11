---
phase: 55-designv2-main-merge-gate-enforcement
plan: '03'
subsystem: infra
tags: [ci, github-actions, branch-protection, rest-api, gh-cli, audit-trail]

# Dependency graph
requires:
  - phase: 55-02
    provides: 'Two new CI jobs (`Design Token Check` + `react-i18next Factory Check`) live on origin/main and verified green on post-merge main HEAD CI run 25990939105 — Pitfall 4 belt-and-braces precondition for this plan'
provides:
  - 'Branch protection on `main` enforces exactly 8 required status check contexts (was 6): the original 6 (`type-check`, `Security Scan`, `Lint`, `Bundle Size Check (size-limit)`, `Tests (frontend)`, `Tests (backend)`) PLUS 2 new (`Design Token Check`, `react-i18next Factory Check`)'
  - 'All security-critical fields preserved verbatim across the PUT round-trip (T-55-01 + T-55-PB mitigated): `enforce_admins=true`, `allow_force_pushes=false`, `allow_deletions=false`, `block_creations=false`, `required_conversation_resolution=false`, `required_linear_history=false`, `lock_branch=false`, `allow_fork_syncing=false`, `strict=true`'
  - 'Audit trail committed: `protection-before.json` (GET snapshot, 6 contexts) + `protection-after.json` (PUT body, 8 contexts) per D-16'
  - 'D-13 reversal of v6.3 D-09 fold-into-Lint now enforced server-side: the new contexts are SEPARATE required contexts (not folded), producing distinct PR failure attribution'
  - 'Rollback recipe captured in this SUMMARY — one jq + one PUT to return to 6-context state'
affects:
  - phase-55-04 (smoke PR — Wave 4 — consumes the 8-context contract to demonstrate `mergeStateStatus=BLOCKED` via planted violations)
  - phase-56 (PRs against main will now report 8 required contexts)
  - phase-57 (same — protection inherits to every PR)
  - phase-58 (same)
  - phase-59 (same)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Branch protection round-trip pattern (Pitfall 1+2 mitigation): GET → jq transform from `{enabled: bool}` wrappers to raw booleans → PUT. The transform is the single source of truth; any future protection edit must use the same recipe.'
    - 'Pre-flight + post-flight invariant assertions: assert security booleans BEFORE the PUT (catches a typo-driven destructive PUT) AND after (catches server-side acceptance with unexpected drift).'
    - 'Committed JSON audit trail: protection-before.json + protection-after.json live in the phase folder as a durable record of the exact server-side mutation, enabling deterministic rollback and post-hoc forensics.'

key-files:
  created:
    - .planning/phases/55-designv2-main-merge-gate-enforcement/protection-before.json
    - .planning/phases/55-designv2-main-merge-gate-enforcement/protection-after.json
    - .planning/phases/55-designv2-main-merge-gate-enforcement/55-03-SUMMARY.md
  modified: []

key-decisions:
  - 'D-13 (from CONTEXT.md) enforced server-side: required contexts are now 8 (6 original + Design Token Check + react-i18next Factory Check). This explicitly reverses v6.3 Phase 51 D-09 (fold-design-token-rule-into-Lint) for failure-attribution clarity.'
  - 'D-16 (from CONTEXT.md) executed: Claude ran `gh api -X PUT` directly with the committed `protection-after.json` as input. Scripted + repeatable + audited.'
  - 'jq transform follows RESEARCH §"Update branch protection (plan 3 — D-16)" verbatim. No deviation from the canonical recipe.'

patterns-established:
  - 'Pattern: protection-before.json + protection-after.json per phase that mutates branch protection. Future phases editing protection MUST commit both files for the same audit-trail reason.'
  - 'Pattern: pre-flight `length == N` assertion on `required_status_checks.contexts` catches a partial run resuming on already-mutated state. Phase 55-03 asserted length==6 before transforming; a re-run on the post-PUT state (length==8) would have correctly aborted.'

requirements-completed: [] # MERGE-02 remains PARTIAL after this plan. Plans 55-02 + 55-03 satisfy the preparation half (jobs exist + gate-required); Plan 55-04 satisfies the proof half (smoke PR captures mergeStateStatus=BLOCKED). MERGE-02 will be ticked complete by Plan 55-04 only.

# Metrics
duration: ~2min
completed: 2026-05-17
---

# Phase 55 Plan 03: Branch Protection Round-Trip (6 → 8 Required Contexts) Summary

**PASS — main branch protection now requires exactly 8 status check contexts; all security invariants (`enforce_admins=true`, `allow_force_pushes=false`, `allow_deletions=false`, `block_creations=false`) preserved verbatim across the PUT round-trip; Plan 55-04 (smoke PR) unblocked.**

## Performance

- **Duration:** ~2 min (one Claude pass; no human-action gates; autonomous=true)
- **Started:** 2026-05-17T12:44:13Z (Task 1 — snapshot protection-before.json)
- **Completed:** 2026-05-17T12:46:54Z (Task 4 — write this SUMMARY)
- **Tasks:** 4 (all `type="auto"`)
- **Files modified:** 3 (protection-before.json + protection-after.json + this SUMMARY)

## Accomplishments

- **Server-side branch protection on `main` updated from 6 → 8 required contexts.** Verified by independent GET after the PUT.
- **Both new context names landed verbatim**:
  - `Design Token Check` (exact `name:` from `.github/workflows/ci.yml` `jobs.design-token-check.name:`)
  - `react-i18next Factory Check` (exact `name:` from `.github/workflows/ci.yml` `jobs.i18next-factory-check.name:`)

  Per Pitfall 3, these strings byte-match the check-run names GitHub reports, so newly opened PRs will see the contexts populate (no "Expected — Waiting for status to be reported" trap).

- **All preserved booleans verified intact server-side post-PUT** (T-55-01 + T-55-PB + T-55-PD mitigations live):
  - `enforce_admins.enabled` = `true` (admin bypass blocked)
  - `allow_force_pushes.enabled` = `false` (history rewriting blocked)
  - `allow_deletions.enabled` = `false` (branch deletion blocked)
  - `block_creations.enabled` = `false` (unchanged — no creation restriction)
  - `required_conversation_resolution.enabled` = `false` (unchanged)
  - `required_linear_history.enabled` = `false` (unchanged — preserves `--no-ff` merge ability per D-01)
  - `lock_branch.enabled` = `false` (unchanged)
  - `allow_fork_syncing.enabled` = `false` (unchanged)
  - `required_signatures.enabled` = `false` (unchanged — signing remains advisory per repo policy)
  - `required_status_checks.strict` = `true` (unchanged — PRs must be up-to-date with main before merge)
  - `required_pull_request_reviews` = `null` (unchanged — owner-only repo, no review requirement)
  - `restrictions` = `null` (unchanged — no push restrictions)
- **Audit trail committed to phase folder** per D-16: both `protection-before.json` (GET shape, 6 contexts) and `protection-after.json` (PUT shape, 8 contexts).
- **Pitfall 4 belt-and-braces re-verified at Task 1:** latest main CI run (id `25991176984`) confirmed both new job names exist in `.jobs[].name`, so adding the contexts to `required_status_checks.contexts[]` does NOT brick future PRs with "Expected — Waiting for status to be reported".

## Diff Summary (before vs after)

| Field                                      | Before                                                                                                         | After                                                                                                                                                                                   |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `required_status_checks.contexts.length`   | **6**                                                                                                          | **8**                                                                                                                                                                                   |
| `required_status_checks.contexts[]`        | `type-check`, `Security Scan`, `Lint`, `Bundle Size Check (size-limit)`, `Tests (frontend)`, `Tests (backend)` | `type-check`, `Security Scan`, `Lint`, `Bundle Size Check (size-limit)`, `Tests (frontend)`, `Tests (backend)`, **`Design Token Check`** (NEW), **`react-i18next Factory Check`** (NEW) |
| `required_status_checks.strict`            | `true`                                                                                                         | `true` (unchanged)                                                                                                                                                                      |
| `enforce_admins.enabled`                   | `true`                                                                                                         | `true` (unchanged — T-55-01 mitigated)                                                                                                                                                  |
| `allow_force_pushes.enabled`               | `false`                                                                                                        | `false` (unchanged)                                                                                                                                                                     |
| `allow_deletions.enabled`                  | `false`                                                                                                        | `false` (unchanged)                                                                                                                                                                     |
| `block_creations.enabled`                  | `false`                                                                                                        | `false` (unchanged)                                                                                                                                                                     |
| `required_conversation_resolution.enabled` | `false`                                                                                                        | `false` (unchanged)                                                                                                                                                                     |
| `required_linear_history.enabled`          | `false`                                                                                                        | `false` (unchanged — preserves `--no-ff` merge per D-01)                                                                                                                                |
| `lock_branch.enabled`                      | `false`                                                                                                        | `false` (unchanged)                                                                                                                                                                     |
| `allow_fork_syncing.enabled`               | `false`                                                                                                        | `false` (unchanged)                                                                                                                                                                     |
| `required_signatures.enabled`              | `false`                                                                                                        | `false` (unchanged)                                                                                                                                                                     |
| `required_pull_request_reviews`            | `null` (absent)                                                                                                | `null` (unchanged)                                                                                                                                                                      |
| `restrictions`                             | `null` (absent)                                                                                                | `null` (unchanged)                                                                                                                                                                      |

**Net change:** +2 required contexts. Zero changes to any other field.

## D-13 Reversal of v6.3 D-09 — Now Enforced (DO NOT RE-FOLD)

v6.3 Phase 51 D-09 deliberately folded the design-token rule into the existing `Lint` context to avoid touching branch protection (no new PUT). Phase 55 D-13 reverses this: when the design-token gate fires, the user wants to see `Design Token Check ✗` distinct from `Lint ✗`, not a single conflated `Lint ✗`. Same rationale for splitting `react-i18next Factory Check` out of `Tests (frontend)`.

Plan 55-02 landed the jobs on main. Plan 55-03 (this plan) wires them into the required-contexts contract so the failure attribution is durable across every PR going forward.

**Why explicit here:** so future audits (v6.5+, v7.x) don't ping-pong the decision back to "fold into Lint to save a CI yaml job".

## Task Commits

Each task was committed atomically. Task 3 is a server-side mutation only — no local file commit (the PUT body was already committed in Task 2 and the post-PUT GET verification is captured in this SUMMARY's diff table, not a separate file).

1. **Task 1 — Snapshot current protection + pre-flight invariants** — `6c2397b2` (`docs(55-03): snapshot main branch protection before PUT`)
2. **Task 2 — Build protection-after.json via jq round-trip + pre-PUT invariants** — `cee4726c` (`docs(55-03): build protection-after.json (PUT body, 6→8 contexts)`)
3. **Task 3 — PUT + server-side verification** — no local commit (server-side mutation only). `gh api -X PUT` returned 200 with the 8-context state; independent re-GET confirmed all invariants intact.
4. **Task 4 — Write SUMMARY** — (this commit, captured below)

**Plan metadata commit:** to be added with this SUMMARY + STATE.md + ROADMAP.md + REQUIREMENTS.md updates.

## Files Created/Modified

- **`.planning/phases/55-designv2-main-merge-gate-enforcement/protection-before.json`** — GET snapshot of branch protection BEFORE the PUT. 6 contexts, `{enabled: bool}` wrapper shape (GitHub GET-response shape per Pitfall 2). Audit trail per D-16.
- **`.planning/phases/55-designv2-main-merge-gate-enforcement/protection-after.json`** — PUT body sent to GitHub. 8 contexts, raw-boolean shape (Pitfall 2 mismatch handled by the jq transform). Doubles as a rollback template (see Rollback section below). Audit trail per D-16.
- **`.planning/phases/55-designv2-main-merge-gate-enforcement/55-03-SUMMARY.md`** — this file.

## Rollback Procedure

If for any reason the 8-context state must be reverted to 6, the rollback is **one jq + one PUT**:

```bash
PHASE_DIR=.planning/phases/55-designv2-main-merge-gate-enforcement

# Convert the committed protection-before.json (GET shape) to PUT shape;
# keep the original 6 contexts (NO append of the 2 new ones).
jq '
  {
    required_status_checks: {
      strict: .required_status_checks.strict,
      contexts: .required_status_checks.contexts
    },
    enforce_admins: .enforce_admins.enabled,
    required_pull_request_reviews: null,
    restrictions: null,
    required_linear_history: .required_linear_history.enabled,
    allow_force_pushes: .allow_force_pushes.enabled,
    allow_deletions: .allow_deletions.enabled,
    block_creations: .block_creations.enabled,
    required_conversation_resolution: .required_conversation_resolution.enabled,
    lock_branch: .lock_branch.enabled,
    allow_fork_syncing: .allow_fork_syncing.enabled
  }' "$PHASE_DIR/protection-before.json" \
  > /tmp/protection-rollback.json

# Apply
gh api -X PUT repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \
  --input /tmp/protection-rollback.json

# Verify
gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \
  --jq '.required_status_checks.contexts | length'
# Expected: 6
```

**Decision criteria for invoking rollback:**

- The new `Design Token Check` or `react-i18next Factory Check` jobs are silently broken on main (CI runs report `success` but the underlying lint rule is actually wired-out). Mitigated by Plan 55-02's `--max-warnings 0` positive-failure assertion against `tools/eslint-fixtures/bad-*`; if either fixture starts passing lint cleanly, the rollback should be invoked AND Phase 59 POLISH-04 escalated.
- A real (non-smoke) PR is hung indefinitely in "Expected — Waiting for status to be reported" on one of the 2 new contexts (Pitfall 3 / Pitfall 4 symptom). Mitigated pre-PUT by re-verifying both job names appear on the latest main CI run; rollback is the safety net.

T-55-RB (Repudiation — rollback procedure missing) mitigated.

## Decisions Made

- **D-13 / D-16 followed verbatim**. No tactical decisions of substance needed during execution — the planning agent had locked the choices and the jq transform recipe was provided in RESEARCH.
- **Task 3 produced no local file commit by design**. The plan's `<files>` for Task 3 explicitly notes "(server-side mutation; no local file writes — but the PUT response is logged)". The post-PUT GET response is captured here in the SUMMARY's diff table rather than as a third JSON file — this keeps the audit minimal (before + after, not before + after + verify-after).
- **All 8 context strings byte-match `ci.yml` `jobs.<id>.name:` values from Plan 55-02 SUMMARY's "Required-Context Names for Plan 55-03" table**. No interpretive ambiguity.

## Deviations from Plan

**None — plan executed exactly as written.** All pre-flight invariants passed first-try; the jq transform matched the RESEARCH recipe verbatim; the PUT returned successfully; the post-PUT GET confirmed all invariants intact. No Rule 1/2/3 auto-fixes were needed.

## Issues Encountered

None.

## User Setup Required

None. Branch protection is server-side and effective immediately. Plan 55-04 (smoke PR) is the next executable plan.

## Next Phase Readiness

- **Plan 55-04 (Wave 4)** unblocked. The 8-context contract is live on `main`. Plan 55-04 opens a smoke PR with planted violations against multiple required contexts and asserts `mergeStateStatus=BLOCKED` via `gh pr view --json` (D-09 / D-11). Both new contexts (`Design Token Check` + `react-i18next Factory Check`) will be exercised in the smoke PR's checks.
- **MERGE-02 satisfaction** completes after Plan 55-04 captures the BLOCKED evidence. Until then MERGE-02 remains PARTIAL (preparation half — Plans 55-02 + 55-03 — complete; proof half pending).
- **Phases 56–59** can plan against the post-protection-update state — all future PRs against `main` will report exactly these 8 required contexts.

## Self-Check

- `[FOUND] .planning/phases/55-designv2-main-merge-gate-enforcement/protection-before.json` — Task 1
- `[FOUND] .planning/phases/55-designv2-main-merge-gate-enforcement/protection-after.json` — Task 2
- `[FOUND] .planning/phases/55-designv2-main-merge-gate-enforcement/55-03-SUMMARY.md` — this file
- `[FOUND] commit 6c2397b2 docs(55-03): snapshot main branch protection before PUT` — Task 1 commit
- `[FOUND] commit cee4726c docs(55-03): build protection-after.json (PUT body, 6→8 contexts)` — Task 2 commit
- `[VERIFIED] gh api .../branches/main/protection` → `required_status_checks.contexts | length == 8`; both `Design Token Check` and `react-i18next Factory Check` present
- `[VERIFIED] gh api .../branches/main/protection` → `enforce_admins.enabled == true`, `allow_force_pushes.enabled == false`, `allow_deletions.enabled == false`
- `[VERIFIED] gh api .../actions/runs/25991176984/jobs` → both new job names appear in `.jobs[].name` (Pitfall 4 belt-and-braces re-confirmed at Task 1)

## Self-Check: PASSED

---

_Phase: 55-designv2-main-merge-gate-enforcement_
_Plan: 03_
_Completed: 2026-05-17_
