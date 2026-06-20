-- Phase 70 fixup: publish_digest must derive organization_id from the active
-- tenant membership source used by tenant_isolation.rls_insert_policy().
-- Staging verification found profiles.organization_id can diverge from
-- organization_members, causing SECURITY INVOKER publish inserts to fail RLS.

CREATE OR REPLACE FUNCTION public.publish_digest(
  p_dossier_id UUID,
  p_period TEXT,
  p_summary TEXT,
  p_clearance_level_at_generation INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_clearance INTEGER := 0;
  v_org_id UUID;
  v_dossier_type TEXT;
  v_digest_id UUID;
  v_until TIMESTAMPTZ := NOW();
  v_since TIMESTAMPTZ;
  v_frequency TEXT := COALESCE(NULLIF(p_period, ''), 'daily');
  v_period_key TEXT;
BEGIN
  SELECT COALESCE(p.clearance_level, 0)
  INTO v_clearance
  FROM public.profiles p
  WHERE p.user_id = auth.uid();

  v_org_id := tenant_isolation.get_current_tenant_id();

  v_frequency := CASE
    WHEN v_frequency IN ('daily', 'weekly', 'monthly') THEN v_frequency
    ELSE 'daily'
  END;

  v_since := CASE v_frequency
    WHEN 'daily' THEN v_until - INTERVAL '1 day'
    WHEN 'weekly' THEN v_until - INTERVAL '7 days'
    WHEN 'monthly' THEN v_until - INTERVAL '30 days'
    ELSE v_until - INTERVAL '1 day'
  END;

  v_period_key := CASE v_frequency
    WHEN 'weekly' THEN 'weekly-' || to_char(v_until AT TIME ZONE 'UTC', 'IYYY-"W"IW')
    WHEN 'monthly' THEN 'monthly-' || to_char(v_until AT TIME ZONE 'UTC', 'YYYY-MM')
    ELSE 'daily-' || to_char(v_until AT TIME ZONE 'UTC', 'YYYY-MM-DD')
  END;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No active organization membership for current user'
      USING ERRCODE = '42501';
  END IF;

  SELECT d.type
  INTO v_dossier_type
  FROM public.dossiers d
  WHERE d.id = p_dossier_id
    AND d.sensitivity_level <= v_clearance;

  IF v_dossier_type IS NULL THEN
    RAISE EXCEPTION 'Dossier not found'
      USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.intelligence_digest (
    organization_id,
    dossier_type,
    dossier_id,
    period_start,
    period_end,
    summary,
    generated_by,
    generated_at,
    subscriber_id,
    frequency,
    published_at,
    clearance_level_at_generation,
    period
  ) VALUES (
    v_org_id,
    v_dossier_type,
    p_dossier_id,
    v_since,
    v_until,
    p_summary,
    auth.uid(),
    NOW(),
    auth.uid(),
    v_frequency,
    NOW(),
    LEAST(COALESCE(p_clearance_level_at_generation, v_clearance), v_clearance),
    v_period_key
  )
  ON CONFLICT ON CONSTRAINT intelligence_digest_subscriber_dossier_frequency_period_key
  DO NOTHING
  RETURNING id INTO v_digest_id;

  IF v_digest_id IS NULL THEN
    SELECT d.id
    INTO v_digest_id
    FROM public.intelligence_digest d
    WHERE d.subscriber_id = auth.uid()
      AND d.dossier_id = p_dossier_id
      AND d.frequency = v_frequency
      AND d.period = v_period_key
      AND d.published_at IS NOT NULL
    ORDER BY d.generated_at DESC
    LIMIT 1;
  END IF;

  RETURN v_digest_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.publish_digest(UUID, TEXT, TEXT, INTEGER) TO authenticated;

COMMENT ON FUNCTION public.publish_digest(UUID, TEXT, TEXT, INTEGER) IS
  'Phase 70: Manual HITL publish path; organization_id derives from active tenant membership so SECURITY INVOKER insert satisfies tenant RLS.';
