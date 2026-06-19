# Mac-local copilot stack (Phase 72)

## 1. What this is

A Mac-local mirror of the prod copilot stack. It runs the real prod topology via a
Compose **override** layered on top of [`deploy/docker-compose.prod.yml`](./docker-compose.prod.yml)
— [`deploy/docker-compose.mac.yml`](./docker-compose.mac.yml) — not a fork. The nginx
`/api/copilot` SSE proxy, frontend, backend, the `intl-dossier` network, the expose-only
contract, and the agent-runtime `SUPABASE_ANON_KEY` + caller-JWT keystone are all inherited
verbatim from prod. The ONLY divergence is the two GPU-bound backends (the LLM and the two
TEI servers), swapped for Mac-runnable equivalents, so what passes locally reflects prod.

## 2. Prerequisites

- **Docker Desktop** — provides `host.docker.internal`, which lets the in-container
  agent-runtime reach the host's Ollama.
- **Ollama** with a TOOL-CAPABLE model pulled. The copilot uses model-native
  tool-calling, so the model must support tools.

```bash
ollama pull qwen3:30b
ollama serve            # must be listening on :11434
```

## 3. Run the full stack (docker compose)

```bash
docker compose -f deploy/docker-compose.prod.yml -f deploy/docker-compose.mac.yml up -d
```

This gates out `vllm` (CUDA-only, profile `gpu-only`), points agent-runtime at the host
Ollama (`VLLM_BASE_URL=http://host.docker.internal:11434`, `VLLM_MODEL=qwen3:30b`), and runs
both TEI servers on the CPU image (`cpu-latest`, `linux/amd64`). `host.docker.internal` lets
the in-container agent-runtime reach the host Ollama. First boot pulls the TEI model weights
(slow first run, cached after).

Set these keys in `deploy/.env` (the prod compose reads them via `${...}`):

```bash
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<anon-key>          # anon ONLY — the caller JWT enforces RLS; NO service-role
MASTRA_PG_URL=postgresql://<...>      # @mastra/pg threads/messages
ALLOWED_ORIGINS=http://localhost:5173 # CSV, NEVER '*'
```

## 4. Lighter alternative (pnpm dev, no agent-runtime container)

For fast iteration, run only the two TEI CPU containers (publishing host ports) and the
runtime + frontend via pnpm:

```bash
docker run -p 8081:80 --platform linux/amd64 \
  ghcr.io/huggingface/text-embeddings-inference:cpu-latest --model-id BAAI/bge-m3
docker run -p 8082:80 --platform linux/amd64 \
  ghcr.io/huggingface/text-embeddings-inference:cpu-latest --model-id BAAI/bge-reranker-v2-m3
```

In `agent-runtime/.env`:

```bash
TEI_EMBED_URL=http://127.0.0.1:8081
TEI_RERANK_URL=http://127.0.0.1:8082
VLLM_BASE_URL=http://127.0.0.1:11434
VLLM_MODEL=qwen3:30b
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
MASTRA_PG_URL=postgresql://<...>
ALLOWED_ORIGINS=http://localhost:5173
```

Then start the runtime and the frontend:

```bash
pnpm --filter agent-runtime dev     # binds :4100, serves /chat + /health
pnpm --filter intake-frontend dev   # the vite /api/copilot proxy routes the drawer to :4100/chat
```

The new vite `/api/copilot` proxy routes the drawer to `localhost:4100/chat` — the same path
nginx serves in prod.

**Re-embed corpus (optional, needed for RAG answers).** Run
`backend/src/jobs/reembed-rag-chunks.ts` against the live TEI. NOTE: this background job uses
`SUPABASE_SERVICE_ROLE_KEY` (the documented background-job carve-out) plus `TEI_EMBED_URL` —
that is SEPARATE from the agent-runtime's anon-only keystone. Never put a service-role key in
agent-runtime's env.

## 5. mastra RLS re-apply (after first boot)

`@mastra/pg` CREATES `mastra_threads` / `mastra_messages` on the runtime's FIRST boot, so the
owner-only RLS is a no-op until then. After the runtime has booted once, re-apply the
`mastra_threads` / `mastra_messages` owner-only RLS (carried from 72-03/04/05; the same step as
the 72-09 deploy gate, item 6).

## 6. Verify with the Phase-72 UAT proofs

The proofs live in
[`.planning/phases/72-agent-platform-runtime-retrieval-reads/72-UAT.md`](../.planning/phases/72-agent-platform-runtime-retrieval-reads/72-UAT.md)
— do not duplicate them here. The five:

- **PROOF 1** — clearance-reduction (the keystone): an L1 caller gets a strict subset of an
  L3 caller, zero above-clearance content, no forbidden substring in the payload.
- **PROOF 2** — EN + AR RTL render at 1024px and 1400px.
- **PROOF 3** — `vector_dims(embedding) = 1024` on every `rag_chunks` row.
- **PROOF 4** — `hybrid_rag_search` is `SECURITY INVOKER` + the `rag_chunks` SELECT RLS gates
  on `profiles.user_id = auth.uid()`.
- **PROOF 5** — e2e smoke: a full chat turn from the drawer and Cmd+K streams a token-bound
  reply under the caller JWT.

Plus the INFRA-01/02 smokes:

```bash
curl $VLLM_BASE_URL/v1/models     # Mac: returns the Ollama model id (qwen3:30b)
curl $TEI_EMBED_URL/embed         # 1024-dim vector
curl $TEI_RERANK_URL/rerank       # score array
```

On Mac, `$VLLM_BASE_URL/v1/models` returns the Ollama model id (`qwen3:30b`), NOT
`gemma-4-12b` — that single substitution is the intended parity gap (see next section).

## 7. Parity vs prod

The ONLY differences from prod are:

1. **Model** — Ollama `qwen3:30b` (Mac) vs vLLM `gemma-4-12b` (prod).
2. **TEI** — the CPU image (`cpu-latest`, `linux/amd64`) (Mac) vs the GPU image (prod).

EVERYTHING ELSE is identical and inherited from the prod compose: the nginx `/api/copilot` SSE
proxy, the env contract (service names `tei-embed` / `tei-rerank`, the `VLLM_BASE_URL` knob),
the `SUPABASE_ANON_KEY` + caller-JWT keystone (NO service-role in agent-runtime), the
expose-only network contract, and the `rag_chunks` clearance RLS. Because the override layers
ON TOP of the prod file (not a fork), any future prod-compose change is automatically reflected
on Mac.
