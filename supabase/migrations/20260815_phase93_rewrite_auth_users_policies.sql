-- Phase 93 / DR-42501 / RULING-P93-01 (+ ADDENDUM 2, decision D-24)
--
-- WHAT THIS FIXES
-- Four RLS policies in schema public evaluate an EXISTS subquery against the
-- auth.users table. No client role may read that table, so the predicate raises
-- 42501 (insufficient_privilege) BEFORE it compares anything. On
-- data_retention_policies that surfaces four layers up as the edge function
-- data-retention returning 500 "Failed to fetch policies" (D-09: the filed
-- diagnosis blamed the handler's users/role read at index.ts:112 — that call
-- discards its error and cannot 500 anything; the policy is the real seam).
--
-- Each predicate is replaced with public.is_platform_admin(auth.uid()) — the
-- project's unified authz read (20260627000001_sec_helper_is_platform_admin.sql):
-- STABLE SECURITY DEFINER, search_path pinned, granted to authenticated, reads
-- public.users.role = 'admin' OR an active public.user_roles admin grant. Being
-- SECURITY DEFINER it sidesteps public.users' own RLS, so no 42P17 recursion
-- question arises. Measured at plan time: public.users.role holds 1 admin while
-- public.user_roles holds 7 active admin grants — the helper is what keeps the
-- other 6 from being locked out by this migration.
--
-- The raw_user_meta_data / raw_app_meta_data reads are DELETED, not preserved
-- alongside the new predicate (D-10). Any session can set its own metadata via
-- auth.updateUser({ data }), so a metadata-derived role is self-granted and is
-- not an access-control input.
--
-- ===================================================================
-- REFUSED, PERMANENTLY: GRANT SELECT ON auth.users TO authenticated;
-- ===================================================================
-- Every 42501 this defect produces ends with Postgres's own hint:
--   HINT: Grant the required privileges to the current role with:
--   GRANT SELECT ON auth.users TO authenticated;
-- Taking that hint is an exploit, not a fix. Fifteen policies over thirteen
-- tables reach auth.users; eight of them gate on the user-writable metadata
-- role. They are harmless today ONLY because they fail closed — SELECT on
-- auth.users is granted to exactly one grantee (postgres, which owns the tables
-- and is not subject to their RLS), so no role is simultaneously subject to
-- these policies and able to evaluate them. Granting SELECT to authenticated
-- makes all eight live at once, converting them into a self-service admin
-- privilege escalation: six are read/write, and one is reachable by anon.
-- The refusal is enforced by a standing repository guard (D-12/D-23): no file
-- under supabase/migrations or backend/migrations may contain an uncommented
-- GRANT SELECT on auth.users. This block is a comment and does not trip it.
--
-- SCOPE — DELIBERATELY NOT WIDENED
-- Exactly the four policies this phase's acceptance criteria exercise. The
-- residual eleven (legal_holds among them) are RLS-AUTHUSERS-01, Phase 100.
-- /admin/data-retention's legal-holds region STILL errors after this migration.
-- That is BY DESIGN. Widening this file "to make the page fully green" breaks
-- the ruling's scope.

-- 1/4 — data_retention_policies (FOR ALL: USING + WITH CHECK)
--       Matches the handler's own gate (userRecord?.role === 'admin').
DROP POLICY IF EXISTS "Admin can manage retention policies" ON public.data_retention_policies;
CREATE POLICY "Admin can manage retention policies"
  ON public.data_retention_policies FOR ALL
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- 2/4 — tag_categories UPDATE: creator OR admin.
--       The replaced arm was a role-less tautology; "admins" per the policy
--       name is restored, not invented.
DROP POLICY IF EXISTS "Tag creators or admins can update" ON public.tag_categories;
CREATE POLICY "Tag creators or admins can update"
  ON public.tag_categories FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.is_platform_admin(auth.uid()));

-- 3/4 — tag_categories DELETE: non-system tags only, creator OR admin.
DROP POLICY IF EXISTS "Only non-system tags can be deleted by creators" ON public.tag_categories;
CREATE POLICY "Only non-system tags can be deleted by creators"
  ON public.tag_categories FOR DELETE TO authenticated
  USING (is_system = FALSE AND (created_by = auth.uid() OR public.is_platform_admin(auth.uid())));

-- 4/4 — entity_tag_assignments DELETE: assigner OR admin.
DROP POLICY IF EXISTS "Authenticated users can remove tag assignments" ON public.entity_tag_assignments;
CREATE POLICY "Authenticated users can remove tag assignments"
  ON public.entity_tag_assignments FOR DELETE TO authenticated
  USING (assigned_by = auth.uid() OR public.is_platform_admin(auth.uid()));
