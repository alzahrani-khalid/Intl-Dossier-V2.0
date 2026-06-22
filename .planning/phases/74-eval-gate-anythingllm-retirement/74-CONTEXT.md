# Phase 74: Eval Gate + AnythingLLM Retirement - Context

**Gathered:** 2026-06-21
**Status:** Ready for planning
**Source:** Locked decisions from research (`74-RESEARCH.md`) + user approval (autonomous /loop). UI hint: no (backend/CI/eval phase).

<domain>
## Phase Boundary
Regression-gate AI quality via bilingual CI rubrics (EVAL-01/02/03) and **fully decommission AnythingLLM** (EVAL-04, FULL rip-out). Final v7.0 phase; depends on 69–73 (all AI surfaces exist).
- **In scope:** a Vitest eval harness + golden EN+AR dataset + a CI `eval-gate` job; full removal of AnythingLLM from ALL ~15 edge fns + backend + the prod container/levers, building on-prem replacements where none exist (esp. `intelligence-refresh`).
- **Out of scope:** new product features; the GPU/gemma deploy itself (the live-scoring half is deploy-gated, same as P72/P73).
</domain>

<decisions>
## Implementation Decisions (LOCKED, user-approved)

### D1 — EVAL-02 "correlation accuracy" = P71 analytic-graph link discovery

- Precision ≥0.75 / recall ≥0.70 of the edges `query_graph` returns (forum/committee/chain/path) vs a golden edge set. **Computed set-overlap (NO LLM judge)** → the CI-native rubric, runnable now without the GPU stack.

### D2 — ChatDock = un-mount + retire

- Remove `<ChatDock>` from `frontend/src/routes/_protected.tsx:103`; delete `/api/ai/chat` + `backend/src/api/ai/chat-assistant.ts` + `useAIChat.ts` path. The P72/P73 copilot is the sole assistant entry point. Confirm no other consumers of `/api/ai/chat`.

### D3 — Decommission scope = FULL AnythingLLM rip-out

- Remove AnythingLLM from ALL usages: the 3 critical surfaces + ALL ~15 edge fns + backend (`anythingllm.service.ts`, `llm-router` provider, `ai/config.ts` levers) + the prod compose container/volume + nginx `/llm/` proxy + env-example keys. **`intelligence-refresh`/`intelligence-refresh-v2`/`intelligence-batch-update` country-intel generation has NO on-prem path** → route it through the agent-runtime/on-prem model (net-new generation, the largest task). `word-assistant` (standalone page, hard dep) → re-home on-prem or remove the page. Re-point semantic-search embeddings (3 edge fns) to TEI BGE-M3 (1024-dim parity). `dossiers-briefs-generate` + `brief.service.ts` (DEFER-73-01-D dead writers) → remove/gate.

### D4 — Eval judge = on-prem gemma-4-12B via `getCopilotModel()`

- Zero-egress invariant preserved (regression-delta gate; self-grading bias accepted). Structured Zod-validated score per rubric dimension.

### D5 — Golden dataset = authored, EN+AR, ≈15–30 cases/rubric

- `agent-runtime/evals/fixtures/{briefs,correlation,arabic}/*.json`, committed seed-style. EVAL-01 targets the SUPPORTED `persist_brief`/propose-brief path (NOT the retired backend generator).

### D6 — CI split: CI-runnable now vs deploy-gated

- **CI-mode (required check):** EVAL-02 computed precision/recall + the 3 positive-failure proofs (degraded fixture → fail) + a static "no-AnythingLLM in the 3 critical surfaces" allowlist test. **Live-mode (deploy-gated, non-blocking):** generative EVAL-01/03 judge scoring (`if: secrets.EVAL_AI_URL != ''`). EVAL-04's network-block "surfaces still work" = a live UAT (CDP `Network.setBlockedURLs`), not a CI test.

### Claude's Discretion

- Eval workspace layout + Zod score schemas; the golden-case content; the on-prem intelligence-refresh prompt/wiring details; the exact CI job YAML.
  </decisions>

<canonical_refs>

## Canonical References

- `.planning/phases/74-eval-gate-anythingllm-retirement/74-RESEARCH.md` — full AnythingLLM map, eval-harness rec, CI plan, key files.
- `.github/workflows/ci.yml` (add `eval-gate` job; positive-failure precedent L69-73).
- `agent-runtime/src/llm-router.ts` (`getCopilotModel()` = judge + on-prem gen client), `agent-runtime/src/mastra/tools/{generate-digest,query-graph,propose-brief}.ts` (eval targets + intelligence-refresh re-home reference).
- `frontend/src/routes/_protected.tsx` (ChatDock un-mount), `frontend/src/domains/ai/hooks/useAIChat.ts`, `backend/src/api/ai/chat-assistant.ts` (retire).
- `backend/src/ai/{config.ts,llm-router.ts}` + `backend/src/services/anythingllm.service.ts` (rip-out).
- `supabase/functions/{search-semantic,semantic-search-unified,position-suggestions-get,intelligence-refresh,intelligence-refresh-v2,word-assistant,...}/index.ts` (re-point/re-home).
- `deploy/docker-compose.prod.yml` + `deploy/nginx/nginx.conf` (container/proxy removal).
- `agent-runtime/src/mastra/tools/hybrid-rag-search.ts` (`TEI_EMBED_URL/embed` pattern for the embedding re-point), `supabase/seeds/72-copilot-uat-seed.sql` (seed-style fixture precedent).
- MEMORY: `project_cdp_forced_error_uat_protocol` (the EVAL-04 network-block UAT pattern).
  </canonical_refs>

<deferred>
## Deferred Ideas
- The GPU/gemma deploy itself (live-scoring half of EVAL-01/03 verifies only after it — same gate as P72/P73).
- Wrapping non-critical AI as MCP tools (v7 spec idea) — only if it simplifies the rip-out; otherwise remove/re-home.
</deferred>

---

_Phase: 74-eval-gate-anythingllm-retirement · Context gathered 2026-06-21 via autonomous /loop_
