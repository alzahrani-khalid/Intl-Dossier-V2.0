---
phase: 88
slug: security-hygiene-tail
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-13
---

# Phase 88 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (frontend + backend units), Playwright (E2E login smoke) |
| **Config file** | `frontend/vitest.config.ts`, `backend/vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `pnpm --filter frontend test -- UserPicker && pnpm --filter backend test -- validation` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~90 seconds (units); login smoke adds ~30s |

---

## Sampling Rate

- **After every task commit:** Run the quick run command for the touched package
- **After every plan wave:** Run `pnpm test` for the touched package
- **Before `/gsd:verify-work`:** Full suite green + login smoke green
- **Max feedback latency:** ~90 seconds

---

## Per-Task Verification Map

> Filled by planner from RESEARCH.md §Validation Architecture. Each SEC/hygiene
> item maps to a Wave-0 test asserting the injection/getter behavior.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 88-01-* | 01 | 0/1 | SEC-01 | T-79-S2 / IN-04 | Search input `a,b(c).d` is quoted, does not expand the PostgREST filter tree | unit | `pnpm --filter frontend test -- UserPicker` | ❌ W0 | ⬜ pending |
| 88-02-* | 02 | 0/1 | SEC-02 | — | No live secret value in tracked files; login authenticates from `.env.test` var | grep + smoke | `git grep -F "<rotated-value>" \| wc -l == 0`; login smoke exits 0 | ❌ W0 | ⬜ pending |
| 88-03-* | 03 | 0/1 | (hygiene) | — | `validate({query})` route returns 200, not 500; `req.query` holds coerced value | unit | `pnpm --filter backend test -- validation` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `frontend/src/components/forms/__tests__/UserPicker.test.tsx` — asserts reserved-char search input is quoted/escaped, filter tree unchanged (SEC-01)
- [ ] `backend/src/utils/__tests__/validation.test.ts` — asserts `validate({ query })` middleware coerces `req.query` without throwing on Express 5 getter (hygiene)
- [ ] Login smoke (Playwright existing global-setup) — proves credential externalization did not break auth (SEC-02)

*Secret-value absence (SEC-02) is a grep assertion, not a framework test.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| GH Actions secret holds the rotated test password | SEC-02 | Repo cannot read GH secret contents | Operator checkpoint: confirm/rotate the `TEST_USER_PASSWORD` GitHub Actions secret to the new value before merge |

*All other phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
