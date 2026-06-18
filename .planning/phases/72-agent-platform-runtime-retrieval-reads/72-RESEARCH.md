# Phase 72: Agent Platform — Runtime, Retrieval, Reads - Research

**Researched:** 2026-06-18
**Domain:** On-prem agentic copilot — Mastra + CopilotKit/AG-UI runtime, vLLM/TEI serving substrate, hybrid-RAG over clearance-gated pgvector, JWT-keystone read tools, bilingual/RTL conversational drawer
**Confidence:** HIGH on architecture/stack/landmines (verified against live migrations + npm + official source); MEDIUM on CopilotKit RTL fidelity (must be settled by the D-03 spike — evidence points to headless fallback being likely); MEDIUM on GPU fit for Gemma 4 12B at 16–24GB.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01: New `agent-runtime` Turborepo workspace.** 4th workspace alongside `backend`/`frontend`/`shared`: Express + `@copilotkit/runtime` hosting the Mastra agent, terminating AG-UI over SSE, calling the local model over OpenAI-compatible `/v1`, exposing dossier ops as **narrow, Zod-typed, least-privilege** tools (never a generic `execute_sql`). Own container in `deploy/docker-compose.prod.yml` on a **distinct port** (avoid 5000/AirPlay), `turbo.json` pipeline entry, CORS via `ALLOWED_ORIGINS` **secret** (not hardcoded). **Lift, don't rewrite** `backend/src/ai/mastra-config.ts` + `llm-router.ts`.
- **D-02: Serving = vLLM + Gemma 4 12B; no ALLaM in v1.** Single 16–24GB GPU confirmed available. Gemma 4 12B (QAT/FP8) on vLLM (OpenAI-compatible `/v1`), eval-gated + config-swappable. llama.cpp/Ollama for dev/spike. Bilingual eval harness (P68/P74) is the Arabic guarantee, not the model.
- **D-03: Option-C spike first = throwaway, then rebuild.** Minimal custom AI-SDK + Ollama slice proving AG-UI SSE loop + RTL streaming + one token-bound tool-call render, then rebuild on Mastra + vLLM.
- **D-04: Responsive app-wide copilot drawer.** Desktop = right-side slide-over (mirrors 720px dossier drawer); mobile ≤767 = full-screen / bottom sheet (mirrors `RelationshipSidebar → BottomSheet`), launched from topbar/FAB. Single component, one data path, RTL-aware + token-bound. `word-assistant` untouched. Second entry = Cmd+K (desktop) / topbar-FAB (mobile).
- **D-05: Context-aware in v1.** Opening the drawer on a dossier passes that dossier (+type) as readable context (`useCopilotReadable`-style); Cmd+K launched from a dossier pre-fills context.
- **D-06: v1 re-embed corpus = core intelligence text + documents/OCR.** Chunk + embed into the single bge-m3 1024-dim halfvec store: dossiers (8 types) + signals (P69) + briefs/after-action + positions + uploaded documents/attachments (OCR'd text). Graph relationships served by `query_graph` (not RAG); digests are deterministic rollups.
- **D-07: v1 read-tool roster = wrap all three + RAG.** `hybrid_rag_search` (new) + `read_signals` (wrap P69 RPC) + `query_graph` (wrap P71 RPC) + dossier/work-item lookups (read) + `generate_digest` **PREVIEW-ONLY** (publish stays P73). All P69/P71 tools already built + direct-invocation tested.
- **D-08: Persistent, user-private conversation threads.** Saved + resumable, stored via `@mastra/pg` on the same Supabase Postgres, RLS = user owns own threads only. Audit = Langfuse traces + stored threads.
- **D-09: CopilotKit-first — "master CopilotKit."** Adopt CopilotKit end-to-end (runtime + hooks + generative-UI + HITL) and render the shell through CopilotKit's own customization (`--copilot-kit-*` CSS vars + headless slots + render-prop overrides). **The Option-C spike MUST prove two things before this locks:** (1) RTL + token fidelity to the CLAUDE.md design bar; (2) full air-gap (self-hosted `@copilotkit/runtime`, zero egress, no Copilot Cloud key). Documented fallback if either fails: headless `assistant-ui` / custom `@ag-ui/client` shell (CopilotKit runtime/hooks/HITL stay either way).
- **D-10: Retire `supabaseAdmin` broadly — fold + audit now.** Beyond `chat-assistant.ts`, also audit `brief-generator.ts` + `intake-linker.ts`: move user-triggered paths to the JWT-scoped per-request client; document explicit app-layer authz where genuinely background/cron.
- **D-11: OSS-survey mandate.** Scout battle-tested OSS for chat UX/streaming/markdown/citation/generative-UI/RAG-rerank/AG-UI-clients; prefer it over hand-rolled. Guardrail: fully on-prem / no egress / no Cloud key, permissively licensed (Apache/MIT; Gemma's license the one exception), themable to token-only + RTL/Tajawal.

### Claude's Discretion

- Spike build form (D-03) — throwaway AI-SDK+Ollama then rebuild (researcher may confirm vs graduate-in-place).
- vLLM concurrency targets, FP8/AWQ quantization, eval-challenger bench (Qwen3.5 / Fanar-2 kept available behind the same `/v1`).
- Chunking strategy, top-k after rerank, RRF `k`, iterative-scan tuning, coalescing.
- agent-runtime port number, turbo/docker wiring specifics.
- Generative-UI depth — P72 renders answers + citations token-bound; rich inline dossier cards are the P73 generative-UI deliverable.

### Deferred Ideas (OUT OF SCOPE)

- **Writes + HITL `renderAndWaitForResponse` confirmation cards + generative-UI dossier cards** → Phase 73. P72 is **reads-only**. `generate_digest` ships **preview-only** (no publish).
- **Bilingual eval rubrics as a CI gate + full AnythingLLM decommission** → Phase 74. P72 only retires AnythingLLM from the copilot critical path (wrap as MCP if needed).
- **ALLaM/SDAIA wiring** — not in v1.
- **External `feed` ingestion / untrusted-content quarantine** → v7.1 (FEED-01/02).
- **Repurposing `word-assistant`** — left untouched (D-04).
- **Larger Arabic brain (27–32B)** — gated on a bigger GPU; config-level eval-gated swap.
- **Multi-GPU / horizontal serving scale-out** → v7.1 (SCALE-01).
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID       | Description                                                                                        | Research Support                                                                                                                                                                              |
| -------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AGENT-01 | Cleared user converses with the copilot from a primary surface AND via Cmd+K                       | §Conversational Surface (drawer + `CommandPalette` copilot entry mirroring P71 `analyze-commands`); §Runtime (CopilotKit shell on `_protected` tree)                                          |
| AGENT-02 | Copilot answers from gated data (signals/digests/graph/dossiers) under the caller's JWT            | §Read-Tool Roster (wrap `read_signals`/`query_graph`/`generate_digest`-preview + `hybrid_rag_search` + dossier/work-item lookups); §JWT Keystone (`setContext` → per-request Supabase client) |
| AGENT-03 | Non-cleared user gets reduced results, never above-clearance content                               | §JWT Keystone + §Hybrid Retrieval (INVOKER + RLS-before-rerank); §Indistinguishable-Empty                                                                                                     |
| AGENT-04 | Hybrid (dense+sparse+rerank) RAG over a single chunks store, clearance by `SECURITY INVOKER` + RLS | §Chunks Store Decision + §Hybrid Retrieval Mechanics                                                                                                                                          |
| AGENT-05 | Retrievable content embedded at bge-m3 1024-dim (one-time re-embed; no dimension drift)            | §Re-embed Job (D-06)                                                                                                                                                                          |
| AGENT-06 | Copilot replies in user's language (EN/AR) with correct RTL                                        | §Bilingual/RTL + Token-Bound Rendering; §Conversational Surface                                                                                                                               |
| INFRA-01 | Local LLM over OpenAI-compatible API (vLLM + Gemma 4 12B), swappable by config                     | §Serving Substrate (vLLM Gemma 4)                                                                                                                                                             |
| INFRA-02 | Embeddings + reranking served locally (TEI: bge-m3 + bge-reranker-v2-m3)                           | §Serving Substrate (TEI)                                                                                                                                                                      |
| INFRA-03 | Agent runtime runs as its own Turborepo workspace in docker-compose.prod on a distinct port        | §agent-runtime Workspace Shape                                                                                                                                                                |

</phase_requirements>

## Summary

Phase 72 stands up the on-prem copilot as a **4th Turborepo workspace** (`agent-runtime`) running **Mastra 1.43** + the **self-hosted `@copilotkit/runtime` 1.60** (MIT) emitting **AG-UI over SSE**, fronted by **vLLM serving Gemma 4 12B** (released 2026-06-03; native tool-calling; OpenAI-compatible `/v1`) and a **TEI** container serving **bge-m3** (embeddings, MIT) + **bge-reranker-v2-m3** (rerank, Apache-2.0). Retrieval is **hybrid RAG over a single clearance-gated chunks store**: dense HNSW (halfvec 1024) + sparse tsvector (EN/AR GIN) fused by **RRF**, with **RLS running BEFORE the cross-encoder rerank**, all behind a **`SECURITY INVOKER` RPC**. Every agent DB read runs under the **caller's JWT** (the keystone), retiring `supabaseAdmin` from `chat-assistant.ts` and auditing `brief-generator.ts`/`intake-linker.ts`. The surface is a **single responsive copilot drawer** (desktop slide-over + mobile sheet) re-skinned to IntelDossier tokens, bilingual EN/AR + RTL.

The single most important reconciliation: **the chunks store.** The spec names `rag_chunks`; P68 left `ai_embeddings` at `vector(1024)` with 0 rows and an `owner_type` enum of only `{ticket, artifact}`. The recommendation below is **a NEW `rag_chunks` table** (not reuse of `ai_embeddings`) — because the re-embed corpus is 6 polymorphic source types with denormalized `sensitivity_level` + dual-language tsvector + chunk-level granularity, which `ai_embeddings` (entity-level, 2-value enum, full `vector` not `halfvec`) cannot host without a destructive rewrite. The P68 INVOKER RPC `search_semantic_clearance_gated` over `ai_embeddings` stays as the contract precedent and can be retired once `hybrid_rag_search` lands.

**The two highest-risk landmines** (both verified): (1) **Mastra issue #4465 — `runtimeContext` is not reliably passed to tools when using the AGUI/CopilotKit bridge** — this is the JWT-keystone delivery path; the Option-C spike MUST prove the JWT reaches `tool.execute()` or the entire clearance model is bypassed/broken. (2) **CopilotKit's built-in CSS ships ZERO RTL/logical-property rules** (verified against source `react-ui/src/css/*.css`) and hardcodes box-shadows — so D-09's "RTL + token fidelity" is genuinely at risk and the **headless `assistant-ui` fallback (which ships a dedicated `/docs/rtl` page, HTTP 200 verified) is the likely landing spot** if the spike can't tame CopilotKit's chrome.

**Primary recommendation:** Build the throwaway Option-C spike FIRST to settle BOTH the JWT-reaches-tools question (#4465) AND the CopilotKit-RTL/token-fidelity question (D-09) before committing the production stack; stand up a NEW `rag_chunks` table (halfvec 1024, INVOKER hybrid RPC, RLS via `profiles.user_id = auth.uid()`); wrap the three already-built P69/P70/P71 RPCs as Zod-typed read tools under the JWT-scoped per-request Supabase client; run the re-embed as a one-time BullMQ backfill (hyphen jobIds) ending in `array_length(embedding,1)=1024` for every row.

## Architectural Responsibility Map

| Capability                                                         | Primary Tier                          | Secondary Tier                                 | Rationale                                                                                     |
| ------------------------------------------------------------------ | ------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Conversational chat shell (drawer/sheet, message stream, composer) | Frontend (React 19 `_protected`)      | —                                              | Token-bound UI; mounts CopilotKit provider; reads `i18n.language`                             |
| AG-UI/SSE termination + agent loop                                 | **agent-runtime** (new workspace)     | —                                              | Long SSE streams + model latency kept OFF the transactional Express API (and off :4000/:5000) |
| LLM inference (Gemma 4 12B)                                        | vLLM container (GPU)                  | Ollama (dev/spike)                             | OpenAI-compatible `/v1`; model is a swappable config detail                                   |
| Embeddings + rerank                                                | TEI container                         | local ONNX `Xenova/bge-m3` (re-embed fallback) | One new HTTP service; bge-m3 + bge-reranker-v2-m3                                             |
| Hybrid retrieval + clearance gate                                  | **Postgres (Supabase)**               | —                                              | RLS is the single enforcement point; `SECURITY INVOKER` RPC; never enforced in app code       |
| Clearance enforcement on EVERY read                                | **Postgres RLS (under caller JWT)**   | —                                              | Keystone: agent physically cannot read above caller clearance by construction                 |
| Read tools (signals/graph/digest-preview/dossier/work-item)        | agent-runtime tool layer              | Postgres RPCs (P69/P70/P71)                    | Narrow Zod-typed tools build per-request JWT client; DB does the gating                       |
| Conversation persistence (threads)                                 | Postgres (`@mastra/pg` tables)        | —                                              | Same instance; user-private RLS                                                               |
| Re-embed (one-time backfill)                                       | backend job (BullMQ)                  | TEI / local ONNX embedder                      | Chunk + embed 6 source types into `rag_chunks`                                                |
| Observability                                                      | Langfuse + Phoenix (already deployed) | OTel from `mastra-config.ts`                   | Zero egress; already wired in P68 (REMED-05)                                                  |

## Standard Stack

### Core

| Library                                         | Version (verified npm 2026-06-18) | License    | Purpose                                                                                       | Why Standard                                                                                                                        |
| ----------------------------------------------- | --------------------------------- | ---------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `@mastra/core`                                  | **1.43.0**                        | Apache-2.0 | Agent runtime, tools, memory, workflows                                                       | Already a backend dep (CONTEXT says ^1.36 — **DRIFT: latest is 1.43**, lift target must be re-pinned); TS-native, AG-UI first-party |
| `@mastra/pg`                                    | 1.13.2                            | Apache-2.0 | `PostgresStore` thread/message persistence (+ `PgVector`) on same Supabase PG                 | D-08; auto-creates `mastra_threads`/`mastra_messages`                                                                               |
| `@ag-ui/mastra`                                 | 1.0.3                             | Apache-2.0 | `registerCopilotKit()` helper — exposes a Mastra agent as a CopilotKit-compatible AG-UI route | The documented Mastra↔CopilotKit bridge                                                                                             |
| `@copilotkit/runtime`                           | 1.60.2                            | MIT        | Self-hosted runtime (GraphQL endpoint, no Cloud key required)                                 | D-09; self-hostable, zero egress                                                                                                    |
| `@copilotkit/react-core`                        | 1.60.2                            | MIT        | `<CopilotKit runtimeUrl agent>`, `useCopilotReadable`, `useCopilotAction`                     | D-05 readable context, hooks                                                                                                        |
| `@copilotkit/react-ui`                          | 1.60.2                            | MIT        | `CopilotChat`/`CopilotSidebar` + `--copilot-kit-*` theming                                    | D-09 shell (pending spike)                                                                                                          |
| `@ag-ui/core`, `@ag-ui/client`                  | 0.0.57                            | MIT        | AG-UI event types + `HttpAgent` (the headless-fallback client)                                | Wire contract + fallback shell                                                                                                      |
| `vllm` (Docker image)                           | latest (`vllm/vllm-openai`)       | Apache-2.0 | Serve Gemma 4 12B over OpenAI `/v1`                                                           | INFRA-01; 2026 default inference engine                                                                                             |
| `ghcr.io/huggingface/text-embeddings-inference` | latest (CPU or `-89`/cuda tag)    | Apache-2.0 | Serve bge-m3 + bge-reranker-v2-m3                                                             | INFRA-02; single container, both models                                                                                             |

### Supporting (D-11 OSS survey — all on-prem, permissive, themable)

| Library                     | Version | License    | Purpose                                                         | When to Use / Trade-off                                                                                                                                                                                                                                                                                                 |
| --------------------------- | ------- | ---------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@assistant-ui/react`       | 0.14.23 | MIT        | Headless chat primitives — **the D-09 fallback shell**          | Ships a dedicated `/docs/rtl` page (HTTP 200 verified) + logical Tailwind classes that auto-flip under `dir=rtl` + `DirectionProvider`. **Land here if CopilotKit RTL/token fidelity fails the spike.** Trade-off: you own more chrome, but every element is your token-bound component (zero foreign CSS to override). |
| `@assistant-ui/react-ag-ui` | 0.0.42  | MIT        | Adapter binding assistant-ui to an AG-UI `HttpAgent`            | Pairs with the fallback; talks directly to the AG-UI server, no CopilotKit proxy hop                                                                                                                                                                                                                                    |
| `react-markdown`            | 10.1.0  | MIT        | Render assistant markdown answers                               | Battle-tested; pairs with `remark-gfm` + `rehype-sanitize` (XSS gate — CLAUDE.md security). **Avoid hand-rolling markdown.**                                                                                                                                                                                            |
| `remark-gfm`                | 4.0.1   | MIT        | GFM tables/lists in answers                                     | With `react-markdown`                                                                                                                                                                                                                                                                                                   |
| `rehype-sanitize`           | 6.0.0   | MIT        | Sanitize agent-authored HTML before render                      | Mandatory: agent output is untrusted content (OWASP AI cheat sheet); blocks injected HTML                                                                                                                                                                                                                               |
| `shiki`                     | 4.2.0   | MIT        | Code/snippet highlighting in answers (token-themable)           | Only if answers contain code; isolate snippets `dir="ltr"`                                                                                                                                                                                                                                                              |
| `@radix-ui/react-direction` | 1.1.2   | MIT        | `DirectionProvider` for Radix primitives under RTL              | Already have `@radix-ui/react-slot`; threads `dir` to Sheet/Dialog                                                                                                                                                                                                                                                      |
| `@ai-sdk/openai`            | 3.0.73  | Apache-2.0 | OpenAI-compatible model client (point `baseURL` at vLLM/Ollama) | The Option-C spike model client; also Mastra's model layer                                                                                                                                                                                                                                                              |
| `ollama-ai-provider-v2`     | 3.6.0   | Apache-2.0 | Ollama provider for AI SDK (dev/spike)                          | D-03 spike on a dev box; identical API to vLLM                                                                                                                                                                                                                                                                          |

### Alternatives Considered

| Instead of                      | Could Use                                              | Trade-off                                                                                                                                                                                                                                                                           |
| ------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CopilotKit shell (D-09 primary) | `assistant-ui` headless shell                          | **The documented fallback.** Use if the spike shows CopilotKit can't hit RTL/token fidelity or air-gap. CopilotKit runtime/hooks/HITL stay either way. Evidence leans toward needing this (CopilotKit CSS has 0 RTL rules).                                                         |
| Mastra agent runtime            | thin custom AI-SDK `ToolLoopAgent` + `@ag-ui/*` server | The Option-C spike form (throwaway). Re-owns persistence/HITL/observability Mastra ships. Graduate to Mastra after the loop is proven.                                                                                                                                              |
| New `rag_chunks` table          | reuse `ai_embeddings`                                  | Rejected — `ai_embeddings` is `vector(1024)` not `halfvec`, `owner_type` enum is `{ticket,artifact}` only (would need destructive ALTER), entity-level not chunk-level, no dual-language tsvector. A new purpose-built table is cleaner and leaves the P68 INVOKER contract intact. |
| RRF fusion in SQL               | reranker-only (skip sparse)                            | Rejected — hybrid+RRF gives the documented precision lift on bilingual queries; Arabic morphology benefits from the sparse tsvector('arabic') side.                                                                                                                                 |
| vLLM                            | Ollama in prod                                         | Rejected for prod (Ollama ~9× lower throughput, not multi-user); Ollama is the dev/spike path only.                                                                                                                                                                                 |
| LangGraph runtime               | —                                                      | **Disqualified** — `langgraph-api` production server is EL-2.0 (blocks sovereign self-host) + forces a polyglot Python service.                                                                                                                                                     |

**Installation (agent-runtime workspace):**

```bash
# In agent-runtime/
pnpm add @mastra/core @mastra/pg @ag-ui/mastra @ag-ui/core @ag-ui/client \
         @copilotkit/runtime @ai-sdk/openai zod
# Frontend (copilot shell):
pnpm --filter frontend add @copilotkit/react-core @copilotkit/react-ui \
         react-markdown remark-gfm rehype-sanitize
# Fallback shell (only if the spike forces it):
pnpm --filter frontend add @assistant-ui/react @assistant-ui/react-ag-ui @radix-ui/react-direction
```

**Version verification:** All versions above confirmed via `npm view <pkg> version` + `license` on 2026-06-18. Gemma 4 12B existence + vLLM tool-calling confirmed via vLLM recipes (`--tool-call-parser gemma4 --enable-auto-tool-choice`). bge-m3 (MIT) + bge-reranker-v2-m3 (Apache-2.0, 11.8M downloads) confirmed on HF API.

## Package Legitimacy Audit

> slopcheck ran successfully — all 7 core packages clean.

| Package                                                                                 | Registry | Age                                  | Downloads | Source Repo                                | slopcheck                                       | Disposition                |
| --------------------------------------------------------------------------------------- | -------- | ------------------------------------ | --------- | ------------------------------------------ | ----------------------------------------------- | -------------------------- |
| `@copilotkit/runtime`                                                                   | npm      | mature (1.60.2, modified 2026-06-17) | high      | github.com/CopilotKit/CopilotKit           | **[OK]**                                        | Approved                   |
| `@mastra/core`                                                                          | npm      | mature (1.43.0)                      | high      | github.com/mastra-ai/mastra                | **[OK]**                                        | Approved                   |
| `@mastra/pg`                                                                            | npm      | mature (1.13.2)                      | high      | github.com/mastra-ai/mastra                | **[OK]**                                        | Approved                   |
| `@ag-ui/client`                                                                         | npm      | active (0.0.57)                      | mod       | github.com/ag-ui-protocol/ag-ui            | **[OK]**                                        | Approved                   |
| `@assistant-ui/react`                                                                   | npm      | mature (0.14.23)                     | high      | github.com/assistant-ui/assistant-ui       | **[OK]**                                        | Approved                   |
| `react-markdown`                                                                        | npm      | mature (10.1.0)                      | very high | github.com/remarkjs/react-markdown         | **[OK]**                                        | Approved                   |
| `ollama-ai-provider-v2`                                                                 | npm      | active (3.6.0)                       | mod       | github.com/nordwestt/ollama-ai-provider-v2 | **[OK]**                                        | Approved                   |
| `@ag-ui/mastra`                                                                         | npm      | active (1.0.3, Apache-2.0)           | mod       | github.com/ag-ui-protocol/ag-ui            | not scanned (verified license + repo manually)  | Approved — verify in spike |
| `@ai-sdk/openai`, `remark-gfm`, `rehype-sanitize`, `@radix-ui/react-direction`, `shiki` | npm      | mature                               | high      | reputable orgs                             | not scanned (all established, license-verified) | Approved                   |

**Packages removed due to slopcheck [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none.

> Cross-ecosystem note: all packages verified on **npm** (correct registry for this TS workspace). No PyPI/crates confusion vector.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ BROWSER (React 19, _protected route tree)                                     │
│                                                                                │
│  Topbar FAB / Cmd+K (CommandPalette copilot entry) ──► opens CopilotDrawer    │
│  CopilotDrawer (Radix Sheet, desktop) / BottomSheet (mobile ≤767)             │
│   └─ <CopilotKit runtimeUrl agent>  (OR assistant-ui HttpAgent — spike picks)  │
│        ├─ useCopilotReadable({ dossierId, type })  ◄── D-05 context            │
│        ├─ MessageList (react-markdown + rehype-sanitize), CitationCard          │
│        └─ provider properties = { authorization:'Bearer '+jwt, language }       │
└───────────────────────────────────│───────────────────────────────────────────┘
                                     │ AG-UI events over SSE (POST)
                                     │ headers: authorization, x-copilotkit-...gql-version
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ agent-runtime  (NEW workspace, distinct port e.g. 4100; docker-compose.prod)  │
│  Mastra server  →  apiRoutes: [ registerCopilotKit({ path:'/chat',             │
│                                   resourceId:'copilot', setContext }) ]         │
│   setContext(c, runtimeContext):                                               │
│     runtimeContext.set('authorization', c.req.header('authorization'))         │
│     runtimeContext.set('language', c.req.header('x-language'))                  │
│   ⚠ Mastra #4465: VERIFY runtimeContext actually reaches tool.execute()        │
│                                                                                │
│  Agent "copilot" (lifted from backend/src/ai/mastra-config.ts):                │
│   tools (Zod-typed, least-privilege; each builds per-request JWT client):      │
│     hybrid_rag_search │ read_signals │ query_graph │ generate_digest(preview)  │
│     get_dossier │ list_dossiers │ query_work_items                             │
└──────────┬─────────────────────────────────────┬──────────────────┬───────────┘
           │ OpenAI /v1 (chat+tools)              │ TEI HTTP         │ Supabase
           ▼                                      ▼ (embed+rerank)   ▼ (caller JWT)
   ┌───────────────┐                      ┌──────────────┐   ┌──────────────────────┐
   │ vLLM          │                      │ TEI          │   │ Postgres (Supabase)  │
   │ Gemma 4 12B   │                      │ bge-m3       │   │  RLS under auth.uid() │
   │ --tool-call-  │                      │ bge-reranker │   │  hybrid_rag_search RPC│
   │   parser gemma4│                     │   -v2-m3     │   │   (SECURITY INVOKER)  │
   └───────────────┘                      └──────────────┘   │  rag_chunks (halfvec) │
                                                             │  + read_signals/...    │
                                                             │  + mastra_threads (RLS)│
                                                             └──────────────────────┘
```

### Recommended Project Structure (`agent-runtime/`)

```
agent-runtime/
├── package.json                 # name: "agent-runtime", type: module, build/dev/lint/type-check scripts
├── tsconfig.json                # extends root strict config
├── Dockerfile.prod              # mirror backend/Dockerfile.prod; pin pnpm@10.29.1
├── src/
│   ├── index.ts                 # Mastra server bootstrap (port 4100), CORS=ALLOWED_ORIGINS secret
│   ├── mastra/
│   │   ├── index.ts             # new Mastra({ server:{cors,apiRoutes:[registerCopilotKit]}, bundler:{externals:['@copilotkit/runtime']} })
│   │   ├── agents/copilot.ts    # the reads-only agent (lift chat-assistant system prompts EN/AR)
│   │   └── tools/               # one file per Zod-typed tool
│   │       ├── hybrid-rag-search.ts
│   │       ├── read-signals.ts          # wraps RPC
│   │       ├── query-graph.ts           # wraps RPC
│   │       ├── generate-digest.ts       # PREVIEW path only
│   │       ├── dossier-lookups.ts
│   │       └── _supabase.ts             # createUserClient(runtimeContext) — the keystone idiom
│   ├── config.ts                # LIFTED from backend/src/ai/config.ts (vllm/ollama providers)
│   └── llm-router.ts            # LIFTED from backend/src/ai/llm-router.ts (if still needed)
└── .env.example
```

### Pattern 1: agent-runtime workspace wiring (D-01 / INFRA-03)

**`pnpm-workspace.yaml`** — add the 4th package:

```yaml
packages:
  - 'backend'
  - 'frontend'
  - 'shared'
  - 'agent-runtime' # NEW
```

Also add `'agent-runtime'` to the root `package.json` `"workspaces"` array (it duplicates the list).

**`turbo.json`** — no per-package task block needed (tasks are global); `agent-runtime` inherits `build`/`dev`/`lint`/`type-check` once its `package.json` declares matching scripts. Confirm its `build` emits `dist/**` (already in `outputs`).

**Port:** use **4100** (STATE precedent; backend is 4000, anythingllm 3001, langfuse 3000, phoenix 6006/4317). **Never 5000** (macOS AirPlay locally — carried lock).

**`deploy/docker-compose.prod.yml`** — three new services (mirror the existing backend service block):

```yaml
agent-runtime:
  build: { context: ../agent-runtime, dockerfile: Dockerfile.prod }
  container_name: intl-dossier-agent-runtime
  restart: unless-stopped
  expose: ['4100'] # internal-only; nginx proxies /chat
  environment:
    NODE_ENV: production
    PORT: 4100
    SUPABASE_URL: ${SUPABASE_URL}
    SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY} # keystone uses ANON + caller JWT
    ALLOWED_ORIGINS: ${ALLOWED_ORIGINS} # SECRET — CORS origin, never '*'
    VLLM_BASE_URL: http://vllm:8000
    TEI_EMBED_URL: http://tei-embed:80
    TEI_RERANK_URL: http://tei-rerank:80
    DATABASE_URL: ${MASTRA_PG_URL} # @mastra/pg threads (same Supabase PG)
    OTEL_EXPORTER_OTLP_ENDPOINT: http://phoenix:4317
  depends_on: [redis]
  networks: [intl-dossier]
vllm:
  image: vllm/vllm-openai:latest
  command: >
    --model google/gemma-4-12B-it --served-model-name gemma-4-12b
    --enable-auto-tool-choice --tool-call-parser gemma4 --reasoning-parser gemma4
    --max-model-len 8192 --kv-cache-dtype fp8 --gpu-memory-utilization 0.90
  expose: ['8000']
  deploy:
    {
      resources: { reservations: { devices: [{ driver: nvidia, count: 1, capabilities: [gpu] }] } },
    }
  networks: [intl-dossier]
tei-embed:
  image: ghcr.io/huggingface/text-embeddings-inference:latest
  command: --model-id BAAI/bge-m3
  expose: ['80']
  networks: [intl-dossier]
tei-rerank:
  image: ghcr.io/huggingface/text-embeddings-inference:latest
  command: --model-id BAAI/bge-reranker-v2-m3
  expose: ['80']
  networks: [intl-dossier]
```

> **CORS lock:** set `origin: process.env.ALLOWED_ORIGINS.split(',')` in Mastra `server.cors`, with `allowHeaders: ['content-type','authorization','x-copilotkit-runtime-client-gql-version']`. Unset → silent fallback that ACAO:null's deployed origins (carried edge-fn lesson, MEMORY).

### Pattern 2: Mastra ↔ CopilotKit self-hosted runtime (D-01 / D-09 air-gap)

Source: official Mastra docs `docs/src/content/en/guides/build-your-ui/copilotkit.mdx` (verified via GitHub).

```typescript
// agent-runtime/src/mastra/index.ts
import { Mastra } from '@mastra/core/mastra'
import { registerCopilotKit } from '@ag-ui/mastra/copilotkit'
import { copilotAgent } from './agents/copilot.js'

type CopilotRuntimeContext = { authorization: string; language: 'en' | 'ar' }

export const mastra = new Mastra({
  agents: { copilot: copilotAgent },
  server: {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') ?? [],
      allowMethods: ['*'],
      allowHeaders: ['content-type', 'authorization', 'x-copilotkit-runtime-client-gql-version'],
    },
    apiRoutes: [
      registerCopilotKit<CopilotRuntimeContext>({
        path: '/chat',
        resourceId: 'copilot',
        setContext: (c, runtimeContext) => {
          // KEYSTONE delivery — the caller JWT rides the AG-UI request header here.
          runtimeContext.set('authorization', c.req.header('authorization') ?? '')
          runtimeContext.set('language', (c.req.header('x-language') as 'en' | 'ar') ?? 'en')
        },
      }),
    ],
  },
  bundler: { externals: ['@copilotkit/runtime'] }, // ⚠ MANDATORY or `mastra build` 500-errors
})
```

**Air-gap (D-09 req #2):** the self-hosted `@copilotkit/runtime` requires **no `publicApiKey`** — `<CopilotKit runtimeUrl="…">` pointed at the local Mastra route is fully on-prem, zero egress. (Copilot Cloud key is only for the hosted-cloud path, which is NOT used.) **The spike must confirm no telemetry/CDN call escapes** — block egress at the network layer and watch for outbound requests.

**Frontend provider (inside `_protected`):**

```tsx
import { CopilotKit } from '@copilotkit/react-core'
const { i18n } = useTranslation()
<CopilotKit
  runtimeUrl="/api/copilot/chat"               // nginx-proxied to agent-runtime:4100/chat
  agent="copilot"
  headers={{ authorization: `Bearer ${session.access_token}`, 'x-language': i18n.language }}
>
  {/* CopilotDrawer shell — token-themed */}
</CopilotKit>
```

### Pattern 3: JWT-keystone per-request Supabase client in every tool (D-10 / RF-5)

The exact idiom is already proven in `chat-assistant.ts:24` (`createUserClient`) and ~20 edge fns. In the tool layer:

```typescript
// agent-runtime/src/mastra/tools/_supabase.ts
import { createClient } from '@supabase/supabase-js'
export function createUserClient(authorization: string) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false }, // short-lived per request
  })
}
// In a tool:
export const readSignals = createTool({
  id: 'read_signals',
  inputSchema: z.object({
    dossierId: z.string().uuid().optional(),
    status: z.string().optional(),
    limit: z.number().int().max(100).default(50),
  }),
  execute: async ({ context, runtimeContext }) => {
    const auth = runtimeContext.get('authorization') as string // ⚠ #4465 — verify non-empty
    const sb = createUserClient(auth)
    const { data, error } = await sb.rpc('read_signals', {
      p_dossier_id: context.dossierId ?? null,
      p_status: context.status ?? null,
      p_limit: context.limit,
    })
    return { signals: data ?? [] } // empty == indistinguishable-empty on clearance denial
  },
})
```

**Never** pass `SUPABASE_SERVICE_ROLE_KEY` to a tool. Service-role stays only on cron/no-user paths (the digest `generate_digest_content` cron, signal ingestion) with explicit app-layer authz.

### Anti-Patterns to Avoid

- **`supabaseAdmin` / service-role in any interactive tool** — bypasses RLS, the live data-exposure path being retired. (chat-assistant.ts already fixed in P68; lift the JWT version, not the old one.)
- **Generic `execute_sql` / raw-query tool** — a hijacked agent could exfiltrate; every tool is one narrow scoped op.
- **Rerank before RLS** — the cross-encoder cannot enforce clearance; RLS must filter candidates first.
- **Reusing `ai_embeddings` for chunks** — wrong type (`vector` not `halfvec`), wrong enum, entity-level not chunk-level.
- **`WHERE id = auth.uid()` on `profiles`** — `profiles` has NO `id` column; this silently binds to the outer table → NULL → deny-all. Always `WHERE user_id = auth.uid()`.
- **`':'` in BullMQ custom jobId** — BullMQ 5.x forbids it; use hyphens (P70 fan-out landmine).
- **CORS `origin:'*'` in prod** — set from `ALLOWED_ORIGINS` secret.
- **Forgetting `bundler.externals:['@copilotkit/runtime']`** — `mastra build` 500s.
- **Unregistered copilot i18n namespace** — silent English fallback in BOTH langs (looks fine in EN, breaks AR); P68 CI guard catches it only if the namespace is _used_ and _registered_.

## Don't Hand-Roll

| Problem                                         | Don't Build             | Use Instead                                           | Why                                                                                                 |
| ----------------------------------------------- | ----------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| AG-UI SSE event parsing                         | Custom SSE decoder      | `@copilotkit/react-core` OR `@ag-ui/client` HttpAgent | ~20 typed event kinds (text/tool-call/STATE_DELTA/reasoning); edge cases in chunk framing           |
| Chat shell (stream, composer, stop, scroll-pin) | Bespoke chat UI         | CopilotKit `react-ui` OR `assistant-ui` headless      | Both ship streaming/abort/virtualization; assistant-ui ships RTL                                    |
| Markdown rendering of answers                   | Regex/string→HTML       | `react-markdown` + `remark-gfm`                       | GFM tables/code; safe AST render                                                                    |
| Sanitizing agent HTML                           | Manual escaping         | `rehype-sanitize`                                     | Agent output is untrusted; XSS gate                                                                 |
| Hybrid dense+sparse fusion                      | App-side score merge    | **RRF in one SQL RPC**                                | Keeps clearance gate + fusion in the DB under one INVOKER call; app never sees above-clearance rows |
| Reranking                                       | Cosine re-sort          | TEI `bge-reranker-v2-m3`                              | Cross-encoder; +nDCG on bilingual queries                                                           |
| Thread/message persistence                      | Custom tables + CRUD    | `@mastra/pg` `PostgresStore`                          | Auto-creates `mastra_threads`/`mastra_messages` + indexes; add RLS only                             |
| Tool-call loop / suspend-resume                 | Custom agent loop       | Mastra agent + tools                                  | Built-in tool loop, OTel, (P73) `suspend()`/`resume()` HITL                                         |
| LLM serving                                     | Custom inference server | vLLM (prod) / Ollama (dev)                            | Continuous batching, tool parser, OpenAI `/v1`                                                      |

**Key insight:** the entire copilot is an _integration_ problem, not a _build_ problem — every layer has a battle-tested, permissively-licensed, on-prem-capable library. The only net-new code is (a) the `rag_chunks` table + `hybrid_rag_search` RPC, (b) the 7 thin Zod-typed tool wrappers, (c) the token-themed drawer chrome, (d) the re-embed backfill job.

## Runtime State Inventory

> P72 is mostly greenfield (new workspace + new table), but the re-embed and supabaseAdmin retirement touch existing runtime state.

| Category            | Items Found                                                                                                                                                                                                                | Action Required                                                                                                                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stored data         | `ai_embeddings` table: **vector(1024), 0 rows** (P68 REMED-04 write target, never populated), `owner_type` enum `{ticket,artifact}`. The semantic store the copilot reads today is effectively empty.                      | Re-embed corpus into NEW `rag_chunks` (data migration = one-time backfill job). `ai_embeddings` + `search_semantic_clearance_gated` left intact as the retired read path until `hybrid_rag_search` is live. |
| Live service config | AnythingLLM container still running (`anythingllm:3001`), `AI_USE_ANYTHINGLLM:'true'` in backend env → it's still the default chat provider. P72 retires it from the **copilot** critical path only (full teardown = P74). | Point the copilot at vLLM via config; leave AnythingLLM container up (wrap as MCP if any path still needs it). Do NOT flip backend's `AI_USE_ANYTHINGLLM` globally this phase.                              |
| OS-registered state | None — no cron/Task-Scheduler entries embed copilot strings. `pg_cron` digest job (P70) is unaffected.                                                                                                                     | None (verified — re-embed is a one-shot job, not a registered schedule).                                                                                                                                    |
| Secrets/env vars    | New: `ALLOWED_ORIGINS` (CORS), `VLLM_BASE_URL`, `TEI_EMBED_URL`, `TEI_RERANK_URL`, `MASTRA_PG_URL`. Existing `SUPABASE_ANON_KEY` reused for the keystone.                                                                  | Add to `.env.example` + droplet env; `ALLOWED_ORIGINS` must be set (no hardcode).                                                                                                                           |
| Build artifacts     | `agent-runtime/dist/**` (new). `@copilotkit/runtime` must be a bundler external or `mastra build` fails.                                                                                                                   | New workspace builds in CI (`turbo build`); verify Bundle Size Check budgets (MEMORY: frontend entry near 460KB ceiling — CopilotKit react-ui adds weight; dynamic-import the drawer).                      |

**Nothing found in OS-registered category:** None — verified by grep of cron/scheduler migrations; the only schedule is the unaffected P70 digest cron.

## Common Pitfalls

### Pitfall 1: `runtimeContext` empty in tools via CopilotKit/AGUI bridge (Mastra #4465)

**What goes wrong:** the JWT set in `setContext` never arrives at `tool.execute()`'s `runtimeContext` → tools fall back to anon/no-auth → RLS denies everything (looks like a broken copilot) OR (worse, if a dev "fixes" it with service-role) bypasses clearance entirely.
**Why it happens:** open upstream bug (github.com/mastra-ai/mastra/issues/4465) in how `@ag-ui/mastra` threads context into the Mastra agent run.
**How to avoid:** The **Option-C spike's #1 job** is to prove the JWT reaches a tool end-to-end. If the bridge drops it, the documented workaround is to set context in a Mastra **server middleware** (runs before the agent) or read `c.req.header('authorization')` and inject it via the agent's run options. Pin the `@mastra/core` + `@ag-ui/mastra` versions that pass the spike and record them.
**Warning signs:** tools return empty for a high-clearance user who should see data; `runtimeContext.get('authorization')` is `''`.

### Pitfall 2: CopilotKit chrome can't do RTL/token fidelity (D-09 risk)

**What goes wrong:** Arabic mode renders LTR-ish, with CopilotKit's hardcoded box-shadows and rgb() colors leaking through the design bar.
**Why it happens:** verified — `react-ui/src/css/*.css` has **0 RTL/logical-property rules** and hardcodes `--copilot-kit-shadow-sm/md/lg`. Restyling is via `--copilot-kit-*` vars + per-slot overrides only.
**How to avoid:** spike proves (a) remap every `--copilot-kit-*` var to an IntelDossier token (table below), (b) neutralize the shadow vars (`--copilot-kit-shadow-*: none` on message/citation surfaces), (c) set `dir="rtl"` on the container + verify the message stream/composer flip. **If it can't be tamed, land the `assistant-ui` headless fallback** (ships `/docs/rtl`, logical Tailwind classes, `DirectionProvider`).
**Warning signs:** gsd-ui-checker flags raw colors/shadows; AR render shows LTR alignment.

### Pitfall 3: `profiles.user_id` not `id` in chunk RLS (carried P69 landmine)

**What goes wrong:** `CREATE POLICY ... USING (sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid()))` does NOT error — `id` binds to the outer table (`rag_chunks.id`) → subquery returns NULL → `<= NULL` is false → **deny-all for every user**. Build/typecheck/apply all green; only authenticated impersonation exposes it (service-role MCP bypasses RLS).
**Why it happens:** `profiles` has NO `id` column; the column is `user_id`.
**How to avoid:** always `WHERE user_id = auth.uid()`. This is the exact form in P69/P70/P71 RPCs (`generate_digest`, `query_graph`, `read_signals`) and the canonical `20251022000009` clearance expression.
**Warning signs:** empty `rag_chunks` results for a level-3 user who owns the content.

### Pitfall 4: Overfiltering collapses recall after RLS (pgvector)

**What goes wrong:** HNSW returns top-k by distance, RLS filters most out, you get far fewer than LIMIT (or zero) for high-clearance users on selective filters.
**Why it happens:** the index scan stops before enough RLS-passing rows are found.
**How to avoid:** enable pgvector 0.8 **iterative scans** — `SET hnsw.iterative_scan = 'relaxed_order'; SET hnsw.max_scan_tuples = 20000;` (set inside the RPC via `set_config` or session GUC). Verified pgvector 0.8 feature.
**Warning signs:** result count well below `p_limit` despite ample matching content.

### Pitfall 5: Indistinguishable-empty leak via JSON keys (carried P71 GRAPH-03 landmine)

**What goes wrong:** a gated payload carries the substring `clearance`/`filtered`/`restricted` — even as a JSON key like `stats.clearance_level` — letting a low-clearance caller infer above-clearance content exists.
**Why it happens:** RPCs/tools sometimes return diagnostic stats; P71 tripped this with `stats.clearance_level`.
**How to avoid:** the `hybrid_rag_search` RPC and every tool return ONLY content rows; "no data" and "above clearance" return the **same empty shape**; no diagnostic clearance fields anywhere; the drawer's no-answer copy is the approved neutral string. Add a test asserting `not.toMatch(/clearance|filtered|restricted/i)` over the full serialized payload (visible copy + aria-live + JSON).
**Warning signs:** any `clearance`/`filtered`/`restricted` token in a tool result or rendered card.

### Pitfall 6: Gemma 4 12B doesn't fit the 16–24GB GPU at full precision

**What goes wrong:** vLLM OOMs on load (12B comfortably needs 40GB+ at bf16).
**Why it happens:** weights + KV cache exceed VRAM.
**How to avoid:** use **QAT/FP8** weights + `--kv-cache-dtype fp8` + reduce `--max-model-len` (8192 or lower) + `--gpu-memory-utilization 0.90`. The infra track must validate the actual datacenter GPU before P72 executes (open risk register item). Eval-gated swap to a smaller model if needed.
**Warning signs:** vLLM container crash-loops on startup; CUDA OOM in logs.

### Pitfall 7: i18n namespace silent-English fallback (carried P68 guard)

**What goes wrong:** the copilot's new `copilot` namespace isn't registered in `frontend/src/i18n/index.ts` → all copilot copy falls back to English in BOTH langs.
**How to avoid:** add `import enCopilot from './en/copilot.json'` + `arCopilot` and register in the `resources` map (the file is a flat static-import registry of ~31 namespaces; `public/locales` is DEAD). The P68 CI guard (REMED-06) fails the build if a _used_ namespace is unregistered.
**Warning signs:** raw keys or English strings in the AR drawer.

## Code Examples

### `rag_chunks` table + clearance RLS (RF-2)

```sql
-- Source: synthesized from P69 intelligence_event RLS (20260614_phase69_signals_extend.sql)
-- + canonical clearance expr (20251022000009 L102/L119) + dossiers GENERATED tsvector
-- (20250930002_create_dossiers_table.sql L37-41, which already uses to_tsvector('arabic',...)).
CREATE TABLE public.rag_chunks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type     TEXT NOT NULL CHECK (source_type IN
                    ('dossier','signal','brief','after_action','position','document')),
  source_id       UUID NOT NULL,
  parent_dossier_id UUID,                       -- for dossier-scoped clearance join where applicable
  chunk_index     INTEGER NOT NULL,
  content         TEXT NOT NULL,
  content_lang    TEXT NOT NULL DEFAULT 'en' CHECK (content_lang IN ('en','ar')),
  sensitivity_level INTEGER NOT NULL DEFAULT 1 CHECK (sensitivity_level BETWEEN 1 AND 4),  -- DENORMALIZED
  embedding       halfvec(1024) NOT NULL,        -- bge-m3 native dim, halved storage
  content_tsv_en  tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(content,''))) STORED,
  content_tsv_ar  tsvector GENERATED ALWAYS AS (to_tsvector('arabic',  coalesce(content,''))) STORED,
  organization_id UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT rag_chunks_unique UNIQUE (source_type, source_id, chunk_index)
);
-- Dense HNSW on halfvec (cosine). Sparse GIN on both tsvectors.
CREATE INDEX idx_rag_chunks_hnsw ON public.rag_chunks
  USING hnsw (embedding halfvec_cosine_ops) WITH (m = 16, ef_construction = 64);
CREATE INDEX idx_rag_chunks_tsv_en ON public.rag_chunks USING gin (content_tsv_en);
CREATE INDEX idx_rag_chunks_tsv_ar ON public.rag_chunks USING gin (content_tsv_ar);
CREATE INDEX idx_rag_chunks_sensitivity ON public.rag_chunks (organization_id, sensitivity_level);

ALTER TABLE public.rag_chunks ENABLE ROW LEVEL SECURITY;
-- CRITICAL: profiles.user_id = auth.uid()  (profiles has NO id column → deny-all landmine)
CREATE POLICY rag_chunks_select_clearance ON public.rag_chunks
  FOR SELECT TO authenticated
  USING (sensitivity_level <= (SELECT clearance_level FROM public.profiles WHERE user_id = auth.uid()));
-- Trigger: keep sensitivity_level synced from the parent (dossier/signal) so clearance can't drift.
```

### `hybrid_rag_search` SECURITY INVOKER RPC (RF-3)

```sql
-- Source: pattern from P68 search_semantic_clearance_gated (INVOKER) + pgvector 0.8 iterative
-- scan (verified thenile.dev/pgvector-080) + RRF (k=60). Reranking happens in the TOOL layer
-- (TEI) AFTER this RPC returns ONLY RLS-passing candidates — RLS-before-rerank.
CREATE OR REPLACE FUNCTION public.hybrid_rag_search(
  p_query_embedding halfvec(1024),
  p_query_text      TEXT,
  p_lang            TEXT DEFAULT 'en',     -- selects content_tsv_en|ar
  p_limit           INT  DEFAULT 50        -- candidates handed to the reranker
)
RETURNS TABLE (chunk_id UUID, source_type TEXT, source_id UUID, content TEXT,
               sensitivity_level INT, rrf_score FLOAT)
LANGUAGE sql
SECURITY INVOKER                            -- NEVER DEFINER (v7.0 cross-cutting guarantee)
STABLE
AS $$
  WITH dense AS (
    SELECT id, source_type, source_id, content, sensitivity_level,
           ROW_NUMBER() OVER (ORDER BY embedding <=> p_query_embedding) AS rank
    FROM public.rag_chunks                  -- RLS applies here (caller JWT)
    ORDER BY embedding <=> p_query_embedding
    LIMIT (p_limit * 2)
  ),
  sparse AS (
    SELECT id, source_type, source_id, content, sensitivity_level,
           ROW_NUMBER() OVER (
             ORDER BY ts_rank_cd(
               CASE WHEN p_lang = 'ar' THEN content_tsv_ar ELSE content_tsv_en END,
               websearch_to_tsquery(CASE WHEN p_lang='ar' THEN 'arabic' ELSE 'english' END, p_query_text)
             ) DESC) AS rank
    FROM public.rag_chunks                  -- RLS applies here too
    WHERE (CASE WHEN p_lang='ar' THEN content_tsv_ar ELSE content_tsv_en END)
          @@ websearch_to_tsquery(CASE WHEN p_lang='ar' THEN 'arabic' ELSE 'english' END, p_query_text)
    LIMIT (p_limit * 2)
  )
  SELECT COALESCE(d.id, s.id),
         COALESCE(d.source_type, s.source_type), COALESCE(d.source_id, s.source_id),
         COALESCE(d.content, s.content), COALESCE(d.sensitivity_level, s.sensitivity_level),
         (COALESCE(1.0/(60 + d.rank), 0) + COALESCE(1.0/(60 + s.rank), 0))::float AS rrf_score
  FROM dense d FULL OUTER JOIN sparse s ON d.id = s.id
  ORDER BY rrf_score DESC
  LIMIT p_limit;
$$;
GRANT EXECUTE ON FUNCTION public.hybrid_rag_search TO authenticated;
-- In the tool: SET LOCAL hnsw.iterative_scan='relaxed_order'; SET LOCAL hnsw.max_scan_tuples=20000;
-- before calling, so the RLS post-filter doesn't collapse recall.
```

### Wrapping the three already-built RPCs (D-07)

```typescript
// read_signals(p_dossier_id,p_status,p_since,p_limit) → TABLE  (P69, INVOKER, verified)
// query_graph(p_query_type,p_entity_id,p_entity_id_2,p_window_days) → JSONB  (P71, INVOKER, verified)
// generate_digest(p_dossier_id,p_period) → JSONB  (P70, INVOKER, PREVIEW path — publish_digest is the WRITE, excluded)
// All called via sb.rpc(...) on the per-request JWT client. generate_digest tool exposes ONLY p_period
// in {daily,weekly,monthly} and the dossier from context; NEVER calls publish_digest.
```

## State of the Art

| Old Approach                                                 | Current Approach                                                | When Changed                                                                       | Impact                                                  |
| ------------------------------------------------------------ | --------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `supabaseAdmin` service-role in interactive chat             | JWT-propagation per-request client                              | P68 (chat-assistant.ts); P72 generalizes to all tools + audits brief/intake agents | Agent can't read above caller clearance by construction |
| AnythingLLM as default chat provider                         | vLLM Gemma 4 12B via OpenAI `/v1`                               | P72 (copilot path); P74 (full teardown)                                            | Sovereign, swappable, eval-gated                        |
| `vector(1024)` full-precision + 1536 pad/truncate corruption | `halfvec(1024)` native bge-m3, no pad                           | P68 (stopped pad); P72 (halfvec store)                                             | Half storage; correct cosine geometry                   |
| Heuristic keyword tool-routing (`decideToolUsage` if/else)   | Model-native tool-calling (Gemma 4 `--tool-call-parser gemma4`) | P72                                                                                | Real agentic tool dispatch, not string matching         |
| DEFINER retrieval RPCs (leak)                                | `SECURITY INVOKER` + RLS, rerank-after-RLS                      | P68/P71; P72 `hybrid_rag_search`                                                   | Clearance enforced in DB on every retrieval             |
| RSC `streamUI` generative UI                                 | AG-UI over SSE → token-bound React components                   | v7.0 design                                                                        | Works in a TanStack-Router SPA (no RSC)                 |

**Deprecated/outdated:**

- The research doc's **Fanar-2-27B brain** pick → superseded by the spec's **Gemma 4 12B** (single-GPU). Use Gemma; keep Qwen3-14B/Fanar-2 as eval challengers behind the same `/v1`.
- CONTEXT's **`@mastra/core` ^1.36.0** → latest is **1.43.0**; re-pin the lift target and re-run the spike against it.
- `ai_embeddings` as the chunks store → superseded by new `rag_chunks`.

## Assumptions Log

| #   | Claim                                                                                                                                                                                    | Section                     | Risk if Wrong                                                                                                                                                     |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Live `ai_embeddings` is still 0 rows and `vector(1024)` on staging (per P68 migration comments — could NOT verify live; MCP `execute_sql` was not exposed to this research agent)        | Chunks Store, Runtime State | If it has rows/different shape, re-embed planning shifts; **planner must run the live SQL probes listed in Validation Architecture before writing the migration** |
| A2  | Re-embed corpus row counts (dossiers/signals/positions/aa_commitments) are small (low thousands) — staging has ~3 countries, sparse data per MEMORY                                      | Re-embed Job                | If large, the one-shot backfill needs batching/throughput planning; probe live counts first                                                                       |
| A3  | OCR'd document text is queryable in some `attachments`/`documents` table (D-06 depends on RF-2) — migrations reference document tables but the exact OCR-output column was not confirmed | Re-embed Job (D-06)         | If OCR text isn't persisted/queryable, drop `document` from the v1 corpus and flag for the planner; the other 5 source types stand                                |
| A4  | Gemma 4 12B fits the actual 16–24GB datacenter GPU at FP8/QAT + 8K ctx                                                                                                                   | Serving                     | If it OOMs, eval-gated swap to Qwen3-14B or smaller; infra track must validate the real GPU                                                                       |
| A5  | `registerCopilotKit` `setContext` reliably delivers the JWT to tools on the pinned versions (Mastra #4465 is the open counter-evidence)                                                  | JWT Keystone, Pitfall 1     | If broken, use server-middleware workaround; **this is the spike's #1 gate**                                                                                      |
| A6  | CopilotKit can be themed to RTL+token fidelity (D-09 #1) — evidence (0 RTL CSS rules) suggests it may NOT                                                                                | D-09, Pitfall 2             | If it can't, land the `assistant-ui` headless fallback; the spike decides                                                                                         |
| A7  | `@ag-ui/mastra` `registerCopilotKit` export is stable on 1.0.3 (one answeroverflow thread reported a missing-export hiccup on some versions)                                             | Stack                       | Pin the version that imports cleanly in the spike; record it                                                                                                      |

**If this table is empty:** it is not — these are the real open questions the spike + live-SQL probes must close before the plan locks.

## Open Questions

1. **Does the JWT reach `tool.execute()` through the CopilotKit/AGUI bridge? (Mastra #4465)**
   - What we know: `setContext` is the documented mechanism; #4465 reports it failing for AGUI.
   - What's unclear: whether the pinned `@mastra/core 1.43` + `@ag-ui/mastra 1.0.3` combo works.
   - Recommendation: **spike gate #1** — assert a high-clearance user gets data AND a low-clearance user gets reduced data, end-to-end, before building the full tool roster.

2. **CopilotKit RTL/token fidelity vs headless fallback (D-09).**
   - What we know: CopilotKit CSS has 0 RTL/logical rules + hardcoded shadows; `assistant-ui` ships `/docs/rtl`.
   - What's unclear: whether `--copilot-kit-*` overrides + `dir="rtl"` + shadow-neutralization clear the gsd-ui-checker bar.
   - Recommendation: **spike gate #2** — render one AR message+citation; if it fails the design bar, land assistant-ui.

3. **Is OCR'd document text queryable (D-06 / RF-2)?**
   - What we know: document/attachment tables exist; the exact OCR-output column wasn't confirmed.
   - Recommendation: planner probes the live schema; if absent, ship the 5-source corpus and defer documents.

4. **Actual GPU VRAM for Gemma 4 12B.**
   - Recommendation: infra track validates on the real datacenter GPU; FP8/QAT + 8K ctx is the fit plan; eval-gated swap if not.

## Environment Availability

| Dependency                                | Required By                  | Available                                                      | Version     | Fallback                                                                                             |
| ----------------------------------------- | ---------------------------- | -------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| Langfuse (self-host)                      | Observability (D-08 audit)   | ✓ (deployed P68)                                               | latest      | —                                                                                                    |
| Arize Phoenix + OTel                      | Tracing                      | ✓ (deployed P68; `mastra-config.ts` exports to `phoenix:4317`) | latest      | —                                                                                                    |
| Redis                                     | BullMQ re-embed job + queues | ✓ (compose `redis:6379`)                                       | 7-alpine    | —                                                                                                    |
| pgvector 0.8 (halfvec, iterative scan)    | `rag_chunks`                 | **VERIFY on staging** (PG 17.6; advisor/`extversion` probe)    | needs ≥0.8  | If <0.8: no iterative scan → tune `ef_search` higher + accept recall risk                            |
| BullMQ                                    | re-embed backfill            | ✓ (`backend/src/queues/*`, incl. P70 alert worker)             | 5.x         | one-shot script if preferred                                                                         |
| `to_tsvector('arabic', …)` FTS config     | sparse RAG side              | ✓ (used across many migrations + dossiers `search_vector`)     | PG built-in | —                                                                                                    |
| vLLM + GPU                                | INFRA-01                     | **infra track — confirm GPU**                                  | —           | Ollama (dev/spike) for the loop; not prod-grade                                                      |
| TEI container                             | INFRA-02                     | **infra track — stand up**                                     | latest      | local ONNX `Xenova/bge-m3` for embeds (already in `embeddings-service.ts`); no local rerank fallback |
| `@mastra/pg` PostgresStore on Supabase PG | D-08 threads                 | ✓ (same instance)                                              | 1.13.2      | —                                                                                                    |
| HeroUI v3 React skill                     | Drawer/Dialog primitives     | ✓ (`.agents/skills/heroui-react`)                              | v3 beta     | Radix headless (already in)                                                                          |

**Missing dependencies with no fallback:** vLLM GPU serving (infra track must land before P72 executes — the spike runs on Ollama meanwhile); TEI reranker (no local rerank fallback — rerank step is skipped/degraded if TEI is down, but the hybrid RPC still returns RRF-ranked candidates).

**Missing dependencies with fallback:** prod LLM (Ollama covers the spike); embeddings (local ONNX bge-m3 covers the re-embed if TEI embed isn't ready).

## Validation Architecture

> Nyquist validation is ENABLED. Each success criterion is sampled below so a VALIDATION.md strategy can be derived. The verification reality (MEMORY): RLS denial returns empty 200s → force errors via CDP `Network.setBlockedURLs` and assert `role="alert"`/empty-state/reduced-counts, NOT HTTP status. Live UAT = seed→observe→restore, EN+AR, on staging `zkrcjzdemdmwhearhfgg`. Clearance dist: L1=344, L2=23, L3=6.

### Test Framework

| Property           | Value                                                                                |
| ------------------ | ------------------------------------------------------------------------------------ |
| Framework          | Vitest (unit/integration), Playwright (E2E), @testing-library/react, axe-core (a11y) |
| Config file        | `vitest.config.ts` per workspace; new `agent-runtime/vitest.config.ts` (Wave 0)      |
| Quick run command  | `pnpm --filter agent-runtime test` / `pnpm --filter frontend test`                   |
| Full suite command | `pnpm test` (turbo, all workspaces) + `pnpm test:e2e`                                |

### Pre-plan live-SQL probes (planner MUST run before writing migrations — this agent could not)

```sql
-- A1: confirm ai_embeddings shape/rows + pgvector version
SELECT (SELECT count(*) FROM ai_embeddings) AS rows,
       format_type(atttypid,atttypmod) AS coltype,
       (SELECT extversion FROM pg_extension WHERE extname='vector') AS pgvector
FROM pg_attribute WHERE attrelid='ai_embeddings'::regclass AND attname='embedding';
-- profiles has user_id + clearance_level, NO id:
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='profiles' AND column_name IN ('id','user_id','clearance_level');
-- A2: re-embed corpus sizing
SELECT count(*) FROM dossiers WHERE is_active; SELECT count(*) FROM intelligence_event;
SELECT count(*) FROM positions; SELECT count(*) FROM aa_commitments WHERE NOT is_deleted;
-- A3: locate OCR'd document text column
SELECT table_name, column_name FROM information_schema.columns
WHERE table_schema='public' AND (column_name ILIKE '%ocr%' OR column_name ILIKE '%extracted%text%');
```

### Pre-plan live-SQL probe RESULTS (orchestrator-run, staging `zkrcjzdemdmwhearhfgg`, 2026-06-18)

> Closes assumptions A1/A2/A3 + the pgvector-version check with **verified live facts**. The planner writes the migration and re-embed job against these, not assumptions.

- **A1 — chunks store:** `ai_embeddings` is live, **`vector(1024)` (NOT halfvec), 0 rows**. `rag_chunks`, `mastra_threads`, `mastra_messages`, and the `hybrid_rag_search` proc do **NOT exist** → all net-new (confirms the **new-`rag_chunks`** recommendation; `ai_embeddings` can be left untouched / not the write target). **pgvector = 0.8.0** → iterative scans ARE available (no `ef_search`-only fallback needed).
- **`profiles` columns = `user_id, clearance_level` — NO `id`.** The deny-all landmine is real: every RLS policy + the hybrid RPC MUST use `WHERE user_id = auth.uid()`; `WHERE id = auth.uid()` silently binds to the outer table → NULL → blocks all reads.
- **A2 — corpus sizing (tiny → one-shot backfill, no batching/throughput planning):** dossiers(active)=**12**, positions=**2**, aa_commitments=**9**; intelligence_event=**0**, intelligence_signals=**0**, briefs=**0**, documents=**0**. Substance ≈ 23 rows. **Signals / events / briefs / documents are empty on staging → AGENT-05 (`array_length=1024`) and the AGENT-03 clearance-reduction proofs require seeded rows in the live-UAT seed step.**
- **A3 — OCR text IS queryable:** `document_text_content.extracted_text_en` / `extracted_text_ar` (+ `ocr_status`, `ocr_confidence`) is the OCR-output table; also `document_versions.text_content`, `document_annotations.text_content`, `government_decisions.full_text_en/_ar`. The D-06 documents/OCR source is viable (0 rows today — defer-vs-ship is a corpus-coverage call, not a blocker).
- **⚠ Clearance-source asymmetry (NEW finding — the denormalized-sensitivity sync MUST be designed around this):** only **`dossiers`** and **`intelligence_event`** carry their own `sensitivity_level` (both `integer`). **`intelligence_signals`, `positions`, `briefs`, `aa_commitments`, `documents` do NOT.** Each `rag_chunks` row's denormalized `sensitivity_level` must therefore be **resolved from the owning dossier** (for signals, the linked dossier/event) — **never defaulted**. A default-low over-exposes; a NULL deny-alls. The re-embed/sync path + the RLS-sync trigger must map every source's clearance explicitly per source table.

### Phase Requirements → Test Map

| Req ID                  | Behavior                                                                                                    | Test Type                              | Automated Command / Live Proof                                                                                                                                                         | File Exists?                             |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | -------------- | --------- |
| AGENT-04/05             | `array_length(embedding,1)=1024` for ALL `rag_chunks` rows                                                  | DB schema proof                        | `SELECT count(*) FROM rag_chunks WHERE vector_dims(embedding) <> 1024` → must be 0                                                                                                     | ❌ Wave 0 (re-embed verification script) |
| AGENT-04                | `hybrid_rag_search` is `SECURITY INVOKER` + RLS on `rag_chunks`                                             | DB schema proof                        | `SELECT prosecdef FROM pg_proc WHERE proname='hybrid_rag_search'` → false; `get_function_security('hybrid_rag_search')` (P68 helper)                                                   | ❌ Wave 0                                |
| AGENT-03                | Low-clearance account provably gets reduced results, zero above-clearance content + indistinguishable-empty | Integration (impersonation) + live UAT | Impersonate L1 vs L3 (service-role MCP bypasses RLS — MUST use authenticated impersonation per P69 landmine); assert L1 result ⊂ L3; assert serialized payload `not.toMatch(/clearance | filtered                                 | restricted/i)` | ❌ Wave 0 |
| AGENT-02                | Copilot answers from gated data under caller JWT (signals/digests/graph/dossiers/RAG)                       | Integration                            | Spike gate #1: assert `runtimeContext.get('authorization')` non-empty in tool; each tool returns RLS-scoped rows                                                                       | ❌ Wave 0                                |
| AGENT-01                | Converse from drawer AND Cmd+K                                                                              | E2E (Playwright)                       | Open drawer via FAB → send → assert streamed reply; open via Cmd+K on a dossier → assert context pre-fill                                                                              | ❌ Wave 0                                |
| AGENT-06                | EN + AR reply with correct RTL                                                                              | E2E + visual                           | Switch to AR (`localStorage['id.locale']`='ar' via ع button); assert `dir="rtl"` on drawer + Tajawal applied + composer/message flip at 1024px & 1400px                                | ❌ Wave 0                                |
| AGENT-03 (forced-error) | RLS denial → neutral empty, not a leak                                                                      | E2E (CDP)                              | `Network.setBlockedURLs` the RAG/tool call; wait through TanStack retries; assert `role="alert"`/neutral no-answer copy; screenshot can wedge → DOM assertions                         | ❌ Wave 0                                |
| INFRA-01                | vLLM Gemma 4 over `/v1`, swappable                                                                          | Smoke                                  | `curl http://vllm:8000/v1/models` returns `gemma-4-12b`; a chat+tool round-trip succeeds                                                                                               | ❌ Wave 0                                |
| INFRA-02                | TEI bge-m3 + reranker local                                                                                 | Smoke                                  | `curl TEI_EMBED_URL/embed` returns 1024-dim; `curl TEI_RERANK_URL/rerank` returns scores                                                                                               | ❌ Wave 0                                |
| INFRA-03                | agent-runtime on distinct port in compose, reachable, processes a chat turn end-to-end                      | Smoke (staging)                        | `docker compose ps agent-runtime` healthy on 4100; POST a chat turn via nginx → SSE reply                                                                                              | ❌ Wave 0                                |
| D-08                    | Threads user-private (own only)                                                                             | Integration                            | User A creates thread; User B `SELECT` on `mastra_threads` returns 0 of A's rows (RLS)                                                                                                 | ❌ Wave 0                                |

### Sampling Rate

- **Per task commit:** `pnpm --filter <touched-workspace> test` + `tsc --noEmit`.
- **Per wave merge:** full `pnpm test` + `pnpm lint` (--max-warnings 0; PascalCase filename rule for `components/**`) + i18n namespace-registration guard.
- **Phase gate:** full suite green + the 5 live-staging proofs below, EN+AR, before `/gsd:verify-work`.

### Phase-gate live proofs (the milestone verification bar)

1. **Clearance-reduction proof** — L1 vs L3 authenticated impersonation through the copilot: L1 strictly reduced, zero above-clearance, indistinguishable-empty (no forbidden substrings anywhere).
2. **EN+AR RTL render proof** — both languages, `dir="rtl"` + Tajawal, message/composer/citation flipped, at 1024px & 1400px.
3. **`array_length(embedding,1)=1024` proof** — 0 rows fail the dimension check in `rag_chunks`.
4. **`SECURITY INVOKER` + RLS proof** — `prosecdef=false` for `hybrid_rag_search`; RLS policy uses `profiles.user_id = auth.uid()`.
5. **End-to-end staging smoke** — `agent-runtime` on 4100 processes a chat turn (drawer + Cmd+K), reading gated data under the caller JWT.

### Wave 0 Gaps

- [ ] `agent-runtime/vitest.config.ts` + test scaffold — new workspace has no test infra.
- [ ] `agent-runtime/src/mastra/tools/*.test.ts` — per-tool JWT-scoping + indistinguishable-empty assertions.
- [ ] Re-embed verification script — `rag_chunks` dimension + row-coverage check (AGENT-05).
- [ ] DB schema-proof tests — `prosecdef` + RLS-policy-form assertions (reuse P68 `get_function_security`).
- [ ] Playwright copilot E2E — drawer/Cmd+K/EN+AR/forced-error (CDP) flows.
- [ ] `frontend/src/i18n/en/copilot.json` + `ar/copilot.json` + registry entry in `i18n/index.ts`.
- [ ] Spike harness (throwaway) proving JWT-reaches-tools (#4465) + CopilotKit RTL/token fidelity (D-09).

## Security Domain

> `security_enforcement` enabled. The keystone IS the security model for this phase.

### Applicable ASVS Categories

| ASVS Category         | Applies        | Standard Control                                                                                                                                    |
| --------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication     | yes            | Supabase JWT forwarded from FE → `setContext` → per-request client; short-lived (`persistSession:false`)                                            |
| V3 Session Management | yes            | Token rides each AG-UI request; bound runs under TTL; refresh handled FE-side                                                                       |
| V4 Access Control     | **yes (core)** | RLS under `auth.uid()` on `rag_chunks` + every tool's tables; `SECURITY INVOKER` RPCs; least-privilege Zod tools; never service-role in tools       |
| V5 Input Validation   | yes            | Zod schemas on every tool input (bounded `limit`, enum `period`, UUID checks); `websearch_to_tsquery` (no raw SQL); `rehype-sanitize` on agent HTML |
| V6 Cryptography       | no             | No new crypto; JWT verified by Supabase/Postgres                                                                                                    |
| V14 (LLM/AI, OWASP)   | yes            | RLS-as-floor bounds prompt-injection blast radius to caller clearance; no `execute_sql`; indistinguishable-empty; agent output sanitized            |

### Known Threat Patterns for this stack

| Pattern                                 | STRIDE                 | Standard Mitigation                                                                                                             |
| --------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Prompt-injection escalating data access | Elevation of Privilege | JWT keystone — a hijacked agent still only sees caller-clearance data (RLS floor); verified by L1/L3 impersonation              |
| Service-role leak via a tool            | EoP                    | No tool gets the service-role key; D-10 retires `supabaseAdmin` from interactive paths; cron-only carve-out with explicit authz |
| Clearance inference via JSON keys/copy  | Information Disclosure | Indistinguishable-empty: no `clearance`/`filtered`/`restricted` token anywhere; same empty shape for no-data vs above-clearance |
| Rerank bypassing clearance              | EoP                    | RLS runs BEFORE the TEI cross-encoder; reranker only sees RLS-passing candidates                                                |
| XSS via agent-rendered markdown/HTML    | Tampering              | `rehype-sanitize` + `react-markdown`; no `dangerouslySetInnerHTML` of raw model output                                          |
| CORS misconfig exposing the runtime     | Information Disclosure | `ALLOWED_ORIGINS` secret (not `'*'`); `allowHeaders` scoped                                                                     |
| Cross-tenant thread read                | Information Disclosure | `mastra_threads`/`mastra_messages` RLS = owner-only                                                                             |

## Sources

### Primary (HIGH confidence)

- Live migrations (authoritative DB ground truth): `20260614_phase69_signals_extend.sql` (read_signals INVOKER + intelligence_event clearance RLS), `20260615_phase70_digests_alerts.sql` (generate_digest preview / publish_digest split), `20260617_phase71_query_graph.sql` (query_graph JSONB + `profiles.user_id` landmine + inline clearance), `20260614000002_p68_search_invoker_rpc.sql` (search_semantic_clearance_gated INVOKER over ai_embeddings + `get_function_security` helper), `20250129006_create_ai_tables.sql` (ai_embeddings vector(1024), owner_type {ticket,artifact}), `20250930002_create_dossiers_table.sql` (dossiers GENERATED tsvector EN+AR), `20251022000009_update_polymorphic_refs.sql` (canonical clearance expr).
- Existing code: `backend/src/ai/{mastra-config,config,llm-router,embeddings-service}.ts`, `backend/src/ai/agents/chat-assistant.ts` (createUserClient keystone idiom + EN/AR prompts + heuristic routing being replaced), `backend/src/services/semantic-search.service.ts`.
- `deploy/docker-compose.prod.yml` (backend:4000, anythingllm:3001, langfuse:3000, phoenix:6006/4317; service block to mirror), `pnpm-workspace.yaml`, `turbo.json`, `frontend/src/i18n/index.ts` (static namespace registry), `frontend/src/components/dossier/DossierDrawer/DossierDrawer.tsx` (Sheet `drawer w-[min(720px,92vw)]`, `dossier-drawer` ns), `frontend/src/components/keyboard-shortcuts/CommandPalette.tsx` (`CommandItem` + `analyze-commands` P71 pattern).
- Official Mastra docs (GitHub source): `mastra-ai/mastra/docs/.../build-your-ui/copilotkit.mdx` — `registerCopilotKit` + `bundler.externals` requirement.
- CopilotKit source (GitHub): `CopilotKit/packages/react-ui/src/css/colors.css` — full `--copilot-kit-*` variable set + hardcoded shadows; `react-ui/src/css/*.css` — **0 RTL/logical-property rules** (verified).
- npm registry (versions + licenses, 2026-06-18): all packages in Standard Stack. slopcheck: 7/7 OK.
- HF API: bge-m3 (MIT), bge-reranker-v2-m3 (Apache-2.0, 11.8M downloads).

### Secondary (MEDIUM confidence)

- vLLM recipes (Gemma 4 12B): `--enable-auto-tool-choice --tool-call-parser gemma4 --reasoning-parser gemma4`, FP8 KV cache for sub-40GB. (https://recipes.vllm.ai/Google/gemma-4-12B-it, https://docs.vllm.ai/projects/recipes)
- pgvector 0.8 iterative scans (`relaxed_order`, `max_scan_tuples`, halfvec). (https://www.thenile.dev/blog/pgvector-080, https://supabase.com/docs/guides/ai/vector-indexes/hnsw-indexes)
- Mastra `setContext(c, runtimeContext)` + CORS `allowHeaders` incl. `authorization`. (https://mastra.ai/docs/frameworks/agentic-uis/copilotkit)
- `@mastra/pg` `PostgresStore` → `mastra_threads`/`mastra_messages` + `schemaName`. (https://mastra.ai/reference/storage/postgresql)
- assistant-ui `/docs/rtl` (HTTP 200) — dedicated RTL support (the fallback shell). (https://www.assistant-ui.com/docs/rtl)
- `docs/research/v7.0-ai-architecture-research-2026-06-13.md` (architecture analysis; model picks superseded by spec) + `docs/superpowers/specs/2026-06-13-v7.0-intelligence-engine-design.md` (the decision record).

### Tertiary (LOW confidence — flagged for validation)

- **Mastra issue #4465** (runtimeContext not passed to tools via AGUI) — appears OPEN; status + working version must be confirmed in the spike. (https://github.com/mastra-ai/mastra/issues/4465)
- `@ag-ui/mastra` `registerCopilotKit` export stability across versions (one answeroverflow report of a missing export). Pin the spike-passing version.
- Live `ai_embeddings` row count / pgvector version / OCR-text column / corpus sizing — **NOT verifiable by this research agent** (MCP `execute_sql` not exposed); planner must run the probes above.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all versions/licenses verified on npm; slopcheck clean; integration pattern from official source.
- Architecture (workspace/RPC/keystone): HIGH — grounded in live migrations + the proven edge-fn idiom + official Mastra/CopilotKit docs.
- Chunks store decision: HIGH on the _recommendation_ (new `rag_chunks`); MEDIUM on live `ai_embeddings` state (assumed from P68 comments, A1).
- CopilotKit RTL/token fidelity (D-09): MEDIUM — strong evidence it's at risk (0 RTL CSS rules); spike decides; fallback identified.
- JWT-reaches-tools (#4465): MEDIUM — documented mechanism + open counter-evidence; spike gate.
- GPU fit (Gemma 4 12B @ 16–24GB): MEDIUM — needs FP8/QAT; infra track validates the real GPU.
- Pitfalls/landmines: HIGH — every carried lock (profiles.user_id, indistinguishable-empty, BullMQ colon jobId, :5000 AirPlay, i18n registration, RLS-before-rerank) cross-checked against project MEMORY + live migrations.

**Research date:** 2026-06-18
**Valid until:** 2026-07-02 (14 days — fast-moving: Mastra/CopilotKit/AG-UI/vLLM all ship weekly; re-verify versions + #4465 status at plan time).

## RESEARCH COMPLETE
