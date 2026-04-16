---
phase: 28
slug: simple-type-wizards
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-16
---

# Phase 28 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                             |
| ---------------------- | ------------------------------------------------- |
| **Framework**          | vitest                                            |
| **Config file**        | frontend/vitest.config.ts                         |
| **Quick run command**  | `pnpm --filter frontend test -- --run`            |
| **Full suite command** | `pnpm --filter frontend test -- --run --coverage` |
| **Estimated runtime**  | ~30 seconds                                       |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter frontend test -- --run`
- **After every plan wave:** Run `pnpm --filter frontend test -- --run --coverage`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

All plan tasks use `cd frontend && npx tsc --noEmit` as their automated verification gate. This is a real command (not MISSING), so no Wave 0 test stubs are required.

| Task ID  | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command                 | File Exists | Status  |
| -------- | ---- | ---- | ----------- | ---------- | --------------- | --------- | --------------------------------- | ----------- | ------- |
| 28-01-01 | 01   | 1    | ORG-02      | --         | N/A             | typecheck | `cd frontend && npx tsc --noEmit` | N/A         | pending |
| 28-01-02 | 01   | 1    | TOPC-02     | --         | N/A             | typecheck | `cd frontend && npx tsc --noEmit` | N/A         | pending |
| 28-02-01 | 02   | 2    | ORG-01      | T-28-02    | Auth required   | typecheck | `cd frontend && npx tsc --noEmit` | N/A         | pending |
| 28-02-02 | 02   | 2    | ORG-03      | --         | N/A             | typecheck | `cd frontend && npx tsc --noEmit` | N/A         | pending |
| 28-03-01 | 03   | 2    | TOPC-01     | T-28-05    | Auth required   | typecheck | `cd frontend && npx tsc --noEmit` | N/A         | pending |
| 28-03-02 | 03   | 2    | TOPC-03     | --         | N/A             | typecheck | `cd frontend && npx tsc --noEmit` | N/A         | pending |
| 28-04-01 | 04   | 2    | PRSN-01     | T-28-07    | Auth required   | typecheck | `cd frontend && npx tsc --noEmit` | N/A         | pending |
| 28-04-02 | 04   | 2    | PRSN-03     | --         | N/A             | typecheck | `cd frontend && npx tsc --noEmit` | N/A         | pending |

_Status: pending / green / red / flaky_

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. All tasks use `tsc --noEmit` as their automated gate -- this is a real compilation check, not a placeholder. No Wave 0 test stubs needed.

---

## Manual-Only Verifications

| Behavior           | Requirement              | Why Manual                               | Test Instructions                                          |
| ------------------ | ------------------------ | ---------------------------------------- | ---------------------------------------------------------- |
| Wizard visual flow | ORG-01, TOPC-01, PRSN-01 | Visual step transitions require browser  | Navigate to each list page, click Create, verify step flow |
| RTL layout         | All                      | RTL rendering requires visual inspection | Switch to Arabic, verify wizard layout mirrors correctly   |
| Form validation UX | ORG-02, TOPC-02, PRSN-02 | Error display behavior is visual         | Submit empty forms, verify inline error messages appear    |
| Photo file upload  | PRSN-02                  | File picker interaction is visual        | In Person wizard, pick a file, verify thumbnail preview    |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify (tsc --noEmit)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (none needed -- tsc is the gate)
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready
