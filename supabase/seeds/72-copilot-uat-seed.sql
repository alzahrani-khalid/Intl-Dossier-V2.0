-- =============================================================================
-- Phase 72-09 — Copilot live-UAT seed (AGENT-03 clearance-reduction + AGENT-05
-- dimension proofs). seed -> observe -> RESTORE. AUTHORED-ONLY in this plan.
-- =============================================================================
--
-- WHY THIS FILE EXISTS
--   signals / events / briefs / documents are 0 rows on staging
--   (zkrcjzdemdmwhearhfgg, live-probed 2026-06-18; RESEARCH §A2). The two
--   phase-gate proofs that need gated content cannot run against an empty corpus:
--     * AGENT-03 — an L1 account must get STRICTLY FEWER copilot results than L3,
--                  with ZERO above-clearance content. That requires at least one
--                  signal an L1 user MUST NOT see (sensitivity_level 3) and at
--                  least one an L1 user MUST see (sensitivity_level 1).
--     * AGENT-05 — `vector_dims(embedding) = 1024` for every rag_chunks row. The
--                  seeded signals add rows the re-embed lands at 1024-dim.
--   This seed inserts that minimal multi-clearance set, linked to an EXISTING
--   dossier in the SAME tenant as the test users so per-source sensitivity sync
--   resolves and tenant-isolation RLS does not hide the rows from both accounts.
--
-- APPLY / RESTORE OWNERSHIP (NOT this executor):
--   The executor that authored this file has NO Supabase MCP (P69/P71 precedent)
--   and there is NO GPU here, so it does NOT apply this seed, does NOT re-run the
--   re-embed, and does NOT run the live proofs. The 72-09 orchestrator applies
--   SECTION 1 (this seed) via the Supabase MCP, re-runs the re-embed at the
--   deploy gate, runs the proofs, then applies SECTION 2 (RESTORE) to return
--   staging to its pre-UAT state. Run order is in 72-UAT.md.
--
-- IDEMPOTENT: SECTION 1 deletes its own recorded rows first, then re-inserts —
-- safe to run repeatedly. SECTION 2 deletes the same recorded rows (+ any
-- rag_chunks rows they produced). Both key off the fixed UUIDs recorded below.
--
-- COLUMN / TENANCY CONTRACT (verified against live migrations + seed/060, NOT
-- invented):
--   intelligence_event  — 20260516000002 (base: organization_id NOT NULL FK to
--     organizations, source_type signal_source_type NOT NULL, content NOT NULL,
--     occurred_at NOT NULL, severity default 'medium', created_by nullable)
--     + 20260614_phase69_signals_extend (title NOT NULL default '',
--       sensitivity_level INTEGER NOT NULL default 1 CHECK 1-4, status NOT NULL
--       default 'new', category CHECK political/economic/security/diplomatic/other,
--       ai_confidence NUMERIC(3,2)).
--   intelligence_event_dossiers — 20260516000003 (event_id FK, dossier_type
--     CHECK 7 canonical types, dossier_id FK). NO organization_id (RLS is
--     parent-derived: gates on the parent event's organization_id).
--   source_type enum values: publication | feed | human_entered | ai_generated.
--   TENANCY: dossiers have NO organization_id column (verified — seed/060 never
--     sets it; resolves org via tenant_isolation.resolve_user_tenant(user_id)).
--     We do the same so the seeded events land in the TEST USERS' tenant; both
--     L1 and L3 belong to that tenant, so clearance (not tenancy) is the only
--     axis that differs in the proof.
--   dossiers.sensitivity_level is INTEGER live (seed/060 inserts 2/3 directly) —
--     the CREATE-TABLE TEXT declaration is the stale P68 spec-error landmine.
--
-- NO HARD-CODED IDs FOR EXISTING ROWS except the documented test-user UUID
-- (carried from seed/060; the orchestrator confirms/overrides it). The org and
-- the anchor dossier are resolved at apply time. Only the SEEDED event ids are
-- fixed (so RESTORE is exact).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- RECORDED SEED IDS (the exact rows this file creates — used by RESTORE).
--   L1 event (an L1 user MUST see):     72090000-0000-0000-0000-000000000001
--   L1 event #2 (non-trivial L1 set):   72090000-0000-0000-0000-000000000002
--   L3 event (an L1 user MUST NOT see): 72090000-0000-0000-0000-000000000003
-- Junction rows cascade off the event FK; rag_chunks rows are deleted by
-- source_type='signal' AND source_id = these ids.
-- -----------------------------------------------------------------------------

-- =============================================================================
-- SECTION 1 — SEED (apply via Supabase MCP; re-run safe)
-- =============================================================================
DO $$
DECLARE
  -- Test user whose tenant owns the seeded events. Carried from seed/060
  -- (kazahrani@stats.gov.sa). The proof's L1 and L3 accounts MUST be in this
  -- same tenant. Orchestrator: confirm this is the test users' tenant owner, or
  -- replace with the L3 account's user_id before applying.
  v_user_id   UUID := 'de2734cf-f962-4e05-bf62-bc9e92efff96';

  v_org_id     UUID;
  v_dossier_id UUID;
  v_dossier_type TEXT;

  v_e_l1a UUID := '72090000-0000-0000-0000-000000000001';
  v_e_l1b UUID := '72090000-0000-0000-0000-000000000002';
  v_e_l3  UUID := '72090000-0000-0000-0000-000000000003';
BEGIN
  -- Resolve the test users' tenant the same way the app + seed/060 do.
  SELECT tenant_isolation.resolve_user_tenant(v_user_id) INTO v_org_id;
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION
      'UAT seed requires an organization membership for user % (resolve_user_tenant returned NULL). Confirm the test user / tenant before applying.',
      v_user_id;
  END IF;

  -- Anchor dossier: any dossier of a junction-accepted canonical type. (dossiers
  -- carry no organization_id, so tenant cannot be matched here; the junction RLS
  -- is parent-derived off the event's org, which IS tenant-correct above.)
  -- Prefer the seed/060 demo-tenant dossier if present so the copilot's
  -- per-dossier query has a populated anchor; else fall back to the oldest
  -- canonical dossier.
  SELECT d.id, d.type INTO v_dossier_id, v_dossier_type
  FROM public.dossiers d
  WHERE d.type IN ('country','organization','forum','engagement',
                   'topic','working_group','person')
  ORDER BY (d.id = 'b0000000-0000-0000-0000-00000000aaaa'::uuid) DESC,
           d.created_at ASC, d.id ASC
  LIMIT 1;
  IF v_dossier_id IS NULL THEN
    RAISE EXCEPTION
      'UAT seed requires at least one dossier of a canonical type to anchor signals; none found.';
  END IF;

  -- Idempotency: clear any prior run of THIS seed first (junction children
  -- cascade off the event FK; rag_chunks cleared explicitly in case a prior
  -- re-embed already produced chunks for these ids).
  DELETE FROM public.rag_chunks
   WHERE source_type = 'signal' AND source_id IN (v_e_l1a, v_e_l1b, v_e_l3);
  DELETE FROM public.intelligence_event
   WHERE id IN (v_e_l1a, v_e_l1b, v_e_l3);

  -- Insert the 3 events: two at sensitivity_level 1 (L1 must see), one at
  -- sensitivity_level 3 (L1 must NOT see). created_by NULL (seed data; SELECT RLS
  -- keys on tenant + clearance, not created_by). Same topical tokens so a single
  -- query surfaces all three for L3 but only the two L1 rows for L1.
  INSERT INTO public.intelligence_event
    (id, organization_id, source_type, content, occurred_at, severity,
     title, sensitivity_level, status, category, ai_confidence, created_by)
  VALUES
    (v_e_l1a, v_org_id, 'human_entered'::public.signal_source_type,
     '[UAT-72-09 SEED — L1] Routine public liaison note linked to the anchor dossier. Cleared for level 1. This sentence carries enough English tokens for the bge-m3 re-embed and the hybrid_rag_search lexical lane to return it for an L1 caller.',
     now() - interval '1 hour', 'low',
     '[UAT-72-09] Public liaison note', 1, 'new', 'diplomatic', NULL, NULL),
    (v_e_l1b, v_org_id, 'human_entered'::public.signal_source_type,
     '[UAT-72-09 SEED — L1] Second level-1 economic readout on the anchor dossier so the L1 result set is non-trivial (more than one row) and the L1-subset-of-L3 comparison is meaningful.',
     now() - interval '2 hours', 'medium',
     '[UAT-72-09] Public economic readout', 1, 'new', 'economic', NULL, NULL),
    (v_e_l3, v_org_id, 'human_entered'::public.signal_source_type,
     '[UAT-72-09 SEED — L3] Sensitive security assessment on the anchor dossier. Cleared for level 3 ONLY. An L1 caller MUST NOT see this row or any chunk of it — its absence from the L1 result is the AGENT-03 proof. Same topical tokens as the L1 rows so a shared query would surface it for L3 but be silently dropped for L1.',
     now() - interval '3 hours', 'high',
     '[UAT-72-09] Restricted security assessment', 3, 'new', 'security', NULL, NULL);

  -- Link every seeded event to the anchor dossier. The events carry their own
  -- INTEGER sensitivity_level which the rag_chunks sync trigger uses directly;
  -- the junction is the trigger's fallback resolution path + the per-dossier
  -- query path. dossier_type mirrors the anchor's real live type.
  INSERT INTO public.intelligence_event_dossiers (event_id, dossier_type, dossier_id)
  VALUES
    (v_e_l1a, v_dossier_type, v_dossier_id),
    (v_e_l1b, v_dossier_type, v_dossier_id),
    (v_e_l3,  v_dossier_type, v_dossier_id);

  RAISE NOTICE 'UAT seed applied: org=% dossier=% (type=%); events L1=2, L3=1.',
    v_org_id, v_dossier_id, v_dossier_type;
END$$;

-- VERIFY the seed landed (orchestrator runs via MCP, informational):
--   SELECT id, title, sensitivity_level, status FROM public.intelligence_event
--    WHERE id::text LIKE '72090000-%' ORDER BY sensitivity_level;
--   -- EXPECT: 3 rows, sensitivity_level {1,1,3}
--   SELECT count(*) FROM public.intelligence_event_dossiers
--    WHERE event_id::text LIKE '72090000-%';
--   -- EXPECT: 3 junction rows
-- After this commits, the orchestrator runs (at the deploy gate, on the GPU
-- host): the re-embed backfill (backend/src/jobs/reembed-rag-chunks.ts) so these
-- 3 seeded signals land in rag_chunks at 1024-dim, then the proofs. Post-embed:
--   SELECT count(*) FROM public.rag_chunks
--    WHERE source_type='signal' AND source_id::text LIKE '72090000-%';
--   -- EXPECT: >= 3 chunk rows, all vector_dims(embedding)=1024


-- =============================================================================
-- SECTION 2 — RESTORE (apply via Supabase MCP AFTER the proofs pass)
-- Returns staging to its pre-UAT state. Deletes the seeded events (junction rows
-- cascade off the event FK) and any rag_chunks rows the re-embed produced.
-- Idempotent: safe to run even if SECTION 1 was never applied.
-- =============================================================================
-- DO $$
-- DECLARE
--   v_e_l1a UUID := '72090000-0000-0000-0000-000000000001';
--   v_e_l1b UUID := '72090000-0000-0000-0000-000000000002';
--   v_e_l3  UUID := '72090000-0000-0000-0000-000000000003';
-- BEGIN
--   DELETE FROM public.rag_chunks
--    WHERE source_type = 'signal' AND source_id IN (v_e_l1a, v_e_l1b, v_e_l3);
--   DELETE FROM public.intelligence_event
--    WHERE id IN (v_e_l1a, v_e_l1b, v_e_l3);
--   RAISE NOTICE 'UAT seed restored: seeded events + their rag_chunks removed.';
-- END$$;
--
-- -- Confirm clean (EXPECT both counts = 0):
-- --   SELECT count(*) FROM public.intelligence_event WHERE id::text LIKE '72090000-%';
-- --   SELECT count(*) FROM public.rag_chunks
-- --    WHERE source_type='signal' AND source_id::text LIKE '72090000-%';
