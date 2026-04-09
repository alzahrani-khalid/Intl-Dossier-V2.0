---
phase: 15
slug: notification-backend-in-app
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-06
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                   |
| ---------------------- | ------------------------------------------------------- |
| **Framework**          | vitest (frontend), vitest (backend)                     |
| **Config file**        | `frontend/vitest.config.ts`, `backend/vitest.config.ts` |
| **Quick run command**  | `pnpm test --filter=backend -- --run`                   |
| **Full suite command** | `pnpm test`                                             |
| **Estimated runtime**  | ~30 seconds                                             |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test --filter=backend -- --run`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status     |
| ------- | ---- | ---- | ----------- | ---------- | --------------- | --------- | ----------------- | ----------- | ---------- |
| TBD     | TBD  | TBD  | NOTIF-01    | —          | N/A             | unit      | TBD               | ❌ W0       | ⬜ pending |
| TBD     | TBD  | TBD  | NOTIF-02    | —          | N/A             | unit      | TBD               | ❌ W0       | ⬜ pending |
| TBD     | TBD  | TBD  | NOTIF-06    | —          | N/A             | unit      | TBD               | ❌ W0       | ⬜ pending |
| TBD     | TBD  | TBD  | NOTIF-07    | —          | N/A             | unit      | TBD               | ❌ W0       | ⬜ pending |
| TBD     | TBD  | TBD  | NOTIF-08    | —          | N/A             | unit      | TBD               | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] Notification service unit test stubs for NOTIF-01 through NOTIF-08
- [ ] BullMQ worker test fixtures
- [ ] Supabase Realtime subscription test helpers

_Existing vitest infrastructure covers framework needs._

---

## Manual-Only Verifications

| Behavior                                   | Requirement | Why Manual                              | Test Instructions                                                 |
| ------------------------------------------ | ----------- | --------------------------------------- | ----------------------------------------------------------------- |
| Bell icon badge count updates in real-time | NOTIF-01    | Requires visual + Realtime subscription | Open app in 2 tabs, trigger notification, verify count increments |
| Notification panel slide animation         | NOTIF-02    | Visual/interaction quality              | Click bell, verify panel opens with smooth animation              |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
