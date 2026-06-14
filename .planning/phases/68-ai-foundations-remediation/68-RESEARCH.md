# Phase 68: AI Foundations Remediation — Research

**Researched:** 2026-06-14
**Domain:** AI clearance enforcement, vector embedding geometry, RLS security, observability infrastructure
**Confidence:** HIGH (all four RF flags closed against live staging `zkrcjzdemdmwhearhfgg`)

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Single integer comparison domain — `sensitivity_level <= clearance_level` on a 1–4 scale. 3 existing content tiers occupy 1–3; level 4 is reserved.
- **D-02:** `profiles.clearance_level` is the single per-user source of truth, independent of RBAC role. Backfill from each user's current role-derived clearance value.
- **D-03:** Migrate via a backward-compat shim — rewrite `get_user_clearance_level()` to read `profiles.clearance_level` and return the canonical 1–4. Existing RLS policies that call it keep working unchanged.
- **D-04:** Backend `clearance-check.ts` middleware stays OUT OF SCOPE — DB RLS is the real enforcement. (Confirmed below: file exists in RBAC middleware, not a standalone file.)
- **D-05:** Land the native-1024 write path in P68. Remove `normalizeEmbedding` pad/truncate; write native 1024-dim vectors (via local `bge-m3` ONNX) into a new 1024 `halfvec` store. Researcher confirms store shape.
- **D-06:** Leave existing corrupted vectors for Phase 72 full re-embed. P68 stops NEW corruption only.
- **D-07:** Interim semantic search quality may degrade to existing full-text/keyword fallback for not-yet-re-embedded content.
- **D-08:** Retire `supabaseAdmin` from `chat-assistant.ts`; assistant reads under caller's JWT.
- **D-09:** When clearance-filtering yields nothing, return indistinguishable generic "no results." Downstream MUST NOT add "filtered by clearance" messaging.
- **D-10:** Repoint legacy `commitments`/`engagements` reads to `aa_commitments`/`engagement_dossiers`.
- **D-11:** Stand up both Langfuse + Phoenix containers in `docker-compose` with OTel/OpenLLMetry export. Minimal depth to trace one end-to-end AI request. Zero telemetry egress.
- **D-12:** i18n-namespace CI guard — fold into the existing required `Lint` context. No new branch-protection context (stays at 8). Researcher handles exact mechanism including array-form `useTranslation([...])` case.

### Claude's Discretion

- D-01 scale alignment (3 content tiers + reserved L4) — chosen, confirmed feasible by live data.
- Embedding store shape (new column vs new table) — researcher's call: **new table** (see RF-4).
- i18n guard mechanism (custom ESLint rule vs lint-invoked script) — researcher's call: **custom ESLint rule** (see REMED-06).

### Deferred Ideas (OUT OF SCOPE)

- Full `bge-m3` re-embed of existing content + TEI production serving → Phase 72.
- Mastra/CopilotKit/vLLM/Gemma/`agent-runtime` workspace → Phase 72+.
- Backend `clearance-check.ts` middleware implementation → later.
- AnythingLLM decommission → Phase 74.
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID       | Description                                                                                                                                                                                              | Research Support                                                                                                                                                                   |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REMED-01 | All clearance checks key off a single canonical clearance scale (`profiles.clearance_level`, 1–4); the prior 1–3 function and low/med/high sensitivity variants reconciled without breaking existing RLS | RF-1, RF-3: live scale confirmed as integer 1–4 on `dossiers`; 5 policies call the old function; shim rewrite is safe                                                              |
| REMED-02 | A non-cleared user cannot retrieve above-clearance content through the existing semantic/vector search                                                                                                   | RF-1, RF-4: `search_entities_semantic` is SECURITY DEFINER (no RLS), must be replaced with SECURITY INVOKER RPC; keyword fallback exists                                           |
| REMED-03 | A non-cleared user cannot retrieve above-clearance content through the existing interactive assistant                                                                                                    | RF-2: `chat-assistant.ts` uses `supabaseAdmin` for ALL 5 DB reads; route is behind `authenticateToken`; JWT is in scope for swap                                                   |
| REMED-04 | Embeddings stored at native dimension with no pad/truncate corruption                                                                                                                                    | RF-4: all live embedding stores are `vector(1536)`; `ai_embeddings` table already has `vector(1024)` but is empty; normalizeEmbedding pad/truncate confirmed at lines 54 and 67–78 |
| REMED-05 | Operator can trace any AI request end-to-end in self-hosted observability (Langfuse + Arize Phoenix via OTel) with zero telemetry egress                                                                 | Mastra OTel base confirmed; docker-compose.prod has no Langfuse/Phoenix yet                                                                                                        |
| REMED-06 | CI fails when a React surface uses an i18n namespace not registered in `src/i18n/index.ts`                                                                                                               | `Lint` job confirmed; custom ESLint rule is feasible; array-form edge case documented                                                                                              |

</phase_requirements>

---

## Summary

Phase 68 is a security remediation with five distinct workstreams. All four research flags are now closed against live staging data. The findings reveal several places where the spec assumed one state but the live database is in a different state — these contradictions must drive the plan.

**The most critical finding (RF-1):** The live `dossiers.sensitivity_level` column is already `integer NOT NULL DEFAULT 1`, populated with values 1, 2, and 3. The string `low/med/high` model described in the design spec does NOT exist on `dossiers` in staging. The one legacy string-CASE policy in migration `20250930005_create_briefs_table.sql` does NOT exist in the live database — the live `briefs` table is a completely different schema from that migration (it has `organization_id/tenant_id/embedding` etc., not `content_en/content_ar/generated_by`). The briefs table has been superseded by a multi-tenant variant. Therefore, there is NO string-CASE policy to normalize — it never reached production. The real work is normalizing the 5 remaining `get_user_clearance_level()` calls (which return 1–3) to the 1–4 scale via the shim.

**The most critical finding (RF-4):** All live embedding tables use `vector(1536)`. The one exception is `ai_embeddings`, which already has `vector(1024)` but contains zero rows. This is the correct target for the native-1024 write path — use `ai_embeddings` directly rather than creating a new table. The `halfvec` type is available (pgvector `0.8.0`). The `search_entities_semantic` RPC is SECURITY DEFINER (bypasses RLS) — this is the primary security hole for REMED-02.

**Primary recommendation:** Prioritize the 3 security-critical remediations in wave order: (1) get_user_clearance_level shim migration + search_entities_semantic replacement with SECURITY INVOKER, (2) supabaseAdmin retirement in chat-assistant.ts, (3) embedding write path + observability + i18n guard. Each wave is independently verifiable on staging.

---

## Architectural Responsibility Map

| Capability                                  | Primary Tier                                          | Secondary Tier                              | Rationale                                               |
| ------------------------------------------- | ----------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------- |
| Clearance scale canonicalization (REMED-01) | Database (migrations + RPC)                           | —                                           | RLS is DB-enforced; shim lives in DB                    |
| Search clearance gating (REMED-02)          | Database (SECURITY INVOKER RPC)                       | Edge Function (caller JWT forwarding)       | Search path starts at edge fn but DB enforces clearance |
| Assistant RLS rewire (REMED-03)             | Backend API (chat-assistant.ts tool fns)              | Database (RLS auto-enforced via JWT client) | Swap supabaseAdmin → JWT client; DB does the rest       |
| Embedding native-1024 write (REMED-04)      | Edge Function (search-semantic) + ai_embeddings table | Backend EmbeddingsService                   | Edge fn is the write path; ai_embeddings is the store   |
| Observability scaffolding (REMED-05)        | Infrastructure (docker-compose.prod)                  | Backend (OTel wiring in mastra-config.ts)   | Containers are infra; instrumentation is backend        |
| i18n CI guard (REMED-06)                    | Frontend tooling (eslint.config.mjs)                  | CI (Lint job fold-in)                       | ESLint rule runs in existing Lint step                  |

---

## Research Flags — Live Verification Results

### RF-1: `sensitivity_level` Actual Type and Range

**Live query results from staging (`zkrcjzdemdmwhearhfgg`):**

```
-- information_schema.columns WHERE column_name = 'sensitivity_level'
table_name                  | data_type         | udt_name | is_nullable | column_default
----------------------------+-------------------+----------+-------------+---------------
_dossiers_backup_20260202   | integer           | int4     | YES         | null
content_expiration_rules    | character varying | varchar  | YES         | null
data_retention_policies     | integer           | int4     | YES         | null
dossiers                    | integer           | int4     | NO          | 1

-- SELECT sensitivity_level, count(*) FROM dossiers GROUP BY 1
sensitivity_level | count
1                 | 15
2                 | 19
3                 | 3
```

[VERIFIED: live DB query `zkrcjzdemdmwhearhfgg`]

**What this means:**

1. **`dossiers.sensitivity_level` is `integer NOT NULL DEFAULT 1`** with values 1, 2, 3 in live data. The "low/med/high string" description in the spec is incorrect for the current live schema.

2. **The `content_expiration_rules` table has a `varchar` `sensitivity_level`** but no clearance-gating RLS policy that references it. It is not in scope for REMED-01 (it is a configuration table, not a user-visible data table).

3. **The legacy string-CASE policy in `20250930005_create_briefs_table.sql`** (`WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3`) does **NOT exist on the live database.** The live `briefs` table is a completely different schema (org-isolated via `tenant_id`/`organization_id`, no `dossier_id`, no `content_en`, no `generated_by`). The migration in `20250930005` describes the initial schema that was later replaced. The live `briefs` RLS policies are `briefs_org_isolation_*` (org-scoped via JWT `org_id` claim) with no clearance check.

4. **`intelligence_signals` has NO `sensitivity_level` column** — it inherits dossier access via `dossier_id` join in the parent dossier RLS.

5. **`positions` has NO `sensitivity_level` column** — access is via the linked dossier through `position_dossier_links`.

**Conclusion for REMED-01:** The D-01 single-integer `<=` model is already the live pattern on `dossiers`. The plan does NOT need to normalize a string-CASE policy on briefs (it doesn't exist). The plan DOES need to:

- Rewrite `get_user_clearance_level()` (returns 1–3) to read `profiles.clearance_level` (returns 1–4).
- Backfill `profiles.clearance_level` for the 5 live RLS policies that call `get_user_clearance_level()`.
- Add `sensitivity_level` to `intelligence_signals` (for Phase 69 SIGNAL-04) — this is a Phase 69 concern, but P68 should note the gap.

---

### RF-2: Assistant JWT Context

**Live code trace:**

1. The `/api/ai` router is mounted **before** the global `authenticateToken` (line 67 in `backend/src/api/index.ts`).
2. However, `api/ai.ts` applies `router.use(supabaseAuth)` at line 103 — and `supabaseAuth` is an alias for `authenticateToken` (from `middleware/supabase-auth.ts` → `export { authenticateToken as supabaseAuth }`).
3. `authenticateToken` extracts the `Bearer` token from the `Authorization` header, calls `supabaseAdmin.auth.getUser(token)` to validate it, then populates `req.user.id`, `req.user.organization_id`, etc.
4. The chat route (`POST /api/ai/chat`) is mounted at line 112 after `router.use(supabaseAuth)` at line 103, so it is protected.
5. Inside `chat.ts`, the handler confirms `userId = req.user?.id` and returns 401 if missing.

[VERIFIED: source code trace]

**What this means:**

- **ALL invocations of `chatAssistantAgent` are authenticated.** There is no cron/background path. The route is HTTP-only (SSE streaming or non-streaming JSON).
- The **caller's JWT token** (`req.headers.authorization`) is available at call time.
- `chat-assistant.ts` currently ignores this token entirely — it uses the module-level `supabaseAdmin` (service-role) for all 5 DB reads (`dossiers` ×4, `commitments`, `engagements`, and `listDossiers`).

**Invocation paths:**
| Path | Auth? | JWT available? | Treatment |
|------|-------|----------------|-----------|
| `POST /api/ai/chat` (SSE stream) | Yes — `supabaseAuth` middleware | Yes — `req.headers.authorization` | JWT keystone (D-08) |
| `POST /api/ai/chat` (non-streaming) | Yes — `supabaseAuth` middleware | Yes — `req.headers.authorization` | JWT keystone (D-08) |

**No background/cron path exists** for the assistant. D-08 applies to all paths.

**The swap pattern:** Pass `req.headers.authorization` (the full `Bearer <token>` string) down through `ChatRequest`, then in each tool function create a per-request Supabase client:

```typescript
const supabaseUserClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
  global: { headers: { Authorization: authHeader } },
})
```

This is the same pattern already used in `search-semantic/index.ts` line 168.

**D-10 legacy table repoints:**

- `queryCommitments()` reads `commitments` table (line 270 in chat-assistant.ts) → must repoint to `aa_commitments`.
  - `aa_commitments` columns: `id, title, title_ar, owner_user_id, is_deleted, due_date, priority, status` (confirmed from prior work).
  - Query must change: `from('commitments')` → `from('aa_commitments')`, `is_deleted: false`, no `source`/`responsible`/`timeline`/`tracking` columns (those don't exist on `aa_commitments`).
- `getEngagementHistory()` reads `engagements` table (line 307) → must repoint to `engagement_dossiers`.
  - `engagement_dossiers` is the extension table; key columns: `id`, `engagement_type`, `engagement_category`, `engagement_date`.
- **Landmine:** The `searchEntities()` function reads `dossiers` via `textSearch` (line 158) — these reads will be properly gated once the JWT client is used, because `dossiers` has clearance-gated RLS.

---

### RF-3: Authoritative Clearance Source and Backfill

**Live query results:**

```
-- profiles table columns
column_name      | data_type | is_nullable | column_default
user_id          | uuid      | NO          | null
clearance_level  | integer   | NO          | 1
organization_id  | uuid      | YES         | null
created_at       | timestamptz | NO        | now()
updated_at       | timestamptz | NO        | now()

-- SELECT clearance_level, count(*) FROM profiles GROUP BY 1
clearance_level | count
1               | 388
3               | 5
```

[VERIFIED: live DB query `zkrcjzdemdmwhearhfgg`]

```
-- Role-to-clearance mapping in live data
role    | clearance_level | count
admin   | 1               | 6
admin   | 3               | 1
analyst | 1               | 1
staff   | 1               | 1
```

[VERIFIED: live DB query `zkrcjzdemdmwhearhfgg`]

**Key observations:**

1. **`profiles.clearance_level` already EXISTS**, is `integer NOT NULL DEFAULT 1` (1–4 range by D-01 intent), and is populated with real values (388 at level 1, 5 at level 3). The column is the canonical source per D-02. No column needs to be added.

2. **Current distribution is inconsistent with role-derived mapping**: 6 admins have clearance_level=1, 1 admin has clearance_level=3. By `get_user_clearance_level()` logic, all admins should have level 3. This means either (a) the `profiles.clearance_level` was backfilled incorrectly, or (b) admins were manually set to level 1. The backfill migration must map `admin`/`manager` → 3, `analyst` → 2, else/null → 1, using `MAX` per user to avoid downgrades.

3. **`get_user_clearance_level()` is `SECURITY DEFINER`** and reads `user_roles` table, returning 1–3 (admin→3, manager→3, analyst→2, else→1). It is called by 5 RLS policies.

**5 policies that call `get_user_clearance_level()`:**
[VERIFIED: live pg_policies query]

| Policy                                   | Table                        | Comparison                                                    |
| ---------------------------------------- | ---------------------------- | ------------------------------------------------------------- |
| `work_item_dossiers_select`              | `work_item_dossiers`         | `get_user_clearance_level(auth.uid()) >= d.sensitivity_level` |
| `view_wg_decisions_by_dossier_access`    | `working_group_decisions`    | `get_user_clearance_level(auth.uid()) >= d.sensitivity_level` |
| `view_wg_deliverables_by_dossier_access` | `working_group_deliverables` | `get_user_clearance_level(auth.uid()) >= d.sensitivity_level` |
| `view_wg_meetings_by_dossier_access`     | `working_group_meetings`     | `get_user_clearance_level(auth.uid()) >= d.sensitivity_level` |
| `view_wg_members_by_dossier_access`      | `working_group_members`      | `get_user_clearance_level(auth.uid()) >= d.sensitivity_level` |

**The compat-shim rewrite (D-03):**

```sql
CREATE OR REPLACE FUNCTION get_user_clearance_level(user_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(clearance_level, 1)
  FROM profiles
  WHERE profiles.user_id = get_user_clearance_level.user_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;
```

This returns 1–4 (reading from `profiles.clearance_level`), is safe for the 5 existing policies because:

- Comparisons are `>= sensitivity_level` where sensitivity_level is 1–3.
- A clearance_level of 4 (reserved) returns 4, which is `>= 3`, so reserved-clearance users see everything — correct.
- A clearance_level of 1 returns 1, only sees sensitivity_level=1 content — unchanged.

**Backfill SQL for profiles.clearance_level:**

```sql
UPDATE profiles p
SET clearance_level = COALESCE((
  SELECT MAX(
    CASE ur.role
      WHEN 'admin'   THEN 3
      WHEN 'manager' THEN 3
      WHEN 'analyst' THEN 2
      ELSE 1
    END
  )
  FROM user_roles ur
  WHERE ur.user_id = p.user_id
), 1)
WHERE clearance_level = 1;  -- Only backfill default-1 profiles; don't downgrade manually-set values
```

**Critical constraint:** The `WHERE clearance_level = 1` guard prevents silently narrowing the 1 admin who already has clearance_level=3 (they stay at 3).

**Policies NOT calling `get_user_clearance_level()` (already on canonical pattern):**

- `dossiers`: uses `(SELECT COALESCE(profiles.clearance_level, 1) ... WHERE profiles.user_id = auth.uid())`
- `calendar_events`, `calendar_entries`, `dossier_relationships`, `position_dossier_links`: all use `profiles.clearance_level` directly.

**What the shim makes consistent:** After the shim rewrite, `get_user_clearance_level()` and the direct `profiles.clearance_level` subquery both return the same value. All 9+ policies are now equivalent.

---

### RF-4: Embedding Store Inventory

**Live vector column dimensions (pg_attribute, tables only):**

| Table                       | Column                                         | Dimension (atttypmod) | Type     | Rows with embedding |
| --------------------------- | ---------------------------------------------- | --------------------- | -------- | ------------------- |
| `ai_embeddings`             | `embedding`                                    | **1024**              | `vector` | 0 (empty)           |
| `attachments`               | `embedding`                                    | 1536                  | `vector` | 0                   |
| `briefs`                    | `embedding`                                    | 1536                  | `vector` | 0                   |
| `document_embeddings`       | `embedding`                                    | 1536                  | `vector` | 0                   |
| `dossiers`                  | `embedding`                                    | 1536                  | `vector` | 0                   |
| `entity_embeddings`         | `embedding`                                    | 1536                  | `vector` | 0                   |
| `intake_embeddings`         | `embedding`                                    | 1536                  | `vector` | 0                   |
| `intelligence_reports`      | `vector_embedding`                             | 1536                  | `vector` | (unknown)           |
| `position_embeddings`       | `content_en_embedding`, `content_ar_embedding` | 1536                  | `vector` | (unknown)           |
| `query_embeddings`          | `query_embedding`                              | 1536                  | `vector` | (unknown)           |
| `_dossiers_backup_20260202` | `embedding`                                    | 1536                  | `vector` | (backup table)      |

[VERIFIED: live pg_attribute query `zkrcjzdemdmwhearhfgg`]

```
-- pgvector extension version
extname | extversion
vector  | 0.8.0
```

[VERIFIED: live pg_extension query] — pgvector 0.8.0 is well above the 0.7.0 HNSW `halfvec` requirement. `halfvec` type is confirmed available.

**`ai_embeddings` table schema:**

```
id              uuid (PK)
owner_type      embedding_owner_type (enum)
owner_id        uuid
content_hash    bytea
embedding       vector(1024)
model           text
model_version   text
embedding_dim   integer
created_at      timestamptz
expires_at      timestamptz
```

[VERIFIED: live information_schema query]

**The `search_entities_semantic` RPC security mode:**

```
prosecdef: true (SECURITY DEFINER)
```

[VERIFIED: live pg_proc query] — This is the critical bug for REMED-02: SECURITY DEFINER means the RPC runs as its defining user (postgres/service_role), bypassing RLS entirely. All vector search results are unfiltered regardless of caller clearance.

**What the edge function does today (`search-semantic/index.ts`):**

- Creates a Supabase client with the user's token (line 168): `createClient(supabaseUrl, supabaseServiceKey, { global: { headers: { Authorization: authHeader } } })`.
- But then calls `supabase.rpc('search_entities_semantic', ...)` which is SECURITY DEFINER — so passing the user token to the client is irrelevant for the RPC, which ignores RLS.
- The edge function already correctly extracts and forwards the auth header; the security gap is purely in the RPC's SECURITY DEFINER mode.

**Embedding write paths in the repo:**

1. **`search-semantic/index.ts` (edge fn):** Calls `generateQueryEmbedding()` (AnythingLLM), then passes result to `search_entities_semantic` RPC. This is a QUERY-time path (reads, not writes to the store). Does NOT write embeddings.

2. **`backend/src/ai/embeddings-service.ts` (`EmbeddingsService`):** Used by the backend for embedding generation. Has a `dimensions` field from `aiConfig.embeddings.dimensions` which reads `AI_EMBEDDING_DIMENSIONS` env var defaulting to `1024` (`parseInt(process.env.AI_EMBEDDING_DIMENSIONS || '1024', 10)`). But the ONNX embedder (BGE-M3 via `@xenova/transformers`) truncates to `this.dimensions` (line 167-169). So if `AI_EMBEDDING_DIMENSIONS=1024`, the backend embedder already emits 1024-dim. The PROBLEM is that `normalizeEmbedding` in the EDGE FUNCTION hard-codes 1536.

3. **`backend/src/ai/agents/chat-assistant.ts` `searchEntities()`:** Calls `SemanticSearchService.search()` which internally calls the edge function (indirect write via AnythingLLM embed). Not a direct write path.

**Recommendation on store shape (researcher's call, D-05):** Use the existing `ai_embeddings` table rather than creating a new table. It already has `vector(1024)`, is empty, has content hashing (`content_hash bytea`) to avoid duplicate embeds, and has `owner_type`/`owner_id` for any entity type. Creating a new table would duplicate this infrastructure. The plan adds:

- An HNSW index on `ai_embeddings.embedding` for fast ANN search.
- A new SECURITY INVOKER RPC `search_semantic_clearance_gated(p_query_embedding halfvec, p_entity_types text[], p_limit int)` that JOINs `ai_embeddings` to `dossiers` with `sensitivity_level <= (SELECT clearance_level FROM profiles WHERE user_id = auth.uid())` in the WHERE clause.
- The edge function's `normalizeEmbedding` call is removed; new embeddings from the local ONNX BGE-M3 path are stored at native dimension.

**Verification of `halfvec` vs `vector` for the new write:** The `ai_embeddings.embedding` column is already typed as `vector(1024)`. For P68 the existing 1024 `vector` column is sufficient — `halfvec` can be used in P72 for the full re-embed store if memory becomes an issue. Keeping `vector(1024)` in P68 reduces migration surface.

---

## Standard Stack

### Core (P68 scope only)

| Library                 | Version                        | Purpose                                     | Notes                                                                                     |
| ----------------------- | ------------------------------ | ------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `@supabase/supabase-js` | `^2`                           | JWT-scoped client for chat-assistant rewire | Already in repo; `createClient(url, anonKey, {global:{headers:{Authorization}}})` pattern |
| `@xenova/transformers`  | Already installed              | Local ONNX BGE-M3 embedder                  | Confirmed in `embeddings-service.ts`                                                      |
| Langfuse                | `langfuse-node` or self-hosted | Observability (prompts/traces)              | Docker image: `langfuse/langfuse:latest`                                                  |
| Arize Phoenix           | `arize-phoenix`                | Observability (evals/traces)                | Docker image: `arizephoenix/phoenix:latest`                                               |
| `@opentelemetry/api`    | Latest                         | OTel API for trace export                   | Standard; `@mastra/core` may already pull it                                              |
| `openllmetry`           | Latest                         | OpenTelemetry for LLM spans                 | `@traceloop/node-server-sdk` or equivalent                                                |

### ESLint (for REMED-06)

| Library | Version         | Purpose                            |
| ------- | --------------- | ---------------------------------- |
| ESLint  | Already in repo | i18n guard rule via no-code config |

---

## Don't Hand-Roll

| Problem                                 | Don't Build                             | Use Instead                                                                           | Why                                                                    |
| --------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| JWT-scoped Supabase client              | Custom token injection                  | `createClient(url, anonKey, { global: { headers: { Authorization: bearerToken } } })` | Standard pattern; already used in search-semantic                      |
| Clearance comparison in RLS             | Custom auth function with complex logic | Single subquery `(SELECT clearance_level FROM profiles WHERE user_id = auth.uid())`   | 4 policies already use this exact pattern                              |
| Vector similarity search with clearance | Custom vector store layer               | New SECURITY INVOKER RPC over `ai_embeddings` + `dossiers` JOIN                       | DB enforces RLS at query time                                          |
| OTel instrumentation                    | Custom logging middleware               | OpenLLMetry SDK + Langfuse/Phoenix OTLP receivers                                     | Mastra already has an OTel hook point in `mastra-config.ts`            |
| i18n namespace scanning                 | Script that `grep`s source              | Custom ESLint rule with `no-restricted-syntax` or dedicated rule                      | Integrates into existing Lint job; catches both string and array forms |

---

## Architecture Patterns

### Clearance Gating Pattern (canonical — from `20251022000009`)

```sql
-- USE THIS pattern, not get_user_clearance_level():
sensitivity_level <= (
  SELECT clearance_level
  FROM profiles
  WHERE id = auth.uid()
)
```

### JWT-Scoped Client Pattern (from `search-semantic/index.ts:168`)

```typescript
// Source: supabase/functions/search-semantic/index.ts line 168
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  global: {
    headers: {
      Authorization: authHeader,
    },
  },
})
```

**Note:** The edge function uses `supabaseServiceKey` as the `apiKey` arg with the auth header override. For the backend chat-assistant rewrite, use `SUPABASE_ANON_KEY` instead to correctly scope to the user's role claims.

### New SECURITY INVOKER RPC Shape (for REMED-02)

```sql
CREATE OR REPLACE FUNCTION search_semantic_clearance_gated(
  p_query_embedding vector(1024),
  p_entity_types text[],
  p_similarity_threshold float DEFAULT 0.6,
  p_limit int DEFAULT 20
)
RETURNS TABLE (
  entity_id uuid,
  owner_type text,
  similarity_score float,
  sensitivity_level int
)
LANGUAGE sql
SECURITY INVOKER  -- CRITICAL: caller's RLS applies
STABLE
AS $$
  SELECT
    ae.owner_id AS entity_id,
    ae.owner_type::text,
    (1 - (ae.embedding <=> p_query_embedding))::float AS similarity_score,
    d.sensitivity_level
  FROM ai_embeddings ae
  JOIN dossiers d ON d.id = ae.owner_id
  WHERE ae.owner_type::text = ANY(p_entity_types)
    AND (1 - (ae.embedding <=> p_query_embedding)) >= p_similarity_threshold
    AND d.sensitivity_level <= (
      SELECT clearance_level FROM profiles WHERE user_id = auth.uid()
    )
    AND d.is_active = true
  ORDER BY ae.embedding <=> p_query_embedding
  LIMIT p_limit;
$$;
```

### get_user_clearance_level Shim (D-03)

```sql
-- Source: migration shim — replaces 20250930001_helper_functions.sql T004
CREATE OR REPLACE FUNCTION get_user_clearance_level(user_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(clearance_level, 1)
  FROM profiles
  WHERE profiles.user_id = get_user_clearance_level.user_id
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_user_clearance_level(UUID) IS
  'Compat shim (P68): Returns clearance_level from profiles (1-4 scale). '
  'Replaces prior user_roles-based 1-3 scale. All callers keep working unchanged.';
```

### normalizeEmbedding Removal (D-05)

```typescript
// REMOVE lines 54 and 67-78 from supabase/functions/search-semantic/index.ts
// BEFORE (current):
return normalizeEmbedding(data.embedding, 1536)

// AFTER (P68):
if (data.embedding && Array.isArray(data.embedding)) {
  return data.embedding // native dim, no normalization
}
```

**AND:** For the new write path, store into `ai_embeddings` rather than into the 1536-dim tables.

---

## Common Pitfalls

### Pitfall 1: Widening Existing Users During Backfill

**What goes wrong:** Running `UPDATE profiles SET clearance_level = <computed>` without a guard silently overwrites manually-set clearance_level=3 for 5 users back to whatever their role says (admin→3 is fine, but if a user has been manually set to 3 while being an analyst→2, they get narrowed).
**Prevention:** Use `WHERE clearance_level = 1` guard to only backfill profiles still at the default. Any profile already above 1 was intentionally set — don't touch it.
**Warning signs:** The backfill SQL returns `> 5` updated rows on staging (the 5 at level 3 should NOT be touched).

### Pitfall 2: SECURITY DEFINER on the New Search RPC

**What goes wrong:** Accidentally creating the new `search_semantic_clearance_gated` with `SECURITY DEFINER` (the old pattern) negates the entire REMED-02 fix.
**Prevention:** Every new RPC in v7.0 is `SECURITY INVOKER` per the locked cross-cutting guarantee. Add a linting/review check. The migration comment should explicitly say `SECURITY INVOKER -- not DEFINER`.
**Warning signs:** The RLS policy on `dossiers` doesn't fire during test (a low-clearance caller sees above-clearance results).

### Pitfall 3: AA Commitments Column Mismatch

**What goes wrong:** The `queryCommitments()` function in `chat-assistant.ts` selects `source, responsible, timeline, tracking` — none of which exist on `aa_commitments`. After D-10 repoint, the query will 400 unless the select list is updated.
**Prevention:** Query `aa_commitments` only with columns it actually has: `id, title, title_ar, type, status, priority, due_date, owner_user_id, is_deleted, created_at, updated_at`.
**Warning signs:** Chat assistant returns empty commitments or a 400 after the D-10 repoint.

### Pitfall 4: supabaseAdmin in chat.ts (the outer route file)

**What goes wrong:** `backend/src/api/ai/chat.ts` (the route handler) also uses `supabaseAdmin` directly (at lines 212, 264, 281, 316, 348, 370, 380) for logging chat history/runs to `ai_runs`/`ai_messages`/`ai_tool_calls`. These logging writes should use service-role (they are operational logging, not user data reads) — but must be audited to ensure no user-facing DATA is read via `supabaseAdmin` in this file.
**Prevention:** Audit `chat.ts` separately from `chat-assistant.ts`. The logging calls (`recordChatStart`, `recordChatComplete`) are writes to internal tables — keeping service-role for these is correct. Only the user-facing READ tools in `chat-assistant.ts` must switch to JWT clients.
**Warning signs:** Breaking the admin logging when only chat-assistant.ts tool reads were intended to be repointed.

### Pitfall 5: Edge Function Client Uses service_role with User JWT Override

**What goes wrong:** `search-semantic/index.ts:168` passes `supabaseServiceKey` as the API key but sets `Authorization: authHeader` in headers. This works for regular table queries (auth header overrides who RLS thinks the user is), but for `SECURITY DEFINER` RPCs the service_role key wins and RLS is bypassed. The fix (new SECURITY INVOKER RPC) resolves this, but the caller pattern must also ensure the client has the user token in the `Authorization` header, not the service role key.
**Prevention:** After deploying the new SECURITY INVOKER RPC, update the edge function to call it using only the user's JWT (no service_role key in the API key slot). Pattern: `createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } })`.

### Pitfall 6: normalizeEmbedding Removal Breaks Existing Stores

**What goes wrong:** Removing `normalizeEmbedding(data.embedding, 1536)` means any existing HNSW index on 1536-dim columns can no longer accept the new 1024-dim query embedding (dimension mismatch error from pgvector).
**Prevention:** The new `search_semantic_clearance_gated` RPC queries only `ai_embeddings` (1024-dim), not the old 1536-dim tables. The old `search_entities_semantic` RPC (SECURITY DEFINER, 1536-dim) is left in place for backward compat but no longer called from the new search path. The new search path uses only the new RPC + `ai_embeddings`. Old tables are untouched (D-06).
**Warning signs:** Pgvector dimension mismatch errors if the new edge fn accidentally queries old 1536-dim tables.

---

## REMED-01: Clearance Migration Mechanism

**Files to touch:**

1. New migration: `supabase/migrations/YYYYMMDD_p68_clearance_canonical.sql`

**Migration contents:**

```sql
-- Step 1: Backfill profiles.clearance_level from role-derived mapping
-- GUARD: only touch default-1 profiles; do not downgrade manually-set values
UPDATE profiles p
SET clearance_level = COALESCE((
  SELECT MAX(
    CASE ur.role
      WHEN 'admin'   THEN 3
      WHEN 'manager' THEN 3
      WHEN 'analyst' THEN 2
      ELSE 1
    END
  )
  FROM user_roles ur
  WHERE ur.user_id = p.user_id
), 1)
WHERE p.clearance_level = 1;

-- Step 2: Replace get_user_clearance_level() shim (reads profiles.clearance_level, returns 1-4)
CREATE OR REPLACE FUNCTION get_user_clearance_level(user_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(clearance_level, 1)
  FROM profiles
  WHERE profiles.user_id = get_user_clearance_level.user_id
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_user_clearance_level(UUID) IS
  'P68 compat shim: reads profiles.clearance_level (1-4 scale). Prior impl read user_roles (1-3). '
  'All 5 existing RLS policies that call this function keep working unchanged.';
```

**Verification:** Run `SELECT get_user_clearance_level(user_id) FROM profiles GROUP BY 1, 2` before and after — the admin with clearance_level=3 must still return 3 post-migration.

**Test hook:** Extend `tests/security/rls-audit.test.ts` `sensitiveTables` to assert:

- `dossiers` clearance-gating policy uses `sensitivity_level <= (SELECT clearance_level FROM profiles WHERE user_id = auth.uid())` OR `get_user_clearance_level(auth.uid()) >= sensitivity_level` (both are now equivalent post-shim).
- After seeding a low-clearance user + a level-2 dossier, the low-clearance user (level 1) gets 0 results on `dossiers` SELECT via JWT client.

---

## REMED-02: Search Clearance Gating

**Current gap:** `search_entities_semantic` is `SECURITY DEFINER` (confirmed). `search-semantic` edge fn creates a user-JWT-scoped client but the DEFINER bypasses RLS. The keyword fallback (`search_entities_fulltext`) is also SECURITY DEFINER.

**Files to touch:**

1. New migration with `search_semantic_clearance_gated` SECURITY INVOKER RPC (shape above).
2. `supabase/functions/search-semantic/index.ts`: remove `normalizeEmbedding`, add HNSW index usage via new RPC call.

**Interim degradation (D-07):** Since `ai_embeddings` is empty on staging, all semantic searches will fall through to the keyword fallback path (which already exists at line 187–249). This is correct behavior during the P68/P72 gap.

**Search path after P68:**

```
Edge fn receive request
  → Extract authHeader (already done, line 152)
  → Generate query embedding via local BGE-M3 (or AnythingLLM fallback)
  → If embedding succeeds:
       → Call search_semantic_clearance_gated(embedding, entity_types, ...)
         (SECURITY INVOKER: RLS enforces sensitivity_level <= clearance_level)
       → If 0 results (empty or below-threshold): fall through
  → Fall through to keyword: search_entities_fulltext (also replace with INVOKER)
  → Return combined/sorted results
  → On embedding failure: keyword only (D-07)
```

**Note on `search_entities_fulltext`:** It is currently SECURITY INVOKER by default (no explicit `prosecdef: true` noted in live pg_proc result — only `search_entities_semantic` is confirmed DEFINER). The fulltext RPC does not filter by `sensitivity_level` at all — it searches all published positions/documents regardless of clearance. A new `fulltext_search_clearance_gated` RPC should also be added.

---

## REMED-03: Assistant Under RLS

**Files to touch:**

1. `backend/src/ai/agents/chat-assistant.ts` — the 5 tool functions that use `supabaseAdmin`.
2. `backend/src/api/ai/chat.ts` — must pass `authHeader` into `ChatRequest`.

**ChatRequest extension:**

```typescript
export interface ChatRequest {
  message: string
  conversationHistory?: ChatMessage[]
  organizationId: string
  userId: string
  language?: 'en' | 'ar'
  authHeader: string // ADD THIS — Bearer <jwt>
}
```

**Tool function signature change:**
Each tool function (`searchEntities`, `getDossier`, `queryCommitments`, `getEngagementHistory`, `listDossiers`) currently takes `(_organizationId: string)` as 2nd param (unused). Change to `(authHeader: string)` and create the JWT-scoped client inside each function.

**D-10 repoint needed in `queryCommitments`:**

- FROM: `supabaseAdmin.from('commitments').select('id, title, type, status, priority, source, responsible, timeline, tracking, ...')`
- TO: `supabaseClient.from('aa_commitments').select('id, title, title_ar, type, status, priority, due_date, owner_user_id, is_deleted, created_at, updated_at')`

**D-10 repoint needed in `getEngagementHistory`:**

- FROM: `supabaseAdmin.from('engagements').select('id, engagement_type, engagement_category, location_en, location_ar')`
- TO: `supabaseClient.from('engagement_dossiers').select('id, engagement_type, engagement_category, engagement_date')`

**Indistinguishable empty (D-09):** No code change needed. When the JWT client's RLS blocks access, PostgREST returns `[]` (empty array), not an error. The tool function returns `{ commitments: [] }` or `{ dossiers: [] }` — the AI system prompt already says "if you don't have enough information, say so." No "filtered by clearance" messaging should ever be added downstream.

---

## REMED-04: Native-1024 Embedding Write

**Files to touch:**

1. `supabase/functions/search-semantic/index.ts` — remove `normalizeEmbedding` call (lines 54, 67–78). Add write-to-`ai_embeddings` path (optional in P68 — only needed if the edge fn is the write-at-ingest path; for P68 the write path is the new `search_semantic_clearance_gated` RPC which queries `ai_embeddings`).
2. New migration: HNSW index on `ai_embeddings.embedding`.
3. `backend/src/ai/embeddings-service.ts` line 167–169: The truncation is already conditional (`if (embedding.length > this.dimensions)`). With `AI_EMBEDDING_DIMENSIONS=1024`, the service already truncates to 1024. Verify the env var is set and the ONNX model actually emits >=1024 dim.

**`ai_embeddings` HNSW index:**

```sql
CREATE INDEX idx_ai_embeddings_hnsw
ON ai_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

**Write path for new content (P68):** New content embedded by the backend `EmbeddingsService` (with `AI_EMBEDDING_DIMENSIONS=1024`) should be stored in `ai_embeddings` using the `owner_type`/`owner_id` pattern. The exact call site for "new content write" in P68 depends on where content is created — for P68, only the `search-semantic` edge fn query path changes. Actual new-content writes (positions, documents) happen when those are created/updated. The P68 guarantee is: any NEW write that goes through `EmbeddingsService` will be at 1024-dim (env var) and will land in `ai_embeddings`.

**Verification of native dim:**

```sql
-- After any new embed write:
SELECT array_length(embedding, 1) FROM ai_embeddings LIMIT 5;
-- Must return 1024, never 1536
```

---

## REMED-05: Observability Scaffolding

**Current state:** `backend/src/ai/mastra-config.ts` has a `MastraRegistry` class with `new Mastra({})` — no OTel config passed. Langfuse and Phoenix are NOT in `docker-compose.prod.yml` or `docker-compose.yml`. The dev `docker-compose.yml` has only postgres + redis.

**What to add to `docker-compose.prod.yml`:**

```yaml
langfuse:
  image: langfuse/langfuse:latest
  environment:
    DATABASE_URL: ${LANGFUSE_DATABASE_URL}
    NEXTAUTH_URL: http://langfuse:3000
    NEXTAUTH_SECRET: ${LANGFUSE_SECRET}
    SALT: ${LANGFUSE_SALT}
  ports:
    - '3000:3000'
  networks:
    - intl-dossier

phoenix:
  image: arizephoenix/phoenix:latest
  ports:
    - '6006:6006'
    - '4317:4317' # OTLP gRPC
  networks:
    - intl-dossier
```

**OTel wiring in mastra-config.ts:**

```typescript
import { Mastra } from '@mastra/core'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc'

const otelExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://phoenix:4317',
})

this.mastra = new Mastra({
  telemetry: {
    serviceName: 'intl-dossier-ai',
    exporter: otelExporter,
  },
})
```

**Minimal trace goal (P68):** One complete trace of: user query → chat-assistant tool call → DB read → LLM call → response. Langfuse captures prompts/responses; Phoenix captures spans/evals.

**Zero egress:** Both containers are in the `intl-dossier` Docker network; no external OTLP endpoints configured.

---

## REMED-06: i18n CI Guard

**Current i18n infrastructure:**

- `src/i18n/index.ts`: static `resources` object with ~110 registered namespaces (both `en` and `ar` keys). No HTTP backend.
- `saveMissing: false` — missing keys log a warning in dev but silently fall back to English in prod.
- The CI `Lint` job runs `pnpm run lint` at line 64 in `ci.yml`. The job is REQUIRED (other jobs `needs: [lint, ...]`).

**Recommended mechanism (researcher's call: custom ESLint rule):**

A custom ESLint rule in `eslint.config.mjs` that:

1. Matches `CallExpression` nodes where `callee.name === 'useTranslation'` or `callee.property.name === 'useTranslation'`.
2. Extracts the first argument (string `'namespace'` or array `['ns1', 'ns2']`).
3. Checks each namespace string against the static registry extracted from `src/i18n/index.ts`.
4. Reports an error if a namespace is not in the registry.

**Why ESLint over a separate script:** Runs inside the existing `Lint` step, provides line-level error messages, integrates with IDE highlighting, and catches both the string form `useTranslation('ai-signals')` and the array form `useTranslation(['ai-signals', 'common'])`.

**Array-form edge case:** `useTranslation(['ns1', 'ns2'])` is the form that caused the original silent-fallback bugs (per MEMORY). The rule must handle `Literal` (string form) and `ArrayExpression > Literal` (array form) argument patterns.

**Pattern for existing custom ESLint rules in this repo:** The file already has inline `no-restricted-syntax` rules and custom message patterns (lines 285, 360–410 in `eslint.config.mjs`). A new rule can follow the same pattern:

```javascript
// In eslint.config.mjs frontend files block:
{
  no-restricted-syntax: [
    'error',
    {
      selector: 'CallExpression[callee.name="useTranslation"] > Literal.arguments:first-child',
      message: 'useTranslation namespace must be registered in src/i18n/index.ts'
    }
  ]
}
```

**Limitation of no-restricted-syntax:** It cannot dynamically check the registry. For a real registry check, a custom plugin rule is needed. The simpler approach: add a `scripts/check-i18n-namespaces.mjs` script that extracts registered namespaces from `index.ts` and greps source files for `useTranslation`, then call it from the lint script in `package.json`. This keeps it in the Lint step without a custom plugin.

**Recommended implementation (pragmatic):**

1. `scripts/check-i18n-namespaces.mjs` — standalone Node.js script.
2. Add to `frontend/package.json`: `"lint": "eslint ... && node scripts/check-i18n-namespaces.mjs"`.
3. The script reads `src/i18n/index.ts` (parse imports to extract keys), then `rg --json 'useTranslation' src/` and checks each call's namespace arg.
4. Exit 1 on any unregistered namespace → fails the Lint job.

This approach handles array-form without AST complexity and is readable for future maintainers.

---

## Project Constraints (from CLAUDE.md)

- All migrations via Supabase MCP to staging `zkrcjzdemdmwhearhfgg`, committed as forward migrations.
- New RPCs must be `SECURITY INVOKER` (never DEFINER) — v7.0 cross-cutting guarantee.
- No raw hex in UI; no card shadows; design tokens only.
- RTL/bilingual: new strings in both `en` and `ar` i18n namespaces.
- Work-item terminology: `assignee_id`, `deadline`, `priority` (not `critical`), `status`.
- `profiles.clearance_level` is the canonical source (this phase makes it authoritative).
- Pre-commit hook runs `pnpm build` — plan tasks must not break the build.

---

## Validation Architecture

### Test Framework

| Property           | Value                                                        |
| ------------------ | ------------------------------------------------------------ |
| Framework          | Vitest (unit + integration), Playwright (E2E)                |
| Config file        | `vitest.config.ts` / `playwright.config.ts`                  |
| Quick run command  | `pnpm --filter backend test` / `pnpm --filter frontend test` |
| Full suite command | `pnpm test`                                                  |

### Phase Requirements → Test Map

| Req ID   | Behavior                                                                   | Test Type                         | Automated Command                                                                                        | File Exists? |
| -------- | -------------------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------ |
| REMED-01 | `get_user_clearance_level()` returns `profiles.clearance_level` (1–4)      | integration                       | Extend `tests/security/rls-audit.test.ts`                                                                | ✅ exists    |
| REMED-01 | Low-clearance user (level 1) cannot SELECT level-2 dossier                 | integration                       | Extend `tests/security/rls-audit.test.ts`                                                                | ✅ exists    |
| REMED-02 | `search_semantic_clearance_gated` is SECURITY INVOKER                      | integration                       | SQL `SELECT prosecdef FROM pg_proc WHERE proname='search_semantic_clearance_gated'` = false              | ❌ Wave 0    |
| REMED-02 | Low-clearance JWT returns 0 semantic results for above-clearance dossiers  | integration (live UAT on staging) | Seed above-clearance embedding in `ai_embeddings`, assert empty result via edge fn                       | ❌ Wave 0    |
| REMED-03 | `chat-assistant.ts` imports no `supabaseAdmin`                             | unit/lint                         | `grep -r 'supabaseAdmin' backend/src/ai/agents/` exits 1                                                 | ❌ Wave 0    |
| REMED-03 | Low-clearance chat request gets empty results for above-clearance dossiers | integration (live UAT)            | Manual staging test (D-09 indistinguishable empty)                                                       | manual       |
| REMED-04 | New writes to `ai_embeddings` have `array_length(embedding,1) = 1024`      | integration                       | `SELECT array_length(embedding,1) FROM ai_embeddings` = 1024                                             | ❌ Wave 0    |
| REMED-05 | Phoenix container responds on port 6006                                    | smoke                             | `curl http://localhost:6006` exits 0                                                                     | ❌ Wave 0    |
| REMED-05 | A chat request produces a trace in Langfuse                                | smoke                             | Manual: open Langfuse UI, run one chat, assert trace appears                                             | manual       |
| REMED-06 | ESLint/script fails on unregistered namespace                              | unit                              | `node scripts/check-i18n-namespaces.mjs` exits 1 when a new `useTranslation('unregistered-ns')` is added | ❌ Wave 0    |

### Sampling Rate

- Per task commit: `pnpm --filter backend test --run`
- Per wave merge: `pnpm test` (full suite)
- Phase gate: Full suite green + live UAT (REMED-01 clearance block, REMED-02 search block, REMED-03 assistant block) before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/security/rls-audit.test.ts` — extend `sensitiveTables` + clearance assertion
- [ ] `tests/integration/search-clearance.test.ts` — covers REMED-02 new RPC
- [ ] `tests/integration/chat-assistant-rls.test.ts` — covers REMED-03 no-supabaseAdmin
- [ ] `scripts/check-i18n-namespaces.mjs` — covers REMED-06

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies                           | Standard Control                                                    |
| --------------------- | --------------------------------- | ------------------------------------------------------------------- |
| V2 Authentication     | Yes (session JWT for chat/search) | `authenticateToken` middleware; `supabaseAdmin.auth.getUser(token)` |
| V3 Session Management | No (stateless JWT)                | —                                                                   |
| V4 Access Control     | **Yes (primary)**                 | RLS `sensitivity_level <= clearance_level`; SECURITY INVOKER RPCs   |
| V5 Input Validation   | Yes (chat message, query params)  | Existing Zod validation in route handlers                           |
| V6 Cryptography       | No (key management unchanged)     | —                                                                   |

### Known Threat Patterns

| Pattern                                            | STRIDE                 | Standard Mitigation                                                                            |
| -------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------- |
| Service-role bypass in assistant                   | Elevation of Privilege | Retire `supabaseAdmin` from all chat tool fns; use JWT-scoped client                           |
| SECURITY DEFINER semantic search                   | Elevation of Privilege | Replace with SECURITY INVOKER `search_semantic_clearance_gated`                                |
| Information disclosure via empty-vs-error response | Information Disclosure | D-09: indistinguishable empty; never reveal above-clearance existence                          |
| Prompt injection → clearance bypass                | Tampering              | JWT propagation ensures even a perfectly crafted prompt can only access what the DB RLS allows |
| Vector dimension drift → geometry corruption       | Tampering              | Remove `normalizeEmbedding`; enforce 1024-dim at write time                                    |

---

## Environment Availability

| Dependency                           | Required By                 | Available    | Version | Fallback                               |
| ------------------------------------ | --------------------------- | ------------ | ------- | -------------------------------------- |
| Supabase CLI                         | Migration apply             | ✓            | 2.102.0 | MCP direct                             |
| pgvector                             | HNSW index, halfvec         | ✓            | 0.8.0   | —                                      |
| `@xenova/transformers` (ONNX BGE-M3) | REMED-04 native-1024 embed  | Conditional  | In repo | AnythingLLM (1536-dim, for query only) |
| Docker (prod)                        | REMED-05 Langfuse + Phoenix | ✓ (droplet)  | 24.x    | —                                      |
| Langfuse Docker image                | REMED-05                    | Not deployed | latest  | —                                      |
| Arize Phoenix image                  | REMED-05                    | Not deployed | latest  | —                                      |

**Missing dependencies with no fallback:**

- Langfuse and Phoenix not yet deployed to `docker-compose.prod.yml` — planner must add container definitions.

---

## Assumptions Log

| #   | Claim                                                                                                            | Section       | Risk if Wrong                                                                           |
| --- | ---------------------------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------- |
| A1  | `search_entities_fulltext` is currently SECURITY INVOKER (not DEFINER)                                           | REMED-02      | If it's DEFINER too, fulltext fallback also bypasses RLS — adds one more RPC to replace |
| A2  | `aa_commitments` has columns `id, title, title_ar, type, status, priority, due_date, owner_user_id, is_deleted`  | REMED-03 D-10 | If columns differ, `queryCommitments` rewrite will 400 — verify before coding           |
| A3  | `engagement_dossiers` has `id, engagement_type, engagement_category, engagement_date`                            | REMED-03 D-10 | If schema differs, `getEngagementHistory` rewrite will 400                              |
| A4  | `@xenova/transformers` BGE-M3 ONNX model emits 1024-dim natively (before any truncation)                         | REMED-04      | If model emits different dim, the native write path produces wrong-dim vectors          |
| A5  | Langfuse/Phoenix Docker images have stable OTLP receivers on standard ports                                      | REMED-05      | Minor: port mapping may differ — verify at container start                              |
| A6  | The `embedding_owner_type` enum on `ai_embeddings.owner_type` includes values for 'dossier', 'position', 'brief' | REMED-04      | If enum is restricted, new writes for some entity types will fail CHECK constraint      |

---

## Open Questions

1. **`embedding_owner_type` enum values**
   - What we know: `ai_embeddings.owner_type` is `USER-DEFINED` type `embedding_owner_type`.
   - What's unclear: What values does this enum include? Are 'dossier', 'position', 'brief' all present?
   - Recommendation: Query `SELECT enum_range(NULL::embedding_owner_type)` in Wave 0 before writing to `ai_embeddings`.

2. **`aa_commitments` full schema**
   - What we know: It's the canonical commitments table (confirmed from prior fixes).
   - What's unclear: Exact column list for the rewritten `queryCommitments()` select.
   - Recommendation: Query live: `SELECT column_name FROM information_schema.columns WHERE table_name='aa_commitments'` before coding D-10.

3. **`engagement_dossiers` column list for D-10**
   - Similar to above — query live before coding.

4. **Langfuse + Mastra integration depth**
   - What we know: Mastra `@mastra/core` accepts a `telemetry` config.
   - What's unclear: Whether the current `@mastra/core` version in the repo supports OTLP export natively or requires `openllmetry` SDK wrapping.
   - Recommendation: `cat backend/package.json | grep mastra` and check version; then consult Mastra docs for OTel config.

---

## Sources

### Primary (HIGH confidence — live DB queries)

- Live staging DB `zkrcjzdemdmwhearhfgg` — all RF-1..RF-4 queries run via `supabase db query --linked`
- `backend/src/ai/agents/chat-assistant.ts` — source read directly
- `supabase/functions/search-semantic/index.ts` — source read directly
- `supabase/migrations/20250930001_helper_functions.sql` — source read directly
- `supabase/migrations/20250930005_create_briefs_table.sql` — source read directly (confirmed: the string-CASE policy described there does NOT match the live `briefs` schema)
- `supabase/migrations/20251022000009_update_polymorphic_refs.sql` — canonical clearance pattern confirmed
- `backend/src/api/ai.ts` + `backend/src/api/ai/chat.ts` — RF-2 auth trace
- `backend/src/middleware/supabase-auth.ts` + `backend/src/middleware/auth.ts` — confirms `authenticateToken` populates `req.user`

### Secondary (MEDIUM confidence — codebase read)

- `backend/src/ai/mastra-config.ts` — OTel wiring base
- `backend/src/ai/embeddings-service.ts` — embedding strategy + BGE-M3 ONNX path
- `backend/src/ai/config.ts` — `AI_EMBEDDING_DIMENSIONS` default 1024
- `frontend/src/i18n/index.ts` — 110+ registered namespaces
- `.github/workflows/ci.yml` — Lint job confirmed required, `pnpm run lint`
- `eslint.config.mjs` — existing custom rule patterns for i18n

### Tertiary (LOW confidence — not individually verified)

- A1: `search_entities_fulltext` SECURITY mode (assumed INVOKER; not directly queried)
- A2–A3: `aa_commitments`/`engagement_dossiers` column lists (inferred from prior codebase knowledge; must verify)
- A4: BGE-M3 ONNX native output dimension (documented as 1024 but should be verified at runtime)

---

## Metadata

**Confidence breakdown:**

- RF-1 (sensitivity_level live state): HIGH — queried live DB
- RF-2 (assistant JWT context): HIGH — traced source files end-to-end
- RF-3 (clearance source + backfill): HIGH — queried live DB, confirmed column exists, distribution known
- RF-4 (embedding store inventory): HIGH — queried live pg_attribute, pg_extension, confirmed pgvector 0.8.0 and ai_embeddings(1024)
- Architecture patterns: HIGH — code read + live RLS policy query
- Observability (REMED-05): MEDIUM — Docker images not yet deployed; Mastra OTel API assumed standard

**Research date:** 2026-06-14
**Valid until:** 2026-07-14 (stable domain; pgvector/Langfuse/Phoenix may have minor updates)
