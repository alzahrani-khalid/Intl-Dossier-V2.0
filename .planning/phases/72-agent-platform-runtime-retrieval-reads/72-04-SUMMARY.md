---
phase: 72-agent-platform-runtime-retrieval-reads
plan: 04
subsystem: backend
tags: [rag, re-embed, bge-m3, halfvec, pgvector, chunking, backfill, clearance, supabase, bullmq]

# Dependency graph
requires:
  - phase: 72-03
    provides: rag_chunks halfvec(1024) store + hybrid_rag_search INVOKER RPC + per-source sensitivity-sync trigger + mastra RLS (authored)
  - phase: 68-ai-foundations-remediation
    provides: the 1024 storeEmbedding guard pattern (no pad/truncate), clearance model (profiles.user_id/clearance_level)
provides:
  - The three 72-03 migrations APPLIED + verified live on staging (rag_chunks, hybrid_rag_search INVOKER, mastra RLS)
  - reembed-rag-chunks.ts — one-shot backfill (chunk + embed 6 source types into rag_chunks at bge-m3 1024-dim, idempotent upsert, fail-closed sensitivity)
  - chunk-source-content.ts — pure word-window chunking util (per-language, contiguous chunk_index, overlap)
affects: [72-06, 72-09]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Re-embed leaves sensitivity_level NULL and lets the DB BEFORE-INSERT trigger resolve it fail-closed (NOT NULL), instead of re-encoding the doc-vs-live column-type ambiguity in app code'
    - 'parent_dossier_id set per source for the trigger anchor (dossier reads source_id directly; position/after_action/brief/document/signal resolve from the owning dossier)'
    - 'Single config-driven TEI /embed boundary (embedChunk) is the only network seam; unit-mocked, native 1024-dim asserted (throw, never pad/truncate)'
    - 'Idempotent upsert on (source_type,source_id,chunk_index) so the 72-09 seed step re-runs the same job with no duplication'

key-files:
  created:
    - backend/src/jobs/reembed-rag-chunks.ts
    - backend/src/jobs/chunk-source-content.ts
    - backend/tests/unit/reembed-rag-chunks.test.ts
  modified: []

key-decisions:
  - 'Live RUN of the re-embed is DEFERRED to the 72-09 deploy gate (bge-m3 TEI is GPU-served, unavailable locally) — author + unit-test only this plan'
  - 'sensitivity_level sent NULL on every insert; the 72-03 trigger resolves it per source (fail-closed) — never defaulted in app code (T-72-04-03)'
  - 'Test placed in tests/unit/ (NOT src/jobs/ per the plan files list) because backend/vitest.config.ts only includes tests/unit/** — a test under src/ would silently never run (Rule 3)'
  - 'v1 run resolvers cover dossiers/positions/aa_commitments (the only non-empty sources on staging); signals/briefs/documents are 0-rows and added in the 72-09 seed step — document source deferred pending its live dossier-link column (72-03 ⚠ flag)'
  - 'One-shot script (CLI entry, import-guarded), not a BullMQ job — corpus is ~23 rows; the colon-jobId landmine is therefore N/A'

requirements-completed: [AGENT-05, AGENT-04]

# Metrics
duration: 22min
completed: 2026-06-18
---

# Phase 72 Plan 04: Re-embed Backfill into rag_chunks Summary

**The three 72-03 retrieval/memory migrations are APPLIED and verified live on staging, and the one-time bge-m3 1024-dim re-embed backfill (chunking util + backfill job + 12 unit tests) is authored and green — its live run deferred to the 72-09 deploy gate where the real TEI container exists.**

## Performance

- **Duration:** ~22 min
- **Completed:** 2026-06-18
- **Tasks:** 2 (Task 1 by orchestrator; Task 2 authored here)
- **Files created:** 3 (826 insertions)

## Task 1 — Apply the three 72-03 migrations to staging (DONE by orchestrator, verified live)

Task 1 was executed by the orchestrator via the Supabase MCP (the executor has no MCP — the P69/P71/72-03 precedent). All three migrations applied to staging `zkrcjzdemdmwhearhfgg` and verified live **2026-06-18**:

| Proof                                   | Result                                                                                                                                        | Requirement              |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `rag_chunks.embedding` type             | **`halfvec(1024)`** ✓                                                                                                                         | AGENT-05 store shape     |
| `rag_chunks` RLS enabled                | ✓                                                                                                                                             | clearance floor          |
| clearance policy form                   | `sensitivity_level <= (SELECT clearance_level FROM profiles WHERE user_id = auth.uid())` ✓ — **trap-free** (`user_id`, not the deny-all `id`) | AGENT-03/04              |
| sensitivity-sync trigger present        | ✓ (1 trigger)                                                                                                                                 | T-72-04-03 fail-closed   |
| `rag_chunks` row count                  | 0 (empty until backfilled)                                                                                                                    | —                        |
| `hybrid_rag_search` `prosecdef`         | **false (SECURITY INVOKER)** ✓                                                                                                                | AGENT-04                 |
| `hybrid_rag_search` anon EXECUTE grants | **0 (REVOKEd)** ✓                                                                                                                             | least-privilege          |
| `mastra_threads_rls`                    | applied, **no-op as expected** — `mastra_threads`/`mastra_messages` do not exist yet (runtime not booted)                                     | D-08 (deferred re-apply) |

**Carry-forward (the live-verified facts Task 2 builds on):**

- `dossiers.sensitivity_level` is **INTEGER 1/2/3** live (the old `CREATE TABLE` TEXT was superseded). The re-embed delegates the exact read to the DB trigger, so the job never re-encodes this.
- **`mastra_threads_rls` MUST be re-applied after agent-runtime first boots** (so `@mastra/pg` has created the tables). Until then it is a deliberate no-op. **This is the single open carry-forward into 72-05/72-09.**

## Task 2 — One-time re-embed backfill (authored; RUN DEFERRED to 72-09)

### `backend/src/jobs/chunk-source-content.ts`

A small, pure, deterministic chunking util (no I/O, no embedding):

- `chunkSourceContent(fields)` splits each labelled text field into ~`WORDS_PER_CHUNK` (350) word windows with `CHUNK_OVERLAP_WORDS` (40) overlap.
- `chunk_index` is **contiguous across the whole row** (not reset per field) so it stays unique under the `rag_chunks UNIQUE (source_type, source_id, chunk_index)` constraint.
- EN and AR text are chunked **separately** (each chunk carries its `content_lang`) so it feeds the correct `content_tsv_en|ar` GENERATED column. Blank/nullish fields contribute nothing.

### `backend/src/jobs/reembed-rag-chunks.ts`

The one-shot backfill:

- **Embedder boundary:** `embedChunk(text)` POSTs to `${TEI_EMBED_URL}/embed` (`{ inputs }` → `number[][]`), the production bge-m3 TEI server (72-RESEARCH §Serving Substrate). This is the **only** network seam — unit-mocked.
- **AGENT-05 dimension guard:** every embedding is asserted `=== 1024` and **throws on mismatch** (`Refusing to pad/truncate`). bge-m3 is natively 1024-dim; a wrong size means a misconfigured model and must fail loudly. The retired-P68 1536 pad is never reintroduced.
- **AGENT-04 store target:** idempotent `upsert(rows, { onConflict: 'source_type,source_id,chunk_index' })` into `rag_chunks` — so the 72-09 seed step re-runs the same job and replaces rather than duplicates.
- **Fail-closed sensitivity (T-72-04-03):** `sensitivity_level` is sent **NULL** on every insert; the 72-03 BEFORE-INSERT/UPDATE trigger resolves it per source. `parent_dossier_id` is set so resolution always has an anchor:
  - `dossier` → `parent_dossier_id = NULL` (source_id IS the dossier; trigger reads `dossiers.sensitivity_level` directly).
  - `position` → `parent_dossier_id` = first linked dossier (via `position_dossier_links`); the trigger still takes `MAX` over all links.
  - `after_action` → `parent_dossier_id` = `aa_commitments.dossier_id` (NOT NULL FK).
  - `signal`/`brief`/`document` → resolvers reserved for the 72-09 seed step (0 rows on staging today).
    Never defaulted: an unresolvable row hits the NOT NULL constraint and surfaces here (the test asserts the upsert error is surfaced, not swallowed).
- **Service-role write (D-10 background carve-out):** defaults to `supabaseAdmin`. `rag_chunks` has no authenticated INSERT policy — only this trusted no-user backfill writes. Documented at the call site; service-role MUST NOT leak into any tool/request path (reads go through the INVOKER RPC under the caller JWT).
- **Import-guarded CLI entry:** `main()` only runs when invoked directly (`process.argv[1]` check), so 72-06 / tests can import the module without triggering a run.

### Source text columns (verified against live schema)

| source_type    | text fields chunked                                 | owning-dossier link                       |
| -------------- | --------------------------------------------------- | ----------------------------------------- |
| `dossier`      | `name_en/ar` + `summary_en/ar`                      | — (source_id IS the dossier)              |
| `position`     | `title_en/ar` + `content_en/ar` + `rationale_en/ar` | `position_dossier_links.dossier_id`       |
| `after_action` | `description` (single-lang free text → 'en' lane)   | `aa_commitments.dossier_id` (NOT NULL FK) |

### `backend/tests/unit/reembed-rag-chunks.test.ts` — 12 tests, all green

- **chunking (4):** empty/nullish → []; short text → 1 chunk + correct lang; contiguous global `chunk_index` across fields; long text windows with the expected overlap + unique indices.
- **embedChunk TEI boundary (3):** throws a clear "TEI_EMBED_URL is not configured" when unset (the deferred-run guard); POSTs to `{url}/embed` with `{ inputs }` and returns vector[0]; throws on a non-OK TEI status.
- **backfill (5):** dossier rows embed at 1024-dim, `parent_dossier_id` NULL, `sensitivity_level` NULL, embedding stored as a 1024-element pgvector literal, conflict target `source_type,source_id,chunk_index`; position/after_action set `parent_dossier_id` to the owning dossier; **wrong-dim (768) embedding THROWS** (AGENT-05 never-pad proof); no-text rows are skipped (no embed, no upsert); a DB upsert error is surfaced not swallowed.

## RUN DEFERRED — the live backfill happens at the 72-09 deploy gate

The corpus is tiny (~23 live rows) but **bge-m3 TEI is not available locally (no GPU)**, so this plan **authors + unit-tests only**. The live run is part of the 72-09 sequence: **seed → re-embed → observe → restore**. After the live run, 72-09 asserts the AGENT-05 dimension proof — `SELECT count(*) FROM rag_chunks WHERE vector_dims(embedding) <> 1024` must return 0 — via the Supabase MCP. No `scripts/verify-rag-chunks-dims.sql` was authored here because the run (and therefore the assertion) is deferred to 72-09; the equivalent check is the single SQL above.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Test relocated to tests/unit/ so it actually runs**

- **Found during:** Task 2 (wiring the test runner).
- **Issue:** The plan's `files_modified` lists `backend/src/jobs/reembed-rag-chunks.test.ts`, but `backend/vitest.config.ts` `include` is `tests/unit/**`, `tests/services/**`, etc. — it does NOT match `src/**/*.test.ts` (three existing `src/**/__tests__/*.test.ts` files confirm the pattern: they don't run under the unit config either). A test authored at the planned path would silently never execute → a false-green.
- **Fix:** Authored the runnable test at `backend/tests/unit/reembed-rag-chunks.test.ts` (mirrors `brief-generator-jwt.test.ts`). The plan's verify grep targets the JOB file (`reembed-rag-chunks.ts`), which is at the planned path, so the grep criterion is unaffected.
- **Files:** `backend/tests/unit/reembed-rag-chunks.test.ts`.
- **Verification:** `pnpm exec vitest run tests/unit/reembed-rag-chunks.test.ts` → 12 passed.
- **Committed in:** `0d507497`.

**2. [Rule 3 - Blocking] Embedded-relation type cast through unknown**

- **Found during:** Task 2 typecheck.
- **Issue:** Selecting `positions(... position_dossier_links(dossier_id))` widens the row under Supabase's generated types to a `GenericStringError` union; a direct `as {...}` cast errored TS2352 (insufficient overlap).
- **Fix:** Cast through `unknown` first (`row as unknown as {...}`) with a comment — the row shape is known at runtime.
- **Files:** `backend/src/jobs/reembed-rag-chunks.ts`.
- **Verification:** `tsc --noEmit` → no errors in the new files.
- **Committed in:** `0d507497`.

**Total deviations:** 2 auto-fixed (both Rule 3 blocking). No scope creep — the job contract (1024 guard, rag_chunks upsert, per-source sensitivity) is exactly as planned.

## Deviation from the plan's BullMQ framing (noted, not a code change)

The plan/interfaces mention a BullMQ enqueue (hyphen jobIds). Given the ~23-row one-shot corpus, this was authored as a **plain import-guarded CLI script**, not a BullMQ job (the planner explicitly allowed "a script OR a single BullMQ job"). Consequence: **no `jobId` exists, so the BullMQ colon-jobId landmine is N/A** — confirmed by grep (no `jobId` in the job).

## Threat surface

No new security surface beyond the plan's threat model. The service-role write is the documented T-72-04-02 carve-out (accepted); the 1024 guard mitigates T-72-04-01 (dimension drift); fail-closed per-source sensitivity mitigates T-72-04-03 (the live L1/L3 reduction proof remains a 72-09 gate, requiring seeded rows).

## Known Stubs

None that block the plan goal. `signal`/`brief`/`document` source resolvers are intentionally not in the v1 run path because those tables are 0-rows on staging and (for `document`) the live dossier-link column is an unconfirmed 72-03 flag — they are added in the 72-09 seed step. The other 5 source types' contract stands and the job is idempotent.

## Flags for downstream

- **72-09:** run the backfill on-staging against the real TEI container (seed → re-embed → observe → restore); then assert `vector_dims(embedding)=1024` over every row (the deferred AGENT-05 proof). Add signal/brief/document resolvers if those sources are seeded; confirm the live `document`→dossier link column before enabling the `document` source.
- **72-05/72-09:** **re-apply `mastra_threads_rls`** after agent-runtime first boots (the tables only exist then); confirm the trigger NOTICE resolved the owner column.
- **72-06:** the tool layer must `SET LOCAL hnsw.iterative_scan='relaxed_order'` (+ `hnsw.max_scan_tuples`) before calling `hybrid_rag_search` so the RLS post-filter doesn't collapse recall. NOT this job's concern.

## Self-Check: PASSED

- `backend/src/jobs/reembed-rag-chunks.ts` — FOUND
- `backend/src/jobs/chunk-source-content.ts` — FOUND
- `backend/tests/unit/reembed-rag-chunks.test.ts` — FOUND
- Commit `0d507497` — FOUND in git log
- 12 unit tests pass; `tsc --noEmit` clean on new files; `eslint` clean (0 warnings)
- Plan verify greps: `rag_chunks` ✓ and `1024` ✓ both present in the job file

---

_Phase: 72-agent-platform-runtime-retrieval-reads_
_Completed: 2026-06-18_
