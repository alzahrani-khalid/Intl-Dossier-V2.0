---
phase: 3
slug: security-hardening
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                       |
| ---------------------- | ------------------------------------------- |
| **Framework**          | vitest (unit/integration), playwright (E2E) |
| **Config file**        | `vitest.config.ts`, `playwright.config.ts`  |
| **Quick run command**  | `pnpm test -- --run`                        |
| **Full suite command** | `pnpm test && pnpm lint && pnpm typecheck`  |
| **Estimated runtime**  | ~30 seconds                                 |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test -- --run`
- **After every plan wave:** Run `pnpm test && pnpm lint && pnpm typecheck`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Test Type   | Automated Command                                            | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ----------- | ------------------------------------------------------------ | ----------- | ---------- |
| 03-01-01 | 01   | 1    | SEC-01      | integration | `pnpm test -- --run tests/security/rls-policies.test.ts`     | ❌ W0       | ⬜ pending |
| 03-01-02 | 01   | 1    | SEC-01      | integration | `pnpm test -- --run tests/security/rls-policies.test.ts`     | ❌ W0       | ⬜ pending |
| 03-02-01 | 02   | 1    | SEC-02      | integration | `pnpm test -- --run tests/security/rbac-middleware.test.ts`  | ❌ W0       | ⬜ pending |
| 03-02-02 | 02   | 1    | SEC-03      | unit        | `pnpm test -- --run tests/security/clearance-levels.test.ts` | ❌ W0       | ⬜ pending |
| 03-03-01 | 03   | 2    | SEC-04      | unit        | `pnpm test -- --run tests/security/input-validation.test.ts` | ❌ W0       | ⬜ pending |
| 03-03-02 | 03   | 2    | SEC-05      | integration | `pnpm test -- --run tests/security/csp-headers.test.ts`      | ❌ W0       | ⬜ pending |
| 03-03-03 | 03   | 2    | SEC-06      | integration | `pnpm test -- --run tests/security/org-isolation.test.ts`    | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `tests/security/rls-policies.test.ts` — stubs for SEC-01 (RLS policy verification)
- [ ] `tests/security/rbac-middleware.test.ts` — stubs for SEC-02 (role-based access control)
- [ ] `tests/security/clearance-levels.test.ts` — stubs for SEC-03 (clearance enforcement)
- [ ] `tests/security/input-validation.test.ts` — stubs for SEC-04 (input validation)
- [ ] `tests/security/csp-headers.test.ts` — stubs for SEC-05 (CSP/Helmet headers)
- [ ] `tests/security/org-isolation.test.ts` — stubs for SEC-06 (cross-org data isolation)
- [ ] `tests/security/fixtures.ts` — shared test fixtures (mock users with different roles/orgs)

---

## Manual-Only Verifications

| Behavior                                | Requirement | Why Manual                                      | Test Instructions                                 |
| --------------------------------------- | ----------- | ----------------------------------------------- | ------------------------------------------------- |
| RLS policy audit via Supabase dashboard | SEC-01      | Requires DB admin access to verify all tables   | Query `pg_policies` view for complete coverage    |
| CSP header browser behavior             | SEC-05      | Browser-specific rendering of blocked resources | Open DevTools Network tab, verify blocked origins |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
