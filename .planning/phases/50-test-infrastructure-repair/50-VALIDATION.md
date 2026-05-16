---
phase: 50
slug: test-infrastructure-repair
status: passed
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-13
frontmatter_refreshed: 2026-05-16
frontmatter_refresh_source: quick-task 260516-s3j (v6.3-MILESTONE-AUDIT Recommendation §D)
---

# Phase 50 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **Framework**          | Vitest 4.1.2 (Playwright OUT OF SCOPE per D-12)                                        |
| **Config file**        | `frontend/vitest.config.ts`, `backend/vitest.config.ts`                                |
| **Quick run command**  | `pnpm --filter intake-frontend test --run` / `pnpm --filter intake-backend test --run` |
| **Full suite command** | `pnpm test` (Turbo orchestrates both workspaces)                                       |
| **Estimated runtime**  | FE ~60-90s · BE ~30-60s · combined ≤180s                                               |

---

## Sampling Rate

- **After every task commit:** `pnpm --filter <workspace> test --run --testPathPattern <touched-folder>` (≤10s)
- **After every plan wave:** `pnpm --filter <workspace> test --run` for each workspace touched (≤90s)
- **Before `/gsd-verify-work`:** Both workspaces exit 0 + `gh api repos/.../branches/main/protection | jq '.required_status_checks.contexts'` includes new gates + `pnpm lint` exits 0 with D-15 rule active
- **Max feedback latency:** 90 seconds per workspace; 180s combined

---

## Per-Task Verification Map

| Req ID              | Behavior                                                                                                              | Test Type   | Automated Command                                                                                                                                                 | File Exists        |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| TEST-01             | `frontend/tests/setup.ts` `vi.mock('react-i18next')` factory includes `initReactI18next` via `vi.importActual` spread | grep + unit | `grep -c "initReactI18next\|importActual" frontend/tests/setup.ts` ≥1; `pnpm --filter intake-frontend test --run src/components/dossier/wizard` exits 0           | ✅ existing        |
| TEST-02             | 4 wizard tests + cascade pass green                                                                                   | unit        | `pnpm --filter intake-frontend test --run src/components/dossier/wizard/__tests__ src/components/dossier/wizard/hooks/__tests__` exits 0                          | ✅ existing        |
| TEST-02 (extension) | Full FE green                                                                                                         | unit        | `pnpm --filter intake-frontend test --run` exits 0                                                                                                                | ✅ existing        |
| TEST-02 (extension) | Full BE green                                                                                                         | unit        | `pnpm --filter intake-backend test --run` exits 0                                                                                                                 | ✅ existing        |
| TEST-03             | `50-TEST-AUDIT.md` lists every failing test at phase start with disposition                                           | doc         | File present; row count matches FE+BE failures at phase start (≥218 FE + ≥208 BE rows or post-dedup explanation); summary table present; cross-check totals match | ❌ Wave 0          |
| TEST-04             | `frontend/docs/test-setup.md` documents contract; `backend/docs/test-setup.md` pointer + BE-specific recipes          | doc         | `grep -c "vi.importActual\|initReactI18next\|integration runner" frontend/docs/test-setup.md` ≥5; `backend/docs/test-setup.md` present                            | ❌ Wave 0          |
| Gate (D-13)         | `Tests (frontend)` + `Tests (backend)` registered as required contexts on `main`                                      | CI / gh api | `gh api repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection \| jq -r '.required_status_checks.contexts[]' \| grep -c 'Tests'` returns 2             | gh access required |
| Gate (D-15)         | ESLint rule `vi-mock-exports-required` flags a known-bad fixture; passes on canonical `setup.ts`                      | lint        | `pnpm lint frontend/tests/setup.ts` exits 0; `pnpm lint` on bad fixture (committed under `tools/eslint-fixtures/`) exits ≠0                                       | ❌ Wave 0          |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `.planning/phases/50-test-infrastructure-repair/50-TEST-AUDIT.md` — covers TEST-03 (Plan 50-04)
- [ ] `frontend/docs/test-setup.md` — covers TEST-04 (Plan 50-04)
- [ ] `backend/docs/test-setup.md` — covers TEST-04 (Plan 50-04)
- [ ] `backend/vitest.integration.config.ts` (or vitest projects entry) — supports D-03 integration runner (Plan 50-03)
- [ ] Lint rule entries in `eslint.config.mjs` (Option 1) OR `tools/eslint-plugin-intl-dossier/` (Option 2 fallback) — D-15 (Plan 50-05)
- [ ] New workflow jobs in `.github/workflows/ci.yml` (`Tests (frontend)` + `Tests (backend)`, advisory `Tests (integration)`) — D-13 (Plan 50-05)
- [ ] `tools/eslint-fixtures/bad-vi-mock.ts` — committed bad fixture so D-15 rule has a regression target

---

## Manual-Only Verifications

| Behavior                                     | Requirement | Why Manual                                         | Test Instructions                                                                                                                                                                                        |
| -------------------------------------------- | ----------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Branch protection PATCH applied              | D-13        | Requires `gh auth` with admin scope; not a CI step | After Plan 50-05 lands, run `gh api -X PATCH repos/alzahrani-khalid/Intl-Dossier-V2.0/branches/main/protection ...` per Plan 50-05 instructions, then verify with the gh-api jq check in the table above |
| Audit artifact "Final phase-exit state" rows | TEST-03     | Captures exit codes + timestamps at phase close    | Re-run both `pnpm --filter ... test --run` commands at phase close, paste exit codes + ISO timestamps into `50-TEST-AUDIT.md` final section                                                              |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or are listed in Wave 0
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags in CI commands (`--run` used everywhere)
- [ ] Feedback latency < 90s per workspace
- [ ] `nyquist_compliant: true` set in frontmatter after plan-checker passes

**Approval:** pending
