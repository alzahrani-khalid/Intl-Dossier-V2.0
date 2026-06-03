---
quick_id: 260603-tuq
title: Fix calendar create + work-creation palette bugs
status: complete
date: 2026-06-03
branch: fix/calendar-palette-260603-tuq
commits:
  - 9a7f6cc4 # calendar: require dossier + RLS fix + form picker (+ migration)
  - 79def656 # palette: set selectedType on auto-advance
---

# Quick Task 260603-tuq — Summary

Fixed three validated dev-run findings. All root causes were verified against
the live staging DB (`zkrcjzdemdmwhearhfgg`) before and after the fix.

## What was fixed

### 1. Work-creation palette rendered an empty form (commit 79def656)

`WorkCreationPalette.tsx` — the auto-advance `useEffect` advanced `step` when
`defaultType` was set via `openPalette(type)` but never called
`setSelectedType`, so `selectedType` stayed `null` and the form branch
(`step === 'form' && selectedType`) rendered nothing. Added
`setSelectedType(defaultType)` to the effect.

### 2. `calendar_events` RLS — universal create/read blocker (commit 9a7f6cc4)

Both the INSERT and SELECT policies filtered the clearance subquery on
`dossiers.id = auth.uid()` (dossier id vs user id) instead of
`profiles.user_id = auth.uid()` → the subquery returned NULL → the predicate
was never true. No row could be inserted (42501 → 403) or read.

- **Migration** `20260603183000_fix_calendar_events_rls_clearance.sql` drops +
  recreates both policies with the corrected predicate (mirrors the working
  `dossiers` policies; `TO public` and logic otherwise identical).
- Applied to staging via Supabase MCP.
- **Verified:** an authenticated, cleared user can now INSERT (rolled-back test
  returned an id); before the fix the identical insert returned 42501.

### 3. `calendar-create` fabricated an invalid dossier (commit 9a7f6cc4)

When no `linked_item_id` was supplied, the edge function inserted a `dossiers`
row with `type: 'other'`, which violates the dossiers type CHECK → 500
"Failed to save event". The `/calendar/new` route mounts the form with no
`linkedItemId`, so it always hit this path.

- **Edge function:** removed the phantom-dossier block; a linked dossier is now
  required (400 if absent). Deployed to staging (v10, `verify_jwt: true` preserved).
- **Frontend** `CalendarEntryForm.tsx`: added a required `DossierSelector` (label
  `dossier-context:selector.title`) shown when no `linkedItemId` prop is
  provided; submit blocked client-side if no dossier is chosen. The
  `AddToDossierDialogs` path (already passes a real `dossier_id`) is unchanged.

## Files changed

- `frontend/src/components/work-creation/WorkCreationPalette.tsx`
- `frontend/src/components/calendar/CalendarEntryForm.tsx`
- `supabase/functions/calendar-create/index.ts`
- `supabase/migrations/20260603183000_fix_calendar_events_rls_clearance.sql`

## Verification

- `tsc --noEmit`: 0 errors (none in edited files).
- ESLint (`--max-warnings 0`) on both edited frontend files: pass.
- Pre-commit `pnpm build`: passed on both code commits.
- RLS: corrected predicate confirmed in `pg_policies`; rolled-back authenticated
  insert succeeded.
- Edge function: deployed v10, ACTIVE.

## Out of scope (reported, not changed)

- **Calendar table duality:** Week Ahead (`get_upcoming_events`) reads
  `calendar_entries` (5 rows) while creation writes `calendar_events`. A created
  event still will not appear in Week Ahead until the tables are unified — an
  architectural decision, not a bug fix.
- **`calendar_events` UPDATE/DELETE RLS:** no such policies exist, so edits/
  deletes are blocked by default. Related to finding #2 but outside the
  create-failure scope.
- **`dossiers-create` 403:** correct clearance enforcement (the edge function
  relies on RLS `sensitivity_level <= clearance`), not a defect. The test user
  is a low-privilege account.
- **TaskQuickForm assignee:** already a proper `UserPicker` — the original
  "Enter user ID" finding was stale.

## Follow-ups worth a separate task

- Decide canonical calendar table (`calendar_events` vs `calendar_entries`) and
  unify create/read so events surface in Week Ahead.
- Add `calendar_events` UPDATE/DELETE RLS policies (mirror the corrected
  clearance predicate) so `calendar-update` works under RLS.
