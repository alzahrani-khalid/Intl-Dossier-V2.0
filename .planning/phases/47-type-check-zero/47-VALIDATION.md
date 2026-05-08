---
phase: 47
slug: type-check-zero
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-08
---

# Phase 47 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source: `47-RESEARCH.md` §9 (Validation Architecture).

---

## Test Infrastructure

| Property                   | Value                                                                          |
| -------------------------- | ------------------------------------------------------------------------------ |
| **Framework**              | TypeScript compiler 5.9.3 via `tsc --noEmit` (frontend + backend)              |
| **Config file (frontend)** | `frontend/tsconfig.json`                                                       |
| **Config file (backend)**  | `backend/tsconfig.json`                                                        |
| **Quick run command**      | `pnpm --filter <ws> type-check`                                                |
| **Full suite command**     | `pnpm --filter frontend type-check && pnpm --filter backend type-check`        |
| **Estimated runtime**      | ~21s frontend, ~33s backend (verified 2026-05-08, M-series Mac, current state) |

The CI gate IS the validation. There is no Vitest/Playwright suite to add — TYPE-01..04 are satisfied iff `tsc --noEmit` exits 0 in both workspaces, the new `type-check` CI job is required by branch protection, and the smoke-test PR demonstrates it blocks.

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter <ws> type-check` for the workspace under edit; the executor must record exit code 0 in the commit verification before moving on.
- **After every plan wave:** Run the full suite (both workspaces).
- **Before `/gsd-verify-work`:** Full suite green, `gh api repos/.../branches/main/protection/required_status_checks/contexts` returns both `Lint` and `type-check`, smoke-test PR for each workspace shows status `failure` on the new check.
- **Max feedback latency:** ~33s (backend; the slower workspace).

---

## Per-Task Verification Map

| Task ID          | Plan  | Wave | Requirement | Threat Ref | Secure Behavior                                                                   | Test Type | Automated Command                                                                                                                                                                       | File Exists                                    | Status     |
| ---------------- | ----- | ---- | ----------- | ---------- | --------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------- |
| 47-01-W0         | 47-01 | 0    | TYPE-01     | —          | Histogram script available; baseline committed to `EXCEPTIONS.md`                 | infra     | `pnpm --filter frontend type-check 2>&1 \| grep -oE 'TS[0-9]+' \| sort \| uniq -c \| sort -rn`                                                                                          | ❌ W0 (script to add)                          | ⬜ pending |
| 47-01-\*         | 47-01 | 1+   | TYPE-01     | —          | Workspace tsc exits 0 after each task                                             | tsc gate  | `pnpm --filter frontend type-check; echo $?` returns `0` (cumulative — error count must be ≤ start-of-task count)                                                                       | ✅                                             | ⬜ pending |
| 47-01-FINAL      | 47-01 | N    | TYPE-01     | —          | Frontend tsc exits 0                                                              | tsc gate  | `pnpm --filter frontend type-check` exits 0                                                                                                                                             | ✅                                             | ⬜ pending |
| 47-02-W0         | 47-02 | 0    | TYPE-02     | —          | Histogram script available; baseline committed                                    | infra     | `pnpm --filter backend type-check 2>&1 \| grep -oE 'TS[0-9]+' \| sort \| uniq -c \| sort -rn`                                                                                           | ❌ W0 (script to add)                          | ⬜ pending |
| 47-02-\*         | 47-02 | 1+   | TYPE-02     | —          | Workspace tsc exits 0 after each task                                             | tsc gate  | `pnpm --filter backend type-check; echo $?` returns `0` (cumulative)                                                                                                                    | ✅                                             | ⬜ pending |
| 47-02-FINAL      | 47-02 | N    | TYPE-02     | —          | Backend tsc exits 0                                                               | tsc gate  | `pnpm --filter backend type-check` exits 0                                                                                                                                              | ✅                                             | ⬜ pending |
| 47-03-CI         | 47-03 | 1    | TYPE-03     | —          | New `type-check` CI job exists; downstream `needs:` arrays updated                | yaml-grep | `grep -E "^  type-check:" .github/workflows/ci.yml` returns 1 line; `grep -cE "needs: \[lint, type-check\]" .github/workflows/ci.yml` returns ≥4                                        | ✅                                             | ⬜ pending |
| 47-03-PR-OBSERVE | 47-03 | 2    | TYPE-03     | —          | Both `Lint` and `type-check` appear as separate green checks on the wiring PR     | gh CLI    | `gh pr checks <PR#>` lists both `Lint` and `type-check` with status `pass`                                                                                                              | ✅                                             | ⬜ pending |
| 47-03-PROTECT    | 47-03 | 3    | TYPE-03     | —          | Branch protection requires both checks                                            | API       | `gh api repos/{owner}/{repo}/branches/main/protection/required_status_checks --jq '.contexts'` includes both `"Lint"` and `"type-check"`                                                | ❌ (no protection today; this task creates it) | ⬜ pending |
| 47-03-SMOKE-FE   | 47-03 | 4    | TYPE-03     | —          | Frontend smoke-test PR with one TS error is blocked                               | gh CLI    | `gh pr checks <smoke-PR#>` shows `type-check` status `failure`; PR is `BLOCKED`. Close + delete branch.                                                                                 | ✅                                             | ⬜ pending |
| 47-03-SMOKE-BE   | 47-03 | 4    | TYPE-03     | —          | Backend smoke-test PR with one TS error is blocked                                | gh CLI    | `gh pr checks <smoke-PR#>` shows `type-check` status `failure`; PR is `BLOCKED`. Close + delete branch.                                                                                 | ✅                                             | ⬜ pending |
| 47-03-SUPPRESS   | 47-03 | 5    | TYPE-04     | —          | Net-new suppressions across phase = 0 (or documented in `EXCEPTIONS.md` per D-02) | grep-diff | `git diff <phase-base>..HEAD -- 'frontend/src' 'backend/src' \| grep -E '\\+.*@ts-(ignore\|expect-error)' \| wc -l` returns 0; OR every match has a corresponding `EXCEPTIONS.md` entry | ✅                                             | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `frontend/package.json` — add `type-check:summary` script (executor convenience for histogram during burn-down): `"type-check:summary": "pnpm type-check 2>&1 | grep -oE 'TS[0-9]+' | sort | uniq -c | sort -rn"`
- [ ] `backend/package.json` — same `type-check:summary` script
- [ ] `.planning/phases/47-type-check-zero/47-EXCEPTIONS.md` — created with baseline histogram (frontend + backend) snapshot at phase start; updated at phase end with any retained `@ts-ignore` / `@ts-expect-error` per TYPE-04 / D-02

_No new test framework needed — `tsc --noEmit` already wired in both workspaces (frontend `package.json:19`, backend `package.json:15`)._

---

## Manual-Only Verifications

| Behavior                                                   | Requirement | Why Manual                                                | Test Instructions                                                                                                                                                                                                                                                                             |
| ---------------------------------------------------------- | ----------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Branch protection on `main` requires `Lint` + `type-check` | TYPE-03     | GitHub repo-settings change, not source code              | `gh api -X PUT repos/{owner}/{repo}/branches/main/protection -f required_status_checks.strict=true -f required_status_checks.contexts[]=Lint -f required_status_checks.contexts[]=type-check -F enforce_admins=true ...`; verify with `gh api repos/{owner}/{repo}/branches/main/protection`. |
| Smoke-test PR (frontend) shows new gate blocks             | TYPE-03     | Real PR creation against GitHub UI; cannot be unit-tested | Branch `chore/test-type-check-gate-frontend` with one injected TS error in a touched-but-not-shipped file; open PR; observe `type-check` check fails and merge button is `BLOCKED`; close PR; delete branch.                                                                                  |
| Smoke-test PR (backend) shows new gate blocks              | TYPE-03     | Same as above, backend workspace                          | Same procedure on `chore/test-type-check-gate-backend`.                                                                                                                                                                                                                                       |

_All other phase behaviors (TYPE-01, TYPE-02, TYPE-04 grep-diff) have automated verification via `tsc --noEmit` + `git diff` recipes above._

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify (tsc gate / yaml-grep / gh CLI / git diff) or are listed in Manual-Only Verifications
- [ ] Sampling continuity: every task in 47-01 / 47-02 ends with `pnpm --filter <ws> type-check; echo $?` confirming non-increasing error count; no 3 consecutive tasks without a tsc check
- [ ] Wave 0 covers the missing `type-check:summary` scripts and `EXCEPTIONS.md` baseline
- [ ] No watch-mode flags (executor must use one-shot `tsc --noEmit`, not `tsc --watch`)
- [ ] Feedback latency ≤ 33s (backend full type-check)
- [ ] `nyquist_compliant: true` set in frontmatter once plan-checker / nyquist-auditor agree the per-task verification map is complete

**Approval:** approved 2026-05-08
