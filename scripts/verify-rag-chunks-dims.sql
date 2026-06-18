-- =============================================================================
-- Wave-0 DB schema-proof script (Plan 72-01) — AGENT-05 + AGENT-04.
--
-- Run against staging (zkrcjzdemdmwhearhfgg) via the Supabase MCP / SQL editor AFTER
-- the re-embed (Wave 3, Plan 72-03) and the hybrid_rag_search RPC (Wave 3) land. These
-- are the two phase-gate DB proofs from 72-VALIDATION.md; they are RED until their
-- implementing waves turn them GREEN.
--
-- Reuses the P68 get_function_security() helper (20260614000002_p68_search_invoker_rpc.sql).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PROOF 1 — AGENT-05: every rag_chunks row is embedded at bge-m3 1024-dim.
-- No dimension drift, no pad/truncate. The count MUST be 0.
-- (vector_dims() works on both vector and halfvec.)
-- -----------------------------------------------------------------------------
SELECT
  count(*) AS rows_failing_dimension_check
FROM public.rag_chunks
WHERE vector_dims(embedding) <> 1024;
-- EXPECT: rows_failing_dimension_check = 0

-- Companion coverage signal (informational): total chunk rows + distinct dims seen.
SELECT
  count(*)                              AS total_chunk_rows,
  count(DISTINCT vector_dims(embedding)) AS distinct_dims,
  min(vector_dims(embedding))           AS min_dim,
  max(vector_dims(embedding))           AS max_dim
FROM public.rag_chunks;
-- EXPECT: distinct_dims = 1, min_dim = max_dim = 1024 (once re-embed has run)

-- -----------------------------------------------------------------------------
-- PROOF 2 — AGENT-04: hybrid_rag_search is SECURITY INVOKER (NOT DEFINER).
-- prosecdef = false means INVOKER → RLS runs under the caller's JWT, so clearance
-- is enforced on every retrieval. DEFINER would bypass the clearance floor (the
-- v7.0 cross-cutting guarantee forbids it).
-- -----------------------------------------------------------------------------
SELECT
  proname,
  prosecdef
FROM pg_proc
WHERE proname = 'hybrid_rag_search'
  AND pronamespace = 'public'::regnamespace;
-- EXPECT: prosecdef = false (one row)

-- Same proof via the P68 reusable helper (PostgREST-callable; mirrors the P68/P71 test path).
SELECT * FROM public.get_function_security('hybrid_rag_search');
-- EXPECT: prosecdef = false

-- -----------------------------------------------------------------------------
-- PROOF 3 — AGENT-04 (RLS form): rag_chunks has a clearance RLS policy that uses
-- profiles.user_id = auth.uid() (NOT id — profiles has NO id column; `id` would bind
-- to the outer table → NULL → deny-all. Carried P69/P71 landmine).
-- -----------------------------------------------------------------------------
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'rag_chunks';
-- EXPECT: at least one SELECT policy whose `qual` contains
--   "sensitivity_level <= ( SELECT ... FROM profiles WHERE user_id = auth.uid() )"
-- and DOES NOT contain "WHERE id = auth.uid()".

-- Belt-and-suspenders: assert RLS is actually enabled on the table.
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'rag_chunks'
  AND relnamespace = 'public'::regnamespace;
-- EXPECT: relrowsecurity = true
