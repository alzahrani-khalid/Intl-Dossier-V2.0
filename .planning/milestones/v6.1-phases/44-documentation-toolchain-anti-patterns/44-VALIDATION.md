---
phase: 44
slug: documentation-toolchain-anti-patterns
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-07
---

# Phase 44 - Validation Strategy

> Per-phase validation contract for documentation reconciliation, bundle-budget
> enforcement, and targeted anti-pattern closure.

## Test Infrastructure

| Property           | Value                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------- |
| Framework          | vitest, Playwright, ESLint, size-limit, GSD audit                                        |
| Config file        | `frontend/playwright.config.ts`, `frontend/.size-limit.json`, `.github/workflows/ci.yml` |
| Quick run command  | `pnpm -C frontend lint`                                                                  |
| Full suite command | `pnpm -C frontend build && pnpm -C frontend size-limit`                                  |
| Estimated runtime  | 2-8 minutes depending on browser setup                                                   |

## Sampling Rate

- After every documentation task: run the exact `test -f` / `grep` checks named
  in the task.
- After size-limit config changes: run `pnpm -C frontend build` before
  `pnpm -C frontend size-limit`.
- After anti-pattern source changes: run `pnpm -C frontend lint`.
- Before `$gsd-verify-work`: run all plan-level verification commands and
  `gsd-audit-milestone v6.0`.
- Max feedback latency: one plan wave.

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement               | Threat Ref | Secure Behavior                                         | Test Type | Automated Command                                                            | File Exists | Status  |
| -------- | ---- | ---- | ------------------------- | ---------- | ------------------------------------------------------- | --------- | ---------------------------------------------------------------------------- | ----------- | ------- |
| 44-01-01 | 01   | 1    | DOC-01..DOC-06            | T-44-01    | Verification files cite evidence, not claims            | docs      | `test -f .planning/milestones/v6.0-phases/33-token-engine/VERIFICATION.md`   | yes         | pending |
| 44-03-01 | 03   | 1    | TOOL-01..TOOL-03          | T-44-02    | CI measures real files and fails on regression          | build     | `pnpm -C frontend build && pnpm -C frontend size-limit`                      | yes         | pending |
| 44-04-01 | 04   | 1    | LINT-01..LINT-05          | T-44-03    | No redundant labels or stale namespace calls remain     | lint      | `pnpm -C frontend lint`                                                      | yes         | pending |
| 44-05-01 | 05   | 2    | LINT-02, LINT-04, LINT-05 | T-44-04    | Browser axe verifies label-in-name closure              | e2e       | `pnpm -C frontend exec playwright test phase-44-antipatterns.spec.ts --list` | yes         | pending |
| 44-06-01 | 06   | 2    | STORY-01                  | T-44-05    | Storybook deferral has replacement coverage and trigger | docs      | `test -f .planning/decisions/ADR-006-storybook-deferral.md`                  | yes         | pending |
| 44-02-01 | 02   | 3    | DOC-07, DOC-08            | T-44-06    | Final docs match evidence after all artifacts exist     | audit     | `gsd-audit-milestone v6.0`                                                   | yes         | pending |

## Wave 0 Requirements

Existing infrastructure covers all phase requirements:

- `frontend/tests/e2e/helpers/qa-sweep.ts`
- `frontend/tests/e2e/support/list-pages-auth.ts`
- `frontend/tests/e2e/support/dossier-drawer-fixture.ts`
- `frontend/.size-limit.json`
- `.github/workflows/ci.yml`
- `.planning/milestones/v6.0-MILESTONE-AUDIT.md`

## Manual-Only Verifications

| Behavior                                                            | Requirement | Why Manual                                                                             | Test Instructions                                                                                                                                      |
| ------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CI rejects a verification PR with a >= 1 KB measured chunk increase | TOOL-03     | Local execution can prove the same command fails; real PR rejection requires GitHub CI | Open a temporary verification PR after Plan 03, add a >= 1 KB measured chunk perturbation, confirm `bundle-size-check` fails, then close without merge |

## Validation Sign-Off

- [ ] All tasks have automated verify commands or explicit manual instructions.
- [ ] No three consecutive tasks lack automated verification.
- [ ] Size-limit verifies both positive pass and negative regression failure.
- [ ] Browser a11y uses rule-specific `label-content-name-mismatch` coverage.
- [ ] `nyquist_compliant: true` set in frontmatter.

**Approval:** pending
