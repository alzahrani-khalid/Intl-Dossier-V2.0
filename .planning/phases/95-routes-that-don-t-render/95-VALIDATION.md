---
phase: 95
slug: routes-that-don-t-render
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-16
---

# Phase 95 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `95-RESEARCH.md` §Validation Architecture (probe-verified 2026-08-16).

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

> Task IDs are assigned by the planner; this map is seeded per requirement from
> `95-RESEARCH.md` §Phase Requirements → Test Map and completed when plans exist.

| Task ID | Plan | Wave | Requirement           | Threat Ref | Secure Behavior                                                 | Test Type                          | Automated Command                                                                                                                                                                                                     | File Exists            | Status     |
| ------- | ---- | ---- | --------------------- | ---------- | --------------------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---------- |
| TBD     | TBD  | TBD  | DEAD-01               | —          | no server error rendered as empty results                       | unit + e2e                         | `cd frontend && pnpm exec vitest run src/domains/dossiers/repositories/__tests__/dossiers.repository.search.test.ts`; `pnpm exec playwright test tests/e2e/95-search-renders.spec.ts --project=chromium-en --no-deps` | ❌ W0                  | ⬜ pending |
| TBD     | TBD  | TBD  | DEAD-02               | —          | deployed fn auth-guarded (probe pattern)                        | probe + e2e                        | `bash scripts/probe-edge-auth.sh assignments-queue`; `95-queue-renders.spec.ts` (inline auth, `--no-deps`)                                                                                                            | script ✅ / spec ❌ W0 | ⬜ pending |
| TBD     | TBD  | TBD  | DEAD-03               | —          | 500 renders `role="alert"`, never spinner; no internals leaked  | e2e (CDP `Network.setBlockedURLs`) | `95-sandbox-error.spec.ts` (clone 93 CDP pattern)                                                                                                                                                                     | ❌ W0                  | ⬜ pending |
| TBD     | TBD  | TBD  | DEAD-04               | —          | SPA owns `/monitoring`; both API calls resolve                  | e2e + curl content-type            | `95-monitoring-mounts.spec.ts`; `curl -s -o /dev/null -w '%{content_type}' http://localhost:5173/monitoring`                                                                                                          | ❌ W0                  | ⬜ pending |
| TBD     | TBD  | TBD  | DEAD-08               | —          | one owner per slot; deep-links land                             | e2e + static gate                  | `95-slots-tabs.spec.ts`; `! command grep -q "positionId" frontend/src/routeTree.gen.ts` (positive-controlled)                                                                                                         | ❌ W0                  | ⬜ pending |
| TBD     | TBD  | TBD  | DEAD-09               | —          | completed ⇒ real fetchable url; never fabricated success        | unit pin + probe                   | `cd frontend && pnpm exec vitest run src/pages/reports/__tests__/generate-entry.test.ts`; POST probe returning url                                                                                                    | pin ✅ / probe ❌ W0   | ⬜ pending |
| TBD     | TBD  | TBD  | NOTFOUND-COMPONENT-01 | —          | rule fires on bare component throw, silent on 3 compliant sites | lint controls                      | `pnpm exec eslint -c eslint.config.mjs <synthetic>` (exit 1) then the 3 sites (exit 0)                                                                                                                                | ❌ W0                  | ⬜ pending |
| TBD     | TBD  | TBD  | RETENTION-CAST-01     | —          | N-row envelope → N rows; never "No Policies" over sent rows     | unit (mocked envelope)             | `cd frontend && pnpm exec vitest run src/domains/audit/hooks/__tests__/useRetentionPolicies.test.ts`                                                                                                                  | ❌ W0                  | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Sampling Rate

- **After every task commit:** Run the touched unit file(s) via `cd frontend && pnpm exec vitest run <file>`
- **After every plan wave:** Run `pnpm --filter frontend test` + `pnpm lint`
- **Before `/gsd:verify-work`:** `pnpm test --continue` green + phase e2e specs `--no-deps` + probe lines re-run
- **Max feedback latency:** 60 seconds (unit); e2e specs are per-wave, not per-commit

---

## Wave 0 Requirements

- [ ] `tests/e2e/95-search-renders.spec.ts` — DEAD-01 (natural render; NOT CDP-blocked)
- [ ] `tests/e2e/95-queue-renders.spec.ts` — DEAD-02 (post-deploy natural state)
- [ ] `tests/e2e/95-sandbox-error.spec.ts` — DEAD-03 (clone the 93 CDP pattern)
- [ ] `tests/e2e/95-monitoring-mounts.spec.ts` — DEAD-04 (HTML content-type + DOM node + 2 calls)
- [ ] `tests/e2e/95-slots-tabs.spec.ts` — DEAD-08 (deep-link + back + legislation detail)
- [ ] ESLint rule module + synthetic positive-control fixture — NOTFOUND-COMPONENT-01
- [ ] `useRetentionPolicies` unit test with mocked envelope — RETENTION-CAST-01
- [ ] Framework install: none — all runners present and verified working (RESEARCH §Validation)

---

## Manual-Only Verifications

| Behavior                                                                   | Requirement      | Why Manual                                                    | Test Instructions                                                                                                |
| -------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Execution-time oracles whose green direction needs the deploy/fix to exist | DEAD-02, DEAD-09 | done state not constructible pre-execution (GATE-STANDARD C1) | label `NOT CONSTRUCTED: needs deployed assignments-queue / real generation`; run post-deploy, never fake a green |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
