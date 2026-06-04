---
quick_id: 260604-lmy
slug: calendar-write-to-entries
date: 2026-06-04
status: complete
branch: fix/calendar-palette-260603-tuq
pr: '#42'
supersedes: PR #42 calendar table choice (calendar_events → calendar_entries)
---

# Quick Task 260604-lmy — Summary

## What & why

PR #42 fixed calendar creation but pointed the **write** at `calendar_events` — a
separate, **empty** (0-row) forum-agenda table whose enums are domain-incompatible
with operational entries (`event_type` = main_event/session/plenary/…; `status` =
planned/ongoing/…; `dossier_id NOT NULL`). Neither read path queries it: the grid
(`calendar-get`) and Week Ahead (`get_upcoming_events`) **both read
`calendar_entries`** (the live operational table; `entry_type` =
internal_meeting/deadline/training/…). So created events persisted to the wrong
table and never displayed.

**Decision (user, 2026-06-04):** `calendar_entries` is canonical for the
operational calendar. `calendar_events` stays as the (separate, unused) forum
model. We initially scoped a "consolidate onto calendar_events" task; investigation
showed that would force lossy enum remaps, relax the dossier NOT-NULL that #42 just
added, and re-point ~16 edge functions — so we flipped to the domain-correct
Option A (write → `calendar_entries`), which is small and matches reality.

## Changes

1. **`supabase/migrations/20260604120000_calendar_entries_select_rls.sql`** —
   `calendar_entries` had RLS enabled but **no SELECT policy**, so the grid
   (user-JWT) returned 0 rows and only the `SECURITY DEFINER` `get_upcoming_events`
   RPC could read entries — a user's own created entry was invisible. Added a SELECT
   policy: organizer/creator/attendee access plus dossier clearance
   (`profiles.user_id = auth.uid()`, `sensitivity_level <= clearance_level`).
   Applied to staging via Supabase MCP.
2. **`supabase/functions/calendar-create/index.ts`** (deployed v11) — writes
   `calendar_entries`: `start/end` → `event_date` + `event_time` +
   `duration_minutes`; `status='scheduled'`; single `location` column;
   `organizer_id = created_by = auth.uid()` (satisfies INSERT RLS); dossier link
   **optional**, stored in `dossier_id` (`'dossier'`/non-enum context types route
   there; real enum link types → `linked_item_type/id`).
3. **`supabase/functions/calendar-update/index.ts`** (deployed v10) — same
   re-point to `calendar_entries` with the same field mapping; dropped the
   `event_participants` writes (those FK `calendar_events`).
4. **`frontend/src/components/calendar/CalendarEntryForm.tsx`** — dossier link is
   now optional (removed the hard require-dossier submit guard, which also removed a
   `t('dossier-context:validation.dossier_required')` unregistered-namespace
   raw-key bug). `DossierSelector` stays for optional linking.

## Verification (live, staging)

- **DB:** SELECT RLS test under the seed organizer → `VISIBLE_ROWS=5` (was 0).
  No-dossier insert sim → `INSERT_OK … visible=1` (passes INSERT RLS + all CHECKs,
  immediately readable).
- **E2E (deployed fns + real user JWT):**
  - `POST calendar-create` (no-dossier, training, 13:30→15:00) → **201**, persisted
    to `calendar_entries`, `duration_minutes:90`, `organizer_id`/`created_by` set,
    `status:scheduled`.
  - `GET calendar-get` (same day) → **200**, `total_count:1`, **new entry visible**
    through the read path under RLS — the create→display loop that was broken.
  - `POST calendar-create` (dossier-linked) → **201**, `dossier_id` set correctly,
    `linked_item_type` null, `duration:45`.
  - Both test rows deleted; `calendar_entries` back to 5 seed rows.
- **Static:** frontend `eslint` clean on the form, `tsc --noEmit` clean.

## Out of scope / notes

- `calendar_events` (forum-agenda model, 0 rows) is left intact; the #42
  `calendar_events` RLS-clearance migration is now **non-load-bearing but harmless**
  (still a correct fix to a genuinely-broken policy).
- Form **participants** (person/org dossiers) are not persisted on operational
  entries — `attendee_ids` is a user-id array (semantic mismatch); needs a
  dedicated entries-side participant table. (They were already effectively lost
  before, attached to the invisible `calendar_events` rows.)
- Calendar visibility kept to ownership + dossier-clearance; broader team-calendar
  sharing is a separate policy decision.
