---
phase: 16
slug: email-push-channels
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-06
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                   |
| ---------------------- | ------------------------------------------------------- |
| **Framework**          | vitest                                                  |
| **Config file**        | `frontend/vitest.config.ts`, `backend/vitest.config.ts` |
| **Quick run command**  | `pnpm test --filter=backend -- --run`                   |
| **Full suite command** | `pnpm test --run`                                       |
| **Estimated runtime**  | ~30 seconds                                             |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test --filter=backend -- --run`
- **After every plan wave:** Run `pnpm test --run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Threat Ref | Secure Behavior                                      | Test Type   | Automated Command                                    | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ---------- | ---------------------------------------------------- | ----------- | ---------------------------------------------------- | ----------- | ---------- |
| 16-01-01 | 01   | 1    | NOTIF-03    | —          | Email sent via Resend for critical notifications     | integration | `pnpm test --filter=backend -- --run -t "email"`     | ❌ W0       | ⬜ pending |
| 16-01-02 | 01   | 1    | NOTIF-04    | —          | Bilingual email templates render correctly (AR/EN)   | unit        | `pnpm test --filter=backend -- --run -t "template"`  | ❌ W0       | ⬜ pending |
| 16-02-01 | 02   | 1    | NOTIF-05    | —          | Digest aggregates pending items per user preferences | integration | `pnpm test --filter=backend -- --run -t "digest"`    | ❌ W0       | ⬜ pending |
| 16-03-01 | 03   | 2    | NOTIF-09    | —          | Push subscription stored and notification delivered  | integration | `pnpm test --filter=backend -- --run -t "push"`      | ❌ W0       | ⬜ pending |
| 16-03-02 | 03   | 2    | NOTIF-09    | —          | Soft-ask prompt shown contextually, not on cold load | unit        | `pnpm test --filter=frontend -- --run -t "soft-ask"` | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `backend/src/__tests__/email-notifications.test.ts` — stubs for NOTIF-03, NOTIF-04
- [ ] `backend/src/__tests__/digest-scheduler.test.ts` — stubs for NOTIF-05
- [ ] `backend/src/__tests__/push-notifications.test.ts` — stubs for NOTIF-09
- [ ] `frontend/src/__tests__/PushOptInBanner.test.tsx` — stubs for NOTIF-09 soft-ask UI

---

## Manual-Only Verifications

| Behavior                                               | Requirement | Why Manual                                 | Test Instructions                                                                                                 |
| ------------------------------------------------------ | ----------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Browser push notification appears when app not focused | NOTIF-09    | Requires real browser with Service Worker  | 1. Enable push in Chrome 2. Navigate away from app 3. Trigger urgent notification 4. Verify OS-level push appears |
| Email arrives in inbox (not spam)                      | NOTIF-03    | Requires real Resend delivery + mailbox    | 1. Trigger critical notification 2. Check inbox within 60s 3. Verify bilingual content renders                    |
| Digest email summary accuracy                          | NOTIF-05    | Requires seeded data + real email delivery | 1. Seed 5+ pending items 2. Trigger digest 3. Verify all items listed                                             |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
