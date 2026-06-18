-- =============================================================================
-- Phase 72 — Hybrid-RAG: rag_chunks store + HNSW/GIN indexes + clearance RLS
--                        + per-source sensitivity-sync trigger
-- =============================================================================
-- AGENT-04 / AGENT-05 / D-06 / D-08.
--
-- The single net-new retrieval store for the copilot. One chunks table re-embedded
-- to bge-m3 1024-dim halfvec, hybrid (dense HNSW + sparse EN/AR tsvector), with a
-- DENORMALIZED INTEGER sensitivity_level so clearance can be enforced by a plain
-- RLS predicate on the chunk row (no per-query parent join). The hybrid_rag_search
-- RPC (separate migration) reads this table as SECURITY INVOKER so this RLS is the
-- enforcement floor on every retrieval.
--
-- AUTHORED-ONLY (this plan, 72-03). APPLIED via Supabase MCP to staging
-- zkrcjzdemdmwhearhfgg in 72-04 (Wave 3), together with the re-embed backfill.
-- The executor lacks the Supabase MCP (P69/P71 precedent) — do NOT apply here.
--
-- Source patterns (adapted, not invented):
--   * Pre-written DDL: 72-RESEARCH.md Code Examples L486-516.
--   * GENERATED tsvector + GIN: 20250930002_create_dossiers_table.sql L37-49
--     (to_tsvector('arabic',...) / to_tsvector('english',...)).
--   * Canonical clearance RLS form: 20260614_phase69_signals_extend.sql L60-65
--     and 20251022000009 — `WHERE user_id = auth.uid()`.
--
-- LANDMINE (carried-forward lock, live-verified 2026-06-18): `profiles` has NO `id`
-- column. The clearance read MUST be `WHERE user_id = auth.uid()`. Writing
-- `WHERE id = auth.uid()` does NOT error at CREATE POLICY time — `id` silently binds
-- to the OUTER table (rag_chunks.id) → NULL → blocks ALL rows for EVERY user (the
-- P69 EXEC deny-all bug). Always user_id.
--
-- CLEARANCE-SOURCE ASYMMETRY (live-verified 2026-06-18, RESEARCH L687): only
-- `dossiers` and `intelligence_event` carry their own `sensitivity_level` (both
-- INTEGER). `intelligence_signals`/`positions`/`ai_briefs`/`aa_commitments`/
-- `documents` do NOT — each chunk's denormalized sensitivity_level is resolved from
-- the OWNING dossier (for signals, the linked dossier/event). NEVER defaulted:
-- a default-low over-exposes; a NULL deny-alls. The sync trigger below maps every
-- source's clearance EXPLICITLY per source table.
--
-- dossiers.sensitivity_level is INTEGER 1/2/3 LIVE (values 1/2/3 confirmed on
-- staging 2026-06-18). The CREATE TABLE in 20250930002 L17 declares it TEXT
-- (low/medium/high) but a later migration altered it to integer — the P68
-- spec-error landmine. USE THE INTEGER DIRECTLY; no text->int CASE.
-- =============================================================================

-- pgvector 0.8.0 is live on staging (RESEARCH L683) → halfvec + HNSW + iterative
-- scans are available. Idempotent guard in case this runs on a fresh DB.
CREATE EXTENSION IF NOT EXISTS vector;

-- -----------------------------------------------------------------------------
-- 1. rag_chunks table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rag_chunks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- the 6 v1 re-embed source types (D-06). Graph relationships stay in query_graph,
  -- not RAG; deterministic digests are not chunked.
  source_type       TEXT NOT NULL CHECK (source_type IN
                      ('dossier', 'signal', 'brief', 'after_action', 'position', 'document')),
  source_id         UUID NOT NULL,
  -- the owning dossier this chunk's clearance is resolved from (NULL only for a
  -- dossier-type chunk, where source_id IS the dossier). Used by the sync trigger.
  parent_dossier_id UUID,
  chunk_index       INTEGER NOT NULL,
  content           TEXT NOT NULL,
  content_lang      TEXT NOT NULL DEFAULT 'en' CHECK (content_lang IN ('en', 'ar')),
  -- DENORMALIZED clearance (1-4 scale; profiles.clearance_level is the sole source).
  -- NOT NULL so a missing resolution can never silently over-expose; the trigger
  -- below populates it explicitly per source. CHECK 1-4 mirrors the clearance model.
  sensitivity_level INTEGER NOT NULL CHECK (sensitivity_level BETWEEN 1 AND 4),
  -- bge-m3 native 1024 dim, halfvec halves storage and keeps correct cosine geometry
  -- (the P68 1536 pad/truncate corruption is retired). AGENT-05 asserts dims=1024.
  embedding         halfvec(1024) NOT NULL,
  -- Sparse side: dual EN/AR GENERATED tsvectors (mirror the dossiers search_vector
  -- pattern). The RPC selects the column matching p_lang.
  content_tsv_en    tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED,
  content_tsv_ar    tsvector GENERATED ALWAYS AS (to_tsvector('arabic',  coalesce(content, ''))) STORED,
  organization_id   UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT rag_chunks_unique UNIQUE (source_type, source_id, chunk_index)
);

-- -----------------------------------------------------------------------------
-- 2. Indexes — dense HNSW on halfvec (cosine) + sparse GIN on both tsvectors
-- -----------------------------------------------------------------------------
-- Dense: HNSW over halfvec with cosine ops. m=16/ef_construction=64 mirrors the
-- P68 ai_embeddings HNSW (20260614000002 L46-48).
CREATE INDEX IF NOT EXISTS idx_rag_chunks_hnsw ON public.rag_chunks
  USING hnsw (embedding halfvec_cosine_ops) WITH (m = 16, ef_construction = 64);
-- Sparse: one GIN per language tsvector.
CREATE INDEX IF NOT EXISTS idx_rag_chunks_tsv_en ON public.rag_chunks USING gin (content_tsv_en);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_tsv_ar ON public.rag_chunks USING gin (content_tsv_ar);
-- Tenant + clearance composite for the RLS predicate scan.
CREATE INDEX IF NOT EXISTS idx_rag_chunks_sensitivity ON public.rag_chunks (organization_id, sensitivity_level);

-- -----------------------------------------------------------------------------
-- 3. RLS — clearance gate. The enforcement floor for hybrid_rag_search (INVOKER).
-- -----------------------------------------------------------------------------
ALTER TABLE public.rag_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rag_chunks_select_clearance ON public.rag_chunks;
-- CRITICAL: profiles.user_id = auth.uid()  (profiles has NO id column → deny-all
-- landmine). A lower-clearance caller simply matches fewer rows — denial returns a
-- plain empty result, never a labeled-redaction shape (indistinguishable-empty).
CREATE POLICY rag_chunks_select_clearance
  ON public.rag_chunks FOR SELECT TO authenticated
  USING (
    sensitivity_level <= (SELECT clearance_level FROM public.profiles WHERE user_id = auth.uid())
  );

-- Writes are the re-embed job's domain (72-04). It runs as a trusted background
-- context with explicit app-layer authz (the D-10 cron carve-out), so no
-- authenticated INSERT/UPDATE policy is granted here — the SELECT clearance gate is
-- the read floor that every retrieval path (the INVOKER RPC) inherits.

-- -----------------------------------------------------------------------------
-- 4. Per-source sensitivity-sync trigger
-- -----------------------------------------------------------------------------
-- Resolves rag_chunks.sensitivity_level from the OWNING row, per source type,
-- whenever it is left NULL on insert/update (the re-embed job may set it directly;
-- the trigger is the safety net so clearance can NEVER drift or default).
--
-- SECURITY DEFINER: the re-embed runs as a trusted background context and must read
-- parent rows (dossiers/intelligence_event) regardless of the running role's RLS to
-- resolve the correct clearance. This is the D-10 cron carve-out — the read floor on
-- rag_chunks itself (the RLS above) stays the enforcement boundary for every CALLER;
-- the trigger only POPULATES the denormalized value at write time. search_path is
-- pinned to defeat the SECURITY DEFINER search-path hijack.
CREATE OR REPLACE FUNCTION public.rag_chunks_sync_sensitivity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sensitivity INTEGER;
BEGIN
  -- If the writer already provided a resolved clearance, trust it (the re-embed job
  -- computes sensitivity in the same INSERT). Only resolve when absent.
  IF NEW.sensitivity_level IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Explicit per-source resolution. dossiers.sensitivity_level + intelligence_event
  -- .sensitivity_level are INTEGER and used DIRECTLY (no text->int CASE). All other
  -- sources resolve from the owning dossier. NEVER default.
  CASE NEW.source_type
    WHEN 'dossier' THEN
      -- source_id IS the dossier; clearance is its own integer sensitivity_level.
      SELECT d.sensitivity_level INTO v_sensitivity
      FROM public.dossiers d WHERE d.id = NEW.source_id;

    WHEN 'signal' THEN
      -- intelligence_event carries its own INTEGER sensitivity_level (use directly).
      -- Fall back to the linked dossier via the intelligence_event_dossiers junction
      -- if the event row's own level is somehow absent.
      SELECT ie.sensitivity_level INTO v_sensitivity
      FROM public.intelligence_event ie WHERE ie.id = NEW.source_id;
      IF v_sensitivity IS NULL THEN
        SELECT MAX(d.sensitivity_level) INTO v_sensitivity
        FROM public.intelligence_event_dossiers ied
        JOIN public.dossiers d ON d.id = ied.dossier_id
        WHERE ied.event_id = NEW.source_id;
      END IF;

    WHEN 'position' THEN
      -- positions have no own sensitivity → resolve from the linked dossier(s) via
      -- position_dossier_links. MAX = most-restrictive wins (deny over-share).
      SELECT MAX(d.sensitivity_level) INTO v_sensitivity
      FROM public.position_dossier_links pdl
      JOIN public.dossiers d ON d.id = pdl.dossier_id
      WHERE pdl.position_id = NEW.source_id;

    WHEN 'brief' THEN
      -- ai_briefs.dossier_id is the owning dossier.
      SELECT d.sensitivity_level INTO v_sensitivity
      FROM public.ai_briefs b
      JOIN public.dossiers d ON d.id = b.dossier_id
      WHERE b.id = NEW.source_id;

    WHEN 'after_action' THEN
      -- after-action / commitment substance: aa_commitments.dossier_id owns clearance.
      SELECT d.sensitivity_level INTO v_sensitivity
      FROM public.aa_commitments c
      JOIN public.dossiers d ON d.id = c.dossier_id
      WHERE c.id = NEW.source_id;

    WHEN 'document' THEN
      -- documents resolve clearance from parent_dossier_id (the re-embed sets it from
      -- the document's owning dossier; the documents->dossier link column is verified
      -- live in 72-04 since the corpus is empty on staging today). NEVER default.
      IF NEW.parent_dossier_id IS NOT NULL THEN
        SELECT d.sensitivity_level INTO v_sensitivity
        FROM public.dossiers d WHERE d.id = NEW.parent_dossier_id;
      END IF;

    ELSE
      v_sensitivity := NULL;  -- unknown source → fail closed (NOT NULL raises below)
  END CASE;

  -- A second resolution path for any source: if the writer supplied parent_dossier_id
  -- and per-source resolution still came up empty, use the parent dossier.
  IF v_sensitivity IS NULL AND NEW.parent_dossier_id IS NOT NULL THEN
    SELECT d.sensitivity_level INTO v_sensitivity
    FROM public.dossiers d WHERE d.id = NEW.parent_dossier_id;
  END IF;

  -- Fail closed: never default. NOT NULL on the column raises if resolution failed,
  -- which surfaces the bad row to the re-embed job rather than silently over-exposing
  -- (default-low) or silently hiding (NULL). The job must supply a resolvable parent.
  NEW.sensitivity_level := v_sensitivity;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.rag_chunks_sync_sensitivity() IS
  'Phase 72: resolves rag_chunks.sensitivity_level from the owning row per source_type
   (dossier/intelligence_event use their own INTEGER level directly; signal/position/
   brief/after_action/document resolve from the owning dossier, most-restrictive wins).
   NEVER defaults — NOT NULL fails closed if unresolved. SECURITY DEFINER (D-10 cron
   carve-out) so the re-embed can read parent clearance; the rag_chunks SELECT RLS
   stays the enforcement floor for every caller.';

DROP TRIGGER IF EXISTS trg_rag_chunks_sync_sensitivity ON public.rag_chunks;
CREATE TRIGGER trg_rag_chunks_sync_sensitivity
  BEFORE INSERT OR UPDATE OF source_type, source_id, parent_dossier_id, sensitivity_level
  ON public.rag_chunks
  FOR EACH ROW
  EXECUTE FUNCTION public.rag_chunks_sync_sensitivity();

COMMENT ON TABLE public.rag_chunks IS
  'Phase 72: single hybrid-RAG chunks store (AGENT-04/05, D-06). bge-m3 halfvec(1024)
   dense + dual EN/AR tsvector sparse; denormalized INTEGER sensitivity_level gated by
   clearance RLS (profiles.user_id = auth.uid()). Queried only via hybrid_rag_search
   (SECURITY INVOKER) so this RLS is the retrieval floor. Re-embed corpus: dossiers,
   signals, briefs, after-action, positions, documents/OCR.';
