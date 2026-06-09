-- Fix: the persons list returned 0 rows for everyone.
-- The SELECT RLS policy required organization_id = jwt.org_id, but every person
-- row has organization_id = NULL (and the JWT org_id claim is empty), so the
-- comparison was NULL/false for all rows and the list came back empty. Person
-- *details* still worked only because get_person_full() is SECURITY DEFINER and
-- bypasses RLS, while search_persons_advanced() (the list source) is INVOKER.
--
-- This policy set was applied ad-hoc and was not present in any prior migration;
-- this migration version-controls the SELECT policy and lets NULL-org
-- (global/shared) persons be visible to all authenticated users, while keeping
-- org isolation intact for org-assigned persons.
--
-- NOTE: the sibling persons_org_isolation_{insert,update,delete} policies carry
-- the same NULL-blocking pattern. They are intentionally left unchanged here
-- (person mutations route through SECURITY DEFINER RPCs); revisit only if direct
-- authenticated-role table writes become a requirement.

DROP POLICY IF EXISTS persons_org_isolation_select ON public.persons;

CREATE POLICY persons_org_isolation_select
  ON public.persons
  FOR SELECT
  TO authenticated
  USING (
    organization_id IS NULL
    OR organization_id = ((auth.jwt() ->> 'org_id'::text))::uuid
  );
