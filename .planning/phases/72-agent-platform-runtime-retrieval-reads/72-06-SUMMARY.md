---
phase: 72-agent-platform-runtime-retrieval-reads
plan: 06
subsystem: api
tags:
  [
    mastra,
    copilot,
    supabase,
    rls,
    jwt,
    rag,
    halfvec,
    tei,
    rerank,
    pgvector,
    zod,
    indistinguishable-empty,
    least-privilege,
  ]

# Dependency graph
requires:
  - phase: 72-01
    provides: the JWT keystone spike (requestContext path, @mastra/core 1.43.0), the Wave-0 tool-test scaffold + the __scaffold__ vitest/tsconfig exclusion, copilot i18n
  - phase: 72-03
    provides: hybrid_rag_search SECURITY INVOKER RPC (RRF k=60, RLS-before-rerank) + rag_chunks halfvec(1024) store
  - phase: 72-04
    provides: the three 72-03 migrations APPLIED + verified live on staging; the TEI /embed boundary (embedChunk) idiom + halfvec literal helper
  - phase: 72-05
    provides: the typed STUB tool roster (createTool shells) + tools/index.ts barrel + the copilot agent that consumes copilotTools
  - phase: 68-ai-foundations-remediation
    provides: createUserClient JWT-propagation idiom (chat-assistant.ts) replacing supabaseAdmin; clearance model (profiles.user_id/clearance_level); indistinguishable-empty rule
  - phase: 69-signals
    provides: read_signals INVOKER RPC
  - phase: 70-digests-alerts
    provides: generate_digest INVOKER RPC (preview path); publish_digest (the forbidden write)
  - phase: 71-analytic-graph
    provides: query_graph INVOKER RPC + the 4 query_type whitelist + the GRAPH-03 indistinguishable-empty lock
provides:
  - agent-runtime/src/mastra/tools/_supabase.ts — createUserClient keystone (anon key + caller JWT, never service-role) + getAuthorization (#4465 gate) + setIterativeScanGucs (best-effort pgvector recall tuning)
  - 6 narrow Zod-typed reads-only tools, all under the caller JWT, all indistinguishable-empty
  - hybrid_rag_search tool — TEI embed -> iterative-scan GUC -> INVOKER RPC -> TEI rerank (RLS-before-rerank, AGENT-04)
  - the realized tool tests (tools.test.ts) — per-tool keystone JWT-scoping + indistinguishable-empty + least-privilege guards; the __scaffold__ exclusion removed
affects: [72-08, 72-09, phase-73]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'JWT keystone in every tool: build the Supabase client from context.requestContext.get(authorization) (Mastra 1.43 RequestContext, NOT runtimeContext), assert non-empty, never fall back to service-role'
    - 'Tool calls the shared helper via the module namespace (supa.createUserClient) so vi.mock(./_supabase.js) intercepts every client build regardless of import style'
    - 'Indistinguishable-empty everywhere: no-data, above-clearance, missing-JWT, and RPC-error all return the SAME empty shape; non-object RPC data coerced to the empty shape so output validation never leaks a ValidationError'
    - 'RLS-before-rerank: hybrid_rag_search RPC (INVOKER) returns only RLS-passing candidates; the TEI cross-encoder reranks AFTER, in the tool layer, and can never widen clearance'
    - 'TEI as the only network seam (config-driven TEI_EMBED_URL /embed + TEI_RERANK_URL /rerank); rerank degrades to RRF order if the reranker is down'
    - 'Least-privilege roster: narrow Zod-bounded tools (enum query_type/period), no execute_sql, no service-role, no publish_digest'

key-files:
  created:
    - agent-runtime/src/mastra/tools/tools.test.ts
  modified:
    - agent-runtime/src/mastra/tools/_supabase.ts
    - agent-runtime/src/mastra/tools/read-signals.ts
    - agent-runtime/src/mastra/tools/query-graph.ts
    - agent-runtime/src/mastra/tools/generate-digest.ts
    - agent-runtime/src/mastra/tools/hybrid-rag-search.ts
    - agent-runtime/src/mastra/tools/dossier-lookups.ts
    - agent-runtime/src/mastra/tools/index.ts
    - agent-runtime/vitest.config.ts
    - agent-runtime/tsconfig.json

key-decisions:
  - 'Tools call supa.createUserClient via the module namespace; tests use vi.mock(./_supabase.js) (not vi.spyOn on a const re-export) so the keystone assertion holds regardless of import binding'
  - 'generate_digest dossierId is REQUIRED (the digest is dossier-scoped); period is an enum {daily,weekly,monthly}; the tool exposes ONLY the preview path and never references rpc(publish_digest)'
  - 'query_graph and generate_digest pass the RPC JSONB through verbatim under result/digest (keys vary by query_type/period) rather than reshaping into a lossy fixed schema'
  - 'iterative-scan GUC is best-effort via a set_config RPC wrapped in try/catch — under PostgREST pooling it may not pin to the search backend; RLS remains the correctness floor and recall tuning is non-blocking. The durable fix (fold set_config(..,true) into the RPC) is a follow-up migration (executor has no MCP).'
  - 'Mastra Tool.execute wraps the body with input + output validation (returns a ValidationError object, does not throw); tests supply schema-valid input (real v4 UUIDs — Zod v4 .uuid() validates version/variant nibbles) and assert error !== true so the real empty shape is exercised'
  - 'rerank top-k = 8 (DEFAULT_TOP_K), candidate set = 50 (RPC p_limit); reranker only ever sees the RLS-passing candidate set'

patterns-established:
  - 'Pattern: every read tool = getAuthorization gate -> supa.createUserClient(jwt) -> INVOKER RPC or JWT-scoped table read -> indistinguishable-empty on any failure'
  - 'Pattern: coerce non-object RPC data (null/array/scalar) to the declared empty shape before returning, so Mastra output validation never surfaces a ValidationError that could leak structure'

requirements-completed: [AGENT-02, AGENT-03, AGENT-04]

# Metrics
duration: 70min
completed: 2026-06-18
---

# Phase 72 Plan 06: Reads-Only Tool Roster (D-07) Summary

**The keystone `_supabase.ts` helper + 6 narrow Zod-typed least-privilege tools — `read_signals`/`query_graph`/`generate_digest`-preview wrapping the live P69/P70/P71 INVOKER RPCs, the new `hybrid_rag_search` (TEI embed → iterative-scan → INVOKER RPC → TEI rerank, RLS-before-rerank), and `get_dossier`/`list_dossiers`/`query_work_items` reading directly — all under the caller JWT, all indistinguishable-empty, with the Wave-0 tool tests turned GREEN (23/23).**

## Performance

- **Duration:** ~70 min
- **Started:** 2026-06-18T13:55Z (approx)
- **Completed:** 2026-06-18T14:10Z
- **Tasks:** 2 (both TDD-flagged; executed body-first with the realized test suite as the gate)
- **Files modified:** 9 (1 created, 8 modified) + 1 scaffold removed

## Accomplishments

- **JWT keystone wired through every tool.** Each tool reads `context.requestContext.get('authorization')` (the spike-proven Mastra 1.43 `RequestContext` path, NOT `runtimeContext`), asserts it non-empty (the #4465 gate), and builds `createUserClient(jwt)` = anon key + caller Bearer. **No tool imports `SUPABASE_SERVICE_ROLE_KEY`** — RLS under the caller's identity is the enforcement floor.
- **Three RPC-wrapping tools bind the exact live signatures** (verified on staging 2026-06-18, all SECURITY INVOKER): `read_signals(p_dossier_id,p_status,p_since,p_limit)`, `query_graph(p_query_type,p_entity_id,p_entity_id_2,p_window_days)` with `query_type` Zod-enum-bounded to the 4 whitelist values, `generate_digest(p_dossier_id,p_period)` PREVIEW path only.
- **`hybrid_rag_search` (AGENT-04)** — embeds the query via TEI bge-m3 (`TEI_EMBED_URL` `/embed`, 1024-dim, no pad/truncate), sets the pgvector iterative-scan GUCs on the per-request client, calls the INVOKER RPC (RRF k=60, RLS inside both CTEs), then reranks the **already-cleared** candidates via the TEI cross-encoder (`TEI_RERANK_URL` `/rerank`) and keeps top-8. **RLS-before-rerank**: the reranker never sees an above-clearance row. Degrades to RRF order if the reranker is down.
- **`dossier-lookups`** mirrors `chat-assistant.ts` `getDossier`/`listDossiers`/`queryCommitments` verbatim, repointed to `aa_commitments`, each via the JWT client, each indistinguishable-empty on error.
- **Indistinguishable-empty holds everywhere** — no-data, above-clearance, missing-JWT, and RPC-error all return the same empty shape; the serialized result never matches `/clearance|filtered|restricted/i` (the P71 GRAPH-03 lock, carried forward).
- **Wave-0 tool tests realized GREEN** — `tools.test.ts` (relocated from `__scaffold__`) asserts per-tool keystone JWT-scoping + indistinguishable-empty + least-privilege (no service-role, no `publish_digest` call, enum-bounded `query_type`). `pnpm --filter agent-runtime test` = **23 passed**. `type-check`, `build`, `lint` all clean.

## Task Commits

Each task was committed atomically:

1. **Task 1: \_supabase keystone + 3 RPC-wrapping tools (read_signals, query_graph, generate_digest-preview)** — `0e5e5803` (feat)
2. **Task 2: hybrid_rag_search + dossier-lookups; realize the Wave-0 tool tests GREEN** — `0be6c9f0` (feat)

_Note: both tasks are `tdd="true"`; the realized `tools.test.ts` (Task 2) is the RED→GREEN gate for the whole roster — the bodies were authored to satisfy it and verified GREEN before commit._

## Files Created/Modified

- `agent-runtime/src/mastra/tools/_supabase.ts` — `createUserClient` (anon + caller JWT, no service-role) + `getAuthorization` (#4465 gate) + `setIterativeScanGucs` (best-effort pgvector recall tuning)
- `agent-runtime/src/mastra/tools/read-signals.ts` — wraps P69 `read_signals` under the caller JWT; `{ signals: [] }` empty shape
- `agent-runtime/src/mastra/tools/query-graph.ts` — wraps P71 `query_graph`; `query_type` enum-bounded; JSONB passthrough under `result`
- `agent-runtime/src/mastra/tools/generate-digest.ts` — wraps P70 `generate_digest` PREVIEW only; `dossierId` required; never references `rpc('publish_digest')`
- `agent-runtime/src/mastra/tools/hybrid-rag-search.ts` — TEI embed → iterative-scan → INVOKER RPC → TEI rerank (RLS-before-rerank); `{ results: [...] }`
- `agent-runtime/src/mastra/tools/dossier-lookups.ts` — `get_dossier`/`list_dossiers`/`query_work_items` (aa_commitments) via the JWT client
- `agent-runtime/src/mastra/tools/index.ts` — roster barrel comment updated (bodies filled; copilot agent already consumes `copilotTools`)
- `agent-runtime/src/mastra/tools/tools.test.ts` — the realized roster tests (23 tests GREEN)
- `agent-runtime/vitest.config.ts` + `agent-runtime/tsconfig.json` — removed the `__scaffold__` exclusion (72-01 cross-wave contract)

## rerank top-k, iterative-scan tuning, publish_digest reachability (per the plan output ask)

- **Rerank top-k:** `DEFAULT_TOP_K = 8` kept after rerank; candidate set handed to the reranker = `DEFAULT_CANDIDATES = 50` (the RPC `p_limit`). The reranker only ever sees the 50 RLS-passing candidates the RPC returned.
- **Iterative-scan tuning:** `hnsw.iterative_scan = 'relaxed_order'` + `hnsw.max_scan_tuples = 20000`, set best-effort via a `set_config` RPC on the per-request client before the search. This is a RECALL optimization (Pitfall 4), not a clearance gate — RLS is the floor regardless. See the deferred item below for the durable fix.
- **publish_digest is never reachable:** the string `publish_digest` appears only in explanatory comments and the test guard; there is **no `rpc('publish_digest')` call anywhere** in the tool roster. The `generate_digest` tool exposes only the preview path. Asserted in `tools.test.ts` (`generate-digest never calls publish_digest`).

## Decisions Made

- **Tools call `supa.createUserClient` via the module namespace; tests use `vi.mock('./_supabase.js')`** rather than `vi.spyOn` on a `const` re-export (ESM const exports are not reliably writable, and a captured local binding would dodge a `spyOn`). `vi.mock` replaces the whole module, so the keystone assertion holds no matter how a tool imports the helper.
- **`generate_digest` `dossierId` is required + `period` enum {daily,weekly,monthly}** — the digest is dossier-scoped; exposing it without a dossier would produce a cross-tenant/empty digest. Preview-only by construction.
- **`query_graph`/`generate_digest` pass the RPC JSONB through verbatim** (`result`/`digest`) because the keys vary by `query_type`/`period`; the original stub's fixed `{nodes,edges}` shape would have been lossy.
- **Non-object RPC data is coerced to the empty shape** before returning (Rule 1 hardening) so Mastra's output validation never surfaces a `ValidationError` — which would both break the contract and risk leaking structure.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `query_graph`/`generate_digest` returned a non-object on an empty-array RPC result → output-validation ValidationError**

- **Found during:** Task 2 (realizing the indistinguishable-empty tests)
- **Issue:** The JSONB-returning RPCs (`query_graph`, `generate_digest`) can yield a non-object (`[]`/null) from PostgREST; the tools declared `z.record()` outputs, so passing `[]` through tripped Mastra's `validateToolOutput`, returning a `ValidationError` (`error: true`) instead of the neutral empty shape — a leak/contract bug.
- **Fix:** Guard `if (error || data == null || typeof data !== 'object' || Array.isArray(data)) return <empty shape>` in both tools so any non-object coerces to the indistinguishable-empty shape.
- **Files modified:** `query-graph.ts`, `generate-digest.ts`
- **Verification:** `pnpm --filter agent-runtime test` 23/23 GREEN; the indistinguishable-empty tests now assert `error !== true` so they exercise the real empty shape.
- **Committed in:** `0be6c9f0` (Task 2 commit)

**2. [Rule 2 - Missing Critical] `setIterativeScanGucs` recall-tuning helper added to `_supabase.ts`**

- **Found during:** Task 1 (keystone helper) / Task 2 (RAG tool)
- **Issue:** The plan's interfaces direct the tool to `SET LOCAL hnsw.iterative_scan` before the RPC (Pitfall 4 — RLS post-filter collapsing recall), but the deployed `hybrid_rag_search` RPC does not set it itself and the stub had no helper.
- **Fix:** Added `setIterativeScanGucs(sb)` (best-effort `set_config` RPC, try/catch, never blocks the search) and called it in `hybrid-rag-search.ts` before the RPC. Documented that under PostgREST pooling it may not pin to the search backend (see deferred item) — RLS remains the correctness floor.
- **Files modified:** `_supabase.ts`, `hybrid-rag-search.ts`
- **Verification:** type-check + tests GREEN; helper is non-throwing by design.
- **Committed in:** `0e5e5803` (helper) + `0be6c9f0` (call site)

**3. [Rule 3 - Blocking] Removed the `__scaffold__` exclusion from `tsconfig.json` (not only `vitest.config.ts`)**

- **Found during:** Task 2 (turning the scaffold GREEN)
- **Issue:** The plan named `vitest.config.ts` for the exclude removal; `tsconfig.json` carried the SAME `__scaffold__` exclusion (added by 72-01), which would have left the relocated test out of `type-check` coverage.
- **Fix:** Removed the `__scaffold__` glob from both `vitest.config.ts` and `tsconfig.json`; relocated the scaffold into the live tools dir as `tools.test.ts` and deleted the old `__scaffold__` copy (the documented 72-01 cross-wave contract).
- **Files modified:** `vitest.config.ts`, `tsconfig.json`; deleted `src/mastra/tools/__scaffold__/tools.test.ts`
- **Verification:** `type-check`, `test`, `build`, `lint` all clean.
- **Committed in:** `0be6c9f0` (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (1 bug, 1 missing-critical, 1 blocking)
**Impact on plan:** All three were necessary for correctness (output well-shapedness, recall, type-check coverage). No scope creep — every change stays within the plan's 8 named files plus the two config files the `<task_scope>` explicitly required for the exclude removal.

## Issues Encountered

- **Mastra `Tool.execute` is a validating wrapper** (input + output validation, returns a `ValidationError` object rather than throwing). Calling `execute({})` on a required-field tool returns a ValidationError before the body runs, and a malformed output is rewritten to a ValidationError. Resolved by (a) supplying schema-valid inputs in tests (real v4 UUIDs — Zod v4 `.uuid()` validates the RFC version/variant nibbles, so all-zeros strings are rejected), and (b) coercing non-object RPC data to the declared empty shape (deviation #1).

## Deferred Issues

- **Durable iterative-scan fix (follow-up migration):** fold `set_config('hnsw.iterative_scan','relaxed_order',true)` (and `max_scan_tuples`) into the `hybrid_rag_search` RPC body so the GUC is guaranteed transaction-local on the same backend as the scan. The tool's best-effort `set_config` call may miss under PostgREST connection pooling. This is recall tuning only — clearance (RLS) is unaffected. The executor lacks the Supabase MCP to alter the deployed function; tracked here for 72-09 / a P73 migration.
- **mastra_threads/mastra_messages RLS re-apply (carried from 72-04):** still must be re-applied after agent-runtime first boots so `@mastra/pg` has created the tables. Not in this plan's scope; noted for 72-09.

## User Setup Required

None in this plan. The runtime env vars the tools read (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `TEI_EMBED_URL`, `TEI_RERANK_URL`) are provisioned in the 72-05/72-09 deploy steps; the TEI containers are GPU-served (live wiring deferred to the 72-09 deploy gate — the tools degrade gracefully when `TEI_RERANK_URL` is unset).

## Next Phase Readiness

- The reads-only tool roster is complete and the copilot agent already binds it (`copilotTools`). 72-08 (agent wiring / endpoint) and 72-09 (deploy + live UAT) can exercise these tools end-to-end once the runtime + TEI containers are up.
- AGENT-02 (gated reads under the caller JWT) and AGENT-03 (reduced results, indistinguishable-empty) are proven by the tool tests; AGENT-04 (hybrid RAG, RLS-before-rerank) is implemented and unit-verified — its live recall/rerank behavior validates at the 72-09 deploy gate where the real TEI + a backfilled `rag_chunks` exist.
- **Blocker/concern:** the iterative-scan durable fix (above) should land before relying on high-recall RAG for high-clearance callers on selective filters.

## Self-Check: PASSED

- All 8 tool files present (`_supabase.ts` + 6 tools + `tools.test.ts`); the `__scaffold__/tools.test.ts` correctly removed (cross-wave relocation).
- Both task commits present: `0e5e5803` (Task 1), `0be6c9f0` (Task 2).
- `pnpm --filter agent-runtime` `type-check`, `test` (23/23 GREEN), `build` (12 files), `lint` (0 warnings) all pass.
- Verify greps: `_supabase.ts` has Authorization; `hybrid-rag-search.ts` has `hybrid_rag_search` + `rerank`; no `rpc('publish_digest')` anywhere; no `SERVICE_ROLE` in any tool body.

---

_Phase: 72-agent-platform-runtime-retrieval-reads_
_Completed: 2026-06-18_
