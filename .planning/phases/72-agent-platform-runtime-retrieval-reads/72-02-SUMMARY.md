---
phase: 72-agent-platform-runtime-retrieval-reads
plan: 02
subsystem: infra
tags: [docker-compose, vllm, tei, gemma, nginx, sse, copilotkit, mastra, cors]

# Dependency graph
requires:
  - phase: 68-agent-platform-foundation
    provides: internal-only zero-egress service convention (langfuse/phoenix expose-only blocks)
  - phase: 69-signals
    provides: read_signals INVOKER RPC the copilot will wrap
  - phase: 71-analytic-graph
    provides: query_graph INVOKER RPC + analytic-graph edge fn (JWT-wrap idiom) the copilot will wrap
provides:
  - vLLM service (Gemma 4 12B over OpenAI-compatible /v1, served-model-name gemma-4-12b, gemma4 tool-call parser)
  - TEI embed (bge-m3) + TEI rerank (bge-reranker-v2-m3) internal-only services
  - agent-runtime compose service + env contract (anon-key keystone, ALLOWED_ORIGINS secret, VLLM/TEI/MASTRA_PG URLs)
  - nginx /api/copilot/ SSE reverse proxy to agent-runtime:4100 in both nginx.conf and nginx.prod.conf
  - deploy/agent-runtime.env.example env contract + DROPLET_INSTRUCTIONS GPU-host + nginx-proxy notes
affects: [72-05, 72-08, 72-09]

# Tech tracking
tech-stack:
  added:
    - vllm/vllm-openai (Gemma 4 12B serving, OpenAI /v1)
    - ghcr.io/huggingface/text-embeddings-inference (bge-m3 embed + bge-reranker-v2-m3 rerank)
  patterns:
    - Internal-only compose service (expose never ports, zero-egress banner, intl-dossier network)
    - nginx SSE-friendly reverse proxy (proxy_buffering off, 3600s read, Connection '', trailing-slash prefix strip)
    - anon-key + caller-JWT keystone in service env (never service-role in interactive paths)

key-files:
  created:
    - deploy/agent-runtime.env.example
  modified:
    - deploy/docker-compose.prod.yml
    - deploy/nginx/nginx.conf
    - deploy/nginx/nginx.prod.conf
    - deploy/DROPLET_INSTRUCTIONS.md

key-decisions:
  - "Followed the plan's <action> flag list for vllm (omitted --reasoning-parser gemma4 present in RESEARCH Pattern 1, since the plan action + interfaces enumerate only --tool-call-parser gemma4 as the authoritative executable contract)"
  - "agent-runtime depends_on redis with condition: service_healthy (mirrors the backend block's healthcheck-gated dependency) rather than the RESEARCH shorthand depends_on: [redis]"
  - 'Placed /api/copilot/ location before generic /api/ per the plan (nginx longest-prefix-match makes order non-load-bearing, but explicit ordering matches the plan instruction and reads clearly)'

patterns-established:
  - 'Pattern: copilot SSE route proxied through nginx (the only externally-proxied path) — trailing-slash proxy_pass strips /api/copilot/ so runtimeUrl /api/copilot/chat reaches the runtime /chat route'
  - 'Pattern: four internal-only AI-serving services (agent-runtime + vllm + tei-embed + tei-rerank) on the intl-dossier network, zero egress, expose-only'

requirements-completed: [INFRA-01, INFRA-02]

# Metrics
duration: 5min
completed: 2026-06-18
---

# Phase 72 Plan 02: Agent Serving Substrate (vLLM + TEI + agent-runtime + nginx SSE) Summary

**Four internal-only docker-compose services (Gemma 4 12B on vLLM, bge-m3 + bge-reranker-v2-m3 on TEI, the Mastra/CopilotKit agent-runtime) plus the nginx /api/copilot/ SSE reverse proxy — the serving substrate the copilot runs on, defined config-only with the network/env/CORS contract landed first.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-06-18T08:40:43Z
- **Completed:** 2026-06-18T08:46:00Z
- **Tasks:** 2
- **Files modified:** 4 (+1 created)

## Accomplishments

- Added `vllm` (Gemma 4 12B over OpenAI `/v1`, `--served-model-name gemma-4-12b`, `--tool-call-parser gemma4`, 8K ctx, fp8 kv-cache, nvidia GPU reservation), `tei-embed` (bge-m3), and `tei-rerank` (bge-reranker-v2-m3) — all `expose`-only, zero egress, on the `intl-dossier` network (INFRA-01 + INFRA-02).
- Added the `agent-runtime` compose service: `expose 4100`, `depends_on` redis (healthcheck-gated), anon-key + caller-JWT keystone (no service-role key), `ALLOWED_ORIGINS` secret (never `'*'`), and the `VLLM_BASE_URL`/`TEI_EMBED_URL`/`TEI_RERANK_URL`/`MASTRA_PG_URL`/OTLP env. Build context `../agent-runtime` forward-references `Dockerfile.prod` (authored in 72-05) — expected.
- Wired the nginx copilot SSE reverse proxy in **both** `nginx.conf` (HTTP) and `nginx.prod.conf` (HTTPS): `upstream agent-runtime { server agent-runtime:4100; keepalive 32; }` + a `location /api/copilot/` block that `proxy_pass http://agent-runtime/;` (trailing slash) with SSE-friendly settings (`proxy_buffering off; proxy_cache off; proxy_read_timeout 3600s; proxy_send_timeout 3600s; Connection '';`), placed before the generic `/api/` location.
- Authored `deploy/agent-runtime.env.example` (full new env contract + the ALLOWED_ORIGINS-must-be-set / never-`'*'` warning) and extended `DROPLET_INSTRUCTIONS.md` with the new env vars, the nginx `/api/copilot/ -> agent-runtime:4100` proxy note, the container-name table rows, and the GPU-host (`google/gemma-4-12B-it` pull + FP8/8K fit validation) deploy-time step.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add vllm + tei-embed + tei-rerank service blocks (INFRA-01/02)** - `ef9debe2` (feat)
2. **Task 2: Add the agent-runtime service block + env contract + nginx SSE proxy** - `16cf5e48` (feat)

**Plan metadata:** (this commit) (docs: complete plan)

## Files Created/Modified

- `deploy/docker-compose.prod.yml` - Added 4 internal-only services: `agent-runtime` (4100), `vllm` (8000, GPU), `tei-embed` (80), `tei-rerank` (80); all expose-only, zero egress, on the intl-dossier network.
- `deploy/agent-runtime.env.example` - **(created)** Env contract for the copilot runtime: NODE_ENV/PORT, SUPABASE_URL + SUPABASE_ANON_KEY (keystone, no service-role), ALLOWED_ORIGINS (secret, never `'*'`), VLLM_BASE_URL/TEI_EMBED_URL/TEI_RERANK_URL, MASTRA_PG_URL, OTEL endpoint — each with a one-line description.
- `deploy/nginx/nginx.conf` - Added `upstream agent-runtime` + `location /api/copilot/` SSE proxy (HTTP/listen-80 server).
- `deploy/nginx/nginx.prod.conf` - Added `upstream agent-runtime` + `location /api/copilot/` SSE proxy (HTTPS/listen-443 server).
- `deploy/DROPLET_INSTRUCTIONS.md` - New Phase 72 section (env vars, nginx proxy, GPU-host step) + container-name table rows for the 4 new services.

## Decisions Made

- **vLLM flag set follows the plan `<action>` over RESEARCH Pattern 1.** RESEARCH Pattern 1's pre-written YAML included `--reasoning-parser gemma4`, but the plan's `<action>` and `<interfaces>` both enumerate the exact flags **without** it. The plan `<action>` is the authoritative executable contract, so `--reasoning-parser gemma4` was omitted. (If the spike in 72-05/72-09 finds Gemma-4 reasoning-parsing is needed, that one flag can be added then.)
- **`depends_on` uses the healthcheck-gated long form** (`redis: { condition: service_healthy }`) mirroring the existing `backend` block, rather than RESEARCH's `depends_on: [redis]` shorthand — consistent with the file's convention and stronger ordering.
- **`/api/copilot/` placed before `/api/`** per the plan instruction. nginx prefix-location matching is longest-prefix (order-independent for prefix locations), so this is for readability/explicitness, not correctness.

## Deviations from Plan

None - plan executed exactly as written. (The two decisions above are within-plan choices between the plan's `<action>` and the RESEARCH excerpt it references, resolved in favor of the plan `<action>`; no auto-fix deviation rules were triggered.)

## Issues Encountered

- **`nginx -t` standalone-container DNS:** running `nginx -t` against the standalone `nginx:alpine` image fails on `host not found in upstream "frontend:80"` (line 45) — this is **pre-existing**: nginx resolves all upstream hostnames at config-test time and the compose service names (`frontend`, `backend`, `anythingllm`, `agent-runtime`) only resolve inside the Docker network. Isolated pure-syntax validation by stubbing all upstream hosts to `127.0.0.1:9999` → both files return **"syntax is ok / test is successful"**. The new `agent-runtime` upstream + `/api/copilot/` blocks are syntactically valid; the runtime DNS resolves once the stack is up.

## Validation Performed (non-GPU-host)

- `docker compose -f docker-compose.prod.yml config` parses **clean (exit 0, no warnings/errors)** with the full 4-service set; resolved config confirms `agent-runtime` is `expose: ["4100"]` (no `ports:`), carries `SUPABASE_ANON_KEY` (no service-role / no `SERVICE_KEY`), and `ALLOWED_ORIGINS` via the `${ALLOWED_ORIGINS}` secret (no literal `'*'`).
- Plan automated verifies pass: Task 1 grep (`tei-rerank` + `gemma-4-12b` + `bge-reranker-v2-m3`) PASS; Task 2 grep (all 7 conditions: `intl-dossier-agent-runtime`, `ALLOWED_ORIGINS`, `agent-runtime.env.example` exists, `upstream agent-runtime` + `location /api/copilot/` in both nginx files) PASS.
- nginx `-t` syntax check PASS for both `nginx.conf` and `nginx.prod.conf` (upstreams stubbed to isolate from compose-DNS); trailing-slash `proxy_pass http://agent-runtime/;`, `proxy_buffering off;`, `proxy_read_timeout 3600s;`, `Connection '';` all confirmed in both files, `/api/copilot/` ordered before `/api/`.

## User Setup Required

**GPU host is a deploy-time human action — NOT performed here (no GPU available in this environment).** The plan's `user_setup` requires an NVIDIA GPU host (16–24 GB) with the container runtime to:

1. Confirm the GPU + NVIDIA Docker runtime (`docker run --rm --gpus all nvidia-smi`).
2. Pull `google/gemma-4-12B-it` (the vLLM `--model` arg).
3. Validate Gemma 4 12B fits at FP8/QAT with an 8K context window **before the phase gate**.

This is documented in `deploy/DROPLET_INSTRUCTIONS.md` (Phase 72 section). **GPU-host validation of Gemma 4 12B fit was NOT possible in this environment and is deferred to the phase gate (72-09)**, where the live smoke proofs (`curl /v1/models`, `/embed`, `/rerank` inside the network) are exercised. `tei-embed`/`tei-rerank` pull their weights on first start.

## Next Phase Readiness

- **72-05 (agent-runtime workspace):** the compose service + env contract + CORS/keystone env are in place; the workspace's `Dockerfile.prod` (the forward-referenced `../agent-runtime/Dockerfile.prod`) + Mastra/CopilotKit code can now build against a defined service home and the `VLLM_BASE_URL`/`TEI_*`/`MASTRA_PG_URL` env keys.
- **72-09 (INFRA-03 end-to-end smoke):** the nginx `/api/copilot/` SSE route is wired in both configs, so the CopilotKit `runtimeUrl` `/api/copilot/chat` will reach `agent-runtime:4100/chat` without a 502 once the runtime is up.
- **Blocker / carry-forward:** the GPU host must be provisioned + `google/gemma-4-12B-it` pulled + FP8/8K fit validated before the phase gate (live smoke proofs run at 72-09). No GPU exists in the build/CI environment, so this stays a deploy-time human action.

## Self-Check: PASSED

All 6 created/modified files exist on disk; both task commits (`ef9debe2`, `16cf5e48`) exist in git history; key content verified in committed blobs (`tei-rerank` in Task 1; `location /api/copilot/` in nginx.conf and `ALLOWED_ORIGINS` in agent-runtime.env.example in Task 2).

---

_Phase: 72-agent-platform-runtime-retrieval-reads_
_Completed: 2026-06-18_
