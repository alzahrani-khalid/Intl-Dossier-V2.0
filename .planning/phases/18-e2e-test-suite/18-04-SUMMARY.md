---
phase: 18-e2e-test-suite
plan: 04
subsystem: ci-e2e
tags: [ci, playwright, e2e, github-actions, flake-tracking]
requires:
  - .github/workflows/ci.yml
  - playwright.config.ts
  - tests/e2e/support/auth.setup.ts
provides:
  - .github/workflows/e2e.yml
  - tests/e2e/support/flake-reporter.ts
  - .planning/phases/18-e2e-test-suite/18-FLAKE-LOG.md
  - npm-script:test:e2e:ci
affects:
  - ci-gates
  - branch-protection
tech-stack:
  added: []
  patterns:
    - github-actions-matrix-sharding
    - playwright-blob-merge-reports
    - custom-playwright-reporter
key-files:
  created:
    - .github/workflows/e2e.yml
    - tests/e2e/support/flake-reporter.ts
    - .planning/phases/18-e2e-test-suite/18-FLAKE-LOG.md
  modified:
    - playwright.config.ts
    - package.json
decisions:
  - 'Matrix sharding over Playwright workers: independent job logs + per-shard retry'
  - 'chromium-en + chromium-ar-smoke in same shard pass (cheap together); mobile deferred'
  - 'Branch protection configured in GitHub UI, not YAML (documented)'
metrics:
  duration-minutes: 6
  completed: 2026-04-07
  tasks: 2
  files: 5
---

# Phase 18 Plan 04: CI Integration Summary

**One-liner:** Wires Playwright E2E suite into GitHub Actions as a 2-shard PR gate with blob-merged HTML reports, failure trace upload, and a custom flake reporter that surfaces retried tests for follow-up.

## What Shipped

1. **`.github/workflows/e2e.yml`** — Runs on PR + push to main. 2-shard matrix executes `chromium-en` + `chromium-ar-smoke` projects in parallel (30-min timeout, fail-fast disabled). Each shard uploads a blob report; a downstream `merge-reports` job downloads all blobs and produces a unified HTML report. On failure, trace zips, PNG screenshots, and WEBM videos upload as a separate artifact (90-day retention).
2. **`tests/e2e/support/flake-reporter.ts`** — Custom Playwright `Reporter` implementation. During `onTestEnd` it records any test with `result.retry > 0`; on `onEnd` it prints a `=== RETRIED TESTS (potential flakes) ===` block so CI logs surface flakes immediately. Added to the CI reporter chain in `playwright.config.ts` alongside `blob` and `github`.
3. **`18-FLAKE-LOG.md`** — Scaffolded tracking document with "Tracked Flakes" and "Resolution Log" tables. Per D-14, any test retried more than twice in 7 days must be fixed at the source, not left to the retry bandaid.
4. **`test:e2e:ci` npm script** — `playwright test --project=chromium-en --project=chromium-ar-smoke` so local runs match CI intent.
5. **Hardening pass** — Grepped all specs for `waitForTimeout`. Only hit: the documented 200ms post-drag wait in `WorkItemKanbanPage.ts` (dnd-kit drop reconciliation). No hardcoded sleeps, no race-y network calls, no unguarded mutations — wave 1-3 specs already use `expect.poll`, `waitForResponse`, and `afterEach` cleanup.

## Required GitHub Secrets

Must be configured in repo settings before the workflow can run green:

- `E2E_BASE_URL` — staging frontend URL
- `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`
- `E2E_ANALYST_EMAIL`, `E2E_ANALYST_PASSWORD`
- `E2E_INTAKE_EMAIL`, `E2E_INTAKE_PASSWORD`
- `E2E_SUPABASE_URL`, `E2E_SUPABASE_SERVICE_ROLE_KEY`

## Manual Steps (Not in YAML)

**Branch protection** must be configured in GitHub UI (Settings → Branches → main):
Require status checks to pass before merging — select:

- `E2E (shard 1/2)`
- `E2E (shard 2/2)`
- `Merge Playwright reports`

This satisfies D-15 (merge blocking). GitHub does not support defining branch protection via workflow YAML.

## Decisions Made

1. **GitHub Actions matrix sharding** (not Playwright internal workers) — gives independent job logs, faster feedback per shard, and the ability to re-run just one failing shard. Trade-off: 2x install/playwright-install overhead, accepted for DX.
2. **`chromium-en` + `chromium-ar-smoke` share the shard pass** — AR smoke is only 3 specs; bundling them keeps CI minutes low. `chromium-mobile` deferred pending baseline runtime measurement.
3. **90-day artifact retention** — long enough for post-mortem on flakes that surface weeks later; GitHub default is 90d so no extra billing consideration.
4. **`fail-fast: false`** — one failing shard should not cancel the other; we want the full failure surface per run.

## Deviations from Plan

None — plan executed exactly as written. `ci.yml` was intentionally not modified: branch protection is the gating mechanism per the plan's documented fallback.

## Threat Model Reconciliation

All four STRIDE items from the plan (T-18-13..T-18-16) are mitigated by the committed workflow:

- **T-18-13** (info disclosure via artifacts): staging-only secrets, private repo restricts artifact access.
- **T-18-14** (secret spoofing): all secrets injected via `env:` block, never echoed, GitHub auto-masks.
- **T-18-15** (service-role key elevation): key scoped to E2E project; rotation is an ops task (noted in 18-01 as deferred).
- **T-18-16** (flake-driven DoS on CI minutes): 2-retry cap + 30-min timeout + flake log feedback loop.

## Verification

- `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/e2e.yml'))"` → `yaml ok`
- `playwright.config.ts` reporter array includes `./tests/e2e/support/flake-reporter.ts` in CI mode
- `package.json` scripts include `test:e2e:ci`
- `18-FLAKE-LOG.md` committed with template structure
- Pre-commit hooks (husky/lint-staged/turbo build) passed on both commits

Full workflow smoke (actual GitHub run) will execute on the PR that merges phase 18 — this is expected and serves as the live verification of D-12..D-17.

## Commits

- `f0cd6d6a` — ci(18-04): add E2E Playwright workflow with 2-shard matrix
- `afde2900` — test(18-04): add flake reporter + flake log + test:e2e:ci script

## Self-Check: PASSED

- FOUND: .github/workflows/e2e.yml
- FOUND: tests/e2e/support/flake-reporter.ts
- FOUND: .planning/phases/18-e2e-test-suite/18-FLAKE-LOG.md
- FOUND: commit f0cd6d6a
- FOUND: commit afde2900
