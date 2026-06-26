-- SEC-BE-11 (MEDIUM) — compliance tables blanket USING/WITH CHECK(true).
--
-- 20260114200001_compliance_rules_infrastructure.sql left several compliance
-- policies fully open:
--   * compliance_signoffs_select   USING (true)        -> read who signed off/waived.
--   * compliance_exemptions_select USING (true)        -> read who is exempt.
--   * compliance_violations_insert WITH CHECK (true)   -> forge violations.
--   * compliance_checks_insert     WITH CHECK (true)   -> forge check-log rows
--     (on table compliance_checks_log).
-- (compliance_violations_select/update and compliance_checks_select are already
-- party-scoped and are left untouched. Their `(auth.jwt() ->> 'role') IN
-- ('admin','compliance_officer','supervisor')` branch is effectively inert — the
-- top-level JWT `role` claim is the Postgres role ('authenticated'), and no
-- 'compliance_officer' role exists in public.users.role or user_roles — so
-- scoping the open policies below to parties + a real DB-sourced admin check does
-- not remove any access that currently works.)
--
-- Reads -> relevant parties (+ DB-sourced admin). Forgeable inserts -> attributed
-- to self (+ admin); the compliance engine writes via service_role, which bypasses
-- RLS entirely.

-- Signoffs: signer, parties on the related violation, or admin.
DROP POLICY IF EXISTS "compliance_signoffs_select" ON compliance_signoffs;
CREATE POLICY "compliance_signoffs_select"
  ON compliance_signoffs
  FOR SELECT
  TO authenticated
  USING (
    signed_by = auth.uid()
    OR public.is_platform_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM compliance_violations v
      WHERE v.id = compliance_signoffs.violation_id
        AND (
          v.detected_by = auth.uid()
          OR v.acknowledged_by = auth.uid()
          OR v.resolved_by = auth.uid()
        )
    )
  );

-- Exemptions: the exempted user, the grantor/revoker, or admin.
DROP POLICY IF EXISTS "compliance_exemptions_select" ON compliance_exemptions;
CREATE POLICY "compliance_exemptions_select"
  ON compliance_exemptions
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR granted_by = auth.uid()
    OR revoked_by = auth.uid()
    OR public.is_platform_admin(auth.uid())
  );

-- Violations: a user may only insert a violation attributed to themselves; admins
-- exempt; the engine inserts via service_role.
DROP POLICY IF EXISTS "compliance_violations_insert" ON compliance_violations;
CREATE POLICY "compliance_violations_insert"
  ON compliance_violations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    detected_by = auth.uid()
    OR public.is_platform_admin(auth.uid())
  );

-- compliance_checks_log: only act if present (absent on live staging; guarded so
-- this migration is a no-op there and corrective on a fresh replay).
DO $$
BEGIN
  IF to_regclass('public.compliance_checks_log') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "compliance_checks_insert" ON public.compliance_checks_log';
    EXECUTE $p$
      CREATE POLICY "compliance_checks_insert" ON public.compliance_checks_log
        FOR INSERT TO authenticated
        WITH CHECK (checked_by = auth.uid() OR public.is_platform_admin(auth.uid()))
    $p$;
  END IF;
END $$;
