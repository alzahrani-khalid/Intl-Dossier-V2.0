---
phase: quick-260619-cnm
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - deploy/docker-compose.mac.yml
  - agent-runtime/.env.example
  - frontend/vite.config.ts
  - deploy/MAC-LOCAL.md
autonomous: true
requirements: [INFRA-01, INFRA-02, INFRA-03, AGENT-01]

must_haves:
  truths:
    - '`docker compose -f deploy/docker-compose.prod.yml -f deploy/docker-compose.mac.yml config` parses clean'
    - 'The merged config EXCLUDES the vllm service on Mac (CUDA-only) via a profiles gate'
    - 'The merged agent-runtime service points VLLM_BASE_URL at host.docker.internal:11434 + VLLM_MODEL=qwen3:30b'
    - 'The merged tei-embed + tei-rerank services use the CPU image with platform linux/amd64, keeping service names + expose:80 + the same --model-id'
    - 'agent-runtime/.env.example documents TEI_EMBED_URL + TEI_RERANK_URL'
    - 'frontend dev proxy routes /api/copilot/chat to localhost:4100/chat (SSE) ahead of the generic /api rule'
    - 'frontend typecheck + build stay green'
    - 'deploy/MAC-LOCAL.md is a runnable runbook with the exact up command, env keys, pnpm-dev alt, the 5 UAT proofs, the mastra RLS note, and a Parity-vs-prod section'
  artifacts:
    - path: 'deploy/docker-compose.mac.yml'
      provides: 'Compose OVERRIDE that swaps only the two GPU backends for Mac-runnable equivalents'
      contains: 'host.docker.internal:11434'
    - path: 'agent-runtime/.env.example'
      provides: 'TEI_EMBED_URL + TEI_RERANK_URL template keys'
      contains: 'TEI_EMBED_URL'
    - path: 'frontend/vite.config.ts'
      provides: 'dev /api/copilot SSE proxy mirroring the prod nginx mapping'
      contains: '/api/copilot'
    - path: 'deploy/MAC-LOCAL.md'
      provides: 'Mac-local parity runbook'
      contains: 'Parity vs prod'
  key_links:
    - from: 'deploy/docker-compose.mac.yml'
      to: 'deploy/docker-compose.prod.yml'
      via: 'compose override layering (-f prod -f mac)'
      pattern: 'agent-runtime|tei-embed|tei-rerank|vllm'
    - from: 'frontend/vite.config.ts (/api/copilot)'
      to: 'agent-runtime :4100 /chat'
      via: 'vite proxy rewrite stripping /api/copilot'
      pattern: '/api/copilot'
---

<objective>
Add a Mac-local dev path that is a FAITHFUL MIRROR of `deploy/docker-compose.prod.yml`,
so validating the Phase-72 copilot on a Mac gives real visibility into prod. This is
achieved by layering a Compose OVERRIDE on TOP of the prod file — NOT by forking it —
so agent-runtime (its `Dockerfile.prod`), the nginx `/api/copilot` SSE proxy, frontend,
backend, the `intl-dossier` network, the expose-only contract, and the
`SUPABASE_ANON_KEY` + caller-JWT keystone (NO service-role in agent-runtime) stay
byte-identical to prod. The ONLY allowed divergence is the two GPU-bound backends
(the LLM + the two TEI servers), swapped for Mac-runnable equivalents.

Purpose: a developer can run the real prod topology on a Mac (minus GPU) and trust that
what passes locally reflects prod.
Output: 4 deliverables — `deploy/docker-compose.mac.yml`, an updated `agent-runtime/.env.example`,
an updated `frontend/vite.config.ts`, and `deploy/MAC-LOCAL.md`.

Scope guard (constraint): config / docs / dev-tooling ONLY. NO app logic changes, NO
changes to the prod compose's GPU intent. Do NOT edit `deploy/docker-compose.prod.yml`,
`deploy/nginx/nginx.conf`, any `agent-runtime/src/**`, or any `frontend/src/**`.
Do NOT run vLLM on Mac.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/STATE.md

<!-- Prod topology to mirror (read-only references; do NOT edit these files) -->

@deploy/docker-compose.prod.yml
@deploy/nginx/nginx.conf

<!-- The exact contracts the override + proxy must preserve -->

@agent-runtime/.env.example
@frontend/vite.config.ts
@frontend/src/components/copilot/useCopilotRuntime.ts
@.planning/phases/72-agent-platform-runtime-retrieval-reads/72-UAT.md

<interfaces>
<!-- Load-bearing facts extracted from the codebase. Use directly — no exploration needed. -->

PROD COMPOSE (deploy/docker-compose.prod.yml) — the services this override layers onto:

- top-level: `name: intl-dossier`; network `intl-dossier` (name: intl-dossier-prod, bridge).
- agent-runtime: build ../agent-runtime/Dockerfile.prod; expose 4100; env includes
  SUPABASE_URL, SUPABASE_ANON_KEY (NO service-role), ALLOWED_ORIGINS,
  VLLM_BASE_URL=http://vllm:8000, VLLM_MODEL is NOT set in prod (defaults to gemma-4-12b
  in config.ts), TEI_EMBED_URL=http://tei-embed:80, TEI_RERANK_URL=http://tei-rerank:80,
  DATABASE_URL=${MASTRA_PG_URL}, OTEL_EXPORTER_OTLP_ENDPOINT=http://phoenix:4317;
  depends_on redis (healthy); networks [intl-dossier].
- vllm: image vllm/vllm-openai:latest; expose 8000; HAS a GPU reservation
  (`deploy.resources.reservations.devices` nvidia count 1). This is the ONLY service
  with a GPU `deploy` block.
- tei-embed: image ghcr.io/huggingface/text-embeddings-inference:latest;
  command `--model-id BAAI/bge-m3`; expose 80; NO `deploy` block (no GPU reservation).
- tei-rerank: image ghcr.io/huggingface/text-embeddings-inference:latest;
  command `--model-id BAAI/bge-reranker-v2-m3`; expose 80; NO `deploy` block.

AGENT-RUNTIME CONFIG (agent-runtime/src/config.ts + llm-router.ts) — why VLLM_BASE_URL is the Mac lever:

- routing.defaultProvider = VLLM_BASE_URL ? 'vllm' : (OLLAMA_BASE_URL ? 'ollama' : 'vllm').
- providers.vllm.baseUrl = VLLM_BASE_URL || 'http://localhost:8000';
  providers.vllm.defaultModel = VLLM_MODEL || 'gemma-4-12b'.
- getCopilotModel() builds `${endpoint.replace(/\/$/,'')}/v1` and id `openai-compatible/${model}`.
  → Setting VLLM_BASE_URL=http://host.docker.internal:11434 + VLLM_MODEL=qwen3:30b makes the
  copilot call Ollama's OpenAI-compatible API at :11434/v1 as model qwen3:30b — the SAME knob
  prod uses, no code change. (Do NOT instead set OLLAMA_BASE_URL — that path is a fallback and
  would change provider routing; the task spec uses VLLM_BASE_URL deliberately.)

SSE ROUTE CONTRACT:

- agent-runtime registers `registerCopilotKit({ path: '/chat' })` → SSE endpoint is :4100/chat
  (agent-runtime/src/mastra/index.ts). `/health` is always-on (src/index.ts).
- client calls `/api/copilot/chat` (frontend/src/components/copilot/useCopilotRuntime.ts).
- prod nginx (deploy/nginx/nginx.conf): `location /api/copilot/ { proxy_pass http://agent-runtime/; ... }`
  — the trailing slash on proxy_pass STRIPS `/api/copilot/` so `/api/copilot/chat` lands on
  the runtime's `/chat`. SSE: proxy_buffering off, Connection '', proxy_read_timeout 3600s.
  → The dev vite proxy must do the IDENTICAL strip: `/api/copilot/chat` → localhost:4100/chat
  via a rewrite that removes the `/api/copilot` prefix. ws:true + changeOrigin:true for SSE.

VITE PROXY (frontend/vite.config.ts): existing `server.proxy` block keys: '/api', '/ai',
'/analytics-dashboard', '/organization-benchmarks', '/notifications-center', '/monitoring'
(targets backendProxyTarget = VITE_BACKEND_PROXY_TARGET || 'http://localhost:5001',
changeOrigin:true). The new '/api/copilot' rule goes HERE, declared BEFORE '/api'.

RE-EMBED JOB (backend/src/jobs/reembed-rag-chunks.ts): reads TEI_EMBED_URL and writes via
service-role `supabaseAdmin` — the DOCUMENTED background-job carve-out (a one-shot backfill,
NOT an interactive user path). The runbook references this for the pnpm-dev TEI flow; note it
needs SUPABASE_SERVICE_ROLE_KEY + TEI_EMBED_URL, which is SEPARATE from the agent-runtime's
anon-only keystone.

AGENT-RUNTIME .env.example: currently has VLLM*BASE_URL/VLLM_MODEL/OLLAMA*_/SUPABASE\__/
MASTRA_PG_URL/OTEL — but is MISSING TEI_EMBED_URL + TEI_RERANK_URL (consumed by the hybrid-RAG
tool + the re-embed job). Add them.

UAT PROOFS: .planning/phases/72-agent-platform-runtime-retrieval-reads/72-UAT.md defines
5 proofs (PROOF 1 clearance-reduction, PROOF 2 EN+AR RTL, PROOF 3 dims=1024, PROOF 4 INVOKER+RLS,
PROOF 5 e2e smoke) + INFRA-01/02 smokes. The runbook points to this file (do not duplicate it).
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Write the Mac compose override (deploy/docker-compose.mac.yml)</name>
  <files>deploy/docker-compose.mac.yml</files>
  <action>
Create `deploy/docker-compose.mac.yml` as a Compose OVERRIDE meant to run as
`docker compose -f deploy/docker-compose.prod.yml -f deploy/docker-compose.mac.yml up -d`.
It MUST override ONLY the four services below and nothing else (no network redefinition,
no volumes, no nginx/frontend/backend/redis/anythingllm/langfuse/phoenix changes — those
inherit verbatim from prod). Do NOT set a top-level `name:` (the prod file supplies it).
Open the file with a short comment block stating: this is an override layered on top of the
prod compose; the ONLY divergences from prod are the two GPU backends (LLM + TEI); run command;
"do NOT run vLLM on Mac".

(a) `vllm` — neutralize on Mac (CUDA-only, would crash on Apple Silicon). Use a profiles
gate so the merged config EXCLUDES it under a plain `docker compose up`:
`vllm:` → `profiles: ["gpu-only"]`. (Rationale to put in a comment: `deploy.replicas: 0` is
Swarm-only and is SILENTLY IGNORED by `docker compose up`, so vLLM would still try to start;
a profiles gate is the reliable exclusion for non-Swarm Compose. The service stays DEFINED in
the prod file — we only gate it out of the Mac run.) Add a comment that the model is instead
served by Ollama on the host, reached via the agent-runtime override in (b).

(b) `agent-runtime` — override ONLY the two model-pointer env vars so the copilot calls the
Mac-host Ollama (OpenAI-compatible) instead of the in-network vLLM, using the SAME knob prod uses:
`environment:` → `VLLM_BASE_URL: http://host.docker.internal:11434` and
`VLLM_MODEL: qwen3:30b`. Compose deep-merges `environment` maps, so every other agent-runtime
env (SUPABASE_URL, SUPABASE_ANON_KEY, ALLOWED_ORIGINS, TEI_EMBED_URL, TEI_RERANK_URL,
DATABASE_URL, OTEL_EXPORTER_OTLP_ENDPOINT) and the build/expose/depends_on/networks all inherit
from prod UNCHANGED — do NOT restate them. Add a comment: getCopilotModel() appends `/v1` →
Ollama's OpenAI-compatible endpoint; keystone (anon key + caller JWT, NO service-role) is
inherited from prod and MUST stay that way.

(c) `tei-embed` and `tei-rerank` — override the image to the CPU build and pin the amd64
platform (TEI ships no native arm64 image), keeping the SAME service names, `expose: ["80"]`,
and the SAME `--model-id` so `TEI_EMBED_URL`/`TEI_RERANK_URL` resolve unchanged:

- `tei-embed:` → `image: ghcr.io/huggingface/text-embeddings-inference:cpu-latest`,
  `platform: linux/amd64`, `command: --model-id BAAI/bge-m3`.
- `tei-rerank:` → `image: ghcr.io/huggingface/text-embeddings-inference:cpu-latest`,
  `platform: linux/amd64`, `command: --model-id BAAI/bge-reranker-v2-m3`.
  Note (verify-relevant): the prod TEI services do NOT declare a GPU `deploy.resources.reservations.devices`
  block (only vllm does), so there is NOTHING to neutralize on TEI here — the image+platform swap
  is sufficient. Add a one-line comment to that effect so a future reader does not add a phantom
  `deploy:` removal.

CRITICAL CONSTRAINTS:

- Use the EXACT service keys `vllm`, `agent-runtime`, `tei-embed`, `tei-rerank` so the override
  merges onto the prod services (a typo creates a NEW service instead of overriding).
- Do NOT add `ports:` to any service (the expose-only contract is part of prod parity; nginx is
  the only external path). Ollama runs on the HOST (Docker Desktop maps host.docker.internal),
  so it needs no compose service.
- No raw service redefinition that would drop inherited keys.
  </action>
  <verify>
  <automated>cd /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0 && docker compose -f deploy/docker-compose.prod.yml -f deploy/docker-compose.mac.yml config >/tmp/mac-merged.yml 2>/tmp/mac-merged.err; echo "exit=$?"; cat /tmp/mac-merged.err; echo '--- vllm excluded (expect 0) ---'; grep -c 'container_name: intl-dossier-vllm' /tmp/mac-merged.yml; echo '--- agent-runtime host.docker.internal (expect >=1) ---'; grep -c 'host.docker.internal:11434' /tmp/mac-merged.yml; echo '--- VLLM_MODEL qwen3 (expect >=1) ---'; grep -c 'qwen3:30b' /tmp/mac-merged.yml; echo '--- TEI cpu image (expect 2) ---'; grep -c 'text-embeddings-inference:cpu-latest' /tmp/mac-merged.yml; echo '--- TEI model-ids still present (expect >=1 each) ---'; grep -c 'BAAI/bge-m3' /tmp/mac-merged.yml; grep -c 'BAAI/bge-reranker-v2-m3' /tmp/mac-merged.yml; echo '--- agent-runtime anon keystone preserved, NO service-role (expect SERVICE_ROLE count 0 under agent-runtime) ---'; grep -c 'SUPABASE_ANON_KEY' /tmp/mac-merged.yml</automated>
  </verify>
  <done>
  `docker compose -f deploy/docker-compose.prod.yml -f deploy/docker-compose.mac.yml config`
  exits 0 with no errors. The merged config: contains ZERO `intl-dossier-vllm` container (vllm
  profile-gated out); shows agent-runtime with `VLLM_BASE_URL: http://host.docker.internal:11434`
  and `VLLM_MODEL: qwen3:30b`; shows BOTH tei-embed and tei-rerank on
  `text-embeddings-inference:cpu-latest` + `platform: linux/amd64` with their original `--model-id`
  values intact and `expose: 80`; agent-runtime still carries `SUPABASE_ANON_KEY` and NO
  service-role key. `deploy/docker-compose.prod.yml` is byte-unchanged (only the new file was written).
  </done>
  </task>

<task type="auto">
  <name>Task 2: Add TEI env keys to agent-runtime/.env.example + the dev proxy rule in vite.config.ts</name>
  <files>agent-runtime/.env.example, frontend/vite.config.ts</files>
  <action>
TWO surgical edits (both additive; do not reorder or remove existing content).

(1) `agent-runtime/.env.example` — ADD `TEI_EMBED_URL` and `TEI_RERANK_URL` (read by the
hybrid-RAG tool + the re-embed job, currently missing from the template). Place them as a new
`# --- Retrieval backends (TEI) ---` section near the model-endpoint section. Default to the
compose service names and include a commented non-docker variant:

- `TEI_EMBED_URL=http://tei-embed:80`
- `TEI_RERANK_URL=http://tei-rerank:80`
- a commented line each for the pnpm-dev (non-docker) case pointing at the host-published CPU
  containers: `# TEI_EMBED_URL=http://127.0.0.1:8081` and `# TEI_RERANK_URL=http://127.0.0.1:8082`
  with a short comment that these are the host ports you publish when running TEI standalone for
  `pnpm --filter agent-runtime dev` (see deploy/MAC-LOCAL.md).
  Keep the file's existing comment voice (no emoji, no marketing). Do NOT touch the existing
  VLLM*\*/OLLAMA*_/SUPABASE\__/MASTRA_PG_URL/OTEL lines.

(2) `frontend/vite.config.ts` — ADD a dev proxy rule for the copilot SSE route, mirroring the
prod nginx `/api/copilot/` mapping, placed BEFORE the generic `/api` rule inside `server.proxy`.
The rule key is `'/api/copilot'` with:

- `target: 'http://localhost:4100'`
- `changeOrigin: true`
- `ws: true` (SSE/streaming, parity with nginx `proxy_buffering off` + long read timeout)
- `rewrite: (path) => path.replace(/^\/api\/copilot/, '')` — this strips `/api/copilot` so
  `/api/copilot/chat` reaches `localhost:4100/chat`, the EXACT path `registerCopilotKit({ path: '/chat' })`
  serves and the SAME strip prod nginx does via its trailing-slash `proxy_pass`. (`useCopilotRuntime`
  calls `/api/copilot/chat`.)
  Add a short `//` comment above the rule: "Copilot SSE → agent-runtime :4100 /chat (Phase 72).
  Mirrors the prod nginx /api/copilot/ mapping (strip prefix). MUST precede the generic /api rule."
  Do NOT change the existing `/api` (or any other) proxy entry, and do NOT touch the build/manualChunks
  config. Keep code style: single quotes, no semicolons, 2-space indent, arrow with parens.
  </action>
  <verify>
  <automated>cd /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0 && echo '--- env keys (expect >=1 each) ---'; grep -c 'TEI_EMBED_URL' agent-runtime/.env.example; grep -c 'TEI_RERANK_URL' agent-runtime/.env.example; echo '--- vite proxy rule (expect 1) ---'; grep -c "'/api/copilot'" frontend/vite.config.ts; echo '--- rewrite strips prefix (expect 1) ---'; grep -c 'api\\\\/copilot' frontend/vite.config.ts; echo '--- /api/copilot declared before /api ---'; awk "/'\/api\/copilot'/{c=NR} /'\/api'/{a=NR} END{print (c>0 && c<a)?\"order-ok\":\"order-BAD\"}" frontend/vite.config.ts; echo '--- frontend typecheck ---'; pnpm --filter intake-frontend typecheck 2>&1 | tail -15</automated>
  </verify>
  <done>
  `agent-runtime/.env.example` contains `TEI_EMBED_URL=http://tei-embed:80` and
  `TEI_RERANK_URL=http://tei-rerank:80` plus the commented `127.0.0.1:8081/:8082` variants, with
  existing keys untouched. `frontend/vite.config.ts` has a `'/api/copilot'` proxy entry — declared
  BEFORE `'/api'` — with `target: 'http://localhost:4100'`, `changeOrigin: true`, `ws: true`, and a
  `rewrite` stripping the `/api/copilot` prefix. Frontend typecheck passes (no new errors introduced).
  </done>
  </task>

<task type="auto">
  <name>Task 3: Write the Mac-local runbook (deploy/MAC-LOCAL.md) + confirm frontend build stays green</name>
  <files>deploy/MAC-LOCAL.md</files>
  <action>
Create `deploy/MAC-LOCAL.md` — a SHORT, runnable runbook (no marketing voice, no emoji in copy).
Sections, in order:

1. **What this is** — one paragraph: a Mac-local mirror of the prod copilot stack via a compose
   override; the ONLY divergence is the two GPU backends. Link `deploy/docker-compose.prod.yml`
   and `deploy/docker-compose.mac.yml`.

2. **Prerequisites** —
   - Docker Desktop (provides `host.docker.internal`).
   - Ollama installed + a TOOL-CAPABLE model pulled: `ollama pull qwen3:30b` (and `ollama serve`
     listening on :11434). Note: the copilot uses model-native tool-calling, so the model must
     support tools.

3. **Run the full stack (docker compose)** — the exact command:
   `docker compose -f deploy/docker-compose.prod.yml -f deploy/docker-compose.mac.yml up -d`
   State that this gates out `vllm` (CUDA-only, profile `gpu-only`), points agent-runtime at the
   host Ollama, and runs TEI on the CPU image. Then list the `deploy/.env` keys to set (the prod
   compose reads these via `${...}`): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `MASTRA_PG_URL`,
   `ALLOWED_ORIGINS` (CSV, never `*`; e.g. `http://localhost:5173`). Note that `host.docker.internal`
   lets the in-container agent-runtime reach the host Ollama. First-boot TEI CPU images pull model
   weights (slow first run, cached after).

4. **Lighter alternative (pnpm dev, no agent-runtime container)** — for fast iteration:
   - Run ONLY the two TEI CPU containers, publishing host ports, e.g.:
     `docker run -p 8081:80 --platform linux/amd64 ghcr.io/huggingface/text-embeddings-inference:cpu-latest --model-id BAAI/bge-m3`
     and the reranker on `8082:80` with `--model-id BAAI/bge-reranker-v2-m3`.
   - In `agent-runtime/.env`, set `TEI_EMBED_URL=http://127.0.0.1:8081`,
     `TEI_RERANK_URL=http://127.0.0.1:8082`, `VLLM_BASE_URL=http://127.0.0.1:11434`,
     `VLLM_MODEL=qwen3:30b`, plus `SUPABASE_URL`/`SUPABASE_ANON_KEY`/`MASTRA_PG_URL`/`ALLOWED_ORIGINS`.
   - Start the runtime: `pnpm --filter agent-runtime dev` (binds :4100, `/chat` + `/health`).
   - Start the frontend: `pnpm --filter intake-frontend dev` — the new vite `/api/copilot` proxy
     routes the drawer to `localhost:4100/chat` (the same path nginx serves in prod).
   - Re-embed corpus (optional, needed for RAG answers): run
     `backend/src/jobs/reembed-rag-chunks.ts` against the live TEI. NOTE: this background job uses
     `SUPABASE_SERVICE_ROLE_KEY` (the documented background-job carve-out) + `TEI_EMBED_URL` — that
     is SEPARATE from the agent-runtime's anon-only keystone; never put a service-role key in
     agent-runtime's env.

5. **mastra RLS re-apply (after first boot)** — `@mastra/pg` CREATES `mastra_threads` /
   `mastra_messages` on the runtime's FIRST boot, so the owner-only RLS is a no-op until then.
   After the runtime has booted once, re-apply the `mastra_threads` / `mastra_messages` owner-only
   RLS (carried from 72-03/04/05; same step as the 72-09 deploy gate, item 6).

6. **Verify with the Phase-72 UAT proofs** — point to
   `.planning/phases/72-agent-platform-runtime-retrieval-reads/72-UAT.md` (do NOT duplicate it).
   List the 5 by name: PROOF 1 clearance-reduction (keystone), PROOF 2 EN+AR RTL render,
   PROOF 3 dims=1024, PROOF 4 SECURITY INVOKER + RLS, PROOF 5 e2e smoke; plus INFRA-01/02 smokes
   (`curl $VLLM_BASE_URL/v1/models`, `$TEI_EMBED_URL/embed`, `$TEI_RERANK_URL/rerank`). State that on
   Mac, `$VLLM_BASE_URL/v1/models` returns the Ollama model id (`qwen3:30b`), NOT `gemma-4-12b` —
   that single substitution is the intended parity gap (see next section).

7. **Parity vs prod** — an explicit short section: the ONLY differences from prod are
   (a) model: Ollama `qwen3:30b` (Mac) vs vLLM `gemma-4-12b` (prod), and (b) TEI on the CPU image
   (`cpu-latest`, `linux/amd64`) vs the GPU image. EVERYTHING ELSE is identical and inherited from
   the prod compose: the nginx `/api/copilot` SSE proxy, the env contract (service names
   `tei-embed`/`tei-rerank`, `VLLM_BASE_URL` knob), the `SUPABASE_ANON_KEY` + caller-JWT keystone
   (NO service-role in agent-runtime), the expose-only network contract, and the `rag_chunks`
   clearance RLS. Call out that because the override layers ON TOP of the prod file (not a fork),
   any future prod-compose change is automatically reflected on Mac.

Keep it tight (roughly one screen per major section). Use fenced code blocks for commands only.
</action>
<verify>
<automated>cd /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0 && echo '--- runbook sections present ---'; grep -c 'Parity vs prod' deploy/MAC-LOCAL.md; grep -c 'docker-compose.prod.yml -f deploy/docker-compose.mac.yml up -d' deploy/MAC-LOCAL.md; grep -c 'ollama pull qwen3:30b' deploy/MAC-LOCAL.md; grep -c '72-UAT.md' deploy/MAC-LOCAL.md; grep -c 'mastra_threads' deploy/MAC-LOCAL.md; grep -c 'SUPABASE_SERVICE_ROLE_KEY' deploy/MAC-LOCAL.md; echo '--- no emoji in copy (expect 0) ---'; grep -cP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" deploy/MAC-LOCAL.md; echo '--- frontend build stays green ---'; pnpm --filter intake-frontend build 2>&1 | tail -20</automated>
</verify>
<done>
`deploy/MAC-LOCAL.md` exists with all 7 sections: it contains the exact
`docker compose -f deploy/docker-compose.prod.yml -f deploy/docker-compose.mac.yml up -d` command,
the `ollama pull qwen3:30b` prereq, the `deploy/.env` keys (SUPABASE_URL/ANON_KEY/MASTRA_PG_URL/
ALLOWED_ORIGINS), the pnpm-dev TEI-container alternative with the `SUPABASE_SERVICE_ROLE_KEY` note
for the re-embed job, the `mastra_threads` RLS-after-first-boot note, a pointer to `72-UAT.md` for
the 5 proofs, and a "Parity vs prod" section naming the two-and-only-two divergences (model +
TEI CPU/GPU). No emoji in copy. `pnpm --filter intake-frontend build` completes green (the Task-2
vite proxy edit does not break the build).
</done>
</task>

</tasks>

<threat_model>

## Trust Boundaries

| Boundary                             | Description                                                                                                                                                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| browser → nginx/vite → agent-runtime | The caller JWT (Authorization: Bearer) + x-language ride the SSE request; RLS enforces clearance. Parity requires the Mac path preserve this header flow byte-for-byte (it does — agent-runtime is inherited from prod). |
| agent-runtime → Supabase             | Anon key + caller JWT ONLY. NO service-role. The override must NOT introduce a service-role key into agent-runtime's env.                                                                                                |
| agent-runtime → model/TEI backends   | On Mac these become host Ollama (:11434) + CPU TEI containers; still in-network/expose-only, no public ports.                                                                                                            |

## STRIDE Threat Register

| Threat ID | Category               | Component                       | Disposition     | Mitigation Plan                                                                                                                                                                                                           |
| --------- | ---------------------- | ------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-MAC-01  | Elevation of Privilege | agent-runtime override env      | mitigate        | Override ONLY `VLLM_BASE_URL` + `VLLM_MODEL`; deep-merge inherits `SUPABASE_ANON_KEY` and adds NO service-role key. Verify gate greps that agent-runtime keeps the anon key and no SERVICE_ROLE appears under it.         |
| T-MAC-02  | Information Disclosure | expose-only contract            | mitigate        | Override adds NO `ports:` to any service; nginx stays the only external path. Ollama runs on the host (no compose service).                                                                                               |
| T-MAC-03  | Tampering              | prod compose drift / fork       | mitigate        | Override LAYERS on the prod file (never edits/forks it). Verify gate asserts prod compose is byte-unchanged and `config` parses the merge clean.                                                                          |
| T-MAC-04  | Denial of Service      | vLLM on Mac (CUDA-only)         | accept→mitigate | vLLM profile-gated out of the Mac run (`profiles: ["gpu-only"]`); a plain `up` never schedules it. (replicas:0 rejected — Swarm-only, silently ignored by compose up.)                                                    |
| T-MAC-SC  | Tampering              | docker images / no npm installs | accept          | No package-manager installs in this plan (config/docs/dev-tooling only). Images pinned to the SAME upstream repos prod uses (TEI cpu-latest tag of `ghcr.io/huggingface/text-embeddings-inference`; Ollama is host-side). |

</threat_model>

<verification>
Whole-plan gate (run after all tasks):
- `docker compose -f deploy/docker-compose.prod.yml -f deploy/docker-compose.mac.yml config` exits 0.
- Merged config: vllm container EXCLUDED; agent-runtime → `host.docker.internal:11434` + `qwen3:30b`;
  tei-embed + tei-rerank on `text-embeddings-inference:cpu-latest` + `platform: linux/amd64` with
  original `--model-id`s; agent-runtime retains `SUPABASE_ANON_KEY` and NO service-role key.
- `git diff --stat deploy/docker-compose.prod.yml deploy/nginx/nginx.conf` shows NO changes (parity-by-layering).
- `pnpm --filter intake-frontend typecheck` and `pnpm --filter intake-frontend build` both green.
- vLLM is NOT run on Mac (no `docker run vllm`, no `up` without the override).
</verification>

<success_criteria>

- A developer can run `docker compose -f deploy/docker-compose.prod.yml -f deploy/docker-compose.mac.yml up -d`
  on a Mac and get the real prod topology minus the two GPU backends.
- The merged config is a faithful mirror: only the model (Ollama qwen3:30b) and TEI (CPU image)
  diverge; nginx SSE proxy, env contract, anon+JWT keystone, expose-only network, and RLS are identical.
- agent-runtime/.env.example documents TEI_EMBED_URL + TEI_RERANK_URL.
- The frontend dev proxy routes `/api/copilot/chat` → `localhost:4100/chat` (SSE), mirroring nginx.
- deploy/MAC-LOCAL.md gives prereqs, the up command, env keys, the pnpm-dev alternative, the 5 UAT
  proofs, the mastra RLS note, and an explicit Parity-vs-prod section.
- No app logic changed; prod compose + nginx untouched; frontend typecheck/build green.
  </success_criteria>

<output>
Create `.planning/quick/260619-cnm-mac-local-copilot-parity/260619-cnm-SUMMARY.md` when done.
</output>
