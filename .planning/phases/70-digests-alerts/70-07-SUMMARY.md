---
phase: 70-digests-alerts
plan: 07
subsystem: intelligence-digests-alerts-integration
tags: [backend, frontend, bullmq, supabase, hitl, alerts, uat, debug-fix]

requires:
  - phase: 70-digests-alerts
    plan: 04
    provides: channel adapters and delivery contracts
  - phase: 70-digests-alerts
    plan: 05
    provides: digest subscriptions, generate_digest/publish_digest RPCs, alert-rule table/API
  - phase: 70-digests-alerts
    plan: 06
    provides: Digests/Alerts hub tabs, digest/alert hooks and surfaces
provides:
  - GenerateDigestButton HITL (generate -> preview -> confirm/discard -> publish)
  - per-dossier-type digests route entry points (8 types + engagement)
  - mounted intelligence digest/alert API routes + alert listener startup
  - working live alert fan-out (in_app + smtp queue), clearance + D-08 + D-10 enforced
affects: [backend, frontend, intelligence-digests, intelligence-alerts, notifications]

key-files:
  created:
    - frontend/src/components/intelligence/GenerateDigestButton.tsx
    - frontend/src/routes/_protected/dossiers/countries/$id/digests.tsx
    - frontend/src/routes/_protected/dossiers/organizations/$id/digests.tsx
    - frontend/src/routes/_protected/dossiers/forums/$id/digests.tsx
    - frontend/src/routes/_protected/dossiers/topics/$id/digests.tsx
    - frontend/src/routes/_protected/dossiers/persons/$id/digests.tsx
    - frontend/src/routes/_protected/dossiers/working_groups/$id/digests.tsx
    - frontend/src/routes/_protected/dossiers/elected-officials/$id/digests.tsx
    - frontend/src/routes/_protected/engagements/$engagementId/digests.tsx
    - supabase/migrations/20260616_phase70_notification_type_intelligence_values.sql
    - supabase/migrations/20260616_phase70_fix_create_categorized_notification_enum_casts.sql
    - .planning/debug/p70-alert-fanout.resolved.md
  modified:
    - backend/src/api/intelligence.ts
    - backend/src/index.ts
    - backend/src/queues/intelligence-alert.worker.ts
    - backend/src/queues/notification.processor.ts
    - backend/src/adapters/intelligence/smtp-adapter.ts
    - backend/tests/intelligence/channel-adapter.test.ts
    - e2e/intelligence-digests.spec.ts
    - frontend/src/components/intelligence/DigestCard.tsx
    - frontend/src/components/intelligence/DigestsTab.tsx

requirements-completed:
  - DIGEST-02
  - DIGEST-04
  - ALERT-02
  - ALERT-04

duration: end-to-end wiring + live UAT + debug remediation
completed: 2026-06-16
---

# Phase 70 Plan 07: End-to-End Wiring + Live UAT Summary

**Wired the intelligence digest/alert system end to end (HITL generate button, per-dossier
digest routes, backend route + alert-listener startup), then closed the plan's blocking live
UAT checkpoint — which required a debug remediation of a broken alert fan-out before all five
UATs passed live.**

## Task 1 — Wiring (commit `5a320ad1`)

- `GenerateDigestButton.tsx` — D-14 HITL: generate → "PREVIEW — NOT PUBLISHED" card → confirm/discard → `publish_digest` RPC.
- Per-dossier-type `…/$id/digests.tsx` routes for all 8 dossier types + engagement.
- `backend/src/api/intelligence.ts` mounted digest/alert routes; `backend/src/index.ts` calls `startAlertListener()`.
- `DigestCard`/`DigestsTab` integrate the generate affordance; `e2e/intelligence-digests.spec.ts` extended.

## Task 2 — Blocking live UAT (staging `zkrcjzdemdmwhearhfgg`, seed → observe → restore, EN + AR)

Initial run: **UAT-1/3/4/5 PASS, UAT-2 FAIL.** Live UAT surfaced that the alert fan-out was completely dead (mocked unit/integration tests had passed and missed it). Root-caused and fixed via debug session `p70-alert-fanout` (see `.planning/debug/p70-alert-fanout.resolved.md`).

### UAT results (final — all live)

| UAT                                                | Result           | Evidence                                                                                                                                                                   |
| -------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UAT-1 clearance differentiation (DIGEST-02 / SC#4) | PASS             | `generate_digest_content` clr 1/2/3 → 1/2/3 signals; clearance-2 excludes the sensitivity-3 signal (cron per-subscriber mechanism).                                        |
| UAT-2 alert fan-out (ALERT-02/03 / SC#2)           | PASS (after fix) | Seeded signal → `notifications` row (in_app, `type=intelligence_alert`) + `intelligence_email_queue` row (smtp) + **no** v4.0 `email_queue` row + `last_fired_at` stamped. |
| UAT-3 webhook D-10 contract (ALERT-04 / SC#3)      | PASS / N/A live  | `webhook-payload-contract` unit test green; adapter body = `{text: genericLabel, potentialAction:[deep-link]}`; no staging webhook URL (customer-TBD).                     |
| UAT-4 generate_digest HITL (DIGEST-04 / SC#5)      | PASS             | Live browser as kazahrani: generate → preview → publish; `intelligence_digest.published_at` NOT NULL; DigestCard renders EN + AR (Tajawal/RTL, Arabic-Indic digits).       |
| UAT-5 indistinguishable-empty (D-09)               | PASS             | CDP `Network.setBlockedURLs` on `read_digests` → generic `role="alert"`; no "clearance"/"filtered" in page.                                                                |

### Debug remediation (5 defects)

1. **`46066f55`** — BullMQ rejected colon job IDs (`alert:${event}:${rule}:check`) → every alert enqueue threw "Custom Id cannot contain :" → zero dispatch. Replaced `:` with `-` (UUIDs keep the D-07 dedup key unique).
2. **`aec2e3e1`** — in_app channel leaked a v4.0 `email_queue` row (D-08). `notification.processor` now skips the `email_queue` block for intelligence notification types (push block untouched).
3. **`999f9e32`** — regression test guarding alert job IDs against `:`.
4. **`cac5bc89`** — SMTP adapter now enqueues to `intelligence_email_queue` (RF-1 on-prem, egress-free) instead of direct nodemailer send; added `notification_type` enum values `intelligence_alert`/`intelligence_digest`; cast `p_type`/`p_priority` to their enums in `create_categorized_notification` (text→enum INSERT was blocking in_app). Channel-adapter tests rewritten for the queued SMTP path.

## Verification

- `pnpm --filter intake-backend exec vitest run tests/intelligence/` → 7 files, **26 tests PASS**.
- `pnpm --filter intake-backend type-check` → exit `0`.
- Backend build (pre-commit hook) → PASS.
- Live UAT-2 fan-out confirmed on staging (rows above); staging seed data restored (0 residual rows/rules).
- `ecc:typescript-reviewer` (debug session) → LOOKS_GOOD (3 LOW, non-blocking).

## Deviations from Plan

- **`intelligence_email_queue` design (user decision A):** realized the SMTP channel as a queue writer (research RF-1) rather than direct nodemailer send. The on-prem **SMTP drain/send worker** (drains `intelligence_email_queue` when `SMTP_HOST` is configured) is a **follow-up** — the queue row is the in-system delivery; actual relay send needs customer SMTP infra.
- **`notification_type` enum (user decision A):** added `intelligence_alert`/`intelligence_digest` (irreversible enum ADD VALUE) so the in_app channel can persist.
- **`create_categorized_notification`** (shared v4.0 RPC) was missing enum casts for `type`/`priority` — a latent bug exposed once the enum values existed; fixed with schema-qualified casts (improves the v4.0 path too).
- **smtp + webhook live delivery** not exercisable on staging (`SMTP_HOST` / `INTELLIGENCE_WEBHOOK_URL` unset, customer-TBD); covered by the queue row (smtp) and the unit contract test (webhook).
- `dossier_type` domain remains 7 values in `intelligence_alert_rules` CHECK (no `elected_official`); digest routes include all 8 types.

## Self-Check: PASSED
