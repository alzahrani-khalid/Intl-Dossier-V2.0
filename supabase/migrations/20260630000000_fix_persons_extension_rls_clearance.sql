-- Persons extension RLS: align to the dossier-extension clearance pattern.
--
-- The persons_org_isolation_* policies gated SELECT/INSERT/UPDATE/DELETE on
--   persons.organization_id = (auth.jwt() ->> 'org_id')::uuid
-- but persons.organization_id is a FK to organizations(id) — the person's
-- AFFILIATED (employer) org, e.g. a key contact who works at ONS — NOT a tenant
-- key. The app's JWTs also carry no org_id claim, so the predicate evaluated to
-- NULL and every write was blocked (42501 new row violates RLS), while SELECT
-- hid all foreign-org contacts. That made it impossible to record key contacts
-- at partner organizations — the core purpose of the system.
--
-- Fix: replace the org-isolation policies with the canonical dossier-extension
-- pattern already used by `organizations` and `forums` — gate on the PARENT
-- dossier's clearance via get_user_clearance_level(). Preserves clearance-based
-- security; restores the contact create/read path for any affiliated org.

DROP POLICY IF EXISTS persons_org_isolation_select ON public.persons;
DROP POLICY IF EXISTS persons_org_isolation_insert ON public.persons;
DROP POLICY IF EXISTS persons_org_isolation_update ON public.persons;
DROP POLICY IF EXISTS persons_org_isolation_delete ON public.persons;

DROP POLICY IF EXISTS persons_select_authenticated ON public.persons;
CREATE POLICY persons_select_authenticated ON public.persons
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.dossiers d
    WHERE d.id = persons.id
      AND d.sensitivity_level <= get_user_clearance_level(auth.uid())
  ));

DROP POLICY IF EXISTS persons_insert_authenticated ON public.persons;
CREATE POLICY persons_insert_authenticated ON public.persons
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.dossiers d
    WHERE d.id = persons.id
      AND d.sensitivity_level <= get_user_clearance_level(auth.uid())
  ));

DROP POLICY IF EXISTS persons_update_authenticated ON public.persons;
CREATE POLICY persons_update_authenticated ON public.persons
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.dossiers d
    WHERE d.id = persons.id
      AND d.sensitivity_level <= get_user_clearance_level(auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.dossiers d
    WHERE d.id = persons.id
      AND d.sensitivity_level <= get_user_clearance_level(auth.uid())
  ));

DROP POLICY IF EXISTS persons_delete_authenticated ON public.persons;
CREATE POLICY persons_delete_authenticated ON public.persons
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.dossiers d
    WHERE d.id = persons.id
      AND d.sensitivity_level <= get_user_clearance_level(auth.uid())
  ));
