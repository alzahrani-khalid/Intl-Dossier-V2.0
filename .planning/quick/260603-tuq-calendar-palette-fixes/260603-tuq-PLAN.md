---
quick_id: 260603-tuq
title: Fix calendar create + work-creation palette bugs
status: in-progress
date: 2026-06-03
branch: fix/calendar-palette-260603-tuq
mode: quick (inline orchestrator execution)
---

# Quick Task 260603-tuq: Fix calendar create + work-creation palette bugs

Three validated dev-run findings, root-caused against the live staging DB
(`zkrcjzdemdmwhearhfgg`). Each fix is independent and committed atomically.

## Findings & root causes (verified)

1. **Work-creation palette renders an empty form.**
   `frontend/src/components/work-creation/WorkCreationPalette.tsx` — the
   auto-advance `useEffect` (≈ lines 117-129) advances `step` to
   `context-select`/`form` when `defaultType` is set via `openPalette('task')`,
   but never calls `setSelectedType`. `selectedType` stays `null`, so the form
   branch (`step === 'form' && selectedType`) renders nothing. Manual workaround
   (Back → re-pick) works only because `handleTypeSelect` _does_ set it.

2. **`calendar_events` RLS policies are broken (universal blocker).**
   Both the INSERT and SELECT policies filter the clearance subquery on
   `WHERE dossiers.id = auth.uid()` (a dossier id vs a user id) instead of
   `WHERE profiles.user_id = auth.uid()`. Proven empirically: the predicate
   returns `false` for every row, even dossiers the user is cleared for; the
   `dossiers` policies use the correct form. `calendar_events` has 0 rows —
   nothing has ever been inserted through it.

3. **`calendar-create` fabricates an invalid dossier.**
   `supabase/functions/calendar-create/index.ts` inserts a `dossiers` row with
   `type: 'other'` when no `linked_item_id` is provided. `'other'` violates the
   `dossiers` type CHECK (only `country/organization/forum/engagement/topic/
working_group/person`) → 500 "Failed to save event". The `/calendar/new`
   route mounts the form with no `linkedItemId`, so it always hits this path.

## Tasks

### Task 1 — Palette: set selectedType on auto-advance

- **files:** `frontend/src/components/work-creation/WorkCreationPalette.tsx`
- **action:** In the auto-advance `useEffect`, call `setSelectedType(defaultType)`
  before/with the step transition so the form branch renders.
- **verify:** typecheck passes; logic trace shows `selectedType === defaultType`
  after `openPalette(type)`.
- **done:** opening the palette via a typed shortcut lands on a populated form.

### Task 2 — RLS: fix calendar_events policies (migration + apply)

- **files:** new `supabase/migrations/<ts>_fix_calendar_events_rls_clearance.sql`
- **action:** DROP + CREATE both `calendar_events` policies
  ("Users can create/view calendar events within clearance") with the corrected
  `WHERE profiles.user_id = auth.uid()` predicate; preserve `TO public` and
  otherwise-identical logic. Apply via Supabase MCP to `zkrcjzdemdmwhearhfgg`.
- **verify:** re-run the predicate test — corrected policy passes for cleared
  dossiers, still blocks over-clearance.
- **done:** an authenticated, cleared user can insert/select `calendar_events`.

### Task 3 — calendar-create: require a dossier (edge fn + form picker)

- **files:** `supabase/functions/calendar-create/index.ts`,
  `frontend/src/components/calendar/CalendarEntryForm.tsx`
- **action (edge):** remove the phantom-dossier block; require `linked_item_id`
  (return 400 if missing). Deploy via Supabase MCP.
- **action (frontend):** when no `linkedItemId` prop is provided (standalone
  `/calendar/new`), render a required `DossierSelector` (label
  `t('dossier-context:selector.title')`); send `linked_item_type: 'dossier'`
  and `linked_item_id` = selected; block submit with an error if none chosen.
- **verify:** `AddToDossierDialogs` path (already passes a real dossier_id) still
  compiles/works; standalone form requires a dossier; frontend build passes.
- **done:** events can be created from `/calendar/new` with a chosen dossier;
  unlinked submits are blocked client-side instead of 500ing.

## Out of scope (reported, not changed)

- `calendar_events` vs `calendar_entries` table duality (Week Ahead reads
  `calendar_entries` via `get_upcoming_events`) — architectural decision.
- Missing `calendar_events` UPDATE/DELETE RLS policies.
- `dossiers-create` 403 — correct clearance enforcement, not a defect.
- TaskQuickForm assignee — already a proper `UserPicker`.

## Verification

- `pnpm --filter frontend typecheck` (or `tsc --noEmit`) passes.
- Frontend production build passes (pre-commit hook runs `pnpm build`).
- RLS predicate re-test on staging confirms corrected behavior.
