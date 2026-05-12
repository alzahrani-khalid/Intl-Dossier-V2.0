---
phase: 48-lint-config-alignment
plan: 03

subsystem: ci
tags: [lint, branch-protection, smoke-pr, d17, github-actions]

# Dependency graph
requires:
  - phase-plan: 48-01
    provides: 'Root eslint.config.mjs as canonical config; phase-48-base tag; LINT-08 satisfied'
  - phase-plan: 48-02
    provides: 'Frontend and backend lint exit 0; D-17 preview clean; LINT-06 and LINT-07 satisfied'
provides:
  - '`Lint` required on main branch protection alongside `type-check` and `Security Scan`'
  - 'Two closed smoke PRs proving lint failures block merges on main'
  - 'Phase-wide D-17 reconciliation with 0 net-new eslint-disable directives'
  - 'STATE.md follow-up #1 resolved by analogy with Phase 48 smoke PR evidence'
  - 'ROADMAP.md and REQUIREMENTS.md synced for Phase 48 completion'
requirements-completed: [LINT-09]

# Metrics
completed: 2026-05-12
---

# Phase 48 Plan 03: CI Gate and Branch Protection Summary

**Restored `Lint` as a PR-blocking branch-protection context on `main`, verified the exact check name through two smoke PRs, and closed Phase 48 with a clean D-17 audit.**

## Final Branch Protection State

Live verification:

```bash
gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection/required_status_checks --jq '.contexts | sort | join(",")'
# Lint,Security Scan,type-check

gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection/enforce_admins --jq '.enabled'
# true
```

Post-PUT protection snapshot:

```json
{
  "contexts": ["Lint", "Security Scan", "type-check"],
  "strict": true,
  "enforce_admins": true
}
```

Evidence file: `/tmp/48-03-protection-after.json`.

## Smoke PR Evidence

### Frontend

- PR: https://github.com/alzahrani-khalid/Intl-Dossier-V2.0/pull/7
- Branch: `chore/test-lint-gate-frontend`
- State: `CLOSED`
- Merged: no (`mergedAt=null`)
- Branch cleanup: deleted from origin (`gh api .../branches/chore/test-lint-gate-frontend` returns 404)
- Merge state while checks failed: `BLOCKED`

```json
{
  "number": 7,
  "url": "https://github.com/alzahrani-khalid/Intl-Dossier-V2.0/pull/7",
  "state": "CLOSED",
  "headRefName": "chore/test-lint-gate-frontend",
  "mergeStateStatus": "BLOCKED",
  "closed": true,
  "mergedAt": null,
  "closedAt": "2026-05-11T12:34:07Z"
}
```

Required checks:

```json
[
  { "name": "Lint", "bucket": "fail", "state": "FAILURE" },
  { "name": "type-check", "bucket": "pass", "state": "SUCCESS" },
  { "name": "Security Scan", "bucket": "pass", "state": "SUCCESS" }
]
```

Evidence files: `/tmp/48-03-pr-fe-view.json`, `/tmp/48-03-pr-fe-checks.json`.

### Backend

- PR: https://github.com/alzahrani-khalid/Intl-Dossier-V2.0/pull/8
- Branch: `chore/test-lint-gate-backend`
- State: `CLOSED`
- Merged: no (`mergedAt=null`)
- Branch cleanup: deleted from origin (`gh api .../branches/chore/test-lint-gate-backend` returns 404)
- Merge state while checks failed: `BLOCKED`

```json
{
  "number": 8,
  "url": "https://github.com/alzahrani-khalid/Intl-Dossier-V2.0/pull/8",
  "state": "CLOSED",
  "headRefName": "chore/test-lint-gate-backend",
  "mergeStateStatus": "BLOCKED",
  "closed": true,
  "mergedAt": null,
  "closedAt": "2026-05-11T12:37:35Z"
}
```

Required checks:

```json
[
  { "name": "Lint", "bucket": "fail", "state": "FAILURE" },
  { "name": "type-check", "bucket": "pass", "state": "SUCCESS" },
  { "name": "Security Scan", "bucket": "pass", "state": "SUCCESS" }
]
```

Evidence files: `/tmp/48-03-pr-be-view.json`, `/tmp/48-03-pr-be-checks.json`.

## D-17 Reconciliation

See `.planning/phases/48-lint-config-alignment/48-EXCEPTIONS.md`.

| Metric                                                                       | Target                                           | Observed                                         | Status |
| ---------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------ | ------ |
| Net-new `eslint-disable` (frontend/src + backend/src, `phase-48-base..HEAD`) | 0                                                | 0                                                | PASS   |
| Net-new `@ts-(ignore\|expect-error\|nocheck)` (carry-forward Phase 47 D-01)  | 0                                                | 0                                                | PASS   |
| Stale `eslint-disable` deletions (48-02 Task 3)                              | 9 directive deletions + 1 unused import deletion | 9 directive deletions + 1 unused import deletion | PASS   |

Audit files:

- `/tmp/48-03-eslint-disable-additions.txt` — 0 lines
- `/tmp/48-03-ts-suppression-additions.txt` — 0 lines
- `/tmp/48-03-eslint-disable-deletions.txt` — 9 lines

## STATE / Roadmap Close-Out

- `STATE.md` marks Phase 48 as `SUCCESS (3/3 plans)`.
- `STATE.md` outstanding follow-up #1 marks the Phase 47 smoke-PR follow-up resolved by analogy via Phase 48 PRs #7 and #8.
- `ROADMAP.md` marks Phase 48 as complete with 3/3 plans.
- `REQUIREMENTS.md` marks LINT-06..LINT-09 as satisfied.
- Next phase is Phase 49 (`bundle-budget-reset`).

## Deviations

1. **Frontend smoke PR first attempt superseded.** PR #6 injected a JSX const at module top level and tripped TypeScript `noUnusedLocals`, so it was closed and replaced by PR #7 with JSX inside the App return tree. PR #7 produced the required clean attribution: `Lint=fail`, `type-check=pass`.
2. **Main is still lint-red until DesignV2 merges.** The smoke PRs target `main`, where the 48-02 lint fixes are not yet merged. That means the smoke PR lint failure is not isolable to only the injected violation. The gate proof is still valid because GitHub matched the required context name byte-for-byte: `Lint=fail` plus `mergeStateStatus=BLOCKED`.
3. **Evidence files rehydrated in this continuation.** The checkpoint-referenced `/tmp/48-03-*` files were not present in the resumed shell. They were recreated from live GitHub API / `gh pr checks` queries before writing this summary.
4. **Roadmap/requirements sync added.** The 48-03 plan text said to update the v6.2 progress table in `STATE.md`, but the canonical progress table is in `ROADMAP.md`. This close-out updates both `STATE.md` and `ROADMAP.md`, plus the Phase 48 rows in `REQUIREMENTS.md`, so durable artifacts agree.

## Verdict

SUCCESS. LINT-09 is satisfied: branch protection on `main` requires `Lint`, exact check-name casing is proven by PR #7 and PR #8, both smoke PRs were blocked and closed without merge, and the phase-wide D-17 audit is clean.
