-- SEC-BE-01 (CRITICAL) — DB-sourced admin helper for RLS.
--
-- Replaces the self-settable `auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'`
-- admin gating used by several RLS policies (positions, approvals, attachments/
-- consistency tables, entity_preview_layouts). `user_metadata` is writable by the
-- user themselves via `auth.updateUser({ data: { role: 'admin' } })`, so any
-- authenticated user could self-promote. This helper resolves admin status from
-- server-controlled DB tables only.
--
-- WHY BOTH ROLE STORES: live staging has the two canonical role stores out of
-- sync — `public.users.role = 'admin'` for 1 user, but `public.user_roles` holds
-- 7 active admin rows (only 1 overlaps). The project's unified-auth convention is
-- `public.users.role`, while RLS-era helpers (is_admin/get_user_clearance_level)
-- key off `public.user_roles`. Gating on a single store would strip admin from
-- real admins, so this helper treats a user as admin if EITHER store says so.
-- This is purely additive vs. the existing `is_admin(uuid)` (user_roles only),
-- which is left untouched to avoid changing its ~32 unrelated policy usages.
--
-- SECURITY DEFINER so the policy can read the role tables regardless of the
-- caller's grants; search_path is locked to prevent resolution hijacking.

CREATE OR REPLACE FUNCTION public.is_platform_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = uid AND u.role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = uid
      AND ur.role = 'admin'
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
  );
$$;

COMMENT ON FUNCTION public.is_platform_admin(uuid) IS
  'SEC-BE-01: DB-sourced admin check for RLS. True when the user is admin in '
  'public.users.role OR holds an active public.user_roles admin row. Never reads '
  'self-settable auth.jwt user_metadata. SECURITY DEFINER, locked search_path.';

GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid) TO authenticated;
