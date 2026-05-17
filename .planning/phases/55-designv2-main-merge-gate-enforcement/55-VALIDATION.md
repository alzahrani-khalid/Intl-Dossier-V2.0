---
phase: 55
slug: designv2-main-merge-gate-enforcement
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-17
---

# Phase 55 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. CI-config phase: artifacts are GitHub state + workflow YAML, not local code. Validation reuses existing eslint/vitest/size-limit infrastructure plus `gh` CLI queries.

---

## Test Infrastructure

| Property               | Value                                                                                                                                                                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**          | None new (CI-config phase) — reuses existing `eslint`, `vitest`, `size-limit`, plus `gh` CLI for GitHub state                                                                                                                                                  |
| **Config file**        | `.github/workflows/ci.yml` (modified by plan 2); `eslint.config.mjs` (unchanged); `frontend/src/test/setup.ts` (unchanged)                                                                                                                                     |
| **Quick run command**  | `pnpm --filter intake-frontend type-check && pnpm run lint`                                                                                                                                                                                                    |
| **Full suite command** | `pnpm install --frozen-lockfile && pnpm --filter intake-frontend type-check && pnpm --filter intake-backend type-check && pnpm run lint && pnpm -C frontend size-limit && pnpm --filter intake-frontend test --run && pnpm --filter intake-backend test --run` |
| **Estimated runtime**  | ~6–8 min (full local parity); ~30s (quick)                                                                                                                                                                                                                     |

---

## Sampling Rate

- **After every task commit:** Run the plan-local relevant check (eslint positive-failure for plan 2; `jq -e` dry-validate `protection-after.json` for plan 3; `gh pr view --json` for plan 4)
- **After every plan wave:** Run `pnpm --filter intake-frontend type-check && pnpm run lint && pnpm -C frontend size-limit`
- **Before `/gsd:verify-work`:** All 4 ROADMAP success criteria pass (see Phase Gate below)
- **Max feedback latency:** 60s for plan-local checks; 8 min for full suite

---

## Per-Task Verification Map

> Populated by the planner during PLAN.md generation. Each task carries an `<automated>` block with the exact assertion command. Skeleton below; planner fills concrete `Task ID` rows.

| Task ID        | Plan   | Wave | Requirement         | Threat Ref | Secure Behavior     | Test Type   | Automated Command                 | File Exists | Status     |
| -------------- | ------ | ---- | ------------------- | ---------- | ------------------- | ----------- | --------------------------------- | ----------- | ---------- |
| TBD-by-planner | 01..04 | 1..N | MERGE-01 / MERGE-02 | T-55-\*    | see Security Domain | integration | see Phase Requirements → Test Map | ✅ existing | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Phase Requirements → Test Map

| Req ID   | Behavior                                              | Test Type   | Automated Command                                                                                                                                                                                                                                                                                                          | File Exists? |
| -------- | ----------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| MERGE-01 | DesignV2 history reachable from main via merge commit | integration | `git merge-base --is-ancestor $(git rev-parse phase-54-base) origin/main && echo MERGED`                                                                                                                                                                                                                                   | ✅           |
| MERGE-01 | All 6 required v6.3 contexts exit 0 on the merge PR   | integration | `gh pr view <merge-pr-num> --json statusCheckRollup --jq '.statusCheckRollup \| map(select(.name \| IN("type-check","Lint","Tests (frontend)","Tests (backend)","Bundle Size Check (size-limit)","Security Scan"))) \| map(.conclusion) \| unique'` equals `["SUCCESS"]`                                                   | ✅           |
| MERGE-01 | Local pre-flight parity passes on DesignV2 tip        | integration | Full suite command above exits 0                                                                                                                                                                                                                                                                                           | ✅           |
| MERGE-01 | All 4 SSH-signed phase-base tags survive merge        | integration | `for t in phase-47-base phase-48-base phase-49-base phase-54-base; do git tag -v "$t" \|\| exit 1; done`                                                                                                                                                                                                                   | ✅           |
| MERGE-02 | Smoke PR returns `mergeStateStatus=BLOCKED`           | integration | `gh pr view <smoke-num> --json mergeStateStatus --jq '.mergeStateStatus'` returns `"BLOCKED"`                                                                                                                                                                                                                              | ✅           |
| MERGE-02 | All 8 required contexts present on main protection    | integration | `gh api repos/:owner/:repo/branches/main/protection --jq '.required_status_checks.contexts \| length'` returns `8`                                                                                                                                                                                                         | ✅           |
| MERGE-02 | Both new CI jobs run green on main HEAD post-merge    | integration | `gh api repos/:owner/:repo/actions/workflows/ci.yml/runs?branch=main&per_page=1 --jq '.workflow_runs[0].id' \| xargs -I{} gh api repos/:owner/:repo/actions/runs/{}/jobs --jq '.jobs \| map(select(.name \| IN("Design Token Check","react-i18next Factory Check"))) \| map(.conclusion) \| unique'` returns `["success"]` | ✅           |
| MERGE-02 | Positive-failure assertion fires locally              | unit        | `! pnpm exec eslint -c eslint.config.mjs --max-warnings 0 tools/eslint-fixtures/bad-design-token.tsx && ! pnpm exec eslint -c eslint.config.mjs --max-warnings 0 tools/eslint-fixtures/bad-vi-mock.ts` exits 0                                                                                                             | ✅           |

---

## Wave 0 Requirements

- [ ] No new test framework setup — existing vitest + eslint + size-limit + `gh` CLI cover all assertions
- [ ] No new test files needed — verification rides on existing tooling
- [ ] Evidence artifacts (`55-SMOKE-PR-EVIDENCE.json`, `55-SMOKE-PR-EVIDENCE.png`, `protection-before.json`, `protection-after.json`) are evidence-of-record, not tests — produced by plans 3 + 4

_Existing test infrastructure covers all phase requirements._

---

## Manual-Only Verifications

| Behavior                               | Requirement                            | Why Manual                                                                                                                             | Test Instructions                                                                                                                                                |
| -------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Merge PR "Merge pull request" UI click | MERGE-01 (D-02)                        | GitHub UI action — Claude cannot click the merge button on owner's behalf; `enforce_admins=true` requires all contexts green first     | After all 6 contexts SUCCESS on the merge PR, user clicks "Merge pull request" → "Confirm merge". Claude resumes after merge commit lands on main.               |
| Screenshot of BLOCKED smoke-PR banner  | MERGE-02 (D-11)                        | GitHub UI screenshot — Claude cannot capture browser viewport                                                                          | User captures `55-SMOKE-PR-EVIDENCE.png` of the smoke PR's "Merging is blocked" banner; commits to phase folder. JSON evidence captured by Claude automatically. |
| Production deploy posture decision     | MERGE-01 (open question from RESEARCH) | `deploy.yml` auto-triggers on CI success on main — user must decide: accept auto-deploy, disable temporarily, or time-window the merge | Plan 1 pauses and asks the user before pushing the merge button.                                                                                                 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (N/A — no Wave 0 needed)
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s for plan-local; < 8 min for full suite
- [ ] `nyquist_compliant: true` set in frontmatter (after planner fills task map)

**Approval:** pending
