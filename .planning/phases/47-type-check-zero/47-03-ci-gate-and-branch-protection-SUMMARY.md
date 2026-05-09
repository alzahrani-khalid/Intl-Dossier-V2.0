---
phase: 47-type-check-zero
plan: 03
subsystem: infra
tags: [ci, github-actions, branch-protection, type-check, typescript]

requires:
  - phase: 47-01
    provides: frontend type-check at 0 errors (locally on DesignV2)
  - phase: 47-02
    provides: backend type-check at 0 errors (locally on DesignV2)

provides:
  - Local CI workflow change splitting `Lint` job into separate `Lint` + `type-check` jobs
  - TYPE-04 phase-wide reconciliation: 0 net-new `@ts-(ignore|expect-error)`; 3 net-new `@ts-nocheck` on auto-generated Supabase types (all ledgered)

affects: [v6.2-milestone-merge, future-protected-main-PRs]

tech-stack:
  added: []
  patterns:
    - 'CI: per-workspace `pnpm --filter intake-frontend|intake-backend type-check` invocation (bypasses turbo `dependsOn:[build]`)'
    - 'Clean attribution: tsc failures land on `type-check` job, lint failures on `Lint` job'

key-files:
  created: []
  modified:
    - .github/workflows/ci.yml — split Lint into Lint + type-check; 4 downstream needs: arrays updated
    - .planning/phases/47-type-check-zero/47-EXCEPTIONS.md — TYPE-04 reconciliation row appended

key-decisions:
  - "Plan executes Tasks 1, 2, 6 locally; Tasks 3-5 deferred to v6.2 milestone merge — main is 753 commits behind DesignV2 so a focused 47-03 PR-vs-main violates D-08 (CI births red against main's pre-fix code)"
  - 'Use workspace package names (intake-frontend / intake-backend) for `pnpm --filter`, not directory names — pnpm filters by package.json `name` field'
  - 'TYPE-03 acceptance (branch protection on `main` requiring Lint + type-check) is staged on local YAML but cannot be enforced until DesignV2 → main milestone merge lands'

patterns-established:
  - 'Cherry-pick scope guard: when working branch diverges by >>50 commits from main, single-plan PRs that depend on main being at zero must wait for the milestone merge — D-08 is the codified rule'

requirements-completed: [TYPE-04]
requirements-deferred:
  - id: TYPE-03
    reason: 'PR-blocking type-check gate on main + branch protection + smoke tests. Prerequisite: DesignV2 (753 commits ahead) merged into main so the new type-check job runs against zero-error code.'

duration: ~7min (Tasks 1, 2, 6 local; Tasks 3-5 deferred)
completed: 2026-05-09
status: PARTIAL
---

# Plan 47-03: CI Gate + Branch Protection — PARTIAL (Tasks 3-5 Deferred to Milestone Merge)

**CI workflow split landed locally on DesignV2; branch-protection enforcement and smoke-test verification deferred to v6.2 milestone merge because main is 753 commits behind DesignV2 and 47-01..47-11's type-fix work has not yet reached main.**

## Performance

- **Duration:** ~7 min wall-clock for local edits (Tasks 1, 2, 6); Tasks 3-5 not attempted
- **Completed:** 2026-05-09
- **Tasks:** 3 of 6 complete locally; 3 deferred to milestone merge

## Status: PARTIAL

| Task | Description                                                                        | Status                                 |
| ---- | ---------------------------------------------------------------------------------- | -------------------------------------- |
| 1    | Pre-flight: capture protection state, verify 47-01/47-02 SUMMARYs                  | DONE (capture only — main not at zero) |
| 2    | Split `Lint` into `Lint` + `type-check` jobs in ci.yml                             | DONE locally — commit `815fb203`       |
| 3    | Push wiring branch + open PR + observe both checks green + merge                   | **DEFERRED** to v6.2 milestone merge   |
| 4    | Set GitHub branch protection on `main` (Lint + type-check, enforce_admins=true)    | **DEFERRED** to post-merge             |
| 5    | Open 2 deliberately-broken smoke-test PRs (frontend + backend) and observe BLOCKED | **DEFERRED** to post-protection        |
| 6    | TYPE-04 phase-wide reconciliation in 47-EXCEPTIONS.md                              | DONE locally — commit `e45b9075`       |

## Why Tasks 3-5 are deferred

Plan frontmatter `phase_decisions_locked.D-08_CI_split_post_zero` requires:

> "If main currently shows red type-check (because 47-01/47-02 have not merged), STOP — splitting before zero births the new job red"

Current state of `origin/main`:

- main HEAD: `49b225b8` (chore: gitignore cleanup)
- DesignV2 ahead of main: **753 commits**
- main has not received 47-01, 47-02, 47-04..47-11
- A focused 47-03 PR (cherry-pick `815fb203` + `e45b9075` onto main) would run the new `type-check` job against main's pre-fix code, which has 1580+ frontend errors → CI red on first run → D-08 violation.

The locked precondition cannot be satisfied within a single-plan PR. The only valid path is the v6.2 milestone merge of `DesignV2 → main`, which delivers all type-fix work and the workflow split together. The new type-check job goes green on first run after that merge because all 1580 frontend + 498 backend errors are already cleared on DesignV2.

## Local Commits (on DesignV2)

| Commit     | Subject                                                                   | Scope                                                        |
| ---------- | ------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `815fb203` | ci(47-03): split type-check into its own CI job                           | `.github/workflows/ci.yml` (+30, -6)                         |
| `e45b9075` | docs(47-03): TYPE-04 phase-wide reconciliation — net-new suppressions = 0 | `.planning/phases/47-type-check-zero/47-EXCEPTIONS.md` (+54) |

Both commits ride along when DesignV2 merges to main as part of the v6.2 milestone PR.

## Files Modified

- `.github/workflows/ci.yml` — inserts `type-check` job (parallel to `Lint`, `needs: [repo-policy]`); removes the `Check TypeScript` step from the `Lint` job; updates 4 downstream `needs:` arrays (`test-rtl-responsive`, `test-a11y`, `bundle-size-check` → `[lint, type-check]`; `build` → `[lint, type-check, test-unit]`).
- `.planning/phases/47-type-check-zero/47-EXCEPTIONS.md` — TYPE-04 reconciliation appended; D-01 verified (0 net-new `@ts-ignore`/`@ts-expect-error`); 3 net-new `@ts-nocheck` (all on auto-generated Supabase types) ledgered.

## Auto-fixed deviations from plan literal

| #   | Where                                                                                                                                                                                                                                  | Fix                                                                                                                                                    |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Plan literal said `pnpm --filter frontend type-check` / `pnpm --filter backend type-check`. pnpm filters by `name` field, not directory. Actual workspace names are `intake-frontend` / `intake-backend`.                              | ci.yml uses correct workspace package names; documented in commit message of `815fb203`.                                                               |
| 2   | Plan Task 6 acceptance criterion stated `@ts-nocheck` count returns 2; actual baseline is 3 because 47-02 Task 2 allowlisted both `database.types.ts` and `contact-directory.types.ts` (Supabase generator emits one file per schema). | Reconciliation row in 47-EXCEPTIONS.md notes the correct count (3) with rationale; D-01 (the hard target — net-new ignore/expect-error) is unaffected. |

## Verification at deferral

- `pnpm --filter intake-frontend type-check; echo $?` → **0** (verified on DesignV2)
- `pnpm --filter intake-backend type-check; echo $?` → **0** (verified on DesignV2)
- 47-EXCEPTIONS.md byte-diff vs phase-47-base: only the TYPE-04 reconciliation row appended
- Net-new `@ts-(ignore|expect-error)` across phase 47: **0**

## Handoff to v6.2 milestone merge

When DesignV2 → main milestone PR is opened, the wiring (Tasks 3 acceptance criteria) auto-satisfies because the same PR carries both the workflow change and the type-fixes. Concretely:

1. PR DesignV2 → main runs full CI on the merged tree → all jobs green (frontend + backend at zero, new type-check job included).
2. Merge.
3. Run Task 4 from the executor's checkpoint return on agent `a344c7e136df34e77` (commands captured below): `gh api -X PUT repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection` with contexts `["Lint", "type-check"]` and `enforce_admins: true`.
4. Run Task 5 smoke-test PRs (frontend + backend, each with one deliberate TS error). Both must show `mergeStateStatus: BLOCKED` and `type-check` bucket=fail. Close without merge.
5. Re-open this plan as a small follow-up plan (`47-03b` or as a row in v6.3 if the milestone has rolled) writing the final SUMMARY.

## Self-Check

- [x] Tasks 1, 2, 6 local commits exist and are atomic
- [x] Both workspaces verified at type-check zero on DesignV2
- [x] D-08 precondition correctly diagnosed (main is not at zero → defer)
- [x] D-01 hard target met (0 net-new ignore/expect-error)
- [x] T-47-01 mitigation pattern documented in handoff (read-then-merge-then-write for branch protection)
- [x] No modifications to STATE.md or ROADMAP.md (orchestrator owns those)
- [x] D-04 cross-workspace fence held (no edits to backend/src in this plan's commit range)
- [ ] Tasks 3-5 acceptance evidence (PR URL + protection JSON + smoke-test BLOCKED proofs) — deferred
- [ ] Final SUMMARY status flips PARTIAL → SUCCESS — deferred (after milestone merge + post-merge follow-up plan)

## Status: PARTIAL

Reason: Plan acceptance has hard external dependency on v6.2 milestone merge (DesignV2 → main). Local work complete; remote enforcement deferred.
