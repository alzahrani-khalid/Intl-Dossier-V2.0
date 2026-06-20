---
phase: 72-agent-platform-runtime-retrieval-reads
plan: 03
subsystem: database
tags:
  [pgvector, halfvec, rag, hybrid-search, rrf, tsvector, rls, clearance, mastra, supabase, postgres]

# Dependency graph
requires:
  - phase: 72-01
    provides: keystone spike (JWT-reaches-tools), Wave-0 test infra, copilot i18n
  - phase: 68-ai-foundations-remediation
    provides: clearance model (1-4, profiles.clearance_level, user_id), INVOKER-only rule, indistinguishable-empty, get_function_security helper
  - phase: 69-signals
    provides: intelligence_event sensitivity_level (INTEGER) + the canonical user_id clearance RLS form
provides:
  - rag_chunks single hybrid-RAG store (halfvec(1024) + dual EN/AR tsvector + denormalized INTEGER sensitivity + HNSW + 2 GIN + clearance RLS)
  - per-source sensitivity-sync trigger (dossier/intelligence_event direct; signal/position/brief/after_action/document resolve from owning dossier; fail-closed)
  - hybrid_rag_search SECURITY INVOKER RPC (RRF k=60 over dense+sparse, RLS-before-rerank, indistinguishable-empty)
  - owner-only RLS on @mastra/pg mastra_threads/mastra_messages (guarded for runtime-created tables)
affects: [72-04, 72-05, 72-06, 72-08, 72-09, phase-73, phase-74]

# Tech tracking
tech-stack:
  added: [pgvector halfvec(1024), HNSW halfvec_cosine_ops, websearch_to_tsquery RRF fusion]
  patterns:
    - 'Denormalized clearance on the chunk row + plain RLS predicate (no per-query parent join) so INVOKER retrieval inherits the gate'
    - 'RRF k=60 over dense (HNSW cosine) + sparse (EN/AR tsvector) via FULL OUTER JOIN, RLS-before-rerank'
    - 'Per-source sensitivity-sync trigger that resolves clearance explicitly per source table, fail-closed (NOT NULL, never default)'
    - 'RLS on a library-managed table via a guarded DO block + dynamic column resolution from the live catalog'

key-files:
  created:
    - supabase/migrations/20260618_phase72_rag_chunks.sql
    - supabase/migrations/20260618_phase72_hybrid_rag_search.sql
    - supabase/migrations/20260618_phase72_mastra_threads_rls.sql
  modified: []

key-decisions:
  - 'rag_chunks is a NEW store (ai_embeddings left untouched — it is vector(1024), 0 rows, wrong owner_type enum); D-06 single store'
  - 'Denormalized sensitivity_level is NOT NULL with NO column DEFAULT — the sync trigger fails closed rather than over-expose (default-low) or deny-all (NULL)'
  - 'Most-restrictive-wins (MAX) when a source links to multiple dossiers (position/signal-via-junction)'
  - 'hybrid_rag_search SECURITY INVOKER so the rag_chunks RLS runs inside both CTEs under the caller JWT (the TEI reranker only sees RLS-passing rows)'
  - 'mastra RLS migration is guarded (DO block + to_regclass) + resolves the owner column dynamically — safe to apply before or after @mastra/pg provisions the tables'

patterns-established:
  - 'Pattern: clearance gate lives on the denormalized chunk column; the INVOKER RPC adds no clearance logic of its own — RLS is the floor'
  - 'Pattern: regconfig is required (not text) for a dynamic FTS config — (CASE ... END)::regconfig, never a bare CASE'

requirements-completed: [AGENT-04, AGENT-05]

# Metrics
duration: 35min
completed: 2026-06-18
---

# Phase 72 Plan 03: RAG/Memory Migrations Summary

**Authored the 3 retrieval/memory migrations — the new rag_chunks halfvec(1024) hybrid store with per-source clearance-sync, the hybrid_rag_search SECURITY INVOKER RPC (RRF k=60, RLS-before-rerank, indistinguishable-empty), and owner-only RLS on the @mastra/pg thread/message tables — all parse-validated against real PostgreSQL 17 but NOT yet applied.**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-06-18T09:34Z (approx)
- **Completed:** 2026-06-18T10:02Z
- **Tasks:** 3 (+ 1 auto-fix)
- **Files modified:** 3 migration files created (526 lines total)

## Accomplishments

- **rag_chunks store** — the single net-new retrieval store: `halfvec(1024)` bge-m3 embedding, dual EN/AR GENERATED `tsvector`, denormalized INTEGER `sensitivity_level` (1-4), `source_type`/`source_id`, `UNIQUE(source_type, source_id, chunk_index)`. Indexes: HNSW `halfvec_cosine_ops` (m=16/ef_construction=64) + 2 GIN (en/ar) + tenant/clearance btree. Clearance RLS via `profiles.user_id = auth.uid()` — the deny-all landmine (`profiles.id`) provably avoided.
- **Per-source sensitivity-sync trigger** — resolves each chunk's clearance from the owning row, explicitly per source: `dossier`/`signal` (intelligence_event) use their own INTEGER `sensitivity_level` directly; `position`/`brief`/`after_action`/`document` resolve from the owning dossier (most-restrictive `MAX` wins). Fail-closed: `NOT NULL` + no DEFAULT, so an unresolved row raises rather than over-exposing or deny-all'ing.
- **hybrid_rag_search RPC** — `SECURITY INVOKER` (never DEFINER), RRF k=60 over a dense (HNSW cosine) + sparse (EN/AR `ts_rank_cd`) candidate set fused by `FULL OUTER JOIN`. RLS on `rag_chunks` runs inside both CTEs under the caller JWT, so the tool-layer cross-encoder reranker only ever sees RLS-passing rows (RLS-before-rerank). `REVOKE` from PUBLIC/anon, `GRANT` authenticated. Indistinguishable-empty: the RETURNS columns carry no `clearance`/`filtered`/`restricted` field.
- **mastra owner-only RLS** — ENABLE RLS + owner-only policies (all 4 verbs) on `mastra_threads`/`mastra_messages`, keyed to the Mastra resource column = `auth.uid()::text`; messages owned via parent thread. Guarded with a DO block + `to_regclass` (the tables are auto-created at runtime by `@mastra/pg`), with dynamic owner-column resolution so it binds to whatever casing the library creates.

## Task Commits

Each task was committed atomically:

1. **Task 1: rag_chunks table + HNSW/GIN + clearance RLS + sensitivity-sync trigger** — `3735895d` (feat)
2. **Task 2: hybrid_rag_search SECURITY INVOKER RPC (RRF k=60)** — `a0d61d8e` (feat)
3. **Task 2 bugfix: regconfig cast (deviation Rule 1)** — `6d7f6263` (fix)
4. **Task 3: owner-only RLS on @mastra/pg thread/message tables** — `d3332a91` (feat)

## Files Created/Modified

- `supabase/migrations/20260618_phase72_rag_chunks.sql` — rag_chunks store + HNSW/GIN indexes + clearance RLS + per-source sensitivity-sync trigger (234 lines)
- `supabase/migrations/20260618_phase72_hybrid_rag_search.sql` — hybrid_rag_search SECURITY INVOKER RPC, RRF k=60 (119 lines)
- `supabase/migrations/20260618_phase72_mastra_threads_rls.sql` — owner-only RLS on mastra_threads/mastra_messages, guarded for runtime-created tables (173 lines)

## Confirmed live facts (recorded for 72-04)

- **`dossiers.sensitivity_level` is INTEGER 1/2/3** (live-verified on staging 2026-06-18 per RESEARCH L687; the 20250930002 L17 TEXT declaration was superseded). Used DIRECTLY — no text→int CASE.
- **`intelligence_event.sensitivity_level` is INTEGER** — used directly.
- **`profiles` = `user_id, clearance_level` — NO `id`.** All clearance reads use `user_id = auth.uid()`.
- **pgvector = 0.8.0** on staging → halfvec + HNSW + iterative scans available.

## Final per-source sensitivity mapping (the trigger)

| source_type    | clearance resolved from                                                            | link column (verified in migrations)                |
| -------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------- |
| `dossier`      | `dossiers.sensitivity_level` (INTEGER, direct; source_id IS the dossier)           | —                                                   |
| `signal`       | `intelligence_event.sensitivity_level` (direct); fallback MAX via the junction     | `intelligence_event_dossiers.event_id → dossier_id` |
| `position`     | MAX `dossiers.sensitivity_level` over linked dossiers                              | `position_dossier_links.position_id → dossier_id`   |
| `brief`        | owning `dossiers.sensitivity_level`                                                | `ai_briefs.dossier_id`                              |
| `after_action` | owning `dossiers.sensitivity_level`                                                | `aa_commitments.dossier_id`                         |
| `document`     | `parent_dossier_id → dossiers.sensitivity_level` (re-embed sets parent_dossier_id) | see ⚠ flag below                                    |

## Decisions Made

- **New rag_chunks, not ai_embeddings** — ai_embeddings is `vector(1024)`, 0 rows, with a `{ticket, artifact}` owner_type enum that doesn't fit the 6-source corpus; left untouched. rag_chunks is the single store (D-06).
- **Fail-closed sensitivity** — `sensitivity_level INTEGER NOT NULL` with NO column DEFAULT. The trigger only resolves when the writer left it NULL; if resolution fails, the NOT NULL constraint raises (surfacing the bad row to the re-embed job) rather than defaulting low (over-exposes) or NULL (deny-alls). This is the explicit RESEARCH L687 directive.
- **Most-restrictive-wins** — for sources linking to multiple dossiers, MAX(sensitivity_level) is used so a chunk is never under-classified.
- **Trigger is SECURITY DEFINER (D-10 cron carve-out)** — the re-embed runs as a trusted background context and must read parent (dossiers/intelligence_event) clearance regardless of role RLS to populate the denormalized value. `search_path` is pinned to `public, pg_temp`. The rag_chunks SELECT RLS remains the enforcement floor for every CALLER; the trigger only POPULATES at write time.
- **mastra RLS keyed off the resource column, not profiles** — thread ownership = `resourceId = auth.uid()::text` (the agent sets resourceId from the JWT user in 72-05); the broken `profiles.id` form is irrelevant here.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] websearch_to_tsquery config must be cast to regconfig**

- **Found during:** Task 3 verification (a real transactional parse of all 3 migrations against local PostgreSQL 17)
- **Issue:** The pre-written RESEARCH SQL (L548/L552) passes the FTS config as a `CASE WHEN p_lang='ar' THEN 'arabic' ELSE 'english' END` expression, which types as `text`. `websearch_to_tsquery` has signature `(regconfig, text)` and PostgreSQL does NOT implicitly cast `text → regconfig`, so the un-cast CASE raises `function websearch_to_tsquery(text, unknown) does not exist` at function creation. A string LITERAL first arg is special-cased to regconfig (which is why existing migrations' `websearch_to_tsquery('english', ...)` work), but a CASE expression is not — confirmed by reproducing the literal-OK / CASE-FAIL / cast-OK behavior locally, and by the codebase precedent where dynamic configs use a declared `regconfig` variable (`plainto_tsquery(p_language, ...)`).
- **Fix:** Added explicit `(CASE ... END)::regconfig` to all 3 call sites in the sparse CTE + a do-not-remove comment block.
- **Files modified:** supabase/migrations/20260618_phase72_hybrid_rag_search.sql
- **Verification:** Re-parsed all 3 migrations against PostgreSQL 17 → zero errors (excluding only the genuinely pgvector-dependent CREATE EXTENSION / HNSW opclass / `<=>` statements, validated on apply in 72-04).
- **Committed in:** `6d7f6263`

---

**Total deviations:** 1 auto-fixed (1 bug). **Impact on plan:** the fix is required for the RPC to be creatable at all — without it `CREATE FUNCTION hybrid_rag_search` would fail on apply in 72-04. No scope creep; the RPC contract (signature, RRF k=60, INVOKER, indistinguishable-empty) is unchanged.

## Issues Encountered

- **Executor lacks the Supabase MCP** (P69/P71 precedent — confirmed: the `execute_sql`/`apply_migration` tools are not exposed to the executor agent). This is expected and aligned with the plan: 72-03 AUTHORS only; the live probes were pre-run by the orchestrator (RESEARCH L679-687). I validated SQL syntax against a local PostgreSQL 17 instance instead (the `vector` extension is not installed locally, so the pgvector-only statements were excluded from the local parse and are validated on apply in 72-04).

## Flags for 72-04 (apply phase)

- **AUTHORED-NOT-APPLIED.** All three migrations are committed but NOT applied. Apply via Supabase MCP to staging `zkrcjzdemdmwhearhfgg` in 72-04 (Wave 3), together with the re-embed backfill.
- **⚠ `document` source dossier-link unconfirmed live.** The `documents`→dossier link column was not cleanly resolvable from migrations (documents appear polymorphic/entity-based) and `documents` has 0 rows on staging. The trigger resolves `document` clearance from `parent_dossier_id` (which the re-embed job must set from the document's owning dossier). 72-04 MUST confirm the exact `documents`→dossier link column when wiring the re-embed for documents (OCR text lives in `document_text_content.extracted_text_en/_ar`), or defer `document` from the v1 corpus (the other 5 sources stand).
- **mastra table column names resolved dynamically.** `mastra_threads`/`mastra_messages` do not exist on staging today (the runtime has not booted). The DO block resolves the owner column (`resourceId`|`resource_id`) and thread FK (`thread_id`|`threadId`) from the live catalog. 72-04 MUST re-apply this migration AFTER the agent-runtime first connects (so the tables exist) and confirm the resolved column names in the apply NOTICE output. If RLS is enabled with no policy (unresolvable column), that is fail-closed deny-all — re-resolve.
- **Re-embed must set `sensitivity_level` (or `parent_dossier_id`) on every insert.** The column is NOT NULL with no default; the trigger is a safety net, not a default. Empty source tables on staging (signals/events/briefs/documents = 0 rows) mean AGENT-05 (`vector_dims=1024`) and AGENT-03 (clearance-reduction) proofs require seeded rows in the 72-04/72-09 live-UAT seed step.
- **Tool-layer iterative-scan GUC.** Before calling hybrid_rag_search the tool must `SET LOCAL hnsw.iterative_scan='relaxed_order'` + `hnsw.max_scan_tuples` so the RLS post-filter inside the dense CTE doesn't collapse recall (pgvector 0.8). This is a session GUC the caller sets, not part of the STABLE function.

## Next Phase Readiness

- The data backbone for the copilot's retrieval + memory is authored and parse-clean. 72-04 applies all three + runs the re-embed; 72-05/06 wire the RAG tool + threads; 72-09 runs the AGENT-03/04/05 live proofs (INVOKER + dims=1024 + clearance-reduction + indistinguishable-empty).

## Self-Check: PASSED

- All 3 migration files exist on disk (rag_chunks, hybrid_rag_search, mastra_threads_rls).
- SUMMARY.md exists.
- All 4 task commits verified in git log: `3735895d`, `a0d61d8e`, `6d7f6263`, `d3332a91`.
- All 3 migrations parse + execute clean against PostgreSQL 17 (pgvector-only statements excluded — validated on apply in 72-04).

---

_Phase: 72-agent-platform-runtime-retrieval-reads_
_Completed: 2026-06-18_
