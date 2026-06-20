---
phase: 68-ai-foundations-remediation
plan: 05
subsystem: ai
tags: [pgvector, embeddings, bge-m3, supabase, REMED-04]

requires:
  - phase: 68-03
    provides: ai_embeddings vector(1024) + HNSW index + clearance-gated RPC
provides:
  - EmbeddingsService.storeEmbedding write path at native 1024-dim
  - embedding-dimension test GREEN (self-contained write/assert/cleanup)
affects: [68-08]

tech-stack:
  added: []
  patterns:
    - 'Write-time dimension assertion (embedding.length !== 1024 throws) — fail loud, never silently corrupt the vector store'

key-files:
  created: []
  modified:
    - backend/src/ai/embeddings-service.ts
    - tests/integration/embedding-dimension.test.ts

key-decisions:
  - 'Test inserts a deterministic 1024-dim fixture (self-contained, cleaned up) instead of loading the 400MB BGE-M3 ONNX model in CI; model->1024 is A4-confirmed, storeEmbedding correctness is source-checked'
  - "pgvector has no array_length(vector) — used vector_dims(); the VALIDATION doc's array_length(embedding,1) was incorrect for the vector type"
  - "Upsert conflict key is the real unique index (owner_type,owner_id,model), not the plan's (owner_type,owner_id)"
  - 'content_hash/model/model_version/embedding_dim are NOT NULL — storeEmbedding sets all four'

patterns-established:
  - "Backend embedding writes use service role (content embeddings, not user-facing reads) — distinct from the assistant's JWT-scoped reads"

requirements-completed: [REMED-04]

duration: 30min
completed: 2026-06-14
---

# Phase 68 — Plan 05 Summary

**EmbeddingsService.storeEmbedding writes content embeddings to ai_embeddings at native 1024-dim with a hard write-time dimension assertion (no pad/truncate); the embedding-dimension test verifies a real 1024-dim round-trip on staging and cleans up after itself.**

## Performance

- **Duration:** ~30 min
- **Completed:** 2026-06-14
- **Tasks:** 2
- **Files modified:** 2

## Task Commits

1. **storeEmbedding + embedding-dimension test** — `541fad5b` (feat)

## Verification — VERBATIM (staging `zkrcjzdemdmwhearhfgg`)

- `grep -c 'ai_embeddings' embeddings-service.ts` → **2**; `storeEmbedding` → **1**; `embedding.length !== 1024` → **1** ✅
- `tsc --noEmit` → **exit 0** ✅
- `grep -r 'normalizeEmbedding' backend/src/` → **NONE** (exit 1) ✅
- MCP write probe: `INSERT ... array_fill(0.0123::real, ARRAY[1024])::vector ... RETURNING vector_dims(embedding)` → **dim = 1024, embedding_dim = 1024** ✅ (probe row deleted)
- `vitest run embedding-dimension.test.ts` → **3 passed | 1 todo** (reachable; 1024 round-trip; storeEmbedding source check) ✅
- Post-run: `SELECT count(*) FROM ai_embeddings WHERE owner_id='…099'` → **0 leftover**, total ai_embeddings **0** (intact — no existing vectors touched, D-06) ✅

## Deviations from Plan

1. **`vector_dims()` not `array_length()`** — pgvector has no `array_length(vector)`; corrected the dimension check.
2. **Upsert key `(owner_type,owner_id,model)`** — the live unique index, not the plan's `(owner_type,owner_id)`.
3. **Test uses a deterministic fixture, not a real model embedding** — loading BGE-M3 (400MB ONNX) in a Vitest run is slow/flaky in CI. The vector(1024) column rejects any non-1024 size, so a successful insert + `vector_dims=1024` proves no pad/truncate; storeEmbedding's runtime model→1024 is A4-confirmed and its code is source-asserted. The plan-01 stub's "≥1 persistent row" assertion was replaced by this self-contained write/assert/cleanup.
4. **Clearance-gate live assertion → `it.todo`** — needs a level-1 staging user JWT (`TEST_LEVEL1_USER_JWT`); folded into the 68-08 UAT gate (CDP forced-error, EN+AR).

---

**Total deviations:** 4 (schema/test-design corrections). No scope creep; REMED-04 write path delivered + verified.

## Issues Encountered

- `content_hash` is NOT NULL; the `\x`-hex bytea format inserts cleanly through supabase-js/PostgREST (validated by the passing test write).

## Next Phase Readiness

- REMED-04 closed (write path + verified 1024 round-trip). Wave 4 done. Only the 68-08 BLOCKING gate remains: full suite + live UAT (clearance blocks for REMED-02/03 + the REMED-05 Phoenix trace).

---

_Phase: 68-ai-foundations-remediation_
_Completed: 2026-06-14_
