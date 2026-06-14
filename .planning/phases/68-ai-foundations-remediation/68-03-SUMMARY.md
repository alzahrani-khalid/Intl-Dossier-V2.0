---
phase: 68-ai-foundations-remediation
plan: 03
subsystem: database
tags: [supabase, rls, pgvector, hnsw, edge-function, security, search]

requires:
  - phase: 68-02
    provides: canonical get_user_clearance_level() reading profiles.clearance_level
provides:
  - search_semantic_clearance_gated (SECURITY INVOKER, vector(1024), clearance-gated)
  - search_entities_fulltext flipped to SECURITY INVOKER (fulltext leak closed)
  - HNSW index on ai_embeddings.embedding
  - search-semantic edge fn deployed (native-1024 query path, user-JWT clients)
  - get_function_security test helper RPC
affects: [68-05, 68-08]

tech-stack:
  added: []
  patterns:
    - 'Clearance-gated retrieval RPCs are SECURITY INVOKER; edge fn calls them via anon-key + user-JWT client so RLS applies'

key-files:
  created:
    - supabase/migrations/20260614000002_p68_search_invoker_rpc.sql
    - supabase/migrations/20260614000003_p68_fulltext_invoker.sql
  modified:
    - supabase/functions/search-semantic/index.ts

key-decisions:
  - 'DEVIATION: fulltext fix is an ALTER FUNCTION ... SECURITY INVOKER on the existing search_entities_fulltext, NOT the PATTERNS new-RPC joining ai_embeddings — the latter would break the keyword fallback (empty table) and violate D-07'
  - 'Edge fn keyword + semantic calls moved onto an anon-key user-JWT client; service-role bypasses RLS so INVOKER mode is only effective under the user client'
  - 'owner_type={ticket,artifact} != dossier: the owner_id->dossiers.id join is the query CONTRACT; ai_embeddings is empty, data population is later v7.0 work'
  - 'Semantic result titles left empty (new RPC returns no titles); enrichment deferred'

patterns-established:
  - "New retrieval RPCs lock SECURITY INVOKER with a 'NEVER DEFINER' comment (v7.0 guarantee)"

requirements-completed: [REMED-02]

duration: 40min
completed: 2026-06-14
---

# Phase 68 — Plan 03 Summary

**search_semantic_clearance_gated (SECURITY INVOKER, vector(1024), clearance-gated) and an HNSW index are live on staging; the keyword-search DEFINER leak is closed by flipping search_entities_fulltext to INVOKER; the edge function drops pad/truncate and runs every clearance-sensitive RPC under the caller's JWT.**

## Performance

- **Duration:** ~40 min
- **Completed:** 2026-06-14
- **Tasks:** 4 (RPC migration, edge fn, apply+verify+deploy, A1 fulltext remediation)
- **Files modified:** 3 (2 created, 1 modified)

## Task Commits

1. **Tasks 1+2+4 source (migrations 002/003 + edge fn)** — `fb5088b9` (feat)

## A1 result (from 68-01) + SQL verification — VERBATIM (staging `zkrcjzdemdmwhearhfgg`)

**A1: `search_entities_fulltext` was SECURITY DEFINER (prosecdef=true)** → Task 4 remediation REQUIRED. Actioned this wave.

Post-apply pg_proc / pg_indexes state:
| Check | Result | Expected |
| ----- | ------ | -------- |
| `prosecdef` of `search_semantic_clearance_gated` | **false** (INVOKER) | false ✅ |
| `prosecdef` of `search_entities_fulltext` (after flip) | **false** (INVOKER) | false ✅ |
| `prosecdef` of `get_function_security` | **false** (INVOKER) | — ✅ |
| `search_entities_semantic` still exists | **1** (preserved, uncalled) | 1 ✅ |
| `idx_ai_embeddings_hnsw` exists | **1** | 1 ✅ |

Pre-flight schema facts: `ai_embeddings.embedding` = vector(1024); `owner_id` = uuid; `dossiers` has `is_active` (bool), `sensitivity_level` (int), and **`name_en`/`name_ar`** (NOT title\_\*).

`vitest run tests/integration/search-clearance.test.ts` → **1 passed | 1 todo** (REMED-02 prosecdef assertion GREEN). Edge fn deployed: **version 10, ACTIVE, verify_jwt=true**.

## Deviations from Plan

### 1. [Correctness vs D-07] Fulltext remediation by ALTER, not the PATTERNS new-RPC

- **Found during:** Task 2/4 reading the edge fn + dossiers schema.
- **Issue:** The plan's Task-4 RPC joined `ai_embeddings` (EMPTY) and returned a dossier shape. Repointing the keyword fallback to it would have made the fallback return nothing — violating must-have D-07 ("fallback path unchanged and intact") — and it referenced `title_en/title_ar`, which don't exist on `dossiers` (they're `name_en/name_ar`), so the apply would have failed.
- **Fix:** `ALTER FUNCTION search_entities_fulltext(...) SECURITY INVOKER` (body/signature/shape untouched) + move the edge-fn fulltext calls onto the user-JWT client. This closes the leak for ALL user-JWT callers (broader than one edge fn), is a no-op for service-role callers, and preserves the fallback.
- **Committed in:** `fb5088b9` (migration 003 + edge fn).

### 2. [Data model] owner_type/dossier join is a forward contract

- `embedding_owner_type` enum = {ticket, artifact} and `ai_embeddings` is empty. The RPC's `owner_id -> dossiers.id` join + `owner_type = ANY(p_entity_types)` is the **query contract**; valid SQL that returns 0 rows today. Populating dossier-content embeddings and reconciling owner_type is later v7.0 work. The security property (INVOKER + clearance gate) is independent of data shape.

### 3. [Minor] Semantic result titles empty

- The new RPC returns `(entity_id, owner_type, similarity_score, sensitivity_level)` — no titles. Edge-fn mapping sets `title_en/ar: ''`. Title enrichment deferred (no rows to enrich yet).

---

**Total deviations:** 3 (1 correctness-critical, 2 documented-forward). No scope creep; security goal fully met.

## Issues Encountered

- Deployed edge fn (v9) was far behind the repo (placeholder zero-vectors, no AnythingLLM). Deployed the current repo version (with my edits), which also brings the AnythingLLM embedding path live. Bundle named `functions/...` to resolve `../_shared/cors.ts`; verify_jwt preserved (true).
- Migration-history note: migration 002 was applied via `apply_migration` AFTER a small comment reword; the committed file matches the applied SQL (functionally identical).

## Next Phase Readiness

- REMED-02 closed on staging (semantic + fulltext both INVOKER + caller-gated). Wave 4 (68-05 embeddings write path) can build on the HNSW index + vector(1024) column.
- 68-05 obligation: seed a persistent 1024-dim ai_embeddings fixture so embedding-dimension.test.ts flips GREEN.

---

_Phase: 68-ai-foundations-remediation_
_Completed: 2026-06-14_
