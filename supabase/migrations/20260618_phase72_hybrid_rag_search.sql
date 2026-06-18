-- =============================================================================
-- Phase 72 — Hybrid-RAG: hybrid_rag_search SECURITY INVOKER RPC (RRF k=60)
-- =============================================================================
-- AGENT-04. The single retrieval path over rag_chunks. Fuses a dense (HNSW halfvec
-- cosine) and a sparse (EN/AR tsvector) candidate set by Reciprocal Rank Fusion
-- (k=60). SECURITY INVOKER so the rag_chunks clearance RLS (profiles.user_id =
-- auth.uid()) runs INSIDE both CTEs under the caller's JWT — RLS-before-return. The
-- tool-layer cross-encoder reranker (TEI bge-reranker-v2-m3) therefore only ever
-- sees RLS-passing candidates; the reranker cannot enforce clearance, so the DB must.
--
-- AUTHORED-ONLY (this plan, 72-03). APPLIED via Supabase MCP to staging
-- zkrcjzdemdmwhearhfgg in 72-04 (Wave 3). The executor lacks the Supabase MCP
-- (P69/P71 precedent) — do NOT apply here.
--
-- Source patterns (adapted, not invented):
--   * Pre-written RPC: 72-RESEARCH.md Code Examples L524-565.
--   * INVOKER vector-RPC analog: 20260614000002_p68_search_invoker_rpc.sql L16-38
--     (SECURITY INVOKER, embedding <=> p_query_embedding, get_function_security helper).
--   * REVOKE/GRANT + indistinguishable-empty footer: 20260617_phase71_query_graph.sql
--     L298-306.
--
-- INDISTINGUISHABLE-EMPTY (P71 GRAPH-03 lock, MEMORY): the RETURNS columns carry NO
-- clearance/filtered/restricted field — not as a column name, not in a JSON key, not
-- in surfaced comments. The result is content rows only; "no data" and "above the
-- caller's clearance" return the SAME empty shape. A lower-clearance caller must not
-- learn that above-clearance content exists. (sensitivity_level IS returned so the
-- AGENT-03 invoker proof can assert no row exceeds the caller's clearance — that token
-- is the clearance scale value, not a forbidden redaction-label substring.)
--
-- ITERATIVE-SCAN NOTE (tool layer, pgvector 0.8): before calling this RPC the tool
-- SETs LOCAL hnsw.iterative_scan='relaxed_order' and hnsw.max_scan_tuples so the RLS
-- post-filter inside the dense CTE does not collapse recall. That is a session GUC set
-- by the caller, not part of this STABLE function.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.hybrid_rag_search(
  p_query_embedding halfvec(1024),
  p_query_text      TEXT,
  p_lang            TEXT DEFAULT 'en',   -- selects content_tsv_en|ar + the tsquery config
  p_limit           INT  DEFAULT 50      -- candidates handed to the tool-layer reranker
)
RETURNS TABLE (
  chunk_id          UUID,
  source_type       TEXT,
  source_id         UUID,
  content           TEXT,
  sensitivity_level INT,
  rrf_score         FLOAT
)
LANGUAGE sql
SECURITY INVOKER     -- CRITICAL: never DEFINER — v7.0 cross-cutting guarantee.
STABLE               -- RLS on rag_chunks applies under the caller JWT in both CTEs.
AS $$
  WITH dense AS (
    -- Dense vector neighbours (cosine). RLS on rag_chunks applies here (caller JWT),
    -- so only RLS-passing rows enter the ranking. LIMIT 2x to give RRF headroom.
    SELECT id, source_type, source_id, content, sensitivity_level,
           ROW_NUMBER() OVER (ORDER BY embedding <=> p_query_embedding) AS rank
    FROM public.rag_chunks
    ORDER BY embedding <=> p_query_embedding
    LIMIT (p_limit * 2)
  ),
  sparse AS (
    -- Sparse full-text neighbours. p_lang switches BOTH the GENERATED tsvector column
    -- (content_tsv_ar|en) AND the websearch_to_tsquery config (arabic|english). RLS
    -- applies here too.
    SELECT id, source_type, source_id, content, sensitivity_level,
           ROW_NUMBER() OVER (
             ORDER BY ts_rank_cd(
               CASE WHEN p_lang = 'ar' THEN content_tsv_ar ELSE content_tsv_en END,
               websearch_to_tsquery(CASE WHEN p_lang = 'ar' THEN 'arabic' ELSE 'english' END, p_query_text)
             ) DESC
           ) AS rank
    FROM public.rag_chunks
    WHERE (CASE WHEN p_lang = 'ar' THEN content_tsv_ar ELSE content_tsv_en END)
          @@ websearch_to_tsquery(CASE WHEN p_lang = 'ar' THEN 'arabic' ELSE 'english' END, p_query_text)
    ORDER BY ts_rank_cd(
               CASE WHEN p_lang = 'ar' THEN content_tsv_ar ELSE content_tsv_en END,
               websearch_to_tsquery(CASE WHEN p_lang = 'ar' THEN 'arabic' ELSE 'english' END, p_query_text)
             ) DESC
    LIMIT (p_limit * 2)
  )
  -- RRF fusion: score = 1/(k + dense_rank) + 1/(k + sparse_rank), k = 60. FULL OUTER
  -- JOIN so a row found by only one side still scores. COALESCE the row fields across
  -- both sides.
  SELECT COALESCE(d.id, s.id)                                   AS chunk_id,
         COALESCE(d.source_type, s.source_type)                 AS source_type,
         COALESCE(d.source_id, s.source_id)                     AS source_id,
         COALESCE(d.content, s.content)                         AS content,
         COALESCE(d.sensitivity_level, s.sensitivity_level)     AS sensitivity_level,
         (COALESCE(1.0 / (60 + d.rank), 0) + COALESCE(1.0 / (60 + s.rank), 0))::float AS rrf_score
  FROM dense d
  FULL OUTER JOIN sparse s ON d.id = s.id
  ORDER BY rrf_score DESC
  LIMIT p_limit;
$$;

-- Least-privilege grant: only authenticated callers. anon/PUBLIC REVOKEd so the
-- retrieval path is never reachable without a JWT (mirrors query_graph L298-299).
REVOKE EXECUTE ON FUNCTION public.hybrid_rag_search(halfvec, TEXT, TEXT, INT) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.hybrid_rag_search(halfvec, TEXT, TEXT, INT) TO authenticated;

COMMENT ON FUNCTION public.hybrid_rag_search(halfvec, TEXT, TEXT, INT) IS
  'Phase 72 AGENT-04: hybrid retrieval over rag_chunks. SECURITY INVOKER (NEVER
   DEFINER) — the rag_chunks clearance RLS runs inside both the dense (HNSW) and
   sparse (EN/AR tsvector) CTEs under the caller JWT, so the tool-layer reranker only
   sees RLS-passing rows (RLS-before-rerank). Fuses dense+sparse by RRF k=60 over a
   FULL OUTER JOIN. Returns content rows only — no redaction-label field; "no data"
   and "above the caller clearance" return the same empty shape. anon REVOKEd;
   authenticated GRANTed.';
