---
status: resolved
trigger: 'Daily/Weekly digest scheduled jobs fail on startup with "failed to query users" (walkthrough issue #10, deferred from PR #39)'
created: 2026-06-01T00:00:00Z
updated: 2026-06-01T00:00:00Z
resolved: 2026-06-01T00:00:00Z
fix_commit: efc3a38f
---

## Closure (2026-06-01)

Fix APPLIED in commit `efc3a38f` on branch `fix/notification-walkthrough-10-11`
(quick task `260601-gd5`). `backend/src/queues/digest-scheduler.ts`:
`.eq('digest_frequency', 'daily')` → `.eq('daily_digest_enabled', true)` (line 84)
and `.eq('digest_frequency', 'weekly')` → `.eq('weekly_digest_enabled', true)`
(line 200). No migration. Backend `type-check` passes clean; corrected REST
query confirmed HTTP 200 against the live DB during investigation.

## Current Focus

hypothesis: CONFIRMED — the digest query filters on a non-existent column `email_notification_preferences.digest_frequency`; PostgREST returns 42703 ("column does not exist"), which the scheduler swallows and re-labels as "failed to query users".
test: Reproduced the exact REST query against the live DB (project zkrcjzdemdmwhearhfgg) with the service-role key.
expecting: HTTP 400 / code 42703.
next_action: route the fix through /gsd:quick (do NOT edit in this debug session).

## Symptoms

expected: The daily and weekly digest scheduled jobs start and run, enumerating users to send digest notifications.
actual: The digest jobs fail with an error "failed to query users".
errors: "failed to query users" emitted by the digest scheduled jobs.
reproduction: Run the daily or weekly digest scheduler tick (`processDailyDigests` / `processWeeklyDigests`); the user query errors out before any user is processed.
started: Observed during the manual app walkthrough; deliberately left out of PR #39 (post-walkthrough fixes).

## Suspected Causes (to confirm/eliminate)

- ~~Wrong table (`public.users` vs `auth.users`) / permission~~ → ELIMINATED. The job does not query a users table at all for enumeration; it queries `email_notification_preferences`. The client correctly uses `SUPABASE_SERVICE_ROLE_KEY`.
- ~~Anon vs service-role client / RLS~~ → ELIMINATED. Service-role bypasses RLS, and the correct query (`daily_digest_enabled=eq.true`) returns HTTP 200.
- CONFIRMED: Schema/column mismatch — the query filters on `digest_frequency`, a column that exists on NO table in this schema (the digest prefs table uses boolean `daily_digest_enabled` / `weekly_digest_enabled` instead).
- ~~Missing service-role env at startup~~ → ELIMINATED. The error is a column error (42703), not auth (401/permission denied).

## Context

- Supabase project: zkrcjzdemdmwhearhfgg (staging doubles as prod backend).
- Backend is Express + TypeScript. Digest scheduler: `backend/src/queues/digest-scheduler.ts` (BullMQ repeatable jobs, registered from `backend/src/index.ts:143`, dispatched via `backend/src/queues/notification.queue.ts:39`).
- Base table defined in `supabase/migrations/20260110700001_email_integration.sql:196`; extended by `supabase/migrations/20260115200001_email_digest_content_preferences.sql`.

## Eliminated

- public.users / auth.users confusion (the #11 class of bug): NOT applicable here — the enumeration query targets `email_notification_preferences`, not a users table.
- Client privilege / RLS / missing service-role key: NOT the cause — error code is 42703 (undefined column), and the corrected query returns 200 under the same key.
- `get_user_digest_content` RPC missing: ELIMINATED — RPC exists (HTTP 200 on the live DB).
- `user_preferences.language` missing: ELIMINATED — table + column exist (HTTP 200).

## Evidence

- timestamp: 2026-06-01T00:00:00Z
  source: code — backend/src/queues/digest-scheduler.ts:84 (daily) and :200 (weekly)
  finding: Daily query filters `.eq('digest_frequency', 'daily')`; weekly query filters `.eq('digest_frequency', 'weekly')`. Both target table `email_notification_preferences`. The error wrapper "Daily/Weekly digest: failed to query users" is logged at lines 89 / 205 when `queryError !== null`.

- timestamp: 2026-06-01T00:00:00Z
  source: schema — supabase/migrations/20260110700001_email_integration.sql:219-223 and 20260115200001_email_digest_content_preferences.sql (full)
  finding: `email_notification_preferences` digest columns are `daily_digest_enabled BOOLEAN DEFAULT FALSE`, `daily_digest_time TIME`, `weekly_digest_enabled BOOLEAN DEFAULT FALSE`, `weekly_digest_day INTEGER`. NO `digest_frequency` column exists in the base or the extension migration. (A similarly-named `email_digest_frequency` exists only on a DIFFERENT activity-feed prefs table in 20260110100000_activity_feed_enhanced.sql:126 — unrelated.)

- timestamp: 2026-06-01T00:00:00Z
  source: live DB (zkrcjzdemdmwhearhfgg) — REST reproduction with service-role key, exact daily-digest query
  finding: GET .../email_notification_preferences?select=user_id,daily_digest_time,quiet_hours_timezone&digest_frequency=eq.daily&daily_digest_time=not.is.null&limit=50
  → HTTP 400, body: {"code":"42703","details":null,"hint":null,"message":"column email_notification_preferences.digest_frequency does not exist"}
  This IS the underlying error that the scheduler re-labels as "failed to query users".

- timestamp: 2026-06-01T00:00:00Z
  source: live DB — weekly-digest query reproduction
  finding: GET ...?digest_frequency=eq.weekly&weekly_digest_day=eq.0 → HTTP 400, same 42703 / "column ... digest_frequency does not exist".

- timestamp: 2026-06-01T00:00:00Z
  source: live DB — corrected query reproduction
  finding: GET ...?select=user_id,daily_digest_time,quiet_hours_timezone,daily_digest_enabled,weekly_digest_enabled,weekly_digest_day&daily_digest_enabled=eq.true&limit=5 → HTTP 200, body [] (no opted-in users yet — this is the benign "no users" path, not an error).

- timestamp: 2026-06-01T00:00:00Z
  source: live DB — downstream dependency checks
  finding: RPC get_user_digest_content → HTTP 200 (exists). Table user_preferences with column language → HTTP 200 (exists). Downstream of the user query is sound; the only defect is the enumeration filter.

## Resolution

root_cause: The digest scheduler enumerates digest recipients by filtering `email_notification_preferences` on a column that does not exist — `.eq('digest_frequency', 'daily')` (line 84) and `.eq('digest_frequency', 'weekly')` (line 200). PostgREST rejects the request with HTTP 400 / Postgres code 42703 ("column email_notification_preferences.digest_frequency does not exist"). The scheduler's catch path logs this as the misleading "failed to query users". The real digest opt-in columns are the booleans `daily_digest_enabled` and `weekly_digest_enabled`. This is NOT a `public.users`/`auth.users` or service-role/RLS issue (those were eliminated against the live DB).

fix: NOT APPLIED in this debug session (per orchestrator instruction — route through /gsd:quick). Recommended exact change in `backend/src/queues/digest-scheduler.ts`:

- Line 84 (in `processDailyDigests`): replace
  `.eq('digest_frequency', 'daily')`
  with
  `.eq('daily_digest_enabled', true)`
  (The existing `.not('daily_digest_time', 'is', null)` filter can stay; `daily_digest_time` has a default so it is effectively always set.)
- Lines 200 (in `processWeeklyDigests`): replace
  `.eq('digest_frequency', 'weekly')`
  with
  `.eq('weekly_digest_enabled', true)`
  Keep `.eq('weekly_digest_day', currentDay)` (line 201) unchanged.
  No migration is required — both boolean columns already exist on the live DB (verified). After the fix, the daily query returns HTTP 200 (empty until users opt in), and the scheduler proceeds normally.

verification_plan (for /gsd:quick after applying):

1. `pnpm --filter backend typecheck` (no type change expected; columns are in database.types).
2. Reproduce the corrected REST call with the service-role key → expect HTTP 200.
3. Optionally seed one row with `daily_digest_enabled = true` and a `daily_digest_time` matching the current UTC hour, then run the daily tick → expect an `email_queue` insert, no "failed to query users" log.

## Specialist Review

specialist_hint: typescript (Express + TypeScript backend)
result: LOOKS_GOOD
notes:

- `.eq('daily_digest_enabled', true)` / `.eq('weekly_digest_enabled', true)` is the correct PostgREST idiom — boolean literal, not the string 'daily'/'weekly'. Both columns are typed in database.types, so no `any` and no type changes are required.
- The existing `DigestUserRow` cast still holds for both queries; the daily `.select(...)` need not change.
- Minor (non-blocking) pitfall: the daily query retains `.not('daily_digest_time', 'is', null)`. A row with `daily_digest_enabled = true` but an explicitly NULLed `daily_digest_time` would be silently skipped. The column has a default ('08:00:00'), so this is benign in practice; leave as-is unless product wants enabled-but-no-time users to fall back to 08:00.
- Error-message hygiene (optional follow-up, out of scope for the fix): the log label "failed to query users" is misleading for a column error on a preferences table. Logging the underlying `queryError.code`/`message` would have made this 42703 obvious immediately. Consider including `queryError` detail in the log call.
