# Phase 72: Agent Platform — Runtime, Retrieval, Reads - Context

**Gathered:** 2026-06-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Stand up the on-prem **copilot** for real: a new `agent-runtime` Turborepo workspace
(Mastra + CopilotKit/AG-UI over SSE) that **reads** Phases 69–71 data (signals,
digests, graph, dossiers) under the Phase 68 **JWT keystone**, with **hybrid-RAG**
retrieval over a single clearance-gated chunks store and a **bilingual, token-bound
conversational surface**. Covers **AGENT-01..06** + **INFRA-01..03**.

In scope:

1. **`agent-runtime` workspace + serving substrate** — new 4th Turborepo workspace
   (alongside `backend`/`frontend`/`shared`), Mastra runtime + CopilotKit runtime
   emitting AG-UI/SSE, its own port + `docker-compose.prod` service; **vLLM serving
   Gemma 4 12B** (eval-gated, swappable) + **TEI** (bge-m3 + bge-reranker-v2-m3) stood
   up (INFRA-01..03). (D-01, D-02)
2. **Option-C thin-slice spike FIRST** — a throwaway slice validating the AG-UI SSE
   loop + RTL streaming + one token-bound tool render, then rebuild on Mastra + vLLM
   (converge to Option A in-phase). (D-03)
3. **Hybrid-RAG retrieval** — one chunks store re-embedded to **bge-m3 1024-dim
   halfvec**; hybrid (HNSW + tsvector/pg_trgm via RRF) + local bge-reranker-v2-m3
   rerank; `SECURITY INVOKER` + clearance-RLS (AGENT-04, AGENT-05).
4. **Conversational surface** — a **responsive app-wide copilot drawer** (desktop
   slide-over + mobile sheet), Cmd+K / topbar-FAB as the second entry, **context-aware**
   to the current dossier; bilingual EN/AR + RTL + token-bound (AGENT-01, AGENT-06).
5. **Read tools under the JWT keystone** — `hybrid_rag_search` (new) + the
   already-built P69/P71 tools wrapped (`read_signals`, `query_graph`) + dossier/
   work-item lookups + `generate_digest` **preview-only** (AGENT-02, AGENT-03).
6. **Keystone hardening** — JWT-propagation per-request Supabase client in every read
   tool; **retire `supabaseAdmin`** in `chat-assistant.ts` AND audit/retire it in
   `brief-generator.ts` + `intake-linker.ts` (D-10, folds the P68 follow-up todo).
7. **Persistent conversations** — user-private Mastra threads via `@mastra/pg` (D-08).

Out of scope (deferred — do NOT pull forward):

- **Writes + HITL confirmation cards + generative-UI dossier cards** → **Phase 73**.
  P72 is **reads-only**. `generate_digest` ships **preview-only** (no publish).
- **Bilingual eval rubrics wired as a CI gate** + **full AnythingLLM decommission** →
  **Phase 74**. P72 only retires AnythingLLM from the copilot's critical path (wrap as
  MCP during migration if needed); the CI eval gate + final teardown are P74.
- **ALLaM/SDAIA wiring** — not in v1 (best-Arabic-on-prem sufficient; eval harness is
  the Arabic guarantee). (D-02)
- **External `feed` ingestion / untrusted-content quarantine** → **v7.1** (FEED-01/02).
- **Repurposing the `word-assistant` drafting tool** — left untouched this phase (D-04).

</domain>

<decisions>
## Implementation Decisions

### Runtime & serving

- **D-01: New `agent-runtime` Turborepo workspace.** A 4th workspace alongside
  `backend`/`frontend`/`shared`: Express + `@copilotkit/runtime` hosting the Mastra
  agent, terminating AG-UI over SSE, calling the local model over the OpenAI-compatible
  `/v1`, exposing dossier ops as **narrow, Zod-typed, least-privilege** tools (never a
  generic `execute_sql`). Own container in `deploy/docker-compose.prod.yml` on a
  **distinct port** (avoid 5000/AirPlay), `turbo.json` pipeline entry, CORS via the
  `ALLOWED_ORIGINS` **secret** (not hardcoded — prior edge-fn lesson). **Lift, don't
  rewrite** the existing `backend/src/ai/mastra-config.ts` + `llm-router.ts`. (Locked
  architecture — Option A; RF-10.)
- **D-02: Serving = vLLM + Gemma 4 12B; no ALLaM in v1.** **A single 16–24GB GPU is
  confirmed available** (user), so the spec lock holds exactly: **Gemma 4 12B** (QAT/FP8)
  on **vLLM** (OpenAI-compatible `/v1`) is the brain, **eval-gated + config-swappable**;
  **llama.cpp/Ollama** for dev/spike (identical API). **ALLaM is NOT wired** — "best
  Arabic capability, fully on-prem" is sufficient for the customer; visibly using the
  national model is **not** a procurement requirement. The **bilingual eval harness
  (P68/P74)** is the Arabic-quality guarantee, not the model. (Resolves research §6 #1/#2
  - STATE GPU todo; quantization/concurrency = planner/researcher.)
- **D-03: Option-C spike first = throwaway, then rebuild.** Build a minimal **custom
  AI-SDK + Ollama** slice that proves the **AG-UI SSE loop + RTL streaming + one
  token-bound tool-call render**, then **rebuild on Mastra + vLLM**. Maximum de-risk
  before the GPU/re-embed land; matches the spec's "throwaway first slice." (Spike-first
  itself is a locked spec decision; this fixes its form.)

### Conversational surface

- **D-04: Responsive app-wide copilot drawer.** The primary surface is a **single,
  responsive copilot drawer**, chosen on the user's criterion of _usability + friendliness
  on BOTH web and mobile_:
  - **Desktop (1280–1400px):** right-side **slide-over** drawer (mirrors the existing
    720px dossier drawer) — in-context assist on any dossier/network/intelligence screen.
  - **Mobile (≤767px):** the same copilot collapses to a **full-screen / bottom sheet**
    (mirrors the existing `RelationshipSidebar → BottomSheet` pattern), launched from a
    **topbar/FAB** copilot button.
  - **Single component, one data path**, RTL-aware + token-bound; only the container
    chrome differs per breakpoint. **Reads-only P72 fits mobile's read-only constraint.**
    `word-assistant` (the drafting tool) is **untouched**. Second entry = **Cmd+K**
    (desktop) / **topbar-FAB** (mobile) (AGENT-01 SC#1 "primary surface AND Cmd+K").
- **D-05: Context-aware in v1.** Opening the drawer on a dossier passes that dossier
  (+ type) as **readable context** (CopilotKit `useCopilotReadable`-style); answers and
  suggestions scope to it; Cmd+K launched from a dossier **pre-fills** the context.
  Matches "everything starts with a dossier" + spec §4.2 in-context assist.

### Retrieval & reads

- **D-06: v1 re-embed corpus = core intelligence text + documents/OCR.** Chunk + embed
  into the single **bge-m3 1024-dim halfvec** store: \*\*dossiers (8 types) + signals (P69)
  - briefs / after-action records + positions + uploaded documents/attachments (OCR'd
    text)\*\*. The richest-substance option — depends on the OCR pipeline output being
    queryable (RF-2). (Graph relationships are served by the `query_graph` RPC, not RAG;
    digests are deterministic rollups.)
- **D-07: v1 read-tool roster = wrap all three + RAG.** Expose: **`hybrid_rag_search`**
  (new) + **`read_signals`** (wrap the P69 RPC) + **`query_graph`** (wrap the P71 RPC) +
  **dossier/work-item lookups** (read) + **`generate_digest` PREVIEW-ONLY**. The planner
  MUST expose only the read/preview path of `generate_digest` — **its publish is a write
  and stays in P73**. All P69/P71 tools are already built + direct-invocation tested, so
  wrapping is cheap (RF-8).

### Memory, shell & authz

- **D-08: Persistent, user-private conversation threads.** Conversations are **saved and
  resumable**, stored via **`@mastra/pg`** on the same Supabase Postgres, with **RLS =
  user owns own threads only**. Audit trail = Langfuse traces + the stored threads. (RF-6.)
- **D-09: CopilotKit-first — "master CopilotKit."** Adopt CopilotKit end-to-end (runtime
  - hooks + generative-UI + HITL) **and render the conversational shell through CopilotKit's
    own customization** (`--copilot-kit-*` CSS vars + headless slots + render-prop overrides)
    rather than routing around it with pure `assistant-ui`. **The Option-C spike MUST prove
    two things before this locks** (RF-4):
  1. **RTL + token fidelity** — CopilotKit components themed to \*\*token-only + `dir="rtl"`
     - Tajawal\*\*, no raw hex, no card shadows, to the CLAUDE.md design bar.
  2. **Air-gap** — the **self-hosted `@copilotkit/runtime`** runs fully on-prem with **no
     Copilot Cloud key / zero egress**.
     **Documented fallback** if either proves infeasible: the headless `assistant-ui` /
     custom `@ag-ui/client` shell (CopilotKit runtime/hooks/HITL stay either way).
- **D-10: Retire `supabaseAdmin` broadly — fold + audit now.** Beyond the locked
  `chat-assistant.ts` retirement, **also audit `brief-generator.ts` + `intake-linker.ts`**:
  move **user-triggered** paths to the JWT-scoped per-request client; where a path is
  **genuinely background/cron**, document **explicit app-layer authz** (the keystone
  carve-out). Closes the P68 follow-up todo while the JWT idiom is fresh. (RF-7.)

### Standing research directive

- **D-11: OSS-survey mandate.** Before planning, the researcher MUST actively scout
  **open-source alternatives/libraries that make the copilot more functional and easier
  to use** (chat UX, streaming, markdown/citation rendering, generative-UI patterns,
  RAG/rerank/eval tooling, AG-UI clients) and prefer battle-tested OSS over hand-rolled
  (echoes CLAUDE.md "Research & Reuse first"). **Guardrail:** anything adopted must hold
  the hard constraints — **fully on-prem / no egress / no Cloud key**, **permissively
  licensed** (Apache/MIT; Gemma's license is the one accepted exception), and **themable
  to the token-only + RTL/Tajawal bar**. Surface candidates **with trade-offs** before
  the planner commits. (RF-9.)

### Claude's Discretion

- **Spike build form** (D-03) — chose throwaway AI-SDK+Ollama then rebuild (researcher
  may confirm vs graduate-in-place).
- **vLLM concurrency targets, FP8/AWQ quantization, eval-challenger bench** (Qwen3.5 /
  Fanar-2 kept available behind the same `/v1`) — planner/researcher.
- **Chunking strategy, top-k after rerank, RRF `k`, iterative-scan tuning, coalescing**
  = planner/researcher (RF-3).
- **agent-runtime port number, turbo/docker wiring specifics** (D-01) = planner (RF-10).
- **Generative-UI depth** — P72 renders answers + citations token-bound; rich inline
  dossier cards are the P73 generative-UI deliverable.

### Folded Todos

- **`p68-followup-supabaseadmin-background-agents.md`** — "Audit `supabaseAdmin` in
  `brief-generator.ts` + `intake-linker.ts` (REMED-03 follow-up)." Reviewed-not-folded in
  P69/P70/P71 with an explicit "revisit in P72 when the agent runtime lands." **Folded
  into D-10** — this is that phase; the JWT-scoped-client idiom is being built here, so the
  two background agents are audited in the same pass.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design & requirements (read first)

- `docs/superpowers/specs/2026-06-13-v7.0-intelligence-engine-design.md` — **the decision
  record.** §2 locked decisions (Option A; CopilotKit; Mastra; vLLM; **Gemma 4 12B brain**;
  pgvector hybrid; **JWT keystone**; Option-C spike first), §3 remediation (retire
  `supabaseAdmin`), §4 roadmap (P72 row), §5 cross-cutting guarantees, §7 risk register
  (GPU, CopilotKit air-gap spike). **Supersedes the research doc where they differ** (the
  research doc's Fanar-27B brain is overridden by the spec's Gemma-12B single-GPU pick).
- `docs/research/v7.0-ai-architecture-research-2026-06-13.md` — the authoritative
  architecture analysis. **§2.1** AG-UI + headless client; **§2.2** Mastra; **§2.3**
  serving/models; **§2.4** pgvector hybrid + re-embed to bge-m3 1024; **§2.5** the
  JWT-propagation keystone (the per-request client snippet + the exact `supabaseAdmin`
  line numbers in `chat-assistant.ts`); **§4** integration plan; **§6** open product calls.
- `.planning/REQUIREMENTS.md` — **AGENT-01..06, INFRA-01..03** + "## Cross-Cutting
  Guarantees" (security keystone, bilingual/RTL, on-prem fidelity, GSD discipline).
- `.planning/ROADMAP.md` → "### Phase 72: Agent Platform — Runtime, Retrieval, Reads" —
  goal + 5 success criteria + depends-on (the parallel vLLM/TEI infra track must land).
- `.planning/phases/68-ai-foundations-remediation/68-CONTEXT.md` — canonical clearance
  model (1–4, `profiles.clearance_level`), INVOKER-only rule, indistinguishable-empty
  (D-09), the embedding-integrity + `supabaseAdmin`-retirement remediation precedent.
- `.planning/phases/69-signals/69-CONTEXT.md`,
  `.planning/phases/70-digests-alerts/70-CONTEXT.md`,
  `.planning/phases/71-analytic-graph/71-CONTEXT.md` — the **agent-tool-now / agent-
  wraps-in-P72** precedent + the exact `read_signals` / `generate_digest` / `query_graph`
  RPC contracts P72 wraps.

### Existing AI / agent code (the lift-don't-rewrite surface)

- `backend/src/ai/mastra-config.ts` — `defineAgent` / `createAgentTools` (`@mastra/core`
  ^1.36.0 already a dep) — **lift into `agent-runtime`**.
- `backend/src/ai/llm-router.ts`, `backend/src/ai/config.ts` — model routing + the
  `vllm`/`ollama`/`anythingllm` provider wiring (the OpenAI-compatible swap point).
- `backend/src/ai/agents/chat-assistant.ts` — the interactive assistant using
  **`supabaseAdmin` across all reads (research §2.5 lists the lines)** → retire to the
  JWT-scoped client; has a `language?: 'en'|'ar'` field to thread through.
- `backend/src/ai/agents/brief-generator.ts`, `backend/src/ai/agents/intake-linker.ts`
  — the two background agents to audit for `supabaseAdmin` (D-10 / RF-7).
- `backend/src/ai/embeddings-service.ts` — local ONNX `Xenova/bge-m3` (config default 1024) — the embedder for the re-embed (D-06 / RF-2).

### Retrieval / RAG / clearance (RF-2/RF-3)

- `supabase/functions/search-semantic/index.ts` — **the pad/truncate-to-1536 corruption
  site** (remediated in P68); confirm it no longer corrupts vectors; the new hybrid RPC
  supersedes this read path.
- `supabase/migrations/20250129000_setup_pgvector.sql`,
  `supabase/migrations/20250129006_create_ai_tables.sql`,
  `supabase/migrations/20251004011_create_search_functions.sql` — existing pgvector +
  AI-table + semantic-search groundwork. **Reconcile the chunks-store target:** spec names
  `rag_chunks`; P68 (REMED-04) left **`ai_embeddings` at `vector(1024)`, 0 rows** as the
  write target — decide one store (single store, `SECURITY INVOKER`, denormalized
  `sensitivity_level` synced from parent by trigger, clearance-RLS). (RF-2.)
- `supabase/migrations/20251022000009_update_polymorphic_refs.sql` (≈L102/L119) —
  canonical clearance comparison `sensitivity_level <= (SELECT clearance_level FROM
profiles WHERE user_id = auth.uid())` — apply to the chunks-store RLS. **`profiles` has
  NO `id` column** — use `user_id = auth.uid()` (P69 EXEC landmine; carried lock).

### Conversational surface + i18n (D-04/D-05)

- `frontend/src/pages/word-assistant/WordAssistantPage.tsx` — existing chat-style drafting
  assistant (Message/role/suggested-prompt scaffold, shadcn-styled, calls Supabase
  directly). **Left untouched**; referenced as the precedent chat scaffold only.
- `frontend/src/components/keyboard-shortcuts/CommandPalette.tsx` — Cmd+K palette
  (extended for "Analyze:" in P71) — add the copilot entry + context pre-fill (D-05).
- The **720px dossier drawer** + **`RelationshipSidebar → BottomSheet`** responsive
  patterns — the desktop slide-over + mobile sheet templates for the copilot drawer (D-04).
- `frontend/src/i18n/index.ts` — **static-bundled** namespace registry; register any new
  copilot namespace (unregistered → silent English fallback; P68 CI guard). Language
  persists under `localStorage['id.locale']`.
- `frontend/src/routes/_protected/*` — mount the copilot inside the `_protected` tree
  (authenticated users only); provider carries `{ authorization: 'Bearer '+token, user_id,
language: i18n.language }` (research §4.2).

### Deploy / workspace wiring (RF-10)

- `pnpm-workspace.yaml` (currently `backend`/`frontend`/`shared`) + `turbo.json` — add
  `agent-runtime`.
- `deploy/docker-compose.prod.yml` — new `agent-runtime` + vLLM + TEI services; distinct
  port; `ALLOWED_ORIGINS` secret.
- `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STACK.md`,
  `.planning/codebase/INTEGRATIONS.md` — backend layering, `@mastra/core` confirmation,
  Redis/BullMQ/email wiring (available; reconcile dated notes vs live).

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`@mastra/core` ^1.36.0** already a backend dep + `mastra-config.ts` / `llm-router.ts`
  / `config.ts` (vllm/ollama/anythingllm providers) — **lift into `agent-runtime`**, don't
  rewrite (D-01).
- **The JWT-scoped per-request Supabase-client idiom** — already proven in ~20 edge fns
  (`positions-versions-compare`, `attachments-list`, `interaction-notes-list`) + every
  P69/P70/P71 edge fn (`getUser(token)` + forwarded `Authorization`); the keystone for
  every read tool (D-01, RF-5).
- **Three already-built + direct-invocation-tested agent-tool RPCs** — `read_signals`
  (P69), `generate_digest` (P70, preview path), `query_graph` (P71) — P72 **wraps** them
  (D-07).
- **`Xenova/bge-m3` ONNX embedder** (`embeddings-service.ts`, default 1024) — the re-embed
  embedder (D-06).
- **720px dossier drawer + `RelationshipSidebar → BottomSheet`** responsive idioms — the
  copilot drawer's desktop/mobile chrome (D-04).
- **`CommandPalette.tsx`** — Cmd+K, already extended for parameterized context-aware
  entries in P71 — add the copilot entry (D-05).

### Established Patterns

- **JWT keystone** — every interactive agent DB op runs under the caller's JWT so RLS
  enforces `sensitivity_level <= profiles.clearance_level` automatically; **service-role
  only on cron/no-user paths with explicit app-layer authz**. Never a generic
  `execute_sql`; tools are narrow + Zod-typed + least-privilege.
- **Retrieval RPCs are `SECURITY INVOKER`** (drop the DEFINER retrieval pattern — today's
  leak); **RLS runs BEFORE rerank** (the cross-encoder can't enforce clearance).
- **bge-m3 1024-dim halfvec**, hybrid (HNSW `halfvec_cosine_ops` + `ts_rank_cd` on the
  EN/AR GIN indexes + optional `pg_trgm`) fused by **RRF (k≈60)**, pgvector 0.8 iterative
  scans so the RLS post-filter doesn't collapse recall; rerank top ~50 → keep ~8–10 via
  bge-reranker-v2-m3 (TEI).
- **Indistinguishable-empty** on clearance denial — never a "filtered by clearance"
  message; a lower-clearance caller must not learn above-clearance content exists.
  (P71 memory: forbidden substring `clearance`/`filtered`/`restricted` ANYWHERE in a gated
  payload, incl. JSON keys.)
- **Migrations via Supabase MCP** to staging `zkrcjzdemdmwhearhfgg`; **live UAT**
  seed→observe→restore EN+AR; **CDP `Network.setBlockedURLs`** forced-error for RLS-denial
  (empty 200s — assert `role="alert"`/empty-state + reduced counts, not HTTP status).
- **Static-bundled i18n** + **design tokens + RTL/Tajawal** (no shadcn defaults, no raw
  hex, no card shadows; desktop-primary analyst workstation 1280–1400px).

### Integration Points

- **New `agent-runtime` workspace** ← `pnpm-workspace.yaml` + `turbo.json` +
  `docker-compose.prod` (D-01, RF-10).
- **Copilot drawer** ← `_protected` route tree; AG-UI SSE client → token-bound components
  (D-04); Cmd+K via `CommandPalette.tsx` (D-05).
- **Read tools** ← P69/P71 RPCs + new `hybrid_rag_search` RPC over the chunks store +
  dossier/work-item lookups, all via the JWT-scoped client (D-07).
- **Chunks store** ← re-embed job over dossiers/signals/briefs/after-actions/positions/
  documents (D-06); single store, INVOKER + clearance-RLS (RF-2).
- **Mastra threads** ← `@mastra/pg` on the same Postgres, user-private RLS (D-08, RF-6).
- **vLLM (Gemma 4 12B) + TEI (bge-m3 + reranker)** ← OpenAI-compatible `/v1` + TEI HTTP
  (INFRA-01/02; parallel infra track).

</code_context>

<specifics>
## Specific Ideas

- **"Master CopilotKit"** — the user's explicit direction: commit to CopilotKit as the
  framework and master its theming/runtime/hooks/HITL rather than minimizing it; prove
  RTL/token fidelity + air-gap in the spike (D-09, RF-4).
- **Usable + friendly on BOTH web and mobile** — the decision criterion for the
  conversational surface: one responsive drawer (desktop slide-over + mobile sheet),
  reads-only P72 aligning with the read-only mobile surface (D-04).
- **"Everything starts with a dossier"** — the copilot is context-aware to the current
  dossier from the first turn (D-05).
- **Shop the OSS ecosystem** — actively prefer battle-tested open-source for any copilot
  functionality/UX gain, within the on-prem/permissive/token-RTL guardrails (D-11).
- **Verification bar** (milestone cross-cutting guarantee): a cleared user converses with
  the copilot from the drawer AND Cmd+K and gets answers from gated data (signals/digests/
  graph/dossiers/RAG) under their JWT; a **low-clearance account provably receives reduced
  results** with **zero above-clearance content** (read tools + RAG, indistinguishable-
  empty); replies render as **token-bound bilingual cards with correct RTL in Arabic**;
  `array_length(embedding,1) = 1024` for all chunk rows + the store is `SECURITY INVOKER`
  - RLS; the `agent-runtime` smoke-tests a chat turn end-to-end on staging — all live, EN+AR.

</specifics>

<deferred>
## Deferred Ideas

- **Writes + HITL `renderAndWaitForResponse` confirmation cards + generative-UI dossier
  cards** (UniversalDossierCard/signal cards inline + deep-links) → **Phase 73**.
- **`generate_digest` publish path** → Phase 73 (P72 ships preview-only).
- **Bilingual eval rubrics as a CI gate + full AnythingLLM decommission** → **Phase 74**.
- **ALLaM/SDAIA secondary** — declined for v1; revisit only if the customer makes the
  national model a procurement requirement (D-02).
- **Larger Arabic brain (27–32B: Fanar-2 / Qwen3.5)** — gated on a bigger GPU landing;
  the model is a config-level eval-gated swap (research §6 #1, risk register).
- **Multi-GPU / horizontal serving scale-out** → v7.1 (SCALE-01).
- **External feed ingestion + untrusted-content quarantine / dual-LLM rigor** → v7.1
  (FEED-01/02).
- **Repurposing `word-assistant`** into the copilot, or folding its drafting actions in →
  future (left untouched this phase).

### Reviewed Todos (not folded)

None — the one matched todo (`p68-followup-supabaseadmin-background-agents.md`) was
**folded** into D-10 (the agent runtime lands this phase, which is exactly when that
follow-up was scheduled to be revisited).

</deferred>

---

_Phase: 72-Agent Platform — Runtime, Retrieval, Reads_
_Context gathered: 2026-06-18_
