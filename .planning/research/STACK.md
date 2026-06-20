# Technology Stack — v7.0 Intelligence Engine (New Additions Only)

**Project:** Intl-Dossier v7.0
**Researched:** 2026-06-13
**Scope:** Packages, versions, and container images for the v7.0 NET-NEW stack additions only. Existing validated stack (React 19, TanStack, Express, Supabase, Redis, Turborepo) is not repeated here.

---

## Verified Package Versions (Context7 + npm registry, 2026-06-13)

| Package                      | Version            | Source       | Confidence |
| ---------------------------- | ------------------ | ------------ | ---------- |
| `@mastra/core`               | 1.42.0 (v1 stable) | npm registry | HIGH       |
| `@mastra/pg`                 | 1.13.0             | npm registry | HIGH       |
| `@mastra/memory`             | 1.20.3             | npm registry | HIGH       |
| `mastra` (CLI)               | 1.13.0             | npm registry | HIGH       |
| `@ag-ui/core`                | 0.0.57             | npm registry | HIGH       |
| `@ag-ui/client`              | 0.0.57             | npm registry | HIGH       |
| `@ag-ui/mastra`              | 1.0.3              | npm registry | HIGH       |
| `@copilotkit/runtime`        | 1.60.1             | npm registry | HIGH       |
| `@copilotkit/react-core`     | 1.60.1             | npm registry | HIGH       |
| `@copilotkit/react-ui`       | 1.60.1             | npm registry | HIGH       |
| `@assistant-ui/react`        | 0.14.18            | npm registry | HIGH       |
| `@assistant-ui/react-ag-ui`  | 0.0.38             | npm registry | HIGH       |
| `langfuse` (Node.js SDK)     | 3.38.20            | npm registry | HIGH       |
| `@traceloop/node-server-sdk` | 0.27.0             | npm registry | HIGH       |
| `@opentelemetry/sdk-node`    | 0.219.0            | npm registry | HIGH       |

---

## Container Images

| Service                            | Image                                           | Tag                        | Port        | Why                                                                                                         |
| ---------------------------------- | ----------------------------------------------- | -------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------- |
| vLLM (GPU)                         | `vllm/vllm-openai`                              | `v0.23.0`                  | 8000        | OpenAI-compatible `/v1`, native Gemma 4 tool parser (`gemma4_utils` merged in v0.23.0), continuous batching |
| llama.cpp / Ollama (dev/airgapped) | `ollama/ollama`                                 | `latest`                   | 11434       | Identical OpenAI-compatible surface; already wired in `backend/src/ai/config.ts` as `ollama` provider       |
| TEI — embeddings                   | `ghcr.io/huggingface/text-embeddings-inference` | `1.9.3`                    | 8080        | Serves `bge-m3` 1024-dim; fastest on-prem inference for small encoders                                      |
| TEI — reranker                     | `ghcr.io/huggingface/text-embeddings-inference` | `1.9.3`                    | 8081        | Same image, separate container for `bge-reranker-v2-m3`; `--re-ranker` flag                                 |
| Langfuse web                       | `langfuse/langfuse:3`                           | `v3.185.0` (image tag `3`) | 3000        | Self-hosted LLM observability; satisfies "prompt registry + audit trail"                                    |
| Langfuse worker                    | `langfuse/langfuse-worker:3`                    | `v3.185.0`                 | 3030        | Async trace processing                                                                                      |
| ClickHouse                         | `clickhouse/clickhouse-server`                  | `latest`                   | 8123 / 9000 | Required by Langfuse v3 for trace storage (no external egress)                                              |
| MinIO                              | `minio/minio`                                   | `latest`                   | 9000        | Required by Langfuse v3 for S3-compatible event + media storage                                             |
| Arize Phoenix                      | `arizephoenix/phoenix`                          | `version-17.5.0`           | 6006        | Offline bilingual eval rubrics (EN/AR); `arize-phoenix-v17.5.0` confirmed in GitHub releases                |

---

## New Turborepo Workspace: `agent-runtime`

The agent runtime is a **fourth Turborepo workspace** (alongside `backend`, `frontend`, `shared`) — a dedicated Express server hosting the Mastra instance, mounting CopilotKit/AG-UI SSE routes, and calling the local model via OpenAI-compatible HTTP. It keeps long SSE streams and model latency entirely off the transactional Express API.

### Phase: P72

```bash
# agent-runtime — server-side installs
pnpm add @mastra/core@latest @mastra/pg@latest @mastra/memory@latest
pnpm add @ag-ui/core@latest @ag-ui/client@latest @ag-ui/mastra@latest
pnpm add @copilotkit/runtime@latest
pnpm add openai@latest          # OpenAI-compatible client for vLLM/Ollama
pnpm add @mastra/express@latest  # MastraServer adapter for Express
```

The Mastra instance uses `registerCopilotKit()` from `@ag-ui/mastra/copilotkit` to mount a single `/chat` SSE route. Source from the verified Context7 snippet:

```typescript
import { Mastra } from '@mastra/core/mastra'
import { registerCopilotKit } from '@ag-ui/mastra/copilotkit'

export const mastra = new Mastra({
  server: {
    cors: { origin: ALLOWED_ORIGINS_ENV, allowMethods: ['*'], allowHeaders: ['*'] },
    apiRoutes: [registerCopilotKit({ path: '/chat', resourceId: 'dossierAgent' })],
  },
})
```

Port: use an env var (e.g. `AGENT_RUNTIME_PORT=4111`) — never 5000 (macOS AirPlay conflict, documented in project memory).

**Existing code to lift, not rewrite:** `backend/src/ai/mastra-config.ts` (`MastraRegistry`, `defineAgent`, `createAgentTools`) and `backend/src/ai/llm-router.ts` move into this workspace. The `@mastra/core` version in `backend/package.json` is currently `^1.36.0` — bump to `1.42.0` in both `backend` and `agent-runtime` simultaneously to avoid version skew in the monorepo.

---

## Frontend: Chat Shell Additions

### Phase: P72

```bash
# frontend — client-side installs
pnpm add @assistant-ui/react@latest @assistant-ui/react-ag-ui@latest @ag-ui/client@latest
pnpm add @copilotkit/react-core@latest @copilotkit/react-ui@latest
```

**Chat shell decision: verified approach.** The `CopilotKit` provider is mounted with `runtimeUrl` (self-hosted) and no `publicApiKey`:

```tsx
<CopilotKit runtimeUrl="/api/copilotkit">{children}</CopilotKit>
```

The headless `useFrontendTool` + `renderAndWaitForResponse` HITL pattern is a **core free feature** of `@copilotkit/react-core` — not gated by Copilot Cloud. The AG-UI `HttpAgent` + `useAgUiRuntime` from `@assistant-ui/react-ag-ui` is the pure-headless alternative that uses zero CopilotKit runtime.

---

## CopilotKit Air-Gap / Self-Host-Without-Cloud-Key — CRITICAL RULING

**Verdict: FULLY SELF-HOSTABLE WITHOUT A CLOUD KEY for the core agentic layer.** The `runtimeUrl`-based path is explicitly documented as the self-hosted flow and needs no `publicApiKey` or `publicLicenseKey`.

**However, one confirmed premium gate exists:**

> "The Fully Headless UI is an Early Access Premium feature. To unlock it, users need to obtain a free `publicLicenseKey` from Copilot Cloud." — verified via Context7 from `showcase/shell-docs/src/content/docs/premium/headless-ui.mdx`

This means:

- `useFrontendTool` (core HITL hook) — **FREE, no cloud key needed.** Confirmed via `@copilotkit/react-core` and docs.
- `renderAndWaitForResponse` HITL pattern — **FREE** when used via the headless promise-based approach or the standard `render` callback in `useFrontendTool`.
- `CopilotSidebar` / `CopilotChat` built-in UI chrome — **FREE** but shadcn-flavored (hostile to our token system).
- **"Fully Headless UI"** (a specific premium capability name in the docs, referring to `useCopilotChatHeadless_c`) — **PREMIUM; requires a free `publicLicenseKey` from cloud.copilotkit.ai.** The license key is described as "free" to obtain but requires account registration. This is the license verifier package (`@copilotkit/license-verifier@0.4.2`) included in `@copilotkit/runtime`'s dependencies — it will ping cloud for license validation even in a self-hosted deployment.

**Architectural consequence for v7.0:** The Phase-72 Option-C spike must empirically test two paths:

| Path                                                | What it uses                                                                              | Cloud key?             | Air-gap?                                                             |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------- |
| **Path A — CopilotKit runtime + `useFrontendTool`** | `@copilotkit/runtime`, `@copilotkit/react-core`, rendered with OUR token-bound components | No (uses `runtimeUrl`) | Yes for tool use; license-verifier ping for premium headless UI only |
| **Path B — `assistant-ui` + `@ag-ui/client`**       | `@assistant-ui/react`, `@assistant-ui/react-ag-ui`, `HttpAgent`                           | Never                  | Fully air-gapped, zero cloud dependency                              |

**Recommendation:** Start the Option-C spike on **Path A** (faster ergonomics for `useFrontendTool` + `useCopilotReadable` on dossier-detail pages) and confirm that the free core features are sufficient. If the license-verifier requirement turns out to be a network-egress blocker in the sovereign deployment environment, fall through to **Path B** (`assistant-ui`) — same AG-UI wire contract, same Mastra backend, pure headless with documented first-class RTL support. Decision is empirical in Phase 72.

---

## Model Fleet

### Production GPU (P72 parallel infra track)

| Model               | HuggingFace ID                        | vLLM flag                   | Role                                           | License                                        |
| ------------------- | ------------------------------------- | --------------------------- | ---------------------------------------------- | ---------------------------------------------- |
| **Gemma 4 12B IT**  | `google/gemma-4-12b-it`               | `--tool-call-parser gemma4` | Primary brain (eval-gated)                     | Google Gemma Terms of Use (custom, not Apache) |
| Qwen3.5 MoE 30B-A3B | `Qwen/Qwen3.5-30B-A3B-Instruct`       | `--tool-call-parser hermes` | High-concurrency dispatch                      | Apache-2.0                                     |
| ALLaM-7B            | `humain-ai/ALLaM-7B-Instruct-preview` | standard                    | Sovereignty signal (short AR, no tool-calling) | Apache-2.0                                     |

vLLM confirmed native Gemma 4 support: the `gemma4_utils` tool parser and `Gemma 4 Unified encoder-free` architecture were both merged in v0.23.0 release notes. Run flag: `--enable-auto-tool-choice --tool-call-parser gemma4`.

### Dev / Airgapped (Option-C spike and offline fallback)

`ollama/ollama:latest` already wired as `ollama` provider in `backend/src/ai/config.ts` (line 113). The `OLLAMA_BASE_URL` env var enables it. Start the Option-C spike here before GPU provisioning.

---

## Embeddings + Retrieval

### Models served via TEI (P72 parallel infra track)

| Model                     | TEI container port | Dimensions                     | License |
| ------------------------- | ------------------ | ------------------------------ | ------- |
| `BAAI/bge-m3`             | 8080               | 1024 (native; do NOT truncate) | MIT     |
| `BAAI/bge-reranker-v2-m3` | 8081               | N/A (cross-encoder)            | MIT     |

Both already the project's local ONNX dev path (`backend/src/ai/embeddings-service.ts` line 94: `Xenova/bge-m3`). TEI replaces the ONNX runtime in production with proper batching and GPU acceleration.

TEI run example for embedder:

```bash
docker run --gpus all -p 8080:80 \
  ghcr.io/huggingface/text-embeddings-inference:1.9.3 \
  --model-id BAAI/bge-m3 --dtype float16
```

TEI run example for reranker:

```bash
docker run --gpus all -p 8081:80 \
  ghcr.io/huggingface/text-embeddings-inference:1.9.3 \
  --model-id BAAI/bge-reranker-v2-m3 --dtype float16
```

### pgvector halfvec at 1024-dim + HNSW (P68 — remediation; gates everything)

pgvector **v0.8.2** is the current latest release (GitHub tags verified). halfvec is supported from v0.7.0+; HNSW on halfvec supports up to 4,000 dimensions (our 1024-dim is well within limit).

**Supabase PG17 status (MEDIUM confidence):** Supabase docs reference pgvector 0.7.0+ and halfvec HNSW explicitly (source: `supabase.com/docs/guides/ai/vector-indexes`). The project is on PG17 (confirmed in `CLAUDE.md`: "PostgreSQL 17.6.1.008"). Verify the exact extension version active on the staging project via:

```sql
SELECT extversion FROM pg_extension WHERE extname = 'vector';
```

If below 0.7.0, request an upgrade via Supabase dashboard before Phase 68. Above 0.7.0, halfvec HNSW at 1024-dim is available.

Target DDL for `rag_chunks`:

```sql
ALTER TABLE rag_chunks
  ALTER COLUMN embedding TYPE halfvec(1024)
  USING embedding::halfvec(1024);

CREATE INDEX ON rag_chunks
  USING hnsw (embedding halfvec_cosine_ops)
  WITH (m = 16, ef_construction = 128);
```

Enable iterative scan to prevent RLS post-filter from collapsing recall:

```sql
SET hnsw.iterative_scan = 'relaxed_order';
SET hnsw.max_scan_tuples = 50000;
```

---

## Observability Stack (P68 scaffolding)

### Langfuse Self-Host

Images verified: `langfuse/langfuse:3` + `langfuse/langfuse-worker:3` (current release v3.185.0 — tag `3` is floating latest of the v3 major). Requires ClickHouse + MinIO + Redis + Postgres. Redis is already in the project's `docker-compose.prod.yml`. ClickHouse and MinIO are new additions.

Node.js SDK instrumentation:

```bash
# agent-runtime workspace
pnpm add langfuse@latest
```

OpenTelemetry / OpenLLMetry bridge (vendor-neutral instrumentation):

```bash
pnpm add @traceloop/node-server-sdk@latest
pnpm add @opentelemetry/sdk-node@latest
```

### Arize Phoenix

Image: `arizephoenix/phoenix:version-17.5.0` (confirmed GitHub release `arize-phoenix-v17.5.0`). Runs standalone on port 6006. Used for offline bilingual eval rubrics (EN/AR) — no egress. Feed traces via OTel exporter pointing to both Phoenix and Langfuse.

---

## Environment Variables (New in v7.0)

```dotenv
# agent-runtime service
AGENT_RUNTIME_PORT=4111
ALLOWED_ORIGINS=http://localhost:5173,https://your-production-domain.com

# vLLM / Ollama
VLLM_BASE_URL=http://vllm:8000          # production GPU
OLLAMA_BASE_URL=http://ollama:11434     # dev / airgap fallback
VLLM_MODEL=google/gemma-4-12b-it       # update aiConfig.providers.vllm.defaultModel

# TEI
TEI_EMBED_URL=http://tei-embed:8080
TEI_RERANK_URL=http://tei-rerank:8081

# Langfuse
LANGFUSE_SECRET_KEY=...
LANGFUSE_PUBLIC_KEY=...
LANGFUSE_HOST=http://langfuse-web:3000  # self-hosted; zero egress

# Arize Phoenix
PHOENIX_ENDPOINT=http://phoenix:6006/v1/traces

# Embeddings (switch from text-embedding-3-small → bge-m3 via TEI)
AI_EMBEDDING_MODEL=BAAI/bge-m3
AI_EMBEDDING_DIMENSIONS=1024
AI_EMBEDDINGS_USE_EDGE_FUNCTION=false   # retire OpenAI path
AI_EMBEDDINGS_USE_LOCAL=false           # retire ONNX path; use TEI
TEI_EMBED_URL=http://tei-embed:8080     # new strategy in embeddings-service.ts
```

---

## Licenses

| Component                                   | License                       | Note                                                                         |
| ------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------- |
| `@mastra/core` et al.                       | Apache-2.0                    | Fully sovereign                                                              |
| `@ag-ui/*`                                  | MIT                           | Fully sovereign                                                              |
| `@copilotkit/runtime` + react packages      | MIT                           | Core features sovereign; premium headless UI requires free cloud license key |
| `@assistant-ui/react` et al.                | MIT                           | Fully sovereign, zero cloud dependency                                       |
| `langfuse` SDK                              | MIT                           | Self-host is OSS                                                             |
| `@traceloop/node-server-sdk`                | Apache-2.0                    |                                                                              |
| vLLM                                        | Apache-2.0                    | Serving engine                                                               |
| Gemma 4 12B                                 | **Google Gemma Terms of Use** | NOT Apache/MIT; custom Google terms; eval-gated and swappable                |
| BAAI/bge-m3                                 | MIT                           |                                                                              |
| BAAI/bge-reranker-v2-m3                     | MIT                           |                                                                              |
| Qwen3.5                                     | Apache-2.0                    |                                                                              |
| ALLaM-7B                                    | Apache-2.0                    |                                                                              |
| LangGraph (langgraph-api production server) | **EL-2.0 — REJECTED**         | Production server requires paid Enterprise key; sovereignty blocker          |

---

## Do NOT Add (Explicit Exclusion List)

| What                                                                 | Why                                                                                                                                                                                                             |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Qdrant / Weaviate / Milvus / LanceDB (any dedicated vector DB)       | Would force reimplementing and continuously syncing the RLS clearance model outside Postgres. pgvector HNSW at 1024-dim halfvec is sufficient to well beyond any projected chunk volume. Single-datastore rule. |
| LangGraph (`langgraph-api`)                                          | EL-2.0 production-server license requires paid Enterprise key — hard sovereignty/licensing blocker.                                                                                                             |
| Python agent service (LangGraph / CrewAI / Pydantic AI / LlamaIndex) | Forces a second runtime language alongside Node/Express, doubling deploy/observability/security surface. Mastra covers the capability in TS.                                                                    |
| Vercel AI SDK `streamUI` / RSC patterns                              | This project is a TanStack Router SPA — RSC is inapplicable. AI SDK may be used as an internal streaming primitive on the agent-runtime server side if needed, but not for frontend rendering.                  |
| SGLang (speculative parallel second model pool)                      | Only add if benchmarking on the actual GPU hardware proves RadixAttention prefix-caching advantage on the AG-UI/RAG traffic shape. Do not add speculatively.                                                    |
| Aceternity UI / Kibo UI / shadcn defaults on agent surface           | Banned per CLAUDE.md; incompatible with IntelDossier design token system.                                                                                                                                       |

---

## Phase Mapping

| Package / Service                                                     | First needed              | Phase                                          |
| --------------------------------------------------------------------- | ------------------------- | ---------------------------------------------- |
| `langfuse` + `@traceloop/node-server-sdk` + `@opentelemetry/sdk-node` | Eval harness scaffolding  | **P68** (gates rest)                           |
| pgvector halfvec(1024) HNSW schema migration                          | clearance-RLS foundation  | **P68**                                        |
| `ollama/ollama` (dev serve)                                           | Option-C thin-slice spike | **P72** (parallel infra starts P68)            |
| `@ag-ui/core`, `@ag-ui/client`, `@ag-ui/mastra` (agent-runtime)       | agent-runtime workspace   | **P72**                                        |
| `@mastra/core@1.42.0` bump + `@mastra/pg` + `@mastra/memory`          | agent-runtime workspace   | **P72**                                        |
| `@copilotkit/runtime`                                                 | agent-runtime SSE route   | **P72**                                        |
| `@assistant-ui/react` + `@assistant-ui/react-ag-ui`                   | frontend chat shell       | **P72**                                        |
| `@copilotkit/react-core` + `@copilotkit/react-ui`                     | frontend HITL hooks       | **P72**                                        |
| `vllm/vllm-openai:v0.23.0`                                            | production GPU serving    | **P72** (parallel infra)                       |
| TEI containers (`bge-m3` + `bge-reranker-v2-m3`)                      | re-embed + hybrid RPC     | **P72** (parallel infra)                       |
| Langfuse docker-compose services                                      | self-hosted observability | **P68** (scaffolding); full production **P74** |
| Arize Phoenix                                                         | offline bilingual eval    | **P68** (scaffolding); CI gate **P74**         |
| HITL write tools (`renderAndWaitForResponse`)                         | agentic writes            | **P73**                                        |

---

## Sources

- Context7 `/mastra-ai/mastra` — `registerCopilotKit`, server adapter, v1 migration guide
- Context7 `/copilotkit/copilotkit` — `useFrontendTool`, `renderAndWaitForResponse`, `runtimeUrl` self-host, premium headless UI gating
- Context7 `/ag-ui-protocol/ag-ui` — `MastraAgent`, `HttpAgent`, package install
- Context7 `/assistant-ui/assistant-ui` — AG-UI runtime, `useAgUiRuntime`, RTL docs
- Context7 `/pgvector/pgvector` — halfvec HNSW, cosine ops, iterative scan
- Context7 `/langfuse/langfuse-docs` — docker-compose v3 self-host with ClickHouse + MinIO
- npm registry direct: all version numbers verified 2026-06-13
- GitHub releases: vLLM v0.23.0 release notes (Gemma 4 native tool parser confirmed); TEI v1.9.3; Arize Phoenix v17.5.0; pgvector tags (v0.8.2 latest)
- `backend/src/ai/config.ts` — existing `vllm` + `ollama` provider config (lines 105-123)
- `backend/src/ai/embeddings-service.ts` — existing `Xenova/bge-m3` ONNX path (line 94)
- `backend/package.json` — existing `@mastra/core@^1.36.0` (needs bump to 1.42.0)
