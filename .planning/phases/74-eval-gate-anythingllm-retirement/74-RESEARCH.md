# Phase 74 — Eval Gate + AnythingLLM Retirement — Research

> Research-only scoping. Feeds `/gsd:plan-phase 74`. Live-verified against the working tree + staging `zkrcjzdemdmwhearhfgg` 2026-06-21.

## Bottom line

- **EVAL-04** (zero AnythingLLM on the critical path): digest = already zero-LLM; copilot = already 100% on-prem (P72/P73). Gaps = legacy ChatDock + semantic-search embeddings + the container/levers. User chose **FULL rip-out** (all ~15 edge fns too).
- **EVAL-01/02/03** = greenfield: no eval framework/judge/dataset exists; only Vitest. CI has no eval job. The generative scoring (EVAL-01/03) is **deploy-gated** on the open GPU/gemma stack; EVAL-02 (computed precision/recall) is CI-runnable now.

## (A) AnythingLLM usage map

### Critical surfaces (EVAL-04)

| Surface                            | Path                                                                                                                                                      | Current                                      | Action                                                                                                                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dashboard digest                   | `useDashboardDigest.ts` → `generate_digest()` RPC (P70)                                                                                                   | pure SQL, NO LLM                             | none — assert in network-block test                                                                                                                                            |
| Copilot (primary)                  | `useCopilotRuntime.ts` → `/api/copilot/chat` → agent-runtime `getCopilotModel()` (vLLM/Ollama)                                                            | on-prem only                                 | none (deploy-gated to run live)                                                                                                                                                |
| **ChatDock (legacy)**              | `frontend/src/routes/_protected.tsx:103` `<ChatDock>` → `useAIChat.ts` → `/api/ai/chat` → `chat-assistant.ts:525` → `llm-router.ts:399 chatAnythingLLM()` | AnythingLLM (prod `AI_USE_ANYTHINGLLM=true`) | **UN-MOUNT + RETIRE** (D2): remove `<ChatDock>` from `_protected.tsx:103`, delete `/api/ai/chat`+`chat-assistant.ts`                                                           |
| **Semantic-search embeddings**     | `supabase/functions/{search-semantic,semantic-search-unified,position-suggestions-get}/index.ts` → AnythingLLM `/api/v1/embed`                            | AnythingLLM (full-text fallback in 2/3)      | **RE-POINT** to TEI BGE-M3 (`TEI_EMBED_URL/embed`, used by `agent-runtime/.../hybrid-rag-search.ts`); KEEP 1024-dim parity (live `ai_embeddings`/`rag_chunks` = halfvec(1024)) |
| Search suggestions (fuzzy/history) | `search-suggestions` RPC + ILIKE                                                                                                                          | no AnythingLLM                               | none                                                                                                                                                                           |

### Full footprint (D3 FULL rip-out — all of these)

- **Backend:** `anythingllm.service.ts` (client), `ai/llm-router.ts:117,399,501` (provider+routing), `ai/config.ts:117-122,157` (`anythingllm` provider + `AI_USE_ANYTHINGLLM`/`ANYTHINGLLM_API_URL` off-switch), `semantic-search.service.ts:109`, `vector.service.ts`, `services/brief.service.ts:132` (DEFER-73-01-D dead brief gen), `api/ai/dossier-field-assist.ts`.
- **Edge fns (19 reference it):** runtime callers `intelligence-refresh`, `intelligence-refresh-v2`, `intelligence-batch-update`, `ai-extract`, `ai-summary-generate`, `multilang-content`, `translate-content`, `positions-consistency-check`, `intake-tickets-duplicates`, `position-suggestions-get`, `search-semantic`, `semantic-search-unified`, `dossier-field-assist`, `embeddings-generate` (OpenAI-first fallback). Legacy: `word-assistant` (hard dep, standalone page), `dossiers-briefs-generate` (already commented "retired in P74"), `intake-ai-health` (health check), `_shared/briefing-pack-generator.ts`. Data-only (no call): `intelligence-get`, `_shared/validation-schemas.ts`.
- **⚠ `intelligence-refresh` (country-intel generation) has NO on-prem replacement wired** — full removal there is NET-NEW generation work (route through agent-runtime/on-prem model), not a re-point. The single largest EVAL-04 task.
- **Infra/config:** `deploy/docker-compose.prod.yml:83-86,131-153` (backend env + `mintplexlabs/anythingllm` container + `anythingllm_data` volume), `deploy/nginx/nginx.conf:54,144` (`/llm/` proxy), `backend/.env.example:51-52,67`, `deploy/.env.example:17,40-43`. `VITE_ANYTHINGLLM_URL` build-arg is DEAD (unreferenced in `frontend/src`). The `anythingllm` MCP/skill + `anythingllm-integration` agent = tooling, not app code.

## (B) Eval-harness recommendation

- **Runner = Vitest** in `agent-runtime/evals/` (has `getCopilotModel()` + OpenAI-compatible plumbing); separate `vitest.eval.config.ts` (don't run in the unit-test job).
- **Judge = on-prem gemma-4-12B** via `getCopilotModel()` (zero-egress invariant; regression-delta gate, self-grading bias accepted). Structured Zod-validated score per rubric dim.
- **Rubrics:** EVAL-01 briefing quality EN+AR ≥0.80 (judge vs golden brief; target the SUPPORTED `persist_brief`/propose-brief path, NOT the retired backend generator); EVAL-02 = **P71 analytic-graph link discovery precision≥0.75/recall≥0.70** (computed set-overlap of `query_graph` edges vs a golden edge set — NO judge, CI-runnable); EVAL-03 Arabic quality ≥0.75 (judge AR fluency/terminology/RTL).
- **Golden dataset** (must author, ≈15–30 cases/rubric, EN+AR): `agent-runtime/evals/fixtures/{briefs,correlation,arabic}/*.json`, committed seed-style. Each = input + golden reference + expected-label set.
- **Threshold gate:** `expect(score).toBeGreaterThanOrEqual(t)` → exit 1 on miss. Prove-it-fails via a degraded positive-failure fixture (repo precedent: `ci.yml:69-73` bad-fixture asserts).

## (C) CI integration

- Add one `eval-gate` job to `.github/workflows/ci.yml`; `needs: [lint, type-check]`; `pnpm --filter <evals> test:eval`.
- **Two-mode:** CI-mode (default, runnable now) = EVAL-02 computed metric + 3 positive-failure proofs against recorded fixtures → **required** check. Live-mode (deploy-gated) = generative EVAL-01/03 judge, gated `if: secrets.EVAL_AI_URL != ''` → non-blocking until the GPU host is permanent.
- **EVAL-04 network-block** ("block AnythingLLM, surfaces still work") = a live UAT (CDP `Network.setBlockedURLs`, MEMORY `project_cdp_forced_error_uat_protocol`), NOT a CI test. CI complement: a static greppable allowlist test asserting the 3 critical surfaces' source has zero AnythingLLM import/URL.

## Key files for the planner

`.github/workflows/ci.yml` (add eval-gate); `agent-runtime/src/llm-router.ts:68` (judge+gen client); `agent-runtime/src/mastra/tools/` (eval targets); `frontend/src/routes/_protected.tsx:103,113` (ChatDock un-mount); `backend/src/ai/config.ts:117-157` + `deploy/docker-compose.prod.yml:83-153` (off-switch + container removal); `supabase/functions/{search-semantic,semantic-search-unified,position-suggestions-get}/index.ts` (embedding re-point to TEI); `intelligence-refresh*` (net-new on-prem generation); `.planning/phases/73-.../deferred-items.md` (DEFER-73-01-D).
