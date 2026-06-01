---
status: resolved
trigger: 'notification_category_preferences table query returns HTTP 406 from the frontend (walkthrough issue #11, deferred from PR #39)'
created: 2026-06-01T00:00:00Z
updated: 2026-06-01T00:00:00Z
resolved: 2026-06-01T00:00:00Z
fix_commit: efc3a38f
---

## Closure (2026-06-01)

Fix APPLIED in commit `efc3a38f` on branch `fix/notification-walkthrough-10-11`
(quick task `260601-gd5`). `frontend/src/hooks/useEmailNotifications.ts`:
`.single()` → `.maybeSingle()` (the read of `email_notification_preferences`),
so an empty table returns `null` + HTTP 200 instead of a 406 (PGRST116); the
page already falls back to defaults on null. Frontend `type-check` passes clean.
Scope note: only part 1 (frontend resilience) was applied. Part 2 — wiring the
orphaned seeding functions (`create_default_email_preferences`,
`create_default_notification_category_preferences`) to `auth.users` triggers +
backfilling the 393 existing users — is a SEPARATE latent data-completeness
issue, deferred and surfaced to the user (touches prod-backing data).

## Current Focus

hypothesis: The browser-visible 406 originates from a `.single()` read against an EMPTY preferences table. PostgREST returns 406 (PGRST116) when a single-object Accept header matches 0 rows. The category-preferences hook itself is array-safe; the observable 406 on the Notification Preferences page comes from `useEmailPreferences().single()` on the empty `email_notification_preferences` table. The deeper defect is that BOTH preference tables are empty for all users (seeding trigger targets the wrong table + no backfill).
test: Logged in as the test user, replayed the frontend query against `notification_category_preferences` both as an array select and with a single-object Accept header; queried row counts via service-role.
expecting: Array select → 200 []; single-object Accept → 406 PGRST116.
next_action: ROOT CAUSE FOUND — propose fix.

## Symptoms

expected: Querying `notification_category_preferences` for the current user returns the user's category preferences (HTTP 200, JSON body).
actual: The frontend request to `notification_category_preferences` returns HTTP 406 (Not Acceptable). The preferences fail to load.
errors: HTTP 406 Not Acceptable on the PostgREST request to `notification_category_preferences`.
reproduction: Open the notification preferences surface in the app (logged-in user); the frontend issues a query against `notification_category_preferences` and the response is 406.
started: Present during the manual app walkthrough; deliberately left out of PR #39 (post-walkthrough fixes). Exact regression commit unknown.

## Suspected Causes (from handoff, to confirm/eliminate)

- PostgREST single-object request (`.single()` / `Accept: application/vnd.pgrst.object+json`) against a query that returns 0 rows → PostgREST returns 406. (Most common cause of 406 with single-object Accept.) **CONFIRMED as the 406 mechanism.**
- RLS policy on `notification_category_preferences` blocking the row. **ELIMINATED** — service-role (bypasses RLS) also returns 0 rows; the table is genuinely empty.
- Table/schema mismatch — table missing, wrong name, or column the query selects does not exist. **ELIMINATED** — table exists, is in the PostgREST schema cache, columns match generated types.
- Missing/incorrect `Accept` header negotiation. **ELIMINATED** — array select returns 200; only the single-object Accept 406s.

## Context

- Supabase project: zkrcjzdemdmwhearhfgg (staging doubles as prod backend).
- Related bug deferred together: #10 daily/weekly digest jobs fail on startup — separate debug session.
- Repo rule: route any actual fix through /gsd:quick afterward.

## Eliminated

- RLS blocking the row — service-role read (RLS bypassed) returns 0 rows; table is empty for ALL users.
- Table missing / not in schema cache — service-role GET returns HTTP 200 (with `[]`).
- Column / select mismatch — generated `database.types.ts` matches the live columns; `select('*')` succeeds.
- The committed `useCategoryPreferences` hook as the 406 source — it uses an array select (`.select('*').eq('user_id', …)`), which returns HTTP 200 `[]`, NOT 406. History confirms it was never `.single()`.
- Backend `notification.processor.ts` `.single()` calls (lines 30/73/134) as the browser 406 — they are server-side and explicitly tolerate PGRST116.

## Evidence

- timestamp: 2026-06-01 | Frontend call site `frontend/src/hooks/useNotificationCenter.ts:306-312` (`useCategoryPreferences`) uses `.from('notification_category_preferences').select('*').eq('user_id', user.id)` — an ARRAY select, no `.single()`. It even tolerates `PGRST116`. This call returns HTTP 200 `[]`, not 406.
- timestamp: 2026-06-01 | LIVE DB (service-role REST, bypasses RLS): `GET /rest/v1/notification_category_preferences?select=id` with `Prefer: count=exact` → `content-range: */0`. The table is EMPTY across the entire database (0 rows, every user).
- timestamp: 2026-06-01 | LIVE DB: logged in as test user (`kazahrani@stats.gov.sa`, id `de2734cf-f962-4e05-bf62-bc9e92efff96`). Replayed the hook query with anon key + user JWT:
  - Array select (`Accept: application/json`): **HTTP 200 `[]`**.
  - Single-object (`Accept: application/vnd.pgrst.object+json`): **HTTP 406** `{"code":"PGRST116","details":"The result contains 0 rows","message":"Cannot coerce the result to a single JSON object"}`. This is the exact reported symptom and confirms the 406 mechanism = single-object Accept on 0 rows.
- timestamp: 2026-06-01 | The Notification Preferences page (`frontend/src/components/notifications/NotificationPreferences.tsx`) calls BOTH `useCategoryPreferences()` (array-safe) AND `useEmailPreferences()`. The latter (`frontend/src/hooks/useEmailNotifications.ts:117-121`) does `.from('email_notification_preferences').select('*').eq('user_id', user.id).single()` — a single-object read. `email_notification_preferences` is ALSO empty on live (`content-range: */0`; `[]` for the test user), so THIS query emits a real browser-visible **HTTP 406** (caught as PGRST116 → returns `null`, UI falls back to defaults, but the raw 406 still appears in the network tab/console). This is the observable 406 on the preferences surface; it was attributed to `notification_category_preferences` because both empty tables are queried on the same page.
- timestamp: 2026-06-01 | Root of the empty tables: the seeding trigger `create_category_preferences_for_new_user` (`supabase/migrations/20260111100001_notification_center.sql:364-366`) fires `AFTER INSERT ON public.users` (the app's profile table) — NOT `auth.users`, where users are actually created on signup. The function inserts `VALUES (NEW.id, cat)` FK-referencing `auth.users(id)`. There is also NO backfill for users who existed before this migration. Net effect: no preference rows are ever seeded → both preference tables stay empty → every single-object read 406s.

## Specialist Review

(typescript — see session manager output; pending dispatch)

## Resolution

root_cause: Both notification-preference tables (`notification_category_preferences` and `email_notification_preferences`) are EMPTY for every user, so any single-object (`.single()`) read returns PostgREST 406 (PGRST116, "0 rows"). The browser-visible 406 on the Notification Preferences page comes from `useEmailPreferences()` calling `.single()` on the empty `email_notification_preferences` table (`frontend/src/hooks/useEmailNotifications.ts:121`). The tables are empty because the default-preferences seeding trigger fires on `public.users` inserts instead of `auth.users` (`supabase/migrations/20260111100001_notification_center.sql:364-366`), and no backfill seeds pre-existing users. The `notification_category_preferences` hook itself is array-safe and returns `200 []`.

fix: not applied (diagnosis-only per orchestrator; route the change through /gsd:quick). Recommended fix has two complementary parts:

1. Frontend resilience (low-risk, immediate): change the single-object reads to tolerate empty results — replace `.single()` with `.maybeSingle()` in `frontend/src/hooks/useEmailNotifications.ts:121`. `.maybeSingle()` returns `data: null` with HTTP 200 instead of a 406 on 0 rows, eliminating the noisy 406 entirely. (The category hook needs no change.)
2. Data/seed fix (root cause): re-point the seeding trigger to `auth.users` (or to the actual signup path) AND backfill default preference rows for existing users for BOTH `notification_category_preferences` and `email_notification_preferences`, via a new migration. After backfill, the single-object reads find a row and return 200 naturally.

## Live-DB correction (2026-06-01, orchestrator)

The debugger's part-2 root cause was derived from the migration FILE and is partly STALE vs. the live DB (project zkrcjzdemdmwhearhfgg). Verified live:

- `public.users` has 393 rows — fully in sync with `auth.users` (393). So `public.users` is NOT empty; the "trigger fires on the wrong/empty table" framing is inaccurate.
- The migration-file trigger `create_category_preferences_for_new_user` does NOT exist on the live DB at all (superseded/never applied).
- The live trigger that DOES fire on `auth.users` is `create_default_notification_prefs()` — but it only seeds `public.user_notification_preferences` (a different, working table), NOT the two empty tables.
- The real seeding functions for the empty tables — `create_default_email_preferences` and `create_default_notification_category_preferences` — EXIST as functions but are wired to NO live trigger (orphaned). THAT is why both tables are empty (their seeding code is never invoked), plus there is no backfill for the 393 existing users.

Corrected root cause: the browser 406 is `useEmailPreferences().single()` reading the empty `email_notification_preferences` table. The table is empty because its seeding function is an orphaned (un-triggered) function, not because of a wrong-table trigger.

Scope decision (orchestrator): The REPORTED symptom (#11 = the 406) is fully resolved by part 1 alone (`.maybeSingle()`), since the UI already falls back to defaults on a null result. Part 2 (wire the orphaned seeding functions to `auth.users` triggers + backfill 393 users) is a SEPARATE latent data-completeness issue that touches prod-backing data — deferred and surfaced to the user as an optional follow-up, NOT applied as part of this walkthrough fix. The applied fix is part 1 only.
