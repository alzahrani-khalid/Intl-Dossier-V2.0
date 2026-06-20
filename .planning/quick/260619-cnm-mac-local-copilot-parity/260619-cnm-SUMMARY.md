---
phase: quick-260619-cnm
plan: 01
subsystem: deploy / dev-tooling
tags: [docker-compose, mac-local, copilot, agent-runtime, vite-proxy, tei, ollama, phase-72]
requires:
  - deploy/docker-compose.prod.yml (prod topology — layered onto, never forked)
  - deploy/nginx/nginx.conf (the /api/copilot/ SSE proxy this dev proxy mirrors)
  - agent-runtime/src/config.ts (VLLM_BASE_URL is the Mac model lever)
  - frontend/src/components/copilot/useCopilotRuntime.ts (calls /api/copilot/chat)
provides:
  - deploy/docker-compose.mac.yml (Mac-runnable Compose override)
  - agent-runtime/.env.example TEI_EMBED_URL + TEI_RERANK_URL keys
  - frontend/vite.config.ts /api/copilot dev SSE proxy
  - deploy/MAC-LOCAL.md runbook
affects:
  - local dev workflow for the Phase-72 copilot stack (no prod runtime impact)
tech-stack:
  added: []
  patterns:
    - 'Compose override layering (-f prod -f mac) instead of forking the prod file'
    - 'profiles gate to exclude a CUDA-only service from `docker compose up` (replicas:0 is Swarm-only, ignored)'
    - 'vite dev proxy mirroring an nginx trailing-slash prefix strip for SSE'
key-files:
  created:
    - deploy/docker-compose.mac.yml
    - deploy/MAC-LOCAL.md
  modified:
    - agent-runtime/.env.example
    - frontend/vite.config.ts
decisions:
  - 'vLLM excluded on Mac via profiles: [gpu-only], not deploy.replicas:0 (Swarm-only, silently ignored by compose up)'
  - 'Mac model lever is VLLM_BASE_URL (the SAME knob prod uses), NOT OLLAMA_BASE_URL (that path changes provider routing)'
  - 'TEI swapped to cpu-latest + platform linux/amd64 (no native arm64 image); service names/expose/model-ids kept so TEI_*_URL resolve unchanged'
  - 'dev /api/copilot proxy strips the prefix exactly as nginx does, so /api/copilot/chat reaches :4100/chat'
metrics:
  duration_min: 6
  tasks_completed: 3
  files_changed: 4
  completed: 2026-06-19
---

# Quick 260619-cnm: Mac-local dev parity for the Phase-72 copilot stack — Summary

A Mac-local dev path that faithfully mirrors `deploy/docker-compose.prod.yml` by layering a
Compose **override** (`deploy/docker-compose.mac.yml`) on top of it — not a fork — so the only
divergence from prod is the two GPU-bound backends (the LLM + the two TEI servers), swapped for
Mac-runnable equivalents (host Ollama `qwen3:30b` + TEI `cpu-latest`/`linux/amd64`). The
agent-runtime `SUPABASE_ANON_KEY` + caller-JWT keystone, the nginx `/api/copilot` SSE proxy, the
`intl-dossier` network, and the expose-only contract all stay byte-identical to prod.

## What was built

| Task | Deliverable                                                                                                         | Commit     |
| ---- | ------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1    | `deploy/docker-compose.mac.yml` — Compose override (vllm profile-gated; agent-runtime → host Ollama; TEI CPU image) | `9d5e2f90` |
| 2    | `agent-runtime/.env.example` TEI keys + `frontend/vite.config.ts` `/api/copilot` dev SSE proxy                      | `bdf495de` |
| 3    | `deploy/MAC-LOCAL.md` — 7-section runbook                                                                           | `4bbd0fd2` |

### Task 1 — Mac compose override

`deploy/docker-compose.mac.yml` overrides exactly four prod services and nothing else:

- **vllm** → `profiles: ['gpu-only']` (CUDA-only; excluded from a plain `docker compose up`). A
  comment records why `deploy.replicas: 0` was rejected (Swarm-only, silently ignored by compose up).
- **agent-runtime** → `VLLM_BASE_URL: http://host.docker.internal:11434` + `VLLM_MODEL: qwen3:30b`
  (the two model-pointer env vars only; everything else deep-merges from prod, incl. the anon keystone,
  `TEI_*_URL`, `DATABASE_URL`, `OTEL_...`, `expose: 4100`, `depends_on: redis`).
- **tei-embed** / **tei-rerank** → `image: ghcr.io/huggingface/text-embeddings-inference:cpu-latest`,
  `platform: linux/amd64`, original `--model-id` kept. No GPU `deploy:` block exists on prod TEI, so
  nothing to neutralize (documented in a comment to prevent a phantom future removal).

No `ports:` added to any service (expose-only contract preserved). No top-level `name:` (inherited from prod).

### Task 2 — env keys + dev proxy

- `agent-runtime/.env.example` gains a `# --- Retrieval backends (TEI) ---` section:
  `TEI_EMBED_URL=http://tei-embed:80`, `TEI_RERANK_URL=http://tei-rerank:80`, plus commented
  `127.0.0.1:8081`/`8082` pnpm-dev variants. Existing keys untouched.
- `frontend/vite.config.ts` gains a `'/api/copilot'` proxy entry **before** the generic `'/api'`:
  `target: 'http://localhost:4100'`, `changeOrigin: true`, `ws: true`,
  `rewrite: (path) => path.replace(/^\/api\/copilot/, '')`. This is the IDENTICAL prefix strip the prod
  nginx `/api/copilot/` block does via its trailing-slash `proxy_pass`, so `/api/copilot/chat`
  (what `useCopilotRuntime.ts` calls) reaches `localhost:4100/chat` (what `registerCopilotKit({ path: '/chat' })` serves).

### Task 3 — runbook

`deploy/MAC-LOCAL.md`, 7 sections: what-this-is, prereqs (`ollama pull qwen3:30b`), the exact up command,
`deploy/.env` keys (SUPABASE_URL / ANON_KEY / MASTRA_PG_URL / ALLOWED_ORIGINS), the pnpm-dev TEI-container
alternative (with the re-embed job's `SUPABASE_SERVICE_ROLE_KEY` carve-out note, kept separate from the
agent-runtime anon-only keystone), the `mastra_threads`/`mastra_messages` RLS-after-first-boot note, a
pointer to `72-UAT.md` for the 5 proofs, and an explicit Parity-vs-prod section naming the two-and-only-two
divergences (model + TEI CPU/GPU).

## Verification

| Gate                                                                                       | Result                                                                              |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `docker compose -f deploy/docker-compose.prod.yml -f deploy/docker-compose.mac.yml config` | exit 0 (clean)                                                                      |
| vllm container in merge                                                                    | 0 (profile-gated out)                                                               |
| agent-runtime `host.docker.internal:11434`                                                 | 1                                                                                   |
| agent-runtime `VLLM_MODEL: qwen3:30b`                                                      | 1                                                                                   |
| TEI `cpu-latest` image                                                                     | 2                                                                                   |
| TEI `platform: linux/amd64`                                                                | 2                                                                                   |
| TEI `--model-id` (bge-m3 / bge-reranker-v2-m3)                                             | 1 each, intact                                                                      |
| agent-runtime keeps `SUPABASE_ANON_KEY`, NO service-role                                   | confirmed (the only 2 service-role refs are under **backend**, inherited from prod) |
| prod compose + nginx byte-unchanged                                                        | confirmed (parity-by-layering)                                                      |
| `agent-runtime/src` + `frontend/src` untouched                                             | confirmed                                                                           |
| `frontend` type-check (`tsc --noEmit`)                                                     | exit 0                                                                              |
| `frontend` build (`vite build`)                                                            | exit 0 (`✓ built`; pre-existing chunk-size advisory only)                           |
| no emoji in MAC-LOCAL.md                                                                   | 0                                                                                   |
| vite `/api/copilot` declared before `/api`                                                 | order-ok                                                                            |

docker 29.5.3 was present in this environment, so the full compose-config merge gate ran (no YAML-lint
fallback needed). The frontend type-check and build both ran green.

## Deviations from Plan

**Note (script name, not a deviation):** the plan's verify gate called `pnpm --filter intake-frontend typecheck`,
but the frontend package's script is `type-check` (hyphenated); `typecheck` does not exist. Used the real
script `type-check` (`tsc --noEmit`) — same intent, green. No code change resulted.

Otherwise: plan executed exactly as written. No bugs found, no missing critical functionality, no blocking
issues, no architectural changes.

## Known Stubs

None. This is config/docs/dev-tooling only; no app data paths or UI rendering involved.

## Self-Check: PASSED

- deploy/docker-compose.mac.yml — FOUND, committed in 9d5e2f90
- agent-runtime/.env.example — FOUND (TEI keys present), committed in bdf495de
- frontend/vite.config.ts — FOUND (/api/copilot proxy present), committed in bdf495de
- deploy/MAC-LOCAL.md — FOUND, committed in 4bbd0fd2
- commits 9d5e2f90, bdf495de, 4bbd0fd2 — all present in git log
