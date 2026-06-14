# Phase 68: AI Foundations Remediation — Pattern Map

**Mapped:** 2026-06-14
**Files analyzed:** 9 new/modified files (5 migrations + 2 backend + 1 infra + 1 tooling)
**Analogs found:** 9 / 9

---

## File Classification

| New/Modified File                                          | Role       | Data Flow        | Closest Analog                                                                                | Match Quality                                                                                                     |
| ---------------------------------------------------------- | ---------- | ---------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `supabase/migrations/YYYYMMDD_p68_clearance_canonical.sql` | migration  | CRUD             | `supabase/migrations/20250930001_helper_functions.sql` (T004)                                 | exact — same function, same signature, shim rewrite                                                               |
| `supabase/migrations/YYYYMMDD_p68_search_invoker_rpc.sql`  | migration  | request-response | `supabase/migrations/20251004011_create_search_functions.sql` lines 157–234                   | role-match — same RETURNS TABLE shape; key difference is SECURITY INVOKER + JOIN to `dossiers`                    |
| `supabase/migrations/YYYYMMDD_p68_ai_embeddings_index.sql` | migration  | batch            | `supabase/migrations/012_setup_pgvector.sql` (HNSW index blocks)                              | role-match — same pgvector HNSW DDL pattern                                                                       |
| `backend/src/ai/agents/chat-assistant.ts` (MODIFY)         | service    | request-response | self — supabaseAdmin swap pattern from `supabase/functions/search-semantic/index.ts` line 168 | exact — JWT-scoped client pattern already in repo                                                                 |
| `backend/src/api/ai/chat.ts` (MODIFY)                      | controller | request-response | self — `ChatRequest` interface extension (line 36–42 in chat-assistant.ts)                    | exact — same interface extension pattern                                                                          |
| `backend/src/ai/mastra-config.ts` (MODIFY)                 | service    | event-driven     | self (existing Mastra shell at line 39–46)                                                    | exact — extend `new Mastra({})` call with `telemetry` config                                                      |
| `deploy/docker-compose.prod.yml` (MODIFY)                  | config     | —                | existing service blocks (`anythingllm`, `redis`) lines 103–165                                | exact — copy service-block pattern with `image`, `expose`, `environment`, `networks`, `healthcheck`               |
| `scripts/check-i18n-namespaces.mjs` (NEW)                  | utility    | batch            | `scripts/check-edge-fn-schema-refs.mjs`                                                       | exact — same Node.js ESM script shape: walk files, regex-extract literals, check against registry, exit 1 on miss |
| `tests/security/rls-audit.test.ts` (MODIFY)                | test       | request-response | self (existing `sensitiveTables` array + Supabase admin client pattern)                       | exact — extend existing test suite                                                                                |

---

## Pattern Assignments

### `supabase/migrations/YYYYMMDD_p68_clearance_canonical.sql` (migration, CRUD)

**Workstream:** REMED-01 (D-02, D-03)

**Analog:** `supabase/migrations/20250930001_helper_functions.sql` lines 42–62

**Current function body to replace (lines 43–62):**

```sql
-- T004: get_user_clearance_level() - Returns user's clearance level (1-3)
CREATE OR REPLACE FUNCTION get_user_clearance_level(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  clearance INTEGER;
BEGIN
  SELECT
    CASE ur.role
      WHEN 'admin' THEN 3
      WHEN 'manager' THEN 3
      WHEN 'analyst' THEN 2
      ELSE 1
    END INTO clearance
  FROM user_roles ur
  WHERE ur.user_id = get_user_clearance_level.user_id
  ORDER BY clearance DESC
  LIMIT 1;

  RETURN COALESCE(clearance, 1); -- Default to level 1 (low)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Target shim (copy this pattern, not the above):**

```sql
-- Step 1: Backfill profiles.clearance_level from role-derived mapping.
-- GUARD: WHERE clearance_level = 1 — never downgrade manually-set values.
-- The 5 users at clearance_level=3 must NOT be touched.
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

-- Step 2: Compat shim — rewrite to read profiles.clearance_level (1-4 scale).
CREATE OR REPLACE FUNCTION get_user_clearance_level(user_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(clearance_level, 1)
  FROM profiles
  WHERE profiles.user_id = get_user_clearance_level.user_id
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_user_clearance_level(UUID) IS
  'P68 compat shim: reads profiles.clearance_level (1-4 scale). '
  'Prior impl read user_roles (1-3 scale). '
  'All 5 existing RLS policies that call this function keep working unchanged.';
```

**Canonical clearance comparison already in repo** (from `supabase/migrations/20251022000009_update_polymorphic_refs.sql` lines 102 and 119 — the pattern all new policies should converge on):

```sql
sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())
```

**Landmine:** The `UPDATE ... WHERE clearance_level = 1` guard is load-bearing. If omitted, the 5 profiles already at level 3 may be incorrectly recomputed. Live data has `admin` users at both level 1 and level 3 — the guard preserves the manual level-3 settings.

---

### `supabase/migrations/YYYYMMDD_p68_search_invoker_rpc.sql` (migration, request-response)

**Workstream:** REMED-02 (D-05)

**Analog:** `supabase/migrations/20251004011_create_search_functions.sql` lines 157–234 (the existing `search_entities_semantic` — the SECURITY DEFINER function being superseded)

**Existing DEFINER function shape (do NOT copy security mode — copy only the RETURNS TABLE / JOIN structure):**

```sql
-- source: 20251004011_create_search_functions.sql lines 157–170
CREATE OR REPLACE FUNCTION search_entities_semantic(
  p_entity_type text,
  p_query_embedding vector(1536),   -- CHANGE: 1024 in new function
  p_similarity_threshold real DEFAULT 0.6,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  entity_id uuid,
  entity_title_en text,
  entity_title_ar text,
  similarity_score real,
  entity_type text,
  updated_at timestamptz
) AS $$
-- ... SECURITY DEFINER (DO NOT COPY — this is what we're replacing)
```

**New SECURITY INVOKER RPC to create (copy this pattern):**

```sql
-- NEW: search_semantic_clearance_gated
-- CRITICAL: SECURITY INVOKER so caller's RLS/clearance applies.
CREATE OR REPLACE FUNCTION search_semantic_clearance_gated(
  p_query_embedding vector(1024),     -- native 1024-dim; matches ai_embeddings.embedding
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
SECURITY INVOKER  -- CRITICAL: never DEFINER; caller's RLS enforces clearance
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

COMMENT ON FUNCTION search_semantic_clearance_gated IS
  'P68 SECURITY INVOKER replacement for search_entities_semantic (DEFINER). '
  'Joins ai_embeddings(1024) to dossiers with clearance gating. '
  'NEVER change to SECURITY DEFINER — v7.0 cross-cutting guarantee.';
```

**HNSW index (same migration or a separate one):**

```sql
CREATE INDEX idx_ai_embeddings_hnsw
ON ai_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

**Wave-0 read_first before coding:** Run `SELECT enum_range(NULL::embedding_owner_type)` on staging to confirm the enum values before writing INSERT path. This is Assumption A6 — unverified.

**Landmine:** The `ai_embeddings.embedding` column is typed `vector(1024)` (not `halfvec`). The new RPC parameter must match: `vector(1024)`, not `halfvec(1024)`. Keep `vector` for P68; `halfvec` is deferred to P72.

---

### `supabase/migrations/YYYYMMDD_p68_ai_embeddings_index.sql` (migration, batch)

**Workstream:** REMED-04 (D-05)

**Analog:** `supabase/migrations/012_setup_pgvector.sql` (HNSW index DDL blocks)

This migration may be folded into the search-invoker migration above. The key DDL is the HNSW block shown in the REMED-02 section. No separate pattern needed beyond confirming `pgvector 0.8.0` is present (confirmed by research).

---

### `backend/src/ai/agents/chat-assistant.ts` (MODIFY — service, request-response)

**Workstream:** REMED-03 (D-08, D-09, D-10)

**The import to remove (line 14):**

```typescript
import { supabaseAdmin } from '../../config/supabase.js'
```

**ChatRequest interface to extend (lines 36–42 — current shape):**

```typescript
export interface ChatRequest {
  message: string
  conversationHistory?: ChatMessage[]
  organizationId: string
  userId: string
  language?: 'en' | 'ar'
}
```

Add `authHeader: string` as a required field (the full `Bearer <token>` string).

**JWT-scoped client pattern to copy** (from `supabase/functions/search-semantic/index.ts` lines 167–174 — the exact pattern already used in the repo):

```typescript
// source: supabase/functions/search-semantic/index.ts lines 167–174
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  global: {
    headers: {
      Authorization: authHeader,
    },
  },
})
```

**For chat-assistant.ts specifically:** Use `SUPABASE_ANON_KEY` (not `supabaseServiceKey`) as the second arg so RLS applies correctly to role claims. The edge function uses service key + auth header override, which works for table queries but is a different trust model. The backend tool functions need the anon key path:

```typescript
import { createClient } from '@supabase/supabase-js'

// Inside each tool function, not at module level:
const supabaseClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
  global: { headers: { Authorization: authHeader } },
})
```

**5 tool functions that use `supabaseAdmin` — current calls to rewrite:**

| Function               | Lines    | From table                          | To table              | Select change needed                                                                                                                                            |
| ---------------------- | -------- | ----------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `searchEntities`       | ~158–228 | `dossiers` (×3 via `supabaseAdmin`) | `dossiers` (same)     | No select change; RLS auto-filters                                                                                                                              |
| `getDossier`           | ~230–258 | `dossiers`                          | `dossiers`            | No select change                                                                                                                                                |
| `queryCommitments`     | ~261–297 | `commitments`                       | `aa_commitments`      | Drop `source, responsible, timeline, tracking`; keep `id, title, title_ar, type, status, priority, due_date, owner_user_id, is_deleted, created_at, updated_at` |
| `getEngagementHistory` | ~300–327 | `engagements`                       | `engagement_dossiers` | Drop `location_en, location_ar`; keep `id, engagement_type, engagement_category, engagement_date`                                                               |
| `listDossiers`         | ~329–360 | `dossiers`                          | `dossiers`            | No change                                                                                                                                                       |

**Current `queryCommitments` body (lines 269–280 — what to replace):**

```typescript
let query = supabaseAdmin
  .from('commitments')
  .select(
    `
    id, title, type, status, priority,
    source, responsible, timeline, tracking,
    created_at, updated_at
  `,
  )
  .eq('is_deleted', false)
```

**Current `getEngagementHistory` body (lines 307–315 — what to replace):**

```typescript
const { data, error } = await supabaseAdmin
  .from('engagements')
  .select(
    `
    id, engagement_type, engagement_category,
    location_en, location_ar
  `,
  )
  .limit(input.limit || 10)
```

**Error handling pattern to preserve (already in file):**

```typescript
if (error) {
  logger.error('Query commitments failed', { error, input })
  return { commitments: [] }
}
// D-09: returning empty array is the correct "indistinguishable" behavior.
// DO NOT add 'filtered by clearance' or 'access denied' messaging.
```

**Landmine (Pitfall 3 from research):** `aa_commitments` does NOT have `source, responsible, timeline, tracking` columns. Selecting them will cause a 400. Verify exact columns via `SELECT column_name FROM information_schema.columns WHERE table_name='aa_commitments'` before coding (Assumption A2).

**Landmine (Pitfall 4 from research):** `backend/src/api/ai/chat.ts` also uses `supabaseAdmin` for operational logging writes to `ai_runs`, `ai_messages`, `ai_tool_calls`. These ARE correct to keep as service-role (logging writes, not user data reads). Do NOT touch those uses. Audit the file separately to confirm no user-facing READ goes through `supabaseAdmin` there.

---

### `backend/src/api/ai/chat.ts` (MODIFY — controller, request-response)

**Workstream:** REMED-03 (D-08)

This file passes the `ChatRequest` to `chatAssistantAgent`. It has access to `req.headers.authorization` (confirmed by RF-2: `supabaseAuth` middleware runs before the chat route, populating both `req.user` and the raw header).

**Pattern:** Extend the `chatAssistantAgent` call to pass `authHeader`:

```typescript
// Add to the request construction in chat.ts (before calling chatAssistantAgent):
const authHeader = req.headers.authorization ?? ''
// Then include in ChatRequest payload:
const chatRequest: ChatRequest = {
  message: ...,
  organizationId: ...,
  userId: req.user!.id,
  authHeader,  // ADD THIS
}
```

**No new imports needed** — `req.headers.authorization` is the raw Express header string (already `Bearer <token>` format from `authenticateToken`).

---

### `backend/src/ai/mastra-config.ts` (MODIFY — service, event-driven)

**Workstream:** REMED-05 (D-11)

**Analog:** self — the existing `initializeMastra()` method (lines 39–46):

```typescript
// current (lines 39–46):
private initializeMastra(): void {
  try {
    this.mastra = new Mastra({})
    logger.info('Mastra initialized successfully')
  } catch (error) {
    logger.error('Failed to initialize Mastra', { error })
  }
}
```

**Target pattern (extend the `new Mastra({})` call):**

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc'

private initializeMastra(): void {
  try {
    const otelExporter = new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://phoenix:4317',
    })

    this.mastra = new Mastra({
      telemetry: {
        serviceName: 'intl-dossier-ai',
        exporter: otelExporter,
      },
    })
    logger.info('Mastra initialized with OTel telemetry')
  } catch (error) {
    logger.error('Failed to initialize Mastra', { error })
    this.mastra = new Mastra({})  // fallback: no telemetry, don't block startup
  }
}
```

**Wave-0 read_first:** Run `cat backend/package.json | grep mastra` to confirm the `@mastra/core` version. Mastra's `telemetry` config shape changed between minor versions. If the version is older than 0.4.x, the `telemetry.exporter` key may not exist — consult the version's own docs before coding.

---

### `deploy/docker-compose.prod.yml` (MODIFY — config)

**Workstream:** REMED-05 (D-11)

**Analog:** existing `anythingllm` service block (lines 131–165 in docker-compose.prod.yml) and `redis` block (lines 103–126) — copy the service-block structure.

**Pattern to follow (from `anythingllm` block, lines 131–165):**

```yaml
anythingllm:
  image: mintplexlabs/anythingllm:latest
  container_name: intl-dossier-anythingllm
  restart: unless-stopped
  expose:
    - '3001'
  volumes:
    - anythingllm_data:/app/server/storage
  environment: ...
  healthcheck:
    test: ['CMD', 'curl', '-f', 'http://localhost:3001/api/health']
    interval: 30s
    timeout: 10s
  networks:
    - intl-dossier
```

**New services to add (copy same structure):**

```yaml
langfuse:
  image: langfuse/langfuse:latest
  container_name: intl-dossier-langfuse
  restart: unless-stopped
  expose:
    - '3000'
  environment:
    DATABASE_URL: ${LANGFUSE_DATABASE_URL}
    NEXTAUTH_URL: http://langfuse:3000
    NEXTAUTH_SECRET: ${LANGFUSE_SECRET}
    SALT: ${LANGFUSE_SALT}
  healthcheck:
    test:
      [
        'CMD',
        'wget',
        '--no-verbose',
        '--tries=1',
        '--spider',
        'http://localhost:3000/api/public/health',
      ]
    interval: 30s
    timeout: 10s
    retries: 3
  networks:
    - intl-dossier

phoenix:
  image: arizephoenix/phoenix:latest
  container_name: intl-dossier-phoenix
  restart: unless-stopped
  expose:
    - '6006' # UI
    - '4317' # OTLP gRPC (backend sends traces here)
  healthcheck:
    test: ['CMD', 'wget', '--no-verbose', '--tries=1', '--spider', 'http://localhost:6006']
    interval: 30s
    timeout: 10s
    retries: 3
  networks:
    - intl-dossier
```

**Add to `.env` template (and droplet `.env`):** `LANGFUSE_DATABASE_URL`, `LANGFUSE_SECRET`, `LANGFUSE_SALT`, `OTEL_EXPORTER_OTLP_ENDPOINT=http://phoenix:4317`.

**Zero-egress constraint:** Both containers must be in the `intl-dossier` Docker network only. No external OTLP endpoints. The `OTEL_EXPORTER_OTLP_ENDPOINT` env var in the backend must point to `http://phoenix:4317` (within-network DNS), not any external host.

---

### `scripts/check-i18n-namespaces.mjs` (NEW — utility, batch)

**Workstream:** REMED-06 (D-12)

**Analog:** `scripts/check-edge-fn-schema-refs.mjs` — same Node.js ESM script shape: walk source files, regex-extract string literals, check against a registry, exit 1 on any miss.

**Key structural pattern to copy (from `scripts/check-edge-fn-schema-refs.mjs` lines 1–56):**

```javascript
/* global console, process */
// One-line purpose comment.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptPath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(scriptPath), '..')

// Regex to extract useTranslation namespace args:
// handles both string form: useTranslation('ns')
// and array form: useTranslation(['ns1', 'ns2'])
const STRING_FORM = /useTranslation\(\s*['"]([^'"]+)['"]/g
const ARRAY_FORM = /useTranslation\(\s*\[([^\]]+)\]/g

// Walk .tsx/.ts source files (same walkTsFiles pattern as check-edge-fn-schema-refs.mjs)
function walkFiles(root, dir = root) {
  if (!fs.existsSync(root)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name)
    if (entry.isDirectory()) return walkFiles(root, absolute)
    if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) return [absolute]
    return []
  })
}

// Extract registered namespace keys from src/i18n/index.ts
// Pattern: `import en<Ns> from './en/<ns>.json'` → ns key is the import specifier name
// OR: parse the `resources:` object keys
// Exit 1 on any unregistered namespace → fails the Lint job
```

**Wire into the `Lint` step (append to `frontend/package.json` lint script):**

```json
// Current (line 17 of frontend/package.json):
"lint": "cd .. && eslint -c eslint.config.mjs --max-warnings 0 'frontend/src/**/*.{ts,tsx}'"

// After P68:
"lint": "cd .. && eslint -c eslint.config.mjs --max-warnings 0 'frontend/src/**/*.{ts,tsx}' && node scripts/check-i18n-namespaces.mjs"
```

**Array-form edge case:** `useTranslation(['ns1', 'ns2'])` must also be caught. The `ARRAY_FORM` regex above extracts the bracket content; then split on `','` and trim each element to get individual namespace strings.

**Namespace registry source:** `frontend/src/i18n/index.ts` registers ~110+ namespaces via static imports. The script can extract registered keys by parsing `import en<Foo> from './en/<foo>.json'` lines — the import names give the set of registered namespace module variables. Or simpler: extract the `resources: { en: { ... }, ar: { ... } }` object's top-level keys.

---

### `tests/security/rls-audit.test.ts` (MODIFY — test, request-response)

**Workstream:** REMED-01, REMED-02 verification

**Analog:** self — extend the existing `sensitiveTables` array and the `it('sensitive tables have org-scoped policies')` pattern (lines 35–117).

**Existing `sensitiveTables` array (lines 35–41 — extend this):**

```typescript
const sensitiveTables = [
  'persons',
  // Phase 54 additions:
  'intelligence_event',
  'intelligence_digest',
  'dashboard_digest',
]
```

**New clearance assertion pattern to add (mirrors the existing `hasOrgPolicy` check at lines 105–116):**

```typescript
// Add a new it() block in the describe:
it('REMED-01: get_user_clearance_level() reads profiles.clearance_level (shim verification)', async () => {
  // Verify the shim function signature via pg_proc
  const { data, error } = await supabaseAdmin.rpc('get_user_clearance_level', {
    user_id: '00000000-0000-0000-0000-000000000000', // nonexistent user — should return 1 (COALESCE default)
  })
  expect(error).toBeNull()
  expect(data).toBe(1) // COALESCE(null, 1) for nonexistent user
})

it('REMED-01: low-clearance user (level 1) cannot SELECT level-2 dossier via JWT client', async () => {
  // This is a live-staging test: seed a level-2 dossier, create a JWT client
  // for a level-1 user, assert 0 rows returned.
  // Pattern: use createClient(url, anonKey, { global: { headers: { Authorization: jwtToken } } })
  // then assert (await supabaseUser.from('dossiers').select('id').eq('sensitivity_level', 2)).data?.length === 0
})
```

**Existing client construction pattern to reuse (lines 49–52):**

```typescript
supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})
```

---

## Shared Patterns

### Canonical Clearance Comparison

**Source:** `supabase/migrations/20251022000009_update_polymorphic_refs.sql` lines 100–103 and 116–120
**Apply to:** All new RLS policies and any new RPC WHERE clauses that gate by content sensitivity

```sql
-- For RLS policies on tables joined to dossiers:
sensitivity_level <= (SELECT clearance_level FROM profiles WHERE id = auth.uid())

-- For SECURITY INVOKER RPCs (profiles.user_id vs profiles.id may differ — use user_id):
AND d.sensitivity_level <= (
  SELECT clearance_level FROM profiles WHERE user_id = auth.uid()
)
```

**Note:** The `profiles` table uses `user_id` as PK (confirmed RF-3 live query: column is `user_id uuid NOT NULL`). Some older policies use `WHERE id = auth.uid()` (a different column that may alias it). For new migrations: use `WHERE user_id = auth.uid()`.

### JWT-Scoped Supabase Client (Backend)

**Source:** `supabase/functions/search-semantic/index.ts` lines 167–174 (adapted for backend Node.js)
**Apply to:** All backend tool functions in `chat-assistant.ts` that previously used `supabaseAdmin` for user-data reads

```typescript
import { createClient } from '@supabase/supabase-js'

// Use ANON_KEY (not SERVICE_ROLE_KEY) so role claims apply
const supabaseClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
  global: { headers: { Authorization: authHeader } },
})
```

### Error Handling / Indistinguishable Empty (D-09)

**Source:** `backend/src/ai/agents/chat-assistant.ts` lines 288–296 (existing empty-return pattern)
**Apply to:** All rewritten tool functions in chat-assistant.ts

```typescript
if (error) {
  logger.error('Query failed', { error, input })
  return { results: [] } // empty array, not an error response
}
// D-09 enforcement: never return a message indicating content was filtered by clearance.
// RLS returns [] when access is denied — that IS the correct response.
```

### Migration File Naming

**Source:** Existing migration files (e.g., `20251022000009_update_polymorphic_refs.sql`)
**Apply to:** All three new migration files

- Format: `YYYYMMDD<seq>_<description>.sql` where `<seq>` is a 6-digit disambiguator (e.g., `000001`)
- All applied via Supabase MCP to staging `zkrcjzdemdmwhearhfgg`, then committed as forward migrations

### Docker Service Block

**Source:** `deploy/docker-compose.prod.yml` lines 103–165 (redis + anythingllm blocks)
**Apply to:** Langfuse and Phoenix service definitions
All services must include: `image`, `container_name`, `restart: unless-stopped`, `expose`, `healthcheck`, `networks: - intl-dossier`. Never use `ports:` for internal-only services (use `expose:` + nginx routing or direct in-network access).

---

## No Analog Found

None. All 9 targets have usable analogs in the codebase. The closest gap is the `check-i18n-namespaces.mjs` script (no prior i18n-scan script), but `check-edge-fn-schema-refs.mjs` is a strong structural match.

---

## Wave-0 Verifications (Read First Before Coding)

These are Assumptions A1–A6 from RESEARCH.md that were not confirmed live. The planner must schedule these as Wave-0 tasks before implementation begins:

| Assumption                                         | Query to run on staging                                                                                               | Risk if wrong                                                                                 |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| A1: `search_entities_fulltext` is SECURITY INVOKER | `SELECT prosecdef FROM pg_proc WHERE proname='search_entities_fulltext'` — must be `false`                            | If `true`, fulltext fallback also bypasses RLS; adds a second DEFINER→INVOKER RPC replacement |
| A2: `aa_commitments` column list                   | `SELECT column_name FROM information_schema.columns WHERE table_name='aa_commitments' ORDER BY ordinal_position`      | chat-assistant repoint will 400 if select list includes nonexistent columns                   |
| A3: `engagement_dossiers` column list              | `SELECT column_name FROM information_schema.columns WHERE table_name='engagement_dossiers' ORDER BY ordinal_position` | Same — `getEngagementHistory` repoint will 400                                                |
| A4: BGE-M3 ONNX native output dimension            | Log `embedding.length` before any truncation in `embedLocal()` at runtime                                             | If model emits != 1024, native writes land at wrong dimension                                 |
| A5: Langfuse/Phoenix Docker port mapping           | Verify after first `docker compose up` with `curl http://localhost:6006`                                              | Minor — port config only                                                                      |
| A6: `embedding_owner_type` enum values             | `SELECT enum_range(NULL::embedding_owner_type)` on staging                                                            | If 'dossier' not in enum, `ai_embeddings` INSERT for dossier entities will fail CHECK         |

---

## Metadata

**Analog search scope:** `supabase/migrations/`, `backend/src/ai/`, `supabase/functions/search-semantic/`, `deploy/`, `scripts/`, `tests/security/`, `eslint.config.mjs`, `frontend/src/i18n/`
**Files scanned:** 14 source files read directly; 3 bash searches over migrations dir
**Pattern extraction date:** 2026-06-14

## PATTERN MAPPING COMPLETE
