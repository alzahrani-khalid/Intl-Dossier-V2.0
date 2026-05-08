---
phase: 45-schema-seed-closure
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql
  - supabase/seed/060-dashboard-demo.sql
autonomous: false
requirements: [DATA-01, DATA-04]
must_haves:
  truths:
    - 'D-01: Phase 45 creates only the bare dashboard digest table and does not introduce intelligence_signal, subscriptions, alerting, scheduled briefings, ingestion, or cross-dossier aggregation.'
    - 'D-02: intelligence_digest includes id, headline_en, headline_ar, summary_en, summary_ar, source_publication, occurred_at, nullable dossier_id, and created_at.'
    - 'D-03: intelligence_digest includes organization_id because nullable dossier_id cannot enforce tenant scoping.'
    - 'D-04: RLS reads are organization-scoped and writes are role-gated to admin/editor.'
    - 'D-11: supabase/seed/060-dashboard-demo.sql is the canonical seed path; frontend/seeds/060-dashboard-demo.sql is stale.'
    - 'D-13: the committed migration carries the idempotent dashboard demo seed body and references supabase/seed/060-dashboard-demo.sql in its header.'
    - 'D-14: the seed adds only intelligence_digest rows and the minimum VIP person/participant fixture.'
    - 'D-16: Codex fallback locked conservative defaults; update CONTEXT.md before execution if those defaults change.'
  artifacts:
    - path: 'supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql'
      provides: 'tenant-scoped intelligence_digest schema and idempotent staging apply artifact'
    - path: 'supabase/seed/060-dashboard-demo.sql'
      provides: 'canonical local dashboard demo seed source'
  key_links:
    - from: 'intelligence_digest.organization_id'
      to: 'tenant_isolation.rls_select_policy'
      via: 'organization-scoped read policy'
    - from: 'supabase/seed/060-dashboard-demo.sql'
      to: 'Phase 41 drawer E2E fixture'
      via: 'deterministic b00000xx fixture IDs'
---

# Plan 45-01: Schema And Seed Foundation

**Phase:** 45 (schema-seed-closure)
**Wave:** 1
**Depends on:** none
**Type:** implementation
**TDD:** false (SQL migration and deterministic seed source)
**Estimated effort:** M (4-6 h)

## Goal

Create the tenant-scoped `intelligence_digest` table and extend the canonical
dashboard seed with digest rows plus the minimum VIP person/participant fixture.
This plan creates source-controlled artifacts only; Plan 45-04 performs the
blocking Supabase MCP staging apply.

<execution_context>
@$HOME/.codex/get-shit-done/workflows/execute-plan.md
@$HOME/.codex/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/45-schema-seed-closure/45-CONTEXT.md
@.planning/phases/45-schema-seed-closure/45-RESEARCH.md
@.planning/phases/45-schema-seed-closure/45-VALIDATION.md
@.planning/phases/45-schema-seed-closure/45-PATTERNS.md
@CLAUDE.md
@supabase/migrations/20260113500001_tenant_isolation_layer.sql
@supabase/seed/060-dashboard-demo.sql
</context>

<threat_model>
T-45-01 cross-org digest leakage: mitigated by `organization_id UUID NOT NULL`
and `tenant_isolation.rls_select_policy(organization_id)`.
T-45-02 over-broad digest writes: mitigated by `public.auth_has_any_role(ARRAY['admin', 'editor'])`
in INSERT and UPDATE policies.
T-45-03 seed drift: mitigated by copying the same idempotent fixture block into
the canonical seed and the committed migration artifact.
Block on high severity: if RLS or seed idempotency cannot be verified, stop.
</threat_model>

## Files to create / modify

| Path                                                                      | Action | Notes                                                               |
| ------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------- |
| `supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql` | create | Schema, RLS, grants, indexes, and idempotent Phase 45 fixture block |
| `supabase/seed/060-dashboard-demo.sql`                                    | modify | Add matching digest and VIP fixture block to canonical local seed   |

<tasks>
<task id="45-01-01" type="execute">
<name>Create intelligence_digest schema migration</name>
<read_first>
- supabase/migrations/20260113500001_tenant_isolation_layer.sql
- supabase/migrations/013_rls_policies_content.sql
- supabase/migrations/024_intelligence_rls.sql
- .planning/phases/45-schema-seed-closure/45-CONTEXT.md
- .planning/phases/45-schema-seed-closure/45-RESEARCH.md
</read_first>
<files>
- create: supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql
</files>
<action>
Create `supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql`
with a header naming Phase 45 and `supabase/seed/060-dashboard-demo.sql` as the
source seed. The migration must contain:

```sql
CREATE TABLE IF NOT EXISTS public.intelligence_digest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  headline_en TEXT NOT NULL,
  headline_ar TEXT,
  summary_en TEXT,
  summary_ar TEXT,
  source_publication TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  dossier_id UUID REFERENCES public.dossiers(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_digest_org_occurred_at
  ON public.intelligence_digest (organization_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_digest_dossier
  ON public.intelligence_digest (dossier_id)
  WHERE dossier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_intelligence_digest_source_publication
  ON public.intelligence_digest (source_publication);

ALTER TABLE public.intelligence_digest ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS intelligence_digest_select_org ON public.intelligence_digest;
CREATE POLICY intelligence_digest_select_org
  ON public.intelligence_digest FOR SELECT
  TO authenticated
  USING (tenant_isolation.rls_select_policy(organization_id));

DROP POLICY IF EXISTS intelligence_digest_insert_editor ON public.intelligence_digest;
CREATE POLICY intelligence_digest_insert_editor
  ON public.intelligence_digest FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_isolation.rls_insert_policy(organization_id)
    AND public.auth_has_any_role(ARRAY['admin', 'editor'])
  );

DROP POLICY IF EXISTS intelligence_digest_update_editor ON public.intelligence_digest;
CREATE POLICY intelligence_digest_update_editor
  ON public.intelligence_digest FOR UPDATE
  TO authenticated
  USING (
    tenant_isolation.rls_update_policy(organization_id)
    AND public.auth_has_any_role(ARRAY['admin', 'editor'])
  )
  WITH CHECK (
    tenant_isolation.rls_update_policy(organization_id)
    AND public.auth_has_any_role(ARRAY['admin', 'editor'])
  );

DROP POLICY IF EXISTS intelligence_digest_delete_admin ON public.intelligence_digest;
CREATE POLICY intelligence_digest_delete_admin
  ON public.intelligence_digest FOR DELETE
  TO authenticated
  USING (tenant_isolation.rls_delete_policy(organization_id));

GRANT SELECT ON public.intelligence_digest TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.intelligence_digest TO authenticated;
```

Do not create `intelligence_signal`, subscription, alert, ingestion, briefing,
or aggregation tables.
</action>
<verify>
rg "CREATE TABLE IF NOT EXISTS public.intelligence_digest" supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql
rg "source_publication TEXT NOT NULL" supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql
rg "organization_id UUID NOT NULL REFERENCES public.organizations" supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql
rg "ALTER TABLE public.intelligence_digest ENABLE ROW LEVEL SECURITY" supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql
rg "tenant_isolation.rls_select_policy\\(organization_id\\)" supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql
rg "public.auth_has_any_role\\(ARRAY\\['admin', 'editor'\\]\\)" supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql
</verify>
<acceptance_criteria>

- `supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql` contains `CREATE TABLE IF NOT EXISTS public.intelligence_digest`.
- The migration contains every DATA-01 display column: `headline_en`, `headline_ar`, `summary_en`, `summary_ar`, `source_publication`, `occurred_at`, `dossier_id`, `created_at`.
- The migration contains `organization_id UUID NOT NULL REFERENCES public.organizations`.
- The migration contains `ALTER TABLE public.intelligence_digest ENABLE ROW LEVEL SECURITY`.
- The migration contains `tenant_isolation.rls_select_policy(organization_id)`.
- The migration contains `public.auth_has_any_role(ARRAY['admin', 'editor'])`.
- `rg "intelligence_signal|subscriber|alert|briefing|external feed|aggregation" supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql` returns no matches.
  </acceptance_criteria>
  </task>

<task id="45-01-02" type="execute">
<name>Add deterministic digest and VIP seed deltas</name>
<read_first>
- supabase/seed/060-dashboard-demo.sql
- supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql
- frontend/tests/e2e/support/dossier-drawer-fixture.ts
- .planning/phases/45-schema-seed-closure/45-PATTERNS.md
</read_first>
<files>
- modify: supabase/seed/060-dashboard-demo.sql
- modify: supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql
</files>
<action>
In `supabase/seed/060-dashboard-demo.sql`, add deterministic variables near
the existing `v_d_*` declarations:

```sql
v_org_id UUID;
v_country_indonesia UUID;
v_p_indonesia_delegate UUID := 'b0000011-0000-0000-0000-000000000001';
```

After `BEGIN`, resolve required tenant/country context and fail loudly if the
staging seed cannot be tenant-scoped:

```sql
SELECT tenant_isolation.resolve_user_tenant(v_user_id) INTO v_org_id;
IF v_org_id IS NULL THEN
  RAISE EXCEPTION 'Seed 060 requires an organization membership for user %', v_user_id;
END IF;

SELECT id INTO v_country_indonesia
FROM countries
WHERE iso_code_2 = 'ID'
LIMIT 1;
IF v_country_indonesia IS NULL THEN
  RAISE EXCEPTION 'Seed 060 requires countries.iso_code_2 = ID';
END IF;
```

Extend the cleanup block before deleting `dossiers`:

```sql
DELETE FROM intelligence_digest WHERE id::text LIKE 'b0000010-%';
DELETE FROM engagement_participants WHERE id::text LIKE 'b0000012-%' OR participant_dossier_id::text LIKE 'b0000011-%';
DELETE FROM persons WHERE id::text LIKE 'b0000011-%';
DELETE FROM dossiers WHERE id::text LIKE 'b0000011-%';
```

Add a new `INTELLIGENCE_DIGEST` section after the current `ACTIVITY_STREAM`
insert:

```sql
INSERT INTO intelligence_digest
  (id, organization_id, headline_en, headline_ar, summary_en, summary_ar,
   source_publication, occurred_at, dossier_id, created_by, created_at)
VALUES
  ('b0000010-0000-0000-0000-000000000001'::uuid, v_org_id,
   'Reuters flags China trade-data revisions', 'رويترز ترصد مراجعات بيانات التجارة الصينية',
   'Analysts should review the China readout before the next bilateral follow-up.',
   'ينبغي للمحللين مراجعة موجز الصين قبل المتابعة الثنائية القادمة.',
   'Reuters', NOW() - INTERVAL '25 minutes', v_d_china, v_user_id, NOW() - INTERVAL '25 minutes'),
  ('b0000010-0000-0000-0000-000000000002'::uuid, v_org_id,
   'Al Sharq covers GCC statistical data forum', 'الشرق تغطي منتدى البيانات الإحصائية الخليجي',
   'The item supports the GCC Statistical Centre dossier with a publication-named source.',
   'يدعم هذا البند ملف المركز الإحصائي الخليجي بمصدر يحمل اسم منشور.',
   'Al Sharq', NOW() - INTERVAL '2 hours', v_d_gcc_stat, v_user_id, NOW() - INTERVAL '2 hours'),
  ('b0000010-0000-0000-0000-000000000003'::uuid, v_org_id,
   'UN ESCWA publishes SDG data brief', 'الإسكوا تنشر موجز بيانات أهداف التنمية',
   'The digest row links the ESCWA dossier to a real publication label.',
   'يربط بند الموجز ملف الإسكوا بتسمية منشور حقيقية.',
   'UN ESCWA', NOW() - INTERVAL '4 hours', v_d_escwa, v_user_id, NOW() - INTERVAL '4 hours'),
  ('b0000010-0000-0000-0000-000000000004'::uuid, v_org_id,
   'OECD releases quarterly data-governance note', 'منظمة التعاون الاقتصادي تصدر مذكرة حوكمة بيانات ربع سنوية',
   'The item gives the dashboard a fourth seeded publication source.',
   'يمنح هذا البند لوحة التحكم مصدر منشور رابع مزروع.',
   'OECD Statistics Directorate', NOW() - INTERVAL '8 hours', v_d_oecd, v_user_id, NOW() - INTERVAL '8 hours');
```

Add a new `VIP PERSON PARTICIPANT` section after the `ENGAGEMENT_DOSSIERS`
insert:

```sql
INSERT INTO dossiers (id, type, name_en, name_ar, status, sensitivity_level, tags, metadata, created_by)
VALUES (
  v_p_indonesia_delegate, 'person', 'Dr. Sari Widodo', 'د. ساري ويدودو',
  'active', 2, ARRAY['handoff-demo', 'vip-visit'],
  '{"handoff_demo":true,"vip_seed":true}'::jsonb, v_user_id
);

INSERT INTO persons (id, title_en, title_ar, nationality_country_id)
VALUES (
  v_p_indonesia_delegate,
  'Head of delegation',
  'رئيسة الوفد',
  v_country_indonesia
);

INSERT INTO engagement_participants
  (id, engagement_id, participant_type, participant_dossier_id, role, attendance_status, created_by)
VALUES
  ('b0000012-0000-0000-0000-000000000001'::uuid,
   'b0000002-0000-0000-0000-000000000003'::uuid,
   'person',
   v_p_indonesia_delegate,
   'head_of_delegation',
   'confirmed',
   v_user_id);
```

Copy the same fixture logic into the migration file after the RLS/grant block
inside a `DO $$ ... END $$;` block. The migration header must include:
`-- Seed source: supabase/seed/060-dashboard-demo.sql`.
</action>
<verify>
rg "Seed source: supabase/seed/060-dashboard-demo.sql" supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql
rg "b0000010-0000-0000-0000-000000000001" supabase/seed/060-dashboard-demo.sql supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql
rg "source_publication|Reuters|Al Sharq|OECD Statistics Directorate" supabase/seed/060-dashboard-demo.sql supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql
rg "v_p_indonesia_delegate|engagement_participants|head_of_delegation|iso_code_2 = 'ID'" supabase/seed/060-dashboard-demo.sql supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql
</verify>
<acceptance_criteria>

- Both `supabase/seed/060-dashboard-demo.sql` and the new migration contain `b0000010-0000-0000-0000-000000000001`.
- Both files contain `Reuters`, `Al Sharq`, `UN ESCWA`, and `OECD Statistics Directorate`.
- Both files contain `v_p_indonesia_delegate`.
- Both files contain `engagement_participants` and `head_of_delegation`.
- Both files contain `tenant_isolation.resolve_user_tenant(v_user_id)`.
- Both files contain `iso_code_2 = 'ID'`.
- No file named `frontend/seeds/060-dashboard-demo.sql` is created.
  </acceptance_criteria>
  </task>
  </tasks>

## Verification

```bash
rg "CREATE TABLE IF NOT EXISTS public.intelligence_digest" supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql
rg "ALTER TABLE public.intelligence_digest ENABLE ROW LEVEL SECURITY" supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql
rg "tenant_isolation.rls_select_policy\\(organization_id\\)" supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql
rg "public.auth_has_any_role\\(ARRAY\\['admin', 'editor'\\]\\)" supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql
rg "b0000010|source_publication|v_p_indonesia_delegate|head_of_delegation" supabase/seed/060-dashboard-demo.sql supabase/migrations/20260507210000_phase45_intelligence_digest_seed.sql
```

## Requirements satisfied

- DATA-01 partial: schema, RLS, and migration artifact exist; staging apply is Plan 45-04.
- DATA-04 partial: canonical seed source and committed apply artifact exist; staging apply and Playwright run are Plan 45-04.

## Handoff notes

Plan 45-04 owns the blocking Supabase MCP apply. Do not claim DATA-01 or
DATA-04 complete until the staging project `zkrcjzdemdmwhearhfgg` has accepted
the migration/seed artifact through Supabase MCP.
