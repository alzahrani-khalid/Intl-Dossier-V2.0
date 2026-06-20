# Phase 72: Agent Platform — Runtime, Retrieval, Reads - Pattern Map

**Mapped:** 2026-06-18
**Files analyzed:** 28 new/modified files across 4 surfaces
**Analogs found:** 24 / 28 (4 genuinely net-new — flagged in "No Analog Found")

> Consumed by `gsd-planner`. Every excerpt below is a **real, current** snippet from the live codebase
> (not invented) with file path + line numbers. The contract rule: **copy the analog, don't reinvent.**
>
> **Surface legend:** ① `agent-runtime` workspace (TS/Express + Mastra + CopilotKit) · ② Supabase migrations + RPCs ·
> ③ Read tools (wrap P69/P70/P71 RPCs + new `hybrid_rag_search`) · ④ Copilot drawer + Cmd+K (frontend).

---

## File Classification

| New/Modified File                                                     | Surface | Role               | Data Flow        | Closest Analog                                                                                                                                                                 | Match Quality |
| --------------------------------------------------------------------- | ------- | ------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| `pnpm-workspace.yaml` (mod)                                           | ①       | config             | —                | self (add 4th line)                                                                                                                                                            | exact         |
| `turbo.json` (mod, likely no-op)                                      | ①       | config             | —                | self (global tasks)                                                                                                                                                            | exact         |
| `agent-runtime/package.json`                                          | ①       | config             | —                | `backend/package.json`                                                                                                                                                         | role-match    |
| `agent-runtime/tsconfig.json`                                         | ①       | config             | —                | `backend/tsconfig.json`                                                                                                                                                        | exact         |
| `agent-runtime/Dockerfile.prod`                                       | ①       | config             | —                | `backend/Dockerfile.prod`                                                                                                                                                      | exact         |
| `agent-runtime/src/index.ts`                                          | ①       | server-bootstrap   | request-response | `backend/src/ai/mastra-config.ts` (OTel + Mastra init)                                                                                                                         | role-match    |
| `agent-runtime/src/mastra/index.ts`                                   | ①       | server/runtime     | streaming (SSE)  | **NO ANALOG** (registerCopilotKit bridge)                                                                                                                                      | net-new       |
| `agent-runtime/src/mastra/agents/copilot.ts`                          | ①       | agent              | request-response | `backend/src/ai/agents/chat-assistant.ts` (EN/AR prompts + tool roster)                                                                                                        | role-match    |
| `agent-runtime/src/config.ts` (lift)                                  | ①       | config             | —                | `backend/src/ai/config.ts`                                                                                                                                                     | exact (lift)  |
| `agent-runtime/src/llm-router.ts` (lift, if needed)                   | ①       | service            | request-response | `backend/src/ai/llm-router.ts`                                                                                                                                                 | exact (lift)  |
| `deploy/docker-compose.prod.yml` (mod)                                | ①       | config             | —                | existing `backend:` + internal-only `phoenix:`/`langfuse:` service blocks                                                                                                      | exact         |
| `supabase/migrations/…_rag_chunks.sql`                                | ②       | migration          | CRUD             | `20260614_phase69_signals_extend.sql` (table+index+RLS) + `20250129006_create_ai_tables.sql` (pgvector shape)                                                                  | role-match    |
| `supabase/migrations/…_hybrid_rag_search.sql`                         | ②       | migration (RPC)    | transform/CRUD   | `20260617_phase71_query_graph.sql` (INVOKER + inline clearance + indistinguishable-empty) + `20260614000002_p68_search_invoker_rpc.sql` (vector RPC + `get_function_security`) | exact         |
| `supabase/migrations/…_mastra_threads_rls.sql`                        | ②       | migration          | CRUD             | `20260614_phase69_signals_extend.sql` (RLS policy form)                                                                                                                        | role-match    |
| `agent-runtime/src/mastra/tools/_supabase.ts`                         | ③       | utility (keystone) | request-response | `backend/src/ai/agents/chat-assistant.ts:24` `createUserClient`                                                                                                                | exact         |
| `agent-runtime/src/mastra/tools/hybrid-rag-search.ts`                 | ③       | tool               | transform        | `supabase/functions/analytic-graph/index.ts` (JWT-wrap RPC call) + RESEARCH §Code Examples                                                                                     | role-match    |
| `agent-runtime/src/mastra/tools/read-signals.ts`                      | ③       | tool               | CRUD (read)      | `analytic-graph/index.ts` wrap idiom; RPC = `read_signals` (P69)                                                                                                               | exact         |
| `agent-runtime/src/mastra/tools/query-graph.ts`                       | ③       | tool               | CRUD (read)      | `analytic-graph/index.ts`; RPC = `query_graph` (P71)                                                                                                                           | exact         |
| `agent-runtime/src/mastra/tools/generate-digest.ts` (preview)         | ③       | tool               | CRUD (read)      | same wrap idiom; RPC = `generate_digest` preview path (P70)                                                                                                                    | role-match    |
| `agent-runtime/src/mastra/tools/dossier-lookups.ts`                   | ③       | tool               | CRUD (read)      | `chat-assistant.ts` `getDossier`/`listDossiers`/`queryCommitments` (L245-384)                                                                                                  | exact         |
| `backend/src/jobs/reembed-rag-chunks.ts` (or queue)                   | ③       | job (backfill)     | batch            | `backend/src/queues/intelligence-alert.worker.ts` (BullMQ Queue/jobId) + `embeddings-service.ts:544` `storeEmbedding`                                                          | role-match    |
| `backend/src/ai/agents/brief-generator.ts` (audit/mod)                | ③       | agent              | request-response | self (retire `supabaseAdmin` → `createUserClient` per D-10)                                                                                                                    | exact         |
| `backend/src/ai/agents/intake-linker.ts` (audit/mod)                  | ③       | agent              | request-response | self (retire/document `supabaseAdmin` per D-10)                                                                                                                                | exact         |
| `frontend/src/components/copilot/CopilotDrawer.tsx`                   | ④       | component          | streaming        | `dossier/DossierDrawer/DossierDrawer.tsx` (Sheet 720px)                                                                                                                        | exact         |
| `frontend/src/components/copilot/CopilotSheet` (mobile branch)        | ④       | component          | streaming        | `RelationshipSidebar.tsx` L494-510 (BottomSheet)                                                                                                                               | exact         |
| `frontend/src/components/copilot/copilot-commands.ts`                 | ④       | utility            | —                | `keyboard-shortcuts/analyze-commands.ts` (pure pathname→cmd helper)                                                                                                            | exact         |
| `frontend/src/components/keyboard-shortcuts/CommandPalette.tsx` (mod) | ④       | component          | —                | self (P71 `getAnalyzeCommandActions` wiring at L88/141)                                                                                                                        | exact         |
| `frontend/src/routes/_protected.tsx` (mod)                            | ④       | route              | —                | self (mount as `<DossierDrawer />` sibling, L88-108)                                                                                                                           | exact         |
| `frontend/src/i18n/{en,ar}/copilot.json` + `i18n/index.ts` (mod)      | ④       | config (i18n)      | —                | `i18n/index.ts` static registry L264-535                                                                                                                                       | exact         |
| `frontend/src/components/layout/Topbar.tsx` (mod, FAB)                | ④       | component          | —                | self (`.tb-search` pill + icon-button idiom L75-110)                                                                                                                           | exact         |

---

## Shared Patterns

> Cross-cutting concerns applied across multiple new files. Plans reference these once, not per-file.

### Shared Pattern A — JWT keystone: per-request Supabase client (the single most-copied idiom)

**Source:** `backend/src/ai/agents/chat-assistant.ts` lines 19-28
**Apply to:** EVERY read tool (③), `_supabase.ts`, `brief-generator.ts`/`intake-linker.ts` user-triggered paths (D-10).

```typescript
// P68 REMED-03 (D-08): build a per-request Supabase client scoped to the caller's
// JWT so RLS (sensitivity_level <= clearance_level) applies. The service-role
// admin client is retired from the interactive assistant — it bypassed RLS and
// leaked above-clearance content. ANON_KEY + the caller's Bearer token runs every
// read under the user's role.
function createUserClient(authHeader: string): SupabaseClient {
  return createClient(process.env.SUPABASE_URL ?? '', process.env.SUPABASE_ANON_KEY ?? '', {
    global: { headers: { Authorization: authHeader } },
  })
}
```

> **P72 adaptation (RESEARCH §Pattern 3):** the tool layer reads the header from `runtimeContext.get('authorization')`
> (delivered by `setContext`) and adds `auth: { persistSession: false, autoRefreshToken: false }` for short-lived
> per-request clients. **⚠ Mastra #4465 gate:** assert `runtimeContext.get('authorization')` is non-empty before the
> RPC call — if the AGUI bridge drops it, every tool returns empty (looks like a broken copilot). This is the spike's #1 job.

### Shared Pattern B — Edge-fn JWT-wrap of a SECURITY INVOKER RPC (the read-tool call shape)

**Source:** `supabase/functions/analytic-graph/index.ts` lines 47-77
**Apply to:** every wrapping tool (`read-signals.ts`, `query-graph.ts`, `generate-digest.ts`, `hybrid-rag-search.ts`).

```typescript
// Get authorization header
const authHeader = req.headers.get('Authorization')
if (!authHeader) {
  /* 401 */
}
// Extract JWT token from Authorization header
const token = authHeader.replace('Bearer ', '')
// Create Supabase client with user context (anon key + forwarded caller JWT,
// NOT service-role — clearance is enforced under the caller's identity).
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  { global: { headers: { Authorization: authHeader } } },
)
// Verify user authentication (required for the RPC's inline clearance to resolve)
const {
  data: { user },
  error: userError,
} = await supabaseClient.auth.getUser(token)
if (userError || !user) {
  /* 401 */
}
// …then sb.rpc('<rpc_name>', { p_… }) — the RPC's SECURITY INVOKER + inline clearance does the gating.
```

> **Why this is the model, not `chat-assistant.ts`'s heuristic router:** `chat-assistant.ts:decideToolUsage` (L626-773) is
> if/else keyword string-matching that P72 **replaces** with Gemma-4 model-native tool-calling (`--tool-call-parser gemma4`).
> Lift the **prompts + `createUserClient` + the per-tool DB reads**, NOT the heuristic `decideToolUsage`.

### Shared Pattern C — `SECURITY INVOKER` + inline clearance + indistinguishable-empty (every new RPC)

**Source:** `supabase/migrations/20260617_phase71_query_graph.sql` lines 54-80, 281-289, 298-306
**Apply to:** `hybrid_rag_search` RPC; informs the `rag_chunks` RLS policy.

```sql
LANGUAGE plpgsql            -- (or `sql` for hybrid_rag_search; query_graph is plpgsql for the dispatch)
SECURITY INVOKER            -- CRITICAL: never DEFINER — v7.0 cross-cutting guarantee
STABLE
AS $$
DECLARE v_clearance INTEGER := 0;   -- default 0 = deny-all
BEGIN
  IF auth.role() = 'service_role' THEN
    v_clearance := 4;               -- trusted backend bypass (max sensitivity)
  ELSE
    SELECT COALESCE((
      SELECT p.clearance_level FROM public.profiles p WHERE p.user_id = auth.uid()   -- user_id, NEVER id
    ), 0) INTO v_clearance;
  END IF;
  -- …joins filter `AND d.sensitivity_level <= v_clearance` INLINE…
  -- Empty result for "no data" AND "above clearance" is the SAME shape (indistinguishable-empty):
  IF v_result IS NULL THEN
    v_result := jsonb_build_object('nodes','[]'::jsonb,'edges','[]'::jsonb,
      'stats', jsonb_build_object('node_count',0,'edge_count',0));   -- NO `clearance`/`filtered`/`restricted` keys
  END IF;
  RETURN v_result;
END; $$;
REVOKE EXECUTE ON FUNCTION public.<fn>(…) FROM PUBLIC, anon;   -- least privilege
GRANT  EXECUTE ON FUNCTION public.<fn>(…) TO authenticated;
```

> **🔴 LANDMINE (carried P69/P71 lock):** `profiles` has **NO `id` column** (verified live: only `user_id, clearance_level`).
> `WHERE id = auth.uid()` silently binds to the OUTER table → NULL → `<= NULL` is false → **deny-all for every user**, and
> build/typecheck/apply ALL pass green. **The closest table-RLS analog `20251022000009_update_polymorphic_refs.sql` is WRONG
> on this point** (it uses `WHERE id = auth.uid()` at L102/L119/L131). **Do NOT mirror that file's clearance subquery.**
> Mirror P71 (above) / P69 / the P68 RPC (`WHERE user_id = auth.uid()`).

### Shared Pattern D — Indistinguishable-empty in the rendered payload (carried P71 GRAPH-03 lock)

**Source:** UI-SPEC Copywriting Contract (no-answer row) + MEMORY `project_indistinguishable_empty_forbids_clearance_substring`
**Apply to:** `hybrid_rag_search` RPC, every tool return, every copilot-rendered card, the no-answer copy.

The substring `clearance` / `filtered` / `restricted` MUST NOT appear ANYWHERE in any copilot payload — visible copy,
aria-live, OR JSON keys/values (no `stats.clearance_level`). Add a test asserting
`not.toMatch(/clearance|filtered|restricted/i)` over the FULL serialized payload. The neutral no-answer copy is the only
empty messaging ("The copilot couldn't find anything to answer that…" / "لم يجد المساعد ما يجيب عن ذلك…").

### Shared Pattern E — i18n static-namespace registration (silent-English-fallback guard)

**Source:** `frontend/src/i18n/index.ts` (imports L5-…, `resources` map L264-535)
**Apply to:** the new `copilot` namespace (④).

```typescript
// 1. add flat static imports next to the other ~62 namespaces (L5+):
import enCopilot from './en/copilot.json'
import arCopilot from './ar/copilot.json'
// 2. register in BOTH branches of the `resources` map (L265 en:, L397 ar:):
const resources = {
  en: { /* …common: enCommon, … */ copilot: enCopilot },
  ar: { /* …common: arCommon, … */ copilot: arCopilot },
}
```

> `public/locales` is DEAD (static bundle only). An unregistered-but-used namespace falls back to English in BOTH langs
> (looks fine in EN, breaks AR). The P68 CI guard (folded into Lint) fails the build only if the namespace is used AND
> unregistered. Language persists under `localStorage['id.locale']` (NOT `i18nextLng`).

---

## Pattern Assignments

### ① `agent-runtime/package.json` (config)

**Analog:** `backend/package.json`

**Scripts + type:module + lint-from-root** (lines 2-22) — mirror exactly:

```jsonc
{
  "name": "agent-runtime",
  "type": "module",
  "scripts": {
    "dev": "NODE_ENV=development tsx watch src/index.ts",
    "build": "node build.mjs", // or tsc; turbo build expects dist/**
    "start": "node dist/index.js",
    "test": "vitest --config ./vitest.config.ts",
    "lint": "cd .. && eslint -c eslint.config.mjs --max-warnings 0 'agent-runtime/src/**/*.ts'",
    "type-check": "tsc --noEmit",
  },
}
```

**🔴 Re-pin flag (RESEARCH DRIFT):** `backend/package.json:25` pins `"@mastra/core": "^1.36.0"`, but RESEARCH verified
live latest is **1.43.0**. The lift target must be re-pinned to the spike-passing version. Also already present and
reusable: `bullmq: 5.77.1` (L41), `zod: ^4.3.6` (L60), `@supabase/supabase-js: ^2.100.1` (L30), `pnpm@10.29.1` (Dockerfile).

---

### ① `agent-runtime/Dockerfile.prod` (config)

**Analog:** `backend/Dockerfile.prod`

Multi-stage Alpine build + **pinned pnpm** (lines 33-34, 53-101) — mirror; change only `EXPOSE`/`PORT` to 4100 and the healthcheck URL:

```dockerfile
# Install pnpm (pinned to match the repo's packageManager; pnpm@latest moved to
# v11 which hard-fails on ignored native build scripts via ERR_PNPM_IGNORED_BUILDS)
RUN corepack enable && corepack prepare pnpm@10.29.1 --activate
…
FROM node:22-alpine AS production
RUN apk add --no-cache vips libc6-compat tini curl
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
ENV NODE_ENV=production
ENV PORT=4100                                    # was 4000
USER nodejs
EXPOSE 4100                                       # was 4000
HEALTHCHECK --interval=30s … CMD curl -f http://localhost:4100/health || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
```

> **🔴 MEMORY lock:** pin `pnpm@10.29.1` — `pnpm@latest`→v11 breaks prod builds. Never port 5000 (macOS AirPlay). Port = 4100
> (backend 4000, anythingllm 3001, langfuse 3000, phoenix 6006/4317).

---

### ① `deploy/docker-compose.prod.yml` (mod — add `agent-runtime` + `vllm` + `tei-embed` + `tei-rerank`)

**Analog:** existing service blocks — `backend:` (line 64), and the internal-only zero-egress `langfuse:` (L183) / `phoenix:` (L216).

The codebase convention (verified): **internal services use `expose:` NEVER `ports:`** (only `nginx:` L12 has `ports:`);
zero-egress services carry a `# Internal-only … Zero egress` banner (L180). Mirror the `backend:` block
(`build.context`/`build.dockerfile`, `container_name: intl-dossier-<svc>`, `environment:`, `depends_on: [redis]`,
`networks: [intl-dossier]`). The full service YAML is pre-written in **RESEARCH §Pattern 1** (lines 253-294) — copy it.

> **🔴 CORS lock (MEMORY edge-fn lesson):** `ALLOWED_ORIGINS` is a **secret**, never `'*'`. Unset → ACAO:null on deployed
> origins. Set Mastra `server.cors.origin = process.env.ALLOWED_ORIGINS.split(',')` +
> `allowHeaders: ['content-type','authorization','x-copilotkit-runtime-client-gql-version']`.

---

### ① `agent-runtime/src/config.ts` + `llm-router.ts` (lift)

**Analog:** `backend/src/ai/config.ts` (lift verbatim) + `backend/src/ai/llm-router.ts`

`config.ts` already has the `vllm`/`ollama`/`anythingllm` provider blocks (L105-123) and the OpenAI-compatible swap point.
The only change: default the copilot provider to `vllm` (Gemma-4) via config; do NOT flip backend's global
`AI_USE_ANYTHINGLLM` (RESEARCH Runtime State). The `vllm` block is the model-swap seam:

```typescript
vllm: {
  provider: 'vllm',
  baseUrl: process.env.VLLM_BASE_URL || 'http://localhost:8000',
  defaultModel: 'llama-3.1-70b',     // → re-point to 'gemma-4-12b' (served-model-name)
  enabled: !!process.env.VLLM_BASE_URL,
},
```

---

### ① `agent-runtime/src/mastra/agents/copilot.ts` (agent)

**Analog:** `backend/src/ai/agents/chat-assistant.ts` (system prompts L74-110; tool roster L390-448)

**Lift the EN + AR system prompts** (the bilingual keystone — AGENT-06) and **the prompt-selection idiom** (L472):

```typescript
const systemPrompt = language === 'ar' ? ARABIC_CHAT_SYSTEM_PROMPT : CHAT_SYSTEM_PROMPT
```

`CHAT_SYSTEM_PROMPT` / `ARABIC_CHAT_SYSTEM_PROMPT` (L74-110) are ready to lift; thread `language` from
`runtimeContext.get('language')`. Adapt the prompts to the reads-only P72 tool roster (signals/graph/digest-preview/RAG/
dossier/work-item) and the "answers only from data you're cleared to see" framing (UI-SPEC empty-state body).

> **Do NOT lift `decideToolUsage` (L626-773)** — heuristic keyword routing is replaced by model-native tool-calling.

---

### ② `…_rag_chunks.sql` (migration — NEW table)

**Analog:** `20260614_phase69_signals_extend.sql` (ALTER+index+RLS template) + `20250129006_create_ai_tables.sql` (pgvector/bge-m3 shape)

The complete `CREATE TABLE rag_chunks` (halfvec(1024), denormalized `sensitivity_level`, dual `content_tsv_en`/`content_tsv_ar`
GENERATED columns, HNSW `halfvec_cosine_ops` + GIN indexes, RLS policy) is pre-written in **RESEARCH §Code Examples L486-515** — copy it.

**Mirror the P69 RLS policy form exactly** (the correct `user_id` clearance subquery), `20260614_phase69_signals_extend.sql` L60-65:

```sql
CREATE POLICY intelligence_event_select_clearance
  ON public.intelligence_event FOR SELECT TO authenticated
  USING (
    tenant_isolation.rls_select_policy(organization_id)
    AND sensitivity_level <= (SELECT clearance_level FROM profiles WHERE user_id = auth.uid())
  );
```

> **🔴 Live-verified facts the planner builds against (RESEARCH probe results L679-687):** `rag_chunks` does NOT exist (net-new);
> `ai_embeddings` is `vector(1024)` (NOT halfvec), 0 rows — **leave it untouched, it is NOT the write target**; pgvector = 0.8.0
> (iterative scans available). **Clearance-source asymmetry:** only `dossiers` + `intelligence_event` carry their own
> `sensitivity_level`; `positions`/`briefs`/`aa_commitments`/`documents`/`intelligence_signals` do NOT — the denormalized
> `sensitivity_level` per `rag_chunks` row MUST be resolved from the owning dossier per source table, **never defaulted**
> (default-low over-exposes; NULL deny-alls). The RLS-sync trigger maps each source's clearance explicitly.

---

### ② `…_hybrid_rag_search.sql` (migration — NEW RPC)

**Analog:** `20260617_phase71_query_graph.sql` (INVOKER + REVOKE/GRANT + indistinguishable-empty) + `20260614000002_p68_search_invoker_rpc.sql` (vector RPC + the `get_function_security` test helper)

The full `hybrid_rag_search` RPC (RRF k=60 over dense HNSW + sparse tsvector FULL OUTER JOIN, `websearch_to_tsquery`,
`p_lang` EN/AR switch) is pre-written in **RESEARCH §Code Examples L524-565** — copy it. Reuse the P68 schema-proof helper for
the AGENT-04 test:

```sql
-- 20260614000002_p68_search_invoker_rpc.sql L53-64 — the prosecdef introspection helper P72 reuses:
CREATE OR REPLACE FUNCTION get_function_security(p_proname text)
RETURNS TABLE (proname text, prosecdef boolean)
LANGUAGE sql SECURITY INVOKER STABLE
AS $$ SELECT p.proname::text, p.prosecdef FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE p.proname = p_proname AND n.nspname = 'public'; $$;
```

And the P68 INVOKER RPC body is the closest vector-RPC analog (note `WHERE user_id = auth.uid()` at L34 — the CORRECT form):

```sql
-- 20260614000002 L16-38 (excerpt):
CREATE OR REPLACE FUNCTION search_semantic_clearance_gated(
  p_query_embedding vector(1024), …)
RETURNS TABLE (entity_id uuid, owner_type text, similarity_score float, sensitivity_level int)
LANGUAGE sql SECURITY INVOKER STABLE   -- CRITICAL: never DEFINER
AS $$
  SELECT … FROM ai_embeddings ae JOIN dossiers d ON d.id = ae.owner_id
  WHERE …
    AND d.sensitivity_level <= (SELECT clearance_level FROM profiles WHERE user_id = auth.uid())
  ORDER BY ae.embedding <=> p_query_embedding LIMIT p_limit;
$$;
```

> **Tool-layer pre-call (RESEARCH L564):** `SET LOCAL hnsw.iterative_scan='relaxed_order'; SET LOCAL hnsw.max_scan_tuples=20000;`
> before the RPC so the RLS post-filter doesn't collapse recall (Pitfall 4). **RLS runs BEFORE rerank** — the TEI cross-encoder
> only sees RLS-passing candidates (rerank is in the tool layer, AFTER this RPC returns).

---

### ③ `agent-runtime/src/mastra/tools/_supabase.ts` + each tool

**Analog:** Shared Pattern A (`chat-assistant.ts:24`) + Shared Pattern B (`analytic-graph/index.ts`)

**Tool input schemas come straight from the live RPC signatures** (so the Zod types match the DB contract exactly):

```typescript
// read_signals  (20260614_phase69_signals_extend.sql L144-149) — verified:
//   read_signals(p_dossier_id UUID, p_status TEXT, p_since TIMESTAMPTZ, p_limit INTEGER DEFAULT 50) → TABLE
// query_graph   (20260617_phase71_query_graph.sql L46-51) — verified:
//   query_graph(p_query_type TEXT, p_entity_id UUID, p_entity_id_2 UUID, p_window_days INTEGER DEFAULT 90) → JSONB
//   whitelist (analytic-graph/index.ts L18): ['forum_membership','shared_committees','engagement_chain','shortest_path']
// generate_digest (P70) PREVIEW ONLY: expose p_period ∈ {daily,weekly,monthly} + dossier from context; NEVER publish_digest.
```

The `dossier-lookups.ts` tool mirrors `chat-assistant.ts` `getDossier` (L245-275) / `listDossiers` (L352-384) /
`queryCommitments` (L277-317, already repointed to `aa_commitments`) verbatim — each is a `createUserClient(authHeader)`
`.from(...).select(...)` read returning `{ … } || []` on error (indistinguishable-empty). Example (`getDossier` L250-263):

```typescript
const supabaseClient = createUserClient(authHeader)
const { data, error } = await supabaseClient
  .from('dossiers')
  .select(
    `id, name_en, name_ar, type, description_en, description_ar,
           status, sensitivity_level, tags, metadata, created_at, updated_at`,
  )
  .eq('id', input.dossierId)
  .eq('is_active', true)
  .single()
if (error || !data) return { dossier: null } // empty == indistinguishable on clearance denial
```

> **🔴 Never** pass `SUPABASE_SERVICE_ROLE_KEY` to a tool (RESEARCH Anti-Patterns). Never a generic `execute_sql` — each tool is
> one narrow Zod-typed least-privilege op.

---

### ③ `backend/src/jobs/reembed-rag-chunks.ts` (re-embed backfill — D-06/AGENT-05)

**Analog:** `backend/src/queues/intelligence-alert.worker.ts` (BullMQ Queue + hyphen jobId) + `embeddings-service.ts:544` `storeEmbedding`

**BullMQ enqueue idiom — hyphen jobIds** (`intelligence-alert.worker.ts` L65-70):

```typescript
async function enqueueAlertCheck(payload: IntelligenceAlertPayload): Promise<void> {
  await notificationQueue.add('intelligence-alert', payload, {
    jobId: `alert-${payload.event_id}-check`, // 🔴 HYPHENS — BullMQ 5.x forbids ':' in custom jobId (MEMORY)
    removeOnComplete: { count: 500 },
  })
}
```

**The `array_length=1024` write guard** (`embeddings-service.ts:544-565` — re-point `.from('ai_embeddings')` → `'rag_chunks'`):

```typescript
async storeEmbedding(ownerId: string, ownerType: string, content: string): Promise<void> {
  const { embedding } = await this.embed(content)
  if (embedding.length !== 1024) {                 // AGENT-05: fail loudly, never pad/truncate
    throw new Error(`Expected 1024-dim embedding, got ${embedding.length}`)
  }
  const { error } = await supabaseAdmin.from('ai_embeddings').upsert({   // → 'rag_chunks'
    owner_type: ownerType, owner_id: ownerId,
    embedding: `[${embedding.join(',')}]`,         // pgvector text literal
    …
  }, { onConflict: 'owner_type,owner_id,model' })   // → 'source_type,source_id,chunk_index'
}
```

> **service-role is CORRECT here** (background/no-user backfill — the D-10 cron carve-out, document explicit app-layer authz).
> Embedder = `Xenova/bge-m3` ONNX (`embeddings-service.ts:96`, config default 1024) OR TEI `bge-m3`. **Corpus is tiny (~23 rows
> live + seeded)** → one-shot, no batching/throughput planning (RESEARCH A2). Verification SQL:
> `SELECT count(*) FROM rag_chunks WHERE vector_dims(embedding) <> 1024` must be 0.

---

### ③ `backend/src/ai/agents/brief-generator.ts` + `intake-linker.ts` (D-10 audit/retire)

**Analog:** self — apply Shared Pattern A to user-triggered paths; document app-layer authz on genuine background paths.

**`supabaseAdmin` call sites to triage (verified via grep):**

| File                 | Import                                                         | Call-site lines                    |
| -------------------- | -------------------------------------------------------------- | ---------------------------------- |
| `brief-generator.ts` | L15 `import { supabaseAdmin } from '../../config/supabase.js'` | L413, L444, L472                   |
| `intake-linker.ts`   | L14 same import                                                | L194, L243, L264, L392, L422, L452 |

For each: if the path is **user-triggered**, swap `supabaseAdmin` → `createUserClient(authHeader)` (thread the caller JWT in,
exactly as `chat-assistant.ts` did in P68). If **genuinely background/cron** (e.g. `intake-linker` writing
`ai_entity_link_proposals` L452 from a queue), keep service-role but **document the explicit app-layer authz** (the keystone
carve-out). This closes the folded `p68-followup-supabaseadmin-background-agents.md` todo.

---

### ④ `frontend/src/components/copilot/CopilotDrawer.tsx` (desktop slide-over)

**Analog:** `frontend/src/components/dossier/DossierDrawer/DossierDrawer.tsx` (the 720px Sheet — UI-SPEC names it verbatim)

**Copy the Sheet wiring + width token + mobile shadow override + error branch** (DossierDrawer L89-133):

```tsx
<Sheet open={open} onOpenChange={(v) => { if (!v) closeDrawer() }}>
  <SheetContent
    side="right"
    accessibleTitle={t('accessible_title')}
    className="drawer w-[min(720px,92vw)] max-md:w-screen max-md:border-0 max-md:shadow-none p-0 gap-0"
    style={{ boxShadow: isMobileNarrow ? 'none' : undefined }}   // inline beats cva-base shadow at ≤768px
  >
    <DrawerHead … onClose={closeDrawer} />
    <div className="drawer-body">
      {failed ? (
        <div role="alert" className="px-4 py-16 text-center space-y-2">   {/* UI-SPEC error state */}
          <p className="text-sm font-semibold text-[var(--danger)]">{t('error.heading')}</p>
          <p className="text-sm text-muted-foreground">{t('error.body')}</p>
          <Button variant="outline" size="sm" className="min-h-11" onClick={retry}>{t('error.retry')}</Button>
        </div>
      ) : /* message stream / empty / loading */ }
    </div>
  </SheetContent>
</Sheet>
```

Also copy the `useSyncExternalStore` `matchMedia('(max-width: 768px)')` mobile-detection hook (L69-85) — jsdom-safe, SSR-safe.
The `.drawer` class carries `--shadow-lg` (the one allowed drawer shadow). `DrawerHead.tsx` is the header analog (title + close,
logical-property row order per UI-SPEC Dimension 2).

---

### ④ `CopilotSheet` (mobile branch ≤768px)

**Analog:** `frontend/src/components/dossier/RelationshipSidebar.tsx` lines 494-510

```tsx
<BottomSheet
  open={mobileOpen}
  onOpenChange={(val) => {
    if (!val) onMobileClose?.()
  }}
  snapPreset="large"
>
  <BottomSheetContent showHandle>
    <BottomSheetHeader>
      <BottomSheetTitle>{t('copilot.title')}</BottomSheetTitle>
      <BottomSheetDescription>{t('copilot.empty.body')}</BottomSheetDescription>
    </BottomSheetHeader>
    {/* same single data path as desktop — only the chrome differs (D-04) */}
  </BottomSheetContent>
</BottomSheet>
```

Imports (RelationshipSidebar L29-35): `BottomSheet, BottomSheetContent, BottomSheetHeader, BottomSheetTitle, BottomSheetDescription`.
The active/unread accent dot idiom (L436) is the ThreadList unread-dot the UI-SPEC cites:
`bg-[var(--accent)] text-[var(--accent-fg)]`.

---

### ④ `frontend/src/components/copilot/copilot-commands.ts` + `CommandPalette.tsx` (mod)

**Analog:** `frontend/src/components/keyboard-shortcuts/analyze-commands.ts` (the pure pathname→command helper P71 added)

Mirror the helper shape exactly — i18n-free, reads the dossier id from the pathname, returns `[]` off a dossier route, so
Cmd+K pre-fills dossier context (D-05). The dossier-id extraction is reusable verbatim (`analyze-commands.ts` L77-83):

```typescript
export function extractDossierIdFromPathname(pathname: string): string | null {
  const segments = Object.values(DOSSIER_TYPE_TO_ROUTE).join('|')
  const match = new RegExp(`^/dossiers/(?:${segments})/([^/?#]+)`).exec(pathname)
  const id = match?.[1]
  return id != null && id.length > 0 ? id : null
}
```

The copilot helper returns one command (`cmd-ask-copilot-about-dossier` → opens the drawer with `dossierId` pre-filled as
`useCopilotReadable` context) instead of four analyze deep-links. **Wiring into CommandPalette** mirrors the P71 pattern already
in the file: import (`CommandPalette.tsx:88` `import { getAnalyzeCommandActions } from './analyze-commands'`), localized-label
map (L141-145 `analyzeLabelKey`), and per-route `suggestedActions` (L219). Add a `copilot` command group the same way.

---

### ④ `frontend/src/routes/_protected.tsx` (mod — mount point)

**Analog:** self — the CopilotKit provider + `<CopilotDrawer />` mount as a sibling of the existing drawers (L88-108):

```tsx
<ChatProvider>
  <AppShell>
    <ErrorBoundary>
      <Outlet />
    </ErrorBoundary>
  </AppShell>
  <ErrorBoundary>
    <ChatDock onCitationClick={handleCitationClick} />
  </ErrorBoundary>
  <ErrorBoundary>
    <DossierDrawer />
  </ErrorBoundary>{' '}
  {/* ← mirror this: */}
  <ErrorBoundary>
    <CommitmentDrawer />
  </ErrorBoundary>
  {/* P72: <CopilotKit runtimeUrl="/api/copilot/chat" agent="copilot" headers={{authorization, 'x-language'}}>
            <CopilotDrawer /> </CopilotKit>  — wrapped in <ErrorBoundary>, same as siblings */}
</ChatProvider>
```

The CopilotKit `<CopilotKit>` provider config (`runtimeUrl`, `agent`, `headers` carrying `Bearer ${session.access_token}` +
`x-language: i18n.language`) is pre-written in **RESEARCH §Pattern 2 L338-348**. Mounting under `/_protected` guarantees
authenticated-only access (the route already `redirect`s unauthenticated users). **🔴 Bundle Size (MEMORY):** frontend entry is
near the 460KB ceiling — **dynamic-import the CopilotDrawer** so CopilotKit react-ui weight stays out of the entry chunk.

---

### ④ `Topbar.tsx` (mod — copilot FAB / Cmd+K entry)

**Analog:** self — the `.tb-search` Cmd+K pill (L90-110) + the icon-button idiom (L75-110)

The Topbar already renders a Cmd+K search pill with an inner `⌘K` kbd hint and a row of `aria-label`'d icon buttons
(`<button aria-label={…} onClick={…}>` with `lucide-react` glyphs, L75-210). The copilot FAB mirrors this idiom: a `.btn-ghost`
icon button, `aria-label="Ask the copilot"` (UI-SPEC), `lucide` glyph, that opens the drawer (mobile) — and the Cmd+K pill gains
the copilot command row (desktop). Use the kbd-hint pattern at `--font-mono` `--t-mono-small` (UI-SPEC Typography).

---

## No Analog Found

Genuinely net-new pieces — the planner writes **first-principles tasks**, not mirror-an-analog tasks. The closest references
below are _scaffolds to adapt_, not patterns to copy.

| File / Concern                                                                                             | Surface | Role           | Data Flow | Why no analog                                                                                                                                                                                                                                                        | Closest reference (adapt, don't copy)                                                                              |
| ---------------------------------------------------------------------------------------------------------- | ------- | -------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `agent-runtime/src/mastra/index.ts` — **`registerCopilotKit` + AG-UI SSE bridge**                          | ①       | server/runtime | streaming | No 4th-workspace, no Mastra-server-with-apiRoutes, no AG-UI/SSE termination exists anywhere. `mastra-config.ts` only does `new Mastra({})` + OTel (no server, no agents registered). **Mastra #4465 risk** (JWT may not reach tools) makes this the spike's #1 gate. | RESEARCH §Pattern 2 (L302-331, pre-written `setContext` + `bundler.externals`); official Mastra `copilotkit.mdx`   |
| **CopilotKit `--copilot-kit-*` → IntelDossier token remap** + shadow-neutralization + `dir="rtl"`          | ④       | styling        | —         | No existing component re-skins CopilotKit; CopilotKit CSS ships **0 RTL/logical rules + hardcoded box-shadows** (RESEARCH-verified). The token-remap table is net-new CSS.                                                                                           | UI-SPEC "CopilotKit theming contract" (the remap table); MEMORY `tailwindv4_translate` + RTL `.btn-*` Tajawal rule |
| **Throwaway Option-C spike harness** (custom AI-SDK + Ollama, AG-UI SSE loop, one token-bound tool render) | ①/④     | spike          | streaming | By definition throwaway + first-of-its-kind; proves #4465 (JWT-reaches-tools) AND D-09 (CopilotKit RTL/token fidelity + air-gap) before the production stack locks.                                                                                                  | RESEARCH §Open Questions 1-2; `@ai-sdk/openai` + `ollama-ai-provider-v2` + `@ag-ui/client` HttpAgent               |
| **`@mastra/pg` `mastra_threads`/`mastra_messages` auto-provisioned tables + their RLS**                    | ②       | migration      | CRUD      | `@mastra/pg` `PostgresStore` auto-creates the tables (no hand-written `CREATE TABLE`); P72 only ADDS owner-only RLS on top — but no "RLS-on-a-library-managed-table" precedent exists.                                                                               | Shared Pattern C RLS form (apply `user_id = auth.uid()` owner-only SELECT); RESEARCH D-08 / §Don't-Hand-Roll       |

> **MEDIUM-confidence flags the planner must close at plan time (RESEARCH Assumptions/Open Questions):** (A5/Q1) does the JWT
> reach `tool.execute()` through the AGUI bridge (#4465) — spike gate #1; (A6/Q2) can CopilotKit hit RTL+token fidelity or is
> `assistant-ui` headless the landing — spike gate #2; (A4/Q4) Gemma-4-12B GPU fit at FP8/8K — infra track. The fallback for Q2
> is documented (headless `assistant-ui`, ships `/docs/rtl`); CopilotKit runtime/hooks/HITL stay either way.

---

## Metadata

**Analog search scope:** `backend/src/ai/**`, `backend/src/queues/**`, `supabase/migrations/**`, `supabase/functions/**`,
`frontend/src/components/{dossier,keyboard-shortcuts,layout,copilot}/**`, `frontend/src/routes/_protected*`,
`frontend/src/i18n/**`, `pnpm-workspace.yaml`, `turbo.json`, `deploy/docker-compose.prod.yml`.
**Files scanned (read in full or targeted):** 18 (mastra-config, config, chat-assistant, embeddings-service §, brief/intake-linker grep,
backend package/tsconfig/Dockerfile.prod, pnpm-workspace, turbo.json, 4 migrations, analytic-graph edge fn,
DossierDrawer, RelationshipSidebar §, analyze-commands, i18n grep, CommandPalette grep, Topbar grep, \_protected grep, docker-compose grep).
**Pattern extraction date:** 2026-06-18
**🔴 Carried locks surfaced for the planner:** `profiles.user_id` not `id` (deny-all); indistinguishable-empty forbidden-substring;
BullMQ hyphen jobIds; never port 5000; `ALLOWED_ORIGINS` secret not `'*'`; i18n static-registration (silent-EN fallback);
pnpm@10.29.1 pin; SECURITY INVOKER never DEFINER; RLS-before-rerank; `@mastra/core` re-pin ^1.36→1.43;
`20251022000009` clearance subquery is the WRONG `id =` form — do NOT mirror it.
