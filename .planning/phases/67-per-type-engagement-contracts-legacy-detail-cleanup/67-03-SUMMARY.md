---
phase: 67-per-type-engagement-contracts-legacy-detail-cleanup
plan: 03
subsystem: database
tags: [migration, rpc, get_person_full, recent_engagements, canonical-participation, PERENG-02]
requires:
  - live get_person_full (staging) — drifted body preserved via rename
  - engagement_participants / engagement_dossiers / dossiers (canonical plane)
provides:
  - get_person_full.recent_engagements (canonical-plane, apply-ready migration)
  - get_person_full_base (renamed live body, idempotent guard)
affects:
  - 67-06 (orchestrator MCP apply + live post-state verification)
  - pages/persons/PersonDetailPage.tsx (Recent Engagements section, renders unchanged)
tech-stack:
  added: []
  patterns:
    - 'Rename-and-wrap composition (ALTER FUNCTION RENAME + CREATE OR REPLACE wrapper)'
    - 'jsonb || override to preserve a drifted live body byte-for-byte without its SQL text'
key-files:
  created:
    - supabase/migrations/20260613100000_get_person_full_recent_engagements_canonical.sql
  modified: []
decisions:
  - 'CRITICAL DRIFT confirmed live: get_person_full returns only [active_committees, key_staff, person] — no recent_engagements. Repoint authored against the live body via composition, never re-authoring live key logic.'
  - 'Rename-and-wrap over CREATE-OR-REPLACE-whole-body: preserves the three live keys byte-compatible and is safe on fresh local replay (jsonb || overrides any legacy recent_engagements key).'
  - 'recent_engagements sourced ONLY from engagement_participants ⋈ engagement_dossiers ⋈ dossiers; legacy participation plane and legacy engagements table never referenced (ENGPOS-01 fence).'
  - 'ORDER BY ed.start_date DESC NULLS LAST + LIMIT 10 live inside the subquery (the legacy body put LIMIT after json_agg where it was a no-op).'
metrics:
  duration: ~2m
  completed: 2026-06-13
---

# Phase 67 Plan 03: get_person_full recent_engagements Canonical Repoint Summary

Authored (not applied) a rename-and-wrap migration that adds a canonical-plane `recent_engagements` key to `get_person_full`, composed over the drifted live body so the three live keys stay byte-compatible — fulfilling PERENG-02's named "get_person_full.recent_engagements wiring."

## What Was Built

A single forward migration, `supabase/migrations/20260613100000_get_person_full_recent_engagements_canonical.sql`:

1. **Guarded idempotent rename** — `ALTER FUNCTION public.get_person_full(uuid) RENAME TO get_person_full_base`, wrapped in a `DO` block that only runs if `get_person_full_base` does not already exist. This preserves the drifted live body verbatim without needing its SQL text.
2. **SECURITY DEFINER wrapper** — `CREATE OR REPLACE FUNCTION public.get_person_full(p_person_id uuid) RETURNS json`, `LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp`, returning `get_person_full_base(p_person_id)::jsonb || jsonb_build_object('recent_engagements', <canonical sub-select>)::json`.
3. **Canonical sub-select** — joins `engagement_participants ep → engagement_dossiers ed (ed.id = ep.engagement_id) → dossiers d (d.id = ed.id)` where `ep.participant_dossier_id = p_person_id`, `ORDER BY ed.start_date DESC NULLS LAST LIMIT 10` **inside the subquery**, then `json_agg` over it. Emits the full `{ link, engagement }` shape: `link = to_jsonb(ep_row)` (carries `role`), `engagement = { id, name_en, name_ar, engagement_type, engagement_category, location_en, location_ar }`.
4. **Re-grant** — `GRANT EXECUTE ... TO authenticated, anon, service_role`.

The migration is authored only; the orchestrator applies it via Supabase MCP in 67-06. The `persons` edge fn calls the RPC by name, so no edge redeploy is needed.

## Drift-Probe Evidence (Task 1, read-only REST, no secrets printed)

- **Person dossier resolved:** one active `type=person` dossier id resolved via REST.
- **Live `get_person_full` top-level keys:** `['active_committees', 'key_staff', 'person']` — **`recent_engagements` is ABSENT**. This exactly confirms the Q4 drift finding; the STOP rule did not trigger; authoring proceeded.
- **`engagement_participants` REST-readability:** `rows_in_page = 1` on a `select=id&limit=2` probe — canonical table is reachable and non-empty (matches RESEARCH Q1: 1 row, person participant on the Indonesia BPS engagement).
- **Secret hygiene:** `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` loaded from `.env.test` (main repo root; the worktree root has none), probe output limited to JSON key names and row counts. No values echoed (T-67-07 mitigation honored).

Schema cross-check against `supabase/migrations/20260110000006_create_engagement_dossiers.sql`: `engagement_participants` columns are `id, engagement_id, participant_type, participant_dossier_id, external_* (6), role, attendance_status, notes, created_at, created_by` — so `to_jsonb(ep_row)` carries `role` exactly as the legacy body's whole-`pe`-row emit did. `engagement_dossiers` confirmed to have `engagement_type, engagement_category, start_date, location_en, location_ar, host_organization_id`.

## Rename-and-Wrap Rationale (for the 67-06 applier)

The live body is drifted from repo migration `20260202000001` — re-authoring its three keys would risk silently changing live behavior. Composition sidesteps that entirely:

- The guarded `RENAME` snapshots the live body as `get_person_full_base` **once** (idempotent: re-applies are no-ops because the guard sees `get_person_full_base` already present). On a fresh local DB where `20260202000001` defines the older body, the same rename captures that body instead — either way the wrapper composes over whatever `base` returns.
- `jsonb || jsonb_build_object('recent_engagements', ...)` makes the right-hand operand authoritative for the `recent_engagements` key, so even if a replayed legacy body emitted its own `recent_engagements`, the canonical value wins.
- DEFINER scope creep is bounded (T-67-06): the only new exposure is participation/engagement/dossier rows that are already SELECT-permissive, the WHERE stays person-scoped (`participant_dossier_id = p_person_id`), and `search_path` is pinned to `public, pg_temp`.

**67-06 verification protocol:** after MCP apply, run `SELECT get_person_full('<person_id>')` live and confirm (a) `active_committees`/`key_staff`/`person` are deep-equal to the pre-state, and (b) `recent_engagements` is now present (an array for the Indonesia BPS participant person, `null` for persons with no participation rows — `PersonDetailPage` guards with `&& length`, so `null` is safe).

## Deviations from Plan

**1. [Rule 3 - Blocking] `.env.test` not in the worktree root**

- **Found during:** Task 1
- **Issue:** The plan's Task 1 verify gate (`test -f .env.test`) and the probe both assume `.env.test` at the working directory; the parallel worktree root has no `.env.test`.
- **Fix:** Loaded `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from the main repo root `.env.test` (`/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.env.test`), where they exist. No file authored or modified; probe ran read-only.
- **Files modified:** none

**2. [Rule 3 - Blocking] Migration comment tripped the `! grep -q 'person_engagements'` gate**

- **Found during:** Task 2
- **Issue:** The header comment named `person_engagements` twice while explaining the ENGPOS-01 fence; the literal grep gate (which scans the whole file including comments) failed `no_pe`.
- **Fix:** Reworded the comment to "the legacy participation plane and the legacy engagements table are NEVER referenced" — preserving the fence statement while removing the literal token. The function body never referenced the legacy table.
- **Files modified:** `supabase/migrations/20260613100000_get_person_full_recent_engagements_canonical.sql` (comment only; same commit `f586f0f2`)

## Authentication Gates

None.

## Known Stubs

None. The migration is intentionally authored-but-not-applied (apply is 67-06 via orchestrator MCP — executors have no MCP); this is the documented split, not a stub.

## Verification

- Task 1 gate: `test -f .env.test && echo ENV_PRESENT` → `ENV_PRESENT` (run against main repo root).
- Task 2 gate: file present; `RENAME TO get_person_full_base`, `SECURITY DEFINER`, `participant_dossier_id = p_person_id`, `search_path`, `GRANT EXECUTE` all present; zero `person_engagements`; zero `JOIN engagements` — `MIGRATION_OK`.
- Live pre-state probe: three keys, no `recent_engagements` (drift confirmed).
- Post-commit: no accidental deletions; no untracked files left.

## Self-Check: PASSED

- Created file exists: `FOUND: supabase/migrations/20260613100000_get_person_full_recent_engagements_canonical.sql`
- Commit exists: `FOUND: f586f0f2`
