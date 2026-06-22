---
phase: 74-eval-gate-anythingllm-retirement
plan: 08
subsystem: infra + CI
tags: [anythingllm-retirement, infra-removal, ci-guard, eval-04, d3, d6]
requirements: [EVAL-04]
wave: 4
depends_on: [74-02]
dependency_graph:
  requires:
    - '74-02 (frontend ChatDock removal — copilot critical surfaces already AnythingLLM-free)'
    - '74-03 (semantic-search edge fns re-pointed to TEI bge-m3 — search surfaces already AnythingLLM-free)'
  provides:
    - 'prod + mac compose with NO AnythingLLM container/volume/env/build-arg'
    - 'nginx (both confs) with NO /llm/ proxy or upstream anythingllm'
    - 'env-examples with NO ANYTHINGLLM_* / VITE_ANYTHINGLLM_* keys'
    - 'check:no-anythingllm static CI guard + its positive-failure fixture (EVAL-04 CI side)'
  affects:
    - '74-10 (CI wiring — the eval-gate job runs `check:no-anythingllm` + the `! ... <fixture>` positive-failure assertion)'
tech_stack:
  added: []
  patterns:
    - 'Dependency-free Node ESM static guard mirroring scripts/check-edge-fn-schema-refs.mjs (CLI path-arg retarget for the bad-fixture positive-failure)'
    - 'positive-failure fixture under tools/ proving a CI guard fails on a regression (ci.yml precedent)'
key_files:
  created:
    - 'scripts/check-no-anythingllm.mjs'
    - 'tools/anythingllm-fixtures/critical-surface-with-anythingllm/sample.ts'
  modified:
    - 'deploy/docker-compose.prod.yml'
    - 'deploy/docker-compose.mac.yml'
    - 'deploy/nginx/nginx.conf'
    - 'deploy/nginx/nginx.prod.conf'
    - 'backend/.env.example'
    - 'deploy/.env.example'
    - 'package.json'
decisions:
  - 'D3 — FULL AnythingLLM rip-out: removed the container, anythingllm_data volume, backend ANYTHINGLLM_* env + AI_USE_ANYTHINGLLM lever, dead VITE_ANYTHINGLLM_URL build-arg, both nginx /llm/ proxies + upstreams, and all env-example keys.'
  - 'D6 — CI-native static guard: check:no-anythingllm greps the 3 critical surfaces (6 files) for `anythingllm`; a planted bad fixture proves it fails on a regression (no GPU/LLM needed).'
  - 'Also removed the orphaned OPEN_AI_KEY / OPEN_MODEL_PREF / LLM_PROVIDER keys from deploy/.env.example — they fed ONLY the now-removed anythingllm container (so the file greps clean for `anythingllm` and carries no dead cloud-provider levers).'
metrics:
  duration_minutes: 18
  tasks_completed: 2
  files_changed: 9
  completed_date: 2026-06-21
---

# Phase 74 Plan 08: AnythingLLM Infra Removal + Static No-AnythingLLM CI Guard Summary

Decommissioned the AnythingLLM infrastructure and levers (D3) across both prod and mac compose, both nginx confs, and both env-examples, and added the CI-native static `check:no-anythingllm` guard (D6) — a dependency-free grep over the three critical AI surfaces with a planted bad fixture proving it fails on a regression. This is the CI side of EVAL-04.

## What Was Built

### Task 1 — AnythingLLM infra + levers removed (D3) — commit `37d80526`

Removed from **`deploy/docker-compose.prod.yml`**:

- the entire `anythingllm:` service (`mintplexlabs/anythingllm:latest` + its healthcheck/env block)
- the `anythingllm_data:` named volume
- the backend env block: `ANYTHINGLLM_API_URL`, `ANYTHINGLLM_API_KEY`, `ANYTHINGLLM_WORKSPACE`, `AI_USE_ANYTHINGLLM: 'true'`
- the dead `VITE_ANYTHINGLLM_URL` frontend build-arg (line 47 — unreferenced in `frontend/src`)
- (verified: no service had a `depends_on: anythingllm` entry to remove)

**`deploy/docker-compose.mac.yml`**: dropped the `anythingllm,` token from the inherited-services doc comment (no service/volume/env block existed here).

**`deploy/nginx/nginx.conf` + `deploy/nginx/nginx.prod.conf`** (both): removed the `upstream anythingllm { server anythingllm:3001; }` block and the externally-reachable `location /llm/ { ... proxy_pass http://anythingllm/; }` block. The frontend/backend/agent-runtime upstreams and the `/api/copilot/` SSE proxy are untouched.

**`backend/.env.example`**: removed `ANYTHINGLLM_API_URL`, `ANYTHINGLLM_API_KEY`, and `AI_USE_ANYTHINGLLM`. `VLLM_BASE_URL` / `OLLAMA_BASE_URL` / the AI embedding knobs stay.

**`deploy/.env.example`**: removed `VITE_ANYTHINGLLM_URL`, the `# ANYTHINGLLM` key block (`ANYTHINGLLM_API_KEY`), and the orphaned `LLM_PROVIDER` / `OPEN_AI_KEY` / `OPEN_MODEL_PREF` container levers (these were consumed ONLY by the removed `anythingllm` service); reworded the `# LLM API KEYS` section to a neutral "optional cloud LLM key" note (Anthropic comment retained).

### Task 2 — Static no-AnythingLLM critical-surface guard (D6) — commit `05e29b1b`

- **`scripts/check-no-anythingllm.mjs`** — a dependency-free Node ESM guard mirroring `scripts/check-edge-fn-schema-refs.mjs`'s CLI shape. Default (no arg): scans the 3 critical surfaces (6 files) — `useDashboardDigest.ts`, `useCopilotRuntime.ts`, `CopilotSurface.tsx`, `search-semantic/index.ts`, `semantic-search-unified/index.ts`, `position-suggestions-get/index.ts` — for the case-insensitive token `anythingllm`; prints `file:line` and exits 1 on any match, exits 0 otherwise. An optional path arg retargets the scan (a single file is scanned directly, a directory is walked for `*.ts`/`*.tsx`) so CI can point it at the bad fixture. A renamed-away critical-surface file is itself reported as a failure (no silent pass).
- **`tools/anythingllm-fixtures/critical-surface-with-anythingllm/sample.ts`** — the planted positive-failure fixture; contains `process.env.ANYTHINGLLM_API_URL ?? 'http://anythingllm:3001'` so `! node scripts/check-no-anythingllm.mjs tools/anythingllm-fixtures/critical-surface-with-anythingllm` holds. Not imported anywhere.
- **`package.json`** — added `"check:no-anythingllm": "node scripts/check-no-anythingllm.mjs"` next to `check:edge-fn-schema`.

## Verification (all PASS)

| Check                                                                      | Result                                                  |
| -------------------------------------------------------------------------- | ------------------------------------------------------- |
| `grep -rin anythingllm` across the six infra files                         | PASS — clean (zero matches)                             |
| `docker compose -f deploy/docker-compose.prod.yml config -q`               | PASS — exit 0                                           |
| `docker compose -f prod -f mac config -q` (override layers cleanly)        | PASS — exit 0                                           |
| `node scripts/check-no-anythingllm.mjs` (real surfaces)                    | PASS — exit 0 (6 files scanned, 0 refs)                 |
| `! node scripts/check-no-anythingllm.mjs <bad-fixture>` (positive-failure) | PASS — guard exits 1 on the fixture (dir + single-file) |
| `node scripts/check-no-anythingllm.mjs /nonexistent`                       | exit 1 (not-found arg fails, as intended)               |
| `package.json` has `check:no-anythingllm`                                  | PASS                                                    |
| vLLM/TEI/agent-runtime services (4/4) + `/api/copilot/` proxy intact       | PASS                                                    |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — missing critical functionality] Removed orphaned cloud-provider levers from `deploy/.env.example`**

- **Found during:** Task 1, step 4. The plan's task body said to remove "line 17 + the 40-43 ANYTHINGLLM block", but the plan's `<verify>` requires `grep -rin anythingllm deploy/.env.example` to return nothing, and the `# LLM API KEYS (for AnythingLLM)` comment block (plus `LLM_PROVIDER` / `OPEN_AI_KEY` / `OPEN_MODEL_PREF`) still mentioned AnythingLLM and were consumed only by the removed container.
- **Fix:** Removed those orphaned keys/comments and reworded the section to a neutral "optional cloud LLM key" note, so the file greps clean and carries no dead AnythingLLM levers (D3 = FULL rip-out of the levers).
- **Files modified:** `deploy/.env.example`
- **Commit:** `37d80526`

## Known Stubs

None. No placeholder/empty-value stubs introduced — this plan is pure removal + a static guard.

## Out-of-scope notes (non-load-bearing, deferred per plan)

The plan's task body explicitly scopes `deploy/*.md` out of scope and asks only to note them. The following AnythingLLM mentions remain in deploy docs (not in this plan's `files_modified`, NOT load-bearing — pure prose/runbook history):

- `deploy/README.md` — 4 mentions (ASCII topology diagram + `./logs.sh anythingllm` + health-check curl example)
- `deploy/DROPLET_INSTRUCTIONS.md` — 3 mentions (container table row + a `docker stop/rm` one-liner + an `OPENAI_API_KEY (for AnythingLLM)` note)
- `deploy/DEPLOY_NEW_APP_GUIDE.md` — 1 mention (services bullet list)

These do not affect any runtime path (the container, proxy, env, and levers are all gone) and the static guard does not scan docs. Recommend a follow-up doc-cleanup quick (or fold into 74-10 CI/doc wrap) to refresh the topology diagram and runbook commands.

## No-Regression Confirmation

- vLLM / TEI-embed / TEI-rerank / agent-runtime services and the `/api/copilot/` SSE proxy are intact in both compose files and both nginx confs.
- Both compose files parse (`config -q` exit 0) after the container/volume/depends_on removal and the pre-commit prettier reformat of the two `.yml` files.
- The three critical surfaces remain AnythingLLM-free (the guard asserts it in CI).

## Self-Check: PASSED

- All 10 files (2 created, 7 modified, 1 SUMMARY) verified present on disk.
- Both per-task commits verified in git log: `37d80526` (Task 1 infra removal), `05e29b1b` (Task 2 guard + fixture).
