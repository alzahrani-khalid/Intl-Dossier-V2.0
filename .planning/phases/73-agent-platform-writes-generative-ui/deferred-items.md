# Phase 73 — Deferred / Out-of-Scope Discoveries

Items found during execution that are NOT caused by this phase's changes and are
out of scope per the executor scope boundary. Logged, not fixed.

## DEFER-73-01-A — Live `dossiers-briefs-generate` edge function INSERTs to non-existent `briefs` columns (pre-existing prod break)

- **Found during:** 73-01 Task 2 live-schema verification (2026-06-20).
- **What:** `supabase/functions/dossiers-briefs-generate/index.ts` L298–310 inserts
  into `briefs` with `dossier_id`, `content_en`, `content_ar`, `generated_by`,
  `generated_by_user_id`. The **live** `briefs` table on staging
  (`zkrcjzdemdmwhearhfgg`) has **none** of those columns. The function is deployed
  (OPTIONS → HTTP 200) but its brief INSERT raises `PGRST204 / column does not exist`
  at runtime — the AI brief-generate path is dead in production.
- **Evidence:** PostgREST OpenAPI + safe invalid-insert probes confirm the live
  `briefs` columns are `id, type, target_entity(jsonb), purpose(text),
audience(jsonb), parameters(jsonb), content(jsonb), generation(jsonb), usage,
created_at, updated_at, created_by, last_modified_by, version, tenant_id,
is_deleted, deleted_at, title, summary, attachments, intelligence_report_id,
country_id, organization_id, status(brief_status), search_vector, embedding,
engagement_dossier_id, expires_at, freshness_status`. NOT NULL-no-default set:
  `type, target_entity, purpose, audience, parameters, content, generation,
created_by, last_modified_by, version, tenant_id, is_deleted, status` (+ id/created_at/updated_at defaulted).
- **Why deferred:** Not caused by 73-01; fixing the edge function (or reconciling the
  `briefs` schema) is the very decision blocking 73-01 Task 2 and is being escalated
  to the user as a checkpoint. Whoever resolves the brief data-model fork should also
  repair or retire this edge function.

## DEFER-73-01-B — `briefs` migration history diverges from the live table

- The repo contains three contradictory `briefs` definitions
  (`007_create_briefs.sql`, `20250930005_create_briefs_table.sql`, and the
  `engagement_briefs` VIEW in `20260110100001_engagement_brief_linking.sql`), and the
  **actual live shape matches none of them**. The migration that produced the live
  `briefs` table (the `type/target_entity/audience/generation/tenant_id/
last_modified_by/version` shape) is not present in the local migrations tree —
  consistent with prior MEMORY notes that staging schema was applied out-of-band via
  the Supabase MCP. Any future `briefs` work must treat the live schema as the source
  of truth, not the repo migrations.

## DEFER-73-01-D — `backend/src/services/brief.service.ts` also writes the dead `briefs` schema (P74 removal)

- **Found during:** 73-01 Task 2 reconciliation (2026-06-21).
- **What:** `backend/src/services/brief.service.ts` `BriefService.generateBrief()` (L132–154)
  INSERTs into `briefs` via `supabaseAdmin` (service-role) with columns from a DEAD schema
  (`entity_id`, `title_en`, `content_en`, `content_ar`, `template_id`, `sections`,
  `key_points`, `recommendations`, `generation_method`, `ai_model`, `confidence_score`,
  `review_status`) — none of which exist on the live `briefs` table. `reviewBrief()` (L211)
  UPDATEs `review_status`/`reviewed_by` (also dead columns). This Express path is an
  AnythingLLM-based generator like the `dossiers-briefs-generate` edge fn.
- **Status:** LEFT AS-IS for P74 (external-LLM retirement). P73's reconciliation does NOT
  touch the backend — the supported brief-write path is the `persist_brief` INVOKER RPC
  (frontend HITL commit). When P74 retires the AnythingLLM substrate it must also retire or
  re-point this service (and the `dossiers-briefs-generate` edge fn, gated off in P73).
- **Why deferred (not fixed in P73):** out of P73 scope (the agent/frontend HITL loop);
  this backend service is not invoked by the copilot write path and its dead INSERT is a
  pre-existing prod break, not caused by P73.

## DEFER-73-01-C — Supabase migration ledger badly out of sync (blocks `supabase db push`)

- `supabase db push --linked --dry-run` aborts with "Remote migration versions not
  found in local migrations directory" and lists ~600 remote-only versions. Pushing
  via the CLI would require a large `supabase migration repair` reconciliation first.
  Out of scope. The sanctioned apply channel for this repo is the Supabase MCP
  `apply_migration` (per CLAUDE.md), which records its own version IDs.

## DEFER-73-03-A — 73-01 migrations (signal actor columns + persist_brief) live-apply is operator/deploy-gated

- **Found during:** 73-03 execution (2026-06-21). The Supabase MCP tools are NOT exposed
  to the executor agent this session (same agent-tool-stripping as 73-01), so the live
  state of the two 73-01 migrations could not be verified or applied from here.
- **What 73-03 depends on at runtime:**
  - `intelligence_event.dismissed_by` / `escalated_by` / `status_changed_at`
    (migration `20260620000001_phase73_signal_actor_columns.sql`) — written by
    `useApproveWrite.commitSignalStatus`.
  - `persist_brief(p_dossier_id UUID, p_content JSONB, p_title TEXT, p_summary TEXT)
RETURNS UUID` + the additive `briefs.source_dossier_id` column + the
    `briefs_insert_via_dossier_edit` INSERT policy
    (migration `20260621090100_phase73_persist_brief.sql`) — called by
    `useApproveWrite.commitBrief`.
- **Status:** Both migration files are committed (`e8cd2b61`, `d17a20f5`/`ae5fff67`). The
  73-03 frontend targets the EXACT signatures/columns those migrations define. Until they
  are applied to staging (`zkrcjzdemdmwhearhfgg`) via the Supabase MCP `apply_migration`,
  the signal-status and brief commits will fail at runtime (the card shows its neutral
  error). The digest (`publish_digest`) and work-item (`tasks-create` →
  `work-item-dossiers`) commit paths use already-live RPCs/edge fns and work today.
- **Apply (operator, via Supabase MCP):** `apply_migration` for
  `phase73_signal_actor_columns` then `phase73_persist_brief` (full file contents). This is
  the phase-level deploy gate, consistent with the P72 GPU/re-embed deploy gate — it is
  surfaced here, not silently swallowed.
