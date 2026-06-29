-- MoU create-flow rebuild (2/3): fix the org-isolation write RLS.
--
-- The INSERT/UPDATE/DELETE policies gate on `(auth.jwt() ->> 'org_id')::uuid`, but the app's
-- JWTs carry no `org_id` claim — so the predicate is NULL and every write is blocked (0 MoUs).
-- Resolve the caller's tenant org from `profiles` instead. This preserves tenant isolation
-- (writes restricted to the caller's own org) while restoring the write path. SELECT is left
-- as-is (a permissive authenticated-read policy already governs reads).

DROP POLICY IF EXISTS mous_org_isolation_insert ON public.mous;
CREATE POLICY mous_org_isolation_insert ON public.mous
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = (SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS mous_org_isolation_update ON public.mous;
CREATE POLICY mous_org_isolation_update ON public.mous
  FOR UPDATE TO authenticated
  USING (
    organization_id = (SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS mous_org_isolation_delete ON public.mous;
CREATE POLICY mous_org_isolation_delete ON public.mous
  FOR DELETE TO authenticated
  USING (
    organization_id = (SELECT p.organization_id FROM public.profiles p WHERE p.user_id = auth.uid())
  );
