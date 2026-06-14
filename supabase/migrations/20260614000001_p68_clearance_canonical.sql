-- P68 / REMED-01: Single canonical clearance scale.
--
-- Rewrites get_user_clearance_level() to read the per-user canonical
-- profiles.clearance_level (1-4 scale) instead of the role-derived 1-3 mapping,
-- and backfills profiles.clearance_level from the role mapping without
-- downgrading any manually-set value.
--
-- Live staging facts (plan 68-01 A1-A6): profiles distribution L1=388, L3=5.
-- Six RLS policies call this function (work_item_dossiers_select/insert and the
-- four view_wg_*_by_dossier_access policies); the signature is preserved so all
-- six keep working unchanged.

-- Step 1: Backfill profiles.clearance_level from the role-derived mapping.
-- GUARD: WHERE p.clearance_level = 1 is LOAD-BEARING — it never downgrades the
-- 5 profiles already manually set to level 3. Mapping: admin/manager -> 3,
-- analyst -> 2, everything else -> 1.
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

-- Step 2: Compat shim — read profiles.clearance_level (canonical 1-4 scale).
-- Kept as a definer + stable read of profiles (not a user-content table),
-- mirroring the prior helper's posture. Only new retrieval RPCs go invoker
-- (D-05/D-08); this helper intentionally does not.
-- COALESCE wraps the SUBQUERY (not the column): a missing profiles row yields an
-- empty set -> NULL -> 1, matching the prior plpgsql `COALESCE(clearance, 1)`
-- contract. A bare `SELECT COALESCE(col,1) ... WHERE` returns NULL when no row
-- matches, which would make every RLS `sensitivity_level <= NULL` deny-all.
CREATE OR REPLACE FUNCTION get_user_clearance_level(user_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(
    (SELECT p.clearance_level
     FROM profiles p
     WHERE p.user_id = get_user_clearance_level.user_id),
    1
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_user_clearance_level(UUID) IS
  'P68 compat shim: reads profiles.clearance_level (1-4 scale). '
  'Prior impl read user_roles (1-3 scale). '
  'All existing RLS policies that call this function keep working unchanged.';
