# Pitfalls Research

**Domain:** On-prem agentic LLM + clearance-based RLS layer on top of a shipped Supabase/Postgres diplomatic dossier app
**Researched:** 2026-06-13
**Confidence:** HIGH — all three remediation targets verified in the live codebase; framework/security claims verified against spec + architecture research docs + direct file inspection

---

## Critical Pitfalls

### Pitfall 1: supabaseAdmin (service-role) in the interactive agent path — the live data-exposure gap

**What goes wrong:**
`backend/src/ai/agents/chat-assistant.ts` imports and uses `supabaseAdmin` (service-role) at lines 158, 171, 202, 235, 269, 307, and 338. Service-role **bypasses RLS entirely**. The agent can therefore exfiltrate above-clearance dossiers silently — no error, no indication to the caller. A prompt-injection attack, a logic bug, or a tool-call mistake all exploit the same gap: the clearance ceiling is not enforced at the DB layer at all. The same pattern also exists in `backend/src/ai/agents/brief-generator.ts` (lines 413, 444, 472) and `backend/src/ai/agents/intake-linker.ts` (lines 194, 243, 264, 392, 422, 452), meaning the contamination scope is wider than chat-assistant alone.

**Why it happens:**
service-role clients are convenient in backend Node.js code because they avoid JWT extraction/forwarding boilerplate. Developers reach for `supabaseAdmin` by default when a DB call is "behind auth" at the Express middleware level, wrongly assuming the auth check at the route level is sufficient. It is not — the query still runs as postgres superuser.

**How to avoid:**
Every interactive agent DB call (any path reachable by a human user's request) must use a per-request scoped client:

```ts
createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: `Bearer ${jwt}` } },
  auth: { persistSession: false, autoRefreshToken: false },
})
```

The JWT is extracted from the incoming AG-UI SSE POST (`properties.authorization`) and forwarded into every Mastra tool's `execute()`. **Never pass `supabaseAdmin` into a Mastra tool.** Keep `supabaseAdmin` strictly for cron/no-user paths (scheduled digest generation, signal ingestion) with explicit app-layer authz guards.

**Warning signs:**

- Any file in `backend/src/ai/agents/` importing `supabaseAdmin` from `../../config/supabase.js` is a candidate for audit.
- A non-cleared test user can retrieve a `sensitivity_level = 'high'` dossier via the chat assistant.
- The Langfuse trace shows DB queries running as the `service_role` instead of `anon` + JWT headers.

**Phase to address:** Phase 68 (AI Foundations Remediation) — this is item 3 of the three mandatory pre-work items; it gates every downstream phase. Fix this before any new intelligence table is wired.

---

### Pitfall 2: Prompt injection misusing intent — and the wrong mitigation response

**What goes wrong:**
A prompt-injection attack in a dossier text field, a user-provided name, or an agent-authored card causes the agent to issue unexpected tool calls — e.g., extracting all signals, generating and emailing a digest to an external address, or creating spurious work items. The instinct is to add an application-layer clearance check inside each tool's `execute()`. This is the wrong fix.

**Why it happens:**
Developers treat injection as a "check before acting" problem. They add something like `if (jwt.clearance < required) return null` inside the tool. This check is application code — it can be forgotten for new tools, bypassed if the tool is refactored, or silently skipped if the inject causes the tool to be called with forged arguments.

**How to avoid:**
The correct mitigation is the JWT keystone: since every DB read runs under the caller's JWT and RLS enforces `sensitivity_level <= clearance_level` at the Postgres level, injection can misuse **intent** (cause unwanted tool calls) but **cannot exceed clearance** (the query returns what the user is allowed to see regardless). This is why service-role must be retired first (Pitfall 1) — without it, injection exploits the service-role gap, not just intent. Defense-in-depth layers on top: (a) typed narrow tools — no generic `execute_sql` tool; (b) intent-vs-action guardrail: evaluate each proposed tool call against the original user task before executing; (c) HITL on all write tools; (d) Langfuse trace logging for audit.

**Warning signs:**

- Any tool that accepts a free-text parameter and passes it unquoted into a SQL `WHERE` clause.
- A tool called `run_query`, `execute_sql`, or anything accepting arbitrary SQL or filter expressions.
- Agent trace shows a tool being called with arguments that don't match the user's stated task.

**Phase to address:** Phase 68 (establish keystone) + Phase 72 (tool definitions) + Phase 73 (HITL write tools). The keystone (P68) is the structural fix; tool scope (P72) and HITL (P73) are the defense-in-depth layers.

---

### Pitfall 3: Three incompatible clearance scales — silent gating breakage on new intelligence tables

**What goes wrong:**
The codebase has three incompatible clearance representations in active use:

- `profiles.clearance_level` — INTEGER 1–4 (`CHECK (clearance_level >= 1 AND clearance_level <= 4)`), documented "1=Basic to 4=Top Secret"
- `get_user_clearance_level(user_id)` — returns INTEGER 1–3 (reads from `user_roles`, documented "1=low, 2=medium, 3=high")
- `dossiers.sensitivity_level` — TEXT enum `'low'|'medium'|'high'`, compared via a CASE mapping to 1–3

Most existing RLS policies on dossiers use `get_user_clearance_level()` (range 1–3) with the CASE-mapped sensitivity integers (also 1–3), but `profiles.clearance_level` can be 4, which the existing `CASE` mappings don't cover. Adding new intelligence tables (signals, rag_chunks) that key off `profiles.clearance_level` directly (range 1–4) while existing tables key off `get_user_clearance_level()` (1–3) creates a **permanently broken gating layer**: a user with clearance_level=4 sees level 3 signals but not level 4 signals if the new RLS uses one function; a user with clearance_level=3 in profiles but the function-derived 3 may see inconsistent results.

**Why it happens:**
The function was written first (returning 1–3 from user_roles) before the profile column was added (1–4). New migrations inconsistently reference one or the other. The mismatch is invisible until an analyst with clearance_level=4 can't see content they should be cleared for, or — worse — can see content they shouldn't.

**How to avoid:**
Phase 68 must pick ONE canonical scale and migrate everything to it before wiring any new RLS. Recommended: keep `profiles.clearance_level` as the canonical source (1–4), deprecate `get_user_clearance_level()` or rewrite it to read profiles directly, extend the sensitivity CASE mapping to cover level 4, and write a migration that backfills/aligns any rows where `get_user_clearance_level()` was returning a different value. All new tables (intelligence_signal, rag_chunks) wire their RLS directly to `profiles.clearance_level` via a single subquery, not the function.

Verification: run a cross-join test on staging — for each clearance level (1–4), confirm the set of accessible dossiers exactly matches expectation both before and after the migration. The eval harness should include a clearance-boundary probe.

**Warning signs:**

- Any RLS policy that uses `get_user_clearance_level()` on a table that also references `profiles.clearance_level` in another policy.
- A user with `profiles.clearance_level = 4` cannot retrieve `sensitivity_level = 'high'` content.
- RLS coverage differs between `check_clearance_level()` (a third function also in the migrations) and the primary path.

**Phase to address:** Phase 68 — this is item 1 of the three mandatory pre-work items, must be resolved before any new clearance-bearing table is created.

---

### Pitfall 4: Embedding dimension corruption — the existing pad/truncate bug and the re-embed migration hazard

**What goes wrong:**
`supabase/functions/search-semantic/index.ts` calls `normalizeEmbedding(data.embedding, 1536)`, which pads vectors shorter than 1536 with zeros or truncates vectors longer than 1536. The local bge-m3 ONNX model (already the dev-path embedder in `backend/src/ai/embeddings-service.ts`) produces 1024-dimensional vectors. Padding from 1024 to 1536 with 512 zeros **corrupts cosine geometry**: the padded zero-tail dominates the magnitude calculation, causing similarity scores to converge toward zero and making the vector store effectively useless for semantic retrieval. Results may appear to "work" (they return rows) while actually being random.

The second hazard is the one-time re-embed migration to bge-m3 1024-dim halfvec: if the migration job runs while the edge function is still padding to 1536, you end up with a mixed-dimension store (some chunks at halfvec(1024), some at vector(1536)) that makes the HNSW index unusable.

**Why it happens:**
The normalizeEmbedding helper was written as a defensive shim when AnythingLLM's embedding dimension was uncertain. It looks safe (it handles both cases) but is geometrically destructive for the common case where the model output is shorter than 1536.

**How to avoid:**

1. Phase 68: remove the `normalizeEmbedding(..., 1536)` call and replace with a hard assertion (`if (embedding.length !== 1024) throw new Error(...)`) so padding is impossible.
2. The re-embed migration job must be atomic for any given chunk (delete old row, insert new halfvec(1024) row in a transaction) and must run only after the `rag_chunks` table schema has been migrated to `halfvec(1024)`. Freeze all embedding writes during the migration window.
3. After migration, drop the old `vector(1536)` column. The HNSW index on `halfvec(1024)` (`halfvec_cosine_ops`) must be rebuilt, not reused from the old schema.
4. Add a CI-level assertion: embed a known sentence with bge-m3, assert the dimension is exactly 1024.

**Warning signs:**

- Cosine similarity scores all cluster near 0 (pad effect) or near 1 (truncation effect producing near-duplicate vectors).
- The semantic search edge function returns results with similarity_score < 0.1 for queries that should have strong matches.
- `pg_vector_dims(embedding)` returns inconsistent values across `entity_embeddings` rows.
- The AnythingLLM embedding endpoint returns a dimension other than 1024 (indicating it is using a different model internally).

**Phase to address:** Phase 68 (stop the bleeding — remove pad/truncate) + Phase 72 (the full re-embed to bge-m3 1024-dim halfvec and HNSW rebuild).

---

### Pitfall 5: SECURITY DEFINER on retrieval/analytic RPCs — the silent clearance bypass

**What goes wrong:**
`vector_similarity_search` (migration `20251017100000_create_vector_similarity_search_function.sql`) is `SECURITY DEFINER`. So are all functions in `20260111500001_semantic_search_expansion.sql` (lines 163, 247), `20260112950002_enhanced_search_suggestions.sql` (lines 134, 206, 252, 284), `20260113700001_saved_searches_with_sharing_alerts.sql`, and `20260110200001_advanced_search_filters.sql`. A `SECURITY DEFINER` function **executes as its definer** (postgres or the migration role), not as the calling user. Any RLS predicate on tables the function queries is evaluated as the definer — meaning RLS is bypassed even when the caller is a low-clearance user. The `vector_similarity_search` function does enforce clearance via an inline `AND classification_level <= user_clearance` parameter, but this is app-level filtering, not RLS — it can be called with `user_clearance = 99` from any SQL context that has EXECUTE on the function.

**Why it happens:**
`SECURITY DEFINER` is needed for audit triggers and auth helpers (so they can read `auth.users` or write to protected tables). Developers copy-paste the pattern for performance-sensitive search functions without realizing RLS is bypassed. The inline clearance check looks like it works (it filters rows) but it isn't enforced by the database's access control system — it's just a WHERE clause that the caller can influence via the function argument.

**How to avoid:**
All new analytic RPCs in Phase 71 (graph queries) and all new retrieval RPCs in Phase 72 (hybrid RAG) must be `SECURITY INVOKER`. Existing `SECURITY DEFINER` search functions that touch clearance-bearing tables must be audited and either: (a) rewritten as `SECURITY INVOKER` so RLS applies automatically, or (b) kept `SECURITY DEFINER` with the inline clearance check replaced by `SET LOCAL ROLE authenticated; SET LOCAL "request.jwt.claims" = ...` so RLS sees the real caller. Option (a) is strongly preferred.

Migration checklist: for each new function, verify `SECURITY INVOKER` in the CREATE OR REPLACE statement. Add a `rls-audit.test.ts` probe that calls the function as a low-clearance user and asserts it cannot read high-sensitivity chunks.

**Warning signs:**

- `\df+ function_name` in psql shows `security: definer` on any function called by the agent or by the hybrid search RPC.
- A low-clearance user can call `SELECT * FROM vector_similarity_search(...)` with `user_clearance = 3` and retrieve sensitivity_level=3 content they shouldn't have.
- The function touches `dossiers`, `rag_chunks`, `intelligence_signal`, or any RLS-protected table.

**Phase to address:** Phase 68 (interim RLS fix on existing vector search) + Phase 71 (analytic RPCs must be `SECURITY INVOKER` by spec) + Phase 72 (hybrid RAG RPC must be `SECURITY INVOKER`).

---

### Pitfall 6: CopilotKit cloud-key dependency breaking sovereign self-host

**What goes wrong:**
CopilotKit's built-in shell components (`CopilotSidebar`, `CopilotChat`, `CopilotPopup`) communicate with **Copilot Cloud** by default for features like LangGraph-to-CopilotKit streaming, session persistence, and the premium headless mode. The `publicApiKey` prop (or `NEXT_PUBLIC_COPILOT_CLOUD_API_KEY` env var) gates these paths. If the key is absent, certain AG-UI streaming paths 404 silently, HITL events may not surface, and the agent appears to hang or produce empty responses. The v7.0 sovereign requirement is zero data egress — any path through Copilot Cloud violates it.

The second dimension: the `@copilotkit/react-ui` chrome does not document RTL support and its CSS vars (`--copilot-kit-*`) do not map to the IntelDossier token system without per-element overrides — making the built-in shell a poor fit regardless of the air-gap question.

**Why it happens:**
CopilotKit's docs default to the cloud path because it gives the best out-of-box experience. Developers who install the package and follow the quickstart inadvertently wire cloud dependencies.

**How to avoid:**
The Phase 72 Option-C spike must empirically settle the chat-shell choice. The self-hosted path:

- Use `CopilotRuntime` on the `agent-runtime` service with `self-hosted` mode (no `publicApiKey`, no `remoteActions` pointing to cloud). Verify in the spike that all AG-UI events (text delta, tool-call, STATE_SNAPSHOT, HITL `renderAndWaitForResponse`) arrive correctly without a cloud key.
- For the React surface: prefer `assistant-ui` with `@assistant-ui/react-ag-ui` (headless, RTL-documented, IntelDossier token-bindable) over CopilotKit's built-in chrome. Use CopilotKit **hooks only** (`useCopilotReadable`, `useCopilotAction`) if their ergonomics beat the build cost, but render with your own components.
- Never set `NEXT_PUBLIC_COPILOT_CLOUD_API_KEY` in any environment. Block the cloud URL in production network policy.

**Warning signs:**

- Network tab shows outbound connections to `*.copilotkit.ai` or `cloud.copilotkit.ai`.
- Agent responses arrive only after a cloud round-trip or produce CORS errors when the cloud URL is blocked.
- `CopilotKitCSSProperties` overrides don't cover all token bindings; `var(--copilot-kit-primary-color)` appears in styles.

**Phase to address:** Phase 72 — settled empirically in the Option-C spike before committing to the full CopilotKit/Mastra wiring.

---

### Pitfall 7: HITL write tools committing under service-role — silent clearance and authz bypass on writes

**What goes wrong:**
A write tool (create work item, publish digest, create signal, generate brief) that uses `supabaseAdmin` to commit the write bypasses two guarantees simultaneously: (a) RLS does not gate the write (a low-clearance user can write to a high-sensitivity dossier), and (b) the audit trail records the action as the service account, not the user. Since HITL gates the action (the user must confirm), developers assume the confirmation step is the auth. It is not — the DB write must also carry the user's JWT.

**Why it happens:**
Write tools are often scaffolded by copying the existing `chat-assistant.ts` pattern, which already uses `supabaseAdmin`. The HITL confirmation UI creates a false sense of security.

**How to avoid:**
Every Mastra write tool's `execute()` must:

1. Build a scoped JWT client from the forwarded `jwt` parameter (same pattern as read tools).
2. Call the insert/update/delete via that scoped client.
3. Wrap the action in Mastra's `suspend()`/`resume()` HITL with `renderAndWaitForResponse` sending a bilingual token-bound confirmation card.
4. Only commit (`resume()`) if the user's `respond()` is `approved`.

The commit is not a separate service-role step after HITL approval — the entire insert runs under the user's JWT inside the `resume()` handler.

Verification: create a work item via the agent as a low-clearance user targeting a high-sensitivity dossier. The DB insert must be rejected by the `work_item_dossiers` RLS policy, not by an application check.

**Warning signs:**

- Write tools imported from `../../config/supabase.js` import `supabaseAdmin`.
- Audit logs show work items created by `service_role` rather than the user's UUID.
- A low-clearance user can successfully create a work item on a `sensitivity_level = 'high'` dossier via the agent.

**Phase to address:** Phase 73 (write tools + generative UI) — every write tool spec must require JWT-scoped client before `suspend()` in the phase plan.

---

### Pitfall 8: Bilingual silent-English-fallback — unregistered i18n namespace breaks Arabic copy in agent surfaces

**What goes wrong:**
`frontend/src/i18n/index.ts` is a static bundle: every namespace is imported at compile time and registered in the `resources` object. An unregistered namespace silently falls back to the `defaultNS` (`common`) which is English-dominated. The result is: the surface **looks correct in English** (common.json has a fallback key or `t()` returns the key string which happens to be readable) but **silently shows English strings in Arabic mode** — the RTL layout is correct, Tajawal renders, but the copy is in the wrong language. This is the trap that caused the v6.5/v6.6 timeline-stayed-English regression.

For v7.0, every new surface (signals triage, digests UI, copilot chat, agent HITL confirmation cards, eval dashboard) needs new i18n namespaces. If those namespaces are not registered in `index.ts` before the component ships, Arabic users see English copy.

**Why it happens:**
Developers create the JSON translation files, wire `useTranslation('signals')` in the component, but forget the import + registration in `index.ts`. The missing registration produces no error — it silently downgrades to the fallback.

**How to avoid:**

1. Any PR that adds a new `useTranslation('namespace')` or `useTranslation(['namespace'])` call must include the corresponding import + registration in `frontend/src/i18n/index.ts` in the same commit.
2. Add a test (extend the existing `vi.importActual` pattern from Phase 50) that checks the `resources` object contains every namespace referenced in `useTranslation` calls across the codebase (a grep + assertion is sufficient).
3. Agent-authored copy (model output) must be generated in the caller's language: thread `language: i18n.language` from the AG-UI `properties` object into every system prompt and tool description. Verify this in the Phase 69/72 live UAT: switch to Arabic mode, issue a query, assert the agent response is in Arabic.

**Warning signs:**

- `t('signals:triage.title')` returns `'signals:triage.title'` (raw key) in English mode, indicating a namespace miss.
- Arabic mode shows the same text as English mode on a new surface.
- `localStorage['id.locale']` is `'ar'` but model-generated copy in the copilot is in English.

**Phase to address:** Phase 69 (signals UI — first new namespace) sets the pattern; every subsequent phase (70 digests, 71 graph, 72 copilot surface, 73 HITL cards) must follow it. The test assertion should be part of Phase 68's eval harness scaffolding.

---

### Pitfall 9: Cron/digest pipeline using service-role without explicit app-layer authz

**What goes wrong:**
The digest pipeline (Phase 70) is a scheduled cron job that generates digests for subscribers. It legitimately cannot carry a user JWT (there is no interactive user). Using `supabaseAdmin` here is correct. The pitfall is leaving the pipeline without **explicit app-layer authz**: if the cron is misconfigured (wrong timing, double-fired, triggered via an API endpoint accidentally left open), it generates and delivers digests to subscribers who may have been deprovisioned, changed clearance, or whose subscription should have been paused. Since service-role bypasses RLS, the pipeline can deliver above-clearance content to a subscriber if the subscriber model is not itself clearance-checked at delivery time.

**Why it happens:**
Developers reason "it's a background job, it's fine to use service-role." The subscriber's clearance level at delivery time is not re-checked because it was checked at subscribe time.

**How to avoid:**

1. The cron pipeline must re-check `profiles.clearance_level` for each subscriber at **delivery time** (not subscription time) and filter out any digest items above the subscriber's current clearance before delivery.
2. Expose the cron trigger endpoint only internally (no public route); protect it with a shared secret header (`Authorization: Bearer CRON_SECRET`) checked before any processing.
3. The `intelligence_digest` rows written by the cron must carry the generating user's (or system's) clearance ceiling as a `max_sensitivity_level` field so the delivery path can skip items the subscriber can't see.
4. Add a Phase 70 UAT check: deprovision a subscriber mid-run, verify the next digest does not deliver above their (now-reduced) clearance.

**Warning signs:**

- The digest trigger route is mounted on the public Express router.
- The digest pipeline fetches all signals without filtering by recipient clearance.
- A deprovisioned user continues to receive digests.

**Phase to address:** Phase 70 — bake explicit authz into the subscriber model and delivery path before any channel adapters are wired.

---

### Pitfall 10: vLLM single-GPU sizing — Gemma 4 12B OOM and the Arabic adequacy trap

**What goes wrong:**
Two linked risks on the model tier. (a) GPU sizing: Gemma 4 12B (the approved starting brain) requires approximately 16–24GB VRAM at FP16, or ~8–12GB with INT4 QAT. Concurrent vLLM requests for multi-user scenarios add KV-cache pressure. If the actual datacenter GPU is a 16GB card (consumer class), Gemma 4 12B at FP16 will OOM; INT4 is required, which may degrade Arabic quality. (b) Arabic adequacy: Gemma 4 12B lists Arabic as "one of 140+ supported languages" — it is not an Arabic-first model. It may produce grammatically acceptable but diplomatically imprecise Arabic, miss formal register conventions, or produce transliterated reasoning artifacts.

**Why it happens:**
The design correctly identifies these as risks (spec §7 open risk register) but without an eval-gate in CI, the risks are only discovered during live analyst UAT — expensive to recover from.

**How to avoid:**

1. **Before Phase 72 begins**: confirm the actual GPU spec in the target datacenter. If it is a 16GB card, plan for Gemma 4 12B at INT4 or plan for Qwen3-14B (smaller, better tool-calling, ~8–10GB at FP16) as the Phase 72 starting model.
2. **Phase 68 eval harness** (Langfuse + Phoenix): wire the Arabic-quality rubrics (formal register, diplomatic vocabulary, RTL coherence) and the tool-calling accuracy rubrics as CI gates. The eval harness must run against the actual vLLM endpoint (not mocked) with a fixed test suite of Arabic diplomatic queries.
3. **Fallback path must be config-level**: the model URL in `backend/src/ai/config.ts` (already has `vllm`/`ollama`/`anythingllm` providers) must require only an env var swap to switch from Gemma to Qwen3-14B or Fanar-2. Do not hardcode the model name anywhere except the config file.
4. Phase 74 eval gate must fail CI if the Arabic-quality score drops below the baseline established in Phase 68.

**Warning signs:**

- vLLM crashes with CUDA out-of-memory on the first concurrent request.
- Arabic eval rubric scores < 70% for formal register on the Phase 68 baseline suite.
- Model-generated Arabic copy contains transliterated terms where Arabic equivalents exist.
- The config file has `model: 'gemma-4-12b'` as a hardcoded string outside the config abstraction.

**Phase to address:** Phase 68 (confirm GPU spec + wire eval harness) gates Phase 72 (model standing up). Phase 74 (eval CI gate) locks in the regression protection.

---

## Technical Debt Patterns

| Shortcut                                                                                | Immediate Benefit                                                               | Long-term Cost                                                                                                      | When Acceptable                                                                                               |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Keep `supabaseAdmin` in `chat-assistant.ts` during Phase 68 while building new features | Faster to ship signals/digests without refactoring the existing agent           | Every above-clearance data query is a live exposure; Phase 68 deadline for fix is firm                              | Never — this is the keystone fix                                                                              |
| Use `SECURITY DEFINER` on new analytic RPCs for convenience                             | Avoids the boilerplate of setting `search_path` in `SECURITY INVOKER` functions | Silently bypasses RLS; clearance guarantee broken on any table the function reads                                   | Only for auth triggers and audit logging — never for data-access RPCs                                         |
| Skip the clearance-scale migration and add a new 1–4 scale in parallel                  | Avoids touching existing RLS policies                                           | Permanent dual-scale confusion; new intelligence tables gate inconsistently with existing dossier tables            | Never — the migration is Phase 68 gate work                                                                   |
| Do the re-embed after Phase 72 ships (defer migration)                                  | Avoids the re-embed downtime window                                             | Mixed-dimension store causes HNSW index failures; semantic search breaks post-migration if embedder is already live | Acceptable ONLY if the interim fix (pad/truncate removal + clearance-RLS on existing store) is in place first |
| Use CopilotKit's built-in chrome and restyle via CSS vars                               | Faster to a working UI demo                                                     | Cannot achieve IntelDossier token fidelity; RTL not documented; cloud-key dependency risk                           | Never for the production surface — use headless client                                                        |
| Generate agent copy in English only and display to Arabic users                         | Avoids bilingual system-prompt complexity                                       | Arabic users see English copy in Arabic layout — a trust and usability failure in a sovereign government app        | Never                                                                                                         |

---

## Integration Gotchas

| Integration                     | Common Mistake                                                                         | Correct Approach                                                                                                                                                                |
| ------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mastra tool execute()           | Import `supabaseAdmin` from config (copy pattern from existing agents)                 | Build per-request scoped client from forwarded `jwt` inside `execute()`; never import `supabaseAdmin`                                                                           |
| pgvector HNSW + RLS post-filter | High-clearance users get poor recall because RLS filters out most HNSW candidates      | Enable `hnsw.iterative_scan = 'relaxed_order'` + `hnsw.max_scan_tuples`; consider partial indexes per sensitivity tier                                                          |
| vLLM tool calling               | Don't set `--tool-call-parser` for Gemma/Qwen models; tool calls come back as raw text | Set `--enable-auto-tool-choice` + the correct `--tool-call-parser` per model family; test with a single structured tool call before wiring full agent                           |
| AG-UI SSE + Express             | Mount AG-UI SSE endpoint on the same Express server as the transactional API           | AG-UI streams are long-lived (seconds to minutes); keep them on the dedicated `agent-runtime` service to avoid blocking the transactional API's connection pool                 |
| Supabase access token TTL       | Pass the JWT at session start; it expires (~1h) mid-run for long agent tasks           | Bind run duration to JWT TTL or implement server-side refresh; `persistSession: false, autoRefreshToken: false` on per-request clients means the caller must pass a fresh token |
| bge-m3 via TEI                  | Run bge-m3 + bge-reranker-v2-m3 as two separate services                               | Use one TEI container that can host both; they share the HuggingFace model cache                                                                                                |
| CopilotKit self-hosted runtime  | Set `publicApiKey` from example code                                                   | Never set `publicApiKey` in self-hosted mode; this triggers cloud routing                                                                                                       |
| i18n namespace registration     | Create translation JSON files and wire `useTranslation('signals')`                     | Also add the import + resource entry in `frontend/src/i18n/index.ts` in the same commit                                                                                         |

---

## Performance Traps

| Trap                                            | Symptoms                                                                                                                   | Prevention                                                                                                                                      | When It Breaks                                                                                        |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Full HNSW scan on high-sensitivity users        | A `clearance_level = 3` user's semantic search is 5–10x slower than a `clearance_level = 1` user                           | Partial HNSW indexes per sensitivity tier; iterative scan; increase `ef_search` proportionally to expected RLS filter ratio                     | When the user can see >50% of chunks but HNSW returns only top-k before RLS filters, recall collapses |
| halfvec re-embed blocking VACUUM                | Re-embed job inserts millions of rows causing autovacuum to lag; HNSW build stalls                                         | Run re-embed in batches of 1000 with explicit `pg_sleep(0.1)` between batches; schedule for off-hours; monitor `pg_stat_user_tables.n_dead_tup` | On staging with <10K rows, invisible; on production with 50K+ rows, can lock the table for minutes    |
| Agent memory/thread storage on Supabase main DB | Mastra `@mastra/pg` persists agent threads to the same Postgres instance; heavy agent usage adds contention on the primary | Use a separate Postgres schema (`agent_memory`) or separate DB connection pool for Mastra persistence; cap thread retention to 30 days          | >100 concurrent agent sessions                                                                        |
| Reranker cross-encoder latency                  | Reranking top-50 candidates with bge-reranker-v2-m3 adds 200–800ms per query                                               | Cap rerank candidates at 30; cache rerank results for identical query+doc pairs (TTL 5m); route summary queries to keyword-only path            | Every RAG query in production with no caching                                                         |

---

## Security Mistakes

| Mistake                                                      | Risk                                                                                            | Prevention                                                                                                                   |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Using `supabaseAdmin` in any interactive agent tool          | Service-role bypasses RLS; any clearance level can read any content                             | Per-request JWT-scoped client in every tool `execute()`; see Pitfall 1                                                       |
| `SECURITY DEFINER` on data-access RPCs                       | RLS is evaluated as the definer (postgres), not the caller; clearance guarantee silently broken | `SECURITY INVOKER` on all analytic/retrieval RPCs; reserve `SECURITY DEFINER` for audit triggers                             |
| Generic `execute_sql` or `run_query` Mastra tool             | Allows injection to escalate to arbitrary SQL execution                                         | Narrow typed tools only (one operation per tool); no free-text SQL tools                                                     |
| Write tools committing without HITL                          | Unauthorized state changes; no user confirmation                                                | Every write tool must `suspend()` before the DB insert and only `resume()` on user `respond()`                               |
| Cron pipeline delivering above-clearance content             | Subscriber receives content above their current clearance                                       | Re-check clearance at delivery time; filter digest items by `profiles.clearance_level` at send                               |
| Agent-authored content injected into existing dossier fields | Content appears trusted in the dossier record without flagging AI origin                        | Stamp all AI-authored content with `source_type = 'ai_generated'` (the `signal_source_type` enum already has this value)     |
| CopilotKit cloud routing                                     | Data egress violates sovereign on-prem requirement                                              | Never set `publicApiKey`; block cloud URLs in network policy; verify with Langfuse trace that no SSE frames route externally |

---

## UX Pitfalls

| Pitfall                                               | User Impact                                                                                                          | Better Approach                                                                                                                                              |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Agent-authored Arabic copy in wrong register          | Diplomatic analysts see informal or incorrectly gendered Arabic in official dossier text                             | Use the formal Arabic system prompt; include genre-specific few-shot examples (diplomatic communiqué register); gate on Arabic rubric score in Phase 68 eval |
| HITL confirmation card in LTR layout inside RTL shell | Confirmation card text reads left-to-right while the surrounding UI reads right-to-left — jarring and unprofessional | Set `dir="rtl"` on every `renderAndWaitForResponse` card; use logical properties; test in Arabic mode before merge                                           |
| Copilot surface using shadcn defaults                 | Out-of-place visual language in a sovereign analytic workstation; looks like a demo app                              | Headless client only; every element via `var(--*)` tokens; `1px solid var(--line)` borders; no card shadows                                                  |
| Streaming text appearing char-by-char in Arabic       | RTL text rendering during streaming can produce left-to-right flicker as tokens arrive                               | Buffer entire sentences or set `word-break: keep-all` + `unicode-bidi: isolate` on the streaming container; test Arabic streaming in Phase 72 spike          |
| Signal triage surface not keyboard-navigable          | Analysts lose keyboard-first workflow on the most-used intelligence surface                                          | Design Phase 69 signal triage with `aria-keyshortcuts`, arrow-key navigation, and keyboard marks per the QA-gate pattern established in Phase 43             |

---

## "Looks Done But Isn't" Checklist

- [ ] **JWT keystone:** Service-role client is retired from all interactive paths — verify no `supabaseAdmin` import in any file under `backend/src/ai/agents/` that handles a user request; also check `brief-generator.ts` and `intake-linker.ts` for the same pattern
- [ ] **Clearance-scale unification:** `get_user_clearance_level()` returns the same value as `profiles.clearance_level` for all test users at clearance levels 1–4 — run a cross-check query on staging
- [ ] **Embedding integrity:** `pg_vector_dims(embedding)` returns 1024 for every row in `rag_chunks` after migration; no row has dimension 1536 or 512
- [ ] **SECURITY INVOKER on retrieval RPCs:** `\df+ hybrid_search` and `\df+ vector_similarity_search` both show `security: invoker` in psql — not definer
- [ ] **CopilotKit air-gap:** No network request to `*.copilotkit.ai` or `cloud.copilotkit.ai` appears in the browser network tab during any agent interaction
- [ ] **HITL write safety:** Agent write action (e.g., create work item) captured in network tab shows the insert committing with the user's JWT bearer token, not service-role headers
- [ ] **Arabic namespace registration:** Every new namespace used in Phase 69–74 components appears in `frontend/src/i18n/index.ts` resources block for both `en` and `ar`
- [ ] **Agent Arabic language:** Switching to Arabic (`localStorage['id.locale'] = 'ar'`) and sending a query to the copilot produces an Arabic response, not English
- [ ] **Cron authz gate:** The digest trigger endpoint returns 401 when called without `Authorization: Bearer CRON_SECRET`; a deprovisioned subscriber receives no digest on the next run
- [ ] **Eval CI gate active:** A deliberately bad Arabic response injected into the eval test suite causes the Phase 74 CI job to fail

---

## Recovery Strategies

| Pitfall                                                          | Recovery Cost                                                                                                  | Recovery Steps                                                                                                                                                        |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| supabaseAdmin in interactive agent discovered post-Phase 68      | HIGH — every interaction since launch is a potential data exposure event                                       | Immediate: swap to JWT-scoped client; rotate SUPABASE_SERVICE_ROLE_KEY; audit Langfuse traces for above-clearance queries; notify security team                       |
| Clearance-scale mismatch discovered on a live intelligence table | HIGH — some intelligence rows are inaccessible to users who should see them, or visible to users who shouldn't | Write a migration that re-evaluates each row's visibility under the canonical scale; re-test all clearance-boundary probes; may require manual triage of exposed rows |
| Mixed-dimension embedding store (1536 + 1024 rows)               | MEDIUM — semantic search returns degraded results                                                              | Freeze embedding writes; run a targeted re-embed of all 1536-dim rows; rebuild HNSW index                                                                             |
| SECURITY DEFINER retrieval RPC discovered post-Phase 71          | HIGH — all analytic graph queries returned unclearance-gated data                                              | Alter function to SECURITY INVOKER; invalidate all cached query results; audit who queried which data                                                                 |
| CopilotKit cloud egress discovered in production                 | CRITICAL — data-sovereignty breach                                                                             | Block cloud URLs in network policy immediately; switch to pure headless `@ag-ui/client`; audit what data left in SSE frames                                           |
| Unregistered i18n namespace causing English fallback             | LOW — cosmetic, no security impact                                                                             | Add import + registration in `index.ts`; deploy; Arabic users see correct copy in next session                                                                        |

---

## Pitfall-to-Phase Mapping

| Pitfall                              | Prevention Phase                                                    | Verification                                                                                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| supabaseAdmin in interactive agent   | Phase 68 (item 3 of remediation, gates the rest)                    | Non-cleared user cannot retrieve `sensitivity_level = 'high'` dossier via chat; Langfuse trace shows `anon` client not service-role                                |
| Prompt injection exceeding clearance | Phase 68 (JWT keystone) + Phase 72 (tool scope) + Phase 73 (HITL)   | Injected payload in a dossier field causes unexpected tool call but returns only clearance-appropriate results                                                     |
| Three incompatible clearance scales  | Phase 68 (item 1 of remediation)                                    | Cross-join test: clearance_level 1–4 each return exactly the expected dossier set; `get_user_clearance_level()` and `profiles.clearance_level` agree for all users |
| Embedding pad/truncate corruption    | Phase 68 (stop pad/truncate) + Phase 72 (re-embed)                  | `pg_vector_dims(embedding) = 1024` for all `rag_chunks`; semantic similarity > 0.5 for known-relevant pairs                                                        |
| SECURITY DEFINER on retrieval RPCs   | Phase 68 (audit existing) + Phase 71 + Phase 72 (new RPCs)          | `\df+` shows `security: invoker` on all data-access RPCs; low-clearance user cannot retrieve high-sensitivity via any RPC                                          |
| CopilotKit cloud-key dependency      | Phase 72 (Option-C spike empirically settles chat shell)            | No egress to `*.copilotkit.ai` in prod network policy audit                                                                                                        |
| HITL write tools under service-role  | Phase 73                                                            | Agent write insert carries `Authorization: Bearer <user_jwt>` in DB headers; RLS rejects above-clearance insert                                                    |
| Bilingual silent-English-fallback    | Phases 69–74 (each adds a namespace) + Phase 68 (eval harness test) | Switch to Arabic; new surface renders Arabic copy; CI namespace-coverage test passes                                                                               |
| Cron pipeline without explicit authz | Phase 70                                                            | Deprovisioned subscriber excluded from next digest; endpoint returns 401 without CRON_SECRET                                                                       |
| vLLM GPU sizing + Arabic adequacy    | Phase 68 (confirm GPU + wire eval harness) gates Phase 72           | Arabic rubric score >= Phase 68 baseline in Phase 74 CI gate; vLLM starts without OOM on target GPU                                                                |

---

## Sources

- `docs/superpowers/specs/2026-06-13-v7.0-intelligence-engine-design.md` §3 (remediation items), §5 (cross-cutting guarantees), §7 (open risk register) — HIGH confidence
- `docs/research/v7.0-ai-architecture-research-2026-06-13.md` §2.5 (JWT keystone), §2.4 (SECURITY INVOKER requirement), §4.4 (i18n trap) — HIGH confidence
- `backend/src/ai/agents/chat-assistant.ts` — direct inspection; `supabaseAdmin` confirmed at lines 158, 171, 202, 235, 269, 307, 338 — HIGH confidence
- `supabase/functions/search-semantic/index.ts` — direct inspection; `normalizeEmbedding(..., 1536)` pad/truncate confirmed — HIGH confidence
- `supabase/migrations/20251017100000_create_vector_similarity_search_function.sql` — `SECURITY DEFINER` confirmed on vector_similarity_search — HIGH confidence
- `supabase/migrations/20251017030000_create_profiles.sql` — `profiles.clearance_level` INTEGER 1–4 confirmed — HIGH confidence
- `supabase/migrations/20250930001_helper_functions.sql` — `get_user_clearance_level()` returns 1–3 confirmed — HIGH confidence
- `supabase/migrations/20250930002_create_dossiers_table.sql` — `dossiers.sensitivity_level` TEXT `low|medium|high` confirmed — HIGH confidence
- `frontend/src/i18n/index.ts` — static bundle confirmed; namespace registration pattern confirmed — HIGH confidence
- OWASP AI Agent Security Cheat Sheet (cited in architecture research §7) — MEDIUM confidence (general LLM security)
- CopilotKit GitHub issue #3170 (A2A header-forwarding bug, cited in architecture research §2.5) — MEDIUM confidence

---

_Pitfalls research for: v7.0 Intelligence Engine — on-prem agentic LLM + clearance RLS on existing Supabase/Postgres diplomatic dossier app_
_Researched: 2026-06-13_
