---
phase: 70-digests-alerts
plan: 02
subsystem: database
tags: [supabase, rls, rpc, pg-notify, intelligence-digests, alerting]

requires:
  - phase: 69-signals
    provides: intelligence_event signal fields and clearance-gated read patterns
provides:
  - Phase 70 digests and alerts migration
  - Digest subscription, alert rule, digest item, and intelligence email queue tables
  - generate_digest, publish_digest, generate_digest_content, and read_digests RPCs
  - intelligence_event pg_notify alert trigger
affects: [supabase-migrations, intelligence-digests, intelligence-alerts]

key-files:
  created:
    - supabase/migrations/20260615_phase70_digests_alerts.sql

requirements-completed:
  - DIGEST-01
  - DIGEST-02
  - DIGEST-03
  - DIGEST-04
  - ALERT-01
  - ALERT-02
  - ALERT-03
  - ALERT-04

duration: 10 min
completed: 2026-06-15
---

# Phase 70 Plan 02: Database Migration Summary

**Created the Phase 70 Supabase migration for recurring intelligence digests, alert rules, on-demand digest RPCs, service-role cron content assembly, and the alert pg_notify trigger.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-06-15T09:20:00Z
- **Completed:** 2026-06-15T09:30:00Z
- **Tasks:** 1 completed
- **Files modified:** 1

## Accomplishments

- Extended `intelligence_digest` with `subscriber_id`, `frequency`, `published_at`, `clearance_level_at_generation`, `period`, and the named duplicate-cron unique constraint.
- Added `intelligence_digest_subscriptions` with owner-scoped RLS and the exact seven database dossier types.
- Added `intelligence_alert_rules` with owner-scoped RLS and `last_fired_at` for per-rule coalescing.
- Added `intelligence_digest_items` for structured digest snapshots.
- Added isolated `intelligence_email_queue` for Phase 70 SMTP delivery work.
- Added the four required RPCs:
  - `generate_digest` for caller-JWT preview.
  - `publish_digest` for HITL commit.
  - `generate_digest_content` for service-role cron generation with explicit `p_clearance_level`.
  - `read_digests` for subscriber-visible published digests.
- Added `notify_intelligence_alert()` and the `intelligence_event_alert_notify` trigger with payload limited to IDs, sensitivity, severity, and occurrence time.

## Task Commits

1. **Task 1: Write P70 database migration SQL** - `6093edb7` (feat)

## Verification

- `grep` key identifier count: `61` (required identifiers present).
- `grep -c "SECURITY INVOKER"`: `6` (required >= 4).
- `grep -c "SECURITY DEFINER"`: `1` (only `notify_intelligence_alert`).
- `grep -c "FROM profiles WHERE id"`: `0`.
- `grep -c "NEW.title\|NEW.content"`: `0`.
- `grep -c "elected_official"`: `0`.
- `supabase db lint --local` could not run because local Postgres on `127.0.0.1:54322` was not running.
- Applied the migration successfully in a temporary Postgres 17 cluster with Supabase-style roles, `auth.uid()`, tenant-isolation stubs, and the relevant Phase 69/70 table stubs.

## Deviations from Plan

### Deliberate Security Corrections

**1. Added a narrow authenticated INSERT policy for the HITL publish path**

- **Reason:** The plan required `publish_digest` to be `SECURITY INVOKER` and insert into `intelligence_digest`, while also saying there should be no authenticated insert policy. An invoker RPC cannot bypass RLS, so that combination would make the required publish RPC fail.
- **Fix:** Added `intelligence_digest_insert_publisher`, limited to `subscriber_id = auth.uid()`, `generated_by = auth.uid()`, `published_at IS NOT NULL`, tenant insert policy, and `clearance_level_at_generation <= caller clearance`.

**2. Enabled parent-based RLS on `intelligence_digest_items`**

- **Reason:** The plan text said the digest-item FK gates access, but PostgreSQL foreign keys do not restrict direct reads. Granting authenticated SELECT without RLS would expose item snapshots across subscribers.
- **Fix:** Enabled RLS and added `intelligence_digest_items_select_parent`, which requires a visible published parent digest for the caller.

**3. Derived manual publish `organization_id` from `profiles.organization_id`**

- **Reason:** The local `dossiers` table has no `organization_id` column. Using `SELECT organization_id FROM dossiers` would not apply.
- **Fix:** `publish_digest` reads `profiles.organization_id` for the authenticated user and keeps dossier access constrained by dossier sensitivity.

## Self-Check: PASSED
