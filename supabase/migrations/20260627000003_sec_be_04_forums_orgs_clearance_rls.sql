-- SEC-BE-04 (HIGH) — forums + organizations full-CRUD USING(true) RLS bypass.
--
-- 20260206180000_fix_forums_rls_policy.sql and
-- 20260127000001_organization_extension_enhancements.sql replaced the prior
-- clearance-gated CRUD on these dossier-extension tables with USING(true) /
-- WITH CHECK(true), on the false premise that "access control is enforced at the
-- dossiers table level". A direct PostgREST DELETE/UPDATE/SELECT on forums /
-- organizations consults THIS table's RLS only — never the parent dossiers row —
-- so any authenticated user could read, modify, or delete any forum/organization
-- extension regardless of the parent dossier's sensitivity_level.
--
-- Fix: gate every command on the parent dossier's clearance, matching the base
-- dossiers table's own policies (forums.id / organizations.id are the dossiers.id
-- FK/PK). The base dossiers INSERT/UPDATE policies are clearance-only (no
-- ownership requirement), so we deliberately mirror clearance-only here too —
-- adding an ownership predicate would be STRICTER than the parent table and would
-- regress the dossier-creation wizard (which writes the dossier then its
-- extension as the same user within clearance). DELETE is also clearance-gated
-- (was USING(true)); routine deletion still cascades from dossiers.

-- ---------------------------------------------------------------------------
-- forums
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "forums_select_authenticated" ON forums;
CREATE POLICY "forums_select_authenticated"
  ON forums
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = forums.id
        AND d.sensitivity_level <= public.get_user_clearance_level(auth.uid())
    )
  );

DROP POLICY IF EXISTS "forums_insert_authenticated" ON forums;
CREATE POLICY "forums_insert_authenticated"
  ON forums
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = forums.id
        AND d.sensitivity_level <= public.get_user_clearance_level(auth.uid())
    )
  );

DROP POLICY IF EXISTS "forums_update_authenticated" ON forums;
CREATE POLICY "forums_update_authenticated"
  ON forums
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = forums.id
        AND d.sensitivity_level <= public.get_user_clearance_level(auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = forums.id
        AND d.sensitivity_level <= public.get_user_clearance_level(auth.uid())
    )
  );

DROP POLICY IF EXISTS "forums_delete_authenticated" ON forums;
CREATE POLICY "forums_delete_authenticated"
  ON forums
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = forums.id
        AND d.sensitivity_level <= public.get_user_clearance_level(auth.uid())
    )
  );

COMMENT ON TABLE forums IS 'Extension table for forum-specific data. RLS gates every command on the parent dossier clearance (get_user_clearance_level >= dossiers.sensitivity_level).';

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "organizations_select_authenticated" ON organizations;
CREATE POLICY "organizations_select_authenticated"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = organizations.id
        AND d.sensitivity_level <= public.get_user_clearance_level(auth.uid())
    )
  );

DROP POLICY IF EXISTS "organizations_insert_authenticated" ON organizations;
CREATE POLICY "organizations_insert_authenticated"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = organizations.id
        AND d.sensitivity_level <= public.get_user_clearance_level(auth.uid())
    )
  );

DROP POLICY IF EXISTS "organizations_update_authenticated" ON organizations;
CREATE POLICY "organizations_update_authenticated"
  ON organizations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = organizations.id
        AND d.sensitivity_level <= public.get_user_clearance_level(auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = organizations.id
        AND d.sensitivity_level <= public.get_user_clearance_level(auth.uid())
    )
  );

DROP POLICY IF EXISTS "organizations_delete_authenticated" ON organizations;
CREATE POLICY "organizations_delete_authenticated"
  ON organizations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = organizations.id
        AND d.sensitivity_level <= public.get_user_clearance_level(auth.uid())
    )
  );
