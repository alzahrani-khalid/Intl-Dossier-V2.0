# Project Research Summary

**Project:** Intl-Dossier
**Domain:** On-prem agentic intelligence layer for diplomatic dossier management (Arabic-first, clearance-gated)
**Researched:** 2026-06-13
**Confidence:** HIGH

## Executive Summary

v7.0 delivers a production-grade, fully on-prem agentic intelligence layer on sovereign infrastructure. It unifies three new analytic surfaces (signals triage, digests + alerts, graph-analytic queries) with a bilingual copilot (CopilotKit + Mastra + AG-UI) that reads and acts under JWT-enforced clearance boundaries — the agent is incapable by construction of reading above the caller's clearance.

The architecture is locked (Option A): Mastra agent runtime + CopilotKit/AG-UI + vLLM-served Gemma 4 12B + pgvector hybrid retrieval. The keystone is **JWT propagation** — every interactive DB call runs under the caller's JWT so RLS enforces `sensitivity_level <= clearance` automatically; service-role is reserved strictly for cron/no-user paths with explicit app-layer authz.

**Remediation-first:** three existing security/consistency bugs — all confirmed in the live repo — must be fixed before any new intelligence table is wired, because everything downstream inherits them: clearance-scale unification, embedding-geometry corruption, and the `supabaseAdmin` RLS-bypass. Build order is data-layer-first (69–71), agent platform second (72–73), quality gate last (74), with the model/embeddings/observability substrate stood up on a parallel infra track that begins at Phase 68 and lands by Phase 72.

## Key Findings

### Recommended Stack

Versions verified via Context7 + registries on 2026-06-13. The agent layer is TS-native (no Python polyglot service); nothing leaves the building.

**Core technologies:**

- **Mastra** `@mastra/core@1.42.0` (bump from `^1.36.0`): agent runtime; `registerCopilotKit()` from `@ag-ui/mastra@1.0.3` mounts the AG-UI SSE endpoint via one `apiRoutes` entry.
- **CopilotKit** (self-hosted runtime, `@copilotkit/react-core` + `@copilotkit/react-ui`): `useFrontendTool` + `renderAndWaitForResponse` HITL. Core agentic features work WITHOUT a cloud key; only the named "Fully Headless UI" (`useCopilotChatHeadless_c`) needs a free license key → egress risk. Fallback shell: `assistant-ui@0.14.18` + `@assistant-ui/react-ag-ui@0.0.38` (same AG-UI wire contract).
- **vLLM** `v0.23.0` (`vllm/vllm-openai:v0.23.0`): native Gemma 4 support (`--tool-call-parser gemma4`) serving `google/gemma-4-12b-it`; llama.cpp/Ollama for modest/airgapped. OpenAI-compatible API — model is a swappable detail.
- **TEI** (HF text-embeddings-inference): `bge-m3` (1024-dim) + `bge-reranker-v2-m3`, self-hosted.
- **pgvector** `0.8.2`: `halfvec(1024)` + `halfvec_cosine_ops` HNSW. ⚠ Verify staging `extversion >= 0.7.0` before the Phase-68 migration.
- **Observability:** Langfuse v3 self-host (`langfuse/langfuse:3` + `-worker:3`, requires new ClickHouse + MinIO) + Arize Phoenix (`arizephoenix/phoenix:version-17.5.0`, port 6006), fed by `@traceloop/node-server-sdk` + `@opentelemetry/sdk-node`. Zero telemetry egress.

**Do NOT add:** second vector datastore; Python polyglot agent service; LangGraph (EL-2.0 production-server license blocks sovereign self-host); external graph DB (Neo4j) — graph stays in Postgres recursive CTEs.

### Expected Features

**Must have (table stakes):**

- Signal capture (manual + AI-surfaced) + keyboard-driven RTL triage — binary verdict (`new → acknowledged → dismissed | escalated`), NOT a Kanban.
- Recurring digests (scheduled documents w/ subscribers) AND threshold alerts (atomic, condition-triggered, immediate) — architecturally distinct; do not batch alerts into digests.
- Multi-channel delivery via pluggable adapters: in-app (Realtime), on-prem SMTP, external webhook/Teams — deep-links only, no classified content in external payloads.
- Clearance-aware analytic graph RPCs (who-sits-on-which-forum, shared committees, engagement chains) — all `SECURITY INVOKER`.
- Copilot that renders token-bound bilingual cards (not chat bubbles); every write HITL-gated.

**Should have (differentiators):**

- Generative UI rendering the app's own components (`UniversalDossierCard`, signal cards) inline + deep-links.
- Cmd+K as a conversational entry alongside a primary copilot surface.
- Bilingual (EN/AR) eval harness as a CI regression gate.

**Defer (v7.1+ — anti-features for v7.0):**

- External feed ingestion (RSS/public APIs) — the untrusted-content/indirect-injection surface.
- Multi-GPU horizontal model-serving scale-out.
- Advanced quarantine / dual-LLM rigor (lands with feeds).

### Architecture Approach

A new `agent-runtime` (4th Turborepo workspace; add to `pnpm-workspace.yaml`) runs an Express app hosting the Mastra server with `registerCopilotKit({ path: '/chat' })`, on a distinct port (4100 recommended — clear of the macOS :5000 AirPlay conflict). The existing `mastra-config.ts` + `ai/config.ts` are lifted and extended, not rewritten.

**Major components:**

1. **JWT keystone** — a per-request `getUserClient(jwt)` helper (`createClient(URL, ANON_KEY, { global: { headers: { Authorization: 'Bearer '+jwt } }, auth: { persistSession:false } })`) — the exact idiom already proven in ~20 existing edge functions. Retire `supabaseAdmin` from `chat-assistant.ts` (7 sites).
2. **Hybrid RAG RPC** — one `rag_chunks` table; HNSW dense + tsvector/pg_trgm sparse via RRF + TEI reranker; **`SECURITY INVOKER`** so RLS on chunks enforces clearance automatically (no per-tool authz code).
3. **Re-embed migration** — stop the 1536 pad/truncate; converge on `bge-m3` 1024-dim halfvec + HNSW rebuild; batched, off-hours, non-blocking.
4. **Channel-adapter abstraction** — in-app / SMTP / webhook behind one interface.
5. **Observability/eval** — Langfuse + Phoenix via OTel.

### Critical Pitfalls

1. **Service-role RLS bypass (`supabaseAdmin` in `chat-assistant.ts`, 7 sites)** — a live data-exposure path; the JWT keystone is the fix. Phase 68. P73 write tools must use a JWT-scoped client _inside every `resume()` handler_, not just the confirmation UI.
2. **`SECURITY DEFINER` is wider than the spec captured** — `vector_similarity_search` and the semantic-search/suggestions/saved-searches RPCs are DEFINER with bypassable app-level clearance args. Every new Phase-71 analytic + Phase-72 RAG RPC must be `SECURITY INVOKER`.
3. **Embedding-geometry corruption** — `normalizeEmbedding(data.embedding, 1536)` (search-semantic line 54) pad/truncates and corrupts cosine geometry; re-embed to native 1024-dim. Phase 68.
4. **Three clearance scales** — `profiles.clearance_level` (1–4) vs `get_user_clearance_level()` (1–3) vs `dossiers.sensitivity_level` (low/med/high), plus stray 4/5-value enums. Pick `profiles.clearance_level` (1–4) canonical; map sensitivity strings to integers for all chunk/signal RLS — without silently breaking existing RLS. Phase 68.
5. **i18n silent-English-fallback** — an unregistered namespace falls back to English (looks fine in EN, broken in AR). Add a CI guard that asserts every `useTranslation('ns')` has a registered resource in `src/i18n/index.ts` — into the Phase-68 eval-harness scaffolding, not when a surface breaks.
6. **CopilotKit air-gap** — resolved empirically in the Phase-72 Option-C spike (block `*.copilotkit.ai`, verify AG-UI/HITL events still arrive; fall back to `assistant-ui`).

## Implications for Roadmap

Suggested structure (continues numbering after v6.6 → phases 68–74; consistent with spec §4):

### Phase 68: AI Foundations Remediation

**Rationale:** Hard gate — everything downstream inherits these three bugs.
**Delivers:** canonical clearance scale (1–4); remove embedding pad/truncate; interim clearance-RLS on current vector search; retire `supabaseAdmin` in `chat-assistant.ts`; bilingual eval-harness scaffolding (Langfuse + Phoenix, OTel) + i18n-namespace CI guard. Begin parallel infra (vLLM GPU, TEI, observability).
**Avoids:** pitfalls 1–5.

### Phase 69: Signals (feature + tool)

**Rationale:** First data layer; the agent needs real signals to read.
**Delivers:** `intelligence_signal` table + polymorphic dossier links (mirror `work_item_dossiers` + partial-unique index) + clearance-RLS; manual + AI-surfaced capture; keyboard-driven RTL triage surface; `read_signals` agent tool; `signals` i18n namespace.

### Phase 70: Digests + Alerts (feature + substrate)

**Rationale:** Builds on signals; introduces the channel-adapter abstraction.
**Delivers:** cron digest pipeline (service-role + explicit authz at delivery) + alert thresholds + subscriber model; in-app/SMTP/webhook adapters; Digests/Alerts UI; `generate_digest`/`dismiss_signal` HITL tools; `digests`/`alerts` namespaces.
**Uses:** BullMQ (proven in v4.0), Resend/on-prem SMTP.

### Phase 71: Analytic Graph (feature + substrate)

**Rationale:** Completes the data layer; pure query-layer over existing relationships.
**Delivers:** `SECURITY INVOKER` clearance-aware analytic RPCs (recursive CTEs) + Network-panel query surface + Cmd+K "Analyze"; `query_graph` tool.

### Phase 72: Agent Platform — Runtime + Retrieval + Reads

**Rationale:** All P69–71 data live; now the agent has real intelligence to read. **Option-C thin-slice spike first** (3–4 days, throwaway) to validate the AG-UI SSE loop + settle the chat-shell choice, then converge to Mastra/Option A.
**Delivers:** `agent-runtime` workspace (port 4100); vLLM + Gemma 4 12B + TEI stood up; re-embed to bge-m3 1024 halfvec; `rag_chunks` + hybrid+rerank RPC (`SECURITY INVOKER`); JWT-bound read tools; RTL/token copilot surface (Cmd+K Ask + per-dossier in-context); `agent-ui` namespace.
**Implements:** JWT keystone + hybrid RAG.

### Phase 73: Agent Platform — Writes + Generative UI

**Rationale:** Reads proven; now let the copilot drive dossiers safely.
**Delivers:** write tools (`create_work_item`, `dismiss_signal`, `publish_digest`, `generate_brief`) via `requireApproval` + `renderAndWaitForResponse`, committed under the user JWT; generative UI rendering P69–71 components inline; `STATE_DELTA` → TanStack Query cache sync.

### Phase 74: Eval Gate + AnythingLLM Retirement

**Rationale:** Lock quality; remove the legacy AI path last.
**Delivers:** three CI vitest rubrics — briefing quality (EN+AR ≥0.80), correlation (precision ≥0.75 / recall ≥0.70), Arabic register (≥0.75) — against a pre-seeded staging dataset (never production data); model-swap CI test; decommission AnythingLLM feature-flag by feature-flag.

### Phase Ordering Rationale

- **Remediation-first:** Phase 68 fixes the clearance/embedding/service-role foundations all later RLS + retrieval depend on.
- **Data-layer-first:** a copilot over a stub digest is a demo; over a real signal/digest/graph model it's the product. 69–71 each ship feature UI + agent tool + clearance-RLS together (resilience: value without the AI).
- **Parallel infra track:** model/TEI/observability has no data dependency — stand it up from Phase 68 so it's ready by Phase 72.
- **Eval last:** rubrics gate regressions once the surfaces exist; AnythingLLM retires only after Mastra tools cover its jobs.

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 68:** clearance-scale migration backward-compat matrix; pgvector `extversion` verification on staging.
- **Phase 70:** digest cron timing + subscriber deprovisioning + concurrent delivery.
- **Phase 71:** analytic RPC performance at scale (recursive CTEs on 50K+ relationships; HNSW iterative-scan tuning if RLS post-filter collapses recall).
- **Phase 72:** Option-C spike design (thin-slice AG-UI + Ollama bridge); re-embed batching strategy.
- **Phase 73:** RTL streaming-text rendering (buffer sentences vs char-by-char; CSS isolation).
- **Phase 74:** eval ground-truth curation (≈50 briefing samples EN/AR, 30 correlation pairs, 20 Arabic diplomatic queries w/ reference responses).

Phases with well-documented patterns (lighter research):

- P69 triage (keyboard nav = Phase 43 QA pattern); P70 channel adapters + BullMQ (v4.0); P71 recursive CTEs + `SECURITY INVOKER` edge-fn idiom; P72 Cmd+K extension + AG-UI `STATE_DELTA`; P73 Mastra `suspend`/`resume`/`renderAndWaitForResponse`; P74 Vitest + `@mastra/evals`.

## Confidence Assessment

| Area         | Confidence | Notes                                                                                                                 |
| ------------ | ---------- | --------------------------------------------------------------------------------------------------------------------- |
| Stack        | HIGH       | Versions verified on npm + GitHub + registries 2026-06-13; pgvector staging version needs a query                     |
| Features     | HIGH       | Grounded in approved spec + diplomatic-ops domain; table-stakes vs differentiators clear                              |
| Architecture | HIGH       | Three remediation items verified by repo inspection (exact files/lines); JWT keystone matches existing edge-fn idioms |
| Pitfalls     | HIGH       | All critical pitfalls verified against the live codebase                                                              |

**Overall confidence:** HIGH

### Gaps to Address

- **Actual GPU model/VRAM** on the target deployment (affects Gemma 4 12B sizing; may promote a 27–32B Arabic model) — confirm before Phase 72.
- **Approved external endpoints** for webhook/Teams delivery — confirm with customer before Phase 70.
- **Exact pgvector version on staging** — query before Phase 68 migration.
- **Analyst digest-frequency expectations** (daily/weekly/monthly presets) — confirm during Phase 70 planning.

## Sources

### Primary (HIGH confidence)

- Context7: Mastra, CopilotKit, vLLM, TEI, pgvector, Langfuse, Phoenix — versions + integration APIs (2026-06-13)
- Repo inspection: `chat-assistant.ts`, `search-semantic/index.ts`, clearance migrations, `src/i18n/index.ts`, ~20 edge-fn JWT idioms
- `docs/superpowers/specs/2026-06-13-v7.0-intelligence-engine-design.md` (approved decisions)
- `docs/research/v7.0-ai-architecture-research-2026-06-13.md` (authoritative architecture analysis)

### Secondary (MEDIUM confidence)

- Diplomatic-ops domain inference for signal lifecycle + digest cadence (validate with an analyst during P69–70 planning)

---

_Research completed: 2026-06-13_
_Ready for roadmap: yes_
