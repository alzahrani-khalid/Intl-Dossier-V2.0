---
phase: 48
slug: lint-config-alignment
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-11
---

# Phase 48 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source: §19 of 48-RESEARCH.md (Validation Architecture).

---

## Test Infrastructure

| Property                                 | Value                                                                      |
| ---------------------------------------- | -------------------------------------------------------------------------- |
| **Framework**                            | ESLint v9.39.4 (root devDep) + GitHub CLI `gh` (CI gate verification)      |
| **Config file**                          | `eslint.config.mjs` (root, flat-config)                                    |
| **Quick run command (per workspace)**    | `pnpm --filter intake-frontend lint` / `pnpm --filter intake-backend lint` |
| **Quick run command (root re-baseline)** | `pnpm exec eslint -c eslint.config.mjs frontend/src --max-warnings 0`      |
| **Full suite command**                   | `pnpm run lint` (= `turbo run lint`, parallel both workspaces)             |
| **Estimated runtime**                    | frontend ~8–12s, backend ~1–2s, full suite ~10–14s wall-clock              |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter <workspace> lint` for the workspace touched
- **After every plan wave:** Run `pnpm run lint` (full suite, both workspaces)
- **Before `/gsd-verify-work`:** Full suite green + `pnpm typecheck` green (Phase 47 zero-state preserved) + branch-protection JSON includes `"Lint"` + two smoke PRs show `mergeStateStatus=BLOCKED`
- **Max feedback latency:** ~14 seconds (full suite)

---

## Per-Task Verification Map

> Status set per task at execution time. File-Exists column reflects Wave 0 (W0) readiness.

| Task ID  | Plan                                | Wave | Requirement          | Threat Ref  | Secure Behavior                                                                                                                 | Test Type                    | Automated Command                                                                                                                                                                                                        | File Exists                   | Status     |
| -------- | ----------------------------------- | ---- | -------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- | ---------- |
| 48-01-\* | 48-01 config-consolidation          | 1    | LINT-08              | T-48-01 / — | `frontend/eslint.config.js` removed; root config has no Aceternity references; banned-paths list aligned with CLAUDE.md cascade | unit (text-grep)             | `! test -f frontend/eslint.config.js && ! grep -E '(Consider using).*(Aceternity\|Kibo)' eslint.config.mjs`                                                                                                              | ✅                            | ⬜ pending |
| 48-01-\* | 48-01                               | 1    | LINT-08              | —           | `no-restricted-imports` bans `aceternity-ui`, `@aceternity/*`, `kibo-ui`, `@kibo-ui/*` and the 4 banned-path specifiers         | unit (eslint --print-config) | `pnpm exec eslint -c eslint.config.mjs --print-config frontend/src/App.tsx \| jq '.rules["no-restricted-imports"]' \| grep -E 'aceternity\|kibo\|3d-card\|bento-grid\|floating-navbar\|link-preview'` returns ≥6 matches | ✅                            | ⬜ pending |
| 48-01-\* | 48-01                               | 1    | LINT-08              | —           | Three orphan Aceternity wrappers deleted                                                                                        | unit (fs check)              | `! test -f frontend/src/components/ui/3d-card.tsx && ! test -f frontend/src/components/ui/bento-grid.tsx && ! test -f frontend/src/components/ui/floating-navbar.tsx`                                                    | ✅                            | ⬜ pending |
| 48-01-\* | 48-01                               | 1    | LINT-06 (regression) | —           | `contact-directory.types.ts` added to ignores (supabase-generated per §6 of RESEARCH)                                           | unit (config inspection)     | `pnpm exec eslint -c eslint.config.mjs backend/src/types/contact-directory.types.ts 2>&1 \| grep -q 'ignored'`                                                                                                           | ✅                            | ⬜ pending |
| 48-02-\* | 48-02 violation-fixes               | 2    | LINT-06              | —           | Frontend lint exits 0 against root config                                                                                       | smoke                        | `pnpm --filter intake-frontend lint; test $? -eq 0`                                                                                                                                                                      | ✅ (script modified in 48-01) | ⬜ pending |
| 48-02-\* | 48-02                               | 2    | LINT-07              | —           | Backend lint exits 0 against root config                                                                                        | smoke                        | `pnpm --filter intake-backend lint; test $? -eq 0`                                                                                                                                                                       | ✅ (script modified in 48-01) | ⬜ pending |
| 48-02-\* | 48-02                               | 2    | LINT-06              | —           | Phase 47 type-check zero-state preserved (no regression)                                                                        | smoke                        | `pnpm --filter intake-frontend type-check && pnpm --filter intake-backend type-check` both exit 0                                                                                                                        | ✅                            | ⬜ pending |
| 48-02-\* | 48-02                               | 2    | LINT-06/07           | —           | Zero net-new `eslint-disable` introduced (D-17)                                                                                 | unit (git diff scan)         | `git diff phase-48-base..HEAD -- frontend/src backend/src \| grep -E '^\+.*eslint-disable' \| grep -vE '^\+\+\+' \| wc -l` returns 0                                                                                     | ❌ W0 (tag created in Wave 0) | ⬜ pending |
| 48-03-\* | 48-03 ci-gate-and-branch-protection | 3    | LINT-09              | T-48-02     | Branch protection includes `"Lint"` in required contexts                                                                        | unit (gh api)                | `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection/required_status_checks --jq '.contexts \| sort'` includes `"Lint"`                                                                             | ❌ W0                         | ⬜ pending |
| 48-03-\* | 48-03                               | 3    | LINT-09              | —           | Frontend smoke PR: deliberate `text-left` triggers Lint failure + `mergeStateStatus=BLOCKED`                                    | smoke (live CI)              | `gh pr checks <PR#> --json bucket,name --jq '.[] \| select(.name=="Lint").bucket'` returns `"fail"` AND `gh pr view <PR#> --json mergeStateStatus -q .mergeStateStatus` returns `"BLOCKED"`                              | ❌ W0 (PR opened by 48-03)    | ⬜ pending |
| 48-03-\* | 48-03                               | 3    | LINT-09              | —           | Backend smoke PR: deliberate `console.log` triggers Lint failure + `mergeStateStatus=BLOCKED`                                   | smoke (live CI)              | Same as above for backend PR                                                                                                                                                                                             | ❌ W0 (PR opened by 48-03)    | ⬜ pending |
| 48-03-\* | 48-03                               | 3    | LINT-09              | —           | `enforce_admins: true` preserved (Phase 47 D-09 posture)                                                                        | unit (gh api)                | `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection/enforce_admins --jq '.enabled'` returns `true`                                                                                                 | ✅                            | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `git tag phase-48-base $(git rev-parse HEAD)` — anchor for D-17 net-new `eslint-disable` diff scan (Phase 47 47-03 Task 6 precedent: `phase-47-base`).
- [ ] No new vitest file required — lint correctness is verified by exit code, not test invocation.
- [ ] No framework install required — ESLint v9.39.4 + plugins (`eslint-plugin-rtl-friendly`, `eslint-plugin-unused-imports`, `eslint-plugin-check-file`) already in lockfile.
- [ ] Two smoke PR branches created during 48-03 execution: `chore/test-lint-gate-frontend`, `chore/test-lint-gate-backend`. Closed with `gh pr close --delete-branch` after BLOCKED state is captured.

_Discretionary (not required):_ `pnpm lint:summary` script — analogue of Phase 47's `type-check:summary`. Planner's call per CONTEXT discretion item.

---

## Manual-Only Verifications

| Behavior                                        | Requirement    | Why Manual                                                                                                 | Test Instructions                                                                                                                                                                                                                                                 |
| ----------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Branch protection settings visible in GitHub UI | LINT-09        | GitHub Settings UI reflects API state but a UI check is the human-readable confirmation reviewers expect   | Open `https://github.com/alzahrani-khalid/Intl-Dossier-V2.0/settings/branches`, confirm `main` rule shows `Lint`, `type-check`, `Security Scan` under "Require status checks to pass before merging", and "Do not allow bypassing the above settings" is checked. |
| Two smoke PRs visually reviewed before closure  | LINT-09 / D-16 | Mergebox screenshot captures the BLOCKED status with the failed check — useful evidence in STATE.md update | View each smoke PR, capture screenshot of mergebox showing "Required statuses must pass before merging — Lint — Failing". Attach to STATE.md follow-up resolution.                                                                                                |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (phase-48-base tag, smoke-PR branches)
- [ ] No watch-mode flags
- [ ] Feedback latency < 14s (full suite wall-clock)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
