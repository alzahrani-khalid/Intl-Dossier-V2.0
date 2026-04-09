---
phase: 21
slug: digest-scheduler-wiring
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-09
---

# Phase 21 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                             |
| ---------------------- | --------------------------------- |
| **Framework**          | Vitest                            |
| **Config file**        | `backend/vitest.config.ts`        |
| **Quick run command**  | `pnpm --filter backend typecheck` |
| **Full suite command** | `pnpm test`                       |
| **Estimated runtime**  | ~10 seconds                       |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter backend typecheck`
- **After every plan wave:** Backend startup in dev mode — check logs for "Digest schedulers registered"
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type   | Automated Command                 | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ---------- | --------------- | ----------- | --------------------------------- | ----------- | ---------- |
| 21-01-01 | 01   | 1    | NOTIF-04    | —          | N/A             | integration | `pnpm --filter backend typecheck` | N/A         | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test files needed — this is a 2-line wiring fix verified by typecheck and startup logs.

---

## Manual-Only Verifications

| Behavior                              | Requirement | Why Manual                                                     | Test Instructions                                            |
| ------------------------------------- | ----------- | -------------------------------------------------------------- | ------------------------------------------------------------ |
| Digest scheduler registers on startup | NOTIF-04    | Startup wiring not unit-testable without mocking entire BullMQ | Start backend, check logs for "Digest schedulers registered" |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
