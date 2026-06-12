-- Restore positions INSERT policy (64-01, 2026-06-12)
--
-- Live-verified failure: positions-create returned 500 ("new row violates
-- row-level security policy for table positions" / PostgREST 42501) on a
-- valid admin payload, verified live 2026-06-12. The pg_policy diagnostic
-- showed the staging positions table carries ONLY positions_authenticated_read
-- (SELECT, permissive, USING true) — no INSERT policy row (polcmd = 'a')
-- exists at all. With relrowsecurity = true and no INSERT policy, Postgres
-- denies every INSERT, so nobody has ever successfully created a position.
--
-- Root cause class: live policy drift from migrations — the repo source of
-- truth (20250101011_rls_positions.sql L48-55) defines drafters_insert_positions,
-- but it is absent on staging. Same incident class as the persons
-- org-isolation drift (20260609000000).
--
-- Scope: exactly ONE INSERT policy on exactly ONE table (positions).
-- position_audience_groups and position_versions INSERTs are verified
-- working — this migration does NOT touch them, nor any SELECT/UPDATE/DELETE
-- policy. The predicate is the canonical minimal one (auth.uid() = author_id
-- AND status = 'draft') — never a blanket-true check.

DROP POLICY IF EXISTS "drafters_insert_positions" ON positions;
CREATE POLICY "drafters_insert_positions"
  ON positions
  FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND status = 'draft'
  );
