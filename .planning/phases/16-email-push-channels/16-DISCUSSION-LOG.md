# Phase 16: Email & Push Channels - Discussion Log (Assumptions Mode)

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the analysis.

**Date:** 2026-04-06
**Phase:** 16-email-push-channels
**Mode:** assumptions
**Areas analyzed:** Email Sending Infrastructure, Digest Scheduling, Browser Push Notifications, Soft-Ask Opt-In Pattern

## Assumptions Presented

### Email Sending Infrastructure

| Assumption                                                                                   | Confidence | Evidence                                                                          |
| -------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------- |
| Extend BullMQ processor to insert into email_queue, let Edge Function handle Resend delivery | Likely     | supabase/functions/email-send/index.ts (ResendProvider), migration 20260110700001 |

### Digest Scheduling

| Assumption                                                                                      | Confidence | Evidence                                                           |
| ----------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------ |
| Use BullMQ repeatable jobs following deadline-scheduler pattern, call get_user_digest_content() | Confident  | backend/src/queues/deadline-scheduler.ts, migration 20260115200001 |

### Browser Push Notifications

| Assumption                                                                       | Confidence | Evidence                                                                                    |
| -------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------- |
| Use Web Push API (VAPID) with web-push npm package, new push_subscriptions table | Likely     | No existing service worker or web-push dependency; push_device_tokens designed for FCM/APNS |

### Soft-Ask Opt-In Pattern

| Assumption                                                                                        | Confidence | Evidence                                                                                                         |
| ------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| Contextual inline banner after first actionable notification, dismissal state in user_preferences | Likely     | Success criteria requires soft-ask; NotificationsSettingsSection has push toggle; no existing soft-ask component |

## Corrections Made

No corrections — all assumptions confirmed.

## External Research Needed

- Resend domain verification: SPF/DKIM/DMARC DNS record format for production sending
- Web Push API: Current Chrome/Firefox support status and permission UX
- `web-push` npm package: Latest stable version for Node.js 20
