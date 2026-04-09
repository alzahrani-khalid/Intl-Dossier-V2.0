---
phase: 18
slug: e2e-test-suite
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-07
updated: 2026-04-07
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                           |
| ---------------------- | ------------------------------------------------------------------------------- |
| **Framework**          | @playwright/test 1.58.2 (installed) + nanoid (installed Wave 1)                 |
| **Config file**        | `playwright.config.ts` (root, single source — D-03)                             |
| **Quick run command**  | `pnpm exec playwright test --project=chromium-en --reporter=list --grep @smoke` |
| **Full suite command** | `pnpm exec playwright test --project=chromium-en --project=chromium-ar-smoke`   |
| **Estimated runtime**  | ~6-10 min full suite, ~30s for single spec                                      |
| **Type-check**         | `pnpm exec tsc --noEmit` (must stay clean — strict mode)                        |

---

## Sampling Rate

- **After every task commit:** Run the task's targeted spec command (see per-task map below)
- **After every plan wave:** Run `pnpm exec playwright test --project=chromium-en --project=chromium-ar-smoke`
- **Before `/gsd-verify-work`:** Full suite green on both EN and AR projects
- **Max feedback latency:** ~30s per single spec, ~10 min full suite

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement                          | Threat Ref       | Secure Behavior                                               | Test Type  | Automated Command                                                                                                                                   | File Exists | Status     |
| -------- | ---- | ---- | ------------------------------------ | ---------------- | ------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| 18-01-01 | 01   | 1    | TEST-11 (config consolidation)       | T-18-01, T-18-02 | No secrets / storageState committed; `.gitignore` enforced    | infra      | `pnpm exec playwright test --list --project=setup`                                                                                                  | ❌ W1       | ⬜ pending |
| 18-01-02 | 01   | 1    | TEST-01..TEST-10 (auth fixture)      | T-18-03, T-18-04 | Service-role key restricted to test helpers; cleanup scoped   | infra      | `pnpm exec tsc --noEmit && pnpm exec playwright test --list --project=setup`                                                                        | ❌ W1       | ⬜ pending |
| 18-01-03 | 01   | 1    | TEST-01..TEST-10 (POM scaffolds)     | —                | N/A — type-only scaffolding                                   | type-check | `pnpm exec tsc --noEmit`                                                                                                                            | ❌ W1       | ⬜ pending |
| 18-02-01 | 02   | 2    | TEST-01, TEST-03, TEST-04            | T-18-06          | Credentials sourced only from env; no hardcoded secrets       | e2e        | `pnpm exec playwright test 01-login.spec.ts 03-dossier-navigation.spec.ts 04-command-palette.spec.ts --project=chromium-en --reporter=list`         | ❌ W2       | ⬜ pending |
| 18-02-02 | 02   | 2    | TEST-02, TEST-07                     | T-18-07, T-18-08 | Tests create own entities; afterEach cleanup runs             | e2e        | `pnpm exec playwright test 02-engagement-lifecycle.spec.ts 07-calendar-events.spec.ts --project=chromium-en --reporter=list`                        | ❌ W2       | ⬜ pending |
| 18-03-01 | 03   | 3    | TEST-05, TEST-06                     | T-18-10, T-18-12 | Notification trigger requires admin JWT; drag has timeout cap | e2e        | `pnpm exec playwright test 05-notifications.spec.ts 06-work-item-crud.spec.ts --project=chromium-en --reporter=list`                                | ❌ W3       | ⬜ pending |
| 18-03-02 | 03   | 3    | TEST-08, TEST-09, TEST-10            | T-18-09, T-18-11 | AnythingLLM stubbed; CSV export non-sensitive                 | e2e        | `pnpm exec playwright test 08-export-import.spec.ts 09-briefing-generation.spec.ts 10-operations-hub.spec.ts --project=chromium-en --reporter=list` | ❌ W3       | ⬜ pending |
| 18-03-03 | 03   | 3    | TEST-01, TEST-03, TEST-04 (AR smoke) | —                | dir=rtl asserted; bilingual selectors used                    | e2e        | `pnpm exec playwright test --project=chromium-ar-smoke --reporter=list`                                                                             | ❌ W3       | ⬜ pending |
| 18-04-01 | 04   | 4    | TEST-11                              | T-18-13, T-18-14 | Failure artifacts only on failure; secrets masked             | ci         | `pnpm exec playwright test --shard=1/2 --project=chromium-en --list` (workflow validated on push to test branch)                                    | ❌ W4       | ⬜ pending |
| 18-04-02 | 04   | 4    | TEST-11                              | T-18-15, T-18-16 | Flake log + 30-min timeout + 2-retry cap                      | ci+infra   | `pnpm exec playwright test --project=chromium-en --reporter=./tests/e2e/support/flake-reporter.ts`                                                  | ❌ W4       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_
_"File Exists" column: ❌ W{N} = test file is created in Wave N, missing until then._

---

## Wave 0 Requirements

Wave 0 work folds into **Plan 18-01** (no separate wave needed — infrastructure plan IS the Wave 0 equivalent here):

- [ ] Single root `playwright.config.ts` (delete `frontend/playwright.config.ts`)
- [ ] `nanoid` installed at workspace root
- [ ] `tests/e2e/support/auth.setup.ts` produces storageState per role
- [ ] `tests/e2e/support/fixtures.ts` extends `test` with auth + cleanup
- [ ] `tests/e2e/support/helpers/{unique-id,supabase-admin,language}.ts`
- [ ] All 10 POM stub files exist and type-check
- [ ] `.env.test.example` documents all required credentials
- [ ] `.gitignore` excludes `.env.test` and `tests/e2e/support/storage/*.json`

---

## Manual-Only Verifications

| Behavior                                                  | Requirement | Why Manual                                                           | Test Instructions                                                                                                                                             |
| --------------------------------------------------------- | ----------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub branch protection rule blocks merge on E2E failure | TEST-11     | GitHub UI configuration, not in YAML                                 | After Wave 4 deploy: GitHub repo → Settings → Branches → main → require status checks → add `E2E (shard 1/2)`, `E2E (shard 2/2)`, `Merge Playwright reports`  |
| GitHub Actions secrets provisioned                        | TEST-11     | One-time secret upload; cannot be automated from inside the workflow | Repo → Settings → Secrets → Actions → add `E2E_BASE_URL`, `E2E_ADMIN_*`, `E2E_ANALYST_*`, `E2E_INTAKE_*`, `E2E_SUPABASE_URL`, `E2E_SUPABASE_SERVICE_ROLE_KEY` |
| Dedicated E2E Supabase project provisioning               | (deferred)  | Requires Supabase dashboard + billing decision                       | Deferred risk: Wave 1 uses staging project. Operator decides if dedicated E2E project is justified by isolation needs.                                        |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 1 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 (Plan 18-01) covers all MISSING file references
- [x] No watch-mode flags
- [x] Feedback latency < 10 min full suite
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-07 (planner)
