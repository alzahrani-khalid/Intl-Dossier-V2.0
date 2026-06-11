# Phase 54: Intelligence Engine Schema Groundwork - Pattern Map

**Mapped:** 2026-05-16
**Files analyzed:** 16 (8 created · 8 modified · 2 deleted/renamed)
**Analogs found:** 12 / 13 (1 invented per RESEARCH spec — junction RLS)

---

## File Classification

| New/Modified File                                                                   | Role                             | Data Flow        | Closest Analog                                                                                                                                 | Match Quality                        |
| ----------------------------------------------------------------------------------- | -------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `supabase/migrations/20260516000001_phase54_rename_phase45_intelligence_digest.sql` | migration (rename)               | DDL / metadata   | none in-repo (no prior `ALTER TABLE ... RENAME` on a tenant-scoped RLS-enabled table)                                                          | invented (PG semantics)              |
| `supabase/migrations/20260516000002_phase54_intelligence_event_and_digest.sql`      | migration (create tables + enum) | DDL / CRUD-RLS   | `supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql` L8-67                                                                | exact                                |
| `supabase/migrations/20260516000003_phase54_intelligence_event_dossiers.sql`        | migration (junction)             | DDL / CRUD-RLS   | `supabase/migrations/20260116500001_create_work_item_dossiers.sql` L11-57 (table shape); RLS pattern: invented per D-13 / RESEARCH § Pattern 2 | partial (shape match · RLS invented) |
| `tests/integration/intelligence-event-rls.test.ts`                                  | test (integration)               | request-response | `tests/integration/polymorphic-document-rls.test.ts` L1-199                                                                                    | exact                                |
| `tests/integration/intelligence-event-dossiers-rls.test.ts`                         | test (integration)               | request-response | `tests/integration/polymorphic-document-rls.test.ts` L1-199                                                                                    | exact                                |
| `frontend/src/hooks/useDashboardDigest.ts`                                          | hook (rename target)             | request-response | `frontend/src/hooks/useIntelligenceDigest.ts` L1-41 (verbatim, two strings swap)                                                               | exact                                |
| `frontend/src/hooks/__tests__/useDashboardDigest.test.ts`                           | test (rename target)             | request-response | `frontend/src/hooks/__tests__/useIntelligenceDigest.test.ts` L1-100 (verbatim, string swaps)                                                   | exact                                |
| `.planning/phases/54-intelligence-engine-schema-groundwork/54-PATTERNS.md`          | doc                              | n/a              | this file                                                                                                                                      | self                                 |
| `backend/src/types/database.types.ts`                                               | types (regen)                    | n/a              | MCP `generate_typescript_types` output — no analog needed                                                                                      | n/a                                  |
| `frontend/src/types/database.types.ts`                                              | types (regen)                    | n/a              | MCP `generate_typescript_types` output — no analog needed                                                                                      | n/a                                  |
| `supabase/seed/060-dashboard-demo.sql`                                              | seed update                      | DDL              | self (L104 + L342 + L367 — `intelligence_digest` → `dashboard_digest`)                                                                         | self                                 |
| `frontend/src/pages/Dashboard/widgets/Digest.tsx`                                   | component (consumer)             | request-response | self (L25 + L53 import/call rename)                                                                                                            | self                                 |
| `frontend/src/pages/Dashboard/widgets/__tests__/Digest.test.tsx`                    | test (consumer)                  | request-response | self (L22, L32, L61, L72, L77, L90, L97, L105, L116, L144, L158 string swaps)                                                                  | self                                 |
| `tests/security/rls-audit.test.ts`                                                  | test (security audit)            | request-response | self (L66-79 `sensitiveTables` array extension)                                                                                                | self                                 |
| `.planning/REQUIREMENTS.md`                                                         | doc                              | text patch       | self (INTEL-01..05 text patches)                                                                                                               | self                                 |
| `.planning/ROADMAP.md`                                                              | doc                              | text patch       | self (Phase 54 success-criterion #3)                                                                                                           | self                                 |
| (delete) `frontend/src/hooks/useIntelligenceDigest.ts`                              | hook removal                     | n/a              | replaced by `useDashboardDigest.ts`                                                                                                            | n/a                                  |
| (delete) `frontend/src/hooks/__tests__/useIntelligenceDigest.test.ts`               | test removal                     | n/a              | replaced by `useDashboardDigest.test.ts`                                                                                                       | n/a                                  |

---

## Pattern Assignments

### `supabase/migrations/20260516000001_phase54_rename_phase45_intelligence_digest.sql` (migration · rename)

**Analog:** None in-repo for the `ALTER TABLE ... RENAME` flow itself. Pattern is grounded in standard Postgres semantics (verified in RESEARCH § Pattern 3): policies, indexes, FKs, GRANTs, triggers follow the table automatically; policy/index names stay stale until explicitly renamed.

**RESEARCH-vouched SQL skeleton** (RESEARCH lines 348-373, verbatim — copy this into the plan):

```sql
-- Phase 54 plan 1: free the canonical name for the v7.0 spec
ALTER TABLE IF EXISTS public.intelligence_digest RENAME TO dashboard_digest;

-- Optional but recommended: rename the indexes for clarity
ALTER INDEX IF EXISTS public.idx_intelligence_digest_org_occurred_at
  RENAME TO idx_dashboard_digest_org_occurred_at;
ALTER INDEX IF EXISTS public.idx_intelligence_digest_dossier
  RENAME TO idx_dashboard_digest_dossier;
ALTER INDEX IF EXISTS public.idx_intelligence_digest_source_publication
  RENAME TO idx_dashboard_digest_source_publication;

-- Optional but recommended: rename the RLS policies for clarity
ALTER POLICY intelligence_digest_select_org ON public.dashboard_digest
  RENAME TO dashboard_digest_select_org;
ALTER POLICY intelligence_digest_insert_editor ON public.dashboard_digest
  RENAME TO dashboard_digest_insert_editor;
ALTER POLICY intelligence_digest_update_editor ON public.dashboard_digest
  RENAME TO dashboard_digest_update_editor;
ALTER POLICY intelligence_digest_delete_admin ON public.dashboard_digest
  RENAME TO dashboard_digest_delete_admin;

COMMENT ON TABLE public.dashboard_digest IS
  'Dashboard headline feed (Phase 45). Renamed from intelligence_digest in Phase 54 '
  'to free the canonical name for the v7.0 spec-compliant intelligence_digest.';
```

**Ordering rule (Pitfall 1):** this migration MUST land in an earlier wave than the create-tables migration (plan 2). MCP `apply_migration` will otherwise reject the new `intelligence_digest` with SQLSTATE `42P07` (duplicate_table).

**Anti-pattern:** Do NOT retro-edit `supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql` (CONTEXT D-03). Migrations are append-only history.

---

### `supabase/migrations/20260516000002_phase54_intelligence_event_and_digest.sql` (migration · create)

**Analog:** `supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql` L8-67 — Phase-45 four-policy template.

**Imports / preamble pattern** (none — pure DDL).

**Enum creation pattern (idempotent guard, first-of-its-kind in this codebase — D-09):**

```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'signal_source_type') THEN
    CREATE TYPE public.signal_source_type AS ENUM (
      'publication',
      'feed',
      'human_entered',
      'ai_generated'
    );
  END IF;
END$$;
```

**Table creation pattern** — verbatim Phase-45 shape (analog L8-20). Substitute column list:

```sql
-- Source pattern: 20260507210000_phase45_intelligence_digest_seed.sql L8-20
CREATE TABLE IF NOT EXISTS public.intelligence_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source_type public.signal_source_type NOT NULL,
  source_ref TEXT,
  content TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  severity TEXT NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low', 'medium', 'high', 'urgent')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Index pattern** — Phase-45 style (analog L22-28). `CREATE INDEX IF NOT EXISTS` + partial WHERE for nullable cols:

```sql
-- Source pattern: 20260507210000_phase45_intelligence_digest_seed.sql L22-28
CREATE INDEX IF NOT EXISTS idx_intelligence_event_org_occurred_at
  ON public.intelligence_event (organization_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_event_org_severity
  ON public.intelligence_event (organization_id, severity)
  WHERE severity IN ('high', 'urgent');
CREATE INDEX IF NOT EXISTS idx_intelligence_event_source_type
  ON public.intelligence_event (source_type);
CREATE INDEX IF NOT EXISTS idx_intelligence_event_created_by
  ON public.intelligence_event (created_by)
  WHERE created_by IS NOT NULL;
```

**RLS four-policy block — verbatim Phase-45 template (analog L30-67):**

```sql
-- Source: 20260507210000_phase45_intelligence_digest_seed.sql L30-67
-- Verbatim with table-name swap. Pitfall 6: DELETE policy is helper-only.
ALTER TABLE public.intelligence_event ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS intelligence_event_select_org ON public.intelligence_event;
CREATE POLICY intelligence_event_select_org
  ON public.intelligence_event FOR SELECT
  TO authenticated
  USING (tenant_isolation.rls_select_policy(organization_id));

DROP POLICY IF EXISTS intelligence_event_insert_editor ON public.intelligence_event;
CREATE POLICY intelligence_event_insert_editor
  ON public.intelligence_event FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_isolation.rls_insert_policy(organization_id)
    AND public.auth_has_any_role(ARRAY['admin', 'editor'])
  );

DROP POLICY IF EXISTS intelligence_event_update_editor ON public.intelligence_event;
CREATE POLICY intelligence_event_update_editor
  ON public.intelligence_event FOR UPDATE
  TO authenticated
  USING (
    tenant_isolation.rls_update_policy(organization_id)
    AND public.auth_has_any_role(ARRAY['admin', 'editor'])
  )
  WITH CHECK (
    tenant_isolation.rls_update_policy(organization_id)
    AND public.auth_has_any_role(ARRAY['admin', 'editor'])
  );

DROP POLICY IF EXISTS intelligence_event_delete_admin ON public.intelligence_event;
CREATE POLICY intelligence_event_delete_admin
  ON public.intelligence_event FOR DELETE
  TO authenticated
  USING (tenant_isolation.rls_delete_policy(organization_id));

GRANT SELECT ON public.intelligence_event TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.intelligence_event TO authenticated;
```

**Note (Pitfall 6 — DO NOT add `AND public.auth_has_any_role(ARRAY['admin'])` to the DELETE policy.** `tenant_isolation.rls_delete_policy(organization_id)` (defined in `20260113500001_tenant_isolation_layer.sql` L262-284) already gates on `auth_has_role('admin')` internally. Match Phase-45 byte-for-byte.

**New `intelligence_digest` (spec shape) pattern** — same four-policy block (analog L30-67, swapped table name). Table shape from RESEARCH § Code Examples L558-569:

```sql
CREATE TABLE IF NOT EXISTS public.intelligence_digest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  dossier_type TEXT NOT NULL
    CHECK (dossier_type IN ('country','organization','forum','engagement','topic','working_group','person')),
  dossier_id UUID NOT NULL REFERENCES public.dossiers(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL CHECK (period_end > period_start),
  summary TEXT NOT NULL,
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

The `dossier_type` 7-value CHECK literal is sourced verbatim from `supabase/migrations/20260202000001_merge_elected_official_into_person.sql` L194-204 — the canonical post-merge `dossiers_type_check` enum.

---

### `supabase/migrations/20260516000003_phase54_intelligence_event_dossiers.sql` (migration · junction)

**Analog (table shape only):** `supabase/migrations/20260116500001_create_work_item_dossiers.sql` L11-57.

**Surrogate UUID PK pattern** (analog L11-13) — matches `work_item_dossiers` precedent, picked over composite PK per CONTEXT discretion + RESEARCH "Don't Hand-Roll" recommendation:

```sql
-- Source: 20260116500001_create_work_item_dossiers.sql L11-13
CREATE TABLE IF NOT EXISTS public.intelligence_event_dossiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.intelligence_event(id) ON DELETE CASCADE,
  dossier_type TEXT NOT NULL
    CHECK (dossier_type IN ('country','organization','forum','engagement','topic','working_group','person')),
  dossier_id UUID NOT NULL REFERENCES public.dossiers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**UNIQUE on triple pattern** (analog L55-57, simplified — no soft-delete column on this junction):

```sql
-- Source pattern: 20260116500001_create_work_item_dossiers.sql L55-57
-- Adapted: no `WHERE deleted_at IS NULL` since this junction has no soft-delete.
CREATE UNIQUE INDEX IF NOT EXISTS idx_intelligence_event_dossiers_unique
  ON public.intelligence_event_dossiers (event_id, dossier_type, dossier_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_event_dossiers_dossier
  ON public.intelligence_event_dossiers (dossier_type, dossier_id);
```

**RLS pattern — NEW for this codebase (D-13, RESEARCH § Pattern 2).** No direct analog — `work_item_dossiers` uses clearance-level / ownership RLS (analog L117-193), NOT tenancy-via-parent. The EXISTS-via-parent pattern is verbatim-quoted from RESEARCH § Code Examples L604-669:

```sql
ALTER TABLE public.intelligence_event_dossiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS intelligence_event_dossiers_select ON public.intelligence_event_dossiers;
CREATE POLICY intelligence_event_dossiers_select
  ON public.intelligence_event_dossiers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.intelligence_event ie
      WHERE ie.id = intelligence_event_dossiers.event_id
        AND tenant_isolation.rls_select_policy(ie.organization_id)
    )
  );

DROP POLICY IF EXISTS intelligence_event_dossiers_insert ON public.intelligence_event_dossiers;
CREATE POLICY intelligence_event_dossiers_insert
  ON public.intelligence_event_dossiers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.intelligence_event ie
      WHERE ie.id = intelligence_event_dossiers.event_id
        AND tenant_isolation.rls_insert_policy(ie.organization_id)
        AND public.auth_has_any_role(ARRAY['admin','editor'])
    )
  );

DROP POLICY IF EXISTS intelligence_event_dossiers_update ON public.intelligence_event_dossiers;
CREATE POLICY intelligence_event_dossiers_update
  ON public.intelligence_event_dossiers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.intelligence_event ie
      WHERE ie.id = intelligence_event_dossiers.event_id
        AND tenant_isolation.rls_update_policy(ie.organization_id)
        AND public.auth_has_any_role(ARRAY['admin','editor'])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.intelligence_event ie
      WHERE ie.id = intelligence_event_dossiers.event_id
        AND tenant_isolation.rls_update_policy(ie.organization_id)
        AND public.auth_has_any_role(ARRAY['admin','editor'])
    )
  );

DROP POLICY IF EXISTS intelligence_event_dossiers_delete ON public.intelligence_event_dossiers;
CREATE POLICY intelligence_event_dossiers_delete
  ON public.intelligence_event_dossiers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.intelligence_event ie
      WHERE ie.id = intelligence_event_dossiers.event_id
        AND tenant_isolation.rls_delete_policy(ie.organization_id)
    )
  );

GRANT SELECT ON public.intelligence_event_dossiers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.intelligence_event_dossiers TO authenticated;
```

**No `organization_id` column on this junction (D-13).** Single source of truth for tenancy is the parent `intelligence_event` row.

---

### `tests/integration/intelligence-event-rls.test.ts` (test · integration)

**Analog:** `tests/integration/polymorphic-document-rls.test.ts` L1-199.

**Imports / setup pattern (analog L1-7):**

```typescript
// Source: tests/integration/polymorphic-document-rls.test.ts L1-7
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || ''
```

**Sign-in pattern (analog L17-26):**

```typescript
// Source: tests/integration/polymorphic-document-rls.test.ts L17-26
beforeAll(async () => {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: process.env.TEST_USER_EMAIL!,
    password: process.env.TEST_USER_PASSWORD!,
  })
  authToken = authData?.session?.access_token || ''
  userId = authData?.user?.id || ''
})
```

**Insert / select assertion pattern (analog L115-127):**

```typescript
// Source: tests/integration/polymorphic-document-rls.test.ts L115-127
it('should allow tenant-scoped insert and select of intelligence_event rows', async () => {
  const { data: events, error } = await supabase
    .from('intelligence_event')
    .select('*')
    .eq('organization_id', orgIdA)
  expect(error).toBeNull()
  expect(events).toBeDefined()
  expect(events?.length).toBeGreaterThan(0)
})
```

**Cross-tenant deny pattern (analog L156-198) — adapt for `organization_id=B` insert/select while signed in as org-A user.**

**Cleanup pattern (analog L108-113):**

```typescript
// Source: tests/integration/polymorphic-document-rls.test.ts L108-113
afterAll(async () => {
  await supabase.from('intelligence_event').delete().in('id', eventIds)
  // ... cascading deletes handle organizations/dossiers
})
```

**Phase-54-specific assertions:**

- INTEL-02 `period_end > period_start` CHECK: insert `period_end < period_start` → expect non-null error.
- INTEL-04 `signal_source_type` enum: insert `source_type: 'invalid_value'` → expect non-null error.
- INTEL-01 severity CHECK: insert `severity: 'critical'` → expect non-null error (only `low|medium|high|urgent` allowed).

---

### `tests/integration/intelligence-event-dossiers-rls.test.ts` (test · integration)

**Analog:** `tests/integration/polymorphic-document-rls.test.ts` L1-199 — same template as above.

**Phase-54-specific assertion list (RESEARCH § Phase Requirements → Test Map L779-781):**

1. INTEL-03 CHECK: insert with `dossier_type='elected_official'` → fails (only 7 valid types).
2. INTEL-03 tenancy: user from org A inserts event(org=A) + junction row → succeeds; user from org B `.select()` on junction → zero rows for org A's links.
3. INTEL-03 cascade: insert event + junction row, `delete()` event → junction row gone (`.select()` returns zero).

**Cleanup note:** No need to delete junction rows explicitly — `ON DELETE CASCADE` on `event_id` FK clears them when the parent event is deleted in `afterAll`.

---

### `frontend/src/hooks/useDashboardDigest.ts` (hook · rename target — NEW PATH, COPIES SOURCE)

**Analog:** `frontend/src/hooks/useIntelligenceDigest.ts` L1-41 (verbatim copy with two literal-string swaps and identifier renames).

**Full pattern (analog verbatim with marked edits — RESEARCH § Code Examples L676-714):**

```typescript
// Source: frontend/src/hooks/useIntelligenceDigest.ts L1-41
// Edits: (a) interface rename, (b) `.from()` literal, (c) queryKey literal,
//        (d) error message string, (e) exported function name.
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface DashboardDigestRow {
  // was IntelligenceDigestRow
  id: string
  headline_en: string
  headline_ar: string | null
  summary_en: string | null
  summary_ar: string | null
  source_publication: string
  occurred_at: string
  dossier_id: string | null
  created_at: string
}

const DASHBOARD_DIGEST_SELECT = // was INTELLIGENCE_DIGEST_SELECT
  'id, headline_en, headline_ar, summary_en, summary_ar, source_publication, occurred_at, dossier_id, created_at'

export function useDashboardDigest( // was useIntelligenceDigest
  limit: number = 6,
): ReturnType<typeof useQuery<DashboardDigestRow[], Error>> {
  return useQuery<DashboardDigestRow[], Error>({
    queryKey: ['dashboard', 'dashboard-digest', limit], // was 'intelligence-digest'
    queryFn: async (): Promise<DashboardDigestRow[]> => {
      const { data, error } = await supabase
        .from('dashboard_digest') // was 'intelligence_digest'
        .select(DASHBOARD_DIGEST_SELECT)
        .order('occurred_at', { ascending: false })
        .limit(limit)
      if (error !== null && error !== undefined) {
        throw new Error(`Failed to fetch dashboard digest: ${error.message}`) // was 'intelligence digest'
      }
      return (data as DashboardDigestRow[]) ?? []
    },
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  })
}
```

**Anti-pattern (Pitfall 4):** Do NOT do a bulk find/replace `intelligence_signal` → `intelligence_event`. The literal `intelligence_signal` (singular) appears in `backend/src/api/entity-search.ts`, `backend/src/services/entity-search.service.ts`, `backend/src/services/link.service.ts`, `frontend/src/types/preview-layout.types.ts`, `frontend/src/types/multilingual-content.types.ts`, `frontend/src/i18n/{en,ar}/*.json`, `frontend/src/components/entity-links/EntitySearchDialog.tsx` — those refer to the EXISTING curated `intelligence_signals` (plural) table via the entity-types vocabulary. Phase 54 must NOT touch them.

---

### `frontend/src/hooks/__tests__/useDashboardDigest.test.ts` (test · rename target)

**Analog:** `frontend/src/hooks/__tests__/useIntelligenceDigest.test.ts` L1-100 (verbatim copy with literal swaps).

**Touch-point list (RESEARCH § Code Examples L719-725):**

- L24 `import { useIntelligenceDigest } from '../useIntelligenceDigest'` → `useDashboardDigest from '../useDashboardDigest'`
- L49 `describe('useIntelligenceDigest', ...)` → `'useDashboardDigest'`
- L50 `'queries intelligence_digest with publication source fields...'` → `'queries dashboard_digest ...'`
- L69 `renderHook(() => useIntelligenceDigest(), ...)` → `useDashboardDigest()`
- L75 `expect(fromMock).toHaveBeenCalledWith('intelligence_digest')` → `'dashboard_digest'`
- L88 `renderHook(() => useIntelligenceDigest(), ...)` → `useDashboardDigest()`
- L96 error-message regex `/^Failed to fetch intelligence digest: /` → `/^Failed to fetch dashboard digest: /`

**Mock builder pattern (analog L26-47) — unchanged. Supabase mock structure stays identical.**

---

### `frontend/src/pages/Dashboard/widgets/Digest.tsx` (component · MODIFIED — consumer)

**Self-analog — only two edits (RESEARCH § Code Examples L737-738):**

- L25 `import { useIntelligenceDigest, type IntelligenceDigestRow } from '@/hooks/useIntelligenceDigest'`
  → `import { useDashboardDigest, type DashboardDigestRow } from '@/hooks/useDashboardDigest'`
- L36 `function mapDigestToRow(row: IntelligenceDigestRow, ...)` → `(row: DashboardDigestRow, ...)`
- L53 `useIntelligenceDigest()` → `useDashboardDigest()`

All other lines (rendering, state, RTL utilities, GlobeSpinner overlay) stay byte-identical.

---

### `frontend/src/pages/Dashboard/widgets/__tests__/Digest.test.tsx` (test · MODIFIED — consumer)

**Self-analog — string swaps only (RESEARCH § Code Examples L729-733):**

- L22 `vi.mock('@/hooks/useIntelligenceDigest', ...)` → `'@/hooks/useDashboardDigest'`
- L32 `import { useIntelligenceDigest } from '@/hooks/useIntelligenceDigest'` → `useDashboardDigest from '@/hooks/useDashboardDigest'`
- L61 `Partial<ReturnType<typeof useIntelligenceDigest>>` → `useDashboardDigest`
- L72, L77, L90, L97, L105, L116, L144 `vi.mocked(useIntelligenceDigest)` → `useDashboardDigest` (7 sites)
- L158 `readFileSync('src/hooks/useIntelligenceDigest.ts', 'utf8')` → `'src/hooks/useDashboardDigest.ts'`

---

### `supabase/seed/060-dashboard-demo.sql` (seed · MODIFIED)

**Three concrete touch-points (verified via grep):**

- L104 `DELETE FROM intelligence_digest WHERE id::text LIKE 'b0000010-%';` → `DELETE FROM dashboard_digest ...`
- L342 `INSERT INTO intelligence_digest (id, organization_id, ...) VALUES ...` → `INSERT INTO dashboard_digest ...`
- L367 `RAISE NOTICE 'Seed 060 complete: ... 4 intelligence_digest.';` → `... 4 dashboard_digest.`

No other edits to this file. The seed body itself (column list, values, idempotent DELETE/INSERT pattern) is unchanged.

---

### `tests/security/rls-audit.test.ts` (test · MODIFIED)

**Self-analog — extend the `sensitiveTables` array at L66-79 (RESEARCH § Wave 0 Gaps L813):**

```typescript
// Source: tests/security/rls-audit.test.ts L66-79 (existing)
const sensitiveTables = [
  'countries',
  'organizations',
  'forums',
  'engagements',
  'topics',
  'working_groups',
  'persons',
  'elected_officials',
  'documents',
  'tasks',
  'commitments',
  'intelligence_signals',
  // Phase 54 additions:
  'intelligence_event', // NEW (D-04)
  'intelligence_digest', // NEW spec shape (INTEL-02)
  'dashboard_digest', // RENAMED from intelligence_digest (D-01)
]
```

No other test logic changes — the existing assertion (`hasOrgPolicy` check on L99-109) works as-is for the three new entries because all three use the `organization_id` column convention.

**Note:** The junction `intelligence_event_dossiers` is intentionally NOT added to `sensitiveTables` — it has no `organization_id` of its own (D-13). The existing `get_tables_without_rls` audit (L32-49) auto-catches it for the RLS-enabled assertion.

---

### `backend/src/types/database.types.ts` + `frontend/src/types/database.types.ts` (types · REGEN)

**No analog needed.** Output of `mcp__claude_ai_Supabase__generate_typescript_types(project_id='zkrcjzdemdmwhearhfgg')`. Both files must be byte-identical (RESEARCH Pitfall 5).

**Sanity grep after regen:**

```bash
# All four must return non-empty (RESEARCH § Pattern 4):
grep -q "intelligence_event:"          frontend/src/types/database.types.ts
grep -q "signal_source_type"           frontend/src/types/database.types.ts
grep -q "intelligence_event_dossiers:" frontend/src/types/database.types.ts
grep -q "dashboard_digest:"            frontend/src/types/database.types.ts

# Files must be byte-identical:
cmp backend/src/types/database.types.ts frontend/src/types/database.types.ts
```

---

### `.planning/REQUIREMENTS.md` (doc · MODIFIED)

**Text-only patches per CONTEXT D-07 + D-08:**

- `intelligence_signal` → `intelligence_event` (in INTEL-01/04 wording — but NOT in code references where `intelligence_signals` plural is the curated table)
- `tenant_id` → `organization_id` (column) / "tenant-scoped via organization_id" (semantics)
- INTEL-03 dossier-type list: drop `elected_official` (now 7 types, not 8)

**Validation grep (RESEARCH L790):**

```bash
! grep -E "intelligence_signal|tenant_id|elected_official" .planning/REQUIREMENTS.md | grep -v 'intelligence_signals'
```

---

### `.planning/ROADMAP.md` (doc · MODIFIED)

**Single text patch:** Phase 54 success-criterion #3 — "8 dossier types" → "7 dossier types".

**Validation grep (RESEARCH L791):**

```bash
! grep "elected_official" .planning/ROADMAP.md | grep "8 existing dossier types"
```

---

## Shared Patterns

### Tenant-scoped RLS helpers (applies to plans 2 + 3)

**Source:** `supabase/migrations/20260113500001_tenant_isolation_layer.sql` L185-284

Four pre-existing SECURITY DEFINER STABLE functions:

- `tenant_isolation.rls_select_policy(p_organization_id UUID)` — service-role bypass; admin sees all; member sees own org rows
- `tenant_isolation.rls_insert_policy(p_organization_id UUID)` — service-role bypass; member of target org
- `tenant_isolation.rls_update_policy(p_organization_id UUID)` — service-role bypass; admin always; editor if member
- `tenant_isolation.rls_delete_policy(p_organization_id UUID)` — service-role bypass; admin AND member of target org (role gate is INTERNAL to the helper — Pitfall 6)

**Apply to:** every Phase-54 tenant-scoped table policy. Helper signature locks the column name to `organization_id` (D-08).

### Role gate helper

**Source:** `supabase/migrations/011_rls_policies.sql` L198-208 (verified per RESEARCH § Standard Stack)
**Apply to:** INSERT + UPDATE policies on `intelligence_event` + `intelligence_digest`; INSERT + UPDATE EXISTS-subqueries on junction.

```sql
AND public.auth_has_any_role(ARRAY['admin', 'editor'])
```

### Idempotent guards (applies to all 3 migrations)

**Sources:** Phase-45 verbatim

- Tables: `CREATE TABLE IF NOT EXISTS`
- Indexes: `CREATE INDEX IF NOT EXISTS`
- Policies: `DROP POLICY IF EXISTS <name> ON ...; CREATE POLICY <name> ...`
- Enums: `DO $$ ... IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '...') THEN CREATE TYPE ... END IF; END$$;`

**Apply to:** every DDL statement in plans 1-3 so MCP `apply_migration` re-runs against staging are safe.

### Canonical 7-value `dossier_type` CHECK (plans 2 + 3)

**Source:** `supabase/migrations/20260202000001_merge_elected_official_into_person.sql` L194-204

```sql
CHECK (dossier_type IN (
  'country',
  'organization',
  'forum',
  'engagement',
  'topic',
  'working_group',
  'person'
))
```

**Apply to:** `intelligence_digest.dossier_type` AND `intelligence_event_dossiers.dossier_type`. Both literals MUST match this 7-value set byte-for-byte.

### RLS integration test template (plans validating tables 2 + 3)

**Source:** `tests/integration/polymorphic-document-rls.test.ts` L1-199

Sign-in via `process.env.TEST_USER_EMAIL` + `TEST_USER_PASSWORD` → create test entities in `beforeAll` → assert RLS behavior (select succeeds for owned org, fails for other org, CHECK constraint rejects bad input) → cleanup in `afterAll`.

**Apply to:** both new `tests/integration/intelligence-event-rls.test.ts` and `tests/integration/intelligence-event-dossiers-rls.test.ts`.

### Polymorphic junction surrogate UUID PK + UNIQUE on triple

**Source:** `supabase/migrations/20260116500001_create_work_item_dossiers.sql` L11-13 + L55-57

**Apply to:** `intelligence_event_dossiers` only. Pick surrogate UUID over composite PK per RESEARCH "Don't Hand-Roll" recommendation (matches `work_item_dossiers`; future-proofs for per-link metadata, soft delete, audit fields).

---

## No Analog Found

| File                                          | Role | Data Flow | Reason                                                                                                                                                                                                                                   |
| --------------------------------------------- | ---- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Junction RLS via EXISTS-on-parent (in plan 3) | DDL  | CRUD-RLS  | `work_item_dossiers` uses clearance + ownership, not tenancy-via-parent. The EXISTS-via-parent pattern is **new for this codebase** (RESEARCH § Pattern 2). Verbatim SQL is in RESEARCH § Code Examples L604-669.                        |
| Rename migration (plan 1)                     | DDL  | metadata  | No prior in-repo migration renames a tenant-scoped RLS-enabled table. Pattern is grounded in standard Postgres semantics: policies/indexes/FKs/GRANTs follow `ALTER TABLE ... RENAME TO`. Verbatim SQL in RESEARCH § Pattern 3 L348-373. |

---

## Metadata

**Analog search scope:**

- `supabase/migrations/` — `20260507210000_*`, `20260113500001_*`, `20260116500001_*`, `20260202000001_*`, `011_rls_policies.sql`
- `supabase/seed/060-dashboard-demo.sql`
- `tests/integration/polymorphic-document-rls.test.ts`
- `tests/security/rls-audit.test.ts`
- `frontend/src/hooks/useIntelligenceDigest.ts` + test
- `frontend/src/pages/Dashboard/widgets/Digest.tsx` + test
- `backend/src/types/database.types.ts` (grep only — confirmed `intelligence_signals:` block present, no `intelligence_event:`)

**Files scanned:** 12 read (full or targeted ranges) · 4 confirmed via grep · zero re-reads

**Pattern extraction date:** 2026-05-16
