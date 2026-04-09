---
phase: 22
slug: e2e-test-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 22 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Framework**          | Playwright + Vitest                                                                                                      |
| **Config file**        | `tests/playwright.config.ts`                                                                                             |
| **Quick run command**  | `pnpm exec playwright test tests/e2e/05-notifications.spec.ts tests/e2e/10-operations-hub.spec.ts --project=chromium-en` |
| **Full suite command** | `pnpm exec playwright test --project=chromium-en --project=chromium-ar-smoke`                                            |
| **Estimated runtime**  | ~30 seconds (2 specs)                                                                                                    |

---

## Sampling Rate

- **After every task commit:** Run quick run command (2 target specs)
- **After every plan wave:** Run full suite command
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Threat Ref | Secure Behavior                | Test Type | Automated Command                                               | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ---------- | ------------------------------ | --------- | --------------------------------------------------------------- | ----------- | ---------- |
| 22-01-01 | 01   | 1    | TEST-05     | T-22-01    | test-trigger gated to non-prod | e2e       | `pnpm exec playwright test tests/e2e/05-notifications.spec.ts`  | ✅          | ⬜ pending |
| 22-01-02 | 01   | 1    | TEST-10     | —          | N/A                            | e2e       | `pnpm exec playwright test tests/e2e/10-operations-hub.spec.ts` | ✅          | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

_Existing infrastructure covers all phase requirements — Playwright is already installed and configured._

---

## Manual-Only Verifications

| Behavior                          | Requirement | Why Manual                        | Test Instructions                                 |
| --------------------------------- | ----------- | --------------------------------- | ------------------------------------------------- |
| Notification toast appears in ~5s | TEST-05     | Timing-sensitive, may flaky in CI | Trigger test notification, visually confirm toast |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
