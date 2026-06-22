---
phase: 73-agent-platform-writes-generative-ui
plan: 01
subsystem: db-foundation
tags: [migration, rls, signals, briefs, invoker-rpc, genui-03, checkpoint]
status: BLOCKED (Task 1 source-complete, apply operator-gated; Task 2 needs a user decision)
requires:
  - intelligence_event status + intelligence_event_update_cleared RLS (P69)
provides:
  - intelligence_event actor columns (acknowledged_by/dismissed_by/escalated_by + status_changed_at) — migration written, NOT yet applied
affects:
  - 73-02 (propose_brief draft shape)
  - 73-03 (useApproveWrite persist_brief commit + signal actor write)
  - 73-05 (actor-assertion E2E)
tech-stack:
  added: []
  patterns: [idempotent ADD COLUMN IF NOT EXISTS, partial index, SECURITY INVOKER RPC (deferred)]
key-files:
  created:
    - supabase/migrations/20260620000001_phase73_signal_actor_columns.sql
    - .planning/phases/73-agent-platform-writes-generative-ui/deferred-items.md
  modified: []
decisions:
  - "Task 2 (persist_brief RPC) NOT created — the plan's prescribed RPC contract is physically impossible against the live briefs table (Rule 4 escalation)."
metrics:
  duration: ~25m
  completed: 2026-06-20 (Task 1 source only)
  tasks_completed: 1 of 2 (Task 1 source-verified + committed; live-apply operator-gated)
---

# Phase 73 Plan 01: DB Foundation Summary

Task 1's signal actor-column migration is written and source-verified (idempotent
`ADD COLUMN IF NOT EXISTS` for `acknowledged_by`/`dismissed_by`/`escalated_by` +
`status_changed_at`, partial index, zero RLS/DEFINER touch) and committed
(`e8cd2b61`). Task 2 (`persist_brief` INVOKER RPC) is **blocked**: live-schema
verification proved the plan's prescribed RPC contract cannot exist against the
real `briefs` table. Neither migration could be applied this session because the
Supabase MCP tools are not exposed to the executor agent and every CLI fallback is
blocked.

## What got done

- `supabase/migrations/20260620000001_phase73_signal_actor_columns.sql` — Task 1
  migration, mirrors the P69 extend file's idempotent style. Source acceptance
  criteria all pass:
  - exactly 4 `ADD COLUMN IF NOT EXISTS` for the 4 named columns;
  - the 3 `*_by` columns `REFERENCES auth.users(id)`;
  - no `DROP POLICY` / `CREATE POLICY` / `SECURITY DEFINER` in the file.
- Committed individually: `e8cd2b61` (`feat(73-01): add signal status-change actor columns…`).

## Live-schema verification (the load-bearing finding)

Verified against staging `zkrcjzdemdmwhearhfgg` via the PostgREST OpenAPI schema +
safe invalid-insert probes (service-role, read-only; nothing written).

### intelligence_event — Task 1 assumptions CONFIRMED

- `status TEXT NOT NULL`, `sensitivity_level INTEGER NOT NULL`, `created_by UUID`,
  `organization_id UUID NOT NULL` all present.
- `acknowledged_by` / `dismissed_by` / `escalated_by` / `status_changed_at` are
  **absent** today (this migration adds them) — confirmed via
  `information_schema.columns`-equivalent probe. Task 1's migration is correct and
  ready to apply.

### briefs — Task 2 assumptions FALSIFIED (blocker)

The plan's `<read_first>` (and downstream 73-02/73-03/73-05) assume a `briefs` table
with `dossier_id`, `content_en JSONB`, `content_ar JSONB`, and a
`content_en ? 'summary' AND ? 'sections'` CHECK. **The live `briefs` table has none
of these.**

- Live `briefs` columns: `id, type(varchar), target_entity(jsonb), purpose(text),
audience(jsonb), parameters(jsonb), content(jsonb), generation(jsonb), usage(jsonb),
created_at, updated_at, created_by(uuid), last_modified_by(uuid), version(int),
tenant_id(uuid), is_deleted(bool), deleted_at, title(varchar), summary(text),
attachments(jsonb), intelligence_report_id(uuid), country_id(uuid),
organization_id(uuid), status(brief_status enum), search_vector, embedding(vector),
engagement_dossier_id(uuid), expires_at, freshness_status`.
- **Live NOT-NULL-no-default set (must be supplied on INSERT):**
  `type, target_entity, purpose, audience, parameters, content, generation,
created_by, last_modified_by, version, tenant_id, is_deleted, status`.
  (`id`, `created_at`, `updated_at` are defaulted.)
- Direct probes: `content_en` → **MISSING** (`PGRST204`); `content_ar` → **MISSING**;
  `dossier_id` → **MISSING**; `generated_by_user_id` → **MISSING**. Present:
  `created_by`, `tenant_id`, `engagement_dossier_id`, `content`, `target_entity`,
  `audience`, `generation`, `purpose`, `version`, `status`.

**Consequence:** `CREATE FUNCTION persist_brief(p_dossier_id, p_content_en JSONB,
p_content_ar JSONB, p_engagement_dossier_id)` inserting `dossier_id/content_en/
content_ar/created_by` would fail at first call (`column content_en does not exist`).
The whole-phase brief slice (73-02 `propose_brief` `{summary,sections}` draft shape,
73-03 `rpc('persist_brief', {p_content_en,p_content_ar})`, 73-05 `briefs.created_by`
assertion) is built on a `briefs` schema that does not exist on staging. Picking a
substitute column mapping (e.g. folding bilingual content into the single
`content jsonb`, or synthesizing `type/target_entity/audience/generation`) is a brief
**data-model** decision that ripples through three downstream plans → Rule 4, user
decision required. See checkpoint below + `deferred-items.md` (DEFER-73-01-A/B).

## Apply commands for the operator (Supabase MCP unavailable this session)

The Supabase MCP tools (`mcp__supabase__apply_migration`, `…__list_tables`,
`…__execute_sql`) are **not exposed to the executor agent** in this session (the
upstream agent-tool-stripping bug). CLI fallbacks were attempted and all blocked:
`psql` to pooler → `password authentication failed`; direct DB host → timeout;
`supabase db push --linked --dry-run` → aborts ("Remote migration versions not found
in local migrations directory", ~600 remote-only versions; would need
`supabase migration repair` first — out of scope). See `deferred-items.md` DEFER-73-01-C.

**Task 1 — apply via Supabase MCP `apply_migration`:**

- name: `phase73_signal_actor_columns`
- query: the full contents of
  `supabase/migrations/20260620000001_phase73_signal_actor_columns.sql`.

**Post-apply verification (Task 1), via MCP `execute_sql`:**

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'intelligence_event'
  AND column_name IN ('acknowledged_by','dismissed_by','escalated_by','status_changed_at')
ORDER BY column_name;
-- expect 4 rows; the three *_by are uuid/nullable, status_changed_at is timestamptz/nullable.
```

**Task 2 — DO NOT apply yet.** The `persist_brief` migration was intentionally not
written because its prescribed contract is impossible against the live `briefs` table.
It must be re-specified after the brief data-model decision (see checkpoint).

## Deviations from Plan

### Blocked / escalated (not auto-fixed)

1. **[Rule 4 - Architectural] Task 2 `persist_brief` not implemented as specified.**
   - Found during: Task 2 live-schema verification.
   - Issue: live `briefs` has no `content_en`/`content_ar`/`dossier_id`; the prescribed
     RPC + the whole-phase brief contract assume a non-existent schema.
   - Action: STOP, escalate as a `checkpoint:decision` (below). No substitute RPC
     fabricated (would break 73-02/73-03/73-05).

### Out-of-scope discoveries (logged, not fixed)

- DEFER-73-01-A: deployed `dossiers-briefs-generate` edge fn INSERTs to non-existent
  `briefs` columns — dead AI brief path in prod (pre-existing).
- DEFER-73-01-B: repo `briefs` migration history diverges from the live table.
- DEFER-73-01-C: Supabase migration ledger out of sync; `supabase db push` blocked.

## CHECKPOINT — decision required (Task 2 brief data model)

See the structured checkpoint returned to the orchestrator. Summary of options:

- **A) Re-point the brief path to the LIVE `briefs` schema** (recommended): rewrite
  Task 2 `persist_brief` to insert the live columns (single `content jsonb` carrying
  bilingual `{ en:{summary,sections}, ar:{summary,sections} }`, plus
  `type/target_entity/audience/purpose/generation/tenant_id/last_modified_by/version/
status`), and revise 73-02/73-03/73-05 to that shape. Keeps INVOKER + caller-JWT
  keystone; no production schema change. Needs the user to confirm the JSON envelope
  - how `type/target_entity/audience/purpose/generation` are populated for an
    agent-generated brief, and which tenant source (`tenant_id` vs
    `tenant_isolation.get_current_tenant_id()`).
- **B) ALTER the live `briefs` table** to add `content_en`/`content_ar`/`dossier_id`
  to match the plan — a schema change to a populated production table; also must
  reconcile with the existing `dossiers-briefs-generate` consumer. Higher blast radius.
- **C) Defer the brief write op** out of P73 (drop to 3 writes), persist_brief + brief
  card land in a follow-up once the brief data model is settled. Contradicts locked
  D-01 (all 4) — needs explicit user sign-off to change scope.

## Self-Check: PASSED

- `supabase/migrations/20260620000001_phase73_signal_actor_columns.sql` — FOUND.
- `.planning/phases/73-agent-platform-writes-generative-ui/deferred-items.md` — FOUND.
- Commit `e8cd2b61` — FOUND in `git log`.
- Task 2 migration file intentionally absent (blocked) — consistent with checkpoint.
