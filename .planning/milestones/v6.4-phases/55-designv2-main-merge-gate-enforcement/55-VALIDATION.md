---
phase: 55
slug: designv2-main-merge-gate-enforcement
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-17
audited: 2026-05-18
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

> Each row reflects the inline `<verify><automated>` block in the corresponding PLAN.md task. Populated post-execution (2026-05-18) from completed plan artifacts.

| Task ID | Plan  | Wave | Requirement | Threat Ref       | Test Type   | Automated Command (essence)                                                                      | File Exists | Status |
| ------- | ----- | ---- | ----------- | ---------------- | ----------- | ------------------------------------------------------------------------------------------------ | ----------- | ------ |
| 1       | 55-01 | 1    | MERGE-01    | T-55-02          | integration | `git fetch --tags`; `git tag -v phase-{47,48,49,54}-base`; ahead/behind count                    | ✅          | ✅     |
| 1b      | 55-01 | 1    | MERGE-01    | T-55-02          | integration | DesignV2 absorb-merge of origin/main (replan insert); re-verify 4 signed tags                    | ✅          | ✅     |
| 2       | 55-01 | 1    | MERGE-01    | T-55-PD          | integration | Local CI parity full suite on DesignV2 tip                                                       | ✅          | ✅     |
| 3       | 55-01 | 1    | MERGE-01    | T-55-PD          | integration | `git push origin DesignV2 && gh pr create --base main`                                           | ✅          | ✅     |
| 4       | 55-01 | 1    | MERGE-01    | T-55-PD          | integration | `gh pr view --json statusCheckRollup` → 6/6 SUCCESS on merge PR                                  | ✅          | ✅     |
| 5       | 55-01 | 1    | MERGE-01    | T-55-04          | manual      | Human-gate (deploy posture + UI Merge click) — see Manual-Only below                             | ✅          | ✅     |
| 6       | 55-01 | 1    | MERGE-01    | T-55-PD          | integration | `gh pr view --json mergeCommit,state`; HEAD 2 parents; 4 prior tags reachable                    | ✅          | ✅     |
| 7       | 55-01 | 1    | MERGE-01    | T-55-02          | integration | `gh api DELETE refs/heads/DesignV2`; `git tag -s -a phase-55-base`; `git tag -v` PASS            | ✅          | ✅     |
| 8       | 55-01 | 1    | MERGE-01    | T-55-RB          | docs        | `55-01-SUMMARY.md` references merge SHA + phase-55-base + revert procedure                       | ✅          | ✅     |
| 1       | 55-02 | 2    | MERGE-02    | T-55-NJ          | unit        | `! pnpm exec eslint --max-warnings 0 tools/eslint-fixtures/bad-{design-token,vi-mock}` exit 0    | ✅          | ✅     |
| 2       | 55-02 | 2    | MERGE-02    | T-55-CN, T-55-SQ | unit        | YAML valid; `name: Design Token Check` + `name: react-i18next Factory Check` literal grep        | ✅          | ✅     |
| 3       | 55-02 | 2    | MERGE-02    | T-55-NJ          | integration | `gh pr checks --watch`; both new jobs `conclusion: SUCCESS` on PR statusCheckRollup              | ✅          | ✅     |
| 4       | 55-02 | 2    | MERGE-02    | T-55-NJ          | manual      | Human-gate (UI Merge click on CI jobs PR)                                                        | ✅          | ✅     |
| 5       | 55-02 | 2    | MERGE-02    | T-55-NJ          | integration | `gh api .../actions/runs/<id>/jobs` → both new jobs `conclusion: success` on main HEAD           | ✅          | ✅     |
| 6       | 55-02 | 2    | MERGE-02    | T-55-CN          | docs        | `55-02-SUMMARY.md` records Plan 03 unblock + D-13 reversal note                                  | ✅          | ✅     |
| 1       | 55-03 | 3    | MERGE-02    | T-55-01, T-55-PB | integration | `gh api .../branches/main/protection` → contexts.length==6; security booleans intact             | ✅          | ✅     |
| 2       | 55-03 | 3    | MERGE-02    | T-55-PB          | unit        | jq round-trip → protection-after.json; length==8; raw-boolean shape; 2 new names present         | ✅          | ✅     |
| 3       | 55-03 | 3    | MERGE-02    | T-55-01, T-55-PD | integration | `gh api -X PUT .../protection`; live GET → 8 contexts; enforce_admins/force-push/deletion intact | ✅          | ✅     |
| 4       | 55-03 | 3    | MERGE-02    | T-55-RB          | docs        | `55-03-SUMMARY.md` includes 6→8 diff + rollback command + D-13 reversal note                     | ✅          | ✅     |
| 1       | 55-04 | 4    | MERGE-02    | T-55-03          | integration | 4 violations planted in `__smoke__/` files; hex literal + type error + bad-fixture imports       | ✅          | ✅     |
| 2       | 55-04 | 4    | MERGE-02    | T-55-03          | integration | `gh pr create` with literal "DO NOT MERGE" in title                                              | ✅          | ✅     |
| 3       | 55-04 | 4    | MERGE-02    | T-55-MS, T-55-NR | integration | `gh pr view --json mergeStateStatus` returns `"BLOCKED"` (uppercase); ≥1 FAILURE in rollup       | ✅          | ✅     |
| 4       | 55-04 | 4    | MERGE-02    | T-55-EV          | manual      | Human-gate (PNG screenshot of BLOCKED banner) — see Manual-Only below                            | ✅          | ✅     |
| 5       | 55-04 | 4    | MERGE-02    | T-55-EV          | integration | Evidence committed on separate doc branch; PR opens; CI green (Pitfall 10 sequencing)            | ✅          | ✅     |
| 6       | 55-04 | 4    | MERGE-02    | T-55-EV          | manual      | Human-gate (UI Merge click on evidence PR before smoke PR closed)                                | ✅          | ✅     |
| 7       | 55-04 | 4    | MERGE-02    | T-55-03, T-55-EV | integration | `gh pr close --delete-branch`; remote branch returns 404; evidence files on main                 | ✅          | ✅     |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

**Total tasks:** 26 (23 automated · 3 human-gate). **Coverage:** 100%.

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

- [x] No new test framework setup — existing vitest + eslint + size-limit + `gh` CLI cover all assertions
- [x] No new test files needed — verification rides on existing tooling
- [x] Evidence artifacts (`55-SMOKE-PR-EVIDENCE.json`, `55-SMOKE-PR-EVIDENCE.png`, `protection-before.json`, `protection-after.json`, `55-MERGE-PR-EVIDENCE.json`, `55-CI-JOBS-PR-EVIDENCE.json`) are evidence-of-record, not tests — produced by plans 1, 2, 3, 4

_Existing test infrastructure covers all phase requirements._

---

## Manual-Only Verifications

| Behavior                               | Requirement                            | Why Manual                                                                                                                             | Test Instructions                                                                                                                                                | Resolved                                          |
| -------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Merge PR "Merge pull request" UI click | MERGE-01 (D-02)                        | GitHub UI action — Claude cannot click the merge button on owner's behalf; `enforce_admins=true` requires all contexts green first     | After all 6 contexts SUCCESS on the merge PR, user clicks "Merge pull request" → "Confirm merge". Claude resumes after merge commit lands on main.               | ✅ Plan 01 Task 5 · merge commit `3f763ddc`       |
| Screenshot of BLOCKED smoke-PR banner  | MERGE-02 (D-11)                        | GitHub UI screenshot — Claude cannot capture browser viewport                                                                          | User captures `55-SMOKE-PR-EVIDENCE.png` of the smoke PR's "Merging is blocked" banner; commits to phase folder. JSON evidence captured by Claude automatically. | ✅ Plan 04 Task 4 · 436,606-byte PNG on main      |
| Production deploy posture decision     | MERGE-01 (open question from RESEARCH) | `deploy.yml` auto-triggers on CI success on main — user must decide: accept auto-deploy, disable temporarily, or time-window the merge | Plan 1 pauses and asks the user before pushing the merge button.                                                                                                 | ✅ Plan 01 Task 5 · Option 1 (accept auto-deploy) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (N/A — no Wave 0 needed)
- [x] No watch-mode flags
- [x] Feedback latency < 60s for plan-local; < 8 min for full suite
- [x] `nyquist_compliant: true` set in frontmatter (post-execution audit 2026-05-18)

**Approval:** approved (2026-05-18)

---

## Validation Audit 2026-05-18

| Metric                                 | Count                                                              |
| -------------------------------------- | ------------------------------------------------------------------ |
| Requirements                           | 2 (MERGE-01, MERGE-02)                                             |
| Requirement-level automated commands   | 8                                                                  |
| Per-task automated `<verify>` blocks   | 23                                                                 |
| Per-task manual human-gate checkpoints | 3 (deploy posture, BLOCKED screenshot, evidence Merge click)       |
| Gaps found (test gen)                  | 0                                                                  |
| Gaps found (doc population)            | 3 (per-task map skeleton · stale frontmatter · sign-off unchecked) |
| Resolved (doc fixes)                   | 3                                                                  |
| Escalated                              | 0                                                                  |
| Test files added                       | 0 (CI-config phase; reuses existing eslint/vitest/size-limit/gh)   |

**Live re-verification (2026-05-18):**

- `git merge-base --is-ancestor phase-54-base origin/main` → PASS
- `git tag -v phase-{47,48,49,54,55}-base` → 5/5 "Good \"git\" signature"
- `gh api .../branches/main/protection --jq '.required_status_checks.contexts | length'` → `8`
- `gh api .../branches/main/protection --jq '.required_status_checks.contexts | sort'` → contains `Design Token Check` + `react-i18next Factory Check` + 6 originals
- `jq -r '.mergeStateStatus' 55-SMOKE-PR-EVIDENCE.json` → `BLOCKED`
- `jq -r '.statusCheckRollup[]' 55-MERGE-PR-EVIDENCE.json` → 6/6 required = SUCCESS on merge PR
- `! pnpm exec eslint --max-warnings 0 tools/eslint-fixtures/bad-{design-token,vi-mock}` → both exit 0 (positive-failure live)

Phase 55 is Nyquist-compliant.
