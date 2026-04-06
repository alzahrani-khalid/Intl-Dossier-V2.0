---
phase: 9
slug: lifecycle-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------- |
| **Framework**          | Vitest 1.x                                                                         |
| **Config file**        | `vitest.config.ts` (root), `frontend/vitest.config.ts`, `backend/vitest.config.ts` |
| **Quick run command**  | `pnpm test -- --run`                                                               |
| **Full suite command** | `pnpm test`                                                                        |
| **Estimated runtime**  | ~30 seconds                                                                        |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run --run`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Test Type   | Automated Command                                                       | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ----------- | ----------------------------------------------------------------------- | ----------- | ---------- |
| 09-01-01 | 01   | 1    | LIFE-01     | integration | `pnpm vitest run tests/integration/lifecycle-stage.test.ts -x`          | ❌ W0       | ⬜ pending |
| 09-01-02 | 01   | 1    | LIFE-02     | unit        | `pnpm vitest run tests/unit/services/LifecycleTransition.test.ts -x`    | ❌ W0       | ⬜ pending |
| 09-01-03 | 01   | 1    | LIFE-03     | unit        | `pnpm vitest run tests/unit/services/LifecycleTransition.test.ts -x`    | ❌ W0       | ⬜ pending |
| 09-02-01 | 02   | 1    | LIFE-04     | integration | `pnpm vitest run tests/integration/intake-promotion.test.ts -x`         | ❌ W0       | ⬜ pending |
| 09-03-01 | 03   | 2    | LIFE-05     | unit        | `pnpm vitest run tests/unit/services/WorkItemLifecycleStage.test.ts -x` | ❌ W0       | ⬜ pending |
| 09-04-01 | 04   | 2    | LIFE-06     | integration | `pnpm vitest run tests/integration/forum-session-lifecycle.test.ts -x`  | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `tests/unit/services/LifecycleTransition.test.ts` — stubs for LIFE-02, LIFE-03 (transition logic)
- [ ] `tests/integration/lifecycle-stage.test.ts` — stubs for LIFE-01 (field exists, defaults work)
- [ ] `tests/integration/intake-promotion.test.ts` — stubs for LIFE-04 (promotion creates engagement at intake stage)
- [ ] `tests/unit/services/WorkItemLifecycleStage.test.ts` — stubs for LIFE-05 (optional field behavior)
- [ ] `tests/integration/forum-session-lifecycle.test.ts` — stubs for LIFE-06 (child engagement creation, independent lifecycle)
- [x] Framework install: None needed — Vitest already configured

---

## Manual-Only Verifications

| Behavior                  | Requirement | Why Manual                  | Test Instructions                                                                               |
| ------------------------- | ----------- | --------------------------- | ----------------------------------------------------------------------------------------------- |
| Stepper bar visual stages | LIFE-01     | Visual rendering/RTL layout | Open engagement detail, verify 6 stages render, correct stage highlighted, RTL layout correct   |
| Stage transition UX       | LIFE-02     | User interaction flow       | Click stage in stepper, verify transition dialog, confirm any-direction navigation              |
| Intake promotion dialog   | LIFE-04     | Multi-step UI flow          | Navigate to intake list, click promote, verify field pre-population, confirm engagement created |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
