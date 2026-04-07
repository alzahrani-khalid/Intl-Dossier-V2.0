-- Phase 17 Plan 03: check_first_run() RPC
-- See .planning/phases/17-seed-data-first-run/17-SCHEMA-RECONCILIATION.md §7
-- Canonical tables (no work_items, no elected_officials).

CREATE OR REPLACE FUNCTION public.check_first_run()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_is_empty BOOLEAN := true;
  v_can_seed BOOLEAN := false;
BEGIN
  -- Short-circuit emptiness probe (EXISTS + LIMIT 1 = O(1) per table)
  IF EXISTS (SELECT 1 FROM dossiers LIMIT 1) THEN v_is_empty := false;
  ELSIF EXISTS (SELECT 1 FROM countries LIMIT 1) THEN v_is_empty := false;
  ELSIF EXISTS (SELECT 1 FROM organizations LIMIT 1) THEN v_is_empty := false;
  ELSIF EXISTS (SELECT 1 FROM forums LIMIT 1) THEN v_is_empty := false;
  ELSIF EXISTS (SELECT 1 FROM engagements LIMIT 1) THEN v_is_empty := false;
  ELSIF EXISTS (SELECT 1 FROM working_groups LIMIT 1) THEN v_is_empty := false;
  ELSIF EXISTS (SELECT 1 FROM persons LIMIT 1) THEN v_is_empty := false;
  ELSIF EXISTS (SELECT 1 FROM topics LIMIT 1) THEN v_is_empty := false;
  ELSIF EXISTS (SELECT 1 FROM tasks LIMIT 1) THEN v_is_empty := false;
  END IF;

  -- Strict admin check (matches Plan 17-02 admin definition)
  IF v_caller IS NOT NULL AND v_is_empty THEN
    SELECT EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = v_caller
        AND role IN ('admin','super_admin')
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > now())
    ) INTO v_can_seed;
  END IF;

  RETURN jsonb_build_object(
    'is_empty', v_is_empty,
    'can_seed', v_can_seed
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_first_run() TO authenticated;

COMMENT ON FUNCTION public.check_first_run() IS
  'Phase 17 first-run detection. Returns is_empty (DB-wide across canonical tables: dossiers, countries, organizations, forums, engagements, working_groups, persons, topics, tasks) + can_seed (caller is admin AND db is empty).';
