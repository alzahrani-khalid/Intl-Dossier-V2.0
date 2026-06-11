---
phase: 55-designv2-main-merge-gate-enforcement
plan: '02'
subsystem: infra
tags: [ci, github-actions, eslint, branch-protection, positive-failure-fixture]

# Dependency graph
requires:
  - phase: 55-01
    provides: 'DesignV2 merged to main; clean post-merge HEAD for branching new CI work off'
provides:
  - 'Two new top-level CI jobs landed on origin/main `.github/workflows/ci.yml`: `Design Token Check` + `react-i18next Factory Check`'
  - 'Both new jobs proven green on the post-merge main HEAD CI run (run id 25990939105)'
  - 'Both new jobs proven green on PR #15 statusCheckRollup before merge (no protection bypass — all 6 existing required contexts also passed)'
  - 'Positive-failure mechanism (`! pnpm exec eslint --max-warnings 0 <fixture>`) wired against `tools/eslint-fixtures/bad-design-token.tsx` + `tools/eslint-fixtures/bad-vi-mock.ts`'
  - 'Captured `55-CI-JOBS-PR-EVIDENCE.json` (PR view + post-merge run jobs) for D-11 audit trail'
  - 'Exact required-context name strings ready for Plan 55-03 to wire into `required_status_checks.contexts[]` (D-13 names locked verbatim)'
affects:
  - phase-55-03 (branch protection round-trip — consumes the 2 exact `name:` strings from this SUMMARY)
  - phase-55-04 (smoke PR — verifies the 8-context gate including these 2 new contexts blocks PRs)
  - phase-59 (POLISH-04 — partially closed by this plan; positive-failure assertions now live)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Positive-failure CI assertion: `set -e` + bash `!` inversion + `--max-warnings 0` upgrades fixture-warns to job failures (defensive symmetric pattern even for fixtures already producing errors)'
    - 'Hard sequencing pattern (D-15): land CI job on main BEFORE adding it to branch-protection required-contexts (Pitfall 4: adding contexts before jobs exist bricks all PRs with "Expected — Waiting for status to be reported")'
    - 'Separate PR for CI gate jobs (NOT bundled with merge PR) per D-15 clean causality chain'

key-files:
  created:
    - .planning/phases/55-designv2-main-merge-gate-enforcement/55-CI-JOBS-PR-EVIDENCE.json
    - .planning/phases/55-designv2-main-merge-gate-enforcement/55-02-SUMMARY.md
  modified:
    - .github/workflows/ci.yml

key-decisions:
  - 'D-13 reversal of v6.3 D-09 fold-into-Lint: the 2 new contexts are SEPARATE jobs (not folded into the existing `Lint` job) for failure-attribution clarity, not minimum CI yaml'
  - 'D-14 inline jobs (not reusable workflow extraction): keep `ci.yml` self-contained for now; reusable workflow deferred until more gates accumulate'
  - 'D-15 sequencing: jobs land on main first (this plan); protection adds them as required-contexts next (Plan 55-03); smoke PR exercises 8-context gate last (Plan 55-04)'

patterns-established:
  - 'Pattern 1: Two-step landing of a new required-context — Step 1 (this plan): job lands on main and runs green at least once; Step 2 (next plan): branch protection PUT adds the job to required-contexts'
  - 'Pattern 2: Reuse `tools/eslint-fixtures/` for positive-failure CI assertions instead of creating new fixtures (also partially closes the Phase 59 POLISH-04 gap as a byproduct)'

requirements-completed: [] # MERGE-02 is satisfied PARTIALLY (preparation half); full satisfaction depends on Plan 55-03 (wires jobs into required-contexts) + Plan 55-04 (smoke proof). Do NOT check MERGE-02 here.

# Metrics
duration: ~2h end-to-end (incl. ~30m PR CI watch + ~5m human merge gate)
completed: 2026-05-17
---

# Phase 55 Plan 02: Add Design Token Check + react-i18next Factory Check CI Jobs Summary

**PASS — 2 new CI jobs (`Design Token Check` + `react-i18next Factory Check`) landed on origin/main via PR #15 (merge commit `9e4471e3`); both verified green on post-merge main HEAD CI run `25990939105`; Plan 55-03 (branch protection round-trip) unblocked.**

## Performance

- **Duration:** ~2h end-to-end (incl. PR CI watch + brief human merge gate)
- **Started:** 2026-05-17T11:00Z (Task 1 — branch off main + local positive-failure proof)
- **Completed:** 2026-05-17T12:35Z (Task 6 — SUMMARY write)
- **Tasks:** 6 (Tasks 1, 2, 3, 4, 5, 6 — Task 4 was a human-action gate resolved by user clicking Merge on PR #15)
- **Files modified:** 3 (1 workflow YAML edit + 1 evidence JSON + this SUMMARY)

## Accomplishments

- **Two new CI jobs landed on origin/main `.github/workflows/ci.yml`** via PR #15 (52 lines added; only additions — no existing job mutated per D-14 surgical-changes acceptance):
  - **Job ID** `design-token-check` → `name: Design Token Check`
  - **Job ID** `i18next-factory-check` → `name: react-i18next Factory Check`
- **PR #15 merged** as merge commit `9e4471e358a54789e040ebb7dec8ae9438495a3d` (parents: `7f8c425d` + `faa8a710`). PR went green on all 6 existing required CI contexts before Merge was clicked (no protection bypass).
- **Both new jobs reported `success` on PR #15 statusCheckRollup** before merge — verified via `gh pr view 15 --json statusCheckRollup`.
- **Both new jobs reported `success` on post-merge main HEAD CI run `25990939105`** (commit `9e4471e3`) — verified via `gh api repos/.../actions/runs/25990939105/jobs`.
- **Positive-failure mechanism proven**: both jobs use `! pnpm exec eslint -c eslint.config.mjs --max-warnings 0 <fixture>` against `tools/eslint-fixtures/bad-design-token.tsx` and `tools/eslint-fixtures/bad-vi-mock.ts`. The `!` inverts eslint's non-zero exit; `--max-warnings 0` upgrades the design-token fixture's `warn` severity to job-failure (Pitfall 7). Job ONLY passes when fixture fails lint — T-55-NJ mitigation live.
- **D-11 evidence committed**: `55-CI-JOBS-PR-EVIDENCE.json` captures `gh pr view 15 --json mergeStateStatus,statusCheckRollup,mergeCommit,state,number` AND `gh api .../actions/runs/25990939105/jobs` for the audit trail.

## Required-Context Names for Plan 55-03

**Plan 55-03 MUST use these EXACT strings when adding to `required_status_checks.contexts[]` (case- and space-sensitive per Pitfall 3 — GitHub matches the check-run `name`, not the job ID):**

| Job ID (kebab-case)     | Required-context name (verbatim — copy-paste into protection-after.json) |
| ----------------------- | ------------------------------------------------------------------------ |
| `design-token-check`    | `Design Token Check`                                                     |
| `i18next-factory-check` | `react-i18next Factory Check`                                            |

These are the literal values of `.github/workflows/ci.yml` `jobs.<id>.name:` on the post-merge main HEAD. Verified via `grep -n '    name: ' .github/workflows/ci.yml` after the merge:

```
    name: Design Token Check
    name: react-i18next Factory Check
```

## Task Commits

Each task was committed atomically (Tasks 1, 4, 5 had no Claude code-commit by design):

1. **Task 1 — Branch + local positive-failure proof**: no code commit (read-only verification on branch `ci/phase-55-add-gate-jobs`; both fixtures exited non-zero standalone with `--max-warnings 0`, and the `!`-inverted invocations exited 0)
2. **Task 2 — Add 2 jobs to ci.yml + commit** (on branch `ci/phase-55-add-gate-jobs`): commit `faa8a710` — _"ci(55): add design-token-check + i18next-factory-check jobs (MERGE-02)"_
3. **Task 3 — Push branch + open PR + watch CI**: no local commit; PR #15 opened against base=main, head=ci/phase-55-add-gate-jobs; all 6 existing required contexts + 2 new jobs reported SUCCESS
4. **Task 4 — PAUSE: user clicks Merge on PR #15**: no Claude commit (human gate). Merge commit `9e4471e358a54789e040ebb7dec8ae9438495a3d` created by GitHub on user click at 2026-05-17T12:32:11Z. Merged via the project-default UI Merge button respecting `enforce_admins=true`.
5. **Task 5 — Capture 55-CI-JOBS-PR-EVIDENCE.json**: commit `9fddf40a` — _"docs(55-02): capture CI jobs PR evidence (PR #15)"_
6. **Task 6 — Write SUMMARY** (this file): SUMMARY commit (final commit of plan)

**Plan metadata commit:** to be added in this task's commit; remote `ci/phase-55-add-gate-jobs` branch cleanup follows.

## Files Created/Modified

- **`.github/workflows/ci.yml`** — 2 new top-level jobs (`design-token-check`, `i18next-factory-check`) appended after the existing `lint` job; both `needs: [repo-policy]`; both use `pnpm install --frozen-lockfile` + the positive-failure assertion. 52 lines added, 0 lines deleted — no existing job modified (acceptance §"git diff main shows only additions" satisfied).
- **`.planning/phases/55-designv2-main-merge-gate-enforcement/55-CI-JOBS-PR-EVIDENCE.json`** — combined `gh pr view 15 --json` + `gh api .../runs/25990939105/jobs` output for D-11 audit trail (1,281 lines)
- **`.planning/phases/55-designv2-main-merge-gate-enforcement/55-02-SUMMARY.md`** — this file

## Live State Snapshot (post-execution)

**PR #15:**

```
Title:  Phase 55 Plan 02: add Design Token Check + react-i18next Factory Check CI jobs (MERGE-02)
Base:   main
Head:   ci/phase-55-add-gate-jobs
State:  MERGED
Merged: 2026-05-17T12:32:11Z
Merge commit: 9e4471e358a54789e040ebb7dec8ae9438495a3d (2 parents: 7f8c425d + faa8a710)
```

**Post-merge main HEAD CI run:**

```
Run ID:   25990939105
Workflow: CI
Head SHA: 9e4471e358a54789e040ebb7dec8ae9438495a3d
URL:      https://github.com/alzahrani-khalid/Intl-Dossier-V2.0/actions/runs/25990939105
```

**Per-job conclusions on run 25990939105 (relevant subset):**

| Job name                          | Conclusion                                  | Required-context? (current)                                                                               |
| --------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `Design Token Check`              | success                                     | No (Plan 55-03 will add)                                                                                  |
| `react-i18next Factory Check`     | success                                     | No (Plan 55-03 will add)                                                                                  |
| `Repo Policy (Secrets/Artifacts)` | success                                     | Yes (existing)                                                                                            |
| `Tests (backend)`                 | success                                     | Yes (existing)                                                                                            |
| `Tests (frontend)`                | (in-progress at capture; passing on PR #15) | Yes (existing)                                                                                            |
| `type-check`                      | (in-progress at capture; passing on PR #15) | Yes (existing)                                                                                            |
| `Lint`                            | (in-progress at capture; passing on PR #15) | Yes (existing)                                                                                            |
| `Security Scan`                   | failure                                     | Yes (existing — pre-existing failure on the previous main HEAD `7f8c425d` too; not introduced by this PR) |
| `Tests (integration)`             | failure                                     | No (not a required-context — also failing on the previous main HEAD; pre-existing)                        |
| `E2E Tests`                       | (in-progress at capture)                    | No (not a required-context — kept separate per v6.4 scope)                                                |

**Note on pre-existing Security Scan / Tests (integration) failures on main HEAD:** Both jobs failed on the prior main HEAD (`7f8c425d`) too — they are pre-existing main HEAD failures, NOT regressions introduced by PR #15. Out of scope for Plan 55-02 per Karpathy §Surgical Changes; logged to `deferred-items.md` lineage via this note. Note: `Security Scan` IS a required-context for PRs, but the post-merge main HEAD CI run is NOT a PR — branch protection's required-contexts only apply to PR mergeability, not to post-merge CI runs on main. The merge PR (#15) itself was green on all 6 required contexts before merge.

**Branch protection state (UNCHANGED by this plan):** Still 6 required contexts as of post-merge main HEAD: `type-check`, `Security Scan`, `Lint`, `Bundle Size Check (size-limit)`, `Tests (frontend)`, `Tests (backend)`. Plan 55-03 will round-trip the protection JSON to expand to 8 (add the 2 new context names listed above).

## D-15 Sequencing Note (DO NOT MERGE OUT-OF-ORDER)

This plan satisfies **MERGE-02 partially** — the preparation half (jobs exist on main + proven green). Full MERGE-02 satisfaction requires:

1. **Plan 55-03** wires the 2 new context names into `required_status_checks.contexts[]` via `gh api -X PUT repos/.../branches/main/protection` (round-trip pattern preserves `enforce_admins`, `allow_force_pushes=false`, `allow_deletions=false`).
2. **Plan 55-04** opens a smoke PR with planted violations and confirms `mergeStateStatus=BLOCKED` from `gh pr view --json` — proves the new 8-context gate enforces live.

Per **D-15 / RESEARCH Pitfall 4**: branch protection MUST NOT be updated until the jobs exist on main and have run at least once (Plan 55-02 = this plan), otherwise GitHub treats the new contexts as "Expected — Waiting for status to be reported" and bricks all PRs against main. That belt-and-braces precondition is now satisfied.

## D-13 Reversal of v6.3 D-09 — Documented (DO NOT RE-FOLD)

v6.3 Phase 51 D-09 deliberately _folded_ the design-token rule into the existing `Lint` context to avoid touching branch protection (no new PUT). Phase 55 D-13 **reverses** this for failure-attribution clarity: when the design-token gate fires, the user wants to see `Design Token Check ✗` distinct from `Lint ✗`, not a single conflated `Lint ✗` that requires reading job logs to identify which rule failed.

Same rationale for splitting `react-i18next Factory Check` out of `Tests (frontend)`.

**Why explicit here:** so future audits (v6.5+, v7.x) don't ping-pong the decision back to "fold into Lint to save a CI yaml job".

## Decisions Made

- **D-13 / D-14 / D-15 followed verbatim**. No tactical decisions of substance needed during execution — the planning agent had already locked the choices.
- **Job-naming case observed exactly per D-13** (Pitfall 3): `Design Token Check` (not `design-token-check` lowercase), `react-i18next Factory Check` (with the hyphen + lowercase `i18next`). These are the strings GitHub reports as the check-run name and what Plan 55-03 must match in `required_status_checks.contexts[]`.
- **Defensive `--max-warnings 0` on BOTH new jobs** even though `bad-vi-mock.ts` already produces an error (exit 1) without the flag (Pitfall 7). Symmetric defensive behavior — future fixture severity changes can't silently break the gate.

## Deviations from Plan

**None for Tasks 5 and 6 (this continuation execution).** All verification commands passed first-try; evidence assertions (`pr.state == "MERGED"`, `pr.mergeCommit.oid == "9e4471e3…"`, both new jobs `success` on main HEAD) all hold.

Earlier execution (Tasks 1–4, by the prior agent) was also clean per their return notes — no deviations recorded against the plan-as-written.

## Issues Encountered

- **Task 4 human-action gate (blocking)**: required user to click the GitHub Merge button on PR #15. Resolved by user clicking Merge at 2026-05-17T12:32:11Z (~brief human-pause). Not a defect — the gate was deliberately blocking-human per `gate="blocking"` on the checkpoint.
- **Pre-existing `Security Scan` + `Tests (integration)` failures on post-merge main HEAD CI run**: NOT regressions caused by this plan (both failed on prior main HEAD `7f8c425d` too). Out of scope per Karpathy §Surgical Changes — not "fixed inline" because the failures pre-date PR #15 and the merge PR was green on all 6 required contexts. These remain pre-existing tech-debt items separate from MERGE-02.

## User Setup Required

None for downstream plans — the CI jobs are wired on origin/main and proven green. Plan 55-03 reads the exact name strings from this SUMMARY and round-trips the branch protection JSON via `gh api`.

## Next Phase Readiness

- **Plan 55-03 (Wave 3)** unblocked — Pitfall 4 belt-and-braces satisfied (jobs exist + green on main HEAD). Plan 55-03 reads `Design Token Check` and `react-i18next Factory Check` verbatim from the "Required-Context Names for Plan 55-03" table above and adds them to `required_status_checks.contexts[]` via the round-trip JSON pattern (preserve `enforce_admins`, `allow_force_pushes=false`, `allow_deletions=false`).
- **Plan 55-04 (Wave 4)** depends on 55-03 completion.
- **MERGE-02 satisfaction** completes after 55-04 captures `mergeStateStatus=BLOCKED` from the smoke PR.

## Self-Check

- `[FOUND] .planning/phases/55-designv2-main-merge-gate-enforcement/55-CI-JOBS-PR-EVIDENCE.json` — Task 5
- `[FOUND] .planning/phases/55-designv2-main-merge-gate-enforcement/55-02-SUMMARY.md` — this file
- `[FOUND] commit 9fddf40a docs(55-02): capture CI jobs PR evidence (PR #15)` — Task 5 commit
- `[FOUND] commit faa8a710 ci(55): add design-token-check + i18next-factory-check jobs (MERGE-02)` — Task 2 commit (now on main via merge commit 9e4471e3)
- `[FOUND] commit 9e4471e3 Merge pull request #15 from alzahrani-khalid/ci/phase-55-add-gate-jobs` — PR #15 merge commit
- `[VERIFIED] gh api .../actions/runs/25990939105/jobs` → both `Design Token Check` + `react-i18next Factory Check` conclusion=success on main HEAD
- `[VERIFIED] gh pr view 15` → state=MERGED, mergeCommit.oid=9e4471e358a54789e040ebb7dec8ae9438495a3d

## Self-Check: PASSED

---

_Phase: 55-designv2-main-merge-gate-enforcement_
_Plan: 02_
_Completed: 2026-05-17_
