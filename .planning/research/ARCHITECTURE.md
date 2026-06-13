# Architecture Research

**Domain:** On-prem agentic intelligence layer (v7.0) — diplomatic dossier system
**Researched:** 2026-06-13
**Confidence:** HIGH (built on approved design spec + authoritative architecture analysis + verified repo inspection)

---

## System Overview

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  REACT 19 FRONTEND  (existing _protected route tree)                             │
│  ┌─────────────────┐  ┌──────────────────────┐  ┌───────────────────────────┐   │
│  │  Copilot Shell  │  │  Signals/Digests/    │  │  Network / Analytic       │   │
│  │  (headless AG-  │  │  Alerts UI           │  │  Graph Panel (React Flow) │   │
│  │  UI client)     │  │  (conventional surf) │  │  + Cmd+K surfacing        │   │
│  └────────┬────────┘  └──────────┬───────────┘  └───────────┬───────────────┘   │
│           │  AG-UI SSE + JWT     │ TanStack Query           │ agent tool output  │
└───────────┼──────────────────────┼──────────────────────────┼────────────────────┘
            │                      │                          │
┌───────────▼──────────────────────┼──────────────────────────┼────────────────────┐
│  agent-runtime  (NEW workspace)  │                          │                    │
│  ┌──────────────────────────────┐│                          │                    │
│  │  Mastra Agent (TS-native)   ││                          │                    │
│  │  registerCopilotKit('/chat') ││                          │                    │
│  │  + AG-UI over SSE           ││                          │                    │
│  │  ┌────────────────────────┐ ││                          │                    │
│  │  │ READ TOOLS             │ ││                          │                    │
│  │  │  read_signals          │ ││                          │                    │
│  │  │  query_graph           │ ││                          │                    │
│  │  │  hybrid_rag_search     │ ││                          │                    │
│  │  │  get_dossier           │ ││                          │                    │
│  │  ├────────────────────────┤ ││                          │                    │
│  │  │ WRITE TOOLS (HITL)     │ ││                          │                    │
│  │  │  create_work_item      │ ││                          │                    │
│  │  │  publish_digest        │ ││                          │                    │
│  │  │  dismiss_signal        │ ││                          │                    │
│  │  │  generate_brief        │ ││                          │                    │
│  │  └────────────────────────┘ ││                          │                    │
│  │  JWT-scoped Supabase client ││                          │                    │
│  └──────────────────────────────┘│                          │                    │
│           │                      │                          │                    │
│           ▼ OpenAI-compat /v1    │                          │                    │
│  ┌─────────────────────────┐     │                          │                    │
│  │  vLLM (GPU prod)  OR   │     │                          │                    │
│  │  llama.cpp/Ollama (dev) │     │                          │                    │
│  │  Gemma 4 12B (primary)  │     │                          │                    │
│  └─────────────────────────┘     │                          │                    │
│           │                      │                          │                    │
│  ┌─────────────────────────┐     │                          │                    │
│  │  TEI container           │     │                          │                    │
│  │  bge-m3 (1024-dim embed) │     │                          │                    │
│  │  bge-reranker-v2-m3      │     │                          │                    │
│  └─────────────────────────┘     │                          │                    │
└──────────────────────────────────┼──────────────────────────┼────────────────────┘
                                   │                          │
┌──────────────────────────────────▼──────────────────────────▼────────────────────┐
│  EXISTING EXPRESS BACKEND  (backend workspace — mostly unchanged)                 │
│  ┌───────────────────────┐  ┌──────────────────────────────────────────────────┐  │
│  │  authenticateToken    │  │  Digest/Alert cron jobs                          │  │
│  │  (JWT middleware)     │  │  (service-role + explicit app-layer authz only)  │  │
│  │  requireAdmin guard   │  │  → BullMQ / pg_cron                              │  │
│  └───────────────────────┘  └──────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼────────────────────────────────────────────────┐
│  SUPABASE / POSTGRESQL 17  (single datastore — all data + auth + RLS + Realtime)  │
│  ┌───────────────────────────────────────────────────────────────────────────────┐ │
│  │  rag_chunks (embedding halfvec(1024), content_tsv_en/ar, sensitivity_level)  │ │
│  │  intelligence_signal / intelligence_digest / intelligence_event               │ │
│  │  signal_subscriptions / digest_subscriptions / alert_thresholds              │ │
│  │  dossiers / profiles.clearance_level (CANONICAL 1-4 INTEGER)                 │ │
│  │  analytic RPCs: SECURITY INVOKER + clearance-RLS on every table              │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼────────────────────────────────────────────────┐
│  OBSERVABILITY (self-hosted, zero egress)                                          │
│  Langfuse (ClickHouse backend)  +  Arize Phoenix  fed by OpenLLMetry/OTel         │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

| Component                          | Status      | Responsibility                                                                                                                                                                                        | Communicates With                                                                       |
| ---------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `agent-runtime` workspace          | NEW         | Mastra agent host; registers CopilotKit `/chat` SSE route; runs Mastra tools under JWT; long-running SSE streams isolated from transactional API                                                      | vLLM (OpenAI-compat), TEI, Supabase (JWT-scoped), frontend (AG-UI SSE), Langfuse (OTel) |
| `rag_chunks` table                 | NEW         | Single canonical embedding store; 1024-dim halfvec; clearance-RLS; HNSW + tsvector/pg_trgm hybrid retrieval RPC                                                                                       | agent-runtime read tools, search-semantic edge fn (repointed), existing semantic search |
| `intelligence_signal` table        | NEW         | Clearance-gated signal records linked to dossiers via polymorphic junction                                                                                                                            | agent read tool `read_signals`, Signals triage UI, digest pipeline                      |
| Digest/Alert pipeline              | NEW         | cron-driven; service-role + explicit authz; pluggable channel adapters (in-app, SMTP, webhook)                                                                                                        | intelligence_signal, intelligence_digest, signal_subscriptions, channel adapters        |
| Analytic graph RPCs                | NEW         | SECURITY INVOKER clearance-aware queries (who-sits-on-which-forum, engagement chains, shared committees)                                                                                              | agent `query_graph` tool, Network panel, Cmd+K                                          |
| vLLM / llama.cpp container         | NEW (infra) | OpenAI-compatible model server; Gemma 4 12B primary; swappable via config URL                                                                                                                         | agent-runtime only (no direct frontend access)                                          |
| TEI container                      | NEW (infra) | bge-m3 1024-dim embedder + bge-reranker-v2-m3 cross-encoder; on-prem; MIT license                                                                                                                     | agent-runtime (embedding + rerank calls), re-embed migration job                        |
| Langfuse + Arize Phoenix           | NEW (infra) | Self-hosted observability; trace/cost/prompt registry; bilingual eval rubrics; zero egress                                                                                                            | OTel instrumentation in agent-runtime and backend                                       |
| `chat-assistant.ts`                | MODIFIED    | Retire `supabaseAdmin` across all 7 call sites (lines 158, 171, 202, 235, 269, 307, 338 — verified in repo); replace with per-request JWT-scoped client                                               | Supabase (user JWT only, never service-role)                                            |
| `search-semantic/index.ts` edge fn | MODIFIED    | Remove `normalizeEmbedding(..., 1536)` pad/truncate (lines 53-54 — verified); repoint to bge-m3 1024-dim via TEI; run SECURITY INVOKER                                                                | TEI (embed), Supabase (JWT-scoped for retrieval)                                        |
| `profiles` table                   | MODIFIED    | Canonical clearance scale confirmed as `clearance_level INTEGER 1–4` (migration 20251017030000); column is the single source of truth — retire `get_user_clearance_level()` 1-3 mapping for chunk RLS | All RLS predicates                                                                      |
| `mastra-config.ts`                 | MODIFIED    | Lift into `agent-runtime`; expand `MastraRegistry` to support `@mastra/pg` persistence, `@copilotkit/runtime` integration, OTel export                                                                | agent-runtime                                                                           |
| `ai/config.ts`                     | MODIFIED    | Add `gemma` and `tei` provider entries; set default embedding model to `bge-m3` 1024-dim; TEI base URL env var                                                                                        | agent-runtime model/embedding routing                                                   |
| `pnpm-workspace.yaml`              | MODIFIED    | Add `agent-runtime` to packages list (currently `backend`, `frontend`, `shared`)                                                                                                                      | Turborepo build pipeline                                                                |
| `turbo.json`                       | MODIFIED    | Add `agent-runtime` pipeline tasks (build, dev, test)                                                                                                                                                 | CI                                                                                      |
| `deploy/docker-compose.prod.yml`   | MODIFIED    | Add `agent-runtime`, `vllm`, `tei`, `langfuse`, `phoenix` services; CORS from `ALLOWED_ORIGINS` secret; distinct port (avoid 5000/AirPlay conflict — use 3002 or 4100)                                | nginx reverse proxy                                                                     |

---

## Project Structure — New `agent-runtime` Workspace

```
agent-runtime/
├── src/
│   ├── index.ts                    # Express app + Mastra server mount + CORS
│   ├── mastra/
│   │   ├── index.ts                # new Mastra({ server: { apiRoutes: [registerCopilotKit] } })
│   │   └── agents/
│   │       └── dossier-agent.ts    # defineAgent with all tool registrations
│   ├── tools/
│   │   ├── read/
│   │   │   ├── read-signals.ts     # getUserClient(jwt) → intelligence_signal
│   │   │   ├── hybrid-rag.ts       # getUserClient(jwt) → search_rag_chunks RPC
│   │   │   ├── query-graph.ts      # getUserClient(jwt) → analytic RPCs
│   │   │   └── get-dossier.ts      # getUserClient(jwt) → dossiers
│   │   └── write/
│   │       ├── create-work-item.ts # requireApproval:true + getUserClient(jwt)
│   │       ├── publish-digest.ts   # requireApproval:true + getUserClient(jwt)
│   │       ├── dismiss-signal.ts   # requireApproval:true + getUserClient(jwt)
│   │       └── generate-brief.ts   # requireApproval:true + getUserClient(jwt)
│   ├── auth/
│   │   └── getUserClient.ts        # createClient(URL, ANON_KEY, {headers:{Authorization}})
│   │                               # persistSession:false, autoRefreshToken:false
│   ├── adapters/                   # pluggable channel adapters (P70)
│   │   ├── channel-adapter.ts      # interface ChannelAdapter { send(notification) }
│   │   ├── in-app.adapter.ts       # writes to supabase notifications table
│   │   ├── smtp.adapter.ts         # on-prem nodemailer / SMTP relay
│   │   └── webhook.adapter.ts      # outbound POST to approved gov endpoint
│   └── observability/
│       └── otel.ts                 # OpenLLMetry init → Langfuse OTLP endpoint
├── package.json                    # @mastra/core, @ag-ui/mastra, @copilotkit/runtime, @mastra/pg
├── tsconfig.json                   # extends ../../tsconfig.json strict
└── Dockerfile.prod
```

---

## Architectural Patterns

### Pattern 1: JWT-Propagation Keystone (the security foundation)

**What:** Every Mastra tool that reads or writes data constructs a per-request Supabase client carrying the caller's JWT. Postgres RLS then enforces `sensitivity_level <= clearance_level` automatically on every query — no app-layer authz code required per tool.

**When to use:** All interactive agent data operations. Without exception.

**Example:**

```typescript
// agent-runtime/src/auth/getUserClient.ts
import { createClient } from '@supabase/supabase-js'

export function getUserClient(jwt: string) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// agent-runtime/src/tools/read/read-signals.ts
import { createTool } from '@mastra/core'
import { getUserClient } from '../../auth/getUserClient'
import { z } from 'zod'

export const readSignalsTool = createTool({
  id: 'read_signals',
  description: 'Read intelligence signals linked to a dossier, clearance-gated by RLS',
  inputSchema: z.object({ dossierId: z.string().uuid().optional(), limit: z.number().default(20) }),
  execute: async ({ context, input }) => {
    // jwt forwarded from forwardedProps.authorization
    const jwt = context.userJwt
    const db = getUserClient(jwt)
    const { data } = await db
      .from('intelligence_signal')
      .select('*, intelligence_signal_dossiers!inner(dossier_id)')
      .eq('intelligence_signal_dossiers.dossier_id', input.dossierId ?? '')
      .order('created_at', { ascending: false })
      .limit(input.limit)
    return { signals: data ?? [] }
  },
})
```

**Trade-offs:** Access tokens expire (~1h). Long agent runs must pass the refresh token server-side or bound runs under the TTL. `persistSession:false, autoRefreshToken:false` on per-request clients prevents session leakage across users.

---

### Pattern 2: HITL Write Tool via `requireApproval`

**What:** Every state-changing tool uses Mastra's `requireApproval: true`, which suspends the agent and emits a HITL confirmation event over AG-UI. The frontend renders a bilingual, token-bound confirmation card using `renderAndWaitForResponse`. The write commits only after the user approves — and still under the user's JWT (RLS still applies).

**When to use:** All write tools: `create_work_item`, `publish_digest`, `dismiss_signal`, `generate_brief`.

**Example:**

```typescript
// agent-runtime/src/tools/write/dismiss-signal.ts
export const dismissSignalTool = createTool({
  id: 'dismiss_signal',
  description: 'Dismiss a signal after analyst review',
  inputSchema: z.object({ signalId: z.string().uuid(), reason: z.string() }),
  requireApproval: true, // suspends; frontend shows bilingual confirmation card
  execute: async ({ context, input }) => {
    const db = getUserClient(context.userJwt)
    const { error } = await db
      .from('intelligence_signal')
      .update({ status: 'dismissed', dismissed_reason: input.reason })
      .eq('id', input.signalId)
    return { dismissed: !error }
  },
})
```

---

### Pattern 3: Hybrid RAG RPC (clearance-first)

**What:** A single `search_rag_chunks` Postgres function runs `SECURITY INVOKER` so it executes as the calling user. It fuses HNSW dense search (halfvec cosine) + tsvector/pg_trgm sparse search via Reciprocal Rank Fusion (k=60), returns top-50 RLS-passing candidates to the agent, which then calls the TEI reranker cross-encoder to select the top 8-10 for the LLM context window. RLS must run before rerank — the cross-encoder cannot enforce clearance.

**When to use:** All retrieval operations from the agent (`hybrid_rag_search` tool) and from the repointed `search-semantic` edge function.

**Example (SQL skeleton):**

```sql
CREATE OR REPLACE FUNCTION search_rag_chunks(
  query_embedding halfvec(1024),
  query_text       text,
  top_k            int DEFAULT 50
)
RETURNS TABLE(id uuid, content text, similarity float, source_table text)
LANGUAGE sql
SECURITY INVOKER  -- RLS runs as the calling user
STABLE
AS $$
  WITH dense AS (
    SELECT id, content, source_table,
           1 - (embedding <=> query_embedding) AS score,
           row_number() OVER (ORDER BY embedding <=> query_embedding) AS rn
    FROM rag_chunks
    -- RLS on rag_chunks enforces sensitivity_level <= clearance_level automatically
    ORDER BY embedding <=> query_embedding
    LIMIT top_k
  ),
  sparse AS (
    SELECT id, content, source_table,
           ts_rank_cd(content_tsv_en, websearch_to_tsquery('english', query_text)) AS score,
           row_number() OVER (
             ORDER BY ts_rank_cd(content_tsv_en, websearch_to_tsquery('english', query_text)) DESC
           ) AS rn
    FROM rag_chunks
    WHERE content_tsv_en @@ websearch_to_tsquery('english', query_text)
    LIMIT top_k
  )
  -- Reciprocal Rank Fusion
  SELECT COALESCE(d.id, s.id) AS id,
         COALESCE(d.content, s.content) AS content,
         (COALESCE(1.0/(60.0 + d.rn), 0) + COALESCE(1.0/(60.0 + s.rn), 0)) AS similarity,
         COALESCE(d.source_table, s.source_table) AS source_table
  FROM dense d
  FULL OUTER JOIN sparse s ON d.id = s.id
  ORDER BY similarity DESC
  LIMIT top_k;
$$;
```

---

### Pattern 4: Pluggable Channel Adapter

**What:** An interface `ChannelAdapter` with a single `send(notification: Notification)` method. Three concrete implementations: `InAppAdapter` (writes to Supabase notifications table), `SmtpAdapter` (nodemailer + on-prem relay), `WebhookAdapter` (outbound POST to approved endpoint). Wired via config — not hardcoded in the digest pipeline.

**When to use:** Phase 70 digest/alert delivery. The adapter is selected at runtime from an environment variable or org preference.

---

### Pattern 5: One-Time Re-Embed Migration

**What:** A standalone migration job (not in the migration pipeline) that: (1) fetches all existing embeddings from `rag_chunks` and the legacy semantic search positions/documents/briefs tables, (2) generates fresh 1024-dim bge-m3 embeddings via the TEI container, (3) upserts into `rag_chunks` with correct `sensitivity_level` from the parent dossier, (4) drops the now-obsolete 1536-dim columns. Run against staging first; use `UPDATE` batches of 100 with `pg_sleep(0.1)` between batches to avoid VACUUM contention.

**When to use:** Phase 72 (the re-embed is the moment to consolidate all embeddings into `rag_chunks` with proper clearance RLS). Requires TEI to be deployed first (parallel infra track, starts Phase 68).

---

## Data Flow

### Agent Conversation Flow (Happy Path)

```
User types in Copilot Shell (frontend)
    │  AG-UI POST /api/chat + Authorization: Bearer <jwt>
    ▼
agent-runtime: @copilotkit/runtime parses request
    │  extracts jwt from forwardedProps.authorization
    ▼
Mastra agent: plans tool calls
    │  each tool calls getUserClient(jwt) → Supabase with user JWT
    ▼
Supabase: RLS executes as the user
    │  sensitivity_level <= clearance_level predicate blocks above-clearance rows
    ▼
agent-runtime: top-50 chunks → TEI reranker → top-8 for LLM context
    │
    ▼
vLLM (Gemma 4 12B): generates bilingual response
    │  text delta events streamed back over AG-UI SSE
    ▼
frontend: headless AG-UI client renders token-bound bilingual cards
    │  STATE_DELTA reconciled into TanStack Query cache
    ▼
Analyst sees result; conventional surfaces stay consistent
```

### Write Tool HITL Flow

```
Agent proposes write action
    │  requireApproval:true → Mastra suspends run
    │  emits AG-UI HITL event
    ▼
frontend: renderAndWaitForResponse renders bilingual confirmation card
    │  (DossierContextBadge, token-bound, no shadcn defaults)
    ▼
Analyst clicks Approve
    │
    ▼
agent-runtime: resume(runId) → tool.execute fires with user JWT
    │  Supabase write runs as the user; RLS still enforces on write
    ▼
Supabase Realtime: pushes update to TanStack Query subscribers
    ▼
Conventional surface updates without page reload
```

### Digest Pipeline Flow (service-role carve-out)

```
pg_cron / BullMQ triggers digest job
    │  runs under service-role key (explicit app-layer authz: only digest writer uses this path)
    ▼
Digest generator: reads intelligence_signal (with explicit sensitivity filter for subscriber clearance)
    │  generates bilingual digest text via vLLM
    ▼
channel-adapter.send(notification)
    │  in-app: insert into notifications table (via service-role, not user JWT — no interactive user)
    │  smtp: nodemailer → on-prem SMTP relay
    │  webhook: POST to approved gov endpoint
    ▼
Supabase Realtime: in-app notification reaches frontend bell
```

---

## Integration Points

### New vs Modified — Canonical Summary

| Component                                         | New / Modified         | Phase                        | Gate                         |
| ------------------------------------------------- | ---------------------- | ---------------------------- | ---------------------------- |
| Clearance scale migration (canonical 1-4)         | MODIFIED (migration)   | 68                           | gates all chunk RLS          |
| `search-semantic/index.ts` pad/truncate removal   | MODIFIED (edge fn)     | 68                           | gates re-embed               |
| `chat-assistant.ts` supabaseAdmin → getUserClient | MODIFIED               | 68                           | live security fix            |
| Langfuse + Phoenix + OTel scaffold                | NEW (infra)            | 68 (parallel)                | eval gate P74                |
| `intelligence_signal` table + junction + RLS      | NEW (schema)           | 69                           | Signals feature              |
| Signals triage UI + `read_signals` tool           | NEW                    | 69                           | ships together with schema   |
| Digest pipeline + alert thresholds                | NEW                    | 70                           | depends on P69 signals       |
| Channel adapters (in-app, SMTP, webhook)          | NEW                    | 70                           |                              |
| Analytic graph RPCs (SECURITY INVOKER)            | NEW (migrations)       | 71                           |                              |
| Network panel enhancements + `query_graph` tool   | NEW                    | 71                           |                              |
| `agent-runtime` workspace                         | NEW                    | 72                           | depends on vLLM+TEI infra    |
| `rag_chunks` table + HNSW + hybrid RPC            | NEW (schema+migration) | 72                           |                              |
| Re-embed job (1536→1024 bge-m3)                   | NEW (one-time script)  | 72                           | TEI must be deployed         |
| vLLM + Gemma 4 12B container                      | NEW (infra)            | 72 (parallel track from P68) |                              |
| TEI container (bge-m3 + reranker)                 | NEW (infra)            | parallel from P68            |                              |
| Write tools + generative UI                       | NEW                    | 73                           | depends on P72 agent-runtime |
| Bilingual eval rubrics as CI gate                 | NEW                    | 74                           |                              |
| AnythingLLM retirement                            | MODIFIED (removal)     | 74                           |                              |

### Frontend Integration Points

| Touchpoint                               | What Changes                                                                                                                            |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/routes/_protected`         | New routes: `/signals`, `/digests`, `/alerts` + agent surface at `/word-assistant` or `/copilot`                                        |
| `CopilotKit` or `@ag-ui/client` provider | Mount inside `_protected` tree; passes `{ authorization: 'Bearer ' + session.access_token, language: i18n.language }` as forwardedProps |
| `src/i18n/index.ts`                      | Register new namespaces: `signals`, `digests`, `alerts`, `agent-ui` (unregistered → silent English fallback)                            |
| TanStack Query cache reconciliation      | Subscribe to `STATE_DELTA` AG-UI events; invalidate/patch relevant query keys                                                           |
| Cmd+K command palette                    | Add signal/digest/graph commands; `query_graph` tool results rendered inline                                                            |
| Generative UI components                 | `DossierContextBadge`, `UniversalDossierCard`, KPI strip reused inside agent responses                                                  |

### Backend Integration Points (existing Express workspace)

| Touchpoint                                | What Changes                                                                                                                                                            |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backend/src/ai/agents/chat-assistant.ts` | Replace `supabaseAdmin` at 7 call sites with `getUserClient(jwt)` — jwt must be threaded from the request context through `ChatRequest`                                 |
| `backend/src/ai/config.ts`                | Add `tei` and `gemma` provider entries; update default embedding model from `text-embedding-3-small` to `bge-m3`; add TEI base URL env var                              |
| `pnpm-workspace.yaml`                     | Add `- 'agent-runtime'` package                                                                                                                                         |
| `turbo.json`                              | Add `agent-runtime` tasks (build, dev, test, lint, type-check)                                                                                                          |
| `deploy/docker-compose.prod.yml`          | Add services: `agent-runtime` (port 4100), `vllm` (port 8000, internal), `tei` (port 8080, internal), `langfuse` (port 3010, internal), `phoenix` (port 6006, internal) |

### Supabase Integration Points

| Touchpoint                 | What Changes                                                                                                                                                                                                            |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/migrations/`     | Phase 68: clearance scale migration; Phase 69: `intelligence_signal` + junction + RLS; Phase 70: digest/alert tables + subscriptions; Phase 71: analytic RPCs; Phase 72: `rag_chunks` table + HNSW indexes + hybrid RPC |
| `search-semantic/index.ts` | Remove `normalizeEmbedding(..., 1536)` (lines 53-54); replace AnythingLLM embed call with TEI bge-m3; SUPABASE_SERVICE_ROLE_KEY replaced by user JWT for retrieval RPC                                                  |
| `database.types.ts`        | Regenerated after each schema-phase migration (Phase 60 established byte-identical contract)                                                                                                                            |

---

## The Three Remediation Items — Verified Against Repo

### Remediation 1: Clearance Scale Inconsistency

**Verified state:**

- `profiles.clearance_level`: `INTEGER NOT NULL DEFAULT 1 CHECK (clearance_level >= 1 AND clearance_level <= 4)` (migration `20251017030000_create_profiles.sql:6`)
- `get_user_clearance_level()`: returns 1-3 from `user_roles` join (migration `20250930001_helper_functions.sql:43`, comment line 79: "1=low, 2=medium, 3=high")
- `dossiers.sensitivity_level`: `TEXT NOT NULL DEFAULT 'low' CHECK (sensitivity_level IN ('low', 'medium', 'high'))` (migration `20250930002_create_dossiers_table.sql:17`)
- Existing RLS in `20251020000000_add_soft_delete_to_dossiers.sql` maps `CASE get_user_clearance_level(auth.uid()) WHEN 3 THEN sensitivity_level = ANY(ARRAY['low', 'medium', 'high'])` — a 1-3 function driving low/med/high text comparison
- Additional complexity: `20260124000001_fix_rls_helper_functions.sql` introduced a 5-value `sensitivity_level` ENUM (`public`, `internal`, `confidential`, `restricted`, `top_secret`) on some tables; `20250129001_create_intake_tickets_table.sql` has a 4-value version

**Phase 68 fix:** Pick `profiles.clearance_level` INTEGER 1-4 as the canonical scale. Map sensitivity_level strings to integers in chunk RLS: `low=1, medium=2, high=3, (top_secret=4)`. Deprecate `get_user_clearance_level()` for new code; leave it in place for existing policies that use it to avoid regression — but all new v7.0 chunk/signal RLS uses direct `profiles.clearance_level` comparison with integer-mapped sensitivity.

### Remediation 2: Embedding Pad/Truncate Corruption

**Verified state:** `supabase/functions/search-semantic/index.ts` lines 53-54: `return normalizeEmbedding(data.embedding, 1536)` called immediately after receiving the AnythingLLM embedding. Function `normalizeEmbedding` (lines 67-79) pads with zeros if shorter, truncates if longer. This corrupts cosine geometry for any model not natively producing 1536 dimensions. The edge function also uses `supabaseServiceKey` (line 168) for the Supabase client even though it has an auth header — a mixed-mode anti-pattern.

**Phase 68 fix:** Remove `normalizeEmbedding(data.embedding, 1536)` call. Replace AnythingLLM embed call with TEI `bge-m3` endpoint (`POST /embed`, returns 1024-dim natively). Update the `search_entities_semantic` RPC call to use `halfvec(1024)` dimension. The re-embed job (Phase 72) will backfill all existing chunks; the interim fix stops new corruption.

### Remediation 3: supabaseAdmin RLS-Bypass in chat-assistant.ts

**Verified state:** `backend/src/ai/agents/chat-assistant.ts` imports `supabaseAdmin` at line 14 and uses it at lines 158, 171, 202, 235, 269, 307, 338 — across all five tool implementations (`searchEntities`, `getDossier`, `queryCommitments`, `getEngagementHistory`, `listDossiers`). This bypasses RLS entirely on every agent-driven query.

**Note on scope:** `supabaseAdmin` is also used in `llm-router.ts` (lines 205, 218, 309, 333 — org policy, spend cap, run tracking), `intake-linker.ts`, and `brief-generator.ts`. The `llm-router.ts` uses are system/admin operations (no user data reads) and are acceptable carve-outs. The `chat-assistant.ts` interactive reads are the live security issue.

**Phase 68 fix:** Thread JWT through `ChatRequest` (field already exists: `userId` is present; add `jwt?: string`). Construct `getUserClient(jwt)` per request inside each tool function. For callers that don't have a user JWT (unlikely for chat, but possible in tests), fall back to a read-only restricted service-role client with explicit row-level filtering — never the full admin bypass.

---

## Build Order

This maps directly to §4 of the approved spec. The ordering respects:

1. Remediation-first gating (Phase 68 must land before any new intelligence tables ship)
2. Data-before-agent sequencing (Phases 69-71 ship the data substrate; Phase 72+ consumes it)
3. Parallel infra track (model/TEI/observability infra starts at Phase 68 with no data dependency)

| Phase  | Name                                        | Prerequisite                                                   | Parallel Infra Track                           |
| ------ | ------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------- |
| **68** | AI Foundations Remediation                  | — (gates everything)                                           | START vLLM + TEI + Langfuse + Phoenix setup    |
| **69** | Signals (feature + substrate)               | Phase 68 clearance scale confirmed                             | vLLM + TEI infra continues                     |
| **70** | Digests + Alerts (feature + substrate)      | Phase 69 `intelligence_signal` live                            | model evaluation (Gemma Arabic quality)        |
| **71** | Analytic Graph (feature + substrate)        | Phase 70 (graph RPCs are independent but eval informed by P70) | infra stabilized; re-embed job design complete |
| **72** | Agent Platform: runtime + retrieval + reads | Phase 71 data complete; vLLM + TEI infra READY                 | re-embed runs against staging                  |
| **73** | Agent Platform: writes + generative UI      | Phase 72 agent-runtime live                                    | —                                              |
| **74** | Eval gate + AnythingLLM retirement          | Phase 73 writes working; Langfuse tracing live                 | —                                              |

**Within Phase 72 — Option C spike first:** Before building the full Mastra `agent-runtime` workspace, run a 1-2 day throwaway spike using a thin `@ai-sdk`/`@ag-ui/vercel-ai-sdk` route to validate the AG-UI SSE loop and settle the chat-shell choice (CopilotKit-restyled vs `assistant-ui`/`@ag-ui/client`). The spike uses the same JWT-forwarding and Ollama/llama.cpp as the production path — so the validation is real. Converge to Mastra/Option A immediately after.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: supabaseAdmin in Interactive Agent Tools

**What people do:** Reach for `supabaseAdmin` in tool `execute()` because it's already imported and avoids threading JWT context through.

**Why it's wrong:** Bypasses RLS entirely. A prompt-injection or logic bug can exfiltrate above-clearance dossiers. Audit trail shows queries as service-role, not the real user.

**Do this instead:** `getUserClient(jwt)` per-request in every tool. JWT is forwarded from `forwardedProps.authorization` through Mastra's context.

### Anti-Pattern 2: SECURITY DEFINER Retrieval Functions

**What people do:** Wrap vector search in a `SECURITY DEFINER` function to avoid permission issues.

**Why it's wrong:** SECURITY DEFINER executes as the function owner (typically the superuser / service account), not the calling user. RLS predicates are bypassed for all rows — the function sees the entire table regardless of the user's clearance.

**Do this instead:** `SECURITY INVOKER` on all retrieval RPCs. The `search_rag_chunks` hybrid RPC must be `SECURITY INVOKER` so Postgres evaluates RLS as the authenticated user.

### Anti-Pattern 3: Dimension Normalization (Pad/Truncate)

**What people do:** Pad or truncate embedding vectors to match a target dimension when switching models.

**Why it's wrong:** Corrupts cosine geometry. A padded vector has artificially reduced L2 norm; a truncated vector loses information from the high-dimensional end. Similarity scores become meaningless, ranking breaks silently, and the store becomes dimension-inconsistent.

**Do this instead:** Commit to one model and dimension. Run a one-time re-embed when changing models. Never pad or truncate.

### Anti-Pattern 4: Adding a Dedicated Vector Database

**What people do:** Stand up Qdrant/Weaviate/Pinecone alongside Postgres for "better" vector search.

**Why it's wrong:** Forces clearance model duplication and sync. A separate vector DB cannot evaluate Supabase RLS — you must re-implement and continuously synchronize the clearance model outside Postgres, turning the security keystone into a drift-prone second copy.

**Do this instead:** Keep pgvector in the same Supabase/Postgres instance. HNSW + hybrid RRF + local reranker is sufficient below ~10M chunks. The clearance model is enforced once, in Postgres.

### Anti-Pattern 5: Registering i18n Namespaces Dynamically

**What people do:** Import a new namespace ad-hoc in a component without registering it in `src/i18n/index.ts`.

**Why it's wrong:** The app uses static bundle i18n (confirmed memory note). Unregistered namespaces silently fall back to English in both languages — Arabic users see English UI with no error.

**Do this instead:** Register every new namespace (`signals`, `digests`, `alerts`, `agent-ui`) in `src/i18n/index.ts` before shipping the feature. Test with `id.locale=ar` in localStorage.

---

## Scaling Considerations

| Scale                                 | Architecture Adjustment                                                                                                                                                 |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Single-analyst dev / air-gapped       | `llama.cpp`/Ollama serving GGUF via identical OpenAI-compat API; same agent-runtime code, model URL is a config env var                                                 |
| ~50 concurrent analysts (v7.0 target) | vLLM continuous batching with one 16-24GB GPU (Gemma 4 12B at BF16/QAT); pgvector HNSW sufficient to ~2M chunks                                                         |
| ~200 concurrent analysts              | Add SGLang as a second pool (RadixAttention prefix-cache wins on repeated dossier context in system prompt); measure before committing                                  |
| ~1M+ pgvector chunks                  | Partial HNSW indexes partitioned by `sensitivity_level`; `hnsw.iterative_scan='relaxed_order'` with `max_scan_tuples` to prevent RLS post-filter from collapsing recall |
| Multi-GPU / horizontal model scale    | Out of v7.0 scope (→ v7.1); design does not preclude it — vLLM supports tensor parallelism behind the same `/v1` API                                                    |

---

## Sources

- Approved design spec: `docs/superpowers/specs/2026-06-13-v7.0-intelligence-engine-design.md` (§2-§5)
- Authoritative architecture analysis: `docs/research/v7.0-ai-architecture-research-2026-06-13.md` (§2.1-§2.5, §4, §5)
- Verified repo files: `backend/src/ai/agents/chat-assistant.ts`, `backend/src/ai/mastra-config.ts`, `backend/src/ai/config.ts`, `supabase/functions/search-semantic/index.ts`
- Verified migrations: `20251017030000_create_profiles.sql`, `20250930001_helper_functions.sql`, `20250930002_create_dossiers_table.sql`, `20251020000000_add_soft_delete_to_dossiers.sql`, `20260124000001_fix_rls_helper_functions.sql`
- Context7 Mastra docs: `registerCopilotKit` pattern (confirmed `@ag-ui/mastra/copilotkit`), `requireApproval:true` HITL, `@mastra/pg` vector store, SSE mounting
- Supabase RAG with Permissions: https://supabase.com/docs/guides/ai/rag-with-permissions
- pgvector HNSW iterative scan: https://www.thenile.dev/blog/pgvector-080
- HuggingFace TEI: https://github.com/huggingface/text-embeddings-inference
- OWASP AI Agent Security: https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html
- Edge fn auth idiom (verified in ~20 edge functions): `positions-versions-compare:101`, `attachments-list:96`, `interaction-notes-list:37`

---

_Architecture research for: Intl-Dossier v7.0 Intelligence Engine_
_Researched: 2026-06-13_
_Confidence: HIGH — all three remediation items verified against actual repo files; integration points grounded in confirmed code paths; patterns match existing edge-fn idioms already proven in the codebase_
