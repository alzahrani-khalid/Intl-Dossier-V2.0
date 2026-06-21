-- Phase 73 (Plan 01, Task 2 — RECONCILED to the LIVE briefs schema): persist_brief
-- Apply via Supabase MCP `apply_migration` to project zkrcjzdemdmwhearhfgg (staging).
-- Requirements: GENUI-03 (#2 created_by == auth.uid() must be verifiable for brief writes)
-- Locked decisions: D-02 (new INVOKER persist path), D-03 (agent proposes, frontend commits).
--
-- =============================================================================
-- WHY THIS SUPERSEDES THE ORIGINAL Task-2 SPEC
-- =============================================================================
-- The original plan + the dead `dossiers-briefs-generate` edge fn target a PRE-SWAP
-- briefs schema (a `dossier_id` uuid + two per-language jsonb body columns) that NO LONGER
-- EXISTS on staging. Live-schema verification (73-01 SUMMARY, deferred-items DEFER-73-01-A/B)
-- proved the real `briefs` table is the rich jsonb-content shape below. This migration
-- reconciles the NEW P73 persist path against that LIVE schema. NO content-column
-- migration is performed; we only ADD one additive nullable link column.
--
-- LIVE briefs NOT-NULL-no-default columns every INSERT MUST supply (verified live 2026-06-20):
--   type (varchar), target_entity (jsonb), purpose (text), audience (jsonb),
--   parameters (jsonb), content (jsonb), generation (jsonb), created_by (uuid),
--   last_modified_by (uuid), version (int default 1), tenant_id (uuid),
--   is_deleted (bool default false), status (brief_status default 'draft').
-- There is NO `dossier_id` column and NO per-language body columns. brief_status enum =
-- draft | review | approved | published.
--
-- ORG/TENANT RESOLUTION (the load-bearing reconciliation):
--   briefs RLS = 4 org-isolation policies keying on
--     organization_id = (auth.jwt() ->> 'org_id')::uuid
--   but the `org_id` JWT claim is EMPTY for all users in this deployment, so a pure
--   INVOKER insert cannot satisfy org-isolation WITH CHECK on its own, AND the dossier
--   carries no org (dossiers has only `type` + `id` — no organization_id/tenant_id).
--   The PROVEN INVOKER writer `publish_digest` (20260615_phase70_publish_digest_tenant_fix.sql
--   L31/L82/L88) resolves org via `tenant_isolation.get_current_tenant_id()` and sets
--   organization_id = tenant_id = that value (org == tenant in this model). We replicate
--   that EXACTLY: tenant_isolation.get_current_tenant_id() is SECURITY DEFINER, so it is
--   safe to call from a SECURITY INVOKER function and reads organization_members for
--   auth.uid() (NEVER service-role, NEVER the empty jwt claim).
--
-- INVARIANTS (do NOT violate):
--   * persist_brief is SECURITY INVOKER (never DEFINER, never service-role).
--   * created_by / last_modified_by are pinned to auth.uid() in the body (NOT parameters).
--   * The additive INSERT policy ORs with the 4 existing org-isolation policies; it does
--     NOT DROP or weaken them.
--   * No change to the content/target_entity/audience CHECKs or any other briefs column.

-- =============================================================================
-- 1. Additive brief -> dossier link column (the explicit link the live briefs table
--    lacks). briefs has no generic dossier column; source_dossier_id makes the
--    brief<->dossier relationship first-class (enables the GENUI deep-link AND lets the
--    new INSERT policy authorize via can_edit_dossier). Nullable + ON DELETE SET NULL so
--    it never blocks the existing manual/engagement brief writers that leave it NULL.
-- =============================================================================
ALTER TABLE public.briefs
  ADD COLUMN IF NOT EXISTS source_dossier_id UUID REFERENCES public.dossiers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_briefs_source_dossier_id
  ON public.briefs (source_dossier_id)
  WHERE source_dossier_id IS NOT NULL;

COMMENT ON COLUMN public.briefs.source_dossier_id IS
  'Phase 73 (D-02): the dossier a copilot-generated brief was drafted from. Nullable — '
  'set by persist_brief; the existing manual (engagement-briefs) + AI writers leave it NULL. '
  'Authorizes the additive briefs_insert_via_dossier_edit policy via can_edit_dossier().';

-- =============================================================================
-- 2. persist_brief — SECURITY INVOKER caller-JWT persist path (D-02)
--    Persists ONLY (the agent drafts content in 73-02; this never generates, never calls
--    the retired external LLM, never the privileged service key). The bilingual draft is
--    carried in the single live `content` jsonb as
--    { en: {summary, sections[]}, ar: {summary, sections[]} }.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.persist_brief(
  p_dossier_id UUID,
  p_content JSONB,
  p_title TEXT DEFAULT NULL,
  p_summary TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_brief_id UUID;
BEGIN
  -- Authorization floor (indistinguishable-empty): if the caller cannot edit the
  -- dossier, return NULL rather than raising — a denied write reads the same as a
  -- no-op to the caller. The additive INSERT policy below is the hard RLS gate; this
  -- short-circuit avoids surfacing a distinguishable RLS error for the deny case.
  IF NOT public.can_edit_dossier(p_dossier_id) THEN
    RETURN NULL;
  END IF;

  -- Resolve org == tenant the SAME way the proven INVOKER writer publish_digest does:
  -- tenant_isolation.get_current_tenant_id() (DEFINER, reads organization_members for
  -- auth.uid()). NEVER the empty 'org_id' JWT claim, NEVER service-role.
  v_org_id := tenant_isolation.get_current_tenant_id();
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No active organization membership for current user'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.briefs (
    type,
    target_entity,
    purpose,
    audience,
    parameters,
    content,
    generation,
    created_by,
    last_modified_by,
    version,
    tenant_id,
    organization_id,
    is_deleted,
    status,
    title,
    summary,
    source_dossier_id
  ) VALUES (
    'dossier',
    jsonb_build_object('kind', 'dossier', 'id', p_dossier_id),
    'Copilot-generated dossier brief',
    '{}'::jsonb,
    '{}'::jsonb,
    p_content,
    jsonb_build_object('source', 'copilot'),
    auth.uid(),               -- actor pinned to verified caller (GENUI-03 #2) — never a param
    auth.uid(),
    1,
    v_org_id,                 -- tenant_id == org (org-isolation model, mirrors publish_digest)
    v_org_id,                 -- organization_id == tenant (satisfies org-isolation WITH CHECK)
    false,
    'draft',                  -- brief_status default lifecycle entry
    p_title,
    p_summary,
    p_dossier_id              -- the dossier link (also authorizes the additive policy)
  )
  RETURNING id INTO v_brief_id;

  RETURN v_brief_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.persist_brief(UUID, JSONB, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION public.persist_brief(UUID, JSONB, TEXT, TEXT) IS
  'Phase 73 (D-02): SECURITY INVOKER caller-JWT brief persist. created_by pinned to '
  'auth.uid(); org/tenant via tenant_isolation.get_current_tenant_id() (== publish_digest); '
  'content jsonb carries { en:{summary,sections}, ar:{summary,sections} }. Returns NULL when '
  'the caller cannot edit the dossier (indistinguishable-empty). Caller-JWT only; no privileged '
  'service key, no external LLM call.';

-- =============================================================================
-- 3. Additive INSERT policy — authorizes the persist_brief INSERT via can_edit_dossier
--    on the new link column. ORs with the 4 existing org-isolation policies (Postgres
--    permissive policies are OR-combined); it does NOT replace or weaken them. The manual
--    /AI writers (which set organization_id from the JWT/service-role path and leave
--    source_dossier_id NULL) keep flowing through the org-isolation policies unchanged.
-- =============================================================================
DROP POLICY IF EXISTS briefs_insert_via_dossier_edit ON public.briefs;
CREATE POLICY briefs_insert_via_dossier_edit
  ON public.briefs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND source_dossier_id IS NOT NULL
    AND public.can_edit_dossier(source_dossier_id)
  );

COMMENT ON POLICY briefs_insert_via_dossier_edit ON public.briefs IS
  'Phase 73 (D-02): additive INSERT gate for copilot-generated briefs. Permits the row '
  'only when created_by = auth.uid() AND it carries a source_dossier_id the caller '
  'can_edit_dossier(). ORs with (never weakens) the 4 org-isolation INSERT policies.';
