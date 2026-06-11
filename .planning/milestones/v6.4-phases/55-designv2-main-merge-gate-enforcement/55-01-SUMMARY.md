---
phase: 55-designv2-main-merge-gate-enforcement
plan: '01'
subsystem: infra
tags: [git, merge, branch-protection, ssh-signed-tags, ci, github-actions]

# Dependency graph
requires: []
provides:
  - 'DesignV2 history merged into main via --no-ff (113+ commit absorb-merge + GitHub merge commit)'
  - 'Signed phase-55-base annotated tag on the merge commit (pushed to origin)'
  - 'Remote DesignV2 branch deleted (D-04 satisfied)'
  - 'All 4 prior SSH-signed phase-base tags preserved + reachable from origin/main'
  - 'Captured 55-MERGE-PR-EVIDENCE.json for D-11 audit trail'
affects:
  - phase-55-02 (CI jobs PR — depends on green main HEAD)
  - phase-55-03 (branch protection round-trip)
  - phase-55-04 (smoke PR)
  - phase-56 (RLS + last shim — branches off post-merge main)
  - phase-57 (D-19..D-23 deviation closure)
  - phase-58 (Tier-C token cleanup)
  - phase-59 (cosmetic + CI gap closure)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Absorb-and-merge replan pattern (Task 1b): when source branch behind target, merge target into source first to give merge PR a clean 0-behind state, then perform the canonical --no-ff merge'
    - 'Per-machine SSH signing config (gpg.format=ssh + allowed_signers) inherited by phase-55-base'
    - 'GitHub UI merge button as the documented user-flow exercising enforce_admins=true'

key-files:
  created:
    - .planning/phases/55-designv2-main-merge-gate-enforcement/55-MERGE-PR-EVIDENCE.json
    - .planning/phases/55-designv2-main-merge-gate-enforcement/55-01-SUMMARY.md
  modified: []

key-decisions:
  - 'Deploy posture: Option 1 — accept auto-deploy (user choice on Task 5 human-gate). Deploy workflow NOT disabled; production deploy triggers normally on the new main HEAD.'
  - '--no-ff merge strategy (D-01) preserved all 4 prior SSH-signed phase-base tags in main reachable history; squash would have orphaned them.'
  - 'Local DesignV2 branch retained as user working branch; only origin/DesignV2 deleted per D-04.'
  - 'phase-51-base remains lightweight per replan decision (not re-signed in this plan).'

patterns-established:
  - 'Pattern 1: --no-ff merge preserves signed annotated tag reachability — verified via `git merge-base --is-ancestor <tag-sha> origin/main` for all 4 prior tags'
  - 'Pattern 2: phase-base tag tagged on the actual merge commit SHA (not on tip-of-main HEAD when other commits have already landed on top)'

requirements-completed:
  - MERGE-01

# Metrics
duration: '~5h (replan + execution incl. 24m human-gate wait)'
completed: 2026-05-17
---

# Phase 55 Plan 01: DesignV2 → Main Merge & Gate Enforcement Summary

**PASS — DesignV2 (233 unique commits) merged to main via --no-ff merge commit `3f763ddc`; phase-55-base SSH-signed tag pushed; remote DesignV2 deleted; all 4 prior phase-base tags preserved + reachable.**

## Performance

- **Duration:** ~5h end-to-end (includes Task 1b replan-insert + 24m human-gate pause at Task 5)
- **Started:** 2026-05-17T09:40Z (Task 1 pre-merge preflight)
- **Completed:** 2026-05-17T10:50Z (Task 8 SUMMARY write)
- **Tasks:** 9 (Tasks 1, 1b, 2, 3, 4, 5, 6, 7, 8 — Task 1b inserted via replan 2026-05-17)
- **Files modified:** 2 (1 evidence JSON + this SUMMARY); 1 SSH-signed annotated tag created and pushed

## Accomplishments

- **DesignV2 history landed on main** via GitHub UI Merge → "Create a merge commit" (D-02): merge commit `3f763ddc17fd496ac5ab3f289221a8b70a4a3416` has 2 parents (prior main HEAD `7fc9e756` + DesignV2 absorb-merge tip `7d5ff2ef`), confirming `--no-ff` per D-01.
- **All 6 v6.3-required CI contexts reported SUCCESS** on the merge PR before Merge was clicked (Task 4 verification): `type-check`, `Security Scan`, `Lint`, `Bundle Size Check (size-limit)`, `Tests (frontend)`, `Tests (backend)`.
- **4 prior SSH-signed phase-base tags preserved** post-merge: `phase-47-base`, `phase-48-base`, `phase-49-base`, `phase-54-base` all still pass `git tag -v` with "Good \"git\" signature" AND are reachable from origin/main via `git merge-base --is-ancestor`.
- **New `phase-55-base` SSH-signed annotated tag** created on the merge commit and pushed to origin (`refs/tags/phase-55-base` = `92219ffcdeca3fee7a0f4c24f16c761e52a7f4ef`, points to commit `3f763ddc`); `git tag -v phase-55-base` exits 0.
- **Remote DesignV2 branch deleted** per D-04 (`gh api -X DELETE repos/.../git/refs/heads/DesignV2` → exit 0); `git ls-remote origin DesignV2` returns empty.
- **D-11 evidence committed**: `55-MERGE-PR-EVIDENCE.json` captures `gh pr view 13 --json mergeStateStatus,statusCheckRollup,mergeCommit,number,state,closedAt` for the audit trail.

## Task Commits

Each task was committed atomically (Task 7 is a tag, not a code commit):

1. **Task 1 — Pre-merge preflight (sync main + verify 4 prior tags)**: no code commit (read-only verification)
2. **Task 1b — Absorb origin/main into DesignV2** (replan insert): merge commit `7d5ff2ef` on DesignV2 — _"merge(55-01): absorb origin/main into DesignV2 before merge PR (replan 2026-05-17)"_
3. **Task 2 — Local CI parity on DesignV2 tip**: no code commit (read-only verification; type-check FE + BE, lint, size-limit, tests FE 1230 pass / BE 214 pass)
4. **Task 3 — Push DesignV2 + open merge PR #13**: no local commit (push + PR creation only)
5. **Task 4 — Watch CI until 6/6 SUCCESS**: no commit (CI watch only)
6. **Task 5 — PAUSE: deploy posture choice + Merge click**: no Claude commit (human gate). Merge commit `3f763ddc17fd496ac5ab3f289221a8b70a4a3416` created by GitHub on user click.
7. **Task 6 — Capture 55-MERGE-PR-EVIDENCE.json**: commit `38681a83` _"docs(55-01): capture merge PR evidence (PR #13)"_
8. **Task 7 — Sign + push phase-55-base** + verify 4 prior tags still verify + reachable: **tag** `phase-55-base` tag-sha `92219ffc...` pushed to origin (no code commit; tag IS the durable record)
9. **Task 8 — Delete remote DesignV2 + write SUMMARY** (this file): SUMMARY commit (final commit of plan)

## Files Created/Modified

- **`.planning/phases/55-designv2-main-merge-gate-enforcement/55-MERGE-PR-EVIDENCE.json`** — `gh pr view 13` JSON output (D-11 audit evidence)
- **`.planning/phases/55-designv2-main-merge-gate-enforcement/55-01-SUMMARY.md`** — this file
- **Tag object** `refs/tags/phase-55-base` — SSH-signed annotated, points to `3f763ddc17fd496ac5ab3f289221a8b70a4a3416`, pushed to origin

## Live State Snapshot (post-execution)

**Merge commit:**

```
3f763ddc17fd496ac5ab3f289221a8b70a4a3416  Merge pull request #13 from alzahrani-khalid/DesignV2
  author: alzahrani-khalid <53393181+alzahrani-khalid@users.noreply.github.com>
  date:   2026-05-17T13:40:58+03:00 (10:40:58 UTC)
  parents:
    [1] 7fc9e7564ce01afee067277045573f192163f6d2 (prior origin/main HEAD)
    [2] 7d5ff2ef03088c3acd97f9145d9a9d73a46e6450 (DesignV2 absorb-merge tip)
```

**Unique commits brought from DesignV2 to main:** 233 (via `git rev-list --count <p1>..<p2>` on the merge commit).

**Live ahead-count at PR open (Pitfall 9 — live value, not stale "110" or "111"):** 113 unpushed DesignV2 commits at the moment of `git push origin DesignV2` (Task 3), confirmed by prior agent's return notes.

**Note re Task 1b replan and the local-side merge commit:** Task 1b created a local-DesignV2-side merge commit `7d5ff2ef` to absorb 2 origin/main commits (PR #4 and PR #5, prior partial DesignV2→main merges at the phase-47 boundary) into DesignV2 BEFORE opening the merge PR. This was a replan insertion per the 2026-05-17 replan note in PLAN.md. The 2 absorbed commits are visible in the merge-commit's parent-2 lineage. The local merge commit `7d5ff2ef` is now the parent-2 of the GitHub-produced merge commit `3f763ddc` on origin/main.

**phase-54-base ≠ DesignV2 tip (informational, not a defect):** `phase-54-base` points to commit `b174815e`. origin/DesignV2 tip at deletion time was `7d5ff2ef`. They differ by 44 commits — those 44 commits are all v6.4 milestone setup / planning docs / Task 1b absorb-merge, and are fully preserved in main's reachable history via the merge commit `3f763ddc`. No forensic loss.

## Tag Verification Summary

All 5 phase-base SSH-signed tags pass `git tag -v` AND are reachable from origin/main:

| Tag             | Tag SHA     | Commit SHA  | `git tag -v`                                        | Reachable from origin/main |
| --------------- | ----------- | ----------- | --------------------------------------------------- | -------------------------- |
| `phase-47-base` | `915b44f8…` | `41f28f16…` | Good "git" signature (ED25519 SHA256:YlslD6LyamDv…) | YES                        |
| `phase-48-base` | `3a8feb4c…` | `baaf644a…` | Good "git" signature (ED25519 SHA256:YlslD6LyamDv…) | YES                        |
| `phase-49-base` | `06a77010…` | `7fc9e756…` | Good "git" signature (ED25519 SHA256:YlslD6LyamDv…) | YES                        |
| `phase-54-base` | `02fe6eb1…` | `b174815e…` | Good "git" signature (ED25519 SHA256:YlslD6LyamDv…) | YES                        |
| `phase-55-base` | `92219ffc…` | `3f763ddc…` | Good "git" signature (ED25519 SHA256:YlslD6LyamDv…) | YES                        |

**`phase-51-base` deliberately NOT re-signed** in this plan per the replan decision (it remains a lightweight tag; re-signing is out of scope for Plan 55-01 — historic decision preserved).

## Deploy Posture Decision (Task 5 human-gate resolution)

**Choice: Option 1 — Accept auto-deploy.**

- `gh workflow disable Deploy` was **NOT** run.
- The `.github/workflows/deploy.yml` workflow auto-triggered on CI success on the new main HEAD (`3f763ddc`).
- This was the deliberate user choice: the merge is intended to ship; production should follow.
- No two-step `disable → re-enable` ceremony required.
- T-55-04 mitigation (production deploy gate) was satisfied by the explicit user decision being recorded here.

## Rollback Procedure (RESEARCH Pitfall 5 — verbatim 4-step dance)

If the DesignV2 merge needs to be reverted, the obvious reflex `git revert -m 1 <merge-sha>` alone is **not enough** — it creates a graph trap where Git refuses to re-merge DesignV2 because it sees the branch as "already merged" (the revert undoes the diff but doesn't change the commit graph). The full sequence is:

```bash
# Step 1: Revert the merge on main (creates revert-of-merge commit)
git checkout main
git pull --ff-only origin main
git revert -m 1 3f763ddc17fd496ac5ab3f289221a8b70a4a3416
# Branch protection blocks direct push to main: open as PR
git push -u origin revert-phase-55-merge
gh pr create --base main --head revert-phase-55-merge --title "Revert phase 55 DesignV2 → main merge"
# Get the revert-of-merge SHA after that PR merges:
#   REVERT_SHA=$(git rev-parse origin/main)

# Step 2: Fix whatever motivated the revert (commit fixes to DesignV2 or a new branch)

# Step 3: To RE-MERGE later, first revert the revert (creates revert-of-revert
# commit that re-applies DesignV2's diff)
git checkout -b re-merge-phase-55
git revert <REVERT_SHA>
# Optionally apply additional fix commits

# Step 4: Open a NEW PR with the revert-of-revert branch + fix commits;
# CI must pass all 6 required contexts; merge as --no-ff via UI
git push -u origin re-merge-phase-55
gh pr create --base main --head re-merge-phase-55 --title "Re-merge phase 55 DesignV2 → main (post-fix)"
```

**Why this works:** Step 3's `git revert <REVERT_SHA>` produces a commit whose diff re-applies DesignV2's content; the new merge in Step 4 is then a normal `--no-ff` merge of a branch that contains "real" forward-applying commits, so Git's "already merged" check is satisfied.

**Preferred over rollback:** Fix-forward on DesignV2 per D-08 (commit fixes, push, CI re-runs, merge) whenever possible — single-PR audit trail is far cleaner.

**Reference:** [How to revert a merge commit then merge again](https://dev.to/jbrocher/how-to-revert-a-merge-commit-then-merge-again-hoo) (RESEARCH Pitfall 5).

## Decisions Made

- **Option 1 deploy posture** chosen on Task 5 human-gate (see Deploy Posture Decision section above).
- **Per CLAUDE.md tag-signing setup** the local machine has `gpg.format=ssh`, `user.signingkey=~/.ssh/id_ed25519.pub`, `gpg.ssh.allowedSignersFile=~/.ssh/allowed_signers` configured. `phase-55-base` inherited this config; signature verifies clean locally and the tag is durably pushed to origin.
- **Local DesignV2 branch retained** (the user's working branch). Only `origin/DesignV2` was deleted per D-04. Historic tip preserved via merge commit on origin/main + `phase-54-base` tag.

## Deviations from Plan

**None for Tasks 6, 7, 8 (this continuation execution).** All three tasks executed exactly as written in 55-01-PLAN.md.

Earlier deviation (recorded for completeness, executed by prior agent): **Task 1b — replan insert** (2026-05-17). PLAN.md was amended in-place to add Task 1b ("Absorb origin/main into DesignV2 before merge PR") because the original D-06 assumption (origin/main is strict-ancestor of origin/DesignV2) was wrong at execution time — origin/main had advanced 2 commits ahead of DesignV2 since CONTEXT.md was written (PRs #4 and #5, prior partial DesignV2→main merges at the phase-47 boundary). The replan was committed to the plan file BEFORE Task 1b ran, and the absorb-merge was performed without conflicts. Recorded in PLAN.md commit `fed8a44b` and the absorb-merge commit `7d5ff2ef`.

## Issues Encountered

- **Task 5 human-action gate (blocking-human)**: required user to (a) choose deploy posture and (b) click the GitHub Merge button. Resolved by user at 2026-05-17T10:40Z (~24m human-pause). Not a defect — the gate was deliberately blocking-human per `gate="blocking"` on the checkpoint.
- **No technical issues during Tasks 6, 7, 8.** All verification commands passed first try.

## User Setup Required

None for downstream plans — the merge is complete, the tag is pushed, the remote branch is deleted. Future Phase 55 plans (02, 03, 04) and Phases 56-59 branch off the post-merge main HEAD directly.

## D-13 Reversal Context Note

This plan does **NOT** touch branch protection. That is Plan 55-03's job. The v6.3 D-09 fold-into-Lint decision remains in effect on `main` branch protection right now (6 required contexts: `type-check`, `Security Scan`, `Lint`, `Bundle Size Check (size-limit)`, `Tests (frontend)`, `Tests (backend)`). Plan 55-03 will round-trip the protection JSON to add 2 new explicit contexts (`Design Token Check`, `react-i18next Factory Check`) for failure-attribution clarity, reversing D-09. Documented here so future audits don't ping-pong the decision.

## Next Phase Readiness

- **Plan 55-02 (Wave 2)** unblocked: can now add 2 new CI jobs to `.github/workflows/ci.yml` via a fresh PR onto main. Required because Plan 55-03 cannot add new required contexts to branch protection until those jobs have run at least once on main (otherwise GitHub treats them as "Expected — Waiting for status to be reported" indefinitely; RESEARCH Pitfall 4).
- **Plan 55-03 (Wave 3)** depends on 55-02 completion.
- **Plan 55-04 (Wave 4)** depends on 55-03 completion.
- **Phases 56-59** unblocked: can now branch off post-merge main directly. Phase 56 and Phase 57 can run in parallel per STATE.md.

## Self-Check

- `[FOUND] .planning/phases/55-designv2-main-merge-gate-enforcement/55-MERGE-PR-EVIDENCE.json` — Task 6
- `[FOUND] .planning/phases/55-designv2-main-merge-gate-enforcement/55-01-SUMMARY.md` — this file
- `[FOUND] commit 38681a83 docs(55-01): capture merge PR evidence (PR #13)` — Task 6 commit
- `[FOUND] tag phase-55-base = 92219ffcdeca3fee7a0f4c24f16c761e52a7f4ef (points to 3f763ddc…)` — Task 7 tag
- `[VERIFIED] git tag -v phase-{47,48,49,54,55}-base` all "Good \"git\" signature"
- `[VERIFIED] git ls-remote origin DesignV2` returns empty — Task 8

## Self-Check: PASSED

---

_Phase: 55-designv2-main-merge-gate-enforcement_
_Plan: 01_
_Completed: 2026-05-17_
