---
phase: 28
slug: simple-type-wizards
status: draft
nyquist_compliant: false
wave_0_complete: false
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

| Task ID  | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command                      | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ---------- | --------------- | --------- | -------------------------------------- | ----------- | ---------- |
| 28-01-01 | 01   | 1    | ORG-01      | —          | N/A             | unit      | `pnpm --filter frontend test -- --run` | ❌ W0       | ⬜ pending |
| 28-01-02 | 01   | 1    | TOPC-01     | —          | N/A             | unit      | `pnpm --filter frontend test -- --run` | ❌ W0       | ⬜ pending |
| 28-01-03 | 01   | 1    | PRSN-01     | —          | N/A             | unit      | `pnpm --filter frontend test -- --run` | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] Test stubs for wizard config validation (organization, topic, person)
- [ ] Test stubs for wizard step rendering (each type-specific step)
- [ ] Shared test fixtures for wizard infrastructure reuse

_If none: "Existing infrastructure covers all phase requirements."_

---

## Manual-Only Verifications

| Behavior           | Requirement              | Why Manual                               | Test Instructions                                          |
| ------------------ | ------------------------ | ---------------------------------------- | ---------------------------------------------------------- |
| Wizard visual flow | ORG-01, TOPC-01, PRSN-01 | Visual step transitions require browser  | Navigate to each list page, click Create, verify step flow |
| RTL layout         | All                      | RTL rendering requires visual inspection | Switch to Arabic, verify wizard layout mirrors correctly   |
| Form validation UX | ORG-02, TOPC-02, PRSN-02 | Error display behavior is visual         | Submit empty forms, verify inline error messages appear    |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
