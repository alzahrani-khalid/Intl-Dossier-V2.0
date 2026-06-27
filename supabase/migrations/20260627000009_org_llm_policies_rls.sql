-- =============================================================================
-- N7 fix — org-scoped RLS for organization_llm_policies (AI settings)
-- =============================================================================
-- Finding N7 (MED, cross-tenant data exposure): the AI settings admin page
-- (frontend/src/routes/_protected/admin/ai-settings.tsx) reads and upserts
-- `organization_llm_policies` under the caller's JWT. The frontend previously
-- keyed those queries on the CLIENT-WRITABLE `user_metadata.organization_id`
-- (spoofable via supabase.auth.updateUser), so the database is the only place
-- tenant isolation can be trusted. The frontend has been moved to a
-- server-trusted org source (public.users.default_organization_id); this
-- migration makes the DB enforce the caller's REAL org independently, so a
-- tampered client value can never read or write another org's policy row.
--
-- RLS is ALREADY enabled on this table by 20251205000005_ai_observability_rls.sql,
-- which created the SELECT ("Members can view org LLM policy") and UPDATE
-- ("Admins can update org LLM policy") policies plus a service_role ALL policy.
-- It did NOT create an INSERT policy, so the frontend `.upsert()` of a
-- first-time (not-yet-existing) policy row is blocked by RLS default-deny.
--
-- This migration:
--   1. (idempotently) ensures RLS is enabled,
--   2. ADDS the missing INSERT policy (the actual gap), scoped to admin/owner
--      membership of the row's REAL org,
--   3. idempotently RE-ASSERTS the SELECT and UPDATE policies under the same
--      canonical names + organization_members-membership expression, so this
--      file is a self-contained, auditable statement of the N7-required
--      SELECT / INSERT / UPDATE triad. All three derive the caller's org from a
--      SERVER-TRUSTED source (organization_members), mirroring the policies the
--      table already carries. The pre-existing service_role ALL policy is left
--      untouched.
--
-- Org-derivation assumption (FLAGGED for review): a member's tenant is their
-- active row in public.organization_members (left_at IS NULL); writes
-- additionally require role IN ('admin','owner'). This mirrors the canonical
-- pattern already used by 20251205000005_ai_observability_rls.sql on THIS exact
-- table. It also assumes a user's public.users.default_organization_id (the
-- server-trusted value the frontend now reads) corresponds to an org they are an
-- active member of — the same assumption the signals domain hooks rely on.
-- =============================================================================

ALTER TABLE organization_llm_policies ENABLE ROW LEVEL SECURITY;

-- SELECT: any active member of the row's org may view its LLM policy.
DROP POLICY IF EXISTS "Members can view org LLM policy" ON organization_llm_policies;
CREATE POLICY "Members can view org LLM policy"
ON organization_llm_policies FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_llm_policies.organization_id
      AND om.user_id = auth.uid()
      AND om.left_at IS NULL
  )
);

-- INSERT (NEW — closes the N7 gap): only an admin/owner of the row's REAL org
-- may create that org's LLM policy. Scopes the upsert's first-insert path to the
-- caller's true tenant regardless of any client-supplied organization_id.
DROP POLICY IF EXISTS "Admins can insert org LLM policy" ON organization_llm_policies;
CREATE POLICY "Admins can insert org LLM policy"
ON organization_llm_policies FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_llm_policies.organization_id
      AND om.user_id = auth.uid()
      AND om.left_at IS NULL
      AND om.role IN ('admin', 'owner')
  )
);

-- UPDATE: only an admin/owner of the row's org may change its LLM policy. The
-- explicit WITH CHECK (equal to USING) also blocks re-homing a row to another
-- org and covers the upsert's ON CONFLICT DO UPDATE path.
DROP POLICY IF EXISTS "Admins can update org LLM policy" ON organization_llm_policies;
CREATE POLICY "Admins can update org LLM policy"
ON organization_llm_policies FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_llm_policies.organization_id
      AND om.user_id = auth.uid()
      AND om.left_at IS NULL
      AND om.role IN ('admin', 'owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_llm_policies.organization_id
      AND om.user_id = auth.uid()
      AND om.left_at IS NULL
      AND om.role IN ('admin', 'owner')
  )
);
