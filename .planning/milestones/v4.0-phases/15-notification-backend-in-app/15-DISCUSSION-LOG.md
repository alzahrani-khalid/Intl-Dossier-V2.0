# Phase 15: Notification Backend & In-App - Discussion Log (Assumptions Mode)

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the analysis.

**Date:** 2026-04-06
**Phase:** 15-notification-backend-in-app
**Mode:** assumptions
**Areas analyzed:** Database Schema, Frontend Notification UI, Async Notification Dispatch, Notification Trigger Points

## Assumptions Presented

### Database Schema

| Assumption                                                           | Confidence | Evidence                                                                                                |
| -------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| Existing notification schema is sufficient — no new migration needed | Confident  | `supabase/migrations/20251011214946_create_notifications.sql`, `20260111100001_notification_center.sql` |

### Frontend Notification UI

| Assumption                                                                                                                          | Confidence | Evidence                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------- |
| Bell icon, panel, badge, category tabs, mark-as-read, Realtime subscription already exist — focus on integration testing and polish | Confident  | `NotificationPanel.tsx`, `useNotificationCenter.ts`, `Header.tsx` line 72 |

### Async Notification Dispatch

| Assumption                                                                                      | Confidence | Evidence                                                                                                |
| ----------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| Add BullMQ as new dependency, reuse existing ioredis (v5.10.1), run worker in-process initially | Likely     | Zero BullMQ references in source, `backend/src/config/redis.ts`, `backend/package.json` ioredis ^5.10.1 |

### Notification Trigger Points

| Assumption                                                                                                                         | Confidence | Evidence                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| Wire triggers inside backend service methods, dispatch to BullMQ after successful DB writes, add scheduled job for deadline checks | Likely     | `tasks.service.ts` has no notification calls, `notification.service.ts` only called from `after-action.ts` |

## Corrections Made

No corrections — all assumptions confirmed.

## External Research

- BullMQ + ioredis compatibility: Verified ioredis ^5.10.1 is compatible with BullMQ v5 (requires ioredis >= 5.0). No issue found.
