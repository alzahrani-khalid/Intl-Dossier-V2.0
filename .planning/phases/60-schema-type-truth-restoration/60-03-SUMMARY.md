---
phase: 60-schema-type-truth-restoration
plan: 03
subsystem: database
tags: [supabase, postgres, view, migration, events, data-library, rls, grants]

# Dependency graph
requires:
  - phase: 60-schema-type-truth-restoration
    provides: 60-RESEARCH live-staging ground-truth matrix (event_details MISSING; 035 appliable, 037 unappliable; dual-009 dead file identified)
provides:
  - event_details view live on staging in 035 shape + organizer/country columns sourced from event_attendees -> dossiers (country_code via countries.iso_code_2)
  - authenticated-only grant on event_details (anon SELECT revoked despite the public-schema default ACL)
  - 009_data_library.sql marked SUPERSEDED (never-applied) so the dual-009 drift is not "fixed" backwards
affects: [60-05 types-regen, events, data-library]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'event_attendees -> dossiers LATERAL join for organizer/country names (names live on dossiers, NOT the extension tables)'
    - 'Explicit REVOKE ALL ... FROM anon to defeat the public-schema pg_default_acl that auto-grants anon on every new relation'
    - 'SUPERSEDED header-comment marker for dead never-applied migrations (body byte-unchanged)'

key-files:
  created:
    - supabase/migrations/20260610000003_create_event_details_view.sql
  modified:
    - supabase/migrations/009_data_library.sql

key-decisions:
  - 'max_participants is a NULL::int placeholder — live events table has no source column (verified information_schema)'
  - 'venue_en/venue_ar and bilingual title/location reuse the single live column (035 fallback convention) — live events stores no bilingual or venue columns'
  - 'country_code = countries.iso_code_2 (countries.code does not exist); country/organizer names come from dossiers.name_en/name_ar'
  - 'Added explicit REVOKE ALL ON event_details FROM anon: the staging public-schema default ACL silently grants anon on new relations, so a bare GRANT TO authenticated left an inherited anon SELECT — revoked to honor the authenticated-only / _protected security intent (T-60-03-I)'

patterns-established:
  - 'Pattern: derive view display columns from dossiers via event_attendees.entity_id, never from dossier-extension tables (organizations/countries)'
  - 'Pattern: when a fresh public-schema object must be non-anon, pair GRANT TO authenticated with REVOKE ALL FROM anon to override the DB default ACL'

requirements-completed: [P1]

# Metrics
duration: 4 min
completed: 2026-06-10
---

# Phase 60 Plan 03: event_details View Restoration + Dead 009 Supersession Summary

**Brought the missing `event_details` view live on staging in the 035 shape plus organizer/country columns joined from `event_attendees` → `dossiers` (authenticated-only, anon revoked), and marked the never-applied `009_data_library.sql` SUPERSEDED so the dual-009 drift is locked.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-06-10T07:33:40Z
- **Completed:** 2026-06-10T07:37:11Z
- **Tasks:** 2
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments

- `event_details` view created live (was MISSING — neither 035 nor 037 had been applied; EventsPage was querying a nonexistent relation). View now matches the contract `EventsPage.tsx` consumes via `.from('event_details').select('*')`.
- Organizer + country columns sourced correctly for live schema: `LEFT JOIN LATERAL` over `event_attendees` joining `dossiers` for names (NOT `organizations`/`countries`, which are dossier-extension tables) and `countries.iso_code_2` for the code (037's `organizations.name_en`/`countries.code` would have 42703'd).
- Defeated the staging public-schema default ACL with an explicit `REVOKE ALL ... FROM anon`, so the view is genuinely authenticated-only (EventsPage is behind `_protected`).
- `009_data_library.sql` marked SUPERSEDED with a header comment; CREATE TABLE body byte-unchanged, live `data_library_items` table untouched.

## Task Commits

1. **Task 1: event_details view migration + MCP apply + organizer/country probes** - `ee9c87db` (feat) — initial commit `12674374` was amended to `ee9c87db` after adding the `REVOKE ALL ... FROM anon` (see Deviations)
2. **Task 2: mark 009_data_library.sql superseded** - `6e1afedd` (chore)

**Plan metadata:** this SUMMARY commit (docs: complete plan)

## Files Created/Modified

- `supabase/migrations/20260610000003_create_event_details_view.sql` — new `event_details` view migration: 035 column shape + organizer/country via `event_attendees`→`dossiers`; `country_code` via `countries.iso_code_2`; authenticated-only grant with explicit anon revoke; root-cause header explaining why 037 was unappliable.
- `supabase/migrations/009_data_library.sql` — prepended SUPERSEDED header (5-line comment) marking it never-applied and pointing at the live-creating `009_create_data_library_items.sql`. Body unchanged.

## Live Verification (probes recorded verbatim)

Applied via Supabase MCP `apply_migration` (project `zkrcjzdemdmwhearhfgg`, name `create_event_details_view`) → `{"success":true}`.

- **Probe (a)** — `SELECT 1 FROM pg_views WHERE schemaname='public' AND viewname='event_details'` → `[{"view_exists":1}]` (1 row). **PASS**
- **Probe (b)** — `SELECT organizer_name_en, organizer_id, country_name_en, country_id, country_code, title_en, start_datetime, status FROM event_details LIMIT 1` → `[]` (executes WITHOUT 42703; returns empty because the live `events` table has 0 rows — the shape resolves, every EventsPage-read column exists). **PASS**
- **Grant verification** — after the `REVOKE ALL ... FROM anon`, `information_schema.role_table_grants` for `event_details` returns ZERO rows for `anon` and `SELECT` for `authenticated`. **PASS** (T-60-03-I mitigated)

Live pre-flight schema confirmations (all via `information_schema`):

- `events` columns: id, title, type, start_time, end_time, location, virtual_link, status (no bilingual/venue/max_participants).
- `event_attendees` columns: event_id, entity_id (uuid), type (text), role (text), created_at.
- `dossiers` has id/name_en/name_ar; `countries.id` FK → `dossiers.id` (extension-table pattern); `countries.iso_code_2` present, no `code` column.
- Live counts: dossiers 34, countries 4, events 0, event_attendees 0 (tables empty — view shape verified, not data).

## NULL-Placeholder / Fallback Columns (no live source)

- `max_participants` → `NULL::int` (live `events` has no such column).
- `venue_en` / `venue_ar` → reuse `events.location` (035 fallback; no venue column live).
- `title_ar`, `location_ar` → reuse the single live `events.title` / `events.location` column (035 bilingual fallback; live events stores no `_ar` variants).

## Decisions Made

See `key-decisions` in frontmatter. Headline: names come from `dossiers` not the extension tables; `country_code` is `iso_code_2`; explicit anon revoke added to override the DB default ACL.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added explicit `REVOKE ALL ON public.event_details FROM anon`**

- **Found during:** Task 1 (grant verification after apply)
- **Issue:** The plan's `GRANT SELECT ... TO authenticated` (no anon grant) is correct in the file, but probing the live grants revealed `anon` still had full privileges on the view. Root cause: this staging DB has a public-schema default privilege (`pg_default_acl`, `postgres` owner, objtype `r`) that auto-grants ALL to `anon`/`authenticated`/`service_role` on every newly created relation. A bare authenticated-only grant therefore left an inherited anon SELECT, violating the plan's authenticated-only security requirement (T-60-03-I — EventsPage is behind `_protected`).
- **Fix:** Added `REVOKE ALL ON public.event_details FROM anon;` immediately before the authenticated grant in the migration; applied it live; re-verified `role_table_grants` shows zero anon rows.
- **Files modified:** supabase/migrations/20260610000003_create_event_details_view.sql
- **Verification:** `information_schema.role_table_grants` for `event_details` returns no `anon` rows post-fix; probe (b) still resolves all columns; build green.
- **Committed in:** `ee9c87db` (Task 1 commit was amended from `12674374` to fold in this fix — single atomic commit, file matches applied SQL).

---

**Total deviations:** 1 auto-fixed (1 missing-critical / security).
**Impact on plan:** The deviation strengthens the documented security posture (authenticated-only) against a DB-level default ACL the plan did not anticipate. No scope creep — the view shape, columns, and join paths are exactly as planned.

## Issues Encountered

None — both tasks executed as planned; the only adjustment was the anon-revoke security hardening documented above.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `event_details` is live on staging with the organizer/country contract `EventsPage` consumes — ready for type regeneration in plan 60-05 (it should now appear in `generate_typescript_types` output as a View).
- The dual-009 data-library drift is locked: `009_data_library.sql` is marked dead; `009_create_data_library_items.sql` remains the authoritative live schema. No follow-up needed in this plan.
- Note for 60-05/future SQL plans: this staging DB's public-schema default ACL auto-grants anon on new relations — any new view/table intended to be non-anon needs an explicit `REVOKE ALL ... FROM anon`, not just a scoped GRANT.

---

_Phase: 60-schema-type-truth-restoration_
_Completed: 2026-06-10_

## Self-Check: PASSED

- key-files.created exists on disk: `supabase/migrations/20260610000003_create_event_details_view.sql` ✅
- Commits present: `git log` shows `ee9c87db` (feat 60-03) + `6e1afedd` (chore 60-03) ✅
- Task 1 acceptance criteria: 1× CREATE OR REPLACE VIEW; all 7 organizer/country aliases; `d.name_en AS organizer_name_en` + `d.name_en AS country_name_en`; `iso_code_2` present, `c.code`=0; `GRANT ... TO anon`=0, `GRANT ... TO authenticated`=1; apply succeeded; probe (a)=1 row, probe (b) no 42703; anon grant revoked live ✅
- Task 2 acceptance criteria: SUPERSEDED≥1; CREATE TABLE body unchanged (diff = 5 insertions at top only); file not deleted; live table not mutated ✅
- `pnpm --filter intake-frontend build` exits 0 after every commit ✅
- No STATE.md / ROADMAP.md modifications in this plan ✅
