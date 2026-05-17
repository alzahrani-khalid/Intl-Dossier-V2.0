---
phase: 50-test-infrastructure-repair
plan: 05
subsystem: ci-and-lint
tags: [ci, branch-protection, eslint, vitest, frontend, backend]
requires:
  - phase: 50-test-infrastructure-repair
    provides: 'Frontend and backend default runners green on HEAD'
provides:
  - 'Three new CI jobs: Tests (frontend), Tests (backend) [blocking], Tests (integration) [advisory]'
  - 'D-15 no-restricted-syntax ESLint rule enforcing importActual + spread on vi.mock factories in test files'
  - 'tools/eslint-fixtures/bad-vi-mock.ts regression target proving the rule fires'
  - 'main branch protection requires 6 contexts (4 prior + Tests (frontend) + Tests (backend))'
  - 'Smoke PR #11 audit trail proving the gate blocks merges on failing frontend tests'
affects: [phase-50, ci, branch-protection, eslint-config, test-docs]
tech-stack:
  added: []
  patterns:
    - 'CI job names ARE the branch-protection context names — workflow `name:` field is the contract.'
    - 'gh api PUT replaces the full protection resource; required_pull_request_reviews and restrictions must be re-supplied even when null.'
    - 'Branch-protection PATCH is gated on new jobs going green on at least one pushed commit before being added to required_status_checks.contexts.'
key-files:
  created:
    - tools/eslint-fixtures/bad-vi-mock.ts
    - .planning/phases/50-test-infrastructure-repair/50-05-SUMMARY.md
  modified:
    - .github/workflows/ci.yml
    - eslint.config.mjs
    - scripts/lint.mjs
key-decisions:
  - 'Tests (integration) registered as advisory (continue-on-error: true), NOT required-contexts, because backend integration runner still has unfixed real-service prerequisites.'
  - 'D-15 rule scoped to frontend/tests/** + tools/eslint-fixtures/** only. Broader scope on frontend/src/**/__tests__ surfaced 234 legacy mocks and would have turned 50-05 into a migration.'
  - 'Smoke PR proof used a dedicated test file (frontend/tests/_smoke-50-05-gate.test.ts) rather than appending to an existing test, to keep the deletion clean.'
  - 'PUT preserved enforce_admins=true, strict=true, required_pull_request_reviews=null, restrictions=null from pre-state.'
requirements-completed: [TEST-01, TEST-04]
duration: ~3h (cumulative across checkpoints)
completed: 2026-05-14
---

# Phase 50 Plan 05: CI Gates, Branch Protection, and D-15 ESLint Rule Summary

**Phase 50's frontend and backend test runners are now enforced at PR-merge time: `main` requires `Tests (frontend)` and `Tests (backend)` to pass, and a `no-restricted-syntax` ESLint rule prevents future contributors from adding a `vi.mock(...)` factory that omits the `importActual + spread` pattern that previously broke the `react-i18next` mock.**

## Accomplishments

### Code (committed in `720d135a`)

- `.github/workflows/ci.yml`: added three jobs mirroring the `type-check` job shape:
  - `Tests (frontend)` — runs `pnpm --filter intake-frontend test --run` — **blocking**.
  - `Tests (backend)` — runs `pnpm --filter intake-backend test --run` — **blocking**.
  - `Tests (integration)` — runs the backend integration runner with `continue-on-error: true` — **advisory only**.
  - `build` job updated to depend on `lint`, `type-check`, `test-frontend`, and `test-backend`.
- `eslint.config.mjs`: added a test-files-scoped `no-restricted-syntax` block (D-15). The rule rejects any `vi.mock(<id>, factory)` whose factory's returned `ObjectExpression` lacks a `SpreadElement`, with an error message pointing back to `frontend/docs/test-setup.md`.
- `tools/eslint-fixtures/bad-vi-mock.ts`: deliberately-bad regression target. `pnpm lint tools/eslint-fixtures/bad-vi-mock.ts` exits non-zero with the D-15 message.
- `scripts/lint.mjs`: preserves `pnpm lint` as workspace lint and enables `pnpm lint <path>` for the targeted D-15 checks.

### GitHub-side enforcement (this session)

- Pushed HEAD `9710664f` to `feature/50-05-ci-validate` and confirmed CI run `25883170585`:
  - `Tests (frontend)` = success
  - `Tests (backend)` = success
  - `type-check` = success, `Lint` = success, `Bundle Size Check (size-limit)` = success
  - `Tests (integration)` = failure (advisory, as designed — backend integration gaps are out of 50-05 scope)
  - `Security Scan`, `E2E Tests`, `RTL + Responsive`, `Accessibility`, `Build (backend)` = failure on this branch (pre-existing infrastructure issues, unrelated to 50-05; tracked separately)
- Captured branch-protection pre-state to `/tmp/50-05-evidence/protection-pre.json` (also archived in this summary below).
- Applied `gh api -X PUT repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection` with the canonical PUT payload from the plan. Verified post-state has 6 contexts and `enforce_admins=true`.
- Opened smoke PR [#11](https://github.com/alzahrani-khalid/Intl-Dossier-V2.0/pull/11) from `smoke/phase-50-tests-gate` with a single deliberately-failing frontend test (`frontend/tests/_smoke-50-05-gate.test.ts`). CI run `25883479613` reported `Tests (frontend)` = **FAILURE**. PR closed with `--delete-branch`.

## Verification

### Pre-state (before PUT)

```json
{
  "enforce_admins": true,
  "contexts": ["type-check", "Security Scan", "Lint", "Bundle Size Check (size-limit)"],
  "strict": true,
  "reviews": null,
  "restrictions": null
}
```

### Post-state (after PUT)

```json
{
  "enforce_admins": true,
  "contexts": [
    "type-check",
    "Security Scan",
    "Lint",
    "Bundle Size Check (size-limit)",
    "Tests (frontend)",
    "Tests (backend)"
  ],
  "strict": true,
  "reviews": null,
  "restrictions": null
}
```

### Branch-protection assertions

- `gh api ... | jq -r '.required_status_checks.contexts[]' | grep -c '^Tests'` → `2` ✓
- `gh api ... | jq -r '.enforce_admins.enabled'` → `true` ✓
- `Tests (integration)` NOT in required contexts ✓

### CI green-on-HEAD evidence

- Run `25883170585` on `feature/50-05-ci-validate` (commit `9710664f`):
  - `Tests (frontend)` = success
  - `Tests (backend)` = success

### Smoke PR evidence (gate fires on failing frontend test)

- PR: https://github.com/alzahrani-khalid/Intl-Dossier-V2.0/pull/11
- Status check rollup (relevant contexts):
  - `Tests (frontend)` = **FAILURE** ← the gate firing
  - `Tests (backend)` = SUCCESS
  - `Lint` = SUCCESS
  - `type-check` = SUCCESS
- `mergeStateStatus` = `BEHIND` (see Deviations below)
- PR closed with branch deleted: `Closed pull request alzahrani-khalid/Intl-Dossier-V2.0#11 (Phase 50 smoke: tests gate proof (DO NOT MERGE))` / `Deleted branch smoke/phase-50-tests-gate`.

### Local D-15 evidence (re-verified in handoff)

- `pnpm lint tools/eslint-fixtures/bad-vi-mock.ts` exits non-zero with the D-15 message.
- `pnpm lint frontend/tests/setup.ts` exits 0.
- `pnpm lint frontend/tests/component/CommitmentList.test.tsx` exits 0.
- `pnpm lint frontend/src/components/signature-visuals/__tests__/GlobeLoader.reducedMotion.test.tsx` exits 0.
- Workspace `pnpm lint` exits 0.

## Deviations from Plan

- **`mergeStateStatus` returned `BEHIND` rather than `BLOCKED`.** The smoke branch was forked from `DesignV2` rather than directly from `main`, so GitHub's `BEHIND` precondition is reported first; the `Tests (frontend) = FAILURE` line in the status-check rollup is the operative evidence that the required context fires. A rebase to flip `BEHIND → BLOCKED` was attempted but skipped because the local worktree had unrelated `.planning/phases/47-*` deletions from prior cleanup work. The gate behavior is unambiguous regardless of the merge-state string: with `strict=true` plus a failing required context, merging is refused.
- **Smoke test created as a dedicated file** (`frontend/tests/_smoke-50-05-gate.test.ts`) rather than appended to an existing test as the plan suggested. Cleaner deletion, identical proof.

## Tech Debt Deferred

- **Other failing CI contexts on `feature/50-05-ci-validate`:** Security Scan, E2E Tests, RTL + Responsive Tests, Accessibility Tests, and Build (backend) are red. Security Scan and Bundle Size Check are already required contexts on `main`, so any future merge to `main` from a branch in this state will be blocked by them as well. These failures are pre-existing infrastructure issues (CodeQL v2 deprecation, Resource-not-accessible token scope, Trivy SARIF upload) — out of Plan 50-05 scope.
- **Tests (integration) is advisory only.** Moving it to a required context requires resolving the backend integration runner's real-service prerequisites first (see Plan 50-04 audit and `backend/docs/test-setup.md`).
- **D-15 broader scope:** Extending the rule to `frontend/src/**/__tests__` and `frontend/**/*.test.{ts,tsx}` would catch 234 legacy mocks not in the global test harness. Tracked as a follow-up migration, not part of 50-05.
- **Bad-fixture positive-failure check:** No CI job currently asserts that `pnpm lint tools/eslint-fixtures/bad-vi-mock.ts` exits non-zero. If a future parser upgrade silently disables the D-15 rule, lint will go green when it shouldn't. Tracked as `tech_debt` per Plan 50-04 audit; remediation is a small health-check script.

## Issues Encountered

- The `gh api PUT` payload had to explicitly include `required_pull_request_reviews: null` and `restrictions: null` from pre-state. PUT replaces the resource; omitting these would clear them silently. The plan and `.continue-here.md` both flagged this as the critical anti-pattern (T-50-05-01).
- Background `gh run watch --exit-status` on a partially-failing run returned exit 0 in this session, despite the overall conclusion being "failure". The job-level `jq` query was used for the authoritative read of `Tests (frontend)` and `Tests (backend)` statuses.

## Known Stubs

- `tools/eslint-fixtures/bad-vi-mock.ts` is, by design, a stub whose only purpose is to fail the lint rule. It is excluded from production builds.

## Threat Flags

- **T-50-05-01 (E)** — Mitigated. Pre-state captured, PUT preserved `enforce_admins=true` + `reviews=null` + `restrictions=null`, post-state asserted via `jq`.
- **T-50-05-02 (I)** — Accepted. Smoke PR contained a contrived test failure only; no production secrets, no real data, immediately closed and branch deleted.
- **T-50-05-03 (T)** — Accepted. D-15 enforces the pattern, not coverage. Documented in the rule message and `frontend/docs/test-setup.md`.
- **T-50-05-04 (T)** — Partially mitigated. The bad fixture exists as a regression target; the positive-failure CI check is deferred (see Tech Debt).

## User Setup Required

None. All changes are code-side and GitHub-side admin operations, both applied this session.

## Commit Trail

- `720d135a` — `ci(50-05): add split test gates and mock lint guard` (code-side enforcement: CI jobs + ESLint rule + fixture)
- `9710664f` — `docs(50-05): record branch protection checkpoint` (handoff snapshot before the GitHub-side PUT)
- This commit — `docs(50-05): summarize branch protection finalization` (this SUMMARY)

## Resume Signal

`approved https://github.com/alzahrani-khalid/Intl-Dossier-V2.0/pull/11`
