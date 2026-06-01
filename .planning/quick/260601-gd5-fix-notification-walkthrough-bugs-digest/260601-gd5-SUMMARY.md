---
quick_id: 260601-gd5
title: Fix notification walkthrough bugs #10 (digest scheduler) + #11 (email-prefs 406)
date: 2026-06-01
branch: fix/notification-walkthrough-10-11
status: complete
code_commit: efc3a38f
---

# Summary — Quick Task 260601-gd5

Fixed the two notification bugs deferred from PR #39 (walkthrough #10 + #11).
Both were root-caused via `/gsd:debug` with live-DB evidence, then fixed with
two surgical code changes. **No database migration.**

## Changes

**Code commit `efc3a38f`** (2 files, +6 / −8):

- `backend/src/queues/digest-scheduler.ts` — #10: query opted-in digest users on
  the boolean `daily_digest_enabled` / `weekly_digest_enabled` columns instead of
  the non-existent `digest_frequency` column. The bad column caused PostgREST
  `42703`, mislabeled by the catch block as "failed to query users".
- `frontend/src/hooks/useEmailNotifications.ts` — #11: read
  `email_notification_preferences` with `.maybeSingle()` instead of `.single()`,
  so an empty table returns `null` + HTTP 200 instead of a 406 (PGRST116). The
  page already falls back to defaults on null. Dropped the now-dead PGRST116
  branch; kept the nullable return contract.

## Verification

- `pnpm --filter intake-backend run type-check` — clean (exit 0, 0 errors).
- `pnpm --filter intake-frontend run type-check` — clean (exit 0, 0 errors).
- Pre-commit full `pnpm build` passed (knip warnings are non-blocking).
- Corrected digest REST query (`daily_digest_enabled=eq.true`) confirmed HTTP 200
  against the live DB `zkrcjzdemdmwhearhfgg` during investigation; the broken
  `digest_frequency` query returned HTTP 400 / 42703.
- The `.maybeSingle()` 406 mechanism was reproduced live (single-object Accept on
  0 rows → 406) and is eliminated by returning null + 200.

## Debug sessions (resolved)

- `.planning/debug/resolved/digest-jobs-failed-query-users.md` (#10)
- `.planning/debug/resolved/notif-category-prefs-406.md` (#11)

## Deferred follow-up (surfaced to user — NOT done here)

Both `notification_category_preferences` and `email_notification_preferences` are
empty for all 393 users because their seeding functions
(`create_default_email_preferences`,
`create_default_notification_category_preferences`) exist but are wired to no
live trigger (orphaned), and there is no backfill. The live `auth.users` trigger
`create_default_notification_prefs()` only seeds `user_notification_preferences`
(a different, working table). Neither reported symptom requires this fix
(`.maybeSingle()` + the digest column fix fully resolve them), and it touches
prod-backing data — so it is deferred as a separate decision for the user.

## Branch / next step

Work is on `fix/notification-walkthrough-10-11` (off `main`, not pushed yet).
Open a PR when ready. Unrelated in-flight item left untouched: the
`chore/fanout-advisory-rule` branch (1-commit CLAUDE.md doc change) and the
untracked `.fanout/` scaffold.
