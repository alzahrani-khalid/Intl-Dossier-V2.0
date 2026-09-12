---
phase: 95
slug: routes-that-don-t-render
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-08-16
updated: 2026-08-16 # planner: task map completed against the nine 95-NN-PLAN.md files
---

# Phase 95 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `95-RESEARCH.md` §Validation Architecture (probe-verified 2026-08-16).
> Task map completed at planning time against the authored plan set (9 plans, 2 waves).

---

## Test Infrastructure

| Property               | Value                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------ |
| **Framework**          | Vitest 4.1.7 (frontend unit, jsdom); Playwright (root config, testDir `./tests/e2e`) |
| **Config file**        | `frontend/vitest.config.ts`; `playwright.config.ts` (root)                           |
| **Quick run command**  | `cd frontend && pnpm exec vitest run <file>`                                         |
| **Full suite command** | `pnpm test --continue` (Turbo — `--continue` mandatory, CONTEXT D-20)                |
| **Estimated runtime**  | quick: sub-second per file (generate-entry pin: 596ms); full: minutes                |

---

## Per-Task Verification Map

> Oracles that need the deploy/fix to exist are EXECUTION-TIME: their green direction is
> labelled UNPROVEN in the owning plan (GATE-STANDARD C1) — run post-work, never faked.

| Task ID  | Plan  | Wave | Requirement           | Threat Ref    | Secure Behavior                                                 | Test Type                          | Automated Command                                                                                                                                                                                                                                  | File Exists         | Status     |
| -------- | ----- | ---- | --------------------- | ------------- | --------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ---------- |
| 95-01 T1 | 95-01 | 1    | DEAD-01               | T-95-02       | malformed envelope THROWS — never coerced to empty results      | unit                               | `cd frontend && pnpm exec vitest run src/domains/dossiers/repositories/__tests__/dossiers.repository.search.test.ts`                                                                                                                               | ❌ created in-plan  | ⬜ pending |
| 95-01 T3 | 95-01 | 1    | DEAD-01               | T-95-01       | no server error rendered as empty; no internal strings          | e2e (natural)                      | `pnpm exec playwright test tests/e2e/95-search-renders.spec.ts --project=chromium-en --no-deps` (2 tests, existence-first)                                                                                                                         | ❌ created in-plan  | ⬜ pending |
| 95-02 T2 | 95-02 | 1    | DEAD-02               | T-95-03/04    | deployed fn auth-guarded; role gate server-side                 | version oracle + probe             | deployed `assignments-queue` version `-gt 11` via `supabase functions list` JSON (manifest inclusion is vacuous — stale v11 of 2026-07-13 is listed ACTIVE today) + `bash scripts/probe-edge-auth.sh assignments-queue` with its new 404-kind line | script ✅           | ⬜ pending |
| 95-02 T3 | 95-02 | 1    | DEAD-02               | T-95-05       | four truthful states; no internal strings                       | e2e (natural, post-deploy)         | `pnpm exec playwright test tests/e2e/95-queue-renders.spec.ts --project=chromium-en --no-deps` (2 tests)                                                                                                                                           | ❌ created in-plan  | ⬜ pending |
| 95-03 T2 | 95-03 | 1    | DEAD-03               | T-95-06       | 500 renders `role="alert"`, never spinner; no internals leaked  | e2e (CDP `Network.setBlockedURLs`) | `pnpm exec playwright test tests/e2e/95-sandbox-error.spec.ts --project=chromium-en --no-deps` (2 tests)                                                                                                                                           | ❌ created in-plan  | ⬜ pending |
| 95-04 T3 | 95-04 | 1    | DEAD-04               | T-95-08/09/10 | SPA owns /monitoring; both API calls resolve WITH auth          | e2e + content-type                 | `pnpm exec playwright test tests/e2e/95-monitoring-mounts.spec.ts --project=chromium-en --no-deps` (2 tests) + the curl content-type line in 95-04 Task 2                                                                                          | ❌ created in-plan  | ⬜ pending |
| 95-05 T1 | 95-05 | 1    | DEAD-08               | T-95-12       | one owner per slot in the generated tree                        | static gate                        | `test "$(command grep -c 'positionId' frontend/src/routeTree.gen.ts)" -eq 0` + positive pin `/positions/$id/approvals` (positive-controlled: 13 hits at planning)                                                                                  | gate, not spec      | ⬜ pending |
| 95-05 T3 | 95-05 | 1    | DEAD-08               | T-95-11       | deep-links land authenticated; tab state URL-driven             | e2e                                | `pnpm exec playwright test tests/e2e/95-slots-tabs.spec.ts --project=chromium-en --no-deps` (3 tests; named data precondition: ≥1 staging position)                                                                                                | ❌ created in-plan  | ⬜ pending |
| 95-06 T2 | 95-06 | 1    | DEAD-09               | T-95-15       | completed ⇒ real url; pin disposition executed                  | unit pin + i18n key check          | `cd frontend && pnpm exec vitest run src/pages/reports/__tests__/generate-entry.test.ts` (pin ✅ 5/5) + the node both-locales key check in 95-06 Task 2                                                                                            | pin ✅              | ⬜ pending |
| 95-06 T3 | 95-06 | 1    | DEAD-09               | T-95-13/14/15 | real POST → fetchable artifact; honest refusal on pdf           | behavioural probe                  | `node scripts/probe-report-generate.mjs` (exit 2 = UNABLE TO MEASURE, never a pass)                                                                                                                                                                | ❌ created in-plan  | ⬜ pending |
| 95-07 T2 | 95-07 | 1    | NOTFOUND-COMPONENT-01 | T-95-17       | rule fires ATTRIBUTED on bad shape; silent on 3 compliant sites | lint controls                      | positive: eslint -f json fixture → ruleId present; negative: the 3 sites exit 0 (95-07 Task 2 gate)                                                                                                                                                | ❌ created in-plan  | ⬜ pending |
| 95-08 T1 | 95-08 | 1    | RETENTION-CAST-01     | T-95-18/19    | N-row envelope → N rows; malformed → THROW, never "No Policies" | unit (mocked envelope)             | `cd frontend && pnpm exec vitest run src/domains/audit/hooks/__tests__/useRetentionPolicies.test.ts`                                                                                                                                               | ❌ created in-plan  | ⬜ pending |
| 95-09 T1 | 95-09 | 2    | all eight             | T-95-21       | closing derivations re-derivable, populations stated            | scripts + drills                   | `node scripts/decision-coverage.mjs …` + the 8-id requirement loop + `node scripts/gate-drill.mjs`                                                                                                                                                 | scripts ✅          | ⬜ pending |
| 95-09 T2 | 95-09 | 2    | all eight             | T-95-20       | only Phase 95 register rows change                              | tag-anchored diff                  | `git diff phase-95-base -- .planning/REQUIREMENTS.md` row filter (95-09 Task 2 gate)                                                                                                                                                               | needs phase-95-base | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Sampling Rate

- **After every task commit:** Run the touched unit file(s) via `cd frontend && pnpm exec vitest run <file>`
- **After every plan wave:** Run `pnpm --filter frontend test` + `pnpm lint` (lint carries the new NOTFOUND rule + i18n/namespace checks)
- **Before `/gsd:verify-work`:** `pnpm test --continue` green + phase e2e specs `--no-deps` + probe lines re-run
- **Max feedback latency:** 60 seconds (unit); e2e specs are per-wave, not per-commit

---

## Wave 0 Requirements

Each Wave-0 artifact is authored INSIDE the plan that owns its requirement (single-writer, D-17;
producer ordered before consumer within the plan):

- [ ] `tests/e2e/95-search-renders.spec.ts` — 95-01 Task 3 (natural render; NOT CDP-blocked)
- [ ] `tests/e2e/95-queue-renders.spec.ts` — 95-02 Task 3 (post-deploy natural state)
- [ ] `tests/e2e/95-sandbox-error.spec.ts` — 95-03 Task 2 (clone the 93 CDP pattern)
- [ ] `tests/e2e/95-monitoring-mounts.spec.ts` — 95-04 Task 3 (HTML content-type + DOM + 2 calls)
- [ ] `tests/e2e/95-slots-tabs.spec.ts` — 95-05 Task 3 (deep-link + back + legislation detail)
- [ ] ESLint rule module + synthetic positive-control fixture — 95-07 Task 1
- [ ] `useRetentionPolicies` unit test with mocked envelope — 95-08 Task 1
- [ ] `dossiers.repository.search.test.ts` unit test — 95-01 Task 1
- [ ] `scripts/probe-report-generate.mjs` — 95-06 Task 3
- [ ] Framework install: none — all runners present and verified working (RESEARCH §Validation)

---

## Manual-Only Verifications

| Behavior                                                                   | Requirement      | Why Manual                                                    | Test Instructions                                                                                                            |
| -------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Execution-time oracles whose green direction needs the deploy/fix to exist | DEAD-02, DEAD-09 | done state not constructible pre-execution (GATE-STANDARD C1) | label `UNPROVEN — needs deployed assignments-queue / real generation` (as the plans do); run post-deploy, never fake a green |
| Arabic naturalness + pixel RTL sign-off                                    | (all UI)         | OPERATOR park (ORCH-BRIEF §3)                                 | no plan claims either                                                                                                        |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or in-plan Wave 0 producers
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (each authored in its owning plan)
- [x] No watch-mode flags
- [x] Feedback latency < 60s (unit); e2e per-wave
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** planner 2026-08-16 (map completed against the authored plan set)
