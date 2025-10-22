# AI Integration Final Plan

Last updated: 2025-10-16

## Purpose
Establish a production-ready, privacy-first AI integration across web and mobile with a single LLM router, unified embeddings (BGE‑M3, 1024‑dim), observability, and an Intake Entity Linking agent with human-in-the-loop approvals.

## Scope
- Backend: TypeScript/Express AI core modules, agents, SSE/WS endpoints
- Database: Observability tables, policies, pricing table, intake linking artifacts
- Frontend: AI chat dock (web) with streaming and tool visualization
- Mobile: WebSocket streaming + offline guardrails
- Operations: Re-embedding maintenance window (1024-d), index rebuild, rollbacks
- Security/Privacy: Org-level routing policy, data classification, Arabic model routing

---

## Final Decisions (Confirmed)
- Agent Runtime: Mastra for Phases 1–3; revisit LangGraph if needed later
- LLM Gateway: In-code `llmRouter` now; optional OpenAI-compatible proxy later
- Embeddings: BGE‑M3 (1024‑dim) everywhere; re-embed legacy vectors
- Entity Naming: `intake_tickets`, plus `ai_entity_link_proposals`, `intake_entity_links`

---

## High-Level Architecture
- `llmRouter` (backend) is the single entry for all AI calls (chat, tools, embeddings fallback)
- Unified `embeddingsService` (BGE‑M3) powers vector search and RAG
- Mastra agents orchestrate tasks (first: Intake Entity Linking)
- Web uses SSE for streaming; mobile uses WebSocket (WS) for streaming
- Observability captures per-run metrics, token usage, costs, and tool calls; daily rollups feed admin dashboards
- Org policies and data classification enforce privacy-first routing (cloud vs private LLM)

---

## Deliverables & File Layout
- Backend AI core:
  - `backend/src/ai/llm-router.ts`
  - `backend/src/ai/embeddings-service.ts`
  - `backend/src/ai/agents/intake-linker.ts`
- API endpoints:
  - `backend/src/api/ai/chat.ts` (SSE)
  - `backend/src/api/ai/ws-chat.ts` (WS)
  - `backend/src/api/ai/intake-linking.ts` (propose/apply)
- Refactors:
  - `backend/src/services/vector.service.ts` (use BGE‑M3)
  - `backend/src/services/semantic-search.service.ts` (use BGE‑M3)
  - Deprecate `anythingllm.*` via feature flag
- Migrations:
  - `supabase/migrations/20250118000_ai_observability.sql`
  - `supabase/migrations/20250118001_entity_link_proposals.sql`
  - `supabase/migrations/20250118002_ai_model_pricing.sql` (optional but recommended)
- Maintenance:
  - `scripts/reembed-1024.ts` (batch re-embed with progress tracking)

---

## Database Changes

### Observability & Policies
- Tables: `organization_llm_policies`, `ai_runs`, `ai_messages`, `ai_tool_calls`
- Indices:
  - `idx_ai_runs_org_month` on `(organization_id, created_at DESC)` where `status='completed'` for spend checks
- Policies (RLS):
  - Use `organization_members` (active = `left_at IS NULL`) for org visibility and admin roles
  - Allow users to see their own runs
  - Allow `service_role` to write all observability tables
- Helper:
  - `get_monthly_ai_spend(org_id UUID)` for cap enforcement
- View:
  - `ai_usage_summary` (daily org usage overview for admins)

Example policy (users see own runs; admins see org):

```
CREATE POLICY "Users can view AI runs"
ON ai_runs FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = ai_runs.organization_id
      AND om.user_id = auth.uid()
      AND om.left_at IS NULL
      AND om.role IN ('admin','owner')
  )
);
```

### Intake Linking Storage
- `ai_entity_link_proposals` (FK to `intake_tickets(id)`)
- `intake_entity_links` (FK to `intake_tickets(id)`, `entity_type` in ['dossier','brief','position'])
- RLS mirrors above (ticket owner and org admins; service_role writes)

### Model Pricing (Optional)
- `ai_model_pricing(provider, model, input_price_per_1m, output_price_per_1m, effective_date)`
- Allows updating pricing without code deploy; `llmRouter` consults this first, defaults if absent

---

## Backend Components

### LLM Router (`backend/src/ai/llm-router.ts`)
- Responsibilities:
  - Resolve org policy and data classification → provider/model
  - Arabic detection → route to Arabic model if configured
  - Enforce monthly spend caps
  - Call provider via AI SDK; record `ai_runs`/`ai_messages`/`ai_tool_calls`
  - Cost calculation from `ai_model_pricing` with cache
- Privacy routing:
  - `secret` → private LLM only
  - `confidential` → private if org disallows cloud, else default
  - `public/internal` → org default
- Arabic detection:
  - Simple heuristic (Unicode range) for `language = 'ar'`; if org’s policy has arabicModel (e.g., `aya-101` via vLLM), route there when privacy allows

### Embeddings Service (`backend/src/ai/embeddings-service.ts`)
- Local: `BAAI/bge-m3` via `@xenova/transformers` (1024‑d, normalized)
- Fallback: OpenAI `text-embedding-3-small` with `dimensions: 1024`
- Throws on dimension mismatch with clear error
- Provides `embed(texts)` and `semanticSearch({ table, query, ... })` that calls Supabase RPCs

### Intake Linking Agent (`backend/src/ai/agents/intake-linker.ts`)
- Mastra agent:
  - Tools: `search_similar_entities` (semantic/hybrid search), `get_entity_details`
  - Output JSON: `suggested_links[]` with `confidence` and `justification`, plus `summary`
- Flows:
  - Propose: stores suggestions in `ai_entity_link_proposals` (pending_approval)
  - Apply: creates `intake_entity_links` in a transaction when human approves

### APIs
- SSE Chat (`backend/src/api/ai/chat.ts`):
  - `POST /api/ai/chat` with streaming via AI SDK; tools for search and propose-links
- WS Chat (`backend/src/api/ai/ws-chat.ts`):
  - Bi‑directional streaming for mobile clients
- Entity Linking (`backend/src/api/ai/intake-linking.ts`):
  - `POST /api/ai/intake/:id/propose-links` → returns proposalId + suggestions
  - `POST /api/ai/proposals/:id/apply` → applies approved links

---

## Web & Mobile Integration

### Web
- Add a chat dock powered by SSE (AI SDK). Show:
  - Streaming tokens
  - Tool call results (cards)
  - “Approve & Apply” button for link proposals

### Mobile
- Use WebSocket streaming (RN fetch streaming is unreliable)
- Offline guardrail:
  - Queue intents when offline and reconcile later
  - Basic “retrieval + template” response instead of on-device LLM initially (ExecuTorch later if needed)

---

## Maintenance Window: Re‑Embed to 1024‑dim

### Pre-Checks
- Count vectors per table and vectors with dims ≠ 1024
- Record current vector index names

### Zero-Downtime Index Strategy
1) Create new 1024‑dim indexes concurrently:

```
CREATE INDEX CONCURRENTLY idx_<table>_embeddings_1024_ivfflat
ON <table>_embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

2) Run backfill; validate vector search correctness

3) Drop old index concurrently in a separate transaction:

```
DROP INDEX CONCURRENTLY idx_<table>_embeddings_old_ivfflat;
```

### Re-Embed Script (`scripts/reembed-1024.ts`)
- CLI: `--table`, `--id-col`, `--text-columns`, `--batch-size`, `--dry-run`
- Resume from checkpoint via Redis key `reembed:checkpoint`
- Progress struct written to Redis (24h TTL), plus admin status endpoint:

```
interface ReEmbedProgress {
  startTime: Date;
  totalRows: number;
  processedRows: number;
  failedRows: number;
  estimatedCompletion: Date;
  avgTimePerBatch: number;
  lastCheckpoint: string | null;
}
```

- Endpoint:

```
GET /admin/reembed-status  (admin only)
→ returns JSON with progress
```

- Cost/time estimate printed in dry-run if OpenAI fallback is used
- Backoff on rate limits; validates sample cosine distances post-batch

### Rollback
- Feature-flag search to keyword-only
- Keep old index until validation passes
- Re-run last successful checkpoint on retry

---

## Observability & Admin

### Metrics (captured in `ai_runs`)
- Tokens (prompt/completion), total cost
- Latency ms, status, provider/model, feature
- Tool timings (in `ai_tool_calls`)
- Link proposal outcomes

### Spend & SLOs
- `get_monthly_ai_spend(org_id)` for cap checks
- p95 latency budgets per feature (chat vs propose-links)

### Dashboard View
- `ai_usage_summary` (daily aggregation by org/provider/model/feature)
- Grant SELECT to `authenticated`; RLS ensures visibility only for org members with appropriate role

---

## Security & Privacy
- Data classification enforced at router:
  - `secret` → private only
  - `confidential` → follow org policy; redact PII before any cloud route
- Keys in secrets manager; DB holds only encrypted references
- RLS throughout (observability + intake artifacts)
- Moderation and PII scrubbing (pre-index) as policy modules

---

## Testing Strategy
- Unit: `llm-router` (policy selection, pricing lookup), `embeddings-service` (dim checks), search services (stubbed vectors)
- Integration: propose→approve→apply flow; vector + hybrid search sanity; SSE/WS streaming paths
- E2E: UI approval of suggested links; citations and “open in dossier” deep links
- Performance: p95 latency under load; token/cost sanity vs pricing table

---

## Phased Rollout

### Phase 0 (2–3 days)
- Add `llm-router`, `embeddings-service` (BGE‑M3)
- Migrations for observability; RLS via `organization_members`
- Feature-flag deprecation of AnythingLLM

### Phase 1 (1 week)
- Intake Entity Linking agent + APIs
- Web SSE chat; tool cards; approval UX
- Initial observability dashboards

### Phase 2 (1 week)
- Mobile WS chat; offline guardrails
- Admin spend caps + alerts

### Phase 3 (1–2 weeks)
- Private LLM route (vLLM/Ollama) as policy
- Arabic model routing (e.g., `aya-101`) per org policy

---

## Risk & Mitigation
- Vector dim mismatch → hard fail with explicit error; maintenance script validates batches
- Cost overruns → monthly cap checks + alerts; pricing table updatable without deploy
- Provider outage → fallback provider and keyword-only search; on-prem route for `secret`
- Streaming regressions on mobile → WS primary; retry policy with exponential backoff

---

## Config Checklist
- `AI_USE_ANYTHINGLLM=false`
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- Provider keys as needed (OpenAI, Anthropic, Google); `VLLM_BASE_URL`/`OLLAMA_BASE_URL` for private
- Redis URL set; admin guard on `/admin/reembed-status`

---

## Acceptance Criteria
- Single router handles all AI calls; observability records every run
- All embeddings 1024‑d; hybrid search returns correct results; indexes rebuilt
- Propose→approve→apply entity links work end-to-end (with audit)
- Web SSE and mobile WS streaming stable; p95 latency within target
- RLS prevents cross‑org data leakage; service role can write observability tables

---

## Next Steps
- Implement Phase 0 deliverables; schedule re‑embedding maintenance window.

