---
quick_id: 260604-lmy
slug: calendar-write-to-entries
date: 2026-06-04
status: in-progress
branch: fix/calendar-palette-260603-tuq
supersedes: PR #42 calendar table choice (calendar_events → calendar_entries)
---

# Quick Task 260604-lmy — Point calendar create/update at `calendar_entries`

## Problem

PR #42 fixed calendar creation but pointed the **write** at `calendar_events` — a
separate, **empty** forum-agenda table (event_type enum = main_event/session/
plenary/…; recurrence model). The live operational calendar data (5 rows) lives in
`calendar_entries` (entry_type = internal_meeting/deadline/training/…), which is
also what **both read paths already query**: `calendar-get` (grid) and
`get_upcoming_events` (Week Ahead). So created events persisted to the wrong table
and never displayed.

Decision (user, 2026-06-04): **Option A** — `calendar_entries` is canonical for the
operational calendar. `calendar_events` remains the (separate, unused) forum model.

## Root facts (verified against live staging DB)

- `calendar_entries`: 5 rows, RLS **enabled** but **no SELECT policy** → only
  `get_upcoming_events` (SECURITY DEFINER) can read it; the grid (`calendar-get`,
  user JWT) returns 0 rows.
- INSERT policy `with_check (organizer_id = auth.uid())`; UPDATE/DELETE `(organizer_id = auth.uid())`.
- `entry_type` CHECK: internal_meeting, deadline, reminder, holiday, training, review, forum, other → matches the form's options exactly.
- `status` CHECK: scheduled, completed, cancelled, rescheduled.
- `linked_item_type` CHECK: assignment, position, mou, commitment, forum — **'dossier' NOT allowed** → dossier link goes to the `dossier_id` column.
- `dossier_id` nullable (one operational row legitimately has none).
- `calendar-get` and `get_upcoming_events` already read `calendar_entries` → **no read-path change**.

## Tasks

### Task 1 — DB: SELECT RLS policy on `calendar_entries`

- New migration `supabase/migrations/20260604xxxxxx_calendar_entries_select_rls.sql`:
  `FOR SELECT TO public USING (organizer_id = auth.uid() OR created_by = auth.uid()
OR auth.uid() = ANY(COALESCE(attendee_ids,'{}')) OR (dossier_id IS NOT NULL AND
EXISTS (SELECT 1 FROM dossiers d JOIN profiles p ON p.user_id = auth.uid()
WHERE d.id = calendar_entries.dossier_id AND d.sensitivity_level <= p.clearance_level)))`.
- Apply via Supabase MCP (`apply_migration`); commit the file.
- **verify:** select as authenticated organizer returns the 5 seed rows; a user's own created entry is visible.

### Task 2 — `calendar-create` → write `calendar_entries`

- Map: `start_datetime` → `event_date` + `event_time`; duration from `end_datetime` (else 60, null if all_day).
- `entry_type` passthrough; `status='scheduled'`; `location`; `is_virtual=false`; `all_day`.
- `organizer_id = user.id` (satisfies INSERT RLS); `created_by = user.id`.
- Dossier link: if `linked_item_type` in allowed enum → `linked_item_type/id`; else (`'dossier'`/other) → `dossier_id`. **dossier_id optional — no 400.**
- Drop the `event_participants` insert (FKs to calendar_events). Note: form participants not persisted on operational entries (no entries-side participant table) — documented limitation.
- Deploy via Supabase MCP (`deploy_edge_function`).
- **verify:** standalone create (no dossier) → 201, row in calendar_entries; create with dossier → 201, dossier_id set.

### Task 3 — `calendar-update` → update `calendar_entries`

- Re-point `.from('calendar_events')` → `.from('calendar_entries')`; map provided fields (start/end → event_date/time/duration, location single col, entry_type passthrough). Drop event_participants delete/insert.
- Deploy via Supabase MCP.
- **verify:** update an entry's title/time → 200, persisted.

### Task 4 — `CalendarEntryForm`: dossier optional

- DossierSelector: drop `required`; remove the hard submit guard (lines ~341-346) and the unused `dossierError`/`setDossierError` state + `error` prop. (Also removes the `t('dossier-context:validation.dossier_required')` unregistered-namespace raw-key bug.)
- Keep `linked_item_type: linkedItemId ? linkedItemType : 'dossier'` so edge fn maps the picked dossier to `dossier_id`.
- **verify:** `pnpm --filter frontend typecheck` clean (no unused vars); standalone form submits with and without a dossier.

### Task 5 — Live E2E + cleanup

- Browser: create an operational entry via the UI → confirm 201, row in `calendar_entries`, appears in the grid + Week Ahead. Delete the test row.

### Task 6 — Docs + PR #42

- SUMMARY.md, STATE.md "Quick Tasks Completed" row.
- Update PR #42 body to the corrected Option-A narrative (write target = calendar_entries; calendar_events left as forum model; note the #42 calendar_events RLS migration is now non-load-bearing but harmless).

## Out of scope

- Migrating/retiring `calendar_events` (forum model; separate concern).
- Persisting form participants on operational entries (needs an entries-side participant table).
- Broadening calendar visibility beyond ownership+clearance.
