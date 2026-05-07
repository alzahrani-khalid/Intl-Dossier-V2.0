-- Phase 45 schema-seed closure: intelligence_digest foundation
-- Seed source: supabase/seed/060-dashboard-demo.sql
--
-- This migration creates the tenant-scoped dashboard digest table used by
-- the Phase 45 dashboard data closure plans, then applies the idempotent
-- Phase 45 demo fixture deltas from the canonical seed source.

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

DO $$
DECLARE
  v_user_id UUID := 'de2734cf-f962-4e05-bf62-bc9e92efff96';
  v_d_escwa UUID := 'b0000001-0000-0000-0000-000000000002';
  v_d_china UUID := 'b0000001-0000-0000-0000-000000000004';
  v_d_oecd UUID := 'b0000001-0000-0000-0000-000000000005';
  v_d_gcc_stat UUID := 'b0000001-0000-0000-0000-000000000006';
  v_org_id UUID;
  v_country_indonesia UUID;
  v_p_indonesia_delegate UUID := 'b0000011-0000-0000-0000-000000000001';
BEGIN
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

  DELETE FROM intelligence_digest WHERE id::text LIKE 'b0000010-%';
  DELETE FROM engagement_participants WHERE id::text LIKE 'b0000012-%' OR participant_dossier_id::text LIKE 'b0000011-%';
  DELETE FROM persons WHERE id::text LIKE 'b0000011-%';
  DELETE FROM dossiers WHERE id::text LIKE 'b0000011-%';

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
END $$;
